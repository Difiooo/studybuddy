import { useState, type FormEvent } from "react";
import { generateFlashcards, FlashcardApiError, type Flashcard } from "../lib/api";
import { FlashcardList } from "./FlashcardList";

const MIN_LENGTH = 20;
const MAX_LENGTH = 8000;

type Status = "idle" | "loading" | "error" | "success";

export function NotesForm() {
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = notes.trim();

    if (trimmed.length < MIN_LENGTH) {
      setStatus("error");
      setError(
        `Paste at least ${MIN_LENGTH} characters of notes — there's not enough here to make flashcards from.`
      );
      return;
    }
    if (trimmed.length > MAX_LENGTH) {
      setStatus("error");
      setError(`That's too long (max ${MAX_LENGTH} characters). Try a shorter excerpt.`);
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      const cards = await generateFlashcards(trimmed);
      setFlashcards(cards);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof FlashcardApiError
          ? err.message
          : "Something went wrong. Please try again."
      );
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} aria-label="Generate flashcards from notes">
        <label htmlFor="notes-input">Paste your notes</label>
        <textarea
          id="notes-input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={10}
          aria-describedby={error ? "notes-error" : undefined}
          aria-invalid={status === "error"}
        />
        <button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Generating…" : "Generate flashcards"}
        </button>
      </form>

      {status === "loading" && (
        <p role="status" aria-live="polite">
          Generating flashcards…
        </p>
      )}

      {status === "error" && error && (
        <p role="alert" id="notes-error">
          {error}
        </p>
      )}

      {status === "success" && flashcards.length > 0 && (
        <>
          <p role="status" aria-live="polite">
            {flashcards.length} flashcards ready.
          </p>
          <FlashcardList flashcards={flashcards} />
        </>
      )}
    </div>
  );
}
