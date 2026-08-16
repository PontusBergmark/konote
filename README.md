# Konote

Track how LLMs position your brand. Konote scans ChatGPT and Claude with brand, competitor, and category prompts, then surfaces which associations stick, which are missing, and where your positioning differs from rivals.

## What it does

- **Association mapping** — See which attributes LLMs link to your brand and how strongly.
- **Competitor comparison** — Compare your brand against competitors on the same attributes.
- **Positioning probe** — Run differentiation prompts to find what LLMs say is unique to your brand versus each competitor.
- **Prompt sensitivity test** — Detect attributes whose scores change significantly when the prompt is framed, flagging potential question-bias artefacts.
- **Excerpt evidence** — View real LLM response snippets that support each detected association.

## Stack

- [TanStack Start](https://tanstack.com/start) — full-stack React framework
- [Tailwind CSS](https://tailwindcss.com) — styling
- [Lovable Cloud](https://lovable.dev) — backend, auth, and database
- OpenAI GPT-4o and Anthropic Claude via the Lovable AI Gateway

## Running locally

1. Install dependencies:
   ```bash
   bun install
   ```

2. Copy environment variables from your project settings into `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`

3. Start the dev server:
   ```bash
   bun dev
   ```

## Important: environment variables

`.env` is ignored by Git and should never be committed. If you previously committed `.env`, remove it from Git history and rotate any exposed secrets:

```bash
git rm --cached .env
git commit -m "Remove .env from repository"
```

## License

© Konote. All rights reserved.
