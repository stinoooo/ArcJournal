const path = require('path');
const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const { version } = require('./package.json');

const icons = path.join(__dirname, 'assets', 'icons');

module.exports = {
  packagerConfig: {
    name: 'ArcJournal',
    executableName: 'arcjournal',
    appBundleId: 'dev.arcnode.arcjournal',
    appCategoryType: 'public.app-category.lifestyle',
    appCopyright: 'Copyright Arcnode',
    icon: path.join(icons, 'icon'),
    asar: true,
    // Only what the app runs: Electron code and the built UI.
    ignore: (file) => {
      if (!file) return false;
      if (file.endsWith('.test.js')) return true;
      // Tool caches (such as the MongoDB binary used by the server tests).
      if (file.startsWith('/node_modules/.cache')) return true;
      return !/^\/(electron|client$|client\/dist|package\.json$|node_modules)/.test(file);
    },
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'arcjournal',
        authors: 'Arcnode',
        description: 'Private, end-to-end encrypted journaling',
        setupIcon: path.join(icons, 'icon.ico'),
        iconUrl: 'https://raw.githubusercontent.com/stinoooo/ArcJournal/main/assets/icons/icon.ico',
        setupExe: `ArcJournal-${version}-Setup.exe`,
      },
    },
    {
      name: '@electron-forge/maker-dmg',
      platforms: ['darwin'],
      config: { name: `ArcJournal-${version}`, icon: path.join(icons, 'icon.icns'), format: 'ULFO' },
    },
    { name: '@electron-forge/maker-zip', platforms: ['darwin', 'linux'] },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          name: 'arcjournal',
          productName: 'ArcJournal',
          genericName: 'Journal',
          categories: ['Office', 'Utility'],
          icon: path.join(icons, '512x512.png'),
          homepage: 'https://arcnode.dev/projects/arcjournal',
          maintainer: 'Arcnode <info@arcnode.dev>',
        },
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          name: 'arcjournal',
          productName: 'ArcJournal',
          genericName: 'Journal',
          categories: ['Office', 'Utility'],
          icon: path.join(icons, '512x512.png'),
          homepage: 'https://arcnode.dev/projects/arcjournal',
          license: 'MIT',
        },
      },
    },
  ],
  plugins: [
    // Turn off Electron features ArcJournal never uses, so a local attacker
    // cannot run the app as plain Node or load code from outside its asar.
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
      // The UI loads from app://, not file://.
      [FuseV1Options.GrantFileProtocolExtraPrivileges]: false,
    }),
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: { owner: 'stinoooo', name: 'ArcJournal' },
        prerelease: false,
        // Releases start as drafts; publishing one makes it the update for everyone.
        draft: true,
        tagPrefix: 'v',
      },
    },
  ],
};
