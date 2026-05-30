// ==========================================
// sim/memory.js — RAM Encoding & Byte Renderer
// ==========================================
// Usage (OJS):
//   import * as memory from "./assets/js/sim/memory.js"
//   ramData = memory.encode(rawInput, dataType)
//   memory.render(ramData)

import { renderList } from "../core.js";

/**
 * Encodes a raw input value into hex/binary byte representations for a given type,
 * then pads to fit a dual-stick DIMM layout (4 bytes per stick, 2 sticks max).
 *
 * @param {string} val  - Raw string input from the user interface.
 * @param {string} type - Data type: 'bool' | 'int8' | 'int32' | 'float64' | 'string'
 * @returns {{ stick1: Array, stick2: Array, needsStick2: boolean }}
 */
export function encode(val, type) {
  let bytes = [];

  try {
    if (type === "bool") {
      const isTrue = val.toLowerCase() === "true" || val === "1" || val.toLowerCase() === "vrai";
      bytes.push({ index: 0, hex: isTrue ? "01" : "00", binary: isTrue ? "00000001" : "00000000", inactiveClass: "" });

    } else if (type === "int8") {
      const b = (parseInt(val) || 0) & 0xFF;
      bytes.push({ index: 0, hex: b.toString(16).padStart(2, '0').toUpperCase(), binary: b.toString(2).padStart(8, '0'), inactiveClass: "" });

    } else if (type === "int32") {
      const num = parseInt(val) || 0;
      for (let i = 0; i < 4; i++) {
        const b = (num >> (24 - i * 8)) & 0xFF;
        bytes.push({ index: i, hex: b.toString(16).padStart(2, '0').toUpperCase(), binary: b.toString(2).padStart(8, '0'), inactiveClass: "" });
      }

    } else if (type === "float64") {
      const arr  = new Float64Array([parseFloat(val) || 0]);
      const view = new DataView(arr.buffer);
      for (let i = 0; i < 8; i++) {
        const b = view.getUint8(i);
        bytes.push({ index: i, hex: b.toString(16).padStart(2, '0').toUpperCase(), binary: b.toString(2).padStart(8, '0'), inactiveClass: "" });
      }

    } else if (type === "string") {
      const str = val.substring(0, 8);
      for (let i = 0; i < str.length; i++) {
        const b = str.charCodeAt(i);
        bytes.push({ index: i, hex: b.toString(16).padStart(2, '0').toUpperCase(), binary: b.toString(2).padStart(8, '0'), inactiveClass: "" });
      }
    }
  } catch {
    bytes = [{ index: "?", hex: "??", binary: "Erreur", inactiveClass: "" }];
  }

  const fill = (from, count) =>
    Array.from({ length: count }, (_, i) => i < bytes.length - from
      ? bytes[from + i]
      : { index: from + i, hex: "--", binary: "00000000", inactiveClass: "inactive" });

  return {
    stick1:      fill(0, 4),
    stick2:      fill(4, 4),
    needsStick2: bytes.length > 4
  };
}

/**
 * Renders encoded byte data into the DIMM stick DOM elements and toggles stick 2 visibility.
 *
 * @param {{ stick1: Array, stick2: Array, needsStick2: boolean }} data
 */
export function render(data) {
  if (!data) return;
  renderList("#ram-bytes-container-1", ".ram-byte-template", data.stick1);
  renderList("#ram-bytes-container-2", ".ram-byte-template", data.stick2);

  const stick2 = document.querySelector("#ram-stick-2");
  if (stick2) stick2.classList.toggle("d-none", !data.needsStick2);
}
