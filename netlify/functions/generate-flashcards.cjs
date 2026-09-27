// netlify/functions/generate-flashcards.js
//
// Takes raw study notes and returns structured flashcards via the Claude API.
// This is the one place in the app that talks to the model — everything
// upstream (validation, prompt construction) and downstream (response
// validation, error shaping) lives here so the frontend never has to trust
// the model's output blindly.

const MAX_NOTES_LENGTH = 8000;
const MIN_NOTES_LENGTH = 20;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return respond(405, { error: "Method not allowed" });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return respond(400, { error: "Malformed request body." });
  }

  const notes = typeof body.notes === "string" ? body.notes.trim() : "";

  if (notes.length < MIN_NOTES_LENGTH) {
    return respond(400, {
      error: `Notes are too short — paste at least ${MIN_NOTES_LENGTH} characters so there's something to work with.`,
    });
  }
  if (notes.length > MAX_NOTES_LENGTH) {
    return respond(400, {
      error: `Notes are too long (max ${MAX_NOTES_LENGTH} characters). Try a shorter excerpt.`,
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Fails safely and explains itself instead of a bare 500 — a future dev
    // (or you, in six months) sees exactly what's missing.
    return respond(500, {
      error: "Server is missing ANTHROPIC_API_KEY. Set it in Netlify env vars.",
    });
  }

  const systemPrompt = `You turn study notes into flashcards. Read the notes and produce
5 to 8 flashcards that test understanding of the key concepts (not just
recall of exact phrases). Return ONLY valid JSON, no prose, no markdown
fences, matching exactly this shape:
{"flashcards": [{"question": "string", "answer": "string"}, ...]}`;

  let anthropicRes;
  try {
    anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 1200,
        system: systemPrompt,
        messages: [{ role: "user", content: notes }],
      }),
    });
  } catch {
    return respond(502, {
      error: "Couldn't reach the AI provider. Please try again in a moment.",
    });
  }

  if (!anthropicRes.ok) {
    const status = anthropicRes.status;
    // Distinguish rate limiting from other failures so the frontend can
    // show a more useful message than a generic error.
    if (status === 429) {
      return respond(429, { error: "Rate limited — wait a moment and retry." });
    }
    return respond(502, { error: `AI provider returned an error (${status}).` });
  }

  let data;
  try {
    data = await anthropicRes.json();
  } catch {
    return respond(502, { error: "AI provider returned an unreadable response." });
  }

  const rawText = data?.content?.find((b) => b.type === "text")?.text ?? "";

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    // The model didn't follow the structured-output contract. Fail safely
    // rather than showing garbage or a raw JSON parse error to the user.
    return respond(502, {
      error: "The AI's response wasn't in the expected format. Please try again.",
    });
  }

  if (!Array.isArray(parsed?.flashcards) || parsed.flashcards.length === 0) {
    return respond(502, {
      error: "The AI didn't return any flashcards. Please try again.",
    });
  }

  const flashcards = parsed.flashcards
    .filter(
      (c) =>
        c &&
        typeof c.question === "string" &&
        typeof c.answer === "string" &&
        c.question.trim() &&
        c.answer.trim()
    )
    .map((c) => ({ question: c.question.trim(), answer: c.answer.trim() }));

  if (flashcards.length === 0) {
    return respond(502, {
      error: "The AI's flashcards were malformed. Please try again.",
    });
  }

  return respond(200, { flashcards });
};

function respond(statusCode, bodyObj) {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(bodyObj),
  };
}
