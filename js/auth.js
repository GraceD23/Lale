/* =========================================================
   AUTH.JS
   ---------------------------------------------------------
   This file controls the PASSCODE LOGIN screen behavior.
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  initializeAuthLockScreen();
});

const DEMO_PASSCODE = "2604";
const SESSION_UNLOCK_KEY = "lale_unlocked";
const SESSION_UNLOCK_EXPIRES_KEY = "lale_unlock_expires";
const SESSION_DURATION_MS = 60 * 60 * 1000; /* 1 hour */

function initializeAuthLockScreen() {
  const appShell = document.getElementById("app-shell");

  /* Check if already unlocked within the session window */
  const unlockFlag = localStorage.getItem(SESSION_UNLOCK_KEY) === "true";
  const unlockExpires = Number(localStorage.getItem(SESSION_UNLOCK_EXPIRES_KEY) || "0");
  if (unlockFlag && Date.now() < unlockExpires) {
    /* Still within unlock window — skip passcode */
    if (appShell) appShell.style.visibility = "";
    return;
  }

  if (!appShell) { return; }

  createLockScreenOverlay();
  updatePasscodeCircles();
  attachKeypadHandlers();
  attachKeyboardHandlers();
  lockAppContent(appShell);
  document.body.classList.add("auth-locked");
}

function createLockScreenOverlay() {
  const existingOverlay = document.getElementById("auth-lock-overlay");
  if (existingOverlay) { return; }

  const overlay = document.createElement("section");
  overlay.id = "auth-lock-overlay";
  overlay.className = "auth-lock-overlay";
  overlay.setAttribute("aria-label", "Passcode lock screen");

  /* Inline styles guarantee full-screen coverage even if CSS loads late or has specificity issues */
  overlay.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    min-height: 100vh !important;
    background-color: #F7F1E8 !important;
    z-index: 9999 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    overflow: hidden !important;
    touch-action: none !important;
  `;

  overlay.innerHTML = `
    <div class="auth-lock-card">
      <h1 class="auth-lock-title">Enter Passcode</h1>
      <div id="auth-passcode-circles" class="auth-passcode-circles" aria-label="Passcode entry status"></div>
      <p id="auth-error-message" class="auth-error-message" hidden>Incorrect passcode. Try again.</p>
      <div class="auth-keypad" aria-label="Numeric keypad">
        <button class="auth-keypad-button" type="button" data-auth-digit="1">1</button>
        <button class="auth-keypad-button" type="button" data-auth-digit="2">2</button>
        <button class="auth-keypad-button" type="button" data-auth-digit="3">3</button>
        <button class="auth-keypad-button" type="button" data-auth-digit="4">4</button>
        <button class="auth-keypad-button" type="button" data-auth-digit="5">5</button>
        <button class="auth-keypad-button" type="button" data-auth-digit="6">6</button>
        <button class="auth-keypad-button" type="button" data-auth-digit="7">7</button>
        <button class="auth-keypad-button" type="button" data-auth-digit="8">8</button>
        <button class="auth-keypad-button" type="button" data-auth-digit="9">9</button>
        <div class="auth-keypad-spacer" aria-hidden="true"></div>
        <button class="auth-keypad-button" type="button" data-auth-digit="0">0</button>
        <button class="auth-keypad-button auth-keypad-delete-button" type="button" data-auth-delete="true">⌫</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
}

function lockAppContent(appShell) {
  appShell.setAttribute("aria-hidden", "true");
  appShell.style.visibility = "hidden"; /* hides content visually — overlay handles blocking interaction */
}

function unlockAppContent() {
  const appShell = document.getElementById("app-shell");
  const overlay = document.getElementById("auth-lock-overlay");

  if (appShell) {
    appShell.removeAttribute("aria-hidden");
    appShell.style.visibility = "";
  }

  if (overlay) { overlay.remove(); }
  document.body.classList.remove("auth-locked");
}

let currentPasscodeInput = "";

function attachKeypadHandlers() {
  const keypadButtons = document.querySelectorAll(".auth-keypad-button");

  keypadButtons.forEach(function (button) {
    /* touchstart for instant full-bubble response on iPhone — no zoom, no delay */
    button.addEventListener("touchstart", function (e) {
      e.preventDefault();
      const digit = button.getAttribute("data-auth-digit");
      const isDelete = button.getAttribute("data-auth-delete") === "true";
      if (isDelete) { removeLastPasscodeDigit(); return; }
      if (digit !== null) { appendPasscodeDigit(digit); }
    });

    /* click fallback for desktop */
    button.addEventListener("click", function (e) {
      /* skip if already handled by touchstart */
      if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;
      const digit = button.getAttribute("data-auth-digit");
      const isDelete = button.getAttribute("data-auth-delete") === "true";
      if (isDelete) { removeLastPasscodeDigit(); return; }
      if (digit !== null) { appendPasscodeDigit(digit); }
    });
  });
}

function attachKeyboardHandlers() {
  document.addEventListener("keydown", function (event) {
    const overlay = document.getElementById("auth-lock-overlay");
    if (!overlay) { return; }
    if (/^\d$/.test(event.key)) { appendPasscodeDigit(event.key); return; }
    if (event.key === "Backspace") { removeLastPasscodeDigit(); }
  });
}

function appendPasscodeDigit(digit) {
  const maxLength = getPasscodeLength();
  if (currentPasscodeInput.length >= maxLength) { return; }
  clearAuthError();
  currentPasscodeInput += digit;
  updatePasscodeCircles();
  if (currentPasscodeInput.length === maxLength) { validatePasscode(); }
}

function removeLastPasscodeDigit() {
  if (currentPasscodeInput.length === 0) { return; }
  currentPasscodeInput = currentPasscodeInput.slice(0, -1);
  updatePasscodeCircles();
}

function updatePasscodeCircles() {
  const circlesContainer = document.getElementById("auth-passcode-circles");
  const totalCircles = getPasscodeLength();
  if (!circlesContainer) { return; }
  circlesContainer.innerHTML = "";
  for (let index = 0; index < totalCircles; index += 1) {
    const circle = document.createElement("span");
    circle.className = "auth-passcode-circle" + (index < currentPasscodeInput.length ? " filled" : "");
    circlesContainer.appendChild(circle);
  }
}

function validatePasscode() {
  if (currentPasscodeInput === DEMO_PASSCODE) {
    /* Save unlock for 1 hour across all pages */
    localStorage.setItem(SESSION_UNLOCK_KEY, "true");
    localStorage.setItem(SESSION_UNLOCK_EXPIRES_KEY, String(Date.now() + SESSION_DURATION_MS));
    unlockAppContent();
    return;
  }
  showAuthError();
  resetPasscodeInput();
}

function showAuthError() {
  const errorMessage = document.getElementById("auth-error-message");
  if (!errorMessage) { return; }
  errorMessage.removeAttribute("hidden");
}

function clearAuthError() {
  const errorMessage = document.getElementById("auth-error-message");
  if (!errorMessage) { return; }
  errorMessage.setAttribute("hidden", "");
}

function resetPasscodeInput() {
  currentPasscodeInput = "";
  updatePasscodeCircles();
}

function getPasscodeLength() {
  return 4; /* 2604 is a 4-digit passcode */
}
