// =====================================================================
// neuron.js — Neuron anatomy & forward pass visualizations
// =====================================================================
import { resolveCssValue } from "../core/core.js";
import { plotReact } from "../core/plots.js";

const relu    = (x) => Math.max(0, x);
const sigmoid = (x) => 1 / (1 + Math.exp(-x));

function col(v) { return resolveCssValue(v); }

// ── Neuron anatomy diagram (SVG) ───────────────────────────────────────
export function updateNeuronDiagram(containerEl, params = {}) {
  if (!containerEl) return;

  const x1 = +params.x1 || 0, x2 = +params.x2 || 0, x3 = +params.x3 || 0;
  const w1 = +params.w1 ?? 1,  w2 = +params.w2 ?? 1,  w3 = +params.w3 ?? 1;
  const b  = +params.bias ?? 0;
  const fn = params.activationFn || "relu";

  const h = w1 * x1 + w2 * x2 + w3 * x3 + b;
  const a = fn === "sigmoid" ? sigmoid(h) : relu(h);

  const W = 560, H = 260;
  const inX = 60, sumX = W / 2, outX = W - 60;
  const ys  = [50, H / 2, H - 50];

  const inputs = [
    { label: "x₁", val: x1, weight: w1, y: ys[0] },
    { label: "x₂", val: x2, weight: w2, y: ys[1] },
    { label: "x₃", val: x3, weight: w3, y: ys[2] },
  ];
  const sumY = H / 2, actX = sumX + 80;

  const wColor = (w) => w > 0 ? "var(--sol-green)" : w < 0 ? "var(--sol-red)" : "var(--sol-base01)";

  containerEl.innerHTML = "";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.setAttribute("role", "img");
  svg.style.setProperty("width", "100%");
  svg.style.setProperty("height", "auto");
  svg.style.setProperty("overflow", "visible");
  containerEl.appendChild(svg);

  function el(tag, attrs = {}, styles = {}) {
    const e = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    for (const [k, v] of Object.entries(styles)) e.style.setProperty(k, v);
    return e;
  }

  // Bias label + dashed arrow
  const biasT = el("text", { x: sumX, y: sumY - 32, "text-anchor": "middle", "font-size": "12", "font-family": "inherit" }, { fill: "var(--sol-orange)" });
  biasT.textContent = `b = ${b.toFixed(2)}`;
  svg.appendChild(biasT);
  svg.appendChild(el("line", { x1: sumX, y1: sumY - 22, x2: sumX, y2: sumY - 14, "stroke-dasharray": "3,2", "stroke-width": "1.5" }, { stroke: "var(--sol-orange)" }));

  // Weighted edges
  inputs.forEach(({ weight, y }, i) => {
    svg.appendChild(el("line", {
      x1: inX + 14, y1: y, x2: sumX - 18, y2: sumY,
      "stroke-width": Math.max(1, Math.abs(weight) * 1.5 + 1),
    }, { stroke: wColor(weight) }));
    const mx = (inX + 14 + sumX - 18) / 2 - 4;
    const my = (y + sumY) / 2 - 6 + (i === 1 ? -4 : 0);
    const wt = el("text", { x: mx, y: my, "text-anchor": "middle", "font-size": "11", "font-family": "inherit" }, { fill: wColor(weight) });
    wt.textContent = `w${i + 1}=${weight.toFixed(1)}`;
    svg.appendChild(wt);
  });

  // Sum → activation edge
  svg.appendChild(el("line", { x1: sumX + 18, y1: sumY, x2: actX - 18, y2: sumY, "stroke-width": "2" }, { stroke: "var(--sol-base01)" }));
  const fnLbl = el("text", { x: (sumX + 18 + actX - 18) / 2, y: sumY - 8, "text-anchor": "middle", "font-size": "11", "font-family": "inherit" }, { fill: "var(--sol-base1)" });
  fnLbl.textContent = fn === "sigmoid" ? "σ" : "ReLU";
  svg.appendChild(fnLbl);

  // Activation → output edge
  svg.appendChild(el("line", { x1: actX + 18, y1: sumY, x2: outX - 14, y2: H / 2, "stroke-width": "2" }, { stroke: "var(--sol-base01)" }));

  // Input nodes
  inputs.forEach(({ label, val, y }) => {
    svg.appendChild(el("circle", { cx: inX, cy: y, r: 14 }, { fill: "var(--body-bg)", stroke: "var(--sol-blue)", "stroke-width": "2" }));
    const tl = el("text", { x: inX, y: y - 18, "text-anchor": "middle", "font-size": "11", "font-family": "inherit" }, { fill: "var(--sol-blue)" });
    tl.textContent = label;
    svg.appendChild(tl);
    const tv = el("text", { x: inX, y: y + 4, "text-anchor": "middle", "font-size": "11", "font-family": "inherit", "font-weight": "bold" }, { fill: "var(--body-color)" });
    tv.textContent = val.toFixed(1);
    svg.appendChild(tv);
  });

  // Summation node
  svg.appendChild(el("circle", { cx: sumX, cy: sumY, r: 18 }, { fill: "var(--body-bg)", stroke: "var(--sol-orange)", "stroke-width": "2.5" }));
  const sumSym = el("text", { x: sumX, y: sumY + 5, "text-anchor": "middle", "font-size": "16", "font-family": "inherit", "font-weight": "bold" }, { fill: "var(--sol-orange)" });
  sumSym.textContent = "Σ";
  svg.appendChild(sumSym);
  const hLbl = el("text", { x: sumX, y: sumY + 32, "text-anchor": "middle", "font-size": "11", "font-family": "inherit" }, { fill: "var(--sol-orange)" });
  hLbl.textContent = `h = ${h.toFixed(3)}`;
  svg.appendChild(hLbl);

  // Activation node
  const aColor = h > 0 ? "var(--sol-green)" : "var(--sol-red)";
  svg.appendChild(el("circle", { cx: actX, cy: sumY, r: 18 }, { fill: "var(--body-bg)", stroke: aColor, "stroke-width": "2.5" }));
  const actSym = el("text", { x: actX, y: sumY + 5, "text-anchor": "middle", "font-size": "12", "font-family": "inherit", "font-weight": "bold" }, { fill: aColor });
  actSym.textContent = fn === "sigmoid" ? "σ" : "f";
  svg.appendChild(actSym);
  const aLbl = el("text", { x: actX, y: sumY + 32, "text-anchor": "middle", "font-size": "11", "font-family": "inherit" }, { fill: aColor });
  aLbl.textContent = `a = ${a.toFixed(3)}`;
  svg.appendChild(aLbl);

  // Output node
  svg.appendChild(el("rect", { x: outX - 14, y: H / 2 - 14, width: 28, height: 28, rx: 5 }, { fill: "var(--body-bg)", stroke: "var(--sol-base01)", "stroke-width": "2" }));
  const outLbl = el("text", { x: outX, y: H / 2 - 20, "text-anchor": "middle", "font-size": "11", "font-family": "inherit" }, { fill: "var(--sol-base1)" });
  outLbl.textContent = "ŷ";
  svg.appendChild(outLbl);
  const outVal = el("text", { x: outX, y: H / 2 + 5, "text-anchor": "middle", "font-size": "11", "font-family": "inherit", "font-weight": "bold" }, { fill: "var(--body-color)" });
  outVal.textContent = a.toFixed(3);
  svg.appendChild(outVal);
}


// ── Forward pass heatmap (Plotly multi-subplot bars) ───────────────────
export function updateForwardPassViz(containerEl, { x1 = 0, x2 = 0 } = {}) {
  if (!containerEl) return;

  // Fixed illustrative weights
  const W1 = [[0.8, -0.5], [0.4, 0.9], [-0.6, 0.7], [0.3, -0.8]];
  const b1 = [0.1, -0.2, 0.3, -0.1];
  const W2 = [[0.7, -0.4, 0.5, -0.6], [0.3, 0.8, -0.5, 0.4], [-0.5, 0.3, 0.9, -0.3], [0.6, -0.7, 0.2, 0.8]];
  const b2 = [0.2, 0.1, -0.1, 0.3];
  const W3 = [[0.9, -0.4, 0.7, -0.6]];
  const b3 = [0.05];

  const relu2  = (vs) => vs.map(v => Math.max(0, v));
  const dot    = (W, inp, bias) => W.map((row, i) => row.reduce((acc, w, j) => acc + w * inp[j], 0) + bias[i]);

  const a0 = [+x1, +x2];
  const a1 = relu2(dot(W1, a0, b1));
  const a2 = relu2(dot(W2, a1, b2));
  const a3 = [1 / (1 + Math.exp(-dot(W3, a2, b3)[0]))];

  const layerColors = [
    col("var(--sol-blue)"), col("var(--sol-green)"),
    col("var(--sol-orange)"), col("var(--sol-violet)"),
  ];
  const cRed       = col("var(--sol-red)");
  const layerNames = ["Entrée", "Couche 1 (ReLU)", "Couche 2 (ReLU)", "Sortie (σ)"];
  const allActs    = [a0, a1, a2, a3];
  const nCols      = 4;
  const gap        = 0.03;
  const dW         = 1 / nCols;

  const traces = allActs.map((acts, li) => ({
    x: acts.map((_, i) => `n${i + 1}`),
    y: acts.map(v => +v.toFixed(4)),
    type: "bar",
    name: layerNames[li],
    marker: { color: acts.map(v => v > 0 ? layerColors[li] : cRed), opacity: 0.85 },
    xaxis: li === 0 ? "x"  : `x${li + 1}`,
    yaxis: li === 0 ? "y"  : `y${li + 1}`,
  }));

  // Build subplot axis objects
  const subplotAxes = {};
  for (let i = 0; i < nCols; i++) {
    const xKey = i === 0 ? "xaxis" : `xaxis${i + 1}`;
    const yKey = i === 0 ? "yaxis" : `yaxis${i + 1}`;
    subplotAxes[xKey] = {
      domain: [i * dW + gap / 2, (i + 1) * dW - gap / 2],
      showgrid: false, zeroline: false,
      title: { text: layerNames[i], font: { size: 11, color: layerColors[i] } },
    };
    subplotAxes[yKey] = {
      range: [-1, 1],
      gridcolor: "rgba(88,110,117,0.15)",
      zeroline: true, zerolinecolor: "rgba(88,110,117,0.3)",
      showticklabels: i === 0,
    };
  }

  // Use plotReact with raw subplot layout
  plotReact(containerEl, traces, {
    showlegend: false,
    height: 220,
    margin: { t: 30, b: 50, l: 40, r: 10 },
    ...subplotAxes,
  });
}
