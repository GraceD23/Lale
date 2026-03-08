
/* =========================================================
   AUTH.JS
   ---------------------------------------------------------
   This file controls the PASSCODE LOGIN screen behavior.

   Current starter responsibilities:
   - create an iPhone-style passcode overlay on top of the page
   - show filled / unfilled circles as digits are entered
   - prevent the site content from being used until the correct
     numeric passcode is entered
   - require passcode entry every time the page is opened
   - support keypad button input and keyboard number input

   IMPORTANT:
   This starter version stores the demo passcode in this file
   so the UI can be tested immediately.

   LATER:
   The real passcode should be validated by the backend
   (Cloudflare Worker) so the secret is not exposed in frontend code.
   ========================================================= */


/* =========================================================
   START AFTER PAGE LOAD
   ---------------------------------------------------------
   Waits for the HTML page to fully load before creating the
   passcode overlay and wiring up its behavior.
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  initializeAuthLockScreen(); /* Starts the lock screen setup once the page HTML is ready */
});


/* =========================================================
   DEMO PASSCODE
   ---------------------------------------------------------
   This is ONLY for the starter front-end build so you can test
   the lock screen behavior immediately.

   Replace/remove this later when backend validation is added.
   ========================================================= */

const DEMO_PASSCODE = "123456"; /* Demo numeric code for testing the starter lock screen UI */
const SESSION_UNLOCK_KEY = "productivitySiteUnlocked"; /* temporary unlock storage key */
const SESSION_UNLOCK_EXPIRES_KEY = "productivitySiteUnlockExpires"; /* unlock expiration timestamp key */


/* =========================================================
   MAIN INITIALIZER
   ---------------------------------------------------------
   Creates the passcode overlay, injects it into the page,
   updates the circles, and attaches keypad/keyboard behavior.
   ========================================================= */

function initializeAuthLockScreen() {
  const appShell = document.getElementById("app-shell"); /* Main visible homepage wrapper */

   const rememberSession = window.getConfig && window.getConfig("rememberSession"); /* checks whether temporary unlock is enabled */
const unlockFlag = localStorage.getItem(SESSION_UNLOCK_KEY) === "true"; /* reads prior unlock state */
const unlockExpires = Number(localStorage.getItem(SESSION_UNLOCK_EXPIRES_KEY) || "0"); /* reads unlock expiration timestamp */
const sessionStillValid = unlockFlag && Date.now() < unlockExpires; /* checks whether unlock window is still active */

if (rememberSession && sessionStillValid) {
  unlockAppContent(); /* skips passcode if unlock window is still valid */
  return;
}


  if (!appShell) {
    return; /* Stops safely if the expected main app wrapper is not present */
  }

  createLockScreenOverlay(); /* Builds and inserts the full-screen lock overlay */
  updatePasscodeCircles(); /* Draws the correct number of filled/unfilled circles */
  attachKeypadHandlers(); /* Connects click behavior for keypad buttons */
  attachKeyboardHandlers(); /* Allows number entry from a physical keyboard too */
  lockAppContent(appShell); /* Hides interaction with the dashboard until the correct passcode is entered */
   document.body.classList.add("auth-locked"); /* prevents scrolling while lock screen is active */
}


/* =========================================================
   CREATE LOCK SCREEN OVERLAY
   ---------------------------------------------------------
   Builds the full-screen passcode overlay directly with JS so
   you do not have to keep rewriting index.html just to adjust
   this feature later.

   This overlay sits on top of the page until unlocked.
   ========================================================= */

function createLockScreenOverlay() {
  const existingOverlay = document.getElementById("auth-lock-overlay"); /* Checks whether the overlay already exists */

  if (existingOverlay) {
    return; /* Prevents creating duplicate lock overlays if the initializer runs again */
  }

  const overlay = document.createElement("section"); /* Creates the full-screen lock screen wrapper */
  overlay.id = "auth-lock-overlay"; /* ID used for future styling and JS targeting */
  overlay.className = "auth-lock-overlay"; /* CSS class for future lock-screen styling */
  overlay.setAttribute("aria-label", "Passcode lock screen"); /* Accessibility label for the lock screen */

  overlay.innerHTML = `
    <!-- Passcode card centered on screen -->
    <div class="auth-lock-card">

      <!-- Lock screen title -->
      <h1 class="auth-lock-title">Enter Passcode</h1>

      <!-- Small helper text under the title -->
      <p class="auth-lock-subtitle">Enter your code to open the dashboard.</p>

      <!-- Passcode circle display; circles fill as numbers are typed -->
      <div id="auth-passcode-circles" class="auth-passcode-circles" aria-label="Passcode entry status"></div>

      <!-- Error message area shown when passcode is incorrect -->
      <p id="auth-error-message" class="auth-error-message" hidden>Incorrect passcode. Try again.</p>

      <!-- iPhone-style keypad -->
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
  `; /* HTML structure for the starter passcode screen */

  document.body.appendChild(overlay); /* Inserts the lock screen on top of the whole page */
}


/* =========================================================
   LOCK APP CONTENT
   ---------------------------------------------------------
   Prevents interaction with the underlying page until the
   correct passcode is entered.

   The overlay blocks taps visually, and pointer-events / aria
   settings make the app content effectively locked.
   ========================================================= */

function lockAppContent(appShell) {
  appShell.setAttribute("aria-hidden", "true"); /* Hides app content from assistive tech until unlocked */
  appShell.style.pointerEvents = "none"; /* Prevents clicking underlying page content while locked */
  appShell.style.userSelect = "none"; /* Prevents selecting text behind the lock screen */
}


/* =========================================================
   UNLOCK APP CONTENT
   ---------------------------------------------------------
   Restores interaction with the dashboard after successful
   passcode entry and removes the lock overlay.
   ========================================================= */

function unlockAppContent() {
  const appShell = document.getElementById("app-shell"); /* Main dashboard wrapper */
  const overlay = document.getElementById("auth-lock-overlay"); /* Full-screen lock overlay */

  if (appShell) {
    appShell.removeAttribute("aria-hidden"); /* Makes the dashboard visible to assistive tech again */
    appShell.style.pointerEvents = ""; /* Restores normal click/tap interaction */
    appShell.style.userSelect = ""; /* Restores normal text selection */
  }

  if (overlay) {
    overlay.remove(); /* Removes the full-screen lock overlay after successful login */
  }
}


/* =========================================================
   PASSCODE STATE
   ---------------------------------------------------------
   Stores the digits currently typed into the passcode screen.
   ========================================================= */

let currentPasscodeInput = ""; /* Holds the current typed digits before validation */


/* =========================================================
   ATTACH KEYPAD HANDLERS
   ---------------------------------------------------------
   Connects click behavior for every keypad button:
   - number buttons add digits
   - delete button removes the last digit
   ========================================================= */

function attachKeypadHandlers() {
  const keypadButtons = document.querySelectorAll(".auth-keypad-button"); /* Finds every keypad button on the lock screen */

  keypadButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const digit = button.getAttribute("data-auth-digit"); /* Reads number value if this is a digit button */
      const isDelete = button.getAttribute("data-auth-delete") === "true"; /* Detects whether this is the delete button */

      if (isDelete) {
        removeLastPasscodeDigit(); /* Removes the most recent digit when delete is tapped */
        return;
      }

      if (digit !== null) {
        appendPasscodeDigit(digit); /* Adds the tapped digit into the current passcode input */
      }
    });
  });
}


/* =========================================================
   ATTACH KEYBOARD HANDLERS
   ---------------------------------------------------------
   Allows keyboard number entry in addition to tapping the
   on-screen keypad. Helpful when testing on desktop.
   ========================================================= */

function attachKeyboardHandlers() {
  document.addEventListener("keydown", function (event) {
    const overlay = document.getElementById("auth-lock-overlay"); /* Checks whether the lock screen is still active */

    if (!overlay) {
      return; /* Stops if the dashboard is already unlocked */
    }

    if (/^\d$/.test(event.key)) {
      appendPasscodeDigit(event.key); /* Adds keyboard-entered number keys */
      return;
    }

    if (event.key === "Backspace") {
      removeLastPasscodeDigit(); /* Supports Backspace for deleting the last digit */
    }
  });
}


/* =========================================================
   APPEND PASSCODE DIGIT
   ---------------------------------------------------------
   Adds one digit to the current passcode input if the maximum
   configured length has not been reached.
   ========================================================= */

function appendPasscodeDigit(digit) {
  const maxLength = getPasscodeLength(); /* Reads passcode length from config.js */

  if (currentPasscodeInput.length >= maxLength) {
    return; /* Prevents typing more digits than the configured passcode length */
  }

  clearAuthError(); /* Removes any old incorrect-passcode error as the user types again */
  currentPasscodeInput += digit; /* Adds the new digit to the passcode */
  updatePasscodeCircles(); /* Refreshes the filled/unfilled circles */

  if (currentPasscodeInput.length === maxLength) {
    validatePasscode(); /* Automatically checks the code as soon as the final digit is entered */
  }
}


/* =========================================================
   REMOVE LAST PASSCODE DIGIT
   ---------------------------------------------------------
   Deletes the most recently typed digit from the current input.
   ========================================================= */

function removeLastPasscodeDigit() {
  if (currentPasscodeInput.length === 0) {
    return; /* Stops safely if there is nothing to delete */
  }

  currentPasscodeInput = currentPasscodeInput.slice(0, -1); /* Removes the last typed digit */
  updatePasscodeCircles(); /* Refreshes the visible circles after deletion */
}


/* =========================================================
   UPDATE PASSCODE CIRCLES
   ---------------------------------------------------------
   Draws the passcode circles using the configured passcode
   length and current typed digit count.

   Filled circle = typed digit
   Empty circle = remaining slot
   ========================================================= */

function updatePasscodeCircles() {
  const circlesContainer = document.getElementById("auth-passcode-circles"); /* Finds the visual circle row */
  const totalCircles = getPasscodeLength(); /* Reads the configured number of passcode digits */

  if (!circlesContainer) {
    return; /* Stops safely if the circle container is not found */
  }

  circlesContainer.innerHTML = ""; /* Clears the old circles before redrawing them */

  for (let index = 0; index < totalCircles; index += 1) {
    const circle = document.createElement("span"); /* Creates one visual circle */
    circle.className = "auth-passcode-circle"; /* Shared class for all passcode circles */

    const shouldBeFilled = index < currentPasscodeInput.length; /* Determines whether this circle should show as filled */
    circle.textContent = shouldBeFilled ? "●" : "○"; /* Filled circles show typed progress; empty circles show remaining slots */

    circlesContainer.appendChild(circle); /* Adds the circle to the row */
  }
}


/* =========================================================
   VALIDATE PASSCODE
   ---------------------------------------------------------
   Compares the typed passcode with the starter demo passcode.

   LATER:
   Replace this with secure backend validation.
   ========================================================= */

function validatePasscode() {
  if (currentPasscodeInput === DEMO_PASSCODE) {
    unlockAppContent(); /* Unlocks the dashboard when the correct passcode is entered */
    return;
  }

  showAuthError(); /* Shows the incorrect-passcode message */
  resetPasscodeInput(); /* Clears the circles so the user can try again */
}


/* =========================================================
   SHOW AUTH ERROR
   ---------------------------------------------------------
   Displays the incorrect passcode message.
   ========================================================= */

function showAuthError() {
  const errorMessage = document.getElementById("auth-error-message"); /* Finds the error text area on the lock screen */

  if (!errorMessage) {
    return; /* Stops safely if the error element is not found */
  }

  errorMessage.removeAttribute("hidden"); /* Makes the incorrect-passcode message visible */
}


/* =========================================================
   CLEAR AUTH ERROR
   ---------------------------------------------------------
   Hides the incorrect passcode message once the user starts
   typing a new attempt.
   ========================================================= */

function clearAuthError() {
  const errorMessage = document.getElementById("auth-error-message"); /* Finds the error text area on the lock screen */

  if (!errorMessage) {
    return; /* Stops safely if the error element is not found */
  }

  errorMessage.setAttribute("hidden", ""); /* Hides the error message */
}


/* =========================================================
   RESET PASSCODE INPUT
   ---------------------------------------------------------
   Clears the current typed passcode and redraws the circles.
   ========================================================= */

function resetPasscodeInput() {
  currentPasscodeInput = ""; /* Clears all typed digits */
  updatePasscodeCircles(); /* Refreshes the circle display back to empty */
}


/* =========================================================
   GET PASSCODE LENGTH
   ---------------------------------------------------------
   Safely reads the configured passcode length from config.js.
   Falls back to 6 if the config is missing.
   ========================================================= */

function getPasscodeLength() {
  if (window.getConfig) {
    return window.getConfig("passcodeLength") || 6; /* Uses configured passcode length when available */
  }

  return 6; /* Safe fallback if config.js has not loaded */
}
