import type { Flashcard as FlashcardData } from "../lib/api";

interface FlashcardListProps {
  flashcards: FlashcardData[];
}

/**
 * Renders each flashcard as a native <details>/<summary> disclosure.
 * This is a deliberate accessibility choice: native disclosure widgets
 * are keyboard-operable (Enter/Space to toggle, Tab to move between them)
 * and announced correctly by screen readers with zero custom ARIA needed —
 * unlike a custom "flip card" built from styled <div>s.
 */
export function FlashcardList({ flashcards }: FlashcardListProps) {
  return (
    <ol aria-label="Generated flashcards" className="flashcard-list">
      {flashcards.map((card, i) => (
        <li key={i}>
          <details className="flashcard">
            <summary>{card.question}</summary>
            <p>{card.answer}</p>
          </details>
        </li>
      ))}
    </ol>
  );
}
