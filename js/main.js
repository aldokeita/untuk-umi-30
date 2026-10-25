(() => {
  "use strict";

  const C = window.BIRTHDAY;
  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const isPreview = params.has("preview");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ?now=2026-10-25T23:59:50+07:00 menggeser jam untuk menguji hitung mundur.
  const nowParam = params.get("now");
  const clockOffset = nowParam && !isNaN(Date.parse(nowParam)) ? Date.parse(nowParam) - Date.now() : 0;
  const now = () => Date.now() + clockOffset;

  const birthdayAt = Date.parse(C.birthday);
  const weddingAt = Date.parse(C.wedding);

  const store = {
    get(key, fallback) {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* mode privat */ }
    }
  };

  const text = (id, value) => { const el = $(id); if (el) el.textContent = value ?? ""; };
  const pad = (n) => String(n).padStart(2, "0");
  const fmt = (n) => n.toLocaleString("id-ID");
  const el = (tag, cls, content) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (content != null) node.textContent = content;
    return node;
  };

  const confettiColors = ["#b08a45", "#e3cf9f", "#8c2f45", "#c97b8a", "#f3dfe1"];
  const burst = (opts = {}) => {
    if (typeof window.confetti !== "function" || reduceMotion) return;
    window.confetti({ particleCount: 90, spread: 80, startVelocity: 38, colors: confettiColors, origin: { y: .6 }, ...opts });
  };

  if (isPreview) document.body.classList.add("is-preview");

  /* =========================================================
     Langit berbintang di gerbang
     ========================================================= */
  const sky = (() => {
    const canvas = $("stars");
    const ctx = canvas.getContext("2d");
    let stars = [], meteors = [], w = 0, h = 0, raf = 0, running = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round((w * h) / 4200);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.2 + .2,
        a: Math.random() * Math.PI * 2,
        s: Math.random() * .02 + .005
      }));
    }

    function meteor() {
      meteors.push({
        x: Math.random() * w * .8 + w * .2,
        y: Math.random() * h * .4,
        vx: -(Math.random() * 6 + 7),
        vy: Math.random() * 3 + 3,
        life: 1
      });
    }

    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.a += s.s;
        ctx.globalAlpha = .35 + Math.sin(s.a) * .35 + .3;
        ctx.fillStyle = "#f6efe2";
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      }
      if (!reduceMotion && Math.random() < .004) meteor();
      meteors = meteors.filter((m) => m.life > 0);
      for (const m of meteors) {
        const grad = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 10, m.y - m.vy * 10);
        grad.addColorStop(0, `rgba(246,231,193,${m.life})`);
        grad.addColorStop(1, "rgba(246,231,193,0)");
        ctx.globalAlpha = 1;
        ctx.strokeStyle = grad; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x - m.vx * 10, m.y - m.vy * 10); ctx.stroke();
        m.x += m.vx; m.y += m.vy; m.life -= .012;
      }
      raf = requestAnimationFrame(frame);
    }

    resize();
    window.addEventListener("resize", resize);
    frame();

    return {
      shower(n = 6) { for (let i = 0; i < n; i++) setTimeout(meteor, i * 180); },
      stop() { running = false; cancelAnimationFrame(raf); window.removeEventListener("resize", resize); }
    };
  })();

  /* =========================================================
     Hitung mundur
     ========================================================= */
  const gate = $("gate");
  const gateBtn = $("gateBtn");
  let gateReady = false;

  text("gateBtn", C.gate.button);
  text("envHint", C.gate.envelopeHint);

  function setReady() {
    if (gateReady) return;
    gateReady = true;
    text("gateTitle", C.gate.ready);
    text("gateSub", C.gate.readySub);
    $("countdown").hidden = true;
    gateBtn.hidden = false;
    sky.shower(8);
  }

  function tick() {
    const diff = birthdayAt - now();
    if (diff <= 0 || isPreview) { setReady(); return; }
    const s = Math.floor(diff / 1000);
    const days = Math.floor(s / 86400);
    $("cdDaysWrap").hidden = days === 0;
    text("cdDays", days);
    text("cdHours", pad(Math.floor((s % 86400) / 3600)));
    text("cdMins", pad(Math.floor((s % 3600) / 60)));
    text("cdSecs", pad(s % 60));
  }

  text("gateTitle", C.gate.waiting);
  text("gateSub", C.gate.waitingSub);
  tick();
  const countdownTimer = setInterval(() => { tick(); if (gateReady) clearInterval(countdownTimer); }, 250);

  /* =========================================================
     Musik
     ========================================================= */
  const bgm = $("bgm");
  const musicBtn = $("musicBtn");
  let musicOk = true;
  let musicWanted = false;
  let fadeTimer = 0;
  const MAX_VOL = .6;

  bgm.src = C.music.src;
  bgm.addEventListener("error", () => { musicOk = false; musicBtn.hidden = true; });

  function fadeTo(target, ms = 2500) {
    clearInterval(fadeTimer);
    const start = bgm.volume, steps = 30;
    let i = 0;
    fadeTimer = setInterval(() => {
      i++;
      bgm.volume = Math.max(0, Math.min(1, start + (target - start) * (i / steps)));
      if (i >= steps) clearInterval(fadeTimer);
    }, ms / steps);
  }

  function playMusic() {
    if (!musicOk) return;
    musicWanted = true;
    bgm.volume = 0;
    const p = bgm.play();
    if (p) p.then(() => { fadeTo(MAX_VOL); setMusicUI(true); }).catch(() => setMusicUI(false));
    musicBtn.hidden = false;
  }

  function setMusicUI(playing) {
    musicBtn.classList.toggle("is-muted", !playing);
    musicBtn.setAttribute("aria-label", playing ? "Matikan musik" : "Putar musik");
  }

  musicBtn.addEventListener("click", () => {
    if (bgm.paused) { musicWanted = true; bgm.play().then(() => { fadeTo(MAX_VOL, 1200); setMusicUI(true); }).catch(() => {}); }
    else { musicWanted = false; bgm.pause(); setMusicUI(false); }
  });

  document.addEventListener("visibilitychange", () => {
    if (!musicOk) return;
    if (document.hidden) bgm.pause();
    else if (musicWanted) bgm.play().catch(() => {});
  });

  /* =========================================================
     Membuka gerbang
     ========================================================= */
  gateBtn.addEventListener("click", () => {
    $("gateCountdown").hidden = true;
    $("gateEnvelope").hidden = false;
    bgm.load();
    $("envelope").focus({ preventScroll: true });
  });

  let opened = false;
  $("envelope").addEventListener("click", () => {
    if (opened) return;
    opened = true;
    $("envelope").classList.add("is-open");
    $("envHint").style.visibility = "hidden";
    playMusic();
    setTimeout(openSite, 1900);
  });

  function openSite() {
    gate.classList.add("is-gone");
    document.body.classList.remove("is-locked");
    document.body.classList.add("is-open");
    $("main").removeAttribute("aria-hidden");
    window.scrollTo(0, 0);
    petals.start();
    setTimeout(() => {
      burst({ particleCount: 70, spread: 100, origin: { y: .35 }, scalar: .9 });
    }, 900);
    setTimeout(() => { gate.hidden = true; sky.stop(); }, 1700);
  }

  /* =========================================================
     Kelopak bunga
     ========================================================= */
  const petals = (() => {
    const canvas = $("petals");
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const colors = ["#e7b3bd", "#f3dfe1", "#e3cf9f", "#d998a5"];
    let list = [], w = 0, h = 0, started = false;

    function resize() {
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function make(initial) {
      return {
        x: Math.random() * w,
        y: initial ? Math.random() * h : -20,
        size: Math.random() * 7 + 6,
        vy: Math.random() * .5 + .35,
        sway: Math.random() * 1.5 + .5,
        phase: Math.random() * Math.PI * 2,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - .5) * .02,
        color: colors[Math.floor(Math.random() * colors.length)]
      };
    }

    function draw(p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, Math.abs(Math.sin(p.phase)) * .5 + .5);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = .55;
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.bezierCurveTo(p.size * .9, -p.size * .6, p.size * .7, p.size * .6, 0, p.size);
      ctx.bezierCurveTo(-p.size * .7, p.size * .6, -p.size * .9, -p.size * .6, 0, -p.size);
      ctx.fill();
      ctx.restore();
    }

    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (const p of list) {
        p.phase += .015;
        p.y += p.vy;
        p.x += Math.sin(p.phase) * p.sway * .4;
        p.rot += p.vr;
        if (p.y > h + 20) Object.assign(p, make(false));
        draw(p);
      }
      requestAnimationFrame(frame);
    }

    return {
      start() {
        if (started || reduceMotion) return;
        started = true;
        resize();
        window.addEventListener("resize", resize);
        const count = w < 600 ? 14 : 24;
        list = Array.from({ length: count }, () => make(true));
        frame();
      }
    };
  })();

  /* =========================================================
     Muncul saat digulir
     ========================================================= */
  const revealObs = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add("is-in");
      revealObs.unobserve(e.target);
    }
  }, { threshold: .15, rootMargin: "0px 0px -8% 0px" });
  const observeReveal = (node) => revealObs.observe(node);

  /* =========================================================
     Foto + placeholder
     ========================================================= */
  const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.2 3.2 4.5 6.8 4.5c2.1 0 3.6 1.2 5.2 3 1.6-1.8 3.1-3 5.2-3 3.6 0 5.9 3.7 4.4 7.2C19.5 16.4 12 21 12 21z"/></svg>';

  function placeholder(src) {
    const ph = el("div", "ph");
    ph.innerHTML = HEART;
    ph.append(el("span", "ph-hint", src.split("/").pop()));
    return ph;
  }

  function photo(src, alt, onFail) {
    const wrap = el("div", "frame-inner");
    const img = new Image();
    img.loading = "lazy";
    img.decoding = "async";
    img.alt = alt || "";
    img.src = src;
    img.addEventListener("error", () => { img.remove(); wrap.append(placeholder(src)); onFail?.(); });
    wrap.append(img);
    return wrap;
  }

  /* =========================================================
     Isi teks
     ========================================================= */
  text("heroEyebrow", C.hero.eyebrow);
  text("heroTitle", C.hero.title);
  text("heroSubtitle", C.hero.subtitle);
  text("heroName", C.name);
  text("heroLine", C.hero.line);

  text("letterGreeting", C.letter.greeting);
  text("letterClosing", C.letter.closing);
  text("letterSign", C.letter.signature);
  const letterBody = $("letterBody");
  const paraObs = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add("is-in");
      paraObs.unobserve(e.target);
    }
  }, { threshold: .4 });
  for (const para of C.letter.paragraphs) {
    const p = el("p", null, para);
    letterBody.append(p);
    paraObs.observe(p);
  }

  text("togetherFoot", C.together.footnote);
  text("verseArabic", C.together.verseArabic);
  text("verseText", C.together.verseText);
  text("verseRef", C.together.verseRef);

  /* ---------- Penghitung sejak menikah ---------- */
  let counterStarted = false;
  function renderTogether(scale = 1) {
    const s = Math.max(0, Math.floor((now() - weddingAt) / 1000));
    text("ctDays", fmt(Math.round(Math.floor(s / 86400) * scale)));
    text("ctHours", Math.floor((s % 86400) / 3600));
    text("ctMins", Math.floor((s % 3600) / 60));
    text("ctSecs", s % 60);
  }
  renderTogether(0);
  new IntersectionObserver((entries, obs) => {
    if (!entries[0].isIntersecting || counterStarted) return;
    counterStarted = true;
    obs.disconnect();
    const t0 = performance.now(), dur = reduceMotion ? 0 : 2200;
    const step = (t) => {
      const k = dur ? Math.min(1, (t - t0) / dur) : 1;
      renderTogether(1 - Math.pow(1 - k, 3));
      if (k < 1) requestAnimationFrame(step);
      else setInterval(renderTogether, 1000);
    };
    requestAnimationFrame(step);
  }, { threshold: .5 }).observe($("counter"));

  /* ---------- Timeline ---------- */
  const tl = $("timeline");
  C.timeline.forEach((item) => {
    const li = el("li", "tl-item reveal");
    if (/^\d{1,2}\s/.test(item.date)) li.classList.add("is-key");
    li.append(el("span", "tl-dot"));
    const copy = el("div", "tl-copy");
    copy.append(el("span", "tl-date", item.date), el("h3", "tl-title", item.title), el("p", "tl-text", item.text));
    const frame = el("div", "frame");
    frame.append(photo(item.photo, item.title));
    li.append(copy, frame);
    tl.append(li);
    observeReveal(li);
  });

  /* ---------- Galeri + lightbox ---------- */
  const grid = $("galleryGrid");
  const tilts = [-2.5, 1.8, -1.2, 2.6, -1.8, 1.2];

  C.gallery.forEach((item, i) => {
    const fig = el("button", "polaroid reveal");
    fig.type = "button";
    fig.style.setProperty("--r", tilts[i % tilts.length] + "deg");
    const inner = photo(item.photo, item.caption, () => {
      if (!isPreview) fig.remove();
      if (!grid.querySelector(".polaroid img") && !isPreview) $("gallery").hidden = true;
    });
    fig.append(inner, el("figcaption", null, item.caption));
    fig.addEventListener("click", () => {
      if (!fig.querySelector("img")) return;
      openLightbox(galleryItems().findIndex((s) => s.fig === fig));
    });
    grid.append(fig);
    observeReveal(fig);
  });

  // Foto galeri yang gagal dimuat sudah dihapus, jadi sisanya yang bisa dibuka di lightbox.
  const galleryItems = () => [...grid.querySelectorAll(".polaroid")]
    .filter((fig) => fig.querySelector("img"))
    .map((fig) => ({ fig, item: { photo: fig.querySelector("img").getAttribute("src"), caption: fig.querySelector("figcaption").textContent } }));

  const lb = $("lightbox");
  let lbIndex = 0, lbList = [], lastFocus = null;
  function openLightbox(i) {
    lbList = galleryItems();
    if (!lbList.length) return;
    lastFocus = document.activeElement;
    lb.hidden = false;
    showLb(i);
    $("lbClose").focus();
  }
  function showLb(i) {
    lbIndex = (i + lbList.length) % lbList.length;
    const { item } = lbList[lbIndex];
    $("lbImg").src = item.photo;
    $("lbImg").alt = item.caption;
    text("lbCap", item.caption);
  }
  function closeLb() { lb.hidden = true; lastFocus?.focus(); }
  $("lbClose").addEventListener("click", closeLb);
  $("lbPrev").addEventListener("click", () => showLb(lbIndex - 1));
  $("lbNext").addEventListener("click", () => showLb(lbIndex + 1));
  lb.addEventListener("click", (e) => { if (e.target === lb) closeLb(); });
  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowLeft") showLb(lbIndex - 1);
    if (e.key === "ArrowRight") showLb(lbIndex + 1);
  });
  let touchX = null;
  lb.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", (e) => {
    if (touchX == null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) showLb(lbIndex + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  /* ---------- 30 hal ---------- */
  const reasonGrid = $("reasonGrid");
  const opened30 = new Set(store.get("umi30-reasons", []));
  const tiles = [];
  function updateReasonCount() {
    text("reasonCount", opened30.size);
    if (opened30.size === C.reasons.length) {
      document.querySelector(".reason-progress").textContent = C.reasonsDone;
    }
  }
  C.reasons.forEach((reason, i) => {
    const b = el("button", "reason-tile", i + 1);
    b.type = "button";
    b.setAttribute("aria-label", `Hal ke-${i + 1}`);
    if (opened30.has(i)) b.classList.add("is-open");
    b.addEventListener("click", () => {
      tiles.forEach((t) => t.classList.remove("is-current"));
      b.classList.add("is-open", "is-current");
      const card = $("reasonCard");
      card.classList.remove("is-flip");
      void card.offsetWidth;
      card.classList.add("is-flip");
      text("reasonNo", `No. ${i + 1}`);
      text("reasonText", reason);
      const before = opened30.size;
      opened30.add(i);
      store.set("umi30-reasons", [...opened30]);
      updateReasonCount();
      if (before < C.reasons.length && opened30.size === C.reasons.length) {
        const r = b.getBoundingClientRect();
        burst({ particleCount: 120, origin: { x: .5, y: r.top / innerHeight } });
      }
    });
    tiles.push(b);
    reasonGrid.append(b);
  });
  updateReasonCount();

  /* ---------- Anak-anak ---------- */
  const kidsGrid = $("kidsGrid");
  C.kids.forEach((kid, i) => {
    const card = el("article", "kid-card reveal");
    card.style.setProperty("--r", (i % 2 ? 1.2 : -1.2) + "deg");
    const head = el("div", "kid-head");
    const ph = el("div", "kid-photo");
    const img = new Image();
    img.src = kid.photo; img.alt = kid.from; img.loading = "lazy";
    img.addEventListener("error", () => { img.remove(); ph.append(placeholder(kid.photo)); });
    ph.append(img);
    const who = el("div");
    who.append(el("p", "kid-from", "dari " + kid.from), el("p", "kid-age", kid.age));
    head.append(ph, who);
    card.append(head, el("p", "kid-msg", kid.message));
    kidsGrid.append(card);
    observeReveal(card);
  });

  /* ---------- Kupon ---------- */
  const ICONS = {
    sofa: "M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3M3 12a2 2 0 0 1 4 0v2h10v-2a2 2 0 0 1 4 0v5H3zM6 17v2M18 17v2",
    pan: "M3 11h13v1a6.5 6.5 0 0 1-13 0zM16 12h5M8 3.5c-.8 1 .8 2 0 3.5M11.5 3.5c-.8 1 .8 2 0 3.5",
    hands: "M12 20s-7-4.4-9-8.6C1.6 8.2 3.6 5 6.8 5c2 0 3.4 1.1 5.2 3 1.8-1.9 3.2-3 5.2-3 3.2 0 5.2 3.2 3.8 6.4C19 15.6 12 20 12 20z",
    moon: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5zM17 3v3M15.5 4.5h3",
    plate: "M7 3v18M5 3v4a2 2 0 0 0 4 0V3M17 21V3c-2.5 1.5-3 5-3 8h3",
    bed: "M3 18V7M3 14h18v4M21 14v-1a3 3 0 0 0-3-3h-7v4M7 12.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
    star: "M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.6l-5.3 2.8 1.2-6-4.5-4.1 6-.7z",
    crown: "M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"
  };
  const claimed = new Set(store.get("umi30-coupons", []));
  const couponGrid = $("couponGrid");
  const waLink = (msg) => `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(msg)}`;

  C.coupons.forEach((cp, i) => {
    const card = el("article", "coupon reveal");
    if (claimed.has(i)) card.classList.add("is-claimed");
    const stub = el("div", "coupon-stub");
    stub.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[cp.icon] || ICONS.hands}"/></svg>`;
    const body = el("div", "coupon-body");
    const btn = el("button", "coupon-claim", "Tukarkan");
    btn.type = "button";
    btn.addEventListener("click", () => {
      card.classList.add("is-claimed");
      claimed.add(i);
      store.set("umi30-coupons", [...claimed]);
      const r = card.getBoundingClientRect();
      burst({ particleCount: 50, spread: 60, origin: { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight } });
      if (C.whatsapp) {
        setTimeout(() => window.open(waLink(`${C.husband}, ${C.nickname} mau tukar kupon “${cp.title}” ya 💌`), "_blank", "noopener"), 700);
      }
    });
    body.append(el("h3", "coupon-title", cp.title), el("p", "coupon-text", cp.text), btn);
    card.append(stub, body, el("span", "coupon-stamp", "DITUKAR"));
    couponGrid.append(card);
    observeReveal(card);
  });

  /* ---------- Kue & lilin ---------- */
  const cakeBtn = $("cakeBtn");
  const micBtn = $("micBtn");
  const cakeSection = $("cake");
  let micStream = null, micCtx = null, listening = false;

  text("cakeHint", C.cake.hint);
  text("micBtn", C.cake.micButton);
  text("cakeTap", C.cake.tapHint);

  function stopMic() {
    listening = false;
    micStream?.getTracks().forEach((t) => t.stop());
    micCtx?.close().catch(() => {});
    micStream = micCtx = null;
    if (musicWanted && !bgm.paused) fadeTo(MAX_VOL, 1500);
  }

  function blowOut() {
    if (cakeBtn.classList.contains("is-out")) return;
    stopMic();
    cakeBtn.classList.add("is-out");
    cakeBtn.setAttribute("aria-label", "Nyalakan lilin lagi");
    cakeSection.classList.add("is-done");
    text("cakeDone", C.cake.done);
    if (typeof window.confetti === "function" && !reduceMotion) {
      const end = Date.now() + 2500;
      (function frame() {
        window.confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: .7 }, colors: confettiColors });
        window.confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: .7 }, colors: confettiColors });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    }
  }

  function relight() {
    cakeBtn.classList.remove("is-out");
    cakeBtn.setAttribute("aria-label", "Tiup lilin");
    cakeSection.classList.remove("is-done");
    text("cakeDone", "");
  }

  cakeBtn.addEventListener("click", () => (cakeBtn.classList.contains("is-out") ? relight() : blowOut()));

  micBtn.addEventListener("click", async () => {
    if (listening) return;
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: false } });
    } catch {
      micBtn.disabled = true;
      text("micBtn", "Mikrofon tidak tersedia");
      text("cakeTap", "Sentuh apinya untuk meniup.");
      return;
    }
    listening = true;
    text("micBtn", "Tiup sekarang…");
    if (musicWanted && !bgm.paused) fadeTo(.08, 600);
    micCtx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = micCtx.createAnalyser();
    analyser.fftSize = 1024;
    micCtx.createMediaStreamSource(micStream).connect(analyser);
    const data = new Uint8Array(analyser.fftSize);
    let loud = 0;
    (function listen() {
      if (!listening) return;
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (const v of data) { const x = (v - 128) / 128; sum += x * x; }
      const rms = Math.sqrt(sum / data.length);
      loud = rms > .16 ? loud + 1 : Math.max(0, loud - 1);
      if (loud > 8) { blowOut(); text("micBtn", C.cake.micButton); return; }
      requestAnimationFrame(listen);
    })();
  });

  /* ---------- Doa & penutup ---------- */
  text("prayerArabic", C.prayer.arabic);
  text("prayerLatin", C.prayer.latin);
  text("prayerMeaning", C.prayer.meaning);
  text("prayerDoa", C.prayer.doa);
  text("quranArabic", C.prayer.quranArabic);
  text("quranText", C.prayer.quranText);
  text("quranRef", C.prayer.quranRef);

  text("closing1", C.closing.line1);
  text("closing2", C.closing.line2);
  text("closingFrom", C.closing.from);
  text("replayBtn", C.closing.replayButton);
  if (C.whatsapp) {
    const reply = $("replyBtn");
    reply.textContent = C.closing.replyButton;
    reply.href = waLink(`${C.husband}, ${C.nickname} sudah baca semuanya. `);
    reply.hidden = false;
  }
  $("replayBtn").addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));

  document.querySelectorAll(".reveal").forEach(observeReveal);

  // ?preview=1&skip=1 langsung ke halaman utama (untuk mengecek isi saja).
  if (isPreview && params.has("skip")) {
    opened = true;
    musicBtn.hidden = !musicOk;
    setMusicUI(false);
    openSite();
  }
})();
