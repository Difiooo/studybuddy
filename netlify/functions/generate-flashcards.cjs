/* netlify/functions/generate-flashcards.cjs */

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

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return respond(500, {
      error:
        "Server is missing GEMINI_API_KEY. Set it in Netlify environment variables.",
    });
  }

  const prompt = `
You are a study assistant that converts study notes into useful flashcards.

Create 5 to 8 flashcards that test understanding of the important concepts.

Rules:
- Focus on concepts and understanding, not exact sentence recall.
- Each flashcard must have one clear question and one clear answer.
- Keep questions and answers concise.
- Use only information supported by the supplied notes.
- Return only the requested JSON structure.

Study notes:

${notes}
`;

  let geminiRes;

  try {
    geminiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },

        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],

          generationConfig: {
            responseMimeType: "application/json",

            responseSchema: {
              type: "object",

              properties: {
                flashcards: {
                  type: "array",

                  items: {
                    type: "object",

                    properties: {
                      question: {
                        type: "string",
                      },

                      answer: {
                        type: "string",
                      },
                    },

                    required: [
                      "question",
                      "answer",
                    ],
                  },
                },
              },

              required: [
                "flashcards",
              ],
            },
          },
        }),
      }
    );
  } catch (error) {
    console.error(
      "Gemini connection error:",
      error
    );

    return respond(502, {
      error:
        "Couldn't reach the AI provider. Please try again in a moment.",
    });
  }

  if (!geminiRes.ok) {
    const status = geminiRes.status;

    let providerMessage = "";

    try {
      const errorData = await geminiRes.json();

      providerMessage =
        errorData?.error?.message || "";
    } catch {
      providerMessage = "";
    }

    console.error(
      "Gemini API error:",
      status,
      providerMessage
    );

    if (status === 400) {
      return respond(502, {
        error: providerMessage
          ? `Gemini rejected the request: ${providerMessage}`
          : "Gemini rejected the request.",
      });
    }

    if (status === 401 || status === 403) {
      return respond(502, {
        error:
          "The Gemini API key was rejected. Check GEMINI_API_KEY in Netlify.",
      });
    }

    if (status === 429) {
      return respond(429, {
        error:
          "Gemini rate limit reached — wait a moment and retry.",
      });
    }

    return respond(502, {
      error: providerMessage
        ? `Gemini API error: ${providerMessage}`
        : `Gemini returned an error (${status}).`,
    });
  }

  let data;

  try {
    data = await geminiRes.json();
  } catch {
    return respond(502, {
      error:
        "Gemini returned an unreadable response.",
    });
  }

  const rawText =
    data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

  if (!rawText) {
    return respond(502, {
      error:
        "Gemini returned an empty response. Please try again.",
    });
  }

  let parsed;

  try {
    parsed = JSON.parse(rawText);
  } catch (error) {
    console.error(
      "Invalid JSON from Gemini:",
      rawText
    );

    return respond(502, {
      error:
        "Gemini's response wasn't in the expected format. Please try again.",
    });
  }

  if (
    !Array.isArray(parsed?.flashcards) ||
    parsed.flashcards.length === 0
  ) {
    return respond(502, {
      error:
        "Gemini didn't return any flashcards. Please try again.",
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
        "Gemini's flashcards were malformed. Please try again.",
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