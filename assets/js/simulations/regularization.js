// =====================================================================
// regularization.js — Regularization simulation using Plotly
// =====================================================================
import { resolveCssValue, parseTableData, renderTemplate, utils } from "../core/core.js";
import { createSimulatorPlot } from "../core/plots.js";

let _variables = null;
let _details = null;

export function loadVariables(selector = "#reg-variables table") {
  const rows = parseTableData(selector);
  _variables = rows.map(r => ({
    id: r.id,
    name: r.name,
    w0: parseFloat(r.w0),
    color: r.color.replace(/\u2013/g, "--"),
    desc: r.desc,
    lassoThreshold: parseFloat(r.lassoThreshold),
    elasticThreshold: parseFloat(r.elasticThreshold)
  }));
  return _variables;
}

function getVariables() {
  return _variables ?? loadVariables();
}

export function loadDetails(selector = "#reg-details-data table") {
  const rows = parseTableData(selector);
  _details = {};
  rows.forEach(r => {
    const type = r.type;
    if (!_details[type]) _details[type] = [];
    _details[type].push({
      maxLambda: parseInt(r.max_lambda),
      color: r.color.replace(/\u2013/g, "--"),
      title: r.title,
      body: r.body
    });
  });
  
  Object.keys(_details).forEach(type => {
    _details[type].sort((a, b) => a.maxLambda - b.maxLambda);
  });
  return _details;
}

function getDetails() {
  return _details ?? loadDetails();
}

export function calculateCoefficients(type, lambda) {
  const variables = getVariables();
  const x = Number.isFinite(Number(lambda)) ? Number(lambda) / 100 : 0;

  return variables.map(v => {
    let w = v.w0;
    if (type === "ridge") {
      w = v.w0 / (1 + x * 9);
    } else if (type === "lasso") {
      w = x >= v.lassoThreshold ? 0 : v.w0 * (1 - x / v.lassoThreshold);
    } else {
      w = x >= v.elasticThreshold ? 0 : (v.w0 * (1 - x / v.elasticThreshold)) / (1 + x * 2.5);
    }
    return { ...v, w: parseFloat(w.toFixed(2)) };
  });
}

export function updateRegularization(type, lambda, containers = {}) {
  const { svgEl, varsEl, detailsEl } = containers;
  if (!svgEl || !varsEl || !detailsEl) return;

  const safeType = typeof type === "string" ? type : "lasso";
  const safeLambda = Number.isFinite(Number(lambda)) ? Number(lambda) : 0;
  const currentCoeffs = calculateCoefficients(safeType, safeLambda);

  renderChart(svgEl, safeType, safeLambda, currentCoeffs);
  renderVars(varsEl, currentCoeffs);
  renderDetails(detailsEl, safeType, safeLambda);
}

export function renderChart(svgEl, type, lambda, currentCoeffs) {
  const variables = getVariables();

  const lineData = variables.map(v => {
    const xs = [], ys = [];
    for (let l = 0; l <= 100; l += 5) {
      const coeffs = calculateCoefficients(type, l);
      xs.push(l);
      ys.push(coeffs.find(c => c.id === v.id).w);
    }
    return {
      x: xs,
      y: ys,
      name: v.name,
      color: v.color
    };
  });

  const activeDots = currentCoeffs.map(c => ({
    x: lambda,
    y: c.w,
    color: c.color,
    text: `${c.name}: ${c.w > 0 ? '+' : ''}${c.w.toFixed(2)}`
  }));

  const annotations = variables.map(v => {
    const xPos = 2;
    const coeffs = calculateCoefficients(type, xPos);
    const yVal = coeffs.find(c => c.id === v.id).w;
    return {
      x: xPos,
      y: yVal,
      text: `<b>${v.name}</b>`,
      showarrow: false,
      xanchor: "left",
      yanchor: "bottom",
      yshift: 4,
      font: {
        color: resolveCssValue(v.color),
        size: 11
      }
    };
  });

  createSimulatorPlot(svgEl, lineData, activeDots, lambda, {
    xRange: [0, 100],
    yRange: [-5, 9],
    layoutOverrides: {
      annotations: annotations
    }
  });
}

function renderVars(varsEl, currentCoeffs) {
  varsEl.innerHTML = "";

  currentCoeffs.forEach(c => {
    const isActive = Math.abs(c.w) > 0.01;
    const pct = Math.min(100, Math.max(0, (Math.abs(c.w) / 10) * 100));

    const item = document.createElement("div");
    item.className = "list-group-item bg-transparent d-flex justify-content-between align-items-center py-2 px-3 border-0 border-bottom";

    const labelCol = document.createElement("div");
    labelCol.className = "d-flex flex-column";

    const nameSpan = document.createElement("span");
    nameSpan.className = "fw-bold";
    nameSpan.style.setProperty("color", resolveCssValue(c.color), "important");
    nameSpan.textContent = c.name;

    const descSpan = document.createElement("span");
    descSpan.className = "text-muted small";
    descSpan.textContent = c.desc;

    labelCol.append(nameSpan, descSpan);

    const valueCol = document.createElement("div");
    valueCol.className = "d-flex align-items-center gap-3";

    const valueSpan = document.createElement("span");
    valueSpan.className = "font-monospace fw-bold";
    valueSpan.style.setProperty("color", resolveCssValue(c.color), "important");
    valueSpan.textContent = `${c.w >= 0 ? "+" : ""}${c.w.toFixed(2)}`;

    const progressContainer = document.createElement("div");
    progressContainer.className = "progress my-0";

    const bar = document.createElement("div");
    bar.className = "progress-bar";
    bar.style.width = `${pct}%`;
    bar.style.setProperty("background-color", resolveCssValue(c.color), "important");
    
    progressContainer.appendChild(bar);

    const badge = document.createElement("span");
    if (isActive) {
      badge.className = "badge border";
      badge.style.setProperty("color", resolveCssValue(c.color), "important");
      badge.style.setProperty("border-color", resolveCssValue(c.color), "important");
      badge.style.setProperty("background-color", utils.rgba(resolveCssValue(c.color), 0.1), "important");
    } else {
      badge.className = "badge border text-muted";
      badge.style.setProperty("border-color", "var(--sol-base2)", "important");
      badge.style.setProperty("background-color", "transparent", "important");
    }
    badge.textContent = isActive ? "Actif" : "Éliminé";

    valueCol.append(valueSpan, progressContainer, badge);
    item.append(labelCol, valueCol);
    varsEl.appendChild(item);
  });
}

function renderDetails(detailsEl, type, lambda) {
  const allDetails = getDetails();
  const rules = allDetails[type] ?? allDetails.elastic;
  if (!rules) return;

  const cfg = rules.find(r => lambda <= r.maxLambda);
  if (!cfg) return;

  detailsEl.style.setProperty("--rule-color", cfg.color);

  renderTemplate(detailsEl, {
    title: cfg.title.replace("{λ}", lambda),
    body: cfg.body
  });
}
