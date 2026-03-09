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
Output: [{"type":"health","name":"bad headache","destination":null,"data":{"category":"headaches","severity":null}},{"type":"task","name":"pick up milk","destination":"daily","data":{}},{"type":"streak","name":"took vitamins","destination":null,"data":{}}]

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
  return splitIntoChunks(text).map(c => c.trim()).filter(Boolean).map(classifyChunk).filter(Boolean);
}

function splitIntoChunks(text) {
  const byLines = text.split(/\n+/).map(s => s.trim()).filter(Boolean);
  const byCommas = [];
  byLines.forEach(line => line.split(",").map(s => s.trim()).filter(Boolean).forEach(p => byCommas.push(p)));
  const ACTION_STARTERS = [
    "pick up","drop off","go to","shop for","get ","call ","email ","text ","buy ","wash ","clean ",
    "make ","finish ","do ","grab ","bring ","pay ","send ","check ","organize ","plan ","pack ",
    "fill ","order ","print ","write ","update ","fix ","book ","schedule "
  ];
  const final = [];
  byCommas.forEach(chunk => splitByActionWords(chunk, ACTION_STARTERS).forEach(c => final.push(c)));
  return final;
}

function splitByActionWords(text, actionWords) {
  const lower = text.toLowerCase();
  const splitPoints = [];
  actionWords.forEach(word => {
    const w = word.trim().toLowerCase();
    let idx = lower.indexOf(w, w.length + 1);
    while (idx !== -1) {
      if (idx > 0 && lower[idx - 1] === " ") splitPoints.push(idx);
      idx = lower.indexOf(w, idx + w.length);
    }
  });
  if (splitPoints.length === 0) return [text];
  const sorted = [...new Set(splitPoints)].sort((a, b) => a - b);
  const chunks = [];
  let last = 0;
  sorted.forEach(point => { const c = text.slice(last, point).trim(); if (c) chunks.push(c); last = point; });
  const rem = text.slice(last).trim();
  if (rem) chunks.push(rem);
  return chunks.map(c => c.replace(/^\s*and\s+/i,"").replace(/\s+and\s*$/i,"").trim()).filter(Boolean);
}

function classifyChunk(text) {
  const lower = text.toLowerCase();
  if (lower.includes("headache") || lower.includes("migraine")) {
    const sev = text.match(/[1-5]/);
    return { type:"health", name:text, destination:null, data:{ category:"headaches", severity:sev?sev[0]:null } };
  }
  if (lower.includes("burnout") || lower.includes("burn out") || lower.includes("burned out"))
    return { type:"health", name:text, destination:null, data:{ category:"burnout" } };
  if (lower.match(/\d+\s*lb/) || lower.includes("weight"))
    return { type:"health", name:text, destination:null, data:{ category:"weight", value:text } };
  if (lower.includes("energy level") || lower.includes("energy:")) {
    const lv = text.match(/[1-5]/);
    return { type:"health", name:text, destination:null, data:{ category:"energy", level:lv?lv[0]:null } };
  }
  if (lower.includes("vitamin") || lower.includes("meditat") || lower.includes("exercise"))
    return { type:"streak", name:text, destination:null, data:{} };
  const taskWords = ["wash","clean","pick up","buy","call","email","text","go to","schedule","make",
    "finish","do ","drop off","grab","get ","bring","pay","send","check","organize","plan","pack",
    "fill","order","print","write","update","fix","book","shop"];
  if (taskWords.some(w => lower.includes(w)))
    return { type:"task", name:text, destination:null, data:{} };
  return { type:"note", name:text, destination:null, data:{} };
}
