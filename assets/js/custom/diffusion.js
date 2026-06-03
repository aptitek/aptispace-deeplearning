// =====================================================================
// diffusion.js — DDPM forward diffusion process visualization
// =====================================================================
import { resolveCssValue } from "../core.js";
import { createMultiLine } from "../plots.js";

/**
 * Build a deterministic-looking 1-D "image signal" for illustration.
 * Returns an array of n samples from a sum of 3 sinusoids.
 */
function makeSignal(n = 80) {
  const xs = [];
  for (let i = 0; i < n; i++) {
    const t = i / n;
    xs.push(
      0.6 * Math.sin(2 * Math.PI * 2 * t) +
      0.25 * Math.sin(2 * Math.PI * 5 * t + 1.2) +
      0.15 * Math.sin(2 * Math.PI * 9 * t + 0.5)
    );
  }
  return xs;
}

/** Seeded simple LCG pseudo-random (deterministic noise for reproducibility) */
function seededNoise(seed, n) {
  let s = seed;
  const out = [];
  for (let i = 0; i < n; i++) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    // Box-Muller transform approximation (cheap)
    const u = ((s >>> 0) / 0xffffffff) * 2 - 1;
    const v = ((((s * 6364136223846793005n) & 0xffffffffn) * 1n) / 0xffffffffn);
    out.push(u);
  }
  return out;
}

// Pre-compute noise so it doesn't change with the slider
const N = 80;
const cleanSignal = makeSignal(N);
// Pre-compute a fixed noise sequence
const noiseArr = (() => {
  let s = 42;
  return Array.from({ length: N }, () => {
    s = (s * 1664525 + 1013904223) | 0;
    return (((s >>> 0) / 0xffffffff) * 2 - 1) * 0.98;
  });
})();

const xs = Array.from({ length: N }, (_, i) => i);

/**
 * Render the DDPM forward diffusion chart at timestep t.
 * @param {HTMLElement} chartEl
 * @param {HTMLElement} alphaEl   Element to display ᾱ_t value
 * @param {{ t, T }} params
 */
export function updateDiffusionViz(chartEl, alphaEl, { t = 0, T = 100 } = {}) {
  if (!chartEl) return;

  const tN = Math.max(0, Math.min(T, Math.round(+t)));
  const ratio = tN / T;

  // Linear noise schedule: β_t = β_min + (β_max - β_min) * t/T
  const betaMin = 0.0001, betaMax = 0.02;
  // Cumulative ᾱ_T = Π(1 - β_t)
  let alphaCum = 1;
  for (let i = 1; i <= tN; i++) {
    const beta = betaMin + (betaMax - betaMin) * (i / T);
    alphaCum *= (1 - beta);
  }

  const sqrtAlpha = Math.sqrt(alphaCum);
  const sqrtOneMinusAlpha = Math.sqrt(1 - alphaCum);

  // x_t = sqrt(ᾱ_t)·x_0 + sqrt(1 - ᾱ_t)·ε
  const noisySignal = cleanSignal.map((v, i) =>
    sqrtAlpha * v + sqrtOneMinusAlpha * noiseArr[i]
  );

  const cBase1  = resolveCssValue("var(--sol-base1)");
  const cBlue   = resolveCssValue("var(--sol-blue)");
  const cOrange = resolveCssValue("var(--sol-orange)");
  const cRed    = resolveCssValue("var(--sol-red)");

  const signalColor = ratio < 0.3 ? cBlue : ratio < 0.7 ? cOrange : cRed;

  const traces = [
    {
      x: xs,
      y: cleanSignal,
      mode: "lines",
      name: "x₀ (signal original)",
      line: { color: cBlue, width: 1.5, dash: "dot" },
      opacity: Math.max(0.15, 1 - ratio),
    },
    {
      x: xs,
      y: noisySignal,
      mode: "lines",
      name: `x_t (t=${tN}, ᾱ=${alphaCum.toFixed(3)})`,
      line: { color: signalColor, width: 2 },
    },
  ];

  createMultiLine(chartEl, traces, {
    showlegend: true,
    xaxis: { title: { text: "échantillon" }, showticklabels: false },
    yaxis: { range: [-2.2, 2.2], title: { text: "amplitude" } },
    layout: {
      height: 240,
      legend: { x: 0.01, y: 0.99, xanchor: "left", yanchor: "top", bgcolor: "transparent", font: { size: 11 } },
      annotations: [{
        x: N - 1, y: 2.0,
        text: tN === 0 ? "Signal pur x₀" : tN === T ? "Bruit pur x_T ~ N(0,I)" : `ᾱ_t = ${alphaCum.toFixed(3)}`,
        showarrow: false,
        xanchor: "right",
        font: { size: 11, color: signalColor },
      }],
    },
  });

  if (alphaEl) {
    alphaEl.textContent = alphaCum.toFixed(4);
    alphaEl.setAttribute("data-state", alphaCum > 0.5 ? "success" : alphaCum > 0.1 ? "warning" : "danger");
  }
}
