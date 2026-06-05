/* =========================================================
   STORAGE.JS  (Supabase edition)
   ---------------------------------------------------------
   Drop-in replacement for the localStorage version.
   Same public API: loadTasks(), saveTasks(v), etc.
   Now reads/writes to Supabase instead of the browser.

   SETUP: Replace the two config values below with your own
   Supabase project URL and anon key.
   ========================================================= */

const SUPABASE_URL  = "YOUR_SUPABASE_URL";   // e.g. https://xyzxyz.supabase.co
const SUPABASE_ANON = "YOUR_SUPABASE_ANON_KEY";

/* =========================================================
   LOW-LEVEL HELPERS
   Each "store" is a single row in a single table.
   We always read/write that one row by selecting the first.
   ========================================================= */

async function _load(table) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id,data&limit=1`, {
    headers: {
      "apikey":        SUPABASE_ANON,
      "Authorization": `Bearer ${SUPABASE_ANON}`
    }
  });
  if (!res.ok) { console.error(`Supabase load error (${table}):`, await res.text()); return null; }
  const rows = await res.json();
  return rows.length ? rows[0] : null;
}

async function _save(table, value) {
  // Load the existing row to get its id for upsert
  const existing = await _load(table);
  const id = existing?.id;

  const body = JSON.stringify({ data: value });

  if (id) {
    // Update existing row
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        "apikey":         SUPABASE_ANON,
        "Authorization":  `Bearer ${SUPABASE_ANON}`,
        "Content-Type":   "application/json",
        "Prefer":         "return=minimal"
      },
      body
    });
    if (!res.ok) console.error(`Supabase save error (${table}):`, await res.text());
  } else {
    // Insert first row
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        "apikey":         SUPABASE_ANON,
        "Authorization":  `Bearer ${SUPABASE_ANON}`,
        "Content-Type":   "application/json",
        "Prefer":         "return=minimal"
      },
      body
    });
    if (!res.ok) console.error(`Supabase insert error (${table}):`, await res.text());
  }
}

/* =========================================================
   ONE-TIME MIGRATION
   Call migrateLocalStorageToSupabase() once from the
   browser console to push your existing localStorage data
   up to Supabase. Run it, then delete the call.
   ========================================================= */
async function migrateLocalStorageToSupabase() {
  const keys = {
    tasks:           "prod_tasks",
    streaks:         "prod_streaks",
    health:          "prod_health",
    history:         "prod_history",
    notes:           "prod_notes",
    custom_pages:    "prod_custom_pages",
    custom_boxes:    "prod_custom_boxes",
    health_trackers: "prod_health_trackers"
  };

  for (const [table, lsKey] of Object.entries(keys)) {
    const raw = localStorage.getItem(lsKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        await _save(table, parsed);
        console.log(`âœ… Migrated ${table}`);
      } catch (e) {
        console.warn(`âš ï¸ Skipped ${table}:`, e);
      }
    } else {
      console.log(`â€” ${table}: nothing in localStorage, skipped`);
    }
  }
  console.log("Migration complete.");
}

/* =========================================================
   PUBLIC API  (identical to the old localStorage version,
   but now async â€” use await or .then() when calling)
   ========================================================= */

async function loadTasks()              { const r = await _load("tasks");           return r?.data ?? []; }
async function saveTasks(v)             { await _save("tasks", v); }

async function loadStreaks()            { const r = await _load("streaks");         return r?.data ?? []; }
async function saveStreaks(v)           { await _save("streaks", v); }

async function loadHealth()             { const r = await _load("health");          return r?.data ?? {}; }
async function saveHealth(v)            { await _save("health", v); }

async function loadHistory()            { const r = await _load("history");         return r?.data ?? {}; }
async function saveHistory(v)           { await _save("history", v); }

async function loadNotes()              { const r = await _load("notes");           return r?.data ?? {}; }
async function saveNotes(v)             { await _save("notes", v); }

async function loadCustomPages()        { const r = await _load("custom_pages");    return r?.data ?? []; }
async function saveCustomPages(v)       { await _save("custom_pages", v); }

async function loadCustomBoxes()        { const r = await _load("custom_boxes");    return r?.data ?? []; }
async function saveCustomBoxes(v)       { await _save("custom_boxes", v); }

async function loadHealthTrackers()     { const r = await _load("health_trackers"); return r?.data ?? getDefaultHealthTrackers(); }
async function saveHealthTrackers(v)    { await _save("health_trackers", v); }

/* =========================================================
   DEFAULT HEALTH TRACKERS  (unchanged)
   ========================================================= */
function getDefaultHealthTrackers() {
  return [
    { id: "headaches",  name: "Headaches",    type: "calendar", color: "#b0977a", icon: "â—‰" },
    { id: "weight",     name: "Weight",       type: "weight",   color: "#8fa98f", icon: "âš–" },
    { id: "energy",     name: "Energy Level", type: "scale",    color: "#a09fc0", icon: "âš¡", min:1, max:5 },
    { id: "moon",       name: "Moon",         type: "calendar", color: "#7a9cbf", icon: "â—‰" },
    { id: "annoyance",  name: "Annoyance",    type: "calendar", color: "#b07a9c", icon: "â—‰" }
  ];
}

/* Clear all â€” for testing only */
async function clearAllStorage() {
  await Promise.all([
    saveTasks([]), saveStreaks([]), saveHealth({}), saveHistory({}),
    saveNotes({}), saveCustomPages([]), saveCustomBoxes([]), saveHealthTrackers([])
  ]);
}
