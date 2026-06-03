// =====================================================================
// learning-curves.js — BN, GAN stability, Scaling Laws,
//                      Pretraining loss, Fine-tuning dynamics
// =====================================================================
import { resolveCssValue } from "../core/core.js";
import { createMultiLine, plotReact, plotLines } from "../core/plots.js";

// ── Shared helpers ─────────────────────────────────────────────────────
function linspace(a, b, n) {
  return Array.from({ length: n }, (_, i) => a + (b - a) * (i / (n - 1)));
}

function smoothNoise(n, seed, amplitude) {
  let s = seed;
  const raw = Array.from({ length: n }, () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) / 0xffffffff) * 2 - 1;
  });
  return raw.map((_, i) => {
    const w = 5;
    const slice = raw.slice(Math.max(0, i - w), i + w + 1);
    return (slice.reduce((a, b) => a + b, 0) / slice.length) * amplitude;
  });
}

function gaussianPDF(x, mu, sigma) {
  return (1 / (Math.sqrt(2 * Math.PI) * sigma)) * Math.exp(-((x - mu) ** 2) / (2 * sigma ** 2));
}


// ═══════════════════════════════════════════════════════════════════════
// 1. Batch Normalization: before/after distribution
// ═══════════════════════════════════════════════════════════════════════
export function updateBatchNormViz(chartEl, { mu = 2, sigma = 3 } = {}) {
  if (!chartEl) return;

  const muN   = +mu;
  const sigN  = Math.max(0.3, +sigma);
  const xs    = linspace(muN - 4 * sigN, muN + 4 * sigN, 200);
  const xsN   = linspace(-4, 4, 200);

  const cOrange = resolveCssValue("var(--sol-orange)");
  const cGreen  = resolveCssValue("var(--sol-green)");

  createMultiLine(chartEl, [
    {
      x: xs, y: xs.map(x => gaussianPDF(x, muN, sigN)),
      mode: "lines", type: "scatter",
      name: `Avant BN : N(${muN.toFixed(1)}, ${sigN.toFixed(1)}²)`,
      line: { color: cOrange, width: 2.5, dash: "dash" },
      fill: "tozeroy", fillcolor: cOrange + "18",
    },
    {
      x: xsN, y: xsN.map(x => gaussianPDF(x, 0, 1)),
      mode: "lines", type: "scatter",
      name: "Après BN : N(0, 1)",
      line: { color: cGreen, width: 2.5 },
      fill: "tozeroy", fillcolor: cGreen + "18",
    },
  ], {
    showlegend: true,
    xaxis: { title: { text: "Valeur de pré-activation z" } },
    yaxis: { title: { text: "Densité" } },
    layout: {
      height: 240,
      legend: { x: 0.01, y: 0.99, xanchor: "left", yanchor: "top", bgcolor: "transparent", font: { size: 11 } },
      annotations: [
        { x: muN, y: gaussianPDF(muN, muN, sigN) + 0.03, text: `μ = ${muN.toFixed(1)}`, showarrow: false, font: { color: cOrange, size: 11 } },
        { x: 0,   y: gaussianPDF(0, 0, 1) + 0.03,        text: "μ = 0",                 showarrow: false, font: { color: cGreen, size: 11 } },
      ],
    },
  });
}


// ═══════════════════════════════════════════════════════════════════════
// RNN gradient magnitude vs sequence length (BPTT instability)
// ═══════════════════════════════════════════════════════════════════════
/**
 * @param {HTMLElement} chartEl
 * @param {{ rho, T }} params  rho = spectral radius, T = sequence length
 */
export function updateGradientMagnitudeViz(chartEl, { rho = 0.9, T = 20 } = {}) {
  if (!chartEl) return;

  const rhoN  = +rho;
  const tN    = Math.max(5, Math.round(+T));
  const steps = Array.from({ length: tN }, (_, i) => i + 1);
  const sigma_prime = 0.25;  // max of tanh'(x)
  const mags        = steps.map(t => Math.pow(rhoN * sigma_prime, t - 1));

  const mainColor = rhoN > 1 ? "var(--sol-red)" : rhoN < 0.95 ? "var(--sol-blue)" : "var(--sol-green)";
  const label     = rhoN > 1 ? "Explosion (ρ > 1)" : rhoN < 0.95 ? "Disparition (ρ < 1)" : "Zone marginale";

  plotLines(chartEl, [
    {
      x: steps, y: mags,
      name: `ρ = ${rhoN.toFixed(2)} — ${label}`,
      color: mainColor, width: 2.5,
      extra: { mode: "lines+markers", marker: { size: 5 } },
    },
    {
      x: [1, tN], y: [0.01, 0.01],
      name: "Seuil critique (0.01)",
      color: "var(--sol-base1)", width: 1.5, dash: "dot",
    },
  ], {
    height: 260,
    margin: { t: 20, b: 55, l: 65, r: 20 },
    xaxis: { title: { text: "Pas de temps t" } },
    yaxis: { type: "log", title: { text: "‖∂hₜ/∂h₁‖" } },
    legend: { x: 0.5, y: 0.95, bgcolor: "transparent", font: { size: 11 } },
  });
}


// ═══════════════════════════════════════════════════════════════════════
// 0. Learning-rate schedulers
// ═══════════════════════════════════════════════════════════════════════
/**
 * @param {HTMLElement} chartEl
 * @param {{ eta0, T }} params   eta0 = initial LR, T = total epochs
 */
export function updateLRSchedulerViz(chartEl, { eta0 = 0.1, T = 50 } = {}) {
  if (!chartEl) return;

  const eta  = Math.max(0.001, +eta0);
  const nT   = Math.max(10, Math.round(+T));
  const epx  = Array.from({ length: nT }, (_, i) => i + 1);

  const stepLR  = epx.map(e => eta * Math.pow(0.5, Math.floor((e - 1) / (nT / 5))));
  const plateau = epx.map(e => eta * Math.pow(0.5, Math.floor((e - 1) / (nT / 4))));
  const cosine  = epx.map(e => eta * 0.5 * (1 + Math.cos(Math.PI * (e - 1) / (nT - 1))));
  const warmup  = epx.map(e => {
    const w = Math.max(1, Math.floor(nT * 0.1));
    return e <= w ? eta * (e / w) : eta * Math.sqrt(w / e);
  });

  plotLines(chartEl, [
    { x: epx, y: stepLR,  name: "StepLR",               color: "var(--sol-blue)",   width: 2.5 },
    { x: epx, y: plateau, name: "ReduceLROnPlateau",     color: "var(--sol-green)",  width: 2.5 },
    { x: epx, y: cosine,  name: "CosineAnnealingLR",     color: "var(--sol-red)",    width: 2.5 },
    { x: epx, y: warmup,  name: "Warmup + 1/√t Decay",  color: "var(--sol-magenta)", width: 2.5 },
  ], {
    height: 280,
    margin: { t: 20, b: 70, l: 65, r: 20 },
    xaxis: { title: { text: "Époque" } },
    yaxis: { title: { text: "Taux d'apprentissage η" } },
    legend: { orientation: "h", y: -0.3, bgcolor: "transparent", font: { size: 11 } },
  });
}


// ═══════════════════════════════════════════════════════════════════════
// 2. GAN Architecture stability
// ═══════════════════════════════════════════════════════════════════════
const N_EPOCHS = 60;
const epochs   = Array.from({ length: N_EPOCHS }, (_, i) => i + 1);

const ganG   = epochs.map((e, i) => 1.5 * Math.exp(-0.02 * e) + 0.6 + smoothNoise(N_EPOCHS, 12, 0.35)[i]);
const ganD   = epochs.map((e, i) => 0.6 * Math.exp(-0.015 * e) + 0.5 + smoothNoise(N_EPOCHS, 7, 0.3)[i]);
const dcganG = epochs.map((e, i) => 1.2 * Math.exp(-0.04 * e) + 0.4 + smoothNoise(N_EPOCHS, 99, 0.15)[i]);
const dcganD = epochs.map((e, i) => 0.5 * Math.exp(-0.03 * e) + 0.35 + smoothNoise(N_EPOCHS, 55, 0.1)[i]);
const wganW  = epochs.map((e, i) => 2.0 * Math.exp(-0.06 * e) + 0.15 + smoothNoise(N_EPOCHS, 33, 0.05)[i]);

const GAN_TRACES = {
  "GAN vanilla": [
    { name: "G_loss (Générateur)",    data: ganG,   color: "var(--sol-blue)", dash: "solid" },
    { name: "D_loss (Discriminateur)", data: ganD,  color: "var(--sol-red)",  dash: "dot"   },
  ],
  "DCGAN": [
    { name: "G_loss (DCGAN)", data: dcganG, color: "var(--sol-blue)", dash: "solid" },
    { name: "D_loss (DCGAN)", data: dcganD, color: "var(--sol-red)",  dash: "dot"   },
  ],
  "WGAN": [
    { name: "Distance de Wasserstein", data: wganW, color: "var(--sol-green)", dash: "solid" },
  ],
};

export const GAN_ARCH_OPTIONS = Object.keys(GAN_TRACES);

export function updateGANArchViz(chartEl, archType = "GAN vanilla") {
  if (!chartEl) return;
  const cfg = GAN_TRACES[archType] ?? GAN_TRACES["GAN vanilla"];
  plotLines(chartEl,
    cfg.map(tc => ({
      x: epochs,
      y: tc.data.map(v => Math.max(0, +v.toFixed(4))),
      name: tc.name,
      color: tc.color,
      dash: tc.dash,
    })),
    {
      height: 240,
      xaxis: { title: { text: "Époque" } },
      yaxis: { title: { text: archType === "WGAN" ? "Distance W" : "Perte" }, rangemode: "tozero" },
      legend: { x: 0.99, y: 0.99, xanchor: "right", yanchor: "top", bgcolor: "transparent", font: { size: 11 } },
    },
  );
}


// ═══════════════════════════════════════════════════════════════════════
// 3. Scaling Laws
// ═══════════════════════════════════════════════════════════════════════
const N_VALUES  = [1e7, 3e7, 1e8, 3e8, 1e9, 3e9, 1e10, 1e11, 1e12];
const A = 406.4, ALPHA = 0.34, L_INF = 1.62;

function scalingLoss(n) { return A / Math.pow(n, ALPHA) + L_INF; }

const MODEL_POINTS = [
  { name: "GPT-2 (1.5B)",  n: 1.5e9,  color: "var(--sol-blue)" },
  { name: "GPT-3 (175B)",  n: 1.75e11, color: "var(--sol-orange)" },
  { name: "LLaMA 3 8B",    n: 8e9,    color: "var(--sol-green)" },
  { name: "LLaMA 3 70B",   n: 7e10,   color: "var(--sol-violet)" },
];

export function updateScalingViz(chartEl) {
  if (!chartEl) return;

  const cBase1 = resolveCssValue("var(--sol-base1)");

  const traces = [
    {
      x: N_VALUES,
      y: N_VALUES.map(scalingLoss),
      mode: "lines",
      type: "scatter",
      name: "L(N) = A/N^α + L∞",
      line: { color: cBase1, width: 2, dash: "dash" },
    },
    ...MODEL_POINTS.map(m => ({
      x: [m.n],
      y: [scalingLoss(m.n)],
      mode: "markers+text",
      type: "scatter",
      name: m.name,
      text: [m.name],
      textposition: "top center",
      textfont: { size: 10, color: resolveCssValue(m.color) },
      marker: { size: 10, color: resolveCssValue(m.color) },
    })),
  ];

  plotReact(chartEl, traces, {
    showlegend: false,
    height: 280,
    margin: { t: 20, b: 50, l: 60, r: 20 },
    xaxis: { type: "log", title: { text: "Taille du modèle N (paramètres)", font: { size: 11 } } },
    yaxis: { title: { text: "Perte de validation (perplexité)", font: { size: 11 } } },
    annotations: [{
      x: Math.log10(4e10), y: scalingLoss(4e10) - 0.2,
      text: "Loi de puissance", showarrow: false, font: { color: cBase1, size: 11 },
    }],
  });
}


// ═══════════════════════════════════════════════════════════════════════
// 4. Pretraining loss curve
// ═══════════════════════════════════════════════════════════════════════
export function updatePretrainingViz(chartEl) {
  if (!chartEl) return;

  const steps      = Array.from({ length: 60 }, (_, i) => Math.pow(10, 7 + i * (6 / 59)));
  const inSample   = steps.map((s, i) => 2.8 / Math.pow(s / 1e7, 0.28) + 1.55 + smoothNoise(60, 77, 0.04)[i]);
  const outSample  = inSample.map((v, i) => v + 0.15 + smoothNoise(60, 42, 0.03)[i]);

  plotLines(chartEl, [
    { x: steps, y: inSample,  name: "Perte in-sample",      color: "var(--sol-blue)", width: 2 },
    { x: steps, y: outSample, name: "Perte out-of-sample",  color: "var(--sol-red)",  width: 2, dash: "dot" },
  ], {
    height: 240,
    xaxis: { type: "log", title: { text: "Tokens d'entraînement", font: { size: 11 } } },
    yaxis: { title: { text: "Perte (cross-entropie)", font: { size: 11 } } },
    legend: { x: 0.99, y: 0.99, xanchor: "right", yanchor: "top", bgcolor: "transparent", font: { size: 11 } },
  });
}


// ═══════════════════════════════════════════════════════════════════════
// 5. Fine-tuning dynamics: loss + gradient norm (dual Y axes)
// ═══════════════════════════════════════════════════════════════════════
export function updateFinetuningViz(chartEl) {
  if (!chartEl) return;

  const steps    = Array.from({ length: 50 }, (_, i) => i + 1);
  const goodLoss = steps.map(s => 2.5 * Math.exp(-0.15 * s) + 0.6 + smoothNoise(50, 11, 0.05)[s - 1]);
  const goodGrad = steps.map(s => 0.08 + 0.02 * Math.exp(-0.2 * s) + smoothNoise(50, 22, 0.015)[s - 1]);
  const badLoss  = steps.map(s => 0.9 + smoothNoise(50, 44, 0.12)[s - 1]);
  const badGrad  = steps.map(s => 0.4 + 0.1 * Math.exp(-0.05 * s) + smoothNoise(50, 55, 0.08)[s - 1]);

  const cGreen = resolveCssValue("var(--sol-green)");
  const cRed   = resolveCssValue("var(--sol-red)");

  // Dual-Y layout requires raw Plotly traces — use plotReact directly
  plotReact(chartEl, [
    { x: steps, y: goodLoss.map(v => Math.max(0, +v.toFixed(3))), mode: "lines", name: "Perte — bon run",      line: { color: cGreen, width: 2 },              yaxis: "y"  },
    { x: steps, y: badLoss.map(v  => Math.max(0, +v.toFixed(3))), mode: "lines", name: "Perte — mauvais run", line: { color: cRed,   width: 2, dash: "dot" },  yaxis: "y"  },
    { x: steps, y: goodGrad.map(v => Math.max(0, +v.toFixed(3))), mode: "lines", name: "‖∇‖ — bon run",       line: { color: cGreen, width: 1.5, dash: "dash" }, yaxis: "y2" },
    { x: steps, y: badGrad.map(v  => Math.max(0, +v.toFixed(3))), mode: "lines", name: "‖∇‖ — mauvais run",  line: { color: cRed,   width: 1.5, dash: "dashdot" }, yaxis: "y2" },
  ], {
    showlegend: true,
    height: 260,
    margin: { t: 15, b: 50, l: 55, r: 55 },
    xaxis: { title: { text: "Pas d'entraînement", font: { size: 11 } } },
    yaxis: { title: { text: "Perte SFT",          font: { size: 11 } } },
    yaxis2: {
      title:    { text: "Norme du gradient ‖∇‖", font: { size: 11 } },
      overlaying: "y",
      side:       "right",
      showgrid:   false,
    },
    legend: { x: 0.99, y: 0.99, xanchor: "right", yanchor: "top", bgcolor: "transparent", font: { size: 10 } },
  });
}
