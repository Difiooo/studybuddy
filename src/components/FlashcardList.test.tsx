import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FlashcardList } from "./FlashcardList";

describe("FlashcardList", () => {
  it("renders one item per flashcard with the question visible", () => {
    render(
      <FlashcardList
        flashcards={[
          { question: "What is a closure?", answer: "A function bundled with its lexical scope." },
          { question: "What is Big O?", answer: "A way to describe algorithm growth rate." },
        ]}
      />
    );

    expect(screen.getByText("What is a closure?")).toBeInTheDocument();
    expect(screen.getByText("What is Big O?")).toBeInTheDocument();
  });

  it("labels the list so a screen reader announces what it is", () => {
    render(
      <FlashcardList
        flashcards={[{ question: "Q1", answer: "A1" }]}
      />
    );

    expect(screen.getByRole("list", { name: /generated flashcards/i })).toBeInTheDocument();
  });
});
