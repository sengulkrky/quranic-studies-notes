#!/usr/bin/env python3
import os, re, json, hashlib
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, "content")

def slugify(s):
    s = s.strip().lower()
    s = re.sub(r'[\s_]+', '-', s)
    s = re.sub(r'[^a-z0-9\-]+', '', s)
    s = re.sub(r'-{2,}', '-', s).strip('-')
    return s or "note"

def extract_title(md_text, fallback):
    m = re.search(r'^\s*#\s+(.+?)\s*$', md_text, flags=re.M)
    if m: return m.group(1).strip()
    fm = re.match(r'^\s*---\s*\n(.*?)\n---\s*\n', md_text, flags=re.S)
    if fm:
        tm = re.search(r'^\s*title\s*:\s*(.+?)\s*$', fm.group(1), flags=re.M)
        if tm: return tm.group(1).strip().strip('"').strip("'")
    return fallback

def strip_markdown(md):
    md = re.sub(r'```.*?```', ' ', md, flags=re.S)
    md = re.sub(r'`[^`]+`', ' ', md)
    md = re.sub(r'!\[([^\]]*)\]\([^)]+\)', r'\1', md)
    md = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', md)
    md = re.sub(r'^\s{0,3}#{1,6}\s*', '', md, flags=re.M)
    md = re.sub(r'^\s*>\s*', '', md, flags=re.M)
    md = md.replace('*', ' ').replace('_', ' ')
    md = re.sub(r'\s+', ' ', md).strip()
    return md

notes = []
categories = {}

for root, _, files in os.walk(CONTENT):
    for f in files:
        if not f.lower().endswith(".md"):
            continue
        abs_path = os.path.join(root, f)
        rel = os.path.relpath(abs_path, ROOT).replace("\\","/")
        # category is first folder under content
        parts = rel.split("/")
        category_slug = parts[1] if len(parts) > 2 else "notes"
        category = category_slug.replace("-", " ").title()

        with open(abs_path, "r", encoding="utf-8", errors="ignore") as fp:
            md_text = fp.read()
        base = os.path.splitext(os.path.basename(f))[0]
        title = extract_title(md_text, base)

        note_id = hashlib.sha1(rel.encode("utf-8")).hexdigest()[:10]
        excerpt = strip_markdown(md_text)[:280]

        notes.append({
            "id": note_id,
            "title": title,
            "category": category,
            "categorySlug": category_slug,
            "sourceRelPath": rel,
            "contentPath": rel,
            "excerpt": excerpt,
        })
        categories.setdefault(category, {"name": category, "slug": category_slug, "count": 0})
        categories[category]["count"] += 1

notes.sort(key=lambda n: (n["category"].lower(), n["title"].lower()))
cats = sorted(categories.values(), key=lambda c: c["name"].lower())

index = {
    "generatedAt": datetime.utcnow().isoformat() + "Z",
    "title": "Quranic Studies",
    "notes": notes,
    "categories": cats,
}

with open(os.path.join(ROOT, "site.json"), "w", encoding="utf-8") as fp:
    json.dump(index, fp, ensure_ascii=False, indent=2)

print("Rebuilt site.json with", len(notes), "notes.")
