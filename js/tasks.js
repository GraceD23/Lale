
/* =========================================================
   TASKS.JS
   ---------------------------------------------------------
   This file controls starter task behavior for:
   - Daily Focus
   - Weekly Tasks

   Current starter responsibilities:
   - detect taps on task complete buttons
   - remove completed tasks immediately from the page
   - keep Daily Focus and Weekly Tasks behavior separate from
     Brain Dump, streak logic, and backend storage for now

   FUTURE responsibilities:
   - load real task data from storage/database
   - move unfinished daily tasks into Weekly Tasks
   - re-show recurring tasks on their scheduled days
   - update streaks when a streak-enabled task is completed
   - sync confirmed Brain Dump tasks into the correct list

   IMPORTANT:
   This file only handles visible task-list behavior.
   It does NOT control:
   - colors
   - layout
   - Brain Dump AI
   - full streak history
   ========================================================= */


/* =========================================================
   START AFTER PAGE LOAD
   ---------------------------------------------------------
   Waits until the HTML page is fully loaded before attaching
   task behavior to the complete buttons.
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  initializeTaskLists(); /* Starts starter task behavior after page HTML is ready */
});


/* =========================================================
   MAIN INITIALIZER
   ---------------------------------------------------------
   Connects click behavior to all current task complete buttons
   on the homepage.
   ========================================================= */

function initializeTaskLists() {
  attachTaskCompleteHandlers("#daily-focus-list"); /* Adds complete-button behavior inside the Daily Focus list */
  attachTaskCompleteHandlers("#weekly-tasks-list"); /* Adds complete-button behavior inside the Weekly Tasks list */
}


/* =========================================================
   ATTACH COMPLETE HANDLERS
   ---------------------------------------------------------
   Finds all task complete buttons inside a specific list and
   connects the click behavior to each one.

   listSelector examples:
   - #daily-focus-list
   - #weekly-tasks-list
   ========================================================= */

function attachTaskCompleteHandlers(listSelector) {
  const taskList = document.querySelector(listSelector); /* Finds the specific task list container */

  if (!taskList) {
    return; /* Stops safely if the expected list is not present */
  }

  const taskButtons = taskList.querySelectorAll(".task-check-button"); /* Finds all complete buttons inside this task list */

  taskButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      handleTaskComplete(button); /* Runs the complete-task behavior when a circle button is tapped */
    });
  });
}


/* =========================================================
   HANDLE TASK COMPLETE
   ---------------------------------------------------------
   Current starter behavior:
   - finds the row belonging to the tapped complete button
   - removes that row from the page immediately

   This matches your confirmed rule:
   - completed Daily Focus tasks disappear
   - completed Weekly Tasks disappear
   ========================================================= */

function handleTaskComplete(clickedButton) {
  const taskRow = clickedButton.closest(".task-row"); /* Finds the full task row that contains the tapped complete button */

  if (!taskRow) {
    return; /* Stops safely if no matching task row is found */
  }

  removeTaskRow(taskRow); /* Removes the completed task row from the visible page */
}


/* =========================================================
   REMOVE TASK ROW
   ---------------------------------------------------------
   Removes a task row from the page.

   This is split into its own function so later we can add:
   - fade-out animations
   - save-to-history behavior
   - streak updates
   - backend sync
   before the row disappears
   ========================================================= */

function removeTaskRow(taskRow) {
  taskRow.remove(); /* Immediately removes the completed task row from the DOM */
}


/* =========================================================
   FUTURE GLOBAL HELPERS
   ---------------------------------------------------------
   These helper functions are exposed on window so future files
   like brain-dump.js or add-system.js can later insert tasks
   into Daily Focus or Weekly Tasks without rewriting this file.
   ========================================================= */

window.addTaskToList = addTaskToList; /* Lets future scripts add a task row to either task list */
window.rebindTaskHandlers = rebindTaskHandlers; /* Lets future scripts reconnect click handlers after adding new rows */


/* =========================================================
   ADD TASK TO LIST
   ---------------------------------------------------------
   Creates and inserts a new task row into a target task list.

   targetListId examples:
   - daily-focus-list
   - weekly-tasks-list

   taskText example:
   - Wash car
   - Call dentist
   ========================================================= */

function addTaskToList(targetListId, taskText) {
  const taskList = document.getElementById(targetListId); /* Finds the task list where the new task should be inserted */

  if (!taskList) {
    return; /* Stops safely if the target task list does not exist */
  }

  const safeTaskText = typeof taskText === "string" ? taskText.trim() : ""; /* Cleans the provided task text */

  if (safeTaskText === "") {
    return; /* Stops if the new task text is empty */
  }

  const taskRow = document.createElement("div"); /* Creates a new row wrapper for the task */
  taskRow.className = "task-row"; /* Applies shared task-row styling */

  const checkButton = document.createElement("button"); /* Creates the circular complete button */
  checkButton.className = "task-check-button"; /* Applies the shared complete-button styling */
  checkButton.type = "button"; /* Prevents accidental form submission behavior */
  checkButton.setAttribute("aria-label", "Complete task"); /* Accessibility label for screen readers */
  checkButton.textContent = "○"; /* Starter open-circle symbol shown before task completion */

  const taskTextSpan = document.createElement("span"); /* Creates the visible task text element */
  taskTextSpan.className = "task-text"; /* Applies task text styling if added later */
  taskTextSpan.textContent = safeTaskText; /* Shows the cleaned task name */

  taskRow.appendChild(checkButton); /* Adds the complete button into the task row */
  taskRow.appendChild(taskTextSpan); /* Adds the task text into the task row */

  taskList.appendChild(taskRow); /* Inserts the new task row into the target list */

  rebindTaskHandlers(taskList); /* Reconnects click behavior so the new button works immediately */
}


/* =========================================================
   REBIND TASK HANDLERS
   ---------------------------------------------------------
   Re-attaches click handlers inside a specific task list after
   new rows are inserted.

   This version safely prevents duplicate listeners by replacing
   each existing task button with a fresh cloned copy before
   attaching the click event.
   ========================================================= */

function rebindTaskHandlers(taskListOrSelector) {
  const taskList =
    typeof taskListOrSelector === "string"
      ? document.querySelector(taskListOrSelector) /* Finds the list if a selector string was provided */
      : taskListOrSelector; /* Uses the provided element directly if an element was passed in */

  if (!taskList) {
    return; /* Stops safely if the task list is missing */
  }

  const existingButtons = taskList.querySelectorAll(".task-check-button"); /* Finds all task complete buttons in the list */

  existingButtons.forEach(function (oldButton) {
    const newButton = oldButton.cloneNode(true); /* Creates a fresh copy so old event listeners are removed cleanly */
    oldButton.replaceWith(newButton); /* Replaces the old button with the clean cloned version */

    newButton.addEventListener("click", function () {
      handleTaskComplete(newButton); /* Re-attaches the task complete behavior to the fresh button */
    });
  });
}
