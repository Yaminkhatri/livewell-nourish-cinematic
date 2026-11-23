// Ask Livewell: a tiny Cloudflare Worker that lets the website's chatbot answer with real AI.
// The API key stays here on the server (as a secret), never in the website code.

const FACTS = [
  "Brand: Livewell (Livewell Nourish). Product: Livewell Talbina Royale, Premium Sachet Edition.",
  "Talbina is a warm barley porridge with a smooth, comforting texture. The name comes from the Arabic word laban (milk).",
  "History: talbina dates to 7th-century Madinah, about 1,400 years ago. Aisha (RA) had it cooked for grieving relatives and narrated that the Prophet (peace be upon him) said talbina soothes the heart of the sick and relieves some of the sorrow (Sahih al-Bukhari 5417, Sahih Muslim 2216). Ibn al-Qayyim explained it is made from barley flour with its bran.",
  "Ingredients printed on the pack: barley, almonds, pistachios. No preservatives, no synthetic food colour.",
  "Allergens: gluten (barley) and tree nuts (almonds, pistachios). Preparing with milk adds dairy.",
  "Nutrition per 16 g sachet (dry mix, approximate, NABL-tested): 64 kcal, protein 1.12 g, carbohydrate 10.72 g, total sugar 0.49 g, fibre 1.44 g, saturated fat 0.21 g, sodium 24.48 mg.",
  "Pack: 15 individually sealed 16 g sachets. One sachet makes one bowl.",
  "Preparation: one sachet in a saucepan, add 200 ml milk (or water), stir, simmer on a low flame 5 to 7 minutes stirring occasionally, serve warm. Pack advises people with diabetes not to add honey.",
  "Storage: sealed, in a cool, dry place away from direct sunlight.",
  "Prices: 1 box Rs 350 (was Rs 450). 2 boxes Rs 599 (was Rs 900). 3 boxes Rs 799 (was Rs 1,350). Payment is completed on livewellnourish.com.",
  "Manufacturer: Livewell, 06 Shital Square Shopping, Bypass Road, Bharuch, Gujarat 392001. FSSAI licence no. 20726007000342.",
  "Customer care: +91 93133 66397, thagyaanas@gmail.com. The assistant does not know delivery times or fees.",
  "Talbina is food, not medicine. Never give medical advice."
];

const SYSTEM = "You are Ask Livewell, the friendly assistant on the Livewell Talbina website. Answer in 1 to 4 short plain-text sentences, warm and direct, no markdown. Use ONLY the facts below. If the answer is not in the facts, say you don't have that detail and give the customer care phone and email. Never give medical advice or make health claims beyond the facts; never invent prices, delivery times, certifications or policies. Politely steer off-topic questions back to Talbina.\n\nFACTS:\n- " + FACTS.join("\n- ");

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGINS || "https://yaminkhatri.github.io").split(",").map(s => s.trim());
    const cors = {
      "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0],
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin"
    };
    const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") return json({ error: "Use POST" }, 405);
    if (!allowed.includes(origin)) return json({ error: "Origin not allowed" }, 403);

    let body;
    try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

    let messages = Array.isArray(body.messages) ? body.messages : [];
    messages = messages
      .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content.slice(0, 800) }));
    while (messages.length && messages[0].role !== "user") messages.shift();
    if (!messages.length || messages[messages.length - 1].role !== "user") return json({ error: "No question" }, 400);

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({ model: env.MODEL || "claude-haiku-5-5", max_tokens: 350, system: SYSTEM, messages })
    });
    if (!r.ok) return json({ error: "AI service error", status: r.status }, 502);
    const data = await r.json();
    const reply = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("").trim();
    return json({ reply });
  }
};
