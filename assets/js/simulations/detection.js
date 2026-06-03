const SVG_NS = "http://www.w3.org/2000/svg";

const DETECTIONS = [
  { r: 0, c: 0, conf: 0.95, label: "Chien", color: "var(--accent-info)" },
  { r: 0.5, c: 0.5, conf: 0.87, label: "Voiture", color: "var(--accent-danger)" },
  { r: 1, c: 1, conf: 0.72, label: "Arbre", color: "var(--accent-success)" }
];

function svgEl(tag, attrs = {}, styles = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  Object.entries(styles).forEach(([key, value]) => node.style.setProperty(key, value));
  return node;
}

export function renderYoloGrid({ size = 3, iou = 0.5 } = {}) {
  const cellSize = Math.min(240, Math.floor(560 / size));
  const totalSize = cellSize * size;

  const wrapper = document.createElement("div");
  wrapper.className = "d-flex flex-column align-items-center";

  const svg = svgEl("svg", {
    width: totalSize,
    height: totalSize,
    viewBox: `0 0 ${totalSize} ${totalSize}`
  }, {
    background: "var(--body-bg)",
    border: "1px solid var(--card-border)",
    "border-radius": "4px"
  });

  for (let i = 0; i <= size; i += 1) {
    svg.appendChild(svgEl("line", {
      x1: i * cellSize, y1: 0, x2: i * cellSize, y2: totalSize
    }, { stroke: "var(--card-border)", "stroke-width": "1" }));
    svg.appendChild(svgEl("line", {
      x1: 0, y1: i * cellSize, x2: totalSize, y2: i * cellSize
    }, { stroke: "var(--card-border)", "stroke-width": "1" }));
  }

  DETECTIONS.map(d => ({
    ...d,
    r: d.r === 0.5 ? Math.floor(size / 2) : d.r * (size - 1),
    c: d.c === 0.5 ? Math.floor(size / 2) : d.c * (size - 1)
  })).filter(d => d.r < size && d.c < size).forEach(d => {
    const x = d.c * cellSize + cellSize * 0.1;
    const y = d.r * cellSize + cellSize * 0.1;
    const shown = d.conf >= iou;

    svg.appendChild(svgEl("rect", {
      x, y, width: cellSize * 1.8, height: cellSize * 1.8, rx: 3,
      "stroke-width": shown ? 2 : 1
    }, {
      fill: shown ? `color-mix(in srgb, ${d.color} 13%, transparent)` : "none",
      stroke: shown ? d.color : "var(--card-border)"
    }));

    if (shown) {
      const label = svgEl("text", {
        x: x + 4, y: y + 14, "font-size": 11, "font-family": "monospace"
      }, { fill: d.color });
      label.textContent = `${d.label} ${(d.conf * 100).toFixed(0)}%`;
      svg.appendChild(label);
    }

    svg.appendChild(svgEl("circle", {
      cx: d.c * cellSize + cellSize / 2,
      cy: d.r * cellSize + cellSize / 2,
      r: 4,
      opacity: shown ? 1 : 0.3
    }, { fill: d.color }));
  });

  const title = svgEl("text", {
    x: 4, y: 14, "font-size": 10, "font-family": "monospace"
  }, { fill: "var(--body-color)" });
  title.textContent = `Grille ${size}x${size}`;
  svg.appendChild(title);
  wrapper.appendChild(svg);

  const caption = document.createElement("p");
  caption.className = "text-muted small mt-2 mb-0";
  caption.textContent = `Chaque cellule prédit B boîtes + confiance + classes. Les boîtes avec conf >= ${iou} sont retenues après NMS.`;
  wrapper.appendChild(caption);

  return wrapper;
}

export function mountYoloGrid(selectorOrElement, options = {}) {
  const container = typeof selectorOrElement === "string"
    ? document.querySelector(selectorOrElement)
    : selectorOrElement;
  if (!container) return document.createElement("span");

  container.replaceChildren(renderYoloGrid(options));
  const sentinel = document.createElement("span");
  sentinel.className = "d-none";
  return sentinel;
}
