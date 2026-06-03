const SVG_NS = "http://www.w3.org/2000/svg";

function svgEl(tag, attrs = {}, styles = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  Object.entries(styles).forEach(([key, value]) => node.style.setProperty(key, value));
  return node;
}

export function renderLatentInterpolation({ mode = "AE (Déterministe)", alpha = 0.15 } = {}) {
  const isVae = mode.startsWith("VAE");
  const width = 560;
  const height = 280;
  const pointA = { x: width * 0.15, y: height / 2 };
  const pointB = { x: width * 0.85, y: height / 2 };
  const cursorX = pointA.x + alpha * (pointB.x - pointA.x);
  const auraRadius = isVae ? 120 : 35;

  const svg = svgEl("svg", {
    viewBox: `0 0 ${width} ${height}`,
    preserveAspectRatio: "xMidYMid meet"
  }, {
    width: "100%",
    height: "auto",
    display: "block",
    background: "var(--sol-base03)",
    "border-radius": "12px"
  });

  const defs = svgEl("defs");
  [
    ["nodeA", "var(--accent-info)"],
    ["nodeB", "var(--accent-danger)"]
  ].forEach(([id, color]) => {
    const gradient = svgEl("radialGradient", { id });
    gradient.appendChild(svgEl("stop", { offset: "0%" }, {
      "stop-color": color,
      "stop-opacity": isVae ? "0.35" : "0.15"
    }));
    gradient.appendChild(svgEl("stop", { offset: "100%" }, {
      "stop-color": color,
      "stop-opacity": "0"
    }));
    defs.appendChild(gradient);
  });
  svg.appendChild(defs);

  svg.appendChild(svgEl("line", {
    x1: pointA.x, y1: height / 2, x2: pointB.x, y2: height / 2,
    "stroke-width": 2, "stroke-dasharray": "6,4"
  }, { stroke: "var(--sol-base01)" }));

  [
    { point: pointA, id: "nodeA", color: "var(--accent-info)", label: "Chat" },
    { point: pointB, id: "nodeB", color: "var(--accent-danger)", label: "Chien" }
  ].forEach(({ point, id, color, label }) => {
    svg.appendChild(svgEl("circle", { cx: point.x, cy: point.y, r: auraRadius }, {
      fill: `url(#${id})`
    }));
    svg.appendChild(svgEl("circle", {
      cx: point.x, cy: point.y, r: 30, "stroke-width": 2
    }, { fill: color, stroke: "var(--sol-base3)" }));
    const text = svgEl("text", {
      x: point.x, y: point.y, "text-anchor": "middle", dy: ".35em",
      "font-size": "14px", "font-weight": "700"
    }, { fill: "var(--sol-base3)" });
    text.textContent = label;
    svg.appendChild(text);
  });

  svg.appendChild(svgEl("circle", {
    cx: cursorX, cy: height / 2, r: 10, "stroke-width": 2
  }, {
    fill: "var(--accent-warning)",
    stroke: "var(--sol-base3)",
    filter: "drop-shadow(0 0 8px var(--accent-warning))"
  }));

  const alphaLabel = svgEl("text", {
    x: cursorX, y: height / 2 + 26, "text-anchor": "middle",
    "font-size": "10px", "font-weight": "700"
  }, { fill: "var(--accent-warning)" });
  alphaLabel.textContent = `alpha = ${alpha.toFixed(2)}`;
  svg.appendChild(alphaLabel);

  const inGap = alpha > 0.2 && alpha < 0.8;
  const state = isVae
    ? alpha < 0.2
      ? { label: "Chat", color: "var(--accent-info)" }
      : alpha > 0.8
        ? { label: "Chien", color: "var(--accent-danger)" }
        : { label: "Interpolation continue", color: "var(--accent-warning)" }
    : { label: inGap ? "Trou semantique (AE)" : "Zone valide", color: inGap ? "var(--accent-danger)" : "var(--accent-success)" };

  const stateLabel = svgEl("text", {
    x: width / 2, y: 24, "text-anchor": "middle",
    "font-size": "13px", "font-weight": "700"
  }, { fill: state.color });
  stateLabel.textContent = state.label;
  svg.appendChild(stateLabel);

  const modeLabel = svgEl("text", {
    x: width - 10, y: height - 8, "text-anchor": "end",
    "font-size": "10px", "font-weight": "700"
  }, { fill: isVae ? "var(--accent-success)" : "var(--accent-danger)" });
  modeLabel.textContent = isVae ? "VAE - espace continu" : "AE - espace fragmente";
  svg.appendChild(modeLabel);

  return svg;
}

function metricCard(label, value, valueClass) {
  const card = document.createElement("div");
  card.className = "sim-metric-card";
  const labelEl = document.createElement("div");
  labelEl.className = "text-muted";
  labelEl.textContent = label;
  const valueEl = document.createElement("div");
  valueEl.className = `fw-bold font-monospace ${valueClass}`;
  valueEl.textContent = value;
  card.append(labelEl, valueEl);
  return card;
}

export function renderVqVaeMetrics({ codebook = [], x = 0, y = 0 } = {}) {
  const nearest = codebook.reduce((best, point) => {
    const distance = Math.hypot(point.x - x, point.y - y);
    return distance < best.distance ? { point, distance } : best;
  }, { point: codebook[0], distance: Infinity });

  const distState = nearest.distance < 1.5 ? "success" : nearest.distance < 3 ? "warning" : "danger";
  const row = document.createElement("div");
  row.className = "sim-metric-row";
  row.append(
    metricCard("Vecteur continu", `[${x.toFixed(2)}, ${y.toFixed(2)}]`, "text-info"),
    metricCard("Code VQ (k*)", nearest.point?.id ?? "-", "text-success"),
    metricCard("Distance Euclidienne", nearest.distance.toFixed(3), `sim-metric-dist dist-${distState}`)
  );
  return row;
}
