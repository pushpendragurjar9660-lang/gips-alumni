# GIPS Alumni Meet 2026 — Website

Plain HTML/CSS/JS — no build step, no npm install. Open the folder in
VS Code and go.

## Files

```
index.html        The page structure (sections, containers)
css/style.css      All visual styling, colours, layout, animation
js/data.js         <-- EDIT THIS to change any content
js/main.js         Rendering logic — you shouldn't need to touch this
assets/logo.png    The school crest
assets/lucide.min.js   Icon library (used offline, no internet needed)
```

## How to make content changes

Open **`js/data.js`**. Everything on the site — school name, event
date, tagline, departments, members, positions, scores — lives there
with comments explaining each part. Save the file and refresh the
page (or use a Live Server extension in VS Code for auto-reload).

Examples:
- Change the event date → edit `EVENT.dateRange` and set
  `EVENT.dateConfirmed: true` once it's official.
- Add a new department → copy one of the objects inside the
  `DEPARTMENTS` array, give it a unique `id`, fill in its `members`.
  It will automatically get a card, a detail page, a leaderboard
  entry and a progress bar.
- Add a member's photo → set their `photo` field to a path like
  `"assets/team/aafaz.jpg"` (drop the image into `assets/`).
- Turn scoring on/off for a department → set `scored: true` / `false`
  on that department object. Scores are always calculated from member
  scores — there's no separate hidden number anywhere else to edit.

## How to view it

Just double-click `index.html`, or in VS Code install the "Live
Server" extension, right-click `index.html` → **Open with Live
Server**. Live Server is recommended if you plan to add more pages
later, but isn't required for normal editing.

## Notes

- The Google Fonts line at the top of `style.css` needs internet
  access; if it can't load, the site falls back to system fonts
  automatically — nothing breaks.
- The icon library (`assets/lucide.min.js`) is bundled locally so the
  site works fully offline.
