# Teen Driver Next.js App

This repository contains a Next.js application generated with `create-next-app` using the App Router, TypeScript, Tailwind CSS, ESLint, and the `@/*` import alias.

## Prerequisites

- Node.js 18.18+ or 20.0+
- npm 9+ (bundled with recent Node.js releases)

## Install Dependencies

```bash
npm install
```

## Run the Dev Server

```bash
npm run dev
```

Visit `http://localhost:3000` to view the app. Edit `src/app/page.tsx` or other files under `src/app` and the browser will hot-reload.

## Lint, Test, and Build

- `npm run lint` – run ESLint using the Next.js config
- `npm run build` – create an optimized production build
- `npm run start` – serve the production build locally

## Tailwind CSS

Global styles and Tailwind layers are defined in `src/app/globals.css`. Customize the Tailwind config in `tailwind.config.ts`.

## AI Concierge Agent

The preference quiz at `http://localhost:3000/quiz` packages parent inputs into a structured payload and can hand it to an AI concierge via the `/api/recommendations` endpoint.

1. Create `.env.local` with your OpenAI credentials:

   ```bash
   OPENAI_API_KEY=sk-...
# optional: override default model (defaults to gpt-4o-mini)
OPENAI_MODEL=gpt-4o-mini
   ```

2. Restart the dev server after adding environment variables:

   ```bash
   npm run dev
   ```

3. Complete the quiz and click **Generate shortlist** to send preferences to the agent. The response payload will be rendered on the summary screen.

The agent logic lives in `src/lib/agent.ts`. Update the prompt or downstream integrations there to point at your production workflows (e.g., CRM, email, follow-up tasks).

## Next Steps

- Replace the placeholder content in `src/app/page.tsx` with your UI
- Add routes by creating new folders with a `page.tsx` inside `src/app`
- Configure environment variables by adding them to `.env.local` (not committed)

For more details, see the [Next.js documentation](https://nextjs.org/docs).
