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
    <div style="
      width:100%;max-width:340px;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      padding:40px 20px;box-sizing:border-box;
    ">
      <h1 style="
        font-family:'Josefin Sans',sans-serif;font-size:22px;font-weight:600;
        color:#3a2e28;margin:0 0 32px 0;letter-spacing:0.02em;
      ">Enter Passcode</h1>

      <div id="auth-passcode-circles" style="
        display:flex;justify-content:center;gap:20px;margin-bottom:40px;
      "></div>

      <p id="auth-error-message" style="
        color:#a94442;font-size:14px;font-family:'Josefin Sans',sans-serif;
        margin:0 0 20px 0;display:none;
      ">Incorrect passcode. Try again.</p>

      <div style="
        display:grid;grid-template-columns:repeat(3,80px);
        gap:16px;justify-content:center;
      ">
        ${[1,2,3,4,5,6,7,8,9].map(n => `
          <button type="button" data-auth-digit="${n}" style="
            width:80px;height:80px;border-radius:50%;
            border:1.5px solid #c9b49a;background:#EFE4D9;
            font-size:28px;font-weight:400;font-family:'Josefin Sans',sans-serif;
            color:#3a2e28;cursor:pointer;display:flex;align-items:center;
            justify-content:center;-webkit-tap-highlight-color:transparent;
            box-shadow:0 2px 6px rgba(0,0,0,0.08);
          ">${n}</button>
        `).join("")}
        <div style="width:80px;height:80px;"></div>
        <button type="button" data-auth-digit="0" style="
          width:80px;height:80px;border-radius:50%;
          border:1.5px solid #c9b49a;background:#EFE4D9;
          font-size:28px;font-weight:400;font-family:'Josefin Sans',sans-serif;
          color:#3a2e28;cursor:pointer;display:flex;align-items:center;
          justify-content:center;-webkit-tap-highlight-color:transparent;
          box-shadow:0 2px 6px rgba(0,0,0,0.08);
        ">0</button>
        <button type="button" data-auth-delete="true" style="
          width:80px;height:80px;border-radius:50%;
          border:1.5px solid #c9b49a;background:transparent;
          font-size:22px;color:#3a2e28;cursor:pointer;display:flex;
          align-items:center;justify-content:center;
          -webkit-tap-highlight-color:transparent;
        ">⌫</button>
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
  const overlay = document.getElementById("auth-lock-overlay");
  if (!overlay) return;

  /* Select by data attribute — buttons have no class in the new inline design */
  const digitButtons = overlay.querySelectorAll("[data-auth-digit]");
  const deleteButtons = overlay.querySelectorAll("[data-auth-delete]");

  digitButtons.forEach(function (button) {
    button.addEventListener("touchstart", function (e) {
      e.preventDefault();
      appendPasscodeDigit(button.getAttribute("data-auth-digit"));
    }, { passive: false });

    button.addEventListener("click", function (e) {
      if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;
      appendPasscodeDigit(button.getAttribute("data-auth-digit"));
    });
  });

  deleteButtons.forEach(function (button) {
    button.addEventListener("touchstart", function (e) {
      e.preventDefault();
      removeLastPasscodeDigit();
    }, { passive: false });

    button.addEventListener("click", function (e) {
      if (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) return;
      removeLastPasscodeDigit();
    });
  });

  /* Prevent double-tap zoom on the whole overlay */
  overlay.addEventListener("touchend", function (e) {
    e.preventDefault();
  }, { passive: false });
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
  const container = document.getElementById("auth-passcode-circles");
  if (!container) return;
  container.innerHTML = "";
  for (let i = 0; i < 4; i++) {
    const dot = document.createElement("div");
    const filled = i < currentPasscodeInput.length;
    dot.style.cssText = `
      width:18px;height:18px;border-radius:50%;
      border:2px solid #b0977a;
      background:${filled ? "#b0977a" : "transparent"};
      transition:background 0.15s ease;
    `;
    container.appendChild(dot);
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
  const el = document.getElementById("auth-error-message");
  if (el) el.style.display = "block";
}

function clearAuthError() {
  const el = document.getElementById("auth-error-message");
  if (el) el.style.display = "none";
}

function resetPasscodeInput() {
  currentPasscodeInput = "";
  updatePasscodeCircles();
}

function getPasscodeLength() {
  return 4; /* 2604 is a 4-digit passcode */
}
