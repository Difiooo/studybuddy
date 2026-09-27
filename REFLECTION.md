# Reflection

**Note: this is a starting draft based on the actual technical decisions
made while building this with me (the AI assistant). Edit it to match what
*you* genuinely found hardest and learned — a reflection that isn't in your
own honest voice defeats the point of this section.**

## What was hardest, and why

The hardest part wasn't the AI integration itself — sending notes to Claude
and getting text back is the easy 80%. The hard part was **not trusting the
model's output**. The first version of the function just parsed whatever
Claude returned and forwarded it straight to the frontend. That's fine right
up until the model returns prose instead of JSON, or JSON with a missing
`answer` field, and then the UI either crashes or silently renders garbage.
Getting this right meant writing validation on *both* ends — the function
checks the model's JSON is well-formed and each card has real content before
it ever leaves the server, and the frontend still treats the API as
something that can fail even after that.

## What I'd do differently next time

I'd write the malformed-response test case before writing the success case,
not after — thinking about "what does a bad AI response actually look like"
first would have shaped the function's error handling from the start
instead of retrofitting it.

## One thing that surprised me

How much accessibility work native HTML elements do for free. The
flashcards could have been built as styled `<div>`s with `onClick` handlers
and custom ARIA — and it would have taken more code, not less, to get to the
same place `<details>`/`<summary>` gives you by default: keyboard support,
screen reader announcement, and semantics, with zero JavaScript event
handling needed at all.
