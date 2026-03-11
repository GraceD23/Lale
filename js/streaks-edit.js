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
  panel.style.cssText = "position:fixed;bottom:0;left:0;width:100%;max-height:70vh;overflow-y:auto;background:#F3EADF;border-radius:20px 20px 0 0;box-shadow:0 -4px 20px rgba(0,0,0,0.15);z-index:2000;padding:20px;box-sizing:border-box;";

  const title = document.createElement("h3");
  title.style.cssText = "font-family:'Josefin Sans',sans-serif;font-size:16px;font-weight:600;color:#3a2e28;margin:0 0 16px 0;";
  title.textContent = "Edit Streaks";
  panel.appendChild(title);

  const list = document.createElement("div");
  panel.appendChild(list);

  /* Add new streak row */
  const addRow = document.createElement("div");
  addRow.style.cssText = "display:flex;gap:8px;margin-top:12px;";
  addRow.innerHTML = `
    <input type="text" id="streaks-new-name" placeholder="New streak name..."
      style="flex:1;padding:8px;border-radius:8px;border:1px solid #CBB7A3;font-size:14px;font-family:'Josefin Sans',sans-serif;">
    <button type="button" id="streaks-add-new"
      style="padding:8px 14px;border-radius:8px;border:1px solid #b0977a;background:#b0977a;color:white;font-size:14px;cursor:pointer;font-family:'Josefin Sans',sans-serif;">
      Add
    </button>
  `;
  panel.appendChild(addRow);

  const doneBtn = document.createElement("button");
  doneBtn.type = "button";
  doneBtn.textContent = "Done";
  doneBtn.style.cssText = "width:100%;margin-top:12px;padding:10px;border-radius:10px;border:1px solid #c9b49a;background:white;font-family:'Josefin Sans',sans-serif;font-size:14px;color:#3a2e28;cursor:pointer;";
  doneBtn.addEventListener("click", function () { panel.remove(); });
  panel.appendChild(doneBtn);

  if (streaks.length === 0) {
    const empty = document.createElement("p");
    empty.style.cssText = "font-size:13px;opacity:0.6;font-family:'Josefin Sans',sans-serif;";
    empty.textContent = "No streaks yet.";
    list.appendChild(empty);
  } else {
    streaks.forEach(function (streak) {
      const row = document.createElement("div");
      row.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:10px;";

      const input = document.createElement("input");
      input.type = "text";
      input.value = streak.name || "";
      input.style.cssText = "flex:1;padding:8px;border-radius:8px;border:1px solid #c9b49a;font-size:14px;font-family:'Josefin Sans',sans-serif;";

      const saveBtn = document.createElement("button");
      saveBtn.type = "button";
      saveBtn.textContent = "Save";
      saveBtn.style.cssText = "padding:6px 12px;border-radius:8px;border:1px solid #b0977a;background:#b0977a;color:white;font-size:13px;cursor:pointer;font-family:'Josefin Sans',sans-serif;";

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.textContent = "Delete";
      deleteBtn.style.cssText = "padding:6px 10px;border-radius:8px;border:1px solid #a94442;background:white;color:#a94442;font-size:13px;cursor:pointer;font-family:'Josefin Sans',sans-serif;";

      const sid = streak.id;

      saveBtn.addEventListener("click", function () {
        const newName = input.value.trim();
        if (!newName) return;
        const all = loadStreaks();
        const s = all.find(function (x) { return x.id === sid; });
        if (s) {
          s.name = newName;
          saveStreaks(all);
          if (typeof renderFullStreaksPage === "function") renderFullStreaksPage();
          if (typeof renderHomepageStreaks === "function") renderHomepageStreaks();
          saveBtn.textContent = "Saved!";
          setTimeout(function () { saveBtn.textContent = "Save"; }, 1500);
        }
      });

      deleteBtn.addEventListener("click", function () {
        row.style.opacity = "0.4";
        row.style.pointerEvents = "none";
        const all = loadStreaks().filter(function (x) { return x.id !== sid; });
        saveStreaks(all);
        if (typeof renderFullStreaksPage === "function") renderFullStreaksPage();
        if (typeof renderHomepageStreaks === "function") renderHomepageStreaks();
        setTimeout(function () { row.remove(); }, 400);
      });

      row.appendChild(input);
      row.appendChild(saveBtn);
      row.appendChild(deleteBtn);
      list.appendChild(row);
    });
  }

  document.body.appendChild(panel);

  /* Wire Add button */
  const addBtn = document.getElementById("streaks-add-new");
  const addInput = document.getElementById("streaks-new-name");
  if (addBtn && addInput) {
    addBtn.addEventListener("click", function () {
      const name = addInput.value.trim();
      if (!name) return;
      const streaks = typeof loadStreaks === "function" ? loadStreaks() : [];
      if (streaks.find(s => s.name.toLowerCase() === name.toLowerCase())) {
        alert("A streak called \"" + name + "\" already exists.");
        return;
      }
      const id = "streak-" + name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
      streaks.push({ id: id, name: name, count: 0, weeklyCount: 0, history: [] });
      if (typeof saveStreaks === "function") saveStreaks(streaks);
      if (typeof renderFullStreaksPage === "function") renderFullStreaksPage();
      panel.remove();
      openStreaksEditPanel();
    });
  }
}


function escapeForAttr(str) {
  return String(str || "").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");
}
