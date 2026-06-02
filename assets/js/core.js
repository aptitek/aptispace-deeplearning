// ==========================================
// core.js — Design Tokens & UI Components
// Hierarchy: TOKENS → ATOMS → MOLECULES → ORGANISMS
// ==========================================

// ─────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────

export const theme = {
  colors: {
    background: "transparent",
    surface: "rgba(var(--sol-base03-rgb), 0.2)",
    surfaceHover: "rgba(var(--sol-base03-rgb), 0.3)",
    text: "var(--sol-base0)",
    textMuted: "var(--sol-base01)",
    primary: "var(--sol-yellow)",
    success: "var(--sol-green)",
    warning: "var(--sol-orange)",
    danger: "var(--sol-red)",
    info: "var(--sol-blue)",
    debug: "var(--sol-violet)",
    terminalBg: "var(--sol-base03)",
    terminalText: "var(--sol-green)",
    terminalMuted: "var(--sol-base01)"
  },
  radius: "8px",
  radiusSmall: "4px",
  fontSans: '"Recursive", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontMono: '"Recursive", SFMono-Regular, Menlo, Monaco, Consolas, monospace'
};

// Resolves a CSS custom property through getComputedStyle (DOM-safe).
export const getThemeColor = (varName, fallback) => {
  if (typeof window !== "undefined") {
    const el = document.body || document.documentElement;
    const value = getComputedStyle(el).getPropertyValue(varName).trim();
    if (value) return resolveCssValue(value);
  }
  return fallback;
};

// Recursively resolves up to 3 levels of var(--name) so Canvas 2D contexts can consume them.
export function resolveCssValue(value) {
  if (!value) return "";
  let resolved = value;
  const varRegex = /var\((--[^,)]+)(?:,\s*([^)]+))?\)/g;
  for (let i = 0; i < 3; i++) {
    if (!resolved.includes("var(")) break;
    resolved = resolved.replace(varRegex, (_match, varName, fallback) => {
      const el = document.body || document.documentElement;
      const computed = getComputedStyle(el).getPropertyValue(varName.trim()).trim();
      return computed || (fallback ? fallback.trim() : "");
    });
  }
  return resolved;
}

// Returns a Plotly layout object with colors resolved from the live theme at call time.
export const getPlotlyTheme = () => ({
  layout: {
    font: {
      family: getThemeColor("--font-code", "Consolas, monospace"),
      color: getThemeColor("--sol-base00", "#657b83")
    },
    paper_bgcolor: getThemeColor("--sol-base3", "#fdf6e3"),
    plot_bgcolor: getThemeColor("--sol-base2", "#eee8d5"),
    colorway: [
      getThemeColor("--sol-blue", "#268bd2"),
      getThemeColor("--sol-orange", "#cb4b16"),
      getThemeColor("--sol-green", "#859900"),
      getThemeColor("--sol-yellow", "#b58900")
    ]
  }
});

// ─────────────────────────────────────────
// ⚛  ATOMS — stateless primitives
// ─────────────────────────────────────────

/** Invisible sentinel element — return from OJS side-effect cells. */
export const noop = () => {
  const el = document.createElement("span");
  el.className = "d-none";
  return el;
};

export const utils = {
  generateId: () => 'aptitek_' + Math.random().toString(36).substring(2, 11),
  formatNumber: (num, decimals = 3) =>
    typeof num === 'number' ? num.toLocaleString(undefined, { maximumFractionDigits: decimals }) : num,
  truncateText: (str, maxLength = 50) =>
    typeof str === 'string' && str.length > maxLength ? str.slice(0, maxLength) + "…" : str,
  // Converts a resolved hex/rgb color to rgba — needed by Canvas 2D contexts.
  rgba: (color, alpha) => {
    if (!color) return color;
    if (color.includes('rgb')) {
      const matches = color.match(/\d+/g);
      if (matches?.length >= 3) return `rgba(${matches[0]}, ${matches[1]}, ${matches[2]}, ${alpha})`;
    }
    const hex = color.replace('#', '').trim();
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
  }
};

/** Parses a compiled Markdown table into an array of row objects keyed by header. */
export function parseTableData(selector) {
  const table = document.querySelector(selector);
  if (!table) return [];
  const headers = Array.from(table.querySelectorAll("th")).map(th => th.textContent.trim());
  return Array.from(table.querySelectorAll("tbody tr")).map(row => {
    const cells = Array.from(row.querySelectorAll("td")).map(td => td.innerHTML.trim());
    return Object.fromEntries(headers.map((h, i) => [h, cells[i]]));
  });
}

/** Fills a single element's {{variable}} placeholders from a data object. */
export function renderTemplate(elementOrSelector, data = {}) {
  const container = typeof elementOrSelector === 'string'
    ? document.querySelector(elementOrSelector)
    : elementOrSelector;
  if (!container) return;
  if (!container.dataset.tpl) container.dataset.tpl = container.innerHTML;
  container.innerHTML = _applyTemplate(container.dataset.tpl, data);
}

/** Renders a list of items into a container using a stored HTML template. */
export function renderListTemplate(containerSelector, templateSelector, listData = []) {
  const container = document.querySelector(containerSelector);
  const tplElement = document.querySelector(templateSelector);
  if (!container || !tplElement) return;
  if (!tplElement.dataset.tpl) tplElement.dataset.tpl = tplElement.innerHTML;
  container.innerHTML = "";
  listData.forEach(data =>
    container.insertAdjacentHTML('beforeend', _applyTemplate(tplElement.dataset.tpl, data))
  );
}

function _applyTemplate(htmlString, data) {
  let html = htmlString;
  for (const [key, value] of Object.entries(data)) {
    html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return html;
}

/**
 * Labeled range slider with state-colored badge and optional tick labels.
 * Dispatches a standard "input" event; read `el.value` for the current number.
 */
export function createSlider({ label, labels, value = 0, min = 0, max = 3, step = 1, state } = {}) {
  const container = document.createElement("div");
  container.className = "sim-slider";
  container.setAttribute("data-state", state ?? value);

  const header = document.createElement("div");
  header.className = "slider-header";

  const labelEl = document.createElement("label");
  labelEl.textContent = label;

  const badge = document.createElement("span");
  badge.className = "badge font-monospace";
  badge.textContent = labels ? labels[value] : value;

  header.append(labelEl, badge);

  const input = document.createElement("input");
  input.type = "range";
  Object.assign(input, { min, max, step, value, className: "slider-input" });

  container.append(header, input);

  if (labels) {
    const ticks = document.createElement("div");
    ticks.className = "slider-ticks";
    labels.forEach(l => {
      const span = document.createElement("span");
      span.textContent = l;
      ticks.appendChild(span);
    });
    container.appendChild(ticks);
  }

  input.oninput = () => {
    container.setAttribute("data-state", state ?? input.value);
    badge.textContent = labels ? labels[input.value] : input.value;
    container.value = step % 1 === 0 ? parseInt(input.value) : parseFloat(input.value);
    container.dispatchEvent(new CustomEvent("input"));
  };

  container.value = value;
  return container;
}

// ─────────────────────────────────────────
// 🧬 MOLECULES — composed atoms with behavior
// ─────────────────────────────────────────

/**
 * Injects Bootstrap icons from pane/heading `bi-*` classes into tabset nav links.
 * No-op if the `bi-icons.lua` Quarto filter already injected them at compile time.
 */
export function setupTabIcons(tabsetSelector) {
  const panes = document.querySelectorAll(`${tabsetSelector} .tab-pane`);
  const links = document.querySelectorAll(`${tabsetSelector} .nav-link`);
  panes.forEach((pane, i) => {
    const link = links[i];
    if (!link || link.querySelector("i.bi")) return;
    const source = pane.classList.length ? pane : pane.querySelector("h1,h2,h3,h4,h5,h6");
    const biClass = source && Array.from(source.classList).find(c => c.startsWith("bi-"));
    if (!biClass) return;
    const icon = document.createElement("i");
    icon.className = `bi ${biClass} me-1`;
    link.prepend(icon);
  });
}

/**
 * Watches a Quarto panel-tabset for active-tab changes and calls onChange(value).
 * Also injects `bi-*` icons from pane classes into nav links.
 * Returns `{ destroy() }` for OJS invalidation cleanup.
 *
 * @example
 * const w = createTabsetWatcher(".my-tabset", { "Tab A": "a" }, v => { mutable x = v; });
 * invalidation.then(() => w.destroy());
 */
export function createTabsetWatcher(tabsetSelector, labelMap, onChange) {
  const tabset = document.querySelector(tabsetSelector);
  if (tabset) {
    const links = tabset.querySelectorAll(".nav-link");
    const panes = tabset.querySelectorAll(".tab-pane");
    links.forEach((link, i) => {
      if (link.innerHTML) link.innerHTML = link.innerHTML.replace(/�/g, "").trim();
      const pane = panes[i];
      if (!pane) return;
      let biClass = Array.from(pane.classList).find(c => c.startsWith("bi-"));
      if (!biClass) {
        const heading = pane.querySelector("h1,h2,h3,h4,h5,h6");
        if (heading) biClass = Array.from(heading.classList).find(c => c.startsWith("bi-"));
      }
      if (biClass) {
        link.querySelectorAll("i.bi").forEach(icon => icon.remove());
        const icon = document.createElement("i");
        icon.className = `bi ${biClass} me-1`;
        link.prepend(icon);
      }
    });
  }

  function syncActive() {
    const active = document.querySelector(`${tabsetSelector} .nav-link.active`);
    if (!active) return;
    const label = active.textContent.replace(/�/g, "").trim();
    const val = labelMap[label];
    if (val !== undefined) onChange(val);
  }

  syncActive();
  const nav = document.querySelector(`${tabsetSelector} .nav-tabs`);
  const observer = nav ? new MutationObserver(syncActive) : null;
  if (observer) observer.observe(nav, { subtree: true, attributeFilter: ["class"] });
  return { destroy: () => observer?.disconnect() };
}

/**
 * Moves `.btn-tab-action` buttons from `.tab-actions` divs into their parent tabset's nav bar.
 * Call once on page load; targets all `.tab-actions` containers in the DOM.
 */
export function setupTabActions() {
  document.querySelectorAll('.tab-actions').forEach(container => {
    const tabset = container.closest('.panel-tabset')
      ?? container.previousElementSibling?.closest('.panel-tabset')
      ?? container.parentElement?.querySelector('.panel-tabset');
    if (!tabset) { console.warn("setupTabActions: tabset not found for", container); return; }
    const navTabs = tabset.querySelector('.nav-tabs');
    if (!navTabs) { console.warn("setupTabActions: nav-tabs not found"); return; }
    container.querySelectorAll('.btn-tab-action').forEach(btn => {
      const li = document.createElement('li');
      li.className = 'nav-item ms-auto d-flex align-items-center';
      li.appendChild(btn);
      navTabs.appendChild(li);
    });
    container.classList.add("d-none");
  });
}

// ─────────────────────────────────────────
// 🦠 ORGANISMS — full stateful systems with lifecycle
// ─────────────────────────────────────────

/**
 * Lightweight step sequencer for driving animations and interactive simulations.
 * Calls `onStateChange(state, index)` immediately on start and on every interval tick.
 */
export class StateMachine {
  constructor({ states = [], interval = 950, onStateChange = () => {}, loop = true } = {}) {
    this.states = states;
    this.currentIndex = 0;
    this.interval = interval;
    this.onStateChange = onStateChange;
    this.loop = loop;
    this.timer = null;
    this.isPlaying = false;
  }

  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.onStateChange(this.states[this.currentIndex], this.currentIndex);
    this.timer = setInterval(() => this.next(), this.interval);
  }

  next() {
    if (!this.isPlaying) return;
    this.currentIndex++;
    if (this.currentIndex >= this.states.length) {
      if (this.loop) this.currentIndex = 0;
      else { this.stop(); return; }
    }
    this.onStateChange(this.states[this.currentIndex], this.currentIndex);
  }

  stop() {
    this.isPlaying = false;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  reset() {
    this.stop();
    this.currentIndex = 0;
    this.onStateChange(this.states[0], 0);
  }
}

/**
 * Binds play/pause/reset buttons to a StateMachine and keeps their active states in sync.
 * Elements can be CSS selectors or DOM references. Call `destroy()` on OJS invalidation.
 */
export class SimulationController {
  constructor(stateMachine, elements = {}, options = {}) {
    this.sm = stateMachine;
    const resolve = el => (typeof el === "string" ? document.querySelector(el) : el);
    this.playBtn  = resolve(elements.play);
    this.pauseBtn = resolve(elements.pause);
    this.resetBtn = resolve(elements.reset);
    this.descBox  = resolve(elements.description);

    this.onPlay   = options.onPlay   ?? (() => {});
    this.onPause  = options.onPause  ?? (() => {});
    this.onReset  = options.onReset  ?? (() => {});

    const prev = this.sm.onStateChange;
    this.sm.onStateChange = (state, index) => {
      prev(state, index);
      this._sync();
      (options.onStateChange ?? (() => {}))(state, index);
    };

    this._bindEvents();
    this._sync();
  }

  _bindEvents() {
    this._ph = () => { this.sm.start(); this._sync(); this.onPlay(); };
    this._sh = () => { this.sm.stop();  this._sync(); this.onPause(); };
    this._rh = () => { this.sm.reset(); this._sync(); this.onReset(); };
    this.playBtn?.addEventListener("click", this._ph);
    this.pauseBtn?.addEventListener("click", this._sh);
    this.resetBtn?.addEventListener("click", this._rh);
  }

  _sync() {
    this.playBtn?.classList.toggle("active", this.sm.isPlaying);
    this.pauseBtn?.classList.toggle("active", !this.sm.isPlaying && this.sm.currentIndex > 0);
    if (this.descBox) {
      this.descBox.textContent = this.sm.states[this.sm.currentIndex]?.description ?? "";
    }
  }

  destroy() {
    this.sm.stop();
    this.playBtn?.removeEventListener("click", this._ph);
    this.pauseBtn?.removeEventListener("click", this._sh);
    this.resetBtn?.removeEventListener("click", this._rh);
  }
}
