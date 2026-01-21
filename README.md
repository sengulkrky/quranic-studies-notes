# Quranic Studies 

This is a lightweight static site generated from Markdown notes.

## Structure
- `content/` — `.md` notes (organized by category folders)
- `site.json` — index used for navigation + search
- `index.html` — homepage (categories + search)
- `note.html` — note viewer page
- `assets/` — CSS/JS

## Add / edit notes later
- Add or edit `.md` files in `content/`
- Rebuild `site.json` (because it powers the navigation/search)

### Rebuild `site.json`
```bash
python tools/rebuild_index.py
```
