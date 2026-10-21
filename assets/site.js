/* Abundance: interactions. Content lives in the HTML; this file only adds behaviour. */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const onView = (el, fn, opts = { threshold: 0.35 }) => {
    if (!("IntersectionObserver" in window)) return fn();
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { fn(); io.disconnect(); } }), opts);
    io.observe(el);
  };

  /* Header shadow once scrolled; close the mobile menu after choosing a link */
  const header = $(".site-header");
  const onScroll = () => header?.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  $$(".menu nav a").forEach((a) => a.addEventListener("click", () => a.closest("details").removeAttribute("open")));

  /* Hero panels: the hovered or focused panel opens */
  $$(".panels").forEach((row) => {
    const panels = $$(".panel", row);
    const open = (p) => panels.forEach((x) => x.classList.toggle("is-open", x === p));
    panels.forEach((p) => {
      p.addEventListener("mouseenter", () => open(p));
      p.addEventListener("focusin", () => open(p));
    });
  });

  /* Tabs: [data-tabs] with [role=tab][aria-controls] */
  $$("[data-tabs]").forEach((root) => {
    const tabs = $$("[role=tab]", root);
    const select = (t, focus) => {
      tabs.forEach((x) => {
        const on = x === t;
        x.setAttribute("aria-selected", String(on));
        x.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(x.getAttribute("aria-controls"));
        panel.hidden = !on;
        if (on && !calm) { panel.classList.remove("fade-in"); void panel.offsetWidth; panel.classList.add("fade-in"); }
      });
      if (focus) t.focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(t));
      t.addEventListener("keydown", (e) => {
        const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (d) { e.preventDefault(); select(tabs[(i + d + tabs.length) % tabs.length], true); }
      });
    });
  });

  /* Ecosystem switch: fragmented ↔ connected; joins up the first time it is seen */
  $$("[data-eco]").forEach((root) => {
    const svgs = $$(".eco", root);           // a wide drawing and a tall one for phones
    const radios = $$("input[type=radio]", root);
    const copy = $$("[data-state-copy]", root);
    const caption = $(".eco-caption", root);
    const defaultCaption = caption.innerHTML;
    let touched = false;
    const set = (state) => {
      svgs.forEach((svg) => (svg.dataset.state = state));
      radios.forEach((r) => (r.checked = r.value === state));
      copy.forEach((c) => (c.hidden = c.dataset.stateCopy !== state));
    };
    radios.forEach((r) => r.addEventListener("change", () => { touched = true; set(r.value); }));
    $$(".node", root).forEach((n) => {
      const show = () => (caption.innerHTML = `<b>${n.dataset.name}</b>${n.dataset.role}`);
      n.addEventListener("mouseenter", show);
      n.addEventListener("focus", show);
      n.addEventListener("click", show);
      n.addEventListener("mouseleave", () => (caption.innerHTML = defaultCaption));
      n.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); show(); } });
    });
    set("fragmented");
    onView(root.lastElementChild, () => setTimeout(() => { if (!touched) set("connected"); }, calm ? 0 : 700), { threshold: 0.4 });
  });

  /* Kapunga story: the field grows as each stage scrolls into the middle of the screen */
  $$("[data-story]").forEach((root) => {
    const steps = $$(".story-step", root);
    const field = $(".field", root);
    const when = $(".field-badge .when", root);
    const count = $(".field-badge .count", root);
    const meter = $$(".story-meter i", root);
    const activate = (i) => {
      steps.forEach((s, k) => s.classList.toggle("is-active", k === i));
      for (let k = 2; k <= steps.length; k++) field.classList.toggle("s" + k, k <= i + 1);
      when.textContent = steps[i].dataset.when;
      count.textContent = `Stage ${i + 1} of ${steps.length}`;
      meter.forEach((m, k) => m.classList.toggle("on", k <= i));
    };
    activate(0);
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) activate(steps.indexOf(e.target)); }),
      { rootMargin: "-45% 0px -45% 0px" });
    steps.forEach((s) => io.observe(s));
  });

  /* Yield unit chart: before / after */
  $$("[data-yield]").forEach((root) => {
    const cells = $$(".units i", root);
    const num = $(".yield-num", root);
    const note = $(".yield-note", root);
    const radios = $$("input[type=radio]", root);
    const set = (r) => {
      const n = Number(r.dataset.cells);
      cells.forEach((c, i) => {
        c.style.transitionDelay = calm ? "0s" : (n > 10 ? i * 9 : (cells.length - i) * 4) + "ms";
        c.classList.toggle("on", i < n);
      });
      num.innerHTML = r.dataset.value + "<small>t/ha</small>";
      note.textContent = r.dataset.note;
    };
    radios.forEach((r) => r.addEventListener("change", () => set(r)));
    set(radios.find((r) => r.checked));
    const after = radios.find((r) => r.value === "after");
    onView(root, () => setTimeout(() => { if (!after.checked) { after.checked = true; set(after); } }, calm ? 0 : 900), { threshold: 0.5 });
  });

  /* Five shifts: vertical scroll drives a horizontal track on wide screens */
  $$("[data-hscroll]").forEach((root) => {
    const viewport = $(".hs-viewport", root);
    const track = $(".hs-track", root);
    const bar = $(".hs-progress span", root);
    const wide = window.matchMedia("(min-width: 981px)");
    let distance = 0;
    const layout = () => {
      const pin = wide.matches && !calm;
      root.classList.toggle("hs-on", pin);
      if (!pin) { root.style.height = ""; track.style.transform = ""; return; }
      distance = Math.max(0, track.scrollWidth - viewport.clientWidth + 2 * parseFloat(getComputedStyle(viewport).paddingLeft));
      root.style.height = window.innerHeight + distance + "px";
      update();
    };
    const update = () => {
      if (root.classList.contains("hs-on")) {
        const p = Math.min(1, Math.max(0, -root.getBoundingClientRect().top / (root.offsetHeight - window.innerHeight || 1)));
        track.style.transform = `translate3d(${-p * distance}px,0,0)`;
        bar.style.width = p * 100 + "%";
      } else {
        const max = viewport.scrollWidth - viewport.clientWidth;
        bar.style.width = (max > 0 ? (viewport.scrollLeft / max) * 100 : 100) + "%";
      }
    };
    window.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
    viewport.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
    window.addEventListener("resize", layout);
    wide.addEventListener?.("change", layout);
    window.addEventListener("load", layout);
    layout();
  });

  /* Model page: highlight the step in view and fill the rail */
  $$("[data-spy]").forEach((root) => {
    const links = $$(".spy-nav a", root);
    const fill = $(".spy-fill", root);
    const steps = links.map((a) => document.getElementById(a.hash.slice(1)));
    const mark = (i) => {
      links.forEach((a, k) => a.classList.toggle("is-active", k === i));
      const a = links[i];
      const nav = a.closest(".spy-nav");
      if (nav.scrollWidth > nav.clientWidth) nav.scrollLeft = a.offsetLeft - 16;
      fill.style.height = a.offsetTop + a.offsetHeight - 6 + "px";
    };
    mark(0);
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) mark(steps.indexOf(e.target)); }),
      { rootMargin: "-40% 0px -55% 0px" });
    steps.forEach((s) => io.observe(s));
  });

  /* Engage form: preselect the route from ?route=, validate, report status */
  const form = document.getElementById("form");
  if (form) {
    const route = new URLSearchParams(location.search).get("route");
    const radio = route && form.querySelector(`input[name="route"][value="${CSS.escape(route)}"]`);
    if (radio) radio.checked = true;
    const status = form.querySelector(".form-status");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      status.hidden = false;
      if (!form.checkValidity()) {
        status.innerHTML = "<p><b>A few details are missing.</b> Please choose a route and fill in your name, email, organisation, country and message.</p>";
        form.querySelector(":invalid")?.focus();
        return;
      }
      // TODO: connect to the form endpoint (e.g. Formspree, Netlify Forms or a CRM) and route by `route`
      status.innerHTML = "<p><b>The form is not connected yet.</b> [TODO: form endpoint] Your message has not been sent.</p>";
    });
  }
})();
