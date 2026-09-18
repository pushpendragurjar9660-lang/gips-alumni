/* =====================================================================
   CENTRAL DATA FILE — GIPS ALUMNI MEET 2026
   ---------------------------------------------------------------------
   This is the ONLY file you need to touch to update the content of the
   website. Change a value below and save — the whole site (cards,
   leaderboard, progress bars, stats) updates automatically the next
   time the page is opened. Nothing in index.html, style.css or
   main.js needs to change for normal content edits.

   Quick index of what's in this file:
     1. SCHOOL        -> school name / short name / city
     2. EVENT         -> event name, date, tagline, description
     3. PERFORMANCE_LEVELS -> the 5 performance badges and their colours
     4. DEPARTMENTS   -> every department + every member + their scores
     5. POSITION_INFO -> the "Every Position Has a Purpose" section
     6. LOGO_SRC       -> path to the school crest image
===================================================================== */

// ---- 1. SCHOOL DETAILS -------------------------------------------------
const SCHOOL = {
  name: "Genius International Public School",
  shortName: "GIPS",
  city: "Gwalior",
};

// ---- 2. EVENT DETAILS ---------------------------------------------------
// `dateConfirmed: false` is what prints "Date To Be Confirmed" next to
// the date range. Flip it to true once the school finalises the date.
const EVENT = {
  name: "Alumni Meet 2026",
  year: 2026,
  dateRange: "5–15 November 2026",
  dateConfirmed: false,
  tagline: "One School. One Team. One Celebration.",
  description:
    "Our school is dedicated to empowering students through learning, leadership and creativity. We believe in building confident individuals who work together, embrace opportunities and strive for excellence.",
  aboutSecondary:
    "Alumni Meet 2026 brings students together across different responsibilities and departments to create a memorable celebration. Every role contributes to the success of the event.",
};

// ---- 3. PERFORMANCE SCALE ------------------------------------------------
// Every member's "performance" value must be one of these exact keys.
// Colours live here so a brand-new performance level only needs one
// new entry — every badge on the site will pick it up automatically.
const PERFORMANCE_LEVELS = {
  "Excellent": { text: "#8A6116", bg: "#FBF1D8", ring: "#EBD9A4" },
  "Very Good": { text: "#1E3A8A", bg: "#E9EFFC", ring: "#C7D6F5" },
  "Good": { text: "#5B3A9E", bg: "#F0EAFB", ring: "#D9C9F2" },
  "Improving": { text: "#B45309", bg: "#FFF1E1", ring: "#F3D2A4" },
  "Needs Improvement": { text: "#5B6478", bg: "#EEF0F5", ring: "#DADFEA" },
};

// The order used whenever we need to pick the "best" performance level
// (e.g. deciding a department's overall badge). Don't reorder unless
// you want the ranking of levels themselves to change.
const LEVEL_ORDER = ["Excellent", "Very Good", "Good", "Improving", "Needs Improvement"];

// ---- 4. DEPARTMENTS ------------------------------------------------------
// To add a brand-new department (e.g. "Decoration Team"): copy one of
// the objects below, give it a unique `id`, and fill in its fields.
// It will automatically get a department card, a detail page, a
// leaderboard entry and a progress bar — no other file needs to change.
//
// Each member needs: name, position, responsibility, performance,
// score, and optionally a `photo` (a file path or URL). Leave `photo`
// as an empty string "" to show initials instead of a picture.
//
// A department's own score/rank is NEVER a fixed number — it is
// always calculated automatically from its members' scores. To make a
// department show no score at all (like Webpage Developers below),
// set `scored: false` and give its members `score: null`.
const DEPARTMENTS = [
  {
    id: "event-leads",
    name: "Event Leads",
    icon: "crown", // any icon name from lucide.dev/icons
    isPlaceholder: false,
    description:
      "The core leadership team responsible for overseeing the entire program, coordinating departments, making key decisions and ensuring that everything runs smoothly from planning to execution.",
    members: [
      {
        name: "Anil Kansana",
        position: "Department Head",
        responsibility:
          "Responsible for handling the overall event and taking major decisions required for successful planning and execution.",
        performance: "Excellent",
        score: 99.1,
        photo: "assets/anil-kansana.png",
      },
      {
        name: "Raj Vardhan Singh",
        position: "Co-Head",
        responsibility:
          "Supports the department head in managing the event, coordinating teams and ensuring that major responsibilities are completed effectively.",
        performance: "Excellent",
        score: 99.0,
        photo: "assets/rajvardhan.png",
      },
    ],
  },
  {
    id: "student-coordinators",
    name: "Student Coordinators",
    icon: "users",
    // Head not finalised yet — replace "" once assigned below. Scores
    // are placeholder/demo values, easy to edit before the real event.
    isPlaceholder: true,
    description:
      "The student coordination team that connects different departments, manages communication, supports team members and ensures that assigned tasks are completed on time.",
    members: [
      {
        name: "Aafaz",
        position: "Coordinator",
        responsibility:
          "Supports communication between students and departments and helps ensure assigned tasks are completed.",
        performance: "Very Good",
        score: 90,
        photo: "assets/aafaz.png",
      },
      {
        name: "Bheem",
        position: "Coordinator",
        responsibility:
          "Helps coordinate students, communicate tasks and support smooth execution of event activities.",
        performance: "Very Good",
        score: 89,
        photo: "assets/bheem.png",
      },
      {
        name: "Saniya",
        position: "Coordinator",
        responsibility:
          "Supports team communication and helps keep department activities organized and on schedule.",
        performance: "Very Good",
        score: 88,
        photo: "assets/saniya.png",
      },
      {
        name: "Ronak",
        position: "Coordinator",
        responsibility:
          "Assists with coordination, team communication and execution of assigned event responsibilities.",
        performance: "Good",
        score: 86,
        photo: "assets/ronak.png",
      },
      {
        name: "Harshita",
        position: "Coordinator",
        responsibility:
          "Supports student coordination and helps ensure that assigned responsibilities are completed efficiently.",
        performance: "Good",
        score: 85,
        photo: "assets/harshita.png",
      },
      {
        name: "Harshit Gautam",
        position: "Coordinator",
        responsibility:
          "Helps coordinate communication, task tracking and support for student activities during the event.",
        performance: "Good",
        score: 84,
        photo: "",
      },
    ],
  },
  {
    id: "webpage-developers",
    name: "Webpage Developers",
    icon: "code-2",
    isPlaceholder: true,
    // This department is not scored/ranked — it's the team building the
    // site itself. Set `scored: true` and give members real numbers
    // above to switch scoring back on for this department.
    scored: false,
    description:
      "The creative tech team responsible for designing, developing and maintaining the official program website, ensuring that all event information, departments, members and rankings are presented clearly and beautifully.",
    members: [
      {
        name: "Puspendra",
        position: "Web Developer",
        responsibility:
          "Responsible for developing the event website and implementing its main functionality and user interface.",
        performance: "Excellent",
        score: null,
        photo: "assets/pushpendra.png",
      },
      {
        name: "Vansh",
        position: "Web Developer",
        responsibility:
          "Supports website development, content presentation, interface improvements and technical implementation.",
        performance: "Very Good",
        score: null,
        photo: "assets/vansh.png",
      },
    ],
  },
];

// ---- 5. WHAT EACH POSITION MEANS -----------------------------------------
const POSITION_INFO = [
  {
    title: "Department Head",
    icon: "crown",
    text: "Responsible for managing the complete department, making important decisions and ensuring that the team's goals are achieved.",
  },
  {
    title: "Co-Head",
    icon: "shield-check",
    text: "Supports the department head, shares leadership responsibilities and helps coordinate important tasks.",
  },
  {
    title: "Coordinator",
    icon: "users",
    text: "Responsible for communication, coordination and ensuring that assigned work is completed on time.",
  },
  {
    title: "Web Developer",
    icon: "code-2",
    text: "Responsible for creating and maintaining the digital experience of the event website.",
  },
  {
    title: "Team Member",
    icon: "user-check",
    text: "Responsible for completing assigned tasks and actively supporting the department.",
  },
];

// ---- 6. SCHOOL CREST ------------------------------------------------------
// Point this at any image file in the assets/ folder to change the logo
// used in the navbar, hero and footer.
const LOGO_SRC = "assets/logo.png";
