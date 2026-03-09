/* =========================================================
   STREAKS-EDIT.JS
   - Edit Streaks panel (rename / delete)
   - Auto-fill missed days with blank stars on page load
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  fillMissedStreakDays();

  const btn = document.getElementById("streaks-edit-btn");
  if (btn) btn.addEventListener("click", openStreaksEditPanel);
});

/* =========================================================
   AUTO-FILL MISSED DAYS
   For each streak, fill any gap days since streak was created
   with { filled: false } so blank stars show automatically
   ========================================================= */

function fillMissedStreakDays() {
  if (typeof loadStreaks !== "function" || typeof saveStreaks !== "function") return;

  const streaks = loadStreaks();
  let changed = false;

  streaks.forEach(function (streak) {
    if (!streak.history || streak.history.length === 0) return;

    /* Find the date of the first history entry */
    const firstEntry = streak.history[0];
    if (!firstEntry || !firstEntry.date) return;

    const start = new Date(firstEntry.date);
    start.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    /* Build a set of days already logged (by YYYY-MM-DD) */
    const loggedDays = new Set(streak.history.map(function (e) {
      return e.date ? e.date.slice(0, 10) : null;
    }).filter(Boolean));

    /* Walk every day from start to yesterday */
    const cursor = new Date(start);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const missingEntries = [];

    while (cursor <= yesterday) {
      const dayKey = cursor.getFullYear() + "-" +
        String(cursor.getMonth()+1).padStart(2,"0") + "-" +
        String(cursor.getDate()).padStart(2,"0");

      if (!loggedDays.has(dayKey)) {
        missingEntries.push({
          date: cursor.toISOString(),
          filled: false
        });
        changed = true;
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    if (missingEntries.length > 0) {
      /* Insert missed entries in chronological order */
      streak.history = streak.history.concat(missingEntries)
        .sort(function (a, b) { return new Date(a.date) - new Date(b.date); });
    }
  });

  if (changed) {
    saveStreaks(streaks);
    /* Re-render if the full page function is available */
    if (typeof renderFullStreaksPage === "function") renderFullStreaksPage();
  }
}

/* =========================================================
   EDIT PANEL
   ========================================================= */

function openStreaksEditPanel() {
  const existing = document.getElementById("streaks-edit-panel");
  if (existing) { existing.remove(); return; }

  const streaks = typeof loadStreaks === "function" ? loadStreaks() : [];

  const panel = document.createElement("div");
  panel.id = "streaks-edit-panel";
  panel.style.cssText = `
    position:fixed;bottom:0;left:0;width:100%;max-height:70vh;overflow-y:auto;
    background:#F3EADF;border-radius:20px 20px 0 0;
    box-shadow:0 -4px 20px rgba(0,0,0,0.15);z-index:1000;
    padding:20px;box-sizing:border-box;
  `;

  panel.innerHTML = `
    <h3 style="font-family:'Josefin Sans',sans-serif;font-size:16px;font-weight:600;color:#3a2e28;margin:0 0 16px 0;">
      Edit Streaks
    </h3>
    <div id="streaks-edit-list"></div>
    <button type="button" id="streaks-edit-done"
      style="width:100%;margin-top:12px;padding:10px;border-radius:10px;
      border:1px solid #c9b49a;background:white;font-family:'Josefin Sans',sans-serif;
      font-size:14px;color:#3a2e28;cursor:pointer;">
      Done
    </button>
  `;

  const list = panel.querySelector("#streaks-edit-list");

  if (streaks.length === 0) {
    list.innerHTML = "<p style='font-size:13px;opacity:0.6;font-family:Josefin Sans,sans-serif;'>No streaks yet.</p>";
  } else {
    streaks.forEach(function (streak) {
      const row = document.createElement("div");
      row.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:10px;";
      row.innerHTML = `
        <input type="text" value="${escapeForAttr(streak.name)}" data-streak-id="${streak.id}"
          style="flex:1;padding:8px;border-radius:8px;border:1px solid #c9b49a;
          font-size:14px;font-family:'Josefin Sans',sans-serif;">
        <button type="button" data-save-streak="${streak.id}"
          style="padding:6px 12px;border-radius:8px;border:1px solid #b0977a;
          background:#b0977a;color:white;font-size:13px;cursor:pointer;
          font-family:'Josefin Sans',sans-serif;">
          Save
        </button>
        <button type="button" data-delete-streak="${streak.id}"
          style="padding:6px 10px;border-radius:8px;border:1px solid #a94442;
          background:white;color:#a94442;font-size:13px;cursor:pointer;">
          ✕
        </button>
      `;
      list.appendChild(row);
    });
  }

  /* Wire Done */
  panel.querySelector("#streaks-edit-done").addEventListener("click", function () {
    panel.remove();
  });

  /* Wire Save buttons */
  panel.querySelectorAll("[data-save-streak]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const id = btn.getAttribute("data-save-streak");
      const input = panel.querySelector("[data-streak-id='" + id + "']");
      const newName = input ? input.value.trim() : "";
      if (!newName) return;
      const streaks = loadStreaks();
      const s = streaks.find(x => x.id === id);
      if (s) {
        s.name = newName;
        saveStreaks(streaks);
        if (typeof renderFullStreaksPage === "function") renderFullStreaksPage();
        if (typeof renderHomepageStreaks === "function") renderHomepageStreaks();
      }
    });
  });

  /* Wire Delete buttons */
  panel.querySelectorAll("[data-delete-streak]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const id = btn.getAttribute("data-delete-streak");
      if (!confirm("Delete this streak and all its history?")) return;
      const streaks = loadStreaks().filter(x => x.id !== id);
      saveStreaks(streaks);
      if (typeof renderFullStreaksPage === "function") renderFullStreaksPage();
      if (typeof renderHomepageStreaks === "function") renderHomepageStreaks();
      panel.remove();
      openStreaksEditPanel(); /* Reopen with updated list */
    });
  });

  document.body.appendChild(panel);
}

function escapeForAttr(str) {
  return String(str || "").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");
}
