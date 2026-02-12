const OpenAI = require('openai');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are ArcJournal's AI assistant. Analyze journal entries and produce a weekly summary.
You MUST respond with ONLY valid JSON — no markdown, no preamble, no explanation.

IMPORTANT: The app uses named emotions, NOT unicode emoji. The valid emotion names are:
happy, loved, confident, playful, embarrassed, sad, scared, angry

The JSON must have exactly these fields:
{
  "weekStart": "YYYY-MM-DD",
  "weekEnd": "YYYY-MM-DD",
  "averageGrade": <number 1-10, one decimal>,
  "trend": "improving" | "declining" | "stable",
  "topEmojis": ["emotionName1", "emotionName2", ...],
  "highlights": ["highlight 1", "highlight 2", ..., "highlight 6"],
  "recap": "A warm, insightful 3-4 sentence paragraph summarizing the week."
}

topEmojis must only contain valid emotion names from the list above, ordered by frequency.`;

async function generateWrapSummary(entries, weekStart, weekEnd) {
  const entriesText = entries
    .map(
      (e) =>
        `Date: ${e.date}\nTitle: ${e.title || 'Untitled'}\nGrade: ${e.grade}/10\nEmoji: ${e.emoji}\nContent: ${e.content}`
    )
    .join('\n\n---\n\n');

  const userPrompt = `Generate a weekly summary for the week of ${weekStart} to ${weekEnd}.
Here are the journal entries:

${entriesText}`;

  let response;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 800,
      });

      const raw = completion.choices[0].message.content.trim();
      const parsed = JSON.parse(raw);

      // Validate required fields
      const required = ['weekStart', 'weekEnd', 'averageGrade', 'trend', 'topEmojis', 'highlights', 'recap'];
      for (const field of required) {
        if (!(field in parsed)) throw new Error(`Missing field: ${field}`);
      }

      return parsed;
    } catch (err) {
      if (attempt === 2) throw new Error(`OpenAI response validation failed: ${err.message}`);
    }
  }
}

module.exports = { generateWrapSummary };
