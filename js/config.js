
/* =========================================================
   CONFIG.JS
   ---------------------------------------------------------
   This file stores EASY-TO-CHANGE SITE SETTINGS.

   Edit this file when you want to change things like:
   - weekly reset timing
   - passcode length
   - where the mobile menu opens from
   - default star icon path
   - review panel behavior
   - mobile layout defaults

   Keeping these settings here means you do NOT have to dig
   through multiple JavaScript files just to change behavior.
   ========================================================= */


/* =========================================================
   MAIN CONFIG OBJECT
   ---------------------------------------------------------
   Each property below controls a site behavior or reusable
   setting. The comment next to each line explains exactly
   what part of the site it affects.
   ========================================================= */

window.APP_CONFIG = {

  /* =========================
     SECURITY / LOGIN SETTINGS
     ========================= */
  passcodeLength: 6, /* Number of circles/digits shown on the iPhone-style passcode screen */
  passcodeInputType: "numeric", /* Tells the login system to expect number-only input */
 rememberSession: true, /* keeps site unlocked temporarily after correct passcode */
  lockScreenStyle: "iphone-keypad", /* Visual style for login screen: iPhone-style keypad with filled circles */

  /* =========================
     WEEKLY RESET SETTINGS
     ========================= */
  weeklyResetDay: "Sunday", /* Day when homepage weekly streak display resets */
  weeklyResetHour: 0, /* Hour of reset in 24-hour time; 0 = midnight */
  weeklyResetMinute: 0, /* Minute of reset; 0 = exactly on the hour */
  weeklyResetLabel: "Sunday at midnight", /* Human-readable reset description for future UI/help text */

  /* =========================
     STREAK SETTINGS
     ========================= */
  homepageStreaksResetWeekly: true, /* Homepage streak dropdown resets weekly */
  fullStreaksPageResets: false, /* Full Streaks page should never erase old streak history */
  useCustomStarImage: false, /* Starts with text/placeholder stars for now until you replace with your own PNG */
  starIconPath: "assets/icons/star-default.png", /* File path for the default streak star image */
  starFallbackText: "★", /* Text star used if image stars are not loaded yet */
  missedStarStyle: "unfilled", /* Missed streak days on full Streaks page should appear as unfilled stars */

  /* =========================
     MOBILE MENU SETTINGS
     ========================= */
  mobileMenuEnabled: true, /* Turns the hamburger menu system on */
  mobileMenuSide: "right", /* Side of the screen the menu drawer opens from */
  mobileMenuStartsHidden: true, /* Menu drawer should be hidden until the hamburger is tapped */
  mobileMenuOverlayEnabled: true, /* Allows a dimmed screen overlay later if desired when menu opens */

  /* =========================
     DROPDOWN SETTINGS
     ========================= */
  dropdownsStartClosed: true, /* All dropdowns should begin closed when the page first loads */
  dropdownToggleMode: "click-title-to-open-close", /* Clicking the dropdown title/button toggles it both open and closed */
  dropdownAnimationEnabled: true, /* Allows future open/close animation behavior */
  dropdownArrowRotates: true, /* Arrow icon can rotate later to show open/closed state */

  /* =========================
     REVIEW PANEL SETTINGS
     ========================= */
  reviewPanelEnabled: true, /* Brain Dump should use a review/confirmation step */
  reviewPanelSlideFrom: "bottom", /* Review panel should slide up from the bottom of the screen */
  reviewPanelStartsHidden: true, /* Review panel should stay hidden until Brain Dump is submitted */
  clearBrainDumpAfterConfirm: true, /* Brain Dump text can be cleared after the item is confirmed */
  clearBrainDumpImmediatelyOnSubmit: false, /* Brain Dump should NOT clear the moment Submit is pressed */

  /* =========================
     BRAIN DUMP SETTINGS
     ========================= */
  brainDumpUsesAI: true, /* Brain Dump should be designed to use AI parsing later */
  brainDumpRequiresReview: true, /* AI results should go through review before saving */
  brainDumpInputMode: "multiline", /* Brain Dump should be a multi-line text box */
  brainDumpButtonLabelKey: "submitButton", /* Label key from labels.js used for the submit button */
  brainDumpCanCreateNewCategories: true, /* Brain Dump can trigger creation of new categories/pages */
  brainDumpCanCreateTasks: true, /* Brain Dump can create tasks */
  brainDumpCanCreateHealthEntries: true, /* Brain Dump can create health entries like headaches/weight */
  brainDumpCanAskFollowUpQuestions: true, /* AI review flow can ask follow-up questions only when relevant */

  /* =========================
     HOMEPAGE LAYOUT SETTINGS
     ========================= */
  homepageTopCardsSideBySide: true, /* Daily Focus and Weekly Tasks should sit side by side on iPhone */
  homepageTopCardsEqualHeight: false, /* Top cards should grow naturally and NOT be forced to equal height */
  homepageHasMascotAreaReserved: true, /* Space should remain reserved at the top for the future mascot plugin */
  homepageBrainDumpAtBottom: true, /* Brain Dump should stay near the bottom of the homepage layout */

  /* =========================
     TASK SETTINGS
     ========================= */
  dailyFocusShowsScheduledTasksForToday: true, /* Daily Focus should show unfinished tasks scheduled for the current day */
  completedDailyTaskDisappears: true, /* Completed Daily Focus tasks disappear immediately */
  completedWeeklyTaskDisappears: true, /* Completed Weekly Tasks disappear immediately */
  unfinishedDailyTasksMoveToWeekly: true, /* Daily tasks left unfinished should move into Weekly Tasks */
  recurringTasksEnabled: true, /* Tasks can repeat on schedules like every Tuesday */

  /* =========================
     HEALTH PAGE SETTINGS
     ========================= */
  healthPageUsesWeeklyRow: true, /* Health categories should show a weekly Mon-Sun layout at the top */
  healthMonthDropdownChangesMonthlyViewOnly: true, /* Month selector should only change the monthly section, not the weekly row */
  symptomBoxesShowSingleFilledDay: true, /* Symptom trackers like headaches show one filled box per day, even with multiple entries */
  weightDisplayFormat: "lb-oz", /* Weight should display in pounds and ounces, like 120lb 3oz */
  weightWeeklyBoxesTapNotRequired: true, /* Weekly weight boxes show the value directly and do not require tapping */

  /* =========================
     HISTORY PAGE SETTINGS
     ========================= */
  historyPageName: "History", /* Name used for the monthly completed task history page */
  historyGroupsRepeatedTasks: true, /* Repeated completed tasks should group into a summary like Wash Car x2 */
  historyShowX1: false, /* If a task was only completed once, do NOT show x1 */
  historyTapForDetails: true, /* Tapping a history task should open a detail popup with completion dates */
  historyIncludesStreakTasks: false, /* History page should show tasks only, not streak tasks */

  /* =========================
     ADD PAGE SETTINGS
     ========================= */
  addPageInputStyle: "typed-command", /* Add page should work like a typed command system */
  addPageAsksOnlyRelevantQuestions: true, /* Add page should avoid asking unnecessary setup questions */
  addPageCanUploadPngIcons: true, /* Add page should support uploading PNG icons directly on the site */
  addPageCanCreateNewPages: true, /* Add page can create brand new pages if requested */
  addPageCanCreateTrackersTasksAndCategories: true, /* Add page can create trackers, tasks, and entirely new categories */

  /* =========================
     PLACEHOLDER / STARTER DATA
     These are temporary defaults used while building the UI
     before live storage and backend logic are connected.
     ========================= */
  useStarterPlaceholderData: true, /* Allows starter example content to display during early build phase */
  starterDailyTaskCount: 1, /* Number of temporary example daily tasks to show */
  starterWeeklyTaskCount: 1, /* Number of temporary example weekly tasks to show */
  starterStreakCount: 1 /* Number of temporary example streak rows to show */
};


/* =========================================================
   OPTIONAL HELPER FUNCTION
   ---------------------------------------------------------
   This helper makes it easier for future JS files to fetch
   settings safely.

   Example:
   getConfig("weeklyResetDay")
   ========================================================= */

window.getConfig = function(configKey) {
  return window.APP_CONFIG[configKey]; /* Returns the requested config value */
};
