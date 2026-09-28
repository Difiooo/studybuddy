# StudyBuddy

StudyBuddy is a web application that helps students generate study flashcards from a topic or learning prompt. It uses an AI-powered backend to generate question-and-answer cards that can be used for quick revision.

## Live Demo

https://studybuddy776.netlify.app/

## Demo Video

[Watch the StudyBuddy demo video](YOUR_DEMO_VIDEO_LINK)

> Replace `YOUR_DEMO_VIDEO_LINK` with the actual link to your demo video before submitting.

## Features

* Generate AI-powered flashcards from a study topic or prompt
* Display generated questions and answers in a simple card-based interface
* Accessible UI with keyboard-friendly interactions
* Loading and request status feedback
* Error handling for failed API requests
* Responsive interface for different screen sizes
* Accessibility testing with axe-core
* Deployed as a production web application on Netlify

## Tech Stack

* React
* TypeScript
* Vite
* CSS
* Vitest
* React Testing Library
* vitest-axe / axe-core
* Netlify Functions
* Anthropic API
* GitHub
* Netlify

## How It Works

1. The user enters a study topic or prompt.
2. StudyBuddy sends the request to the server-side Netlify Function.
3. The function communicates with the AI API.
4. The generated flashcards are returned to the application.
5. The flashcards are displayed for the user to study.

The API key is kept on the server side and is not included in the frontend code.

## Project Structure

```text
studybuddy/
├── netlify/
│   └── functions/
│       └── generate-flashcards.cjs
├── public/
├── src/
│   ├── components/
│   │   ├── FlashcardList.tsx
│   │   └── NotesForm.tsx
│   ├── App.tsx
│   ├── accessibility.test.tsx
│   └── ...
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── vite.config.ts
├── netlify.toml
└── README.md
```

## Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/Difiooo/studybuddy.git
cd studybuddy
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure the API key

Create a `.env` file if your local setup requires environment variables.

Add your Anthropic API key:

```env
ANTHROPIC_API_KEY=your_api_key_here
```
