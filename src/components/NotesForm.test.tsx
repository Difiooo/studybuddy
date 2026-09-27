import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotesForm } from "./NotesForm";

function mockFetchOnce(response: { ok: boolean; status?: number; body: unknown }) {
  const fetchMock = vi.fn().mockResolvedValueOnce({
    ok: response.ok,
    status: response.status ?? (response.ok ? 200 : 500),
    json: async () => response.body,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const LONG_ENOUGH_NOTES =
  "Closures capture their lexical scope. Big O describes algorithmic growth. Recursion solves problems by self-reference.";

describe("NotesForm", () => {
  it("rejects an empty submission without calling the API", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<NotesForm />);
    await user.click(screen.getByRole("button", { name: /generate flashcards/i }));

    expect(
      await screen.findByRole("alert")
    ).toHaveTextContent(/paste at least/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects garbage input that's too short without calling the API", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<NotesForm />);
    await user.type(screen.getByLabelText(/paste your notes/i), "asdf");
    await user.click(screen.getByRole("button", { name: /generate flashcards/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/paste at least/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows a polite live status while the request is in flight", async () => {
    const user = userEvent.setup();
    let resolveFetch!: (v: unknown) => void;
    const fetchMock = vi.fn().mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<NotesForm />);
    await user.type(screen.getByLabelText(/paste your notes/i), LONG_ENOUGH_NOTES);
    await user.click(screen.getByRole("button", { name: /generate flashcards/i }));

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(/generating/i);
    expect(status).toHaveAttribute("aria-live", "polite");

    resolveFetch({
      ok: true,
      status: 200,
      json: async () => ({
        flashcards: [{ question: "What is a closure?", answer: "A function with bound scope." }],
      }),
    });

    expect(await screen.findByText("What is a closure?")).toBeInTheDocument();
  });

  it("renders flashcards on a successful response", async () => {
    const user = userEvent.setup();
    mockFetchOnce({
      ok: true,
      body: {
        flashcards: [
          { question: "What is Big O?", answer: "Growth rate of an algorithm." },
        ],
      },
    });

    render(<NotesForm />);
    await user.type(screen.getByLabelText(/paste your notes/i), LONG_ENOUGH_NOTES);
    await user.click(screen.getByRole("button", { name: /generate flashcards/i }));

    expect(await screen.findByText("What is Big O?")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/1 flashcards ready/i);
  });

  it("shows the server's error message when the API call fails", async () => {
    const user = userEvent.setup();
    mockFetchOnce({
      ok: false,
      status: 502,
      body: { error: "The AI's response wasn't in the expected format. Please try again." },
    });

    render(<NotesForm />);
    await user.type(screen.getByLabelText(/paste your notes/i), LONG_ENOUGH_NOTES);
    await user.click(screen.getByRole("button", { name: /generate flashcards/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /wasn't in the expected format/i
    );
  });

  it("shows a generic error if the network call itself throws", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);

    render(<NotesForm />);
    await user.type(screen.getByLabelText(/paste your notes/i), LONG_ENOUGH_NOTES);
    await user.click(screen.getByRole("button", { name: /generate flashcards/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/something went wrong/i);
  });

  it("disables the submit button while a request is in flight", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockReturnValueOnce(new Promise(() => {}));
    vi.stubGlobal("fetch", fetchMock);

    render(<NotesForm />);
    await user.type(screen.getByLabelText(/paste your notes/i), LONG_ENOUGH_NOTES);
    await user.click(screen.getByRole("button", { name: /generate flashcards/i }));

    expect(screen.getByRole("button", { name: /generating/i })).toBeDisabled();
  });
});
