// ==========================================
// sim/motherboard.js — Motherboard SVG Simulator
// ==========================================
// Usage (OJS):
//   import * as mb from "./assets/js/sim/motherboard.js"
//   await mb.init("#motherboard-view")
//   mb.render(hardwareState)

/**
 * Fetches and inlines the motherboard SVG into the container for full DOM access.
 * Falls back to the CSS background-image URL if no explicit URL is provided.
 *
 * @param {string} selector - CSS selector for the container element.
 */
export async function init(selector) {
  const container = document.querySelector(selector);
  if (!container) return;

  let svgUrl = new URL('../../ui/motherboard.svg', import.meta.url).href;

  const bg = getComputedStyle(container).backgroundImage;
  const match = bg.match(/url\("?([^"\)]+)"?\)/);
  if (match && match[1]) svgUrl = match[1];

  try {
    const res = await fetch(svgUrl);
    if (res.ok) {
      container.innerHTML = await res.text();
      container.style.backgroundImage = 'none';
    }
  } catch (e) {
    console.error("motherboard.init: Failed to inline SVG —", e);
  }
}

// All valid hardware states and their corresponding active CSS class suffix
const STATE_MAP = {
  ssd:     ["bus-ssd-chipset", "bus-chipset-ram"],
  ram:     ["bus-ssd-chipset", "bus-chipset-ram"],
  l3:      ["bus-ram-chipset", "bus-chipset-ram", "bus-chipset-cpu", "bus-ram-cpu"],
  l2_l1:  ["bus-cpu-internal", "bus-cpu-internal-6"],
  cpu_reg: ["bus-cpu-internal-6-5"]
};

/**
 * Updates the active data-bus animations on the motherboard SVG for a given hardware state.
 *
 * @param {string} state - Active state key: 'ssd' | 'ram' | 'l3' | 'l2_l1' | 'cpu_reg'
 */
export function render(state) {
  const container = document.querySelector("#motherboard-view");
  if (!container) return;

  const allBuses = [
    "bus-ssd-chipset", "bus-chipset-ram", "bus-ram-chipset",
    "bus-chipset-cpu", "bus-cpu-internal", "bus-cpu-internal-6",
    "bus-cpu-internal-6-5", "bus-ram-cpu"
  ];

  // Reset all state classes and bus flows
  ["ssd", "ram", "l3", "l2_l1", "cpu_reg"].forEach(s => container.classList.remove(`is-active-${s}`));
  allBuses.forEach(id => {
    const el = container.querySelector(`#${id}`);
    if (el) el.classList.remove("is-flowing");
  });

  container.classList.add(`is-active-${state}`);

  (STATE_MAP[state] || []).forEach(id => {
    const el = container.querySelector(`#${id}`);
    if (el) el.classList.add("is-flowing");
  });
}
