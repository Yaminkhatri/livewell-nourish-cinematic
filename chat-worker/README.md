# Ask Livewell: turning on live AI answers

The chatbot on the site already works: without this step it answers from a built-in set of Livewell facts.
Deploying this small Cloudflare Worker lets it answer with real AI. The API key stays on Cloudflare, never in the website.

## What you need
- A free Cloudflare account (https://dash.cloudflare.com/sign-up)
- An Anthropic API key (https://console.anthropic.com). Usage is billed per message; a short answer costs a fraction of a cent.

## Steps (about 10 minutes, all in the browser)
1. In Cloudflare, go to **Workers & Pages → Create → Create Worker**. Name it `ask-livewell` and click **Deploy**.
2. Click **Edit code**, delete what's there, paste in the contents of `worker.js` from this folder, and click **Deploy**.
3. Go to the worker's **Settings → Variables and Secrets** and add:
   - `ANTHROPIC_API_KEY` (type **Secret**): your Anthropic API key
   - `ALLOWED_ORIGINS` (type **Text**): `https://yaminkhatri.github.io` (add the client's domain later, comma-separated)
4. Copy the worker's address, e.g. `https://ask-livewell.<your-name>.workers.dev`.
5. In `index.html`, find `window.LIVEWELL_CHAT_ENDPOINT = ... ""` and put that address between the quotes. Commit, and the live site uses AI within a minute or two.

If the AI service is ever unreachable, the chatbot falls back to the built-in answers automatically.
