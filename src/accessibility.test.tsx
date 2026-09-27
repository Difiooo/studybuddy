import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import App from "./App";
import { FlashcardList } from "./components/FlashcardList";

describe("accessibility (axe-core)", () => {
  it("has no detectable a11y violations in the initial page state", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const { container } = render(<App />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no detectable a11y violations in the flashcard results", async () => {
    const { container } = render(
      <FlashcardList
        flashcards={[
          { question: "What is a closure?", answer: "A function bundled with its scope." },
          { question: "What is recursion?", answer: "A function calling itself." },
        ]}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
