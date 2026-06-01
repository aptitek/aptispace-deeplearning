// =====================================================================
// regularization.js — Regularization simulation using Plotly
// =====================================================================
import { resolveCssValue, parseTableData, renderTemplate } from "../core.js";
import { createMultiLine } from "../plots.js";

let _variables = null;
let _details = null;

export function loadVariables(selector = "#reg-variables table") {
  const rows = parseTableData(selector);
  _variables = rows.map(r => ({
    id: r.id,
    name: r.name,
    w0: parseFloat(r.w0),
    color: r.color,
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
      color: r.color,
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

  const lineTraces = variables.map(v => {
    const xs = [], ys = [];
    for (let l = 0; l <= 100; l += 5) {
      const coeffs = calculateCoefficients(type, l);
      xs.push(l);
      ys.push(coeffs.find(c => c.id === v.id).w);
    }
    return {
      x: xs, y: ys,
      mode: 'lines', type: 'scatter', name: v.name,
      line: { color: resolveCssValue(v.color), width: 2.5 },
      hoverinfo: 'skip'
    };
  });  const dotsTrace = {
    x: currentCoeffs.map(() => lambda),
    y: currentCoeffs.map(c => c.w),
    mode: 'markers', type: 'scatter', name: 'Actuel',
    marker: {
      color: currentCoeffs.map(c => resolveCssValue(c.color)),
      size: 9,
      line: { color: resolveCssValue("var(--body-bg)"), width: 1 }
    },
    hoverinfo: 'text',
    text: currentCoeffs.map(c => `${c.name}: ${c.w > 0 ? '+' : ''}${c.w.toFixed(2)}`)
  };

  createMultiLine(svgEl, [...lineTraces, dotsTrace], {
    xaxis: { range: [0, 100] },
    yaxis: { range: [-5, 9] },
    layout: {
      font: { color: resolveCssValue("var(--sol-base03)") }
    },
    shapes: [{
      type: 'line',
      x0: lambda, y0: -5, x1: lambda, y1: 9,
      line: { color: resolveCssValue('var(--sol-magenta, #d33682)'), width: 1.5, dash: 'dash' }
    }]
  });
}

function renderVars(varsEl, currentCoeffs) {
  varsEl.innerHTML = "";

  currentCoeffs.forEach(c => {
    const isActive = Math.abs(c.w) > 0.01;
    const pct = Math.min(100, Math.max(0, (Math.abs(c.w) / 10) * 100));

    const item = document.createElement("div");
    item.className = "list-group-item bg-transparent d-flex justify-content-between align-items-center py-2 px-3 border-0 border-bottom";
    item.style.setProperty("color", resolveCssValue("var(--sol-base03)"), "important");

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
    valueSpan.style.setProperty("color", resolveCssValue("var(--sol-base03)"), "important");
    valueSpan.textContent = `${c.w >= 0 ? "+" : ""}${c.w.toFixed(2)}`;

    const progressContainer = document.createElement("div");
    progressContainer.className = "progress my-0";
    progressContainer.style.setProperty("width", "60px", "important");
    progressContainer.style.setProperty("flex", "0 0 60px", "important");
    progressContainer.style.setProperty("margin", "0", "important");

    const bar = document.createElement("div");
    bar.className = "progress-bar";
    bar.style.width = `${pct}%`;
    
    const barColor = c.w < 0 ? "var(--sol-red)" : "var(--sol-cyan)";
    bar.style.setProperty("background-color", resolveCssValue(barColor), "important");
    
    progressContainer.appendChild(bar);

    const badge = document.createElement("span");
    badge.className = isActive
      ? "badge bg-success-subtle text-success border border-success-subtle"
      : "badge bg-danger-subtle text-danger border border-danger-subtle";
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

  const titleColor = resolveCssValue(cfg.color);
  detailsEl.style.borderLeftColor = titleColor;

  renderTemplate(detailsEl, {
    title: cfg.title.replace("{λ}", lambda),
    body: cfg.body
  });

  const titleEl = detailsEl.querySelector('.detail-title-color');
  if (titleEl) {
    titleEl.style.color = titleColor;
  }
}
