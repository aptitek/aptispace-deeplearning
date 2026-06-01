// =====================================================================
// activation.js — Activation function calculations & Plotly rendering
// =====================================================================
import { resolveCssValue } from "../core.js";
import { createSimulatorPlot } from "../plots.js";

// Math helper functions
export const sigmoid = (x) => 1 / (1 + Math.exp(-x));
export const tanh = (x) => Math.tanh(x);
export const relu = (x) => Math.max(0, x);
export const softmax = (x) => Math.exp(x) / (Math.exp(x) + Math.exp(0) + Math.exp(1));

export const swish = (x) => x / (1 + Math.exp(-x));
export const gelu = (x) => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * Math.pow(x, 3))));
export const selu = (x) => {
  const lambda = 1.0507;
  const alpha = 1.6733;
  return x > 0 ? lambda * x : lambda * alpha * (Math.exp(x) - 1);
};

/**
 * Update the classic activation simulator
 */
export function updateClassicActivation(xVal, containers = {}) {
  const { chartEl, varsEl } = containers;
  if (!chartEl || !varsEl) return;

  const currentX = Number.isFinite(Number(xVal)) ? Number(xVal) : 0;

  const items = [
    {
      id: "sigmoid",
      name: "Sigmoïde",
      fn: sigmoid,
      value: sigmoid(currentX),
      formula: "f(x) = 1 / (1 + e⁻ˣ)",
      color: "var(--sol-red)",
      statusText: (currentX < -3 || currentX > 3) ? "Saturé (Gradient ~ 0)" : "Actif",
      statusType: (currentX < -3 || currentX > 3) ? "danger" : "success",
      pct: sigmoid(currentX) * 100
    },
    {
      id: "tanh",
      name: "Tanh",
      fn: tanh,
      value: tanh(currentX),
      formula: "f(x) = tanh(x)",
      color: "var(--sol-green)",
      statusText: (currentX < -3 || currentX > 3) ? "Saturé (Gradient ~ 0)" : "Actif",
      statusType: (currentX < -3 || currentX > 3) ? "danger" : "success",
      pct: ((tanh(currentX) + 1) / 2) * 100
    },
    {
      id: "relu",
      name: "ReLU",
      fn: relu,
      value: relu(currentX),
      formula: "f(x) = max(0, x)",
      color: "var(--sol-blue)",
      statusText: currentX <= 0 ? "Inactif (Dying ReLU)" : "Actif",
      statusType: currentX <= 0 ? "danger" : "success",
      pct: (relu(currentX) / 5) * 100
    },
    {
      id: "softmax",
      name: "Softmax",
      fn: softmax,
      value: softmax(currentX),
      formula: "f(x) = eˣ / Σ e^(x_i)",
      color: "var(--sol-magenta)",
      statusText: "Actif (Proba)",
      statusType: "success",
      pct: softmax(currentX) * 100
    }
  ];

  renderChart(chartEl, items, currentX, {
    xRange: [-5, 5],
    yRange: [-1.1, 1.1]
  });

  renderList(varsEl, items);
}

/**
 * Update the modern activation simulator
 */
export function updateModernActivation(xVal, containers = {}) {
  const { chartEl, varsEl } = containers;
  if (!chartEl || !varsEl) return;

  const currentX = Number.isFinite(Number(xVal)) ? Number(xVal) : 0;

  const items = [
    {
      id: "swish",
      name: "Swish",
      fn: swish,
      value: swish(currentX),
      formula: "f(x) = x · sigmoid(x)",
      color: "var(--sol-orange)",
      statusText: currentX <= -3 ? "Inactif" : (currentX < 0 ? "Attenué (Lissé)" : "Actif"),
      statusType: currentX <= -3 ? "danger" : (currentX < 0 ? "warning" : "success"),
      pct: Math.min(100, Math.max(0, ((swish(currentX) + 0.5) / 5.5) * 100))
    },
    {
      id: "gelu",
      name: "GELU",
      fn: gelu,
      value: gelu(currentX),
      formula: "f(x) = x · Φ(x)",
      color: "var(--sol-magenta)",
      statusText: currentX <= -3 ? "Inactif" : (currentX < 0 ? "Attenué (Lissé)" : "Actif"),
      statusType: currentX <= -3 ? "danger" : (currentX < 0 ? "warning" : "success"),
      pct: Math.min(100, Math.max(0, ((gelu(currentX) + 0.5) / 5.5) * 100))
    },
    {
      id: "selu",
      name: "SELU",
      fn: selu,
      value: selu(currentX),
      formula: "f(x) = λ·x (x > 0) else λ·α·(eˣ - 1)",
      color: "var(--sol-red)",
      statusText: currentX < 0 ? "Attenué (Normalisant)" : "Actif (Normalisant)",
      statusType: currentX < 0 ? "warning" : "success",
      pct: Math.min(100, Math.max(0, ((selu(currentX) + 1.8) / 7.1) * 100))
    }
  ];

  renderChart(chartEl, items, currentX, {
    xRange: [-2, 2],
    yRange: [-2, 2]
  });

  renderList(varsEl, items);
}

/**
 * Private charting helper using Plots.js createMultiLine
 */
function renderChart(chartEl, items, currentX, options = {}) {
  const { xRange, yRange } = options;

  const lineData = items.map(item => {
    const xs = [];
    const ys = [];
    const step = 0.1;
    for (let x = xRange[0]; x <= xRange[1]; x += step) {
      xs.push(x);
      ys.push(item.fn(x));
    }
    return {
      x: xs,
      y: ys,
      name: item.name,
      color: item.color
    };
  });

  const activeDots = [];
  items.forEach(item => {
    if (currentX >= xRange[0] && currentX <= xRange[1]) {
      activeDots.push({
        x: currentX,
        y: item.value,
        color: item.color,
        text: `${item.name}: ${item.value.toFixed(3)}`
      });
    }
  });

  createSimulatorPlot(chartEl, lineData, activeDots, currentX, {
    xRange,
    yRange
  });
}

/**
 * Private list rendering helper
 */
function renderList(varsEl, items) {
  varsEl.innerHTML = "";

  items.forEach(item => {
    const row = document.createElement("div");
    row.className = "list-group-item bg-transparent d-flex justify-content-between align-items-center py-2 px-3 border-0 border-bottom";
    row.style.setProperty("color", resolveCssValue("var(--sol-base03)"), "important");

    const labelCol = document.createElement("div");
    labelCol.className = "d-flex flex-column";

    const nameSpan = document.createElement("span");
    nameSpan.className = "fw-bold";
    nameSpan.style.setProperty("color", resolveCssValue(item.color), "important");
    nameSpan.textContent = item.name;

    const formulaSpan = document.createElement("span");
    formulaSpan.className = "text-muted small";
    formulaSpan.textContent = item.formula;

    labelCol.append(nameSpan, formulaSpan);

    const valueCol = document.createElement("div");
    valueCol.className = "d-flex align-items-center gap-3";

    const valueSpan = document.createElement("span");
    valueSpan.className = "font-monospace fw-bold";
    valueSpan.style.setProperty("color", resolveCssValue("var(--sol-base03)"), "important");
    valueSpan.textContent = item.value.toFixed(3);

    const progressContainer = document.createElement("div");
    progressContainer.className = "progress my-0";
    progressContainer.style.setProperty("width", "60px", "important");
    progressContainer.style.setProperty("flex", "0 0 60px", "important");
    progressContainer.style.setProperty("margin", "0", "important");

    const bar = document.createElement("div");
    bar.className = "progress-bar";
    bar.style.width = `${item.pct}%`;
    bar.style.setProperty("background-color", resolveCssValue(item.color), "important");
    
    progressContainer.appendChild(bar);

    const badge = document.createElement("span");
    badge.className = `badge bg-${item.statusType}-subtle text-${item.statusType} border border-${item.statusType}-subtle`;
    badge.textContent = item.statusText;

    valueCol.append(valueSpan, progressContainer, badge);
    row.append(labelCol, valueCol);
    varsEl.appendChild(row);
  });
}
