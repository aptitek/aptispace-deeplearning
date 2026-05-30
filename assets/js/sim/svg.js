// ==========================================
// sim/svg.js — Generic Interactive SVG Utilities
// ==========================================
// Usage (OJS):
//   import * as svg from "./assets/js/sim/svg.js"
//   svg.setup("#container", { "part-ssd": "SSD" }, (id, val) => {})
//   svg.bind("#container", ".my-tabset", { "part-ssd": "SSD" })

/**
 * Wires hover effects and click callbacks onto mapped SVG elements.
 * Relies on the `.dynamic-svg-interactive` CSS class in _svg.scss for all visual styling.
 *
 * @param {string}   selector - CSS selector for the SVG container.
 * @param {Object}   idMap    - { svgElementId: semanticValue }
 * @param {Function} onClick  - Callback: onClick(id, mappedValue)
 */
export function setup(selector, idMap, onClick) {
  const container = document.querySelector(selector);
  if (!container) return;

  Object.keys(idMap).forEach(id => {
    const el = container.querySelector(`#${id}`);
    if (!el) return;
    el.classList.add("dynamic-svg-interactive");
    el.onclick = (e) => {
      e.preventDefault();
      if (typeof onClick === "function") onClick(id, idMap[id]);
    };
  });
}

/**
 * Binds SVG element clicks to Quarto panel-tabset tab activation.
 *
 * @param {string} svgSelector    - CSS selector for the SVG container.
 * @param {string} tabsetSelector - CSS selector for the panel-tabset root.
 * @param {Object} idMap          - { svgElementId: tabPlainTextLabel }
 */
export function bind(svgSelector, tabsetSelector, idMap) {
  setup(svgSelector, idMap, (id, tabLabel) => {
    const links = document.querySelectorAll(`${tabsetSelector} .nav-link`);
    for (const link of links) {
      if (link.textContent.includes(tabLabel)) { link.click(); break; }
    }
  });
}
