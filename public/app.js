(() => {
  const B = window.BOOK || { pages: [] };
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const hash = (s) => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const isLocal = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
  const narrow = () => window.matchMedia("(max-width: 700px)").matches;

  // Unsaved text edits are kept in this browser until "save changes" writes them to content.js.
  const TEXT_KEY = "bday-book:text-draft:v1";
  let restoredDraft = false;
  if (isLocal) {
    try {
      const d = JSON.parse(localStorage.getItem(TEXT_KEY) || "null");
      if (d && Array.isArray(d.pages) && JSON.stringify(d) !== JSON.stringify(B)) { Object.assign(B, d); restoredDraft = true; }
    } catch (_) {}
  }

  let toastTimer;
  function toast(msg) {
    const t = $("toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 3400);
  }

  // ───────────────────────── art ─────────────────────────
  const HEART = "M50 88 C22 68 8 52 9 33 C10 18 22 9 35 10 C43 11 48 16 50 22 C52 16 57 11 65 10 C78 9 90 18 91 33 C92 52 78 68 50 88Z";
  function starPath(n, R, r, cy = 52) {
    let d = "";
    for (let i = 0; i < n * 2; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / n, rad = i % 2 ? r : R;
      d += (i ? "L" : "M") + (50 + rad * Math.cos(a)).toFixed(1) + " " + (cy + rad * Math.sin(a)).toFixed(1);
    }
    return d + "Z";
  }
  function scallopPath() {
    let d = "";
    for (let i = 0; i <= 144; i++) {
      const a = (i / 144) * Math.PI * 2, rad = 41 * (0.9 + 0.1 * Math.cos(12 * a));
      d += (i ? "L" : "M") + (50 + rad * Math.cos(a)).toFixed(1) + " " + (50 + rad * Math.sin(a)).toFixed(1);
    }
    return d + "Z";
  }
  const SHAPES = {
    heart: { label: "heart", d: HEART },
    circle: { label: "circle", d: "M50 8 A42 42 0 1 1 49.99 8Z" },
    scallop: { label: "scallop", d: scallopPath() },
    star: { label: "star", d: starPath(5, 46, 25) },
    square: { label: "square", d: "M22 10 H78 Q90 10 90 22 V78 Q90 90 78 90 H22 Q10 90 10 78 V22 Q10 10 22 10Z" },
  };
  function photoSticker(src, shape, uid) {
    const d = (SHAPES[shape] || SHAPES.heart).d;
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><clipPath id="cp-${uid}"><path d="${d}"/></clipPath></defs>
      <path d="${d}" fill="#FAF5EC" stroke="#FAF5EC" stroke-width="13" stroke-linejoin="round"/>
      <image href="${esc(src)}" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice" clip-path="url(#cp-${uid})"/></svg>`;
  }
  function bowSvg(p = "bw") {
    const K = 'stroke="#2B2522" stroke-width="2" stroke-linejoin="round"';
    return `<svg viewBox="0 0 100 90" aria-hidden="true">
      <path d="M46 44 L32 82 L40 78 L45 86 L52 48Z" fill="url(#${p})" ${K}/>
      <path d="M54 44 L68 82 L60 78 L55 86 L48 48Z" fill="url(#${p})" ${K}/>
      <path d="M50 40 C38 22 12 16 9 32 C6 48 32 52 50 46Z" fill="url(#${p})" ${K}/>
      <path d="M50 40 C62 22 88 16 91 32 C94 48 68 52 50 46Z" fill="url(#${p})" ${K}/>
      <rect x="43" y="34" width="14" height="16" rx="5" fill="url(#${p})" ${K}/></svg>`;
  }
  const K = 'stroke="#4A3426" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"';
  const DOODLES = {
    heart: { label: "heart", svg: `<path d="${HEART}" fill="#D6A39D" ${K}/><path d="M24 30 C26 22 31 19 37 20" fill="none" stroke="#FAF5EC" stroke-width="4" stroke-linecap="round"/>` },
    bow: { label: "bow", raw: () => bowSvg("bw") },
    rosebow: { label: "pink bow", raw: () => bowSvg("rw") },
    daisy: { label: "daisy", svg: [0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<ellipse cx="50" cy="27" rx="9" ry="17" transform="rotate(${a} 50 50)" fill="#FAF5EC" ${K}/>`).join("") + `<circle cx="50" cy="50" r="11" fill="#EAD9A8" ${K}/>` },
    star: { label: "star", svg: `<path d="${starPath(5, 42, 19)}" fill="#EAD9A8" ${K}/>` },
    sparkle: { label: "sparkle", svg: `<path d="M50 8 C54 40 60 46 92 50 C60 54 54 60 50 92 C46 60 40 54 8 50 C40 46 46 40 50 8Z" fill="#BFB3CF" ${K}/>` },
    cherries: { label: "cherries", svg: `<path d="M36 70 C40 50 48 32 60 16 M66 66 C64 48 62 32 60 16" fill="none" ${K}/><path d="M60 16 C70 8 84 10 88 18 C78 24 66 22 60 16Z" fill="#AAB597" ${K}/><circle cx="34" cy="72" r="14" fill="#C98A84" ${K}/><circle cx="66" cy="68" r="14" fill="#C98A84" ${K}/><path d="M27 67 C28 63 31 61 34 61" fill="none" stroke="#FAF5EC" stroke-width="3" stroke-linecap="round"/>` },
    letter: { label: "love letter", svg: `<rect x="10" y="24" width="80" height="54" rx="4" fill="#FAF5EC" ${K}/><path d="M10 28 L50 58 L90 28" fill="none" ${K}/><path d="M50 66 C42 60 40 56 41 53 C42 50 46 49 50 53 C54 49 58 50 59 53 C60 56 58 60 50 66Z" fill="#C98A84" ${K}/>` },
    cake: { label: "cake", svg: `<rect x="47" y="22" width="6" height="22" fill="#AAB597" ${K}/><path d="M50 7 C55 13 55 18 50 20 C45 18 45 13 50 7Z" fill="#E7B77A" ${K}/><rect x="16" y="44" width="68" height="40" rx="6" fill="#EED6CF" ${K}/><path d="M16 54 C22 62 28 62 32 54 C36 62 44 62 48 54 C52 62 60 62 64 54 C68 62 76 62 84 54 V50 C84 46 82 44 78 44 H22 C18 44 16 46 16 50Z" fill="#FAF5EC" ${K}/>` },
    butterfly: { label: "butterfly", svg: `<ellipse cx="33" cy="38" rx="18" ry="21" transform="rotate(-22 33 38)" fill="#BFB3CF" ${K}/><ellipse cx="67" cy="38" rx="18" ry="21" transform="rotate(22 67 38)" fill="#BFB3CF" ${K}/><ellipse cx="37" cy="66" rx="12" ry="14" transform="rotate(20 37 66)" fill="#EED6CF" ${K}/><ellipse cx="63" cy="66" rx="12" ry="14" transform="rotate(-20 63 66)" fill="#EED6CF" ${K}/><ellipse cx="50" cy="52" rx="4" ry="23" fill="#4A3426"/><path d="M48 30 C44 20 40 16 36 14 M52 30 C56 20 60 16 64 14" fill="none" ${K}/>` },
    stamp: { label: "stamp", svg: `<rect x="14" y="12" width="72" height="76" fill="#FAF5EC"/><rect x="14" y="12" width="72" height="76" fill="none" stroke="#EFE7DC" stroke-width="7" stroke-dasharray="0 8" stroke-linecap="round"/><rect x="24" y="22" width="52" height="56" fill="#EED6CF" ${K}/><path d="M50 66 C36 56 32 49 33 43 C34 37 42 35 50 43 C58 35 66 37 67 43 C68 49 64 56 50 66Z" fill="#C98A84" ${K}/>` },
  };
  const doodleSvg = (k) => { const d = DOODLES[k] || DOODLES.heart; return d.raw ? d.raw() : `<svg viewBox="0 0 100 100" aria-hidden="true">${d.svg}</svg>`; };
  const TAPE_COLORS = ["#D6A39D", "#AAB597", "#EAD9A8", "#BFB3CF", "#E3C1B4"];

  function wordInner(st) {
    if (st.style === "ransom") {
      return `<div class="w-ransom">${[...st.text].map((ch, i) => ch === " " ? '<span class="sp"></span>'
        : `<span class="r${(hash(st.id) + i * 3) % 5}" style="transform:rotate(${(hash(st.id + i) % 11) - 5}deg)">${esc(ch)}</span>`).join("")}</div>`;
    }
    if (st.style === "tape") return `<div class="w-tape" style="--c:${esc(st.color || TAPE_COLORS[0])}">${esc(st.text)}</div>`;
    return `<div class="w-label">${esc(st.text)}</div>`;
  }

  // ───────────────────────── pages ─────────────────────────
  function img(p, ar, path) {
    const src = (p && p.src) || "";
    // `pos` picks which part of the photo stays in frame when it's cropped (default leans toward faces)
    const pos = (p && p.pos) || "50% 35%";
    const editable = EDIT && path;
    const hint = editable ? "add a photo" : "";
    return `<div class="img" style="--ar:${ar}" data-hint="${hint}"${editable ? ` data-photo="${path}"` : ""}>` +
      `<img src="${esc(src)}" alt="${esc((p && p.caption) || "")}" style="object-position:${esc(pos)}" draggable="false">` +
      (editable ? `<button class="swap" type="button">${src ? "change photo" : "add photo"}</button>` : "") + `</div>`;
  }
  // While running on your computer, text marked with data-path can be typed into
  // directly and saved back into content.js.
  const EDIT = isLocal;
  const P = (k, rest) => (k == null ? null : `pages.${k}.${rest}`);
  const ed = (path, value, tag = "span", ph = "") =>
    `<${tag}${path ? ` data-path="${path}"` : ""}${ph ? ` data-ph="${esc(ph)}"` : ""}>${esc(value || "")}</${tag}>`;
  const show = (v) => EDIT || !!v; // empty bits still render while editing so they can be filled in
  const tape = (style, c) => `<span class="tape" style="${style};--c:${c}"></span>`;
  const label = (path, text, style, light) => (show(text) ? `<div class="label${light ? " light" : ""}" style="${style}">${ed(path, text, "span", "label")}</div>` : "");
  const ransom = (word, seed) => `<div class="ransom">${[...word].map((ch, i) => `<span class="r${(seed + i * 2) % 5}" style="transform:rotate(${((seed * 7 + i * 5) % 11) - 5}deg)">${esc(ch)}</span>`).join("")}</div>`;
  const scrap = (path, text, style) => (show(text) ? `<div class="scrap" style="${style}">${ed(path, text, "span", "a little note")}</div>` : "");

  const T = {
    cover: () => `
      <div class="floral" style="left:-6%;bottom:-4%;width:52%;height:24%;transform:rotate(5deg)"></div>
      ${tape("left:58%;bottom:17%;transform:rotate(-24deg)", "#AAB597")}
      <div class="bow" style="right:9%;top:7%;width:22%;transform:rotate(8deg)">${bowSvg("bw")}</div>
      <div class="cover-title">
        ${ransom("happy", 1)}
        ${ransom("birthday", 4)}
        <div class="label cover-for" style="position:relative">for ${ed("name", B.name, "span", "her name")}</div>
        <div class="cover-date">${ed("date", B.date, "span", "the date")}</div>
      </div>`,
    back: () => `
      <div class="gingham" style="right:-4%;top:-3%;width:40%;height:20%;transform:rotate(-6deg)"></div>
      <div class="bow" style="left:39%;top:36%;width:22%">${bowSvg("rw")}</div>
      <div class="label" style="left:50%;top:56%;transform:translateX(-50%) rotate(-2deg)">made with love by ${ed("from", B.from, "span", "you")}</div>
      <div class="cover-date" style="position:absolute;left:0;right:0;top:66%;text-align:center">happy birthday ♡</div>`,
    letter: (p, k) => `
      <div class="letter" style="transform:rotate(-1.2deg)">
        ${ed(P(k, "title"), p.title, "h3", "a title")}
        ${ed(P(k, "text"), p.text, "p", "write your letter here")}
        <div class="sign">love, ${ed("from", B.from, "span", "you")}</div>
      </div>
      ${tape("left:4%;top:12%;transform:rotate(-38deg)", "#D6A39D")}
      ${tape("right:4%;bottom:11%;transform:rotate(-38deg)", "#AAB597")}
      ${label(P(k, "label"), p.label, "left:9%;top:6%;transform:rotate(-2deg)")}
      <div class="floral" style="right:-5%;top:-3%;width:30%;height:14%;transform:rotate(7deg)"></div>`,
    polaroid: (p, k) => `
      <div class="gingham" style="left:11%;top:14%;width:76%;height:58%;transform:rotate(3.5deg)"></div>
      <figure class="photo mat" style="left:17%;top:19%;width:64%;transform:rotate(-2deg)">${img(p.photo, 1, P(k, "photo"))}</figure>
      <div class="bow" style="left:37%;top:10%;width:26%">${bowSvg("bw")}</div>
      ${label(P(k, "label"), p.label, "left:7%;top:5.5%;transform:rotate(-2deg)")}
      ${label(P(k, "photo.caption"), p.photo && p.photo.caption, "right:9%;top:69%;transform:rotate(2deg)", true)}
      ${scrap(P(k, "note"), p.note, "left:12%;top:79%;max-width:74%;transform:rotate(-1.5deg)")}`,
    duo: (p, k) => {
      const [a, b] = p.photos || [];
      const c = p.clipping || {};
      return `
      <div class="floral" style="left:-4%;bottom:3%;width:34%;height:18%;transform:rotate(-5deg)"></div>
      <figure class="photo polaroid" style="left:8%;top:13%;width:50%;transform:rotate(-4deg)">${img(a, 1, P(k, "photos.0"))}<figcaption>${ed(P(k, "photos.0.caption"), a && a.caption, "span", "caption")}</figcaption></figure>
      ${tape("left:21%;top:10.5%;transform:rotate(-8deg)", "#D6A39D")}
      ${show(c.headline || c.text) ? `<div class="clipping" style="right:6%;top:18%;width:40%;transform:rotate(3deg)">${ed(P(k, "clipping.headline"), c.headline, "h4", "headline")}${ed(P(k, "clipping.text"), c.text, "p", "the story")}</div>` : ""}
      <figure class="photo bordered" style="right:9%;top:58%;width:47%;transform:rotate(3deg)">
        <span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span>${img(b, 1.25, P(k, "photos.1"))}</figure>
      ${label(P(k, "photos.1.caption"), b && b.caption, "left:10%;top:80%;transform:rotate(-3deg)", true)}
      ${label(P(k, "label"), p.label, "left:8%;top:5%;transform:rotate(-1.5deg)")}`;
    },
    collage: (p, k) => {
      const [a, b, c] = p.photos || [];
      return `
      <div class="gingham" style="left:-3%;top:63%;width:106%;height:13%;transform:rotate(-2.5deg)"></div>
      <figure class="photo bordered" style="left:7%;top:12%;width:50%;transform:rotate(-3deg)">${img(a, 0.8, P(k, "photos.0"))}</figure>
      <figure class="photo bordered" style="right:7%;top:21%;width:43%;transform:rotate(4deg)">${img(b, 1, P(k, "photos.1"))}</figure>
      <figure class="photo bordered" style="left:34%;top:51%;width:50%;transform:rotate(-1.5deg)">${img(c, 1.25, P(k, "photos.2"))}</figure>
      ${tape("left:50%;top:49%;transform:rotate(6deg)", "#EAD9A8")}
      ${tape("right:14%;top:18.5%;transform:rotate(-10deg)", "#BFB3CF")}
      ${label(P(k, "label"), p.label, "right:8%;top:6%;transform:rotate(2deg)")}
      ${scrap(P(k, "note"), p.note, "left:7%;top:84%;max-width:60%;transform:rotate(-2deg)")}`;
    },
    list: (p, k) => `
      <div class="list-card" style="transform:rotate(1deg)"><ul>${(p.items || []).map((t, j) => ed(P(k, "items." + j), t, "li", "a reason")).join("")}</ul></div>
      ${tape("left:39%;top:12%;transform:rotate(-3deg)", "#AAB597")}
      ${label(P(k, "label"), p.label, "left:12%;top:17.5%;transform:rotate(-2deg)")}
      <div class="gingham" style="right:-5%;bottom:-3%;width:28%;height:14%;transform:rotate(-8deg)"></div>`,
    blank: (p, k) => `
      ${k == null ? "" : label(P(k, "label"), p.label, "left:8%;top:6%;transform:rotate(-2deg)")}
      ${k != null && show(p.hint) ? `<div class="blank-hint">${ed(P(k, "hint"), p.hint, "span", "a little hint")}</div>` : ""}`,
  };

  const content = (B.pages || []).map((p, k) => ({ p, k }));
  if (content.length % 2) content.push({ p: { type: "blank" }, k: null });
  const pages = [{ p: { type: "cover", hard: true }, k: null }, ...content, { p: { type: "back", hard: true }, k: null }];
  const N = pages.length;

  const bookEl = $("book");
  bookEl.innerHTML = pages.map(({ p, k }, i) => {
    const side = i === 0 ? "right" : i % 2 ? "left" : "right";
    const fn = T[p.type] || T.blank;
    return `<div class="page ${side}${p.hard ? " hard" : ""}" ${p.hard ? 'data-density="hard"' : ""}>
      <div class="inner">${fn(p, k)}</div><div class="stickers" data-page="${i}"></div></div>`;
  }).join("");
  const layers = [...bookEl.querySelectorAll(".stickers")];

  // ───────────────────────── text editing ─────────────────────────
  let textDirty = restoredDraft;
  function setPath(obj, path, val) {
    const ks = path.split(".");
    let o = obj;
    ks.slice(0, -1).forEach((k, i) => { if (o[k] == null) o[k] = /^\d+$/.test(ks[i + 1]) ? [] : {}; o = o[k]; });
    o[ks[ks.length - 1]] = val;
  }
  if (EDIT) {
    document.body.classList.add("editing");
    bookEl.querySelectorAll("[data-path]").forEach((el) => {
      try { el.contentEditable = "plaintext-only"; } catch (_) { el.contentEditable = "true"; }
      if (el.contentEditable !== "plaintext-only") el.contentEditable = "true";
      el.spellcheck = false;
      const path = el.dataset.path;
      const multi = /\.(text|note)$/.test(path);
      // keep the book from treating a click in the text as a page turn
      el.addEventListener("mousedown", (e) => e.stopPropagation());
      el.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
      el.addEventListener("keydown", (e) => {
        e.stopPropagation();
        if ((e.key === "Enter" && !multi) || e.key === "Escape") { e.preventDefault(); el.blur(); }
      });
      el.addEventListener("paste", (e) => {
        e.preventDefault();
        document.execCommand("insertText", false, (e.clipboardData || window.clipboardData).getData("text/plain"));
      });
      el.addEventListener("input", () => {
        const val = el.innerText.replace(/\n$/, "");
        setPath(B, path, val);
        bookEl.querySelectorAll(`[data-path="${path}"]`).forEach((o) => { if (o !== el) o.textContent = val; });
        textDirty = true; syncSave();
        try { localStorage.setItem(TEXT_KEY, JSON.stringify(B)); } catch (_) {}
      });
    });
    $("whisper").textContent = "click any words to change them ♡";
    window.addEventListener("beforeunload", (e) => { if (textDirty) { e.preventDefault(); e.returnValue = ""; } });
  }

  // Photos that fail to load show a soft placeholder instead.
  const loadedPhotos = new Set();
  bookEl.querySelectorAll(".img img").forEach((im) => {
    const miss = () => im.parentElement.classList.add("missing");
    const src = im.getAttribute("src");
    if (!src) return miss();
    im.addEventListener("error", miss);
    im.addEventListener("load", () => { loadedPhotos.add(src); if (!$("sheet").hidden) renderSheet(); });
    if (im.complete) (im.naturalWidth ? loadedPhotos.add(src) : miss());
  });

  // While editing, "add photo" copies the picked file into public/photos and points the slot at it.
  if (EDIT) {
    const picker = Object.assign(document.createElement("input"), { type: "file", accept: "image/jpeg,image/png,image/webp,image/gif", hidden: true });
    document.body.appendChild(picker);
    let target = null;
    bookEl.querySelectorAll("[data-photo] .swap").forEach((btn) => {
      btn.addEventListener("mousedown", (e) => e.stopPropagation());
      btn.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
      btn.addEventListener("click", (e) => { e.stopPropagation(); target = btn.parentElement; picker.value = ""; picker.click(); });
    });
    picker.addEventListener("change", async () => {
      const f = picker.files[0], box = target;
      if (!f || !box) return;
      if (!/^image\/(jpeg|png|webp|gif)$/.test(f.type)) {
        toast("that photo type won't show in browsers. use a JPG or PNG (convert iPhone HEIC photos first).");
        return;
      }
      try {
        const res = await fetch("/api/photo?name=" + encodeURIComponent(f.name), { method: "POST", body: f });
        if (!res.ok) throw new Error(String(res.status));
        const { src } = await res.json();
        setPath(B, box.dataset.photo + ".src", src);
        const im = box.querySelector("img");
        im.onload = () => { box.classList.remove("missing"); loadedPhotos.add(src); };
        im.onerror = () => box.classList.add("missing");
        im.src = src;
        box.querySelector(".swap").textContent = "change photo";
        textDirty = true; syncSave();
        try { localStorage.setItem(TEXT_KEY, JSON.stringify(B)); } catch (_) {}
        toast("photo added. press save changes to keep it.");
      } catch (_) {
        toast("couldn't add the photo. run 'npm run dev' and try again.");
      }
    });
  }

  // ───────────────────────── flipping ─────────────────────────
  const pf = new St.PageFlip(bookEl, {
    width: 420, height: 560, size: "stretch",
    minWidth: 250, maxWidth: 520, minHeight: 333, maxHeight: 693,
    showCover: true, usePortrait: true, autoSize: true,
    maxShadowOpacity: 0.35, flippingTime: 850, drawShadow: true,
    mobileScrollSupport: false, showPageCorners: false, disableFlipByClick: true,
    clickEventForward: true, swipeDistance: 30,
  });
  pf.loadFromHTML(bookEl.querySelectorAll(".page"));  $("book-wrap").classList.remove("loading");

  const spiral = $("spiral");
  spiral.innerHTML = "<i></i>".repeat(17);
  let flipping = false;
  function syncChrome() {
    const i = pf.getCurrentPageIndex();
    const land = pf.getOrientation() === "landscape";
    spiral.hidden = !land || flipping || i === 0 || i >= N - 1;
    let txt;
    if (land && i > 0 && i < N - 1) txt = `${i + 1}–${i + 2} / ${N}`;
    else txt = `${i + 1} / ${N}`;
    $("count").textContent = txt;
    $("prev").disabled = i === 0;
    $("next").disabled = i >= N - 1;
  }
  pf.on("flip", () => { $("whisper").textContent = "tap the stickers button to decorate ♡"; syncChrome(); });
  pf.on("changeOrientation", syncChrome);
  pf.on("changeState", (e) => { flipping = e.data !== "read"; syncChrome(); });
  $("prev").onclick = () => pf.flipPrev();
  $("next").onclick = () => pf.flipNext();
  document.addEventListener("keydown", (e) => {
    const a = document.activeElement;
    if (a && (/INPUT|TEXTAREA/.test(a.tagName) || a.isContentEditable)) return;
    if (sel && (e.key === "Delete" || e.key === "Backspace")) { e.preventDefault(); act("peel"); return; }
    if (e.key === "ArrowRight") pf.flipNext();
    if (e.key === "ArrowLeft") pf.flipPrev();
    if (e.key === "Escape") { closeSheet(); select(null); }
  });
  syncChrome();

  function visiblePages() {
    const i = pf.getCurrentPageIndex();
    if (pf.getOrientation() !== "landscape" || i === 0 || i >= N - 1) return [i];
    return [i, i + 1];
  }
  function partner(p) {
    if (p === 0 || p === N - 1) return null;
    return p % 2 ? p + 1 : p - 1;
  }

  // ───────────────────────── sticker state ─────────────────────────
  // layout.json holds the stickers baked into the book (yours).
  // Anything added on this device is kept in localStorage on top of it.
  const KEY = "bday-book:mine:v1";
  let base = [];
  let mine = { stickers: {}, removed: [] };
  try { const m = JSON.parse(localStorage.getItem(KEY) || "null"); if (m && m.stickers) mine = m; } catch (_) {}
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(mine)); } catch (_) {} };
  let stickers = [];
  function rebuild() {
    const removed = new Set(mine.removed);
    stickers = base.filter((s) => !removed.has(s.id)).map((s) => ({ ...(mine.stickers[s.id] || s) }));
    for (const s of Object.values(mine.stickers)) if (!removed.has(s.id) && !base.some((b) => b.id === s.id)) stickers.push({ ...s });
    renderStickers();
  }
  function touch(st) { mine.stickers[st.id] = { ...st }; persist(); }
  function drop(st) {
    stickers = stickers.filter((s) => s.id !== st.id);
    delete mine.stickers[st.id];
    if (base.some((b) => b.id === st.id)) mine.removed.push(st.id);
    persist();
  }
  const dirty = () => Object.keys(mine.stickers).length > 0 || mine.removed.length > 0;

  fetch("layout.json", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : { stickers: [] }))
    .then((j) => { base = Array.isArray(j.stickers) ? j.stickers : []; })
    .catch(() => {})
    .finally(rebuild);

  const els = new Map();
  let sel = null;
  const maxZ = () => stickers.reduce((m, s) => Math.max(m, s.z || 0), 0);
  const widthOf = (st) => (st.kind === "photo" ? 30 : 17) * st.s;
  function renderStickers() {
    const seen = new Set();
    for (const st of stickers) {
      seen.add(st.id);
      const layer = layers[st.page]; if (!layer) continue;
      const sig = [st.kind, st.src, st.shape, st.doodle, st.text, st.style, st.color].join("|");
      let el = els.get(st.id);
      if (!el || el.dataset.sig !== sig) {
        if (el) el.remove();
        el = document.createElement("div");
        el.className = "stk" + (st.kind === "word" ? " word" : "");
        el.dataset.id = st.id; el.dataset.sig = sig;
        el.innerHTML = st.kind === "photo" ? photoSticker(st.src, st.shape, st.id) : st.kind === "doodle" ? doodleSvg(st.doodle) : wordInner(st);
        // keep the book from treating a sticker grab as a page turn
        el.addEventListener("mousedown", (e) => e.stopPropagation());
        el.addEventListener("touchstart", (e) => e.stopPropagation(), { passive: true });
        el.addEventListener("pointerdown", startDrag);
        els.set(st.id, el);
      }
      if (el.parentElement !== layer) layer.appendChild(el);
      if (drag && drag.id === st.id) continue;
      el.style.left = st.x + "%"; el.style.top = st.y + "%";
      el.style.setProperty("--r", st.r + "deg"); el.style.setProperty("--s", st.s);
      el.style.zIndex = st.z || 1;
      if (st.kind !== "word") el.style.width = widthOf(st) + "%";
      el.classList.toggle("sel", sel === st.id);
    }
    for (const [id, el] of els) if (!seen.has(id)) { el.remove(); els.delete(id); }
    if (sel && !seen.has(sel)) sel = null;
    renderSelbar();
    renderFoot();
  }

  function addSticker(base) {
    const vis = visiblePages();
    const count = (p) => stickers.filter((s) => s.page === p).length;
    const page = vis.length > 1 && count(vis[0]) < count(vis[1]) ? vis[0] : vis[vis.length - 1];
    const st = { ...base, id: newId(), page, x: +(50 + Math.random() * 30 - 15).toFixed(1), y: +(45 + Math.random() * 30 - 15).toFixed(1), s: 1, r: Math.round(Math.random() * 20 - 10), z: maxZ() + 1 };
    stickers.push(st); touch(st); sel = st.id; renderStickers();
    if (narrow()) closeSheet();
    $("whisper").textContent = "drag stickers to move them ♡";
  }

  function select(id) { if (sel === id) return; sel = id; renderStickers(); }

  let drag = null;
  function startDrag(e) {
    const el = e.currentTarget, st = stickers.find((s) => s.id === el.dataset.id);
    if (!st) return;
    e.preventDefault(); e.stopPropagation();
    select(st.id);
    drag = { id: st.id, el, sx: e.clientX, sy: e.clientY, x0: st.x, y0: st.y, rect: el.parentElement.getBoundingClientRect(), moved: false, x: st.x, y: st.y };
    el.style.zIndex = maxZ() + 1;
    try { el.setPointerCapture(e.pointerId); } catch (_) {}
    el.addEventListener("pointermove", moveDrag);
    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);
  }
  function moveDrag(e) {
    if (!drag) return;
    if (Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) > 3) drag.moved = true;
    drag.x = clamp(drag.x0 + ((e.clientX - drag.sx) / drag.rect.width) * 100, 0, 100);
    drag.y = clamp(drag.y0 + ((e.clientY - drag.sy) / drag.rect.height) * 100, 0, 100);
    drag.el.style.left = drag.x + "%"; drag.el.style.top = drag.y + "%";
  }
  function endDrag() {
    if (!drag) return;
    const d = drag; drag = null;
    d.el.removeEventListener("pointermove", moveDrag);
    d.el.removeEventListener("pointerup", endDrag);
    d.el.removeEventListener("pointercancel", endDrag);
    const st = stickers.find((s) => s.id === d.id);
    if (st && d.moved) { st.x = +d.x.toFixed(2); st.y = +d.y.toFixed(2); st.z = maxZ() + 1; touch(st); }
    renderStickers();
  }
  document.addEventListener("pointerdown", (e) => {
    if (sel && !e.target.closest(".stk, .selbar, .sheet, .dock")) select(null);
  });

  function renderSelbar() {
    const bar = $("selbar");
    const st = stickers.find((s) => s.id === sel);
    if (!st) { bar.hidden = true; $("pouch").hidden = false; return; }
    const other = pf.getOrientation() === "landscape" ? partner(st.page) : null;
    bar.innerHTML = `
      <button data-a="tl" aria-label="Tilt left">↺ tilt</button>
      <button data-a="tr" aria-label="Tilt right">tilt ↻</button>
      <button data-a="sm">smaller</button>
      <button data-a="lg">bigger</button>
      <button data-a="up">to front</button>
      ${other != null ? `<button data-a="mv">move to ${other < st.page ? "left" : "right"} page</button>` : ""}
      <button data-a="peel" class="peel">peel off</button>
      <button data-a="done">done</button>`;
    bar.querySelectorAll("button").forEach((b) => (b.onclick = () => act(b.dataset.a)));
    bar.hidden = false; $("pouch").hidden = narrow();
  }
  function act(a) {
    const st = stickers.find((s) => s.id === sel); if (!st) return;
    if (a === "done") { select(null); return; }
    if (a === "peel") { drop(st); sel = null; renderStickers(); return; }
    if (a === "tl") st.r -= 10;
    if (a === "tr") st.r += 10;
    if (a === "sm") st.s = clamp(+(st.s / 1.15).toFixed(3), 0.35, 3.5);
    if (a === "lg") st.s = clamp(+(st.s * 1.15).toFixed(3), 0.35, 3.5);
    if (a === "up") st.z = maxZ() + 1;
    if (a === "mv") { const o = partner(st.page); if (o != null) st.page = o; }
    touch(st); renderStickers();
  }

  // ───────────────────────── sticker pouch ─────────────────────────
  const ui = { tab: "faces", shape: "heart", wordStyle: "label", word: "", color: TAPE_COLORS[0] };
  function photoSources() {
    const all = [];
    for (const p of B.pages || []) {
      const list = p.photo ? [p.photo] : p.photos || [];
      for (const ph of list) if (ph && ph.src && !all.includes(ph.src)) all.push(ph.src);
    }
    for (const s of B.stickerPhotos || []) if (!all.includes(s)) all.push(s);
    return all.filter((s) => loadedPhotos.has(s));
  }
  function renderSheet() {
    document.querySelectorAll(".tabs button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === ui.tab)));
    const body = $("sheet-body");
    if (ui.tab === "faces") {
      const srcs = photoSources();
      body.innerHTML = `<div class="chips" role="group" aria-label="Shape">${Object.entries(SHAPES).map(([k, v]) => `<button class="chip" data-shape="${k}" aria-pressed="${ui.shape === k}">${v.label}</button>`).join("")}</div>
        <div class="tray">${srcs.length ? srcs.map((s, i) => `<button data-src="${esc(s)}" aria-label="Add photo sticker">${photoSticker(s, ui.shape, "tray" + i)}</button>`).join("")
          : `<p class="empty">Photos you add to the book show up here as stickers.</p>`}</div>`;
      body.querySelectorAll("[data-shape]").forEach((b) => (b.onclick = () => { ui.shape = b.dataset.shape; renderSheet(); }));
      body.querySelectorAll("[data-src]").forEach((b) => (b.onclick = () => addSticker({ kind: "photo", src: b.dataset.src, shape: ui.shape })));
    } else if (ui.tab === "doodles") {
      body.innerHTML = `<div class="tray">${Object.entries(DOODLES).map(([k, v]) => `<button data-k="${k}" aria-label="Add ${v.label} sticker">${doodleSvg(k)}</button>`).join("")}</div>`;
      body.querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => addSticker({ kind: "doodle", doodle: b.dataset.k })));
    } else {
      const preview = { id: "preview", text: ui.word || "bestie 4ever", style: ui.wordStyle, color: ui.color };
      body.innerHTML = `
        <form class="word-maker" id="word-form">
          <input id="word-input" maxlength="24" placeholder="bestie 4ever" value="${esc(ui.word)}" aria-label="Sticker words">
          <button class="pill primary" type="submit">stick it</button>
        </form>
        <div class="chips" role="group" aria-label="Style">
          ${[["label", "typewriter label"], ["tape", "washi tape"], ["ransom", "cut-out letters"]].map(([k, l]) => `<button class="chip" data-style="${k}" aria-pressed="${ui.wordStyle === k}">${l}</button>`).join("")}
        </div>
        <div class="word-preview"><div class="stk word">${wordInner(preview)}</div></div>`;
      const inp = $("word-input");
      inp.oninput = () => { ui.word = inp.value; body.querySelector(".word-preview .stk").innerHTML = wordInner({ ...preview, text: ui.word || "bestie 4ever" }); };
      body.querySelectorAll("[data-style]").forEach((b) => (b.onclick = () => { ui.wordStyle = b.dataset.style; ui.color = TAPE_COLORS[Math.floor(Math.random() * TAPE_COLORS.length)]; renderSheet(); }));
      $("word-form").onsubmit = (e) => {
        e.preventDefault();
        const text = ui.word.trim(); if (!text) { inp.focus(); return; }
        addSticker({ kind: "word", text, style: ui.wordStyle, color: ui.color });
        ui.word = ""; if (!$("sheet").hidden) renderSheet();
      };
    }
    renderFoot();
  }

  let armed = false;
  function syncSave() {
    const b = $("save-all");
    if (b) b.hidden = !(isLocal && (textDirty || dirty()));
  }
  async function saveAll() {
    const post = (url, body) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const jobs = [];
    if (textDirty) jobs.push(post("/api/content", B));
    if (dirty()) jobs.push(post("/api/layout", { stickers }));
    try {
      const res = await Promise.all(jobs);
      if (res.some((r) => !r.ok)) throw new Error("save");
    } catch (_) {
      toast("couldn't reach the save server. your edits are kept here; run 'npm run dev' and press save again.");
      return;
    }
    if (dirty()) { base = stickers.map((x) => ({ ...x })); mine = { stickers: {}, removed: [] }; persist(); }
    textDirty = false;
    try { localStorage.removeItem(TEXT_KEY); } catch (_) {}
    rebuild(); syncSave();
    toast("saved into the book. deploy to share it with her.");
  }
  $("save-all").onclick = saveAll;

  function renderFoot() {
    syncSave();
    const foot = $("sheet-foot"); if ($("sheet").hidden) return;
    if (isLocal) {
      foot.innerHTML = `<span>${dirty() ? "you have stickers that aren't in the book yet" : "your stickers are saved in the book"}</span>
        <span style="display:flex;gap:6px">${dirty() ? `<button id="discard">${armed ? "sure? discard" : "discard stickers"}</button><button class="save" id="save">save to book</button>` : ""}</span>`;
    } else {
      foot.innerHTML = `<span>your stickers stay saved on this device</span>${dirty() ? `<button id="discard">${armed ? "sure? start over" : "start over"}</button>` : ""}`;
    }
    const d = $("discard");
    if (d) d.onclick = () => {
      if (!armed) { armed = true; renderFoot(); setTimeout(() => { armed = false; renderFoot(); }, 3000); return; }
      armed = false; mine = { stickers: {}, removed: [] }; persist(); sel = null; rebuild(); toast("back to how the book started");
    };
    const s = $("save");
    if (s) s.onclick = saveAll;
  }

  function openSheet() { $("sheet").hidden = false; $("pouch").setAttribute("aria-expanded", "true"); renderSheet(); }
  function closeSheet() { $("sheet").hidden = true; $("pouch").setAttribute("aria-expanded", "false"); }
  $("pouch").onclick = () => ($("sheet").hidden ? openSheet() : closeSheet());
  $("close-sheet").onclick = closeSheet;
  document.querySelectorAll(".tabs button").forEach((b) => (b.onclick = () => { ui.tab = b.dataset.tab; renderSheet(); }));
  window.addEventListener("resize", () => { renderSelbar(); });
})();
