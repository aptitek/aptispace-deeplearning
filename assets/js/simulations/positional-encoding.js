// =====================================================================
// positional-encoding.js — Sinusoidal positional encoding heatmap
// =====================================================================
import { resolveCssValue } from "../core/core.js";
import { plotHeatmap, plotLines } from "../core/plots.js";

function computePE(seqLen, dModel) {
  return Array.from({ length: seqLen }, (_, t) =>
    Array.from({ length: dModel }, (_, i) => {
      const k    = Math.floor(i / 2);
      const freq = Math.pow(10000, (2 * k) / dModel);
      return i % 2 === 0 ? Math.sin(t / freq) : Math.cos(t / freq);
    })
  );
}

/**
 * @param {HTMLElement} heatmapEl
 * @param {HTMLElement} lineEl      (optional) line-chart for selected position
 * @param {{ seqLen, dModel, highlightPos }} params
 */
export function updatePEViz(heatmapEl, lineEl, { seqLen = 32, dModel = 64, highlightPos = 0 } = {}) {
  if (!heatmapEl) return;

  const sN   = Math.max(4,  Math.min(128, Math.round(+seqLen)));
  const dN   = Math.max(8,  Math.min(128, Math.round(+dModel)));
  const posN = Math.max(0,  Math.min(sN - 1, Math.round(+highlightPos)));

  const matrix  = computePE(sN, dN);
  const yLabels = Array.from({ length: sN }, (_, i) => `t=${i}`);
  const xLabels = Array.from({ length: dN }, (_, i) => `d${i}`);
  const cYellow = resolveCssValue("var(--sol-yellow)");

  // ── Heatmap ──────────────────────────────────────────────────────────
  plotHeatmap(heatmapEl, {
    z: matrix,
    x: xLabels,
    y: yLabels,
    colorscale: "RdBu",
    zmin: -1, zmax: 1,
    showscale: true,
    colorbar: { thickness: 12, len: 0.8, title: { text: "PE", side: "right" } },
    extraTraces: [{
      type: "scatter",
      x: [xLabels[0], xLabels[dN - 1]],
      y: [`t=${posN}`, `t=${posN}`],
      mode: "lines",
      line: { color: cYellow, width: 2.5 },
      hoverinfo: "skip",
      showlegend: false,
    }],
  }, {
    height: 300,
    margin: { t: 20, b: 50, l: 55, r: 60 },
    xaxis: {
      title: { text: "Dimension k", font: { size: 11 } },
      showticklabels: dN <= 32,
      tickangle: -45,
    },
    yaxis: {
      title: { text: "Position t", font: { size: 11 } },
      showticklabels: sN <= 32,
    },
    annotations: [{
      x: dN - 1, y: `t=${posN}`,
      xanchor: "right",
      text: `← t = ${posN}`,
      showarrow: false,
      font: { color: cYellow, size: 11 },
    }],
  });

  // ── Row slice line chart ─────────────────────────────────────────────
  if (!lineEl) return;
  const lEl = typeof lineEl === "string" ? document.getElementById(lineEl) : lineEl;
  if (!lEl) return;

  const row     = matrix[posN];
  const sinDims = Array.from({ length: Math.floor(dN / 2) }, (_, k) => k * 2);
  const cosDims = Array.from({ length: Math.floor(dN / 2) }, (_, k) => k * 2 + 1);

  plotLines(lEl, [
    {
      x: sinDims, y: sinDims.map(i => row[i]),
      name: "sin(t / 10000^(2k/d))",
      color: "var(--sol-blue)", width: 2,
      extra: { mode: "lines+markers", marker: { size: 5 } },
    },
    {
      x: cosDims, y: cosDims.map(i => row[i]),
      name: "cos(t / 10000^(2k/d))",
      color: "var(--sol-red)", width: 2,
      extra: { mode: "lines+markers", marker: { size: 5 } },
    },
  ], {
    height: 180,
    margin: { t: 15, b: 40, l: 50, r: 20 },
    xaxis: { title: { text: "Dimension k", font: { size: 11 } } },
    yaxis: { range: [-1.1, 1.1], title: { text: `PE(t=${posN}, ·)`, font: { size: 11 } } },
    legend: { x: 0.01, y: 0.99, xanchor: "left", yanchor: "top", bgcolor: "transparent", font: { size: 10 } },
  });
}
