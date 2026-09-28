/* netlify/functions/generate-flashcards.cjs */

/*
  Takes raw study notes and returns structured flashcards via the Claude API.

  This is the one place in the app that talks to the model.
  Validation, prompt construction, response validation, and error
  handling all happen here.
*/

const MAX_NOTES_LENGTH = 8000;
const MIN_NOTES_LENGTH = 20;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return respond(405, {
      error: "Method not allowed",
    });
  }

  let body;

  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return respond(400, {
      error: "Malformed request body.",
    });
  }

  const notes =
    typeof body.notes === "string"
      ? body.notes.trim()
      : "";

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
    return respond(500, {
      error:
        "Server is missing ANTHROPIC_API_KEY. Set it in Netlify env vars.",
    });
  }

  const systemPrompt = `
You are a study assistant that converts study notes into useful flashcards.

Create 5 to 8 flashcards that test understanding of the important concepts.

Rules:
- Focus on concepts and understanding, not exact sentence recall.
- Each flashcard must have one clear question and one clear answer.
- Keep questions and answers concise.
- Return ONLY valid JSON.
- Do not use markdown.
- Do not include any explanation outside the JSON.

Return exactly this structure:

{
  "flashcards": [
    {
      "question": "string",
      "answer": "string"
    }
  ]
}
`;

  let anthropicRes;

  try {
    anthropicRes = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",

        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },

        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1200,

          system: systemPrompt,

          messages: [
            {
              role: "user",
              content: notes,
            },
          ],
        }),
      }
    );
  } catch (error) {
    console.error("Anthropic connection error:", error);

    return respond(502, {
      error:
        "Couldn't reach the AI provider. Please try again in a moment.",
    });
  }

  if (!anthropicRes.ok) {
    const status = anthropicRes.status;

    let providerMessage = "";

    try {
      const errorData = await anthropicRes.json();

      providerMessage =
        errorData?.error?.message || "";
    } catch {
      providerMessage = "";
    }

    console.error(
      "Anthropic API error:",
      status,
      providerMessage
    );

    if (status === 401) {
      return respond(502, {
        error:
          "The AI service rejected the API key. Check the ANTHROPIC_API_KEY in Netlify.",
      });
    }

    if (status === 429) {
      return respond(429, {
        error:
          "Rate limited — wait a moment and retry.",
      });
    }

    return respond(502, {
      error: providerMessage
        ? `AI provider error: ${providerMessage}`
        : `AI provider returned an error (${status}).`,
    });
  }

  let data;

  try {
    data = await anthropicRes.json();
  } catch {
    return respond(502, {
      error:
        "AI provider returned an unreadable response.",
    });
  }

  const rawText =
    data?.content?.find(
      (block) => block.type === "text"
    )?.text || "";

  if (!rawText) {
    return respond(502, {
      error:
        "The AI returned an empty response. Please try again.",
    });
  }

  let parsed;

  try {
    parsed = JSON.parse(rawText);
  } catch (error) {
    console.error(
      "Invalid JSON from Claude:",
      rawText
    );

    return respond(502, {
      error:
        "The AI's response wasn't in the expected format. Please try again.",
    });
  }

  if (
    !Array.isArray(parsed?.flashcards) ||
    parsed.flashcards.length === 0
  ) {
    return respond(502, {
      error:
        "The AI didn't return any flashcards. Please try again.",
    });
  }

  const flashcards = parsed.flashcards
    .filter(
      (card) =>
        card &&
        typeof card.question === "string" &&
        typeof card.answer === "string" &&
        card.question.trim() &&
        card.answer.trim()
    )
    .map((card) => ({
      question: card.question.trim(),
      answer: card.answer.trim(),
    }));

  if (flashcards.length === 0) {
    return respond(502, {
      error:
        "The AI's flashcards were malformed. Please try again.",
    });
  }

  return respond(200, {
    flashcards,
  });
};

function respond(statusCode, bodyObj) {
  return {
    statusCode,

    headers: {
      "content-type": "application/json",
    },

    body: JSON.stringify(bodyObj),
  };
}