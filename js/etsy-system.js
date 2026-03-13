/* =========================================================
   ETSY-SYSTEM.JS
   Shared Etsy data, storage, parsing, and processing logic.
   Used by both work.html and brain-dump on index.html.
   ========================================================= */

const BEAD_NAMES = ["Tree","Centaur","Boat","Trident","Glowing Trident","Sheep","Bow","Maze","Building","Cage","Eagle","Owl","Hel","Camp"];
const NECKLACE_NAMES = ["10-01 Classic","10-01 Glow","10-02 Classic","10-02 Glow","10-03 Classic","10-03 Glow","10-04 Classic","10-04 Glow","10-05 Classic","10-05 Glow","20-01 Classic","20-01 Glow","20-02 Classic","20-02 Glow","30-01 Classic","30-01 Glow"];

/* Beads shared between Classic and Neon (one pool) */
const SHARED_BEADS = ["Trident","Glowing Trident","Sheep","Maze","Owl","Hel"];

const BEAD_ALIASES = { "trident glow": "Glowing Trident", "glowing trident": "Glowing Trident" };

const CLASSIC_RECIPES = {
  "10-01 Classic": ["Trident","Sheep","Maze","Building"],
  "10-01 Glow":    ["Glowing Trident","Sheep","Maze","Building"],
  "10-02 Classic": ["Trident","Sheep","Bow","Maze","Building","Camp"],
  "10-02 Glow":    ["Glowing Trident","Sheep","Bow","Maze","Building","Camp"],
  "10-03 Classic": ["Trident","Sheep","Bow","Maze","Building"],
  "10-03 Glow":    ["Glowing Trident","Sheep","Bow","Maze","Building"],
  "10-04 Classic": ["Trident","Sheep","Bow","Maze","Building","Camp"],
  "10-04 Glow":    ["Glowing Trident","Sheep","Bow","Maze","Building","Camp"],
  "10-05 Classic": ["Trident","Sheep","Maze","Building","Cage","Eagle","Owl","Hel","Camp"],
  "10-05 Glow":    ["Glowing Trident","Sheep","Maze","Building","Cage","Eagle","Owl","Hel","Camp"],
  "20-01 Classic": ["Tree","Centaur","Boat","Trident","Sheep","Maze","Building"],
  "20-01 Glow":    ["Tree","Centaur","Boat","Glowing Trident","Sheep","Maze","Building"],
  "20-02 Classic": ["Tree","Centaur","Boat","Trident","Sheep","Maze","Building","Camp"],
  "20-02 Glow":    ["Tree","Centaur","Boat","Glowing Trident","Sheep","Maze","Building","Camp"],
  "30-01 Classic": ["Tree","Centaur","Boat","Trident","Sheep","Maze","Building","Cage","Eagle","Owl","Hel","Camp"],
  "30-01 Glow":    ["Tree","Centaur","Boat","Glowing Trident","Sheep","Maze","Building","Cage","Eagle","Owl","Hel","Camp"]
};

const NEON_RECIPES = {
  "10-01 Classic": ["Trident","Sheep","Maze","Building"],
  "10-01 Glow":    ["Glowing Trident","Sheep","Maze","Building"],
  "10-02 Classic": ["Trident","Sheep","Bow","Maze","Building","Camp"],
  "10-02 Glow":    ["Glowing Trident","Sheep","Bow","Maze","Building","Camp"],
  "10-03 Classic": ["Trident","Sheep","Bow","Maze","Building"],
  "10-03 Glow":    ["Glowing Trident","Sheep","Bow","Maze","Building"],
  "10-04 Classic": ["Trident","Sheep","Bow","Maze","Building","Camp"],
  "10-04 Glow":    ["Glowing Trident","Sheep","Bow","Maze","Building","Camp"],
  "10-05 Classic": ["Trident","Sheep","Bow","Maze","Building","Cage","Eagle","Owl","Hel","Camp"],
  "10-05 Glow":    ["Glowing Trident","Sheep","Bow","Maze","Building","Cage","Eagle","Owl","Hel","Camp"],
  "20-01 Classic": ["Tree","Centaur","Boat","Trident","Sheep","Bow","Maze","Building"],
  "20-01 Glow":    ["Tree","Centaur","Boat","Glowing Trident","Sheep","Bow","Maze","Building"],
  "20-02 Classic": ["Tree","Centaur","Boat","Trident","Sheep","Bow","Maze","Building","Camp"],
  "20-02 Glow":    ["Tree","Centaur","Boat","Glowing Trident","Sheep","Bow","Maze","Building","Camp"],
  "30-01 Classic": ["Tree","Centaur","Boat","Trident","Sheep","Bow","Maze","Building","Cage","Eagle","Owl","Hel","Camp"],
  "30-01 Glow":    ["Tree","Centaur","Boat","Glowing Trident","Sheep","Bow","Maze","Building","Cage","Eagle","Owl","Hel","Camp"]
};

const LOW_STOCK_THRESHOLD = 30;

/* =========================================================
   STORAGE
   ========================================================= */

function loadEtsy() {
  const raw = localStorage.getItem("lale_etsy");
  if (raw) return JSON.parse(raw);
  const beadsClassic = {}, beadsNeon = {}, beadsShared = {};
  BEAD_NAMES.forEach(function(b) {
    if (SHARED_BEADS.includes(b)) beadsShared[b] = 0;
    else { beadsClassic[b] = 0; beadsNeon[b] = 0; }
  });
  const neckClassic = {}, neckNeon = {};
  NECKLACE_NAMES.forEach(function(n) { neckClassic[n] = 0; neckNeon[n] = 0; });
  return { beadsClassic, beadsNeon, beadsShared, neckClassic, neckNeon, supplies: {} };
}

function saveEtsy(data) {
  localStorage.setItem("lale_etsy", JSON.stringify(data));
}

/* =========================================================
   BEAD HELPERS
   ========================================================= */

function getBeadCount(data, bead, line) {
  if (SHARED_BEADS.includes(bead)) return data.beadsShared[bead] || 0;
  return line === "classic" ? (data.beadsClassic[bead] || 0) : (data.beadsNeon[bead] || 0);
}

function setBeadCount(data, bead, line, val) {
  if (SHARED_BEADS.includes(bead)) data.beadsShared[bead] = val;
  else if (line === "classic") data.beadsClassic[bead] = val;
  else data.beadsNeon[bead] = val;
}

/* =========================================================
   NORMALIZATION
   ========================================================= */

function etsyNormalizeBead(str) {
  const lower = str.trim().toLowerCase();
  if (BEAD_ALIASES[lower]) return BEAD_ALIASES[lower];
  const found = BEAD_NAMES.find(function(b) { return b.toLowerCase() === lower; });
  return found || null;
}

function etsyNormalizeNecklace(str) {
  let s = str.trim().toLowerCase();
  s = s.replace(/\s*(clt|classic|c)$/i, " classic");
  s = s.replace(/\s*(neon|n)$/i, " neon");
  s = s.replace(/\s*(glowing|g)$/i, " glow");
  s = s.replace(/\b(\d+)-(\d)\b/g, function(_, prefix, digit) {
    return prefix + "-0" + digit;
  });
  const found = NECKLACE_NAMES.find(function(n) { return n.toLowerCase() === s.trim(); });
  return found || null;
}

function etsyDetectLineFromText(text) {
  const lower = text.toLowerCase();
  if (/\b(neon|n)\b/.test(lower)) return "neon";
  if (/\b(classic|clt|c)\b/.test(lower) && !lower.match(/\d+-\d+\s+(classic|clt|c)/)) return "classic";
  return null;
}

function etsyDetectLine(text) {
  const lower = text.toLowerCase();
  if (/\b(neon|n)\b/.test(lower)) return "neon";
  if (/\b(classic|clt|c)\b/.test(lower)) return "classic";
  return null;
}

/* =========================================================
   IS ETSY INPUT — used by Brain Dump to detect Etsy lines
   ========================================================= */

function isEtsyInput(text) {
  if (!text) return false;
  const lower = text.trim().toLowerCase();
  if (/^(sold?|painted?|made?|add(ed)?|bought?)\s/.test(lower)) {
    /* Check if it contains a bead or necklace reference */
    const hasBead = BEAD_NAMES.some(function(b) { return lower.includes(b.toLowerCase()); });
    const hasNecklace = !!etsyNormalizeNecklace(lower.replace(/^(sold?|painted?|made?|add(ed)?|bought?)\s+(\d+\s+)?/i, "").trim());
    return hasBead || hasNecklace;
  }
  return false;
}

/* =========================================================
   LOW STOCK CHECK
   ========================================================= */

function etsyCheckLowStock(data) {
  if (typeof loadTasks !== "function" || typeof saveTasks !== "function") return;
  const tasks = loadTasks();
  const supplies = data.supplies || {};
  Object.keys(supplies).forEach(function(name) {
    if (supplies[name] <= LOW_STOCK_THRESHOLD) {
      const taskName = "Buy " + name;
      const alreadyExists = tasks.find(function(t) { return t.name === taskName && !t.completed; });
      if (!alreadyExists) {
        tasks.push({
          id: "supply_" + name.replace(/\s+/g,"_") + "_" + Date.now(),
          name: taskName,
          schedule: "weekly",
          completed: false,
          streak: false,
          createdAt: new Date().toISOString()
        });
      }
    }
  });
  saveTasks(tasks);
}

/* =========================================================
   CORE PROCESSOR
   Accepts an askLineFn(context) → Promise<"classic"|"neon">
   so it works from both the Work page UI and Brain Dump.
   ========================================================= */

async function processEtsyInput(rawText, askLineFn) {
  const lines = rawText.split(/\n|,/).map(function(s) { return s.trim(); }).filter(Boolean);
  const data = loadEtsy();

  const explicitLine = etsyDetectLineFromText(rawText);
  let resolvedLine = explicitLine;

  async function getLine(context) {
    if (resolvedLine) return resolvedLine;
    resolvedLine = await askLineFn(context || "Which inventory line does this belong to?");
    return resolvedLine;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    /* ---- PAINTED BEADS ---- */
    const paintMatch = lower.match(/painted?\s+(?:(\d+)\s+)?(.+)/);
    if (paintMatch) {
      const qty = paintMatch[1] ? parseInt(paintMatch[1]) : 1;
      const beadRaw = paintMatch[2].replace(/s$/, "");
      const bead = etsyNormalizeBead(beadRaw);
      if (!bead) { alert("Couldn't find bead: " + paintMatch[2]); continue; }
      const isShared = SHARED_BEADS.includes(bead);
      const line_type = isShared ? "classic" : await getLine('Which line are you painting "' + bead + '" for?');
      setBeadCount(data, bead, line_type, getBeadCount(data, bead, line_type) + qty);
      saveEtsy(data);
      continue;
    }

    /* ---- SALE ---- */
    const saleMatch = lower.match(/sold?\s+(?:(\d+)\s+)?(.+)/);
    if (saleMatch) {
      const qty = saleMatch[1] ? parseInt(saleMatch[1]) : 1;
      const rest = saleMatch[2].trim();
      const useRing = /\bring\b|\bR\b/.test(line);
      const neckRaw = rest.replace(/\s*\bring\b|\s*\bR\b/gi, "").trim();
      const neck = etsyNormalizeNecklace(neckRaw);
      if (!neck) { alert("Couldn't find necklace: " + neckRaw); continue; }
      resolvedLine = null; /* sales always ask fresh */
      const inv = await getLine('Was "' + neck + '" sold from Classic or Neon inventory?');
      const recipes = inv === "classic" ? CLASSIC_RECIPES : NEON_RECIPES;
      const beadsUsed = recipes[neck] || [];
      if (inv === "classic") data.neckClassic[neck] = (data.neckClassic[neck] || 0) - qty;
      else data.neckNeon[neck] = (data.neckNeon[neck] || 0) - qty;
      beadsUsed.forEach(function(bead) {
        setBeadCount(data, bead, inv, getBeadCount(data, bead, inv) - qty);
      });
      if (data.supplies["Necklace String"] !== undefined)
        data.supplies["Necklace String"] = Math.max(0, (data.supplies["Necklace String"] || 0) - qty);
      if (data.supplies["Package"] !== undefined)
        data.supplies["Package"] = Math.max(0, (data.supplies["Package"] || 0) - qty);
      if (useRing && data.supplies["Ring"] !== undefined)
        data.supplies["Ring"] = Math.max(0, (data.supplies["Ring"] || 0) - qty);
      saveEtsy(data);
      etsyCheckLowStock(data);
      continue;
    }

    /* ---- BOUGHT SUPPLIES ---- */
    const buyMatch = lower.match(/bought?\s+(?:(\d+)\s+)?(.+)/);
    if (buyMatch) {
      const qty = buyMatch[1] ? parseInt(buyMatch[1]) : 1;
      const supplyRaw = buyMatch[2].trim();
      const supplyKey = Object.keys(data.supplies).find(function(k) { return k.toLowerCase() === supplyRaw; }) || supplyRaw;
      data.supplies[supplyKey] = (data.supplies[supplyKey] || 0) + qty;
      saveEtsy(data);
      continue;
    }

    /* ---- MADE / ADD NECKLACE ---- */
    const madeMatch = lower.match(/(?:made?|add(?:ed)?)\s+(?:(\d+)\s+)?(.+)/);
    if (madeMatch) {
      const qty = madeMatch[1] ? parseInt(madeMatch[1]) : 1;
      const neckRaw = madeMatch[2].trim();
      const neck = etsyNormalizeNecklace(neckRaw);
      if (neck) {
        const inv = await getLine('Was "' + neck + '" made for Classic or Neon inventory?');
        /* Add to necklace count */
        if (inv === "classic") data.neckClassic[neck] = (data.neckClassic[neck] || 0) + qty;
        else data.neckNeon[neck] = (data.neckNeon[neck] || 0) + qty;
        /* Subtract beads used in the recipe */
        const recipes = inv === "classic" ? CLASSIC_RECIPES : NEON_RECIPES;
        const beadsUsed = recipes[neck] || [];
        beadsUsed.forEach(function(bead) {
          setBeadCount(data, bead, inv, getBeadCount(data, bead, inv) - qty);
        });
        saveEtsy(data);
        continue;
      }
    }

    /* ---- DIRECT BEAD COUNT: "5 Trident" ---- */
    const directMatch = lower.match(/^(\d+)\s+(.+)/);
    if (directMatch) {
      const qty = parseInt(directMatch[1]);
      const beadRaw = directMatch[2].replace(/s$/, "");
      const bead = etsyNormalizeBead(beadRaw);
      if (bead) {
        const isSharedDirect = SHARED_BEADS.includes(bead);
        const line_type = isSharedDirect ? "classic" : await getLine('Which line are you adding "' + bead + '" to?');
        setBeadCount(data, bead, line_type, getBeadCount(data, bead, line_type) + qty);
        saveEtsy(data);
        continue;
      }
    }

    alert("Couldn't understand: \"" + line + "\"");
  }
}
