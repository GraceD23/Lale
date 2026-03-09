/* =========================================================
   SPELLING.JS
   ---------------------------------------------------------
   Spelling Quiz using:
   - Random Word API (free, no key needed)
   - Browser Web Speech API for text-to-speech (free, built-in)
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  initializeSpellingQuiz();
});

/* =========================================================
   STATE
   ========================================================= */

let currentWord = "";
let quizScore = 0;
let quizTotal = 0;
let currentDifficulty = "medium";
let hasSubmitted = false;

/* Word lists by difficulty (fallback if API fails) */
const WORD_LISTS = {
  easy: ["cat","dog","run","jump","play","book","tree","fish","cake","bird","home","time","rain","snow","blue"],
  medium: ["garden","simple","dinner","purple","market","happen","almost","basket","bridge","castle","frozen","jungle","mirror","office","planet"],
  hard: ["accommodate","conscience","definitely","exaggerate","fluorescent","guarantee","hierarchy","ingenious","juxtapose","knowledgeable","lieutenant","mnemonic","necessary","occurrence","perseverance"]
};

/* =========================================================
   INIT
   ========================================================= */

function initializeSpellingQuiz() {
  document.getElementById("quiz-play-btn").addEventListener("click", playCurrentWord);
  document.getElementById("quiz-submit-btn").addEventListener("click", submitAnswer);
  document.getElementById("quiz-next-btn").addEventListener("click", loadNextWord);
  document.getElementById("quiz-reset-btn").addEventListener("click", resetQuiz);

  document.getElementById("quiz-answer-input").addEventListener("keydown", function (e) {
    if (e.key === "Enter") submitAnswer();
  });

  document.querySelectorAll(".quiz-diff-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      currentDifficulty = btn.dataset.diff;
      document.querySelectorAll(".quiz-diff-btn").forEach(b => {
        b.style.background = b === btn ? "#b0977a" : "white";
        b.style.color = b === btn ? "white" : "#b0977a";
      });
      loadNextWord();
    });
  });

  /* Highlight default difficulty */
  document.querySelector(".quiz-diff-btn[data-diff='medium']").style.background = "#b0977a";
  document.querySelector(".quiz-diff-btn[data-diff='medium']").style.color = "white";

  loadNextWord();
}

/* =========================================================
   LOAD NEXT WORD
   ========================================================= */

async function loadNextWord() {
  currentWord = "";
  hasSubmitted = false;
  document.getElementById("quiz-result").textContent = "";
  document.getElementById("quiz-answer-input").value = "";
  document.getElementById("quiz-answer-input").style.borderColor = "#b0977a";
  document.getElementById("quiz-play-btn").textContent = "▶ Play Word";

  currentWord = await fetchRandomWord();
  speakWord(currentWord);
}

async function fetchRandomWord() {
  /* Difficulty-mapped word length for Datamuse API */
  const lengthMap = { easy: "max=5", medium: "min=6&max=8", hard: "min=9" };
  const param = lengthMap[currentDifficulty] || "min=5&max=8";

  try {
    const response = await fetch("https://api.datamuse.com/words?sp=*&" + param + "&max=500");
    if (!response.ok) throw new Error("API failed");
    const words = await response.json();
    const validWords = words.filter(w => /^[a-z]+$/.test(w.word) && w.word.length >= 3);
    if (validWords.length === 0) throw new Error("No words");
    const randomIndex = Math.floor(Math.random() * validWords.length);
    return validWords[randomIndex].word;
  } catch (err) {
    /* Fallback to local word list */
    const list = WORD_LISTS[currentDifficulty] || WORD_LISTS.medium;
    return list[Math.floor(Math.random() * list.length)];
  }
}

/* =========================================================
   SPEAK WORD
   ========================================================= */

function speakWord(word) {
  if (!word || !window.speechSynthesis) return;

  window.speechSynthesis.cancel(); /* Stop any previous speech */

  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-US";
  utterance.rate = 0.85; /* Slightly slower for clarity */
  utterance.pitch = 1;

  window.speechSynthesis.speak(utterance);
}

function playCurrentWord() {
  if (!currentWord) { loadNextWord(); return; }
  speakWord(currentWord);
}

/* =========================================================
   SUBMIT ANSWER
   ========================================================= */

function submitAnswer() {
  if (!currentWord || hasSubmitted) return;

  const input = document.getElementById("quiz-answer-input");
  const answer = input.value.trim().toLowerCase();
  const resultEl = document.getElementById("quiz-result");

  if (!answer) return;

  hasSubmitted = true;
  quizTotal++;

  const isCorrect = answer === currentWord.toLowerCase();

  if (isCorrect) {
    quizScore++;
    resultEl.textContent = "✓";
    resultEl.style.color = "#5a9e5a";
    input.style.borderColor = "#5a9e5a";
  } else {
    resultEl.textContent = "✗";
    resultEl.style.color = "#c0615a";
    input.style.borderColor = "#c0615a";

    /* Show correct word after wrong answer */
    setTimeout(function () {
      resultEl.textContent = "✗  →  " + currentWord;
    }, 800);
  }

  updateScore();
}

/* =========================================================
   SCORE
   ========================================================= */

function updateScore() {
  document.getElementById("quiz-score").textContent = quizScore;
  document.getElementById("quiz-total").textContent = quizTotal;
}

function resetQuiz() {
  quizScore = 0;
  quizTotal = 0;
  hasSubmitted = false;
  document.getElementById("quiz-result").textContent = "";
  updateScore();
  loadNextWord();
}
