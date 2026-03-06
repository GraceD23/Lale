
/* =========================================================
   STREAKS.JS
   ---------------------------------------------------------
   This file controls STARTER streak behavior for:
   - the homepage Streaks dropdown
   - future support for the full Streaks page

   Current starter responsibilities:
   - build streak rows using starter data
   - support text-star display for now
   - make it easy to replace stars with your own PNG later
   - separate homepage weekly streak display behavior from the
     future full Streaks page logic

   FUTURE responsibilities:
   - track real streak completions by day
   - reset homepage streak display weekly on Sunday at midnight
   - keep full streak history without deleting old streaks
   - show filled / unfilled stars on the full Streaks page
   - sync streak-enabled task completions into streak history

   IMPORTANT:
   This file handles STREAK DISPLAY behavior only.
   It does NOT create the full Streaks page yet.
   ========================================================= */


/* =========================================================
   START AFTER PAGE LOAD
   ---------------------------------------------------------
   Waits until the page HTML is fully loaded before trying
   to build or update streak rows.
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  initializeStreaks(); /* Starts homepage streak setup after page HTML is ready */
});


/* =========================================================
   STARTER STREAK DATA
   ---------------------------------------------------------
   This is temporary demo data so the homepage Streaks dropdown
   can show something useful right now.

   LATER:
   Replace this with real saved streak data from storage.
   ========================================================= */

const STARTER_STREAK_DATA = [
  {
    id: "vitamin", /* Unique starter ID for this streak */
    name: "Vitamin", /* Visible streak name shown in the UI */
    weeklyEarnedCount: 3, /* Number of filled stars shown in the weekly homepage view */
    lifetimePattern: "★★★☆☆☆☆", /* Placeholder future full-page pattern example */
    isActive: true /* Starter flag showing this streak currently exists */
  },
  {
    id: "wash-car", /* Unique starter ID for the wash car streak */
    name: "Wash car", /* Visible task/streak name */
    weeklyEarnedCount: 1, /* One completed streak day in the current weekly starter view */
    lifetimePattern: "★☆☆", /* Placeholder future full-page running visual example */
    isActive: true /* Starter active flag */
  }
];


/* =========================================================
   MAIN INITIALIZER
   ---------------------------------------------------------
   Builds the homepage streak rows and exposes helper functions
   so later scripts can update streaks without rewriting code.
   ========================================================= */

function initializeStreaks() {
  exposeStreakHelpers(); /* Makes helper functions available to other JS files later */
  renderHomepageStreaks(); /* Builds the homepage streak rows */
  logStreakStartupSummary(); /* Prints a simple debug summary in the browser console */
}


/* =========================================================
   EXPOSE HELPERS
   ---------------------------------------------------------
   These functions are attached to window so future files like:
   - tasks.js
   - brain-dump.js
   - add-system.js

   can update streak displays without duplicating logic.
   ========================================================= */

function exposeStreakHelpers() {
  window.renderHomepageStreaks = renderHomepageStreaks; /* Lets other files rebuild the homepage streak list */
  window.addStarterStreak = addStarterStreak; /* Lets future files add a new starter streak row */
  window.incrementStarterStreak = incrementStarterStreak; /* Lets future files increase the weekly count for a streak */
  window.buildStarDisplay = buildStarDisplay; /* Lets future files reuse the star rendering logic */
}


/* =========================================================
   RENDER HOMEPAGE STREAKS
   ---------------------------------------------------------
   Builds all homepage streak rows inside the Streaks dropdown
   using the current starter streak data.
   ========================================================= */

function renderHomepageStreaks() {
  const streaksContainer = document.getElementById("streaks-dropdown-content"); /* Finds the homepage dropdown content area */

  if (!streaksContainer) {
    return; /* Stops safely if the dropdown content area is missing */
  }

  streaksContainer.innerHTML = ""; /* Clears old streak rows before rebuilding them */

  const activeStreaks = STARTER_STREAK_DATA.filter(function (streak) {
    return streak.isActive; /* Keeps only currently active starter streaks */
  });

  if (activeStreaks.length === 0) {
    renderEmptyStreakState(streaksContainer); /* Shows a helpful message if no streaks exist yet */
    return;
  }

  activeStreaks.forEach(function (streak) {
    const streakRow = buildHomepageStreakRow(streak); /* Builds one homepage streak row */
    streaksContainer.appendChild(streakRow); /* Inserts that row into the dropdown content */
  });
}


/* =========================================================
   BUILD HOMEPAGE STREAK ROW
   ---------------------------------------------------------
   Creates one reusable streak row element containing:
   - streak name on the left
   - stars on the right

   This matches your homepage rule:
   - show tracker name + stars
   ========================================================= */

function buildHomepageStreakRow(streak) {
  const row = document.createElement("div"); /* Creates the outer row wrapper */
  row.className = "streak-row"; /* Applies shared streak row styling */
  row.setAttribute("data-streak-id", streak.id); /* Stores the streak ID on the row for future updates */

  const nameSpan = document.createElement("span"); /* Creates the visible streak name */
  nameSpan.className = "streak-name"; /* Shared class for streak name styling */
  nameSpan.textContent = streak.name; /* Shows the streak name text */

  const starsSpan = document.createElement("span"); /* Creates the star display area */
  starsSpan.className = "streak-stars"; /* Shared class for the streak star area */
  starsSpan.setAttribute("aria-label", streak.name + " weekly stars"); /* Accessibility label describing the star display */
  starsSpan.innerHTML = buildStarDisplay(streak.weeklyEarnedCount); /* Builds the current weekly star display */

  row.appendChild(nameSpan); /* Adds the name to the row */
  row.appendChild(starsSpan); /* Adds the stars to the row */

  return row; /* Returns the finished streak row element */
}


/* =========================================================
   BUILD STAR DISPLAY
   ---------------------------------------------------------
   Builds the visible stars for a streak row.

   Current behavior:
   - if custom star images are NOT enabled, use text stars
   - if custom star images ARE enabled, build img tags using
     the configured star asset path

   This is written to make your later PNG replacement easy.
   ========================================================= */

function buildStarDisplay(starCount) {
  const count = Number.isFinite(starCount) ? Math.max(0, starCount) : 0; /* Safely converts the provided count into a usable non-negative number */

  if (shouldUseCustomStarImage()) {
    return buildImageStarDisplay(count); /* Uses image-based stars if enabled in config.js */
  }

  return buildTextStarDisplay(count); /* Uses text-based stars in the starter version */
}


/* =========================================================
   BUILD TEXT STAR DISPLAY
   ---------------------------------------------------------
   Creates simple text stars for the starter version.
   Example for count 3:
   ★★★
   ========================================================= */

function buildTextStarDisplay(starCount) {
  const textStar = getConfiguredTextStar(); /* Reads the configured fallback text star */
  return textStar.repeat(starCount); /* Repeats the star character the requested number of times */
}


/* =========================================================
   BUILD IMAGE STAR DISPLAY
   ---------------------------------------------------------
   Creates HTML using image tags so later you can replace the
   star PNG in one place and the site can reuse it.

   This only runs when config.js says image stars are enabled.
   ========================================================= */

function buildImageStarDisplay(starCount) {
  const starPath = getConfiguredStarPath(); /* Reads the configured star image file path */

  let html = ""; /* Will collect the repeated star image tags */

  for (let index = 0; index < starCount; index += 1) {
    html += `
      <img
        class="streak-star-image"
        src="${escapeAttribute(starPath)}"
        alt="Star"
      />
    `; /* Adds one star image tag per earned star */
  }

  return html; /* Returns the completed HTML string */
}


/* =========================================================
   EMPTY STREAK STATE
   ---------------------------------------------------------
   Shows a helpful message if there are no active streaks yet.
   ========================================================= */

function renderEmptyStreakState(streaksContainer) {
  const emptyMessage = document.createElement("p"); /* Creates a short fallback message */
  emptyMessage.className = "streak-empty-message"; /* Class reserved for future empty-state styling */
  emptyMessage.textContent = "No streaks yet."; /* Simple starter empty-state text */

  streaksContainer.appendChild(emptyMessage); /* Inserts the empty-state message into the dropdown */
}


/* =========================================================
   ADD STARTER STREAK
   ---------------------------------------------------------
   Adds a new streak into the temporary starter data array and
   rebuilds the homepage dropdown display.

   This helper prepares for future Add page and Brain Dump use.
   ========================================================= */

function addStarterStreak(streakName, weeklyEarnedCount = 0) {
  const cleanedName = typeof streakName === "string" ? streakName.trim() : ""; /* Cleans the provided streak name */

  if (cleanedName === "") {
    return; /* Stops if no usable name was provided */
  }

  const newStreak = {
    id: buildStarterStreakId(cleanedName), /* Creates a simple ID from the provided name */
    name: cleanedName, /* Stores the visible streak name */
    weeklyEarnedCount: Math.max(0, Number(weeklyEarnedCount) || 0), /* Stores the starting weekly star count */
    lifetimePattern: "", /* Placeholder for future lifetime star history */
    isActive: true /* Marks the new starter streak as active */
  };

  STARTER_STREAK_DATA.push(newStreak); /* Adds the new streak into the temporary starter data */
  renderHomepageStreaks(); /* Rebuilds the homepage streak rows so the new streak appears */
}


/* =========================================================
   INCREMENT STARTER STREAK
   ---------------------------------------------------------
   Increases the weekly earned star count for one starter streak
   and rebuilds the homepage dropdown display.

   This will be useful later when a streak-enabled task is
   completed.
   ========================================================= */

function incrementStarterStreak(streakId) {
  const matchingStreak = STARTER_STREAK_DATA.find(function (streak) {
    return streak.id === streakId; /* Finds the streak that matches the provided ID */
  });

  if (!matchingStreak) {
    return; /* Stops safely if no matching streak exists */
  }

  matchingStreak.weeklyEarnedCount += 1; /* Adds one earned weekly star to the matched streak */
  renderHomepageStreaks(); /* Rebuilds the homepage streak display so the new count appears */
}


/* =========================================================
   BUILD STARTER STREAK ID
   ---------------------------------------------------------
   Converts a visible name into a simple ID string.
   Example:
   "Wash car" -> "wash-car"
   ========================================================= */

function buildStarterStreakId(streakName) {
  return streakName
    .toLowerCase() /* Makes the ID lowercase for consistency */
    .replace(/[^a-z0-9]+/g, "-") /* Replaces spaces/symbols with dashes */
    .replace(/^-+|-+$/g, ""); /* Trims extra dashes from the start/end */
}


/* =========================================================
   CONFIG HELPERS
   ---------------------------------------------------------
   Safely read streak-related settings from config.js.
   ========================================================= */

function shouldUseCustomStarImage() {
  if (window.getConfig) {
    return Boolean(window.getConfig("useCustomStarImage")); /* Reads whether image stars should be used */
  }

  return false; /* Safe fallback: use text stars if config.js is unavailable */
}

function getConfiguredStarPath() {
  if (window.getConfig) {
    return window.getConfig("starIconPath") || "assets/icons/star-default.png"; /* Reads the configured star image path */
  }

  return "assets/icons/star-default.png"; /* Safe fallback star image path */
}

function getConfiguredTextStar() {
  if (window.getConfig) {
    return window.getConfig("starFallbackText") || "★"; /* Reads the configured text star character */
  }

  return "★"; /* Safe fallback text star */
}


/* =========================================================
   SAFE ATTRIBUTE ESCAPE
   ---------------------------------------------------------
   Escapes attribute values used inside generated HTML.
   ========================================================= */

function escapeAttribute(value) {
  const temporaryElement = document.createElement("div"); /* Creates a temporary safe element */
  temporaryElement.textContent = value; /* Stores the raw attribute text safely */
  return temporaryElement.innerHTML.replace(/"/g, "&quot;"); /* Returns an attribute-safe string */
}


/* =========================================================
   STARTUP DEBUG SUMMARY
   ---------------------------------------------------------
   Prints a simple streak summary in the browser console
   during the starter build phase.
   ========================================================= */

function logStreakStartupSummary() {
  console.log("Streaks initialized."); /* Confirms the streak script ran */
  console.log("Using image stars:", shouldUseCustomStarImage()); /* Shows whether stars are currently text or image based */
  console.log("Starter streak count:", STARTER_STREAK_DATA.length); /* Shows how many starter streaks are loaded */
}
