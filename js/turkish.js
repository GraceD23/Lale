/* =========================================================
   TURKISH.JS
   ---------------------------------------------------------
   Turkish Story Generator using Claude API.
   Generates story + vocabulary list (Turkish only) + quiz questions.
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  initializeTurkishStories();
});

let currentStoryText = "";
let currentQuizAnswers = [];

function initializeTurkishStories() {
  document.getElementById("story-generate-btn").addEventListener("click", generateStory);
  document.getElementById("story-read-btn").addEventListener("click", readStoryAloud);
  document.getElementById("show-answers-btn").addEventListener("click", showQuizAnswers);
}

/* =========================================================
   GENERATE STORY
   ========================================================= */

async function generateStory() {
  const topic = document.getElementById("story-topic").value.trim();
  const tense = document.getElementById("story-tense").value;
  const difficulty = document.getElementById("story-difficulty").value;
  const extra = document.getElementById("story-extra").value.trim();

  if (!topic) { alert("Please enter a topic first."); return; }

  const btn = document.getElementById("story-generate-btn");
  btn.textContent = "Generating...";
  btn.disabled = true;

  try {
    const result = await callTurkishAPI(topic, tense, difficulty, extra);
    displayStoryResult(result);
  } catch (err) {
    alert("Could not generate story: " + err.message);
    console.error(err);
  } finally {
    btn.textContent = "Generate Story";
    btn.disabled = false;
  }
}

async function callTurkishAPI(topic, tense, difficulty, extra) {
  const WORKER_URL = "https://holy-wind-9442.doeppg.workers.dev";

  const difficultyMap = {
    beginner: "A1 beginner level — very simple sentences, common everyday words only, max 8-10 sentences",
    elementary: "A2 elementary level — simple sentences, common vocabulary, max 10-12 sentences",
    intermediate: "B1 intermediate level — more complex sentences, wider vocabulary, max 12-15 sentences"
  };

  const tenseMap = {
    present: "present continuous tense (şimdiki zaman)",
    past: "simple past tense (geçmiş zaman -di/-ti)",
    future: "future tense (gelecek zaman -acak/-ecek)",
    mixed: "a natural mix of tenses"
  };

  const systemPrompt = `You write Turkish language learning content for beginners.

Return ONLY valid JSON — no explanation, no markdown fences.

Format:
{
  "story": "The Turkish story text here...",
  "vocabulary": [
    {"word": "pazara", "base": "pazar"},
    {"word": "gidiyor", "base": "gitmek"}
  ],
  "quiz": [
    {"question": "English comprehension question about the story?", "answer": "Answer in English"},
    {"question": "Another question?", "answer": "Answer"}
  ]
}

Rules:
- Story MUST be in Turkish only — no English in the story
- Vocabulary list: 8-12 key words as they appear in the story. Turkish word only — NO English translations
- Quiz: 3-4 comprehension questions in English, answers in English
- Keep vocabulary entries concise: just the word form used and its base/dictionary form`;

  const userPrompt = `Write a Turkish story about: ${topic}
Tense: ${tenseMap[tense] || tenseMap.present}
Level: ${difficultyMap[difficulty] || difficultyMap.beginner}
${extra ? "Extra: " + extra : ""}`;

  const response = await fetch(WORKER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }]
    })
  });

  if (!response.ok) throw new Error("API " + response.status);
  const data = await response.json();
  const clean = data.content[0].text.trim().replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

/* =========================================================
   DISPLAY RESULT
   ========================================================= */

function displayStoryResult(result) {
  currentStoryText = result.story || "";
  currentQuizAnswers = (result.quiz || []).map(q => q.answer);

  /* Story */
  const storyEl = document.getElementById("story-text");
  storyEl.textContent = currentStoryText;

  /* Vocabulary */
  const vocabEl = document.getElementById("story-vocab");
  if (result.vocabulary && result.vocabulary.length > 0) {
    vocabEl.innerHTML = result.vocabulary.map(v =>
      `<div style="padding:4px 0;border-bottom:1px solid rgba(0,0,0,0.06);">
        <strong>${escT(v.word)}</strong> <span style="opacity:0.6;font-size:12px;">← ${escT(v.base)}</span>
      </div>`
    ).join("");
  } else {
    vocabEl.textContent = "No vocabulary available.";
  }

  /* Quiz questions */
  const quizEl = document.getElementById("story-quiz");
  const answersEl = document.getElementById("quiz-answers");
  answersEl.innerHTML = "";

  if (result.quiz && result.quiz.length > 0) {
    quizEl.innerHTML = result.quiz.map((q, i) =>
      `<p style="margin-bottom:6px;"><strong>${i+1}.</strong> ${escT(q.question)}</p>`
    ).join("");

    document.getElementById("show-answers-btn").hidden = false;
  } else {
    quizEl.textContent = "No quiz questions available.";
    document.getElementById("show-answers-btn").hidden = true;
  }

  /* Show output section */
  document.getElementById("story-output-section").removeAttribute("hidden");
}

function showQuizAnswers() {
  const answersEl = document.getElementById("quiz-answers");
  const btn = document.getElementById("show-answers-btn");

  if (currentQuizAnswers.length === 0) return;

  answersEl.innerHTML = currentQuizAnswers.map((ans, i) =>
    `<p style="margin-bottom:4px;font-size:13px;"><strong>${i+1}.</strong> ${escT(ans)}</p>`
  ).join("");

  btn.hidden = true;
}

/* =========================================================
   READ ALOUD (Turkish TTS)
   ========================================================= */

function readStoryAloud() {
  if (!currentStoryText || !window.speechSynthesis) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(currentStoryText);
  utterance.lang = "tr-TR"; /* Turkish language code */
  utterance.rate = 0.85;

  const btn = document.getElementById("story-read-btn");
  btn.textContent = "🔊 Reading...";

  utterance.onend = function () { btn.textContent = "🔊 Read Aloud"; };
  utterance.onerror = function () { btn.textContent = "🔊 Read Aloud"; };

  window.speechSynthesis.speak(utterance);
}

function escT(text) {
  const d = document.createElement("div");
  d.textContent = String(text || "");
  return d.innerHTML;
}
