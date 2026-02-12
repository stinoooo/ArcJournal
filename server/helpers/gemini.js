const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_INSTRUCTION = `You are ArcJournal's AI assistant that produces weekly journal summaries.
You MUST respond with ONLY valid JSON — absolutely no markdown fences, no preamble, no explanation, nothing outside the JSON object.

The app uses 8 named emotions (NOT unicode emoji). Valid emotion names are:
happy, loved, confident, playful, embarrassed, sad, scared, angry

Your response must be a single JSON object with exactly these fields:
{
  "weekStart": "YYYY-MM-DD",
  "weekEnd": "YYYY-MM-DD",
  "averageGrade": <number 1–10, one decimal place>,
  "trend": "improving" | "declining" | "stable",
  "topEmojis": ["emotionName1", "emotionName2"],
  "highlights": ["highlight 1", "highlight 2", "highlight 3", "highlight 4", "highlight 5", "highlight 6"],
  "recap": "A warm, insightful 3–4 sentence paragraph summarizing the week."
}

Rules:
- topEmojis must only contain valid emotion names from the list, ordered by frequency in the entries
- averageGrade must be the mathematical mean of all entry grades, rounded to 1 decimal
- trend must reflect whether grades improved, declined, or stayed stable across the week
- highlights must be 3–6 concise bullet points drawn from actual entry content
- recap must be 3–4 sentences, warm in tone, referencing specific themes from the entries`;

async function generateWrapSummary(entries, weekStart, weekEnd) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json', // Force JSON output mode
    },
  });

  const entriesText = entries
    .map(
      (e) =>
        `Date: ${e.date}
Title: ${e.title || 'Untitled'}
Grade: ${e.grade}/10
Emotion: ${e.emoji}
Content: ${e.content || '(no content written)'}`
    )
    .join('\n\n---\n\n');

  const prompt = `Generate a weekly ArcWrapped summary for the week of ${weekStart} to ${weekEnd}.

Journal entries for this week:

${entriesText}

Respond with only a JSON object following the schema in your instructions.`;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const raw = result.response.text().trim();

      // Strip any accidental markdown fences
      const cleaned = raw
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const parsed = JSON.parse(cleaned);

      // Validate required fields
      const required = ['weekStart', 'weekEnd', 'averageGrade', 'trend', 'topEmojis', 'highlights', 'recap'];
      for (const field of required) {
        if (!(field in parsed)) throw new Error(`Missing required field: ${field}`);
      }

      // Sanitise topEmojis — only allow valid emotion names
      const validEmotions = new Set(['happy', 'loved', 'confident', 'playful', 'embarrassed', 'sad', 'scared', 'angry']);
      parsed.topEmojis = (parsed.topEmojis || []).filter((e) => validEmotions.has(e));

      return parsed;
    } catch (err) {
      console.error(`Gemini attempt ${attempt} failed:`, err.message);
      if (attempt === 2) {
        throw new Error(`ArcWrapped generation failed after 2 attempts: ${err.message}`);
      }
      // Brief pause before retry
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

module.exports = { generateWrapSummary };
