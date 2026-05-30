// ==========================================
// graph.js — Generic Force-Directed Graph & Word Cloud Engine
// ==========================================
import ForceGraph from "https://esm.sh/force-graph";
import ForceGraph3D from "https://esm.sh/3d-force-graph";
import SpriteText from "https://esm.sh/three-spritetext";
import TagCloud from "https://esm.sh/TagCloud";
import { resolveCssValue, utils } from "./core.js";

// Private: helper to draw a rounded rectangle on a 2D Canvas context.
export function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Generic Force-Directed Graph (2D or 3D).
 * Creates and returns a highly customizable ForceGraph instance.
 *
 * @param {HTMLElement|string} container - Target container.
 * @param {Object} graphData - { nodes, links } structure.
 * @param {Object|boolean} optionsOr3d - Custom parameters or boolean for is3D.
 * @returns {Object} The ForceGraph instance.
 */
export function createGraph(container, graphData, optionsOr3d = {}) {
  const targetEl = typeof container === "string" ? document.querySelector(container) : container;
  if (!targetEl) {
    console.warn("createGraph: Target container not found.", container);
    return null;
  }
  targetEl.innerHTML = "";

  let is3D = false;
  let customOptions = {};
  if (typeof optionsOr3d === "boolean") {
    is3D = optionsOr3d;
  } else if (optionsOr3d && typeof optionsOr3d === "object") {
    is3D = !!optionsOr3d.is3D;
    customOptions = optionsOr3d;
  }

  const options = {
    nodeRadius: 16,
    nodeBorderWidth: 2,
    nodeShape: "circle",
    fontSize: 10,
    fontFamily: "var(--font-code, Consolas, monospace)",
    linkWidth: 2,
    linkArrowLength: 6,
    cooldownTicks: 120,
    enableZoom: true,
    enablePan: true,
    enableDrag: true,
    zoomToFit: false,
    zoomToFitPadding: 50,
    getNodeStatus: (node) => node.status || "default",
    getLinkStatus: (link) => link.status || "default",
    getNodeLabel: (node) => node.label || node.id,
    getNodeShape: (node) => node.shape || options.nodeShape || "circle",
    getLinkLabel: (link) => link.label || "",
    getLinkCondition: (link) => link.condition,
    onNodeClick: null,
    styles: {},
    ...customOptions
  };

  const resolveColor = (colorStr, fallback) => resolveCssValue(colorStr) || fallback;

  const defaultStyles = {
    default: {
      nodeBg: "var(--sol-base3)",
      nodeBorder: "var(--sol-base01)",
      nodeText: "var(--sol-base00)",
      linkStroke: "var(--sol-base1)",
      linkText: "var(--sol-base01)",
      particles: 0,
      particleColor: "var(--sol-base1)",
      particleWidth: 2,
      particleSpeed: 0.01
    }
  };

  const styles = {};
  const allStates = Array.from(new Set(["default", ...Object.keys(options.styles || {})]));
  for (const state of allStates) {
    styles[state] = { ...(defaultStyles.default), ...(options.styles[state] || {}) };
  }

  if (is3D) {
    const graph = ForceGraph3D()(targetEl)
      .graphData(graphData)
      .nodeThreeObject(node => {
        const label = options.getNodeLabel(node);
        const sprite = new SpriteText(label);
        const status = options.getNodeStatus(node);
        const style = styles[status] || styles.default;
        sprite.color = resolveColor(node.color || style.nodeText || "var(--sol-base0)", "#839496");
        sprite.textHeight = options.fontSize || 8;
        return sprite;
      });
    return graph;
  }

  const graph = ForceGraph()(targetEl)
    .graphData(graphData)
    .cooldownTicks(options.cooldownTicks)
    .enableZoomInteraction(options.enableZoom)
    .enablePanInteraction(options.enablePan)
    .enableNodeDrag(options.enableDrag)
    .linkDirectionalArrowLength(options.linkArrowLength)
    .linkDirectionalArrowRelPos(1);

  if (options.width) graph.width(options.width);
  if (options.height) graph.height(options.height);

  graph
    .linkColor((link) => {
      const status = options.getLinkStatus(link);
      const style = styles[status] || styles.default;
      return resolveColor(link.color || link.stroke || style.linkStroke, "#586e75");
    })
    .linkWidth((link) => {
      const status = options.getLinkStatus(link);
      return status === "current" ? options.linkWidth * 1.5 : options.linkWidth;
    })
    .linkDirectionalArrowColor((link) => {
      const status = options.getLinkStatus(link);
      const style = styles[status] || styles.default;
      return resolveColor(link.color || link.stroke || style.linkStroke, "#586e75");
    });

  graph
    .linkDirectionalParticles((link) => {
      const status = options.getLinkStatus(link);
      const style = styles[status] || styles.default;
      return style.particles || 0;
    })
    .linkDirectionalParticleColor((link) => {
      const status = options.getLinkStatus(link);
      const style = styles[status] || styles.default;
      return resolveColor(link.color || link.particleColor || style.particleColor || style.linkStroke, "#2aa198");
    })
    .linkDirectionalParticleWidth((link) => {
      const status = options.getLinkStatus(link);
      const style = styles[status] || styles.default;
      return style.particleWidth || 2;
    })
    .linkDirectionalParticleSpeed((link) => {
      const status = options.getLinkStatus(link);
      const style = styles[status] || styles.default;
      return style.particleSpeed || 0.01;
    });

  const defineNodePath = (ctx, x, y, shape, r, scale = 1.0) => {
    ctx.beginPath();
    const radius = r * scale;

    switch (shape) {
      case "square":
        ctx.rect(x - radius, y - radius, radius * 2, radius * 2);
        break;
      case "rect": {
        const w = radius * 2.6;
        const h = radius * 1.5;
        ctx.rect(x - w / 2, y - h / 2, w, h);
        break;
      }
      case "rounded rect": {
        const w = radius * 2.6;
        const h = radius * 1.5;
        const cr = Math.min(w, h) * 0.2;
        drawRoundedRect(ctx, x - w / 2, y - h / 2, w, h, cr);
        break;
      }
      case "pill": {
        const w = radius * 3.0;
        const h = radius * 1.4;
        drawRoundedRect(ctx, x - w / 2, y - h / 2, w, h, h / 2);
        break;
      }
      case "oval": {
        const rx = radius * 1.4;
        const ry = radius * 0.9;
        ctx.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
        break;
      }
      case "diamond": {
        const size = radius * 1.35;
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size, y);
        ctx.closePath();
        break;
      }
      case "circle":
      default:
        ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        break;
    }
  };

  graph.nodeCanvasObject((node, ctx, globalScale) => {
    const status = options.getNodeStatus(node);
    const shape = options.getNodeShape(node);
    const style = styles[status] || styles.default;

    const rawBg     = node.color || node.nodeBg || style.nodeBg || style.color;
    const rawBorder = node.borderColor || node.nodeBorder || node.border || style.nodeBorder || style.border;
    const rawText   = node.textColor || node.nodeText || style.nodeText;

    const nodeBg     = resolveColor(rawBg, "#eee8d5");
    const nodeBorder = resolveColor(rawBorder, "#586e75");
    const nodeText   = resolveColor(rawText, "#657b83");
    const r          = options.nodeRadius;

    ctx.save();

    if (status === "current") {
      const pulseFactor = 1 + 0.1 * Math.sin(Date.now() / 150);
      defineNodePath(ctx, node.x, node.y, shape, r, pulseFactor + 0.2);
      ctx.fillStyle = utils.rgba(nodeBorder, 0.15);
      ctx.fill();
      ctx.shadowColor = nodeBorder;
      ctx.shadowBlur = 15;
    }

    defineNodePath(ctx, node.x, node.y, shape, r, 1.0);
    ctx.fillStyle = resolveColor("var(--sol-base3)", "#fdf6e3");
    ctx.fill();

    defineNodePath(ctx, node.x, node.y, shape, r, 1.0);
    ctx.fillStyle = nodeBg;
    ctx.fill();

    defineNodePath(ctx, node.x, node.y, shape, r, 1.0);
    ctx.lineWidth = options.nodeBorderWidth / Math.min(1, globalScale);
    ctx.strokeStyle = nodeBorder;
    ctx.stroke();

    const label = options.getNodeLabel(node);
    if (label) {
      const fSize = options.fontSize;
      ctx.font = `bold ${fSize}px ${options.fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = nodeText;

      let maxTextWidth = r * 1.8;
      if (shape === "rect" || shape === "rounded rect") maxTextWidth = r * 2.3;
      if (shape === "pill") maxTextWidth = r * 2.6;
      if (shape === "oval") maxTextWidth = r * 2.2;

      let text = label;
      let textWidth = ctx.measureText(text).width;
      if (textWidth > maxTextWidth) {
        while (text.length > 3 && textWidth > maxTextWidth) {
          text = text.slice(0, -1);
          textWidth = ctx.measureText(text + "…").width;
        }
        text = text + "…";
      }
      ctx.fillText(text, node.x, node.y);
    }

    ctx.restore();
  });

  const hasLinkOverlays = graphData.links.some(l =>
    options.getLinkLabel(l) ||
    (options.getLinkCondition && options.getLinkCondition(l)) ||
    l.condition !== undefined
  );

  if (hasLinkOverlays) {
    graph.linkCanvasObjectMode(() => "after");
    graph.linkCanvasObject((link, ctx, globalScale) => {
      const { source, target } = link;
      if (typeof source !== "object" || typeof target !== "object") return;

      const status = options.getLinkStatus(link);
      const style  = styles[status] || styles.default;

      const condition = options.getLinkCondition ? options.getLinkCondition(link) : link.condition;
      if (condition !== undefined && condition !== null) {
        let isTrue = false;
        let condLabel = "";

        if (typeof condition === "object") {
          isTrue = !!condition.value;
          condLabel = condition.label || (isTrue ? "Vrai" : "Faux");
        } else {
          isTrue = !!condition;
          condLabel = isTrue ? "Vrai" : "Faux";
        }

        const startT = 0.25;
        const startX = source.x + (target.x - source.x) * startT;
        const startY = source.y + (target.y - source.y) * startT;

        ctx.save();
        ctx.translate(startX, startY);

        const tagFontSize = Math.max(3.5, options.fontSize - 1.5);
        ctx.font = `bold ${tagFontSize}px ${options.fontFamily}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const textWidth = ctx.measureText(condLabel).width;
        const pillH = tagFontSize + 4;
        const pillW = textWidth + 6;

        const tagBg     = isTrue ? "rgba(133, 153, 0, 0.15)" : "rgba(220, 50, 47, 0.15)";
        const tagBorder = resolveColor(isTrue ? "var(--sol-green)" : "var(--sol-red)", isTrue ? "#859900" : "#dc322f");

        ctx.beginPath();
        drawRoundedRect(ctx, -pillW / 2, -pillH / 2, pillW, pillH, 3);
        ctx.fillStyle = resolveColor("var(--sol-base3)", "#fdf6e3");
        ctx.fill();

        ctx.beginPath();
        drawRoundedRect(ctx, -pillW / 2, -pillH / 2, pillW, pillH, 3);
        ctx.fillStyle = tagBg;
        ctx.fill();

        ctx.lineWidth = 1;
        ctx.strokeStyle = tagBorder;
        ctx.stroke();

        ctx.fillStyle = tagBorder;
        ctx.fillText(condLabel, 0, 0);

        ctx.restore();
      }

      const label = options.getLinkLabel(link);
      if (label) {
        const linkText = resolveColor(style.linkText, "#657b83");
        const labelBg  = resolveColor("var(--sol-base3)", "#fdf6e3");

        const x = source.x + (target.x - source.x) * 0.5;
        const y = source.y + (target.y - source.y) * 0.5;

        ctx.save();

        const fSize = Math.max(4, options.fontSize - 1);
        ctx.font = `${fSize}px ${options.fontFamily}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const textWidth = ctx.measureText(label).width;
        const paddingX = 4;
        const paddingY = 2;
        const rectW = textWidth + paddingX * 2;
        const rectH = fSize + paddingY * 2;

        ctx.fillStyle = labelBg;
        ctx.strokeStyle = resolveColor(style.linkStroke, "#586e75");
        ctx.lineWidth = 1;

        drawRoundedRect(ctx, x - rectW / 2, y - rectH / 2, rectW, rectH, rectH / 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = linkText;
        ctx.fillText(label, x, y);

        ctx.restore();
      }
    });
  }

  if (options.onNodeClick) {
    graph.onNodeClick((node, event) => options.onNodeClick(node, event));
  }

  if (options.zoomToFit) {
    setTimeout(() => {
      try { graph.zoomToFit(400, options.zoomToFitPadding); }
      catch (err) { console.warn("zoomToFit error:", err); }
    }, 150);
  }

  return graph;
}

/**
 * 3D Interactive Word Cloud.
 *
 * @param {string} containerSelector - ID of the target container (without #).
 * @param {Array}  words             - Array of word strings.
 * @param {Object} options           - TagCloud options override.
 * @returns {Object} TagCloud instance.
 */
export function createWordCloud(containerSelector, words, options = {}) {
  const container = document.querySelector('#' + containerSelector);
  if (!container) {
    console.warn(`createWordCloud: element #${containerSelector} not found.`);
    return null;
  }

  container.innerHTML = "";

  const instance = TagCloud(container, words, {
    radius: 100,
    maxSpeed: 'normal',
    initSpeed: 'normal',
    keep: true,
    ...options
  });

  const colorMap = {
    rouge: 'var(--sol-red)', red: 'var(--sol-red)',
    bleu: 'var(--sol-blue)', blue: 'var(--sol-blue)',
    vert: 'var(--sol-green)', green: 'var(--sol-green)',
    jaune: 'var(--sol-yellow)', yellow: 'var(--sol-yellow)',
    orange: 'var(--sol-orange)',
    violet: 'var(--sol-violet)', purple: 'var(--sol-violet)',
    rose: 'var(--sol-magenta)', pink: 'var(--sol-magenta)',
    cyan: 'var(--sol-cyan)',
    magenta: 'var(--sol-magenta)'
  };

  const palette = [
    'var(--sol-cyan)', 'var(--sol-violet)', 'var(--sol-magenta)',
    'var(--sol-orange)', 'var(--sol-yellow)',
    'var(--sol-base01)', 'var(--sol-base00)'
  ];

  container.querySelectorAll('.tagcloud--item').forEach(item => {
    const text = item.textContent.trim().toLowerCase();
    if (colorMap[text]) {
      item.style.color = colorMap[text];
      item.style.fontWeight = 'bold';
    } else {
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
      }
      item.style.color = palette[Math.abs(hash) % palette.length];
    }
  });

  return instance;
}
