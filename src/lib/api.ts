export interface Flashcard {
  question: string;
  answer: string;
}

export class FlashcardApiError extends Error {}

/**
 * Calls the Netlify function that generates flashcards from notes via the
 * Claude API. This is the single network boundary the frontend touches —
 * every test mocks this, never the real endpoint.
 */
export async function generateFlashcards(notes: string): Promise<Flashcard[]> {
  const res = await fetch("/.netlify/functions/generate-flashcards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes }),
  });

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new FlashcardApiError("The server sent back something unreadable.");
  }

  if (!res.ok) {
    const message =
      body && typeof body === "object" && "error" in body
        ? String((body as { error: unknown }).error)
        : "Something went wrong generating flashcards.";
    throw new FlashcardApiError(message);
  }

  const flashcards = (body as { flashcards?: unknown }).flashcards;
  if (!Array.isArray(flashcards)) {
    throw new FlashcardApiError("The server response was missing flashcards.");
  }

  return flashcards as Flashcard[];
}
