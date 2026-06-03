// =====================================================================
// plots.js — Centralised Plotly rendering with override hierarchy
// =====================================================================
//
// Override order (lowest → highest priority):
//   Plotly template (Solarized palette, fonts)
//   → BASE_LAYOUT (transparent bg, default margins)
//   → AXIS_DEFAULTS (grid/zeroline colours)
//   → caller layoutOverrides
//
// All Plotly.react calls converge through plotReact().
// Plotly.newPlot is used only for funnelarea / funnel chart types (no
// diff semantics needed) and for createPlot3D (3D scene init).
// =====================================================================
import { getPlotlyTheme, resolveCssValue } from "./core.js";

// ── Deep merge ─────────────────────────────────────────────────────────
// Recursively merges plain objects. Arrays are always replaced (never merged).
// Undefined values in sources are silently skipped.
export function deepMerge(base, ...sources) {
  const result = { ...base };
  for (const src of sources) {
    if (src == null || typeof src !== "object") continue;
    for (const [k, v] of Object.entries(src)) {
      if (v === undefined) continue;
      if (
        v !== null &&
        typeof v === "object" &&
        !Array.isArray(v) &&
        typeof result[k] === "object" &&
        result[k] !== null &&
        !Array.isArray(result[k])
      ) {
        result[k] = deepMerge(result[k], v);
      } else {
        result[k] = v;
      }
    }
  }
  return result;
}

// ── Shared default layers ──────────────────────────────────────────────
const BASE_LAYOUT = {
  paper_bgcolor: "transparent",
  plot_bgcolor:  "transparent",
  showlegend:    false,
  margin:        { t: 15, r: 15, b: 40, l: 40 },
};

// Applied to every xaxis / yaxis unless the caller explicitly overrides
const AXIS_DEFAULTS = {
  gridcolor:     "rgba(88, 110, 117, 0.15)",
  zerolinecolor: "rgba(88, 110, 117, 0.4)",
};

// ── Private helpers ────────────────────────────────────────────────────
function _el(divId) {
  return typeof divId === "string" ? document.getElementById(divId) : divId;
}

function _floorHeight(el, layout) {
  const h = layout?.height ?? 260;
  if (el.offsetHeight < h) el.style.setProperty("min-height", `${h}px`);
}

function _attachResize(el) {
  if (!el._resizeObserver) {
    el._resizeObserver = new ResizeObserver(() => Plotly.Plots.resize(el));
    el._resizeObserver.observe(el);
  }
}

// Build the fully-merged layout for a standard 2-D chart.
function _buildLayout(overrides = {}) {
  return deepMerge(
    { template: getPlotlyTheme() },   // Solarized palette & typography
    BASE_LAYOUT,
    { xaxis: AXIS_DEFAULTS, yaxis: AXIS_DEFAULTS },
    overrides,
  );
}

// ═══════════════════════════════════════════════════════════════════════
// plotReact — the single Plotly.react call site
// ═══════════════════════════════════════════════════════════════════════
/**
 * Render or update a Plotly chart with the full default hierarchy applied.
 *
 * @param {string|HTMLElement} divId
 * @param {Array}  traces          Fully-formed Plotly trace objects.
 * @param {Object} layoutOverrides Partial layout; deep-merged over defaults.
 * @param {Object} configOverrides Partial config; shallow-merged.
 */
export function plotReact(divId, traces, layoutOverrides = {}, configOverrides = {}) {
  const el = _el(divId);
  if (!el) return;

  const layout = _buildLayout(layoutOverrides);
  const config = { responsive: true, displayModeBar: false, ...configOverrides };

  _floorHeight(el, layout);
  Plotly.react(el, traces, layout, config);
  el.layout = layout;   // preserved for downstream Plotly.react calls
  _attachResize(el);
}

// ═══════════════════════════════════════════════════════════════════════
// Typed chart builders
// Each function builds typed traces and delegates to plotReact.
// ═══════════════════════════════════════════════════════════════════════

/**
 * Multi-series line / scatter chart.
 *
 * series: Array<{
 *   x, y,
 *   name?,      // legend label
 *   color?,     // CSS variable or resolved hex
 *   dash?,      // "solid" | "dot" | "dash" | "dashdot"
 *   width?,     // line width (default 2.5)
 *   mode?,      // "lines" | "markers" | "lines+markers" | …
 *   fill?,      // "tozeroy" | "toself" | …
 *   fillcolor?, // fill colour (hex / rgba)
 *   opacity?,   // overall trace opacity
 *   yaxis?,     // "y2" for dual-axis
 *   text?,      // per-point hover text
 *   extra?,     // any additional Plotly trace fields
 * }>
 */
export function plotLines(divId, series, layoutOverrides = {}) {
  const traces = series.map(s => {
    const t = {
      x: s.x,
      y: s.y,
      mode: s.mode ?? "lines",
      type: "scatter",
      name: s.name,
      line: {
        color: resolveCssValue(s.color ?? "var(--body-color)"),
        width: s.width ?? 2.5,
        ...(s.dash && { dash: s.dash }),
      },
    };
    if (s.fill)               t.fill       = s.fill;
    if (s.fillcolor)          t.fillcolor  = s.fillcolor;
    if (s.opacity !== undefined) t.opacity = s.opacity;
    if (s.yaxis)              t.yaxis      = s.yaxis;
    if (s.text)               t.text       = s.text;
    if (s.hoverinfo)          t.hoverinfo  = s.hoverinfo;
    if (s.extra)              Object.assign(t, s.extra);
    return t;
  });
  plotReact(divId, traces, { showlegend: series.length > 1, ...layoutOverrides });
}

/**
 * Bar chart — vertical or horizontal.
 *
 * Simple form: bars = Array<{ label, value, color? }>
 * Raw form:    bars = { x, y, color, orientation?, text?, textposition?,
 *                       hovertemplate?, opacity? }
 */
export function plotBars(divId, bars, layoutOverrides = {}) {
  let traces;
  if (Array.isArray(bars)) {
    traces = [{
      x: bars.map(b => b.label),
      y: bars.map(b => b.value),
      type: "bar",
      marker: {
        color: bars.map(b => resolveCssValue(b.color ?? "var(--sol-blue)")),
        opacity: 0.85,
      },
    }];
  } else {
    traces = [{
      x: bars.x,
      y: bars.y,
      type: "bar",
      orientation: bars.orientation,
      text: bars.text,
      textposition: bars.textposition,
      hovertemplate: bars.hovertemplate,
      marker: {
        color: Array.isArray(bars.color)
          ? bars.color.map(c => resolveCssValue(c))
          : resolveCssValue(bars.color ?? "var(--sol-blue)"),
        opacity: bars.opacity ?? 0.85,
      },
    }];
  }
  plotReact(divId, traces, layoutOverrides);
}

/**
 * Grouped scatter / word-embedding plot.
 *
 * groups: Array<{
 *   points: Array<{ x, y, label? }>,
 *   name, color?, mode?, markerSize?
 * }>
 */
export function plotScatter(divId, groups, layoutOverrides = {}) {
  const traces = groups.map(g => ({
    x: g.points.map(p => p.x),
    y: g.points.map(p => p.y),
    mode: g.mode ?? "markers+text",
    type: "scatter",
    name: g.name,
    text: g.points.map(p => p.label ?? ""),
    textposition: "top center",
    textfont: { size: 11, color: resolveCssValue(g.color ?? "var(--body-color)") },
    marker: {
      size: g.markerSize ?? 10,
      color: resolveCssValue(g.color ?? "var(--sol-blue)"),
      opacity: 0.85,
    },
  }));
  plotReact(divId, traces, { showlegend: groups.length > 1, ...layoutOverrides });
}

/**
 * Heatmap.
 *
 * opts: {
 *   z,                      // 2-D array of values
 *   x?, y?,                 // axis labels
 *   colorscale?,            // default "RdBu"
 *   zmin?, zmax?,
 *   showscale?, colorbar?,
 *   extraTraces?,           // additional traces overlaid on the heatmap
 *   extra?,                 // extra fields merged onto the heatmap trace
 * }
 */
export function plotHeatmap(divId, opts = {}, layoutOverrides = {}) {
  const traces = [
    {
      type: "heatmap",
      z: opts.z,
      x: opts.x,
      y: opts.y,
      colorscale: opts.colorscale ?? "RdBu",
      zmin: opts.zmin,
      zmax: opts.zmax,
      showscale: opts.showscale ?? true,
      colorbar: opts.colorbar,
      zsmooth: false,
      ...opts.extra,
    },
    ...(opts.extraTraces ?? []),
  ];
  plotReact(divId, traces, layoutOverrides);
}

// ═══════════════════════════════════════════════════════════════════════
// Backward-compatible wrappers
// Existing signatures preserved; internals delegate to plotReact.
// ═══════════════════════════════════════════════════════════════════════

/**
 * Generic multi-trace chart (original API).
 * options: { layout?, config?, xaxis?, yaxis?, shapes?, showlegend? }
 */
export function createMultiLine(divId, traces, options = {}) {
  const overrides = {
    showlegend: options.showlegend ?? false,
    ...options.layout,
  };
  if (options.xaxis !== undefined) overrides.xaxis = options.xaxis;
  if (options.yaxis !== undefined) overrides.yaxis = options.yaxis;
  if (options.shapes !== undefined) overrides.shapes = options.shapes;
  plotReact(divId, traces, overrides, options.config);
}

export function createScatter(divId, data, title = "Graphique", options = {}) {
  plotReact(divId, [{
    x: data.x,
    y: data.y,
    mode: options.mode ?? "markers",
    type: "scatter",
    marker: { size: options.markerSize ?? 8, opacity: options.opacity ?? 0.8, ...options.marker },
    ...options.trace,
  }], deepMerge(
    { title: { text: title, font: { size: 16 } }, margin: { t: 50, b: 50, l: 50, r: 50 } },
    options.layout,
  ), options.config);
}

export function createLine(divId, data, title = "Graphique", options = {}) {
  plotReact(divId, [{
    x: data.x,
    y: data.y,
    mode: options.mode ?? "lines+markers",
    type: "scatter",
    line: { shape: options.shape ?? "spline", width: options.lineWidth ?? 3, ...options.line },
    marker: {
      size: options.markerSize ?? 6,
      color: options.markerColor ?? options.line?.color,
      ...options.marker,
    },
    ...options.trace,
  }], deepMerge(
    { title: { text: title, font: { size: 16 } }, margin: { t: 50, b: 50, l: 50, r: 50 } },
    options.layout,
  ), options.config);
}

export function createBar(divId, data, title = "Graphique", options = {}) {
  plotReact(divId, [{
    x: data.x,
    y: data.y,
    type: "bar",
    marker: { opacity: options.opacity ?? 0.85, ...options.marker },
    ...options.trace,
  }], deepMerge(
    { title: { text: title, font: { size: 16 } }, margin: { t: 50, b: 50, l: 50, r: 50 } },
    options.layout,
  ), options.config);
}

// createFunnel / createPyramid — funnelarea & funnel chart types have minimal
// layout needs; kept on Plotly.newPlot (no diff semantics required).
export function createFunnel(divId, data, options = {}) {
  Plotly.newPlot(_el(divId), [{
    type: "funnelarea",
    text: data.text,
    values: data.values,
    marker: { colors: options.colors },
    textinfo: "text",
    hoverinfo: "text",
    ...options.trace,
  }], {
    margin: { t: 10, b: 10, l: 10, r: 10 },
    paper_bgcolor: "transparent",
    showlegend: false,
    ...options.layout,
  }, { displayModeBar: false, responsive: true, ...options.config });
}

export function createPyramid(divId, data, options = {}) {
  Plotly.newPlot(_el(divId), [{
    type: "funnel",
    y: data.text,
    x: data.values,
    text: data.text,
    textposition: options.textposition ?? "inside",
    textinfo: options.textinfo ?? "text",
    hoverinfo: options.hoverinfo ?? "text",
    textfont: { color: "white", family: "Recursive, sans-serif", ...options.textfont },
    marker: { color: options.colors, ...options.marker },
    ...options.trace,
  }], {
    margin: { t: 5, b: 5, l: 5, r: 5 },
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    yaxis: { visible: false },
    xaxis: { visible: false },
    ...options.layout,
  }, { displayModeBar: false, responsive: true, ...options.config });
}

export const createPiramid = createPyramid;

// createPlot3D — 3D scene requires Plotly template at root + scene axis setup.
// Uses Plotly.newPlot for initial creation; callers update via Plotly.react.
export function createPlot3D(divId, traces, title = "", options = {}) {
  const el = _el(divId);
  if (!el) return;

  const themeLayout = getPlotlyTheme().layout;
  const sceneAxis = deepMerge(
    {
      gridcolor:      "rgba(88, 110, 117, 0.15)",
      zerolinecolor:  "rgba(88, 110, 117, 0.3)",
      showbackground: false,
      titlefont: themeLayout.font,
      tickfont:  themeLayout.font,
    },
    options.scene?.xaxis ?? {},  // allow per-axis overrides
  );

  const layout = deepMerge(
    {
      template:       getPlotlyTheme(),
      paper_bgcolor:  "transparent",
      plot_bgcolor:   "transparent",
      margin:         { t: 10, b: 10, l: 10, r: 10 },
      scene: { xaxis: sceneAxis, yaxis: sceneAxis, zaxis: sceneAxis },
    },
    title ? { title: { text: title, font: { size: 16 } } } : {},
    options.layout ?? {},
    options.scene  ? { scene: options.scene } : {},
  );

  Plotly.newPlot(el, traces, layout, {
    responsive: true,
    displayModeBar: false,
    ...options.config,
  });

  _attachResize(el);
}

// createSimulatorPlot — builds lines + active-dot + vertical-line traces,
// then delegates to plotReact.
export function createSimulatorPlot(divId, lineData, activeDots, currentX, options = {}) {
  const { xRange, yRange } = options;

  const lineTraces = lineData.map(line => ({
    x: line.x,
    y: line.y,
    mode: "lines",
    type: "scatter",
    name: line.name,
    line: { color: resolveCssValue(line.color), width: 2.5 },
    hoverinfo: "skip",
  }));

  const dotsTrace = {
    x: activeDots.map(d => d.x),
    y: activeDots.map(d => d.y),
    mode: "markers",
    type: "scatter",
    name: "Actuel",
    marker: {
      color: activeDots.map(d => resolveCssValue(d.color)),
      size: 9,
      line: { color: resolveCssValue("var(--body-bg)"), width: 1 },
    },
    hoverinfo: "text",
    text: activeDots.map(d => d.text),
  };

  plotReact(divId, [...lineTraces, dotsTrace], {
    xaxis:  { range: xRange },
    yaxis:  { range: yRange },
    shapes: [{
      type: "line",
      x0: currentX, y0: yRange[0], x1: currentX, y1: yRange[1],
      line: { color: resolveCssValue("var(--sol-magenta, #d33682)"), width: 1.5, dash: "dash" },
    }],
    font: { color: resolveCssValue("var(--sol-base03)") },
    ...options.layoutOverrides,
  });
}
