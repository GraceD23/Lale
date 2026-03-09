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
  const systemPrompt = `You are a productivity assistant parsing user input for a personal dashboard.

Split input into individual items, categorize each, return ONLY valid JSON array.

SPLITTING RULES:
- Split on commas and new lines
- Split mid-sentence when a new action word starts a new task: pick up, get, call, email, text, buy, wash, clean, make, finish, do, drop off, grab, bring, pay, send, check, organize, plan, pack, fill, order, print, write, update, fix, book, schedule, go to, shop for
- Remove "and" ONLY when connecting two separate tasks. Keep "and" if part of one task name (e.g. "pick up salt and pepper" = 1 task).

CATEGORIES:
- "task" = actionable to-do
- "note" = thought, reminder, or info to save
- "health" = headache, migraine, burnout, energy, mood, weight, sleep, medication, symptom
- "streak" = vitamin, exercise, meditation, habit

DESTINATION (tasks only): "daily"=urgent/today, "weekly"=general, null=unclear

Return ONLY a JSON array — no explanation, no markdown:
[{"type":"task","name":"Get dinner","destination":"daily","data":{}},{"type":"note","name":"Remember to call mom","destination":null,"data":{}}]`;

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

  if (!response.ok) throw new Error("Worker request failed: " + response.status);
  const d = await response.json();
  if (d.error) throw new Error("Worker error: " + d.error);

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
    return { type:"health", name:text, destination:null, data:{ category:"headache", severity:sev?sev[0]:null } };
  }
  if (lower.includes("burnout") || lower.includes("burn out") || lower.includes("burned out"))
    return { type:"health", name:text, destination:null, data:{ category:"burnout" } };
  if (lower.match(/\d+\s*lb/) || lower.includes("weight"))
    return { type:"health", name:text, destination:null, data:{ category:"weight" } };
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
