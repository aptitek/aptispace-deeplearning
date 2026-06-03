// =====================================================================
// autoencoder.js — Autoencoder architecture flow diagram
// =====================================================================
import { resolveCssValue } from "../core.js";

/**
 * Render an autoencoder architecture: [input] → [encoder] → [bottleneck] → [decoder] → [output].
 * @param {HTMLElement} containerEl
 * @param {{ bottleneckDim, inputDim }} params
 */
export function updateAutoencoderViz(containerEl, { bottleneckDim = 4, inputDim = 32 } = {}) {
  if (!containerEl) return;

  containerEl.innerHTML = "";

  const dIN  = Math.max(4, Math.min(128, Math.round(+inputDim)));
  const dBN  = Math.max(1, Math.min(dIN / 2, Math.round(+bottleneckDim)));
  const ratio = (dBN / dIN * 100).toFixed(0);

  // Encoder layers: input → half → bottleneck
  const encLayers = [dIN, Math.round(dIN / 2), dBN];
  const decLayers = [dBN, Math.round(dIN / 2), dIN];
  const allLayers = [...encLayers, ...decLayers.slice(1)];  // [dIN, dIN/2, dBN, dIN/2, dIN]

  const W = 560, H = 200;
  const N = allLayers.length;
  const spacing = W / (N + 1);
  const MAX_BAR_H = 140;
  const maxDim = allLayers[0];

  const cBlue   = "var(--sol-blue)";
  const cOrange = "var(--sol-orange)";
  const cGreen  = "var(--sol-green)";
  const cBase01 = "var(--sol-base01)";
  const cBase1  = "var(--sol-base1)";
  const cBg     = "var(--body-bg)";
  const cText   = "var(--body-color)";

  const isEnc = (i) => i < 2;
  const isBN  = (i) => i === 2;
  const isDec = (i) => i >= 3;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
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

  function text(content, x, y, opts = {}) {
    const t = el("text", {
      x, y,
      "text-anchor": opts.anchor || "middle",
      "font-size": opts.size || "11",
      "font-family": "inherit",
      "font-weight": opts.bold ? "bold" : "normal",
    }, { fill: opts.color || cText });
    t.textContent = content;
    svg.appendChild(t);
  }

  const centreY = H / 2;
  const layerXs = allLayers.map((_, i) => (i + 1) * spacing);

  // ── Draw connecting arrows ─────────────────────────────────────────
  for (let i = 0; i < N - 1; i++) {
    const x1 = layerXs[i] + 10;
    const x2 = layerXs[i + 1] - 10;
    svg.appendChild(el("line", { x1, y1: centreY, x2, y2: centreY, "stroke-width": "1.5" }, { stroke: cBase01 }));
    // Arrow tip
    svg.appendChild(el("polygon", {
      points: `${x2},${centreY - 4} ${x2 + 7},${centreY} ${x2},${centreY + 4}`,
    }, { fill: cBase01 }));
  }

  // ── Draw layers ────────────────────────────────────────────────────
  allLayers.forEach((dim, i) => {
    const cx = layerXs[i];
    const barH = Math.max(8, (dim / maxDim) * MAX_BAR_H);
    const barW = 18;
    const rx = 3;

    let color = isEnc(i) ? cBlue : isDec(i) ? cOrange : cGreen;
    let opacity = isBN(i) ? "1" : "0.8";

    svg.appendChild(el("rect", {
      x: cx - barW / 2, y: centreY - barH / 2,
      width: barW, height: barH, rx,
    }, { fill: color, opacity }));

    // Dimension label above
    text(`${dim}`, cx, centreY - barH / 2 - 5, { size: "11", bold: isBN(i), color });

    // Layer name below
    let name = "";
    if (i === 0) name = "Entrée";
    else if (i === 1) name = "Encodeur";
    else if (i === 2) name = "Latent z";
    else if (i === 3) name = "Décodeur";
    else if (i === 4) name = "Sortie x̂";
    text(name, cx, centreY + barH / 2 + 16, { size: "10", color: i === 2 ? cGreen : cBase1 });
  });

  // ── Section braces ────────────────────────────────────────────────
  const encEndX = layerXs[1] + 18;
  const decStartX = layerXs[3] - 18;

  // Encoder brace
  text("◀─── Encodeur fθ ───▶", (layerXs[0] + layerXs[2]) / 2, 18, { size: "11", color: cBlue });

  // Decoder brace
  text("◀─── Décodeur gφ ───▶", (layerXs[2] + layerXs[4]) / 2, 18, { size: "11", color: cOrange });

  // Compression ratio
  text(`Compression : ${ratio}% (${dIN}D → ${dBN}D)`, W / 2, H - 5, { size: "12", color: cGreen, bold: true });
}
