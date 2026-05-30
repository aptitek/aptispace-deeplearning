// ==========================================
// sim/storage.js — Row vs Column Storage Graph Simulator
// ==========================================
// Usage (OJS):
//   import { createStorageGraph } from "./assets/js/sim/storage.js"
//   graph = createStorageGraph("ram-graph-container", storageMode, "Salaire", tableData)

import ForceGraph from "https://esm.sh/force-graph";
import { getThemeColor, resolveCssValue, StateMachine } from "../core.js";
import { drawRoundedRect } from "../graph.js";

/**
 * Force-directed graph visualizing CPU access patterns for row vs column-oriented memory.
 * Animates cache Hit / Miss traversal over a parsed markdown table.
 *
 * @param {string} containerSelector - Element id or CSS selector.
 * @param {string} mode              - 'ligne' (row) or 'colonne' (column).
 * @param {string} queryCol          - Target column being read (e.g. 'Salaire').
 * @param {Array}  tableData         - Parsed table: array of row objects.
 * @returns {Object} ForceGraph instance with destroy().
 */
export function createStorageGraph(containerSelector, mode, queryCol, tableData = []) {
  const container = typeof containerSelector === 'string'
    ? document.querySelector(containerSelector.startsWith('#') ? containerSelector : '#' + containerSelector)
    : containerSelector;

  if (!container) {
    console.warn(`createStorageGraph: element ${containerSelector} not found.`);
    return null;
  }

  container.innerHTML = "";
  if (!tableData || tableData.length === 0) return null;

  const columns = Object.keys(tableData[0]);
  const nodes   = [];
  const links   = [];

  const colorHit    = getThemeColor("--sol-green",   "#859900");
  const colorMiss   = getThemeColor("--sol-red",     "#dc322f");
  const colorLoad   = getThemeColor("--sol-blue",    "#268bd2");
  const colorActive = getThemeColor("--sol-yellow",  "#b58900");

  const palette = [
    getThemeColor("--sol-cyan",    "#2aa198"),
    getThemeColor("--sol-magenta", "#d33682"),
    getThemeColor("--sol-orange",  "#cb4b16"),
    getThemeColor("--sol-violet",  "#6c71c4")
  ];
  const colColors = {};
  columns.forEach((col, i) => colColors[col] = palette[i % palette.length]);

  nodes.push({ id: "CPU", label: "CPU", val: "Processeur", type: "cpu", fx: 0, fy: -80 });

  const addrMap = {};
  let addrIdx = 0;
  if (mode === "ligne") {
    tableData.forEach((row, r) => columns.forEach(col => {
      addrMap[`${r}_${col}`] = `0x${(addrIdx++ * 8).toString(16).toUpperCase().padStart(2, '0')}`;
    }));
  } else {
    columns.forEach(col => tableData.forEach((row, r) => {
      addrMap[`${r}_${col}`] = `0x${(addrIdx++ * 8).toString(16).toUpperCase().padStart(2, '0')}`;
    }));
  }

  tableData.forEach((row, r) => {
    columns.forEach((col, c) => {
      const cellId = `${r}_${col}`;
      nodes.push({
        id: cellId, label: col, val: row[col], type: "ram",
        addr: addrMap[cellId], color: colColors[col],
        fx: (c - (columns.length - 1) / 2) * 118,
        fy: (r - 1) * 60 + 20
      });
    });
  });

  const physicalOrder = [];
  if (mode === "ligne") {
    tableData.forEach((row, r) => columns.forEach(col => physicalOrder.push(`${r}_${col}`)));
  } else {
    columns.forEach(col => tableData.forEach((row, r) => physicalOrder.push(`${r}_${col}`)));
  }

  links.push({
    id: `CPU->${physicalOrder[0]}`,
    source: nodes.find(n => n.id === "CPU"),
    target: nodes.find(n => n.id === physicalOrder[0]),
    type: "physical", cacheLabel: "Load", cacheColor: colorLoad
  });

  for (let i = 0; i < physicalOrder.length - 1; i++) {
    const srcId = physicalOrder[i];
    const tgtId = physicalOrder[i + 1];
    const isHit = mode === "colonne" &&
      srcId.substring(srcId.indexOf('_') + 1) === tgtId.substring(tgtId.indexOf('_') + 1);

    links.push({
      id: `${srcId}->${tgtId}`,
      source: nodes.find(n => n.id === srcId),
      target: nodes.find(n => n.id === tgtId),
      type: "physical",
      cacheLabel: isHit ? "Hit" : "Miss",
      cacheColor: isHit ? colorHit : colorMiss
    });
  }

  const statesSequence = [{ activeNodes: new Set(["CPU"]), currentLinks: new Set(), pastLinks: new Set() }];

  if (queryCol !== "Aucune" && columns.includes(queryCol)) {
    let accumulatedNodes = new Set(["CPU"]);
    let pastLinks = new Set();

    const firstLinkId = `CPU->${physicalOrder[0]}`;
    accumulatedNodes.add(physicalOrder[0]);
    statesSequence.push({ activeNodes: new Set([...accumulatedNodes]), currentLinks: new Set([firstLinkId]), pastLinks: new Set([...pastLinks]) });
    pastLinks.add(firstLinkId);

    let hitCount = Array.from(accumulatedNodes).filter(id => id.endsWith(`_${queryCol}`)).length;

    if (hitCount < tableData.length) {
      for (let i = 1; i < physicalOrder.length; i++) {
        const cellId = physicalOrder[i];
        const linkId = `${physicalOrder[i - 1]}->${cellId}`;
        accumulatedNodes.add(cellId);
        statesSequence.push({ activeNodes: new Set([...accumulatedNodes]), currentLinks: new Set([linkId]), pastLinks: new Set([...pastLinks]) });
        pastLinks.add(linkId);
        if (Array.from(accumulatedNodes).filter(id => id.endsWith(`_${queryCol}`)).length === tableData.length) break;
      }
    }

    statesSequence.push({ activeNodes: new Set([...accumulatedNodes]), currentLinks: new Set(), pastLinks: new Set([...pastLinks]) });
  }

  const compStyle = getComputedStyle(container);
  const getNum = (v, fb) => parseFloat(compStyle.getPropertyValue(v)) || fb;
  const getStr = (v, fb) => { const r = compStyle.getPropertyValue(v).trim(); return r ? resolveCssValue(r) : fb; };

  const cfg = {
    nodeText:  getStr('--canvas-node-text', '#fdf6e3'),
    nodeFont:  getNum('--canvas-node-font-size', 12),
    addrFont:  getNum('--canvas-addr-font-size', 9),
    nodePadX:  getNum('--canvas-node-pad-x', 14),
    labelFont: getNum('--canvas-label-font-size', 10),
    labelBg:   getStr('--canvas-label-bg', 'rgba(0, 43, 54, 0.9)'),
    wActive:   getNum('--canvas-wire-width-active', 2.5),
    wPast:     getNum('--canvas-wire-width-past', 1.5),
    wIdle:     getNum('--canvas-wire-width-idle', 1),
    cPast:     getStr('--canvas-wire-color-past', 'rgba(88, 110, 117, 0.4)'),
    cIdle:     getStr('--canvas-wire-color-idle', 'rgba(88, 110, 117, 0.12)')
  };

  const fontMono = getThemeColor('--font-mono', 'monospace');

  const graph = ForceGraph()(container)
    .graphData({ nodes, links })
    .backgroundColor('rgba(0,0,0,0)')
    .nodeRelSize(7)
    .cooldownTicks(0)
    .enableZoomInteraction(false)
    .enablePanInteraction(false)
    .linkDirectionalArrowLength(6)
    .linkDirectionalArrowRelPos(1.0);

  graph.d3Force('center', null);
  graph.d3Force('charge', null);
  if (graph.d3Force('link')) graph.d3Force('link').strength(0);

  graph.nodeCanvasObject((node, ctx, globalScale) => {
    const label    = node.type === "cpu" ? "CPU: Processeur" : `${node.label}: ${node.val}`;
    const fontSize = cfg.nodeFont / globalScale;
    ctx.font = `${fontSize}px ${fontMono}`;
    const textWidth = ctx.measureText(label).width;
    const bWidth    = textWidth + cfg.nodePadX;
    const bHeight   = fontSize * 2.5;

    const resolvedFill = resolveCssValue(node.type === "cpu" ? "var(--sol-violet)" : node.color) || node.color;

    ctx.shadowColor = node.isActive
      ? (node.type === "cpu" ? (resolveCssValue("var(--sol-violet)") || "#6c71c4") : colorActive)
      : "transparent";
    ctx.shadowBlur = node.isActive ? 12 / globalScale : 0;

    ctx.fillStyle   = resolvedFill;
    ctx.strokeStyle = node.isActive ? colorActive : "transparent";
    ctx.lineWidth   = node.isActive ? cfg.wActive : 0;

    drawRoundedRect(ctx, node.x - bWidth / 2, node.y - bHeight / 2, bWidth, bHeight, 5);
    ctx.fill();

    ctx.shadowColor = "transparent";
    if (node.isActive) ctx.stroke();

    ctx.fillStyle    = resolveCssValue(cfg.nodeText) || cfg.nodeText;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, node.x, node.y - fontSize * 0.25);

    if (node.type !== "cpu") {
      ctx.font      = `${cfg.addrFont / globalScale}px ${fontMono}`;
      ctx.fillStyle = node.isActive ? colorActive : "rgba(253, 246, 227, 0.6)";
      ctx.fillText(node.addr, node.x, node.y + fontSize * 0.7);
    }
  });

  graph
    .linkWidth(link => link.isCurrent ? cfg.wActive : (link.isPast ? cfg.wPast : cfg.wIdle))
    .linkColor(link => link.isCurrent ? colorActive : (link.isPast ? resolveCssValue(cfg.cPast) || cfg.cPast : resolveCssValue(cfg.cIdle) || cfg.cIdle))
    .linkDirectionalParticles(link => link.isCurrent ? 3 : 0)
    .linkDirectionalParticleSpeed(0.015)
    .linkDirectionalParticleWidth(4.5)
    .linkDirectionalParticleColor(() => colorActive)
    .linkDirectionalArrowColor(link => link.isCurrent ? colorActive : (link.isPast ? resolveCssValue(cfg.cPast) || cfg.cPast : resolveCssValue(cfg.cIdle) || cfg.cIdle));

  graph.linkCanvasObjectMode(() => "after");
  graph.linkCanvasObject((link, ctx, globalScale) => {
    const label = link.cacheLabel || "";
    if (!label) return;
    const { source, target } = link;
    if (typeof source !== "object" || typeof target !== "object") return;

    const cx = source.x + (target.x - source.x) * 0.5;
    const cy = source.y + (target.y - source.y) * 0.5;

    const fontSize  = cfg.labelFont / globalScale;
    ctx.font        = `bold ${fontSize}px ${fontMono}`;
    const textWidth = ctx.measureText(label).width;
    const pX = 5 / globalScale;
    const pY = 3 / globalScale;

    ctx.save();
    ctx.fillStyle = resolveCssValue(cfg.labelBg) || cfg.labelBg;
    drawRoundedRect(ctx, cx - textWidth / 2 - pX, cy - fontSize / 2 - pY, textWidth + pX * 2, fontSize + pY * 2, 3 / globalScale);
    ctx.fill();

    ctx.fillStyle    = link.cacheColor || (link.isCurrent ? colorActive : (link.isPast ? resolveCssValue(cfg.cPast) || cfg.cPast : "rgba(147, 161, 161, 0.7)"));
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, cy);
    ctx.restore();
  });

  const resizeObserver = new ResizeObserver(entries => {
    for (const entry of entries) {
      const { width: w, height: h } = entry.contentRect;
      if (w > 0 && h > 0) {
        graph.width(w).height(h);
        graph.centerAt(0, 0, 0);
        graph.zoom(Math.min(w, h) / 260, 0);
      }
    }
  });
  resizeObserver.observe(container);

  const engine = new StateMachine({
    states: statesSequence,
    interval: 1100,
    loop: true,
    onStateChange: (payload) => {
      nodes.forEach(n => n.isActive = payload.activeNodes.has(n.id));
      links.forEach(l => {
        const srcId  = typeof l.source === 'object' ? l.source.id : l.source;
        const tgtId  = typeof l.target === 'object' ? l.target.id : l.target;
        l.source     = nodes.find(n => n.id === srcId) || l.source;
        l.target     = nodes.find(n => n.id === tgtId) || l.target;
        const linkId = `${srcId}->${tgtId}`;
        l.isCurrent  = payload.currentLinks.has(linkId);
        l.isPast     = payload.pastLinks.has(linkId);
      });
      graph.graphData({ nodes: [...nodes], links: [...links] });
    }
  });

  container.__stateMachine = engine;
  engine.start();

  const startBtn = document.getElementById("btn-ram-start");
  if (startBtn) {
    startBtn.onclick = (e) => { e.preventDefault(); engine.reset(); engine.start(); };
  }

  graph.destroy = () => {
    resizeObserver.disconnect();
    if (engine) engine.stop();
  };

  return graph;
}
