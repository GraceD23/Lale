/* =========================================================
   BRAIN-PARSER.JS
   ---------------------------------------------------------
   Reads Brain Dump text and tries to detect:
   - tasks
   - streak actions
   - health entries
   - notes

   This is a simple rule-based parser for now.
   Later it can be replaced with AI.
   ========================================================= */


/* =========================================================
   PARSE BRAIN DUMP
   ========================================================= */

function parseBrainDump(text) {

  const lower = text.toLowerCase();

  const result = {
    type: "note",
    data: {}
  };


  /* =====================================================
     TASK DETECTION
     Example:
     "wash my car"
     ===================================================== */

  if (lower.includes("wash") || lower.includes("clean")) {

    result.type = "task";
    result.data = {
      name: text,
      schedule: "weekly"
    };

    return result;
  }


  /* =====================================================
     VITAMIN DETECTION
     Example:
     "took vitamin"
     ===================================================== */

  if (lower.includes("vitamin")) {

    result.type = "streak";

    result.data = {
      name: "Vitamins"
    };

    return result;
  }


  /* =====================================================
     HEADACHE DETECTION
     Example:
     "headache 3 back of neck maybe sugar"
     ===================================================== */

  if (lower.includes("headache")) {

    const severityMatch = text.match(/[1-5]/);

    result.type = "health";

    result.data = {

      category: "headache",
      severity: severityMatch ? severityMatch[0] : null,
      note: text

    };

    return result;
  }


  /* =====================================================
     DEFAULT NOTE
     ===================================================== */

  result.type = "note";
  result.data = {
    text: text
  };

  return result;

}
