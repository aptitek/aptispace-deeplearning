// =====================================================================
// lora.js — LoRA low-rank decomposition visualization
// =====================================================================
import { resolveCssValue } from "../core/core.js";

/**
 * Render an SVG comparing full-rank matrix W vs LoRA decomposition W + BA.
 * @param {HTMLElement} containerEl
 * @param {{ d, r }} params   d = matrix dimension, r = LoRA rank
 */
export function updateLoRAViz(containerEl, { d = 64, r = 8 } = {}) {
  if (!containerEl) return;

  containerEl.innerHTML = "";

  const dN = Math.max(4, Math.min(256, Math.round(+d)));
  const rN = Math.max(1, Math.min(dN / 2, Math.round(+r)));

  const totalFull = dN * dN;
  const totalLora = rN * dN + dN * rN;  // A + B
  const ratio     = totalLora / totalFull;

  const W = 600, H = 260;

  const cBlue   = "var(--sol-blue)";
  const cRed    = "var(--sol-red)";
  const cGreen  = "var(--sol-green)";
  const cOrange = "var(--sol-orange)";
  const cBase01 = "var(--sol-base01)";
  const cBase1  = "var(--sol-base1)";
  const cBg     = "var(--body-bg)";
  const cText   = "var(--body-color)";

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
      "font-size": opts.size || "12",
      "font-family": "inherit",
      "font-weight": opts.bold ? "bold" : "normal",
    }, { fill: opts.color || cText });
    t.textContent = content;
    svg.appendChild(t);
    return t;
  }

  // ── scale matrix boxes to fit in SVG ───────────────────────────────
  const MAX_BOX = 100;
  const scaleFactor = Math.min(MAX_BOX / dN, 1.8);
  const fullW = dN * scaleFactor;
  const fullH = dN * scaleFactor;

  const rScale = Math.max(1, Math.min(MAX_BOX / rN, 4));
  const bH = dN * scaleFactor;   // B: d rows × r cols
  const bW = rN * rScale;
  const aH = rN * rScale;        // A: r rows × d cols
  const aW = dN * scaleFactor;

  // ── Left: W (full rank, frozen) ─────────────────────────────────────
  const lCX = 110;
  text("Poids W gelés", lCX, 22, { bold: true, color: cBase1, size: "13" });
  text(`(d × d = ${dN}×${dN})`, lCX, 38, { color: cBase1, size: "11" });

  const wX = lCX - fullW / 2, wY = 55;
  svg.appendChild(el("rect", {
    x: wX, y: wY, width: fullW, height: fullH,
    rx: 3,
  }, { fill: cBg, stroke: cBlue, "stroke-width": "2" }));

  // Hatch pattern (frozen indicator)
  const defs = el("defs");
  const pattern = el("pattern", { id: "hatch", width: "6", height: "6", patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" });
  pattern.appendChild(el("line", { x1: "0", y1: "0", x2: "0", y2: "6", "stroke-width": "1" }, { stroke: cBlue + "40" }));
  defs.appendChild(pattern);
  svg.appendChild(defs);

  svg.appendChild(el("rect", {
    x: wX, y: wY, width: fullW, height: fullH, rx: 3,
    fill: "url(#hatch)",
  }));

  text(`${totalFull.toLocaleString("fr")} params`, lCX, wY + fullH + 16, { color: cBlue, size: "11" });
  text("🔒 gelé", lCX, wY + fullH + 30, { color: cBase1, size: "11" });

  // ── Plus sign ──────────────────────────────────────────────────────
  text("+", W / 2, H / 2 + 5, { size: "28", bold: true, color: cBase01 });

  // ── Right: LoRA B·A ───────────────────────────────────────────────
  const rCX = W - 160;
  const rLeftX = rCX - bW / 2 - aW / 2 - 10;

  text("Adaptation LoRA", rCX, 22, { bold: true, color: cGreen, size: "13" });
  text(`B (${dN}×${rN}) · A (${rN}×${dN})`, rCX, 38, { color: cBase1, size: "11" });

  // Matrix B: d rows × r cols
  const bX = rCX - bW - 15;
  const bStartY = 55 + (fullH - bH) / 2;

  svg.appendChild(el("rect", {
    x: bX, y: bStartY, width: bW, height: bH, rx: 3,
  }, { fill: cGreen + "22", stroke: cGreen, "stroke-width": "2" }));
  text("B", bX + bW / 2, bStartY + bH / 2 + 4, { color: cGreen, size: "13", bold: true });
  text(`${dN}×${rN}`, bX + bW / 2, bStartY + bH + 14, { color: cGreen, size: "11" });

  // Multiplication dot
  text("·", bX + bW + 7, bStartY + bH / 2 + 5, { size: "22", bold: true, color: cBase01 });

  // Matrix A: r rows × d cols
  const aX = bX + bW + 15;
  const aStartY = 55 + (fullH - aH) / 2;

  svg.appendChild(el("rect", {
    x: aX, y: aStartY, width: aW, height: aH, rx: 3,
  }, { fill: cOrange + "22", stroke: cOrange, "stroke-width": "2" }));
  text("A", aX + aW / 2, aStartY + aH / 2 + 4, { color: cOrange, size: "13", bold: true });
  text(`${rN}×${dN}`, aX + aW / 2, aStartY + aH + 14, { color: cOrange, size: "11" });

  // Param count + reduction
  text(`${totalLora.toLocaleString("fr")} params ✓`, rCX, 55 + bH + 30, { color: cGreen, size: "11", bold: true });
  const pct = (ratio * 100).toFixed(1);
  text(`Réduction : ${pct}% des params originaux`, rCX, 55 + bH + 46, { color: cGreen, size: "12" });

  // Rank label
  text(`r = ${rN}`, rCX, 55 + bH + 62, { color: cOrange, size: "12", bold: true });

  // ── Bottom label ──────────────────────────────────────────────────
  text("W' = W + B·A  —  seules A et B sont entraînées", W / 2, H - 5, { color: cBase1, size: "12" });
}
