/* =========================================================
   BRAIN-PARSER.JS
   ---------------------------------------------------------
   AI-powered Brain Dump parser.
   Calls Cloudflare Worker proxy instead of Anthropic directly
   so the API key is never exposed in the code.

   Worker URL: https://holy-wind-9442.doeppg.workers.dev
   ========================================================= */

const WORKER_URL = "https://holy-wind-9442.doeppg.workers.dev";
const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";

async function parseBrainDump(text) {
  if (!text || text.trim() === "") return [];
  try {
    return await parseWithClaudeAPI(text);
  } catch (e) {
    console.warn("API fallback to rules:", e.message);
    return parseWithRules(text);
  }
}

async function parseWithClaudeAPI(text) {
  /* Load existing streak names so AI can match them */
  const existingStreaks = (typeof loadStreaks === "function" ? loadStreaks() : [])
    .map(s => s.name).filter(Boolean);
  const streakHint = existingStreaks.length > 0
    ? `\n\nUSER'S EXISTING STREAKS (match these by name, even if phrased differently):\n${existingStreaks.map(n => "- " + n).join("\n")}\nIf the input clearly refers to one of these streaks (e.g. "no instagram" matches "No instagram"), classify it as type "streak" and use the exact streak name.`
    : "";

  const systemPrompt = `You are a productivity assistant parsing user input for a personal dashboard app.

Your job: split the input into individual items, categorize each one, and return structured JSON.

CATEGORIES:
- "task" = anything actionable (to-do, errand, chore, appointment)
- "streak" = a habit or recurring activity (vitamins, exercise, meditation, reading, no-phone, etc.)
- "health" = anything related to the body or wellness (weight measurements, headache, migraine, pain, energy, mood, sleep, medication, symptoms, feeling sick, burnout). Weight can be written in any format: 120lbs, 120.3 lbs, 68kg, "weighed 130", etc.
- "note" = anything else — a thought, reminder, idea, or piece of information

SPLITTING:
- Split on commas or new lines when they separate distinct items
- Keep together if it is one item (e.g. "salt and pepper" = 1 item)

DESTINATION (tasks only):
- "daily" = urgent, needs doing today, or explicitly says today
- "weekly" = general task, no urgency
- null = unclear

HEALTH DATA — populate the data field for all health items:
- Weight (any format): {"category":"weight","value":"<exact text the user wrote>"}
- Headache or migraine: {"category":"headaches","severity":"<1-5 if mentioned, else null>"}
- Energy, mood, tiredness: {"category":"energy","level":"<1-5 if mentioned, else null>"}
- Any other health/symptom: {"category":"<descriptive lowercase name>","note":"<what they wrote>"}

EXAMPLES:
Input: "120.3lbs"
Output: [{"type":"health","name":"120.3lbs","destination":null,"data":{"category":"weight","value":"120.3lbs"}}]

Input: "bad headache, pick up milk, took vitamins"
Output: [{"type":"health","name":"bad headache","destination":null,"data":{"category":"headaches","severity":null}},{"type":"task","name":"pick up milk","destination":"daily","data":{}},{"type":"streak","name":"took vitamins","destination":null,"data":{}}]${streakHint}

Return ONLY a valid JSON array. No explanation, no markdown, no extra text.`;

  const response = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: text }]
    })
  });

  if (!response.ok) throw new Error("Worker " + response.status);
  const d = await response.json();
  if (d.error) throw new Error("API error: " + JSON.stringify(d.error));

  const clean = d.content[0].text.trim().replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);
  if (!Array.isArray(parsed)) throw new Error("Not an array");

  return parsed.map(item => ({
    type: item.type || "note",
    name: String(item.name || "").trim(),
    destination: item.destination || null,
    data: item.data || {}
  }));
}


function parseWithRules(text) {
  /* Simple fallback — only runs if API fails completely.
     Splits on newlines/commas only, no keyword splitting that mangles sentences. */
  const chunks = text.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
  return chunks.map(function(chunk) {
    const lower = chunk.toLowerCase();

    /* Check existing streak names */
    if (typeof loadStreaks === "function") {
      const streaks = loadStreaks();
      const match = streaks.find(s => lower.includes(s.name.toLowerCase()));
      if (match) return { type:"streak", name:match.name, destination:null, data:{} };
    }

    /* Health keywords */
    if (lower.includes("headache") || lower.includes("migraine")) {
      const sev = chunk.match(/[1-5]/);
      return { type:"health", name:chunk, destination:null, data:{ category:"headaches", severity:sev?sev[0]:null } };
    }
    if (lower.match(/\d+\s*lb/) || lower.match(/\d+\s*kg/) || lower.includes("weigh"))
      return { type:"health", name:chunk, destination:null, data:{ category:"weight", value:chunk } };

    /* Task keywords — only match clear action verbs at the START of a sentence */
    const taskStarters = ["pick up","drop off","go to","buy ","call ","email ","pay ","send ","book ","schedule ","wash ","clean ","fix ","finish ","order ","print ","vaccum","vacuum","mow ","take ","bring ","drop ","get "];
    if (taskStarters.some(w => lower.startsWith(w) || lower.includes(" " + w.trim() + " ")))
      return { type:"task", name:chunk, destination:"weekly", data:{} };

    /* Default to note */
    return { type:"note", name:chunk, destination:null, data:{} };
  });
}
