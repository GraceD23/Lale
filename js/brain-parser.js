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
- "etsy" = anything related to Etsy shop inventory: selling necklaces (e.g. "sold 20-01 glow"), painting beads (e.g. "painted 5 tridents"), making necklaces (e.g. "made 10-02 classic"), adding inventory (e.g. "add 20-02g"), or buying supplies (e.g. "bought 50 strings"). These start with sold/painted/made/add/bought followed by a product name or code.
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
- Headache or migraine: {"category":"headaches","severity":"<1-5 if mentioned, else null>","note":"<any associated notes e.g. trigger foods, context — NOT the severity text>"}
- Energy, mood, tiredness: {"category":"energy","level":"<1-5 if mentioned, else null>","note":"<any context>"}
- Any other health/symptom: {"category":"<descriptive lowercase name>","severity":"<X if written as X/5 or X out of 5, else null>","note":"<any context or associated detail that is NOT the severity>"}

SEVERITY: if the user writes something like "3/5" or "4 out of 5" near a health item, that is the severity (1-5 scale). Extract it into "severity". Do NOT include the severity text in the note.
NOTE: anything else written alongside a health item that gives context (e.g. "ate strawberries", "after coffee", "no sleep") goes into "note".

EXAMPLES:
Input: "120.3lbs"
Output: [{"type":"health","name":"120.3lbs","destination":null,"data":{"category":"weight","value":"120.3lbs"}}]

Input: "headache. ate strawberries 3/5"
Output: [{"type":"health","name":"headache","destination":null,"data":{"category":"headaches","severity":"3","note":"ate strawberries"}}]

Input: "bad headache, pick up milk, took vitamins"
Output: [{"type":"health","name":"bad headache","destination":null,"data":{"category":"headaches","severity":null,"note":null}},{"type":"task","name":"pick up milk","destination":"daily","data":{}},{"type":"streak","name":"took vitamins","destination":null,"data":{}}]${streakHint}

Input: "sold 20-01 glow"
Output: [{"type":"etsy","name":"sold 20-01 glow","destination":null,"data":{}}]

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
  /* Improved fallback — runs when API is unavailable.
     Matches the AI behaviour as closely as possible. */
  const chunks = text.split(/[\n,]+/).map(function(s) { return s.trim(); }).filter(Boolean);

  return chunks.map(function(chunk) {
    const lower = chunk.toLowerCase().trim();

    /* ---- 1. ETSY ---- */
    if (/^(sold?|painted?|made?|add(ed)?|bought?)\b/i.test(lower)) {
      return { type: "etsy", name: chunk, destination: null, data: {} };
    }

    /* ---- 2. STREAKS — saved names first ---- */
    if (typeof loadStreaks === "function") {
      const streaks = loadStreaks();
      const match = streaks.find(function(s) { return lower.includes(s.name.toLowerCase()); });
      if (match) return { type: "streak", name: match.name, destination: null, data: {} };
    }

    /* Common habit phrases — whole-word matching to avoid false positives */
    const streakPhrases = [
      "vitamins","vitamin","supplements","supplement",
      "meditation","meditated","meditating",
      "exercise","exercised","workout","worked out",
      "\bran\b","running","walked","walking",
      "\bread\b","reading","journaling","journaled",
      "no phone","no instagram","no social media","no alcohol","no sugar","no caffeine",
      "drank water","water intake","skincare","stretched","stretching",
      "prayed","prayer","studied","studying"
    ];
    if (streakPhrases.some(function(p) { return new RegExp(p, "i").test(lower); })) {
      return { type: "streak", name: chunk, destination: null, data: {} };
    }

    /* ---- 3. HEALTH ---- */

    /* Weight */
    if (lower.match(/\d+(\.\.\d+)?\s*(lb|lbs|kg|pounds?)/) || lower.match(/^weigh(ed|s)?\s+\d/)) {
      return { type: "health", name: chunk, destination: null, data: { category: "weight", value: chunk } };
    }

    /* Severity extractor */
    function extractSeverity(str) {
      const m = str.match(/\b([1-5])\s*\/\s*5\b/) || str.match(/\b([1-5])\s+out\s+of\s+5\b/i);
      return m ? m[1] : null;
    }

    /* Note extractor */
    function extractNote(str, stripWords) {
      let s = str;
      stripWords.forEach(function(w) { s = s.replace(new RegExp(w, "gi"), ""); });
      s = s.replace(/\b[1-5]\s*\/\s*5\b/, "").replace(/\b[1-5]\s+out\s+of\s+5\b/gi, "");
      s = s.replace(/[.,!?]+/g, " ").replace(/\s+/g, " ").trim();
      return s || null;
    }

    if (lower.includes("headache") || lower.includes("migraine")) {
      const sev = extractSeverity(lower);
      const note = extractNote(chunk, ["headache","migraine","bad","terrible","horrible","awful","slight","mild"]);
      return { type: "health", name: lower.includes("migraine") ? "migraine" : "headache", destination: null, data: { category: "headaches", severity: sev, note: note } };
    }
    if (lower.includes("nausea") || lower.includes("nauseous") || lower.includes("vomit") || lower.includes("threw up")) {
      return { type: "health", name: chunk, destination: null, data: { category: "nausea", severity: extractSeverity(lower), note: null } };
    }
    if (lower.includes("cramp") || lower.includes("\bperiod\b") || lower.includes("bloat")) {
      return { type: "health", name: chunk, destination: null, data: { category: "cramps", severity: extractSeverity(lower), note: null } };
    }
    if (lower.includes("anxious") || lower.includes("anxiety") || lower.includes("panic") || lower.includes("stressed") || lower.includes("\bstress\b")) {
      return { type: "health", name: chunk, destination: null, data: { category: "anxiety", severity: extractSeverity(lower), note: null } };
    }
    if (lower.includes("tired") || lower.includes("fatigue") || lower.includes("exhausted") || lower.includes("no energy") || lower.includes("low energy") || lower.includes("burnout")) {
      return { type: "health", name: chunk, destination: null, data: { category: "energy", level: extractSeverity(lower), note: null } };
    }
    if (lower.includes("\bmood\b") || lower.includes("\bsad\b") || lower.includes("depressed") || lower.includes("emotional")) {
      return { type: "health", name: chunk, destination: null, data: { category: "mood", level: extractSeverity(lower), note: null } };
    }
    if (lower.includes("sleep") || lower.includes("insomnia") || lower.includes("couldn't sleep") || lower.includes("slept")) {
      return { type: "health", name: chunk, destination: null, data: { category: "sleep", severity: null, note: null } };
    }
    if (lower.includes("\bpain\b") || lower.includes("\bache\b") || lower.includes("\bsore\b") || lower.includes("\bhurt\b")) {
      return { type: "health", name: chunk, destination: null, data: { category: "pain", severity: extractSeverity(lower), note: null } };
    }
    if (lower.includes("sick") || lower.includes("fever") || lower.includes("\bcold\b") || lower.includes("\bflu\b") || lower.includes("cough") || lower.includes("sore throat")) {
      return { type: "health", name: chunk, destination: null, data: { category: "illness", severity: null, note: null } };
    }
    if (lower.includes("medication") || lower.includes("medicine") || lower.includes("\bpill\b") || lower.includes("ibuprofen") || lower.includes("tylenol") || lower.includes("advil")) {
      return { type: "health", name: chunk, destination: null, data: { category: "medication", severity: null, note: null } };
    }

    /* ---- 4. TASKS ---- */
    const dailyWords = ["today","tonight","this morning","asap","urgent","\bnow\b","immediately","before "];
    const isUrgent = dailyWords.some(function(w) { return new RegExp(w, "i").test(lower); });

    const taskStarters = [
      "pick up","drop off","go to","go pick","call ","email ","text ",
      "pay ","send ","book ","schedule ","wash ","clean ","fix ","finish ",
      "order ","print ","vacuum","vaccum","mow ","bring ","get ",
      "return ","submit ","apply ","fill out","sign ","renew ","cancel ",
      "check ","respond ","reply ","follow up","research ","look up",
      "make appointment","set up","don't forget","need to","have to","must ","should "
    ];
    if (taskStarters.some(function(w) { return lower.startsWith(w) || lower.includes(" " + w.trim() + " "); })) {
      return { type: "task", name: chunk, destination: isUrgent ? "daily" : "weekly", data: {} };
    }

    /* ---- 5. DEFAULT → NOTE ---- */
    return { type: "note", name: chunk, destination: null, data: {} };
  });
}
