const SITE_TITLE = "Quranic Studies";

function qs(sel){ return document.querySelector(sel); }
function el(tag, attrs={}, children=[]){
  const n=document.createElement(tag);
  for(const [k,v] of Object.entries(attrs)){
    if(k==="class") n.className=v;
    else if(k==="html") n.innerHTML=v;
    else n.setAttribute(k,v);
  }
  for(const c of children){
    if(typeof c==="string") n.appendChild(document.createTextNode(c));
    else if(c) n.appendChild(c);
  }
  return n;
}

async function loadIndex(){
  const res = await fetch("site.json", {cache:"no-store"});
  if(!res.ok) throw new Error("Could not load site.json");
  return await res.json();
}

function groupByCategory(notes){
  const map = new Map();
  for(const n of notes){
    if(!map.has(n.category)) map.set(n.category, []);
    map.get(n.category).push(n);
  }
  // Sort notes by title
  for(const [k,v] of map.entries()){
    v.sort((a,b)=>a.title.localeCompare(b.title));
  }
  return map;
}

function setSidebar(index, activeCategorySlug=null){
  qs("#brandTitle").textContent = index.title || SITE_TITLE;
  qs("#brandSub").textContent = `${index.notes.length} notes • updated ${new Date(index.generatedAt).toLocaleDateString()}`;

  const cats = index.categories.slice().sort((a,b)=>a.name.localeCompare(b.name));
  const list = qs("#catList");
  list.innerHTML = "";

  list.appendChild(el("a", {class:"item", href:"./", "data-cat":""}, [
    el("span", {}, ["All notes"]),
    el("span", {class:"badge"}, [String(index.notes.length)])
  ]));

  for(const c of cats){
    const a = el("a", {class:"item", href:`./?cat=${encodeURIComponent(c.slug)}`, "data-cat":c.slug}, [
      el("span", {}, [c.name]),
      el("span", {class:"badge"}, [String(c.count)])
    ]);
    if(activeCategorySlug && c.slug === activeCategorySlug){
      a.style.background = "rgba(255,255,255,.04)";
      a.style.borderColor = "var(--border)";
    }
    list.appendChild(a);
  }
}

function noteCard(note){
  const href = `./note.html?id=${encodeURIComponent(note.id)}`;
  return el("a", {class:"noteLink", href}, [
    el("div", {class:"t"}, [note.title]),
    el("div", {class:"e"}, [note.excerpt || ""])
  ]);
}

function renderHome(index, catSlug=null, query=""){
  const main = qs("#main");
  main.innerHTML = "";

  let notes = index.notes.slice();
  if(catSlug){
    notes = notes.filter(n => n.categorySlug === catSlug);
  }

  if(query){
    const q = query.toLowerCase();
    notes = notes.filter(n =>
      (n.title||"").toLowerCase().includes(q) ||
      (n.category||"").toLowerCase().includes(q) ||
      (n.excerpt||"").toLowerCase().includes(q)
    );
  }

  const bc = catSlug ? `Category • ${index.categories.find(c=>c.slug===catSlug)?.name || catSlug}` : "Home";
  const title = catSlug ? (index.categories.find(c=>c.slug===catSlug)?.name || "Notes") : "All notes";

  const header = el("div", {class:"card"}, [
    el("p", {class:"breadcrumbs"}, [bc]),
    el("div", {class:"headerRow"}, [
      el("div", {}, [
        el("h1", {class:"title"}, [title]),
        el("div", {class:"meta"}, [
          query ? `${notes.length} results for “${query}”` : `${notes.length} notes`
        ])
      ]),
      el("button", {class:"smallbtn", id:"copyLinkBtn"}, ["Copy link"])
    ]),
    el("div", {id:"grouped"})
  ]);

  main.appendChild(header);

  qs("#copyLinkBtn").onclick = async () => {
    const url = new URL(window.location.href);
    await navigator.clipboard.writeText(url.toString());
    qs("#copyLinkBtn").textContent = "Copied!";
    setTimeout(()=>qs("#copyLinkBtn").textContent="Copy link", 1200);
  };

  const grouped = qs("#grouped");

  if(notes.length === 0){
    grouped.appendChild(el("div", {style:"margin-top:16px;"}, [
      el("div", {class:"noteLink"}, [
        el("div", {class:"t"}, ["No notes found"]),
        el("div", {class:"e"}, ["Try a different search."])
      ])
    ]));
    return;
  }

  // Group notes by category and render sections
  const map = new Map();
  for(const n of notes){
    const key = n.category || "Notes";
    if(!map.has(key)) map.set(key, []);
    map.get(key).push(n);
  }

  // Sort categories and notes
  const catNames = Array.from(map.keys()).sort((a,b)=>a.localeCompare(b));
  for(const k of catNames){
    map.get(k).sort((a,b)=>a.title.localeCompare(b.title));
  }

  for(const catName of catNames){
    const catNotes = map.get(catName);

    // Category heading row
    const heading = el("div", {style:"margin-top:18px;"}, [
      el("div", {style:"display:flex; justify-content:space-between; align-items:baseline; gap:10px;"}, [
        el("h2", {style:"margin:0; font-size:18px;"}, [catName]),
        el("div", {style:"color:var(--muted); font-size:13px;"}, [`${catNotes.length} note(s)`])
      ]),
      el("div", {class:"grid", style:"margin-top:10px;"})
    ]);

    const grid = heading.querySelector(".grid");
    for(const n of catNotes){
      grid.appendChild(noteCard(n));
    }

    grouped.appendChild(heading);
  }

  main.appendChild(el("div", {class:"footer"}, [
    "Tip: add more .md files under /content and they’ll show up after you regenerate site.json."
  ]));
}


function getParams(){
  const p = new URLSearchParams(window.location.search);
  return {
    cat: p.get("cat") || null,
    q: p.get("q") || ""
  };
}

async function initHome(){
  const index = await loadIndex();
  const {cat, q} = getParams();
  setSidebar(index, cat);
  qs("#searchInput").value = q || "";
  renderHome(index, cat, q);

  qs("#searchInput").addEventListener("input", (e)=>{
    const v = e.target.value || "";
    const url = new URL(window.location.href);
    if(v) url.searchParams.set("q", v); else url.searchParams.delete("q");
    // keep cat param
    history.replaceState({}, "", url.toString());
    renderHome(index, cat, v);
  });
}

async function initNote(){
  const index = await loadIndex();
  const p = new URLSearchParams(window.location.search);
  const id = p.get("id");
  const note = index.notes.find(n => n.id === id);
  if(!note){
    setSidebar(index, null);
    qs("#main").innerHTML = `<div class="card"><p class="breadcrumbs">Note</p><h1 class="title">Not found</h1><p class="meta">This note id doesn’t exist.</p></div>`;
    return;
  }
  setSidebar(index, note.categorySlug);

  const res = await fetch(note.contentPath, {cache:"no-store"});
  const md = await res.text();

  // Marked + DOMPurify loaded from CDN in note.html
  const html = DOMPurify.sanitize(marked.parse(md, {mangle:false, headerIds:true}));

  const main = qs("#main");
  main.innerHTML = "";
  const card = el("div", {class:"card"}, [
    el("p", {class:"breadcrumbs"}, [
      el("a", {href:"./"}, ["Home"]), " / ",
      el("a", {href:`./?cat=${encodeURIComponent(note.categorySlug)}`}, [note.category]), " / ",
      note.title
    ]),
    el("div", {class:"headerRow"}, [
      el("h1", {class:"title"}, [note.title]),
      el("div", {}, [
        el("button", {class:"smallbtn", id:"backBtn"}, ["Back"]),
      ])
    ]),
    el("hr", {class:"sep"}),
    el("div", {class:"prose", html})
  ]);
  main.appendChild(card);

  qs("#backBtn").onclick = () => history.length > 1 ? history.back() : (window.location.href="./");
  qs("#searchInput").addEventListener("keydown", (e)=>{
    if(e.key==="Enter"){
      const v = e.target.value || "";
      const url = new URL(window.location.origin + window.location.pathname.replace("note.html",""));
      if(note.categorySlug) url.searchParams.set("cat", note.categorySlug);
      if(v) url.searchParams.set("q", v);
      window.location.href = url.toString();
    }
  });
}

window.QS_APP = { initHome, initNote };
