/* =========================================================
   SERVER.JS  — SMS → AI → Website backend
   ---------------------------------------------------------
   Deploy this to Railway.app.
   Receives texts via Twilio, parses intent with Claude,
   writes results to Supabase, replies with confirmation.

   Required environment variables (set in Railway dashboard):
     TWILIO_ACCOUNT_SID
     TWILIO_AUTH_TOKEN
     MY_PHONE_NUMBER       e.g. +12085551234  (YOUR number)
     TWILIO_PHONE_NUMBER   e.g. +18005559999  (the Twilio number)
     ANTHROPIC_API_KEY
     SUPABASE_URL          e.g. https://xyzxyz.supabase.co
     SUPABASE_SERVICE_KEY  use the SERVICE key here (not anon)
   ========================================================= */

const express  = require("express");
const bodyParser = require("body-parser");
const twilio   = require("twilio");

const app  = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const PORT            = process.env.PORT || 3000;
const MY_PHONE        = process.env.MY_PHONE_NUMBER;
const SUPABASE_URL    = process.env.SUPABASE_URL;
const SUPABASE_KEY    = process.env.SUPABASE_SERVICE_KEY;
const ANTHROPIC_KEY   = process.env.ANTHROPIC_API_KEY;
const TWILIO_SID      = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN    = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_NUMBER   = process.env.TWILIO_PHONE_NUMBER;

const twilioClient = twilio(TWILIO_SID, TWILIO_TOKEN);

/* =========================================================
   SUPABASE HELPERS
   ========================================================= */

async function dbLoad(table) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id,data&limit=1`, {
    headers: {
      "apikey":        SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`
    }
  });
  const rows = await res.json();
  return rows.length ? rows[0] : null;
}

async function dbSave(table, value) {
  const existing = await dbLoad(table);
  const id = existing?.id;
  const body = JSON.stringify({ data: value });
  const url = id
    ? `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`
    : `${SUPABASE_URL}/rest/v1/${table}`;
  await fetch(url, {
    method: id ? "PATCH" : "POST",
    headers: {
      "apikey":        SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type":  "application/json",
      "Prefer":        "return=minimal"
    },
    body
  });
}

/* =========================================================
   CLAUDE AI PARSER
   Sends the raw SMS text to Claude and gets back a
   structured JSON action object.
   ========================================================= */

async function parseIntent(smsText) {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const systemPrompt = `You are a personal assistant that parses SMS commands for a personal website.
Today's date is ${today}.

The website tracks:
- Health data: headaches (with pain level 1-10), weight, energy (1-5 scale), moon, annoyance
- Movies / TV shows watched (with optional review text and star rating 1-5)
- Tasks / to-do items
- Streaks (daily habits)
- Notes / brain dump entries
- Calendar events (read-only — just list them from tasks)

Parse the user's SMS and return ONLY valid JSON with no extra text, no markdown, no explanation.

The JSON must have this shape:
{
  "action": one of: "add_health" | "add_media" | "add_task" | "add_note" | "query_tasks" | "add_streak_log" | "unknown",
  "reply": "a short friendly confirmation or answer to send back by SMS (max 160 chars)",
  "data": { ...action-specific fields }
}

Action-specific data shapes:

add_health:
  { "tracker": "headaches" | "weight" | "energy" | "moon" | "annoyance",
    "date": "YYYY-MM-DD",
    "value": number or null,
    "note": "optional text" }

add_media:
  { "type": "movie" | "tv",
    "title": "exact title to search TMDB for",
    "review": "optional review text",
    "rating": 1-5 or null,
    "date": "YYYY-MM-DD" }

add_task:
  { "text": "task description",
    "date": "YYYY-MM-DD or null" }

add_note:
  { "text": "full note text",
    "date": "YYYY-MM-DD" }

query_tasks:
  { "date": "YYYY-MM-DD" }

add_streak_log:
  { "streak_name": "name of the streak",
    "date": "YYYY-MM-DD" }

unknown:
  {}

Examples:
"headache. 1." → add_health, tracker: headaches, value: 1
"bad headache today, like a 7" → add_health, tracker: headaches, value: 7
"watched Star Wars 1. it was okay." → add_media, type: movie, title: "Star Wars: The Phantom Menace", review: "it was okay"
"watched breaking bad s1e3" → add_media, type: tv, title: "Breaking Bad"
"remind me to call mom tomorrow" → add_task, text: "call mom"
"what do I have to do today" → query_tasks, date: today
"brain dump: feeling overwhelmed" → add_note, text: "feeling overwhelmed"
"wrote today" → add_streak_log, streak_name: "writing"
"energy is a 4" → add_health, tracker: energy, value: 4
"weighed 172 this morning" → add_health, tracker: weight, value: 172`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key":         ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type":      "application/json"
    },
    body: JSON.stringify({
      model:      "claude-opus-4-5",
      max_tokens: 512,
      system:     systemPrompt,
      messages:   [{ role: "user", content: smsText }]
    })
  });

  const json = await res.json();
  const raw  = json.content?.[0]?.text?.trim() ?? "{}";

  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("Claude parse error:", raw);
    return { action: "unknown", reply: "Sorry, I didn't understand that.", data: {} };
  }
}

/* =========================================================
   TMDB POSTER FETCH
   Looks up a movie/show title and returns poster + metadata
   ========================================================= */

async function fetchTMDB(title, type) {
  const mediaType = type === "tv" ? "tv" : "movie";
  const url = `https://api.themoviedb.org/3/search/${mediaType}?query=${encodeURIComponent(title)}&api_key=${process.env.TMDB_API_KEY}`;
  const res  = await fetch(url);
  const json = await res.json();
  const hit  = json.results?.[0];
  if (!hit) return null;
  return {
    tmdb_id:    hit.id,
    title:      hit.title || hit.name,
    poster_url: hit.poster_path ? `https://image.tmdb.org/t/p/w500${hit.poster_path}` : null,
    year:       (hit.release_date || hit.first_air_date || "").slice(0, 4)
  };
}

/* =========================================================
   ACTION HANDLERS
   Each function receives the parsed `data` object from
   Claude and updates Supabase accordingly.
   ========================================================= */

async function handleAddHealth(data) {
  const health = (await dbLoad("health"))?.data ?? {};
  const { tracker, date, value, note } = data;

  if (!health[tracker]) health[tracker] = {};
  health[tracker][date] = { value, note: note || "", logged_at: new Date().toISOString() };

  await dbSave("health", health);
}

async function handleAddMedia(data) {
  const history = (await dbLoad("history"))?.data ?? {};
  const { type, title, review, rating, date } = data;

  // Try to fetch poster from TMDB
  let meta = null;
  if (process.env.TMDB_API_KEY) {
    meta = await fetchTMDB(title, type);
  }

  const key   = type === "tv" ? "tv" : "movies";
  const entry = {
    title:      meta?.title || title,
    type,
    date,
    review:     review || "",
    rating:     rating || null,
    poster_url: meta?.poster_url || null,
    tmdb_id:    meta?.tmdb_id || null,
    year:       meta?.year || null,
    added_via:  "sms"
  };

  if (!history[key]) history[key] = [];
  history[key].push(entry);

  await dbSave("history", history);
  return meta?.title || title; // return resolved title for reply
}

async function handleAddTask(data) {
  const tasks = (await dbLoad("tasks"))?.data ?? [];
  tasks.push({
    text:    data.text,
    date:    data.date || null,
    done:    false,
    added_via: "sms",
    created_at: new Date().toISOString()
  });
  await dbSave("tasks", tasks);
}

async function handleAddNote(data) {
  const notes = (await dbLoad("notes"))?.data ?? {};
  const { date, text } = data;
  if (!notes[date]) notes[date] = [];
  notes[date].push({ text, created_at: new Date().toISOString() });
  await dbSave("notes", notes);
}

async function handleQueryTasks(data) {
  const tasks = (await dbLoad("tasks"))?.data ?? [];
  const today = data.date;
  const due   = tasks.filter(t => !t.done && (!t.date || t.date === today));
  if (!due.length) return "No tasks for today!";
  return due.map((t, i) => `${i + 1}. ${t.text}`).join("\n").slice(0, 155);
}

async function handleAddStreakLog(data) {
  const streaks = (await dbLoad("streaks"))?.data ?? [];
  const match   = streaks.find(s =>
    s.name?.toLowerCase().includes(data.streak_name.toLowerCase())
  );
  if (!match) return false;

  if (!match.logs) match.logs = [];
  match.logs.push(data.date);
  await dbSave("streaks", streaks);
  return match.name;
}

/* =========================================================
   TWILIO WEBHOOK  — POST /sms
   ========================================================= */

app.post("/sms", async (req, res) => {
  // Always respond to Twilio immediately (it times out at 15s)
  res.set("Content-Type", "text/xml");

  const from = req.body.From;
  const body = req.body.Body?.trim();

  // Security: only accept texts from your number
  if (from !== MY_PHONE) {
    console.warn("Blocked message from:", from);
    res.send("<Response></Response>");
    return;
  }

  console.log("Incoming SMS:", body);

  let replyText = "Done!";

  try {
    const parsed = await parseIntent(body);
    const { action, reply, data } = parsed;

    // Use Claude's reply as the base, but we may override for richer info
    replyText = reply || "Done!";

    if (action === "add_health") {
      await handleAddHealth(data);
    }
    else if (action === "add_media") {
      const resolvedTitle = await handleAddMedia(data);
      replyText = `Added "${resolvedTitle}" to your ${data.type === "tv" ? "TV" : "Movies"} log.`;
      if (data.rating) replyText += ` Rated ${data.rating}/5.`;
    }
    else if (action === "add_task") {
      await handleAddTask(data);
    }
    else if (action === "add_note") {
      await handleAddNote(data);
    }
    else if (action === "query_tasks") {
      replyText = await handleQueryTasks(data);
    }
    else if (action === "add_streak_log") {
      const name = await handleAddStreakLog(data);
      replyText = name ? `Logged "${name}" streak for today!` : `Couldn't find that streak.`;
    }
  } catch (err) {
    console.error("Handler error:", err);
    replyText = "Something went wrong. Try again.";
  }

  // Send reply SMS
  try {
    await twilioClient.messages.create({
      body: replyText,
      from: TWILIO_NUMBER,
      to:   MY_PHONE
    });
  } catch (e) {
    console.error("Twilio reply error:", e);
  }

  res.send("<Response></Response>");
});

/* Health check */
app.get("/", (req, res) => res.send("SMS server running."));

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
