// ==========================================
// sim/state-machine.js — State Machine Graph Preset
// ==========================================
// Usage (OJS):
//   import { createStateMachine } from "./assets/js/sim/state-machine.js"
//   graph = createStateMachine("#container", { nodes, links }, options)

import { createGraph } from "../graph.js";

// Solarized semantic style presets for each node/link state
const STYLES = {
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
  },
  past: {
    nodeBg: "var(--sol-base2)",
    nodeBorder: "var(--sol-green)",
    nodeText: "var(--sol-green)",
    linkStroke: "var(--sol-green)",
    linkText: "var(--sol-green)",
    particles: 1,
    particleColor: "var(--sol-green)",
    particleWidth: 3,
    particleSpeed: 0.015
  },
  current: {
    nodeBg: "var(--sol-base2)",
    nodeBorder: "var(--sol-yellow)",
    nodeText: "var(--sol-yellow)",
    linkStroke: "var(--sol-yellow)",
    linkText: "var(--sol-yellow)",
    particles: 4,
    particleColor: "var(--sol-yellow)",
    particleWidth: 4,
    particleSpeed: 0.03
  },
  entry: {
    nodeBg: "rgba(38, 139, 210, 0.15)",
    nodeBorder: "var(--sol-blue)",
    nodeText: "var(--sol-blue)",
    linkStroke: "var(--sol-base1)",
    linkText: "var(--sol-base01)",
    particles: 0,
    particleColor: "var(--sol-base1)",
    particleWidth: 2,
    particleSpeed: 0.01
  }
};

/**
 * Thin preset wrapper around createGraph for state machine diagrams.
 * Provides Solarized semantic styles for default / past / current / entry states.
 *
 * @param {HTMLElement|string} container   - Target container.
 * @param {Object}             graphData  - { nodes, links }
 * @param {Object}             options    - Options forwarded to createGraph (styles are merged).
 * @returns {Object} ForceGraph instance.
 */
export function createStateMachine(container, graphData, options = {}) {
  const styles = { ...STYLES };
  for (const key of Object.keys(options.styles || {})) {
    styles[key] = { ...(STYLES[key] || {}), ...options.styles[key] };
  }
  return createGraph(container, graphData, { ...options, styles });
}
