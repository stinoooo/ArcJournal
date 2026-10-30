// Launches the built app, waits for the first screen and checks it rendered
// without errors. Needs `npm run build` first. Usage: node tools/smoke.mjs [executable]
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const exe = process.argv[2] || require('electron');
const args = process.argv[2] ? [] : ['.'];
const port = 9333;

const child = spawn(exe, [...args, `--remote-debugging-port=${port}`], {
  cwd: new URL('..', import.meta.url),
  env: { ...process.env, NODE_ENV: 'production', ELECTRON_ENABLE_LOGGING: '1' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let log = '';
child.stdout.on('data', (d) => { log += d; });
child.stderr.on('data', (d) => { log += d; });

function evaluate(ws, expression) {
  return new Promise((resolve) => {
    const id = Math.floor(Math.random() * 1e9);
    const onMessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === id) { ws.removeEventListener('message', onMessage); resolve(msg.result?.result?.value); }
    };
    ws.addEventListener('message', onMessage);
    ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression, returnByValue: true } }));
  });
}

let ok = false;
try {
  let page;
  for (let i = 0; i < 40 && !page; i++) {
    await sleep(500);
    try {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      page = targets.find((t) => t.type === 'page');
    } catch { /* not up yet */ }
  }
  if (!page) throw new Error('No window appeared');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let text = '';
  for (let i = 0; i < 30 && !/Sign in with Arcnode|Unlock|Lock your journal/.test(text); i++) {
    await sleep(500);
    text = (await evaluate(ws, 'document.body.innerText')) || '';
  }
  const info = await evaluate(ws, `JSON.stringify({
    url: location.href,
    csp: document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content || null,
    bridge: Object.keys(window.electronAPI || {}),
    node: typeof require,
    font: getComputedStyle(document.body).fontFamily,
  })`);
  console.log(info);
  console.log(text.slice(0, 400));
  ok = /Sign in with Arcnode/.test(text) && JSON.parse(info).node === 'undefined';
  ws.close();
} catch (err) {
  console.error(err.message);
} finally {
  child.kill();
}
const errors = log.split('\n').filter((l) => /Uncaught|ERR_|Refused|Error/i.test(l) && !/GPU|gpu_|DevTools|Autofill/.test(l));
if (errors.length) console.log('Console:\n' + errors.slice(0, 20).join('\n'));
console.log(ok ? 'SMOKE OK' : 'SMOKE FAILED');
process.exit(ok ? 0 : 1);
