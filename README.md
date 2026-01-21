# Quranic Studies (GitHub Pages)

This is a lightweight static site generated from your Markdown notes.

## Structure
- `content/` — your `.md` notes (organized by category folders)
- `site.json` — index used for navigation + search
- `index.html` — homepage (categories + search)
- `note.html` — note viewer page
- `assets/` — CSS/JS

## Put it online with GitHub Pages (fast)
1. Create a new GitHub repository (public).
2. Upload **all files** from this folder to the repo (root).
3. In GitHub: **Settings → Pages**
   - Source: **Deploy from a branch**
   - Branch: **main** (or master), folder: **/(root)**
4. Save. Your site URL appears there.

## Add / edit notes later
- Add or edit `.md` files in `content/`
- Rebuild `site.json` (because it powers the navigation/search)

### Rebuild `site.json`
If you have Python installed:
```bash
python tools/rebuild_index.py
```

## Notes
- This site uses CDN scripts for Markdown rendering (`marked`) and sanitization (`DOMPurify`).
- If you want 100% offline/no-CDN, tell me and I can bundle local copies.
