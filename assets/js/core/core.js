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
      color: getThemeColor("--sol-base00", "var(--sol-base00)")
    },
    paper_bgcolor: getThemeColor("--sol-base3", "var(--sol-base3)"),
    plot_bgcolor: getThemeColor("--sol-base2", "var(--sol-base2)"),
    colorway: [
      getThemeColor("--sol-blue", "var(--sol-blue)"),
      getThemeColor("--sol-orange", "var(--sol-orange)"),
      getThemeColor("--sol-green", "var(--sol-green)"),
      getThemeColor("--sol-yellow", "var(--sol-yellow)")
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
 * Horizontal range slider with state-colored badge, direction arrow, and optional tick labels.
 * direction "right" → increase end is on the right (▶), default
 * direction "left"  → increase end is on the left  (◀)
 * Dispatches a standard "input" event; read `el.value` for the current number.
 */
export function createSlider({ label, labels, value = 0, min = 0, max = 3, step = 1, state, direction = "right" } = {}) {
  const container = document.createElement("div");
  container.className = "sim-slider";
  container.setAttribute("data-state", state ?? value);
  container.setAttribute("data-direction", direction);

  const header = document.createElement("div");
  header.className = "slider-header";

  const labelEl = document.createElement("label");
  labelEl.textContent = label;

  const badge = document.createElement("span");
  badge.className = "badge font-monospace slider-v-badge";
  badge.textContent = labels ? labels[value] : value;

  header.append(labelEl, badge);

  const input = document.createElement("input");
  input.type = "range";
  Object.assign(input, { min, max, step, value, className: "slider-input" });

  const arrow = document.createElement("div");
  arrow.className = "slider-v-arrow slider-h-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.innerHTML = direction === "right" ? "&#9654;" : "&#9664;"; // ▶ or ◀

  const trackRow = document.createElement("div");
  trackRow.className = "slider-track-row";
  if (direction === "right") {
    trackRow.append(input, arrow);
  } else {
    trackRow.append(arrow, input);
  }

  container.append(header, trackRow);

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

/**
 * Vertical range slider for placement on the sides of graphs.
 * direction "up"   → dragging up increases the value (max at top)
 * direction "down" → dragging down increases the value (max at bottom)
 * Dispatches a standard "input" event; read .value for the current number.
 */
export function createVerticalSlider({
  label = "",
  value = 0,
  min = 0,
  max = 100,
  step = 1,
  direction = "up",
  height = 160,
  state
} = {}) {
  const decimals = step.toString().includes(".")
    ? step.toString().split(".")[1].length
    : 0;
  const fmt = v => decimals === 0 ? parseInt(v) : parseFloat(v).toFixed(decimals);

  const container = document.createElement("div");
  container.className = `sim-slider-v sim-slider-v--${direction}`;
  container.setAttribute("data-state", state ?? 0);

  const input = document.createElement("input");
  input.type = "range";
  input.min = min;
  input.max = max;
  input.step = step;
  input.value = value;
  input.className = "slider-v-input";
  input.style.setProperty("--slider-v-height", `${height}px`);

  const badge = document.createElement("span");
  badge.className = "badge font-monospace slider-v-badge";
  badge.textContent = fmt(value);

  const labelEl = document.createElement("span");
  labelEl.className = "slider-v-label";
  labelEl.textContent = label;

  const arrow = document.createElement("div");
  arrow.className = "slider-v-arrow";
  arrow.setAttribute("aria-hidden", "true");
  arrow.innerHTML = direction === "up" ? "&#9650;" : "&#9660;";

  // "up":   [▲ arrow] [input, CSS-flipped] [badge] [label]  — increase end is top
  // "down": [label] [badge] [input] [▼ arrow]                — increase end is bottom
  if (direction === "up") {
    container.append(arrow, input, badge, labelEl);
  } else {
    container.append(labelEl, badge, input, arrow);
  }

  input.addEventListener("input", () => {
    const numVal = decimals === 0 ? parseInt(input.value) : parseFloat(input.value);
    badge.textContent = fmt(input.value);
    container.value = numVal;
    if (state === undefined) {
      const normalized = (parseFloat(input.value) - min) / (max - min);
      container.setAttribute("data-state", Math.min(3, Math.floor(normalized * 4)));
    }
    container.dispatchEvent(new CustomEvent("input"));
  });

  container.value = decimals === 0 ? parseInt(value) : parseFloat(value);
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

  let currentVal;

  function syncActive() {
    const active = document.querySelector(`${tabsetSelector} .nav-link.active`);
    if (!active) return;
    const label = active.textContent.replace(/�/g, "").trim();
    const val = labelMap[label];
    // Guard: skip onChange if the value hasn't actually changed.
    // Without this, sim-control buttons living in the same nav bar have their
    // classes toggled every animation frame, which fires this MutationObserver
    // and triggers spurious mutable assignments that cascade into OJS re-runs.
    if (val !== undefined && val !== currentVal) {
      currentVal = val;
      onChange(val);
    }
  }

  syncActive();
  const nav = document.querySelector(`${tabsetSelector} .nav-tabs`);
  // Narrow the observer: only react when an actual .nav-link element's class changes,
  // not when sim-control buttons inside the same nav bar are shown/hidden.
  const observer = nav ? new MutationObserver(mutations => {
    if (mutations.some(m => m.target.classList?.contains("nav-link"))) syncActive();
  }) : null;
  if (observer) observer.observe(nav, { subtree: true, attributeFilter: ["class"] });
  return { destroy: () => observer?.disconnect() };
}

/**
 * Moves all `.btn` elements from `.tab-actions` divs into their parent tabset's nav bar,
 * grouped in a single `<li>` pushed to the right via `ms-auto`.
 * Called automatically on DOMContentLoaded; safe to call again (idempotent via `d-none` guard).
 */
export function setupTabActions() {
  document.querySelectorAll('.tab-actions:not(.d-none)').forEach(container => {
    const tabset = container.closest('.panel-tabset')
      ?? container.previousElementSibling?.closest('.panel-tabset')
      ?? container.parentElement?.querySelector('.panel-tabset');
    if (!tabset) return;
    const navTabs = tabset.querySelector('.nav-tabs');
    if (!navTabs) return;
    const btns = container.querySelectorAll('.btn');
    if (!btns.length) return;
    const li = document.createElement('li');
    li.className = 'nav-item ms-auto d-flex align-items-center gap-1';
    btns.forEach(btn => li.appendChild(btn));
    navTabs.appendChild(li);
    container.classList.add("d-none");
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupTabActions);
  } else {
    setupTabActions();
  }
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
 *
 * Visibility rules:
 *   - play:  always visible
 *   - pause: visible only while running (isPlaying)
 *   - reset: visible once something has happened (currentIndex > 0 or isPlaying)
 *
 * Options:
 *   - compact: true  → icon-only buttons (adds .btn-icon-only class)
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

    if (options.compact) {
      this.playBtn?.classList.add("btn-icon-only");
      this.pauseBtn?.classList.add("btn-icon-only");
      this.resetBtn?.classList.add("btn-icon-only");
    }

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
    const playing = this.sm.isPlaying;
    const started = playing || this.sm.currentIndex > 0;

    this.playBtn?.classList.toggle("active", playing);
    this.pauseBtn?.classList.toggle("sim-hidden", !playing);
    this.resetBtn?.classList.toggle("sim-hidden", !started);

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
