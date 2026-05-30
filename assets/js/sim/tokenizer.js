// ==========================================
// sim/tokenizer.js — BPE-like Tokenizer & Token Stream Component
// ==========================================
// Usage (OJS):
//   import { tokenize, createStream } from "./assets/js/sim/tokenizer.js"
//   widget = createStream("#container", { text: "...", onTokenClick: (tok, idx) => {} })

import { theme } from "../core.js";

/**
 * Splits text into BPE-like token objects.
 *
 * @param {string} text - Raw input string.
 * @returns {Array<{ text, isFragment, hasSpace }>}
 */
export function tokenize(text) {
  if (!text || typeof text !== "string") return [];

  const regex = / ?[a-zA-ZÀ-ÿ0-9]+| ?[^\s\w\p{Emoji_Presentation}]+| ?\p{Emoji_Presentation}/gu;
  const matches = text.match(regex) || [];
  const tokens = [];

  matches.forEach(m => {
    const hasSpace  = m.startsWith(" ");
    const cleanText = hasSpace ? m.substring(1) : m;
    const lower     = cleanText.toLowerCase();

    if (lower === "anticonstitutionnellement") {
      tokens.push(
        { text: "anti",          isFragment: true,  hasSpace },
        { text: "constitution",  isFragment: true,  hasSpace: false },
        { text: "nelle",         isFragment: true,  hasSpace: false },
        { text: "ment",          isFragment: false, hasSpace: false }
      );
    } else if (cleanText.length > 9 && !/\s/.test(cleanText)) {
      const mid = Math.floor(cleanText.length / 2);
      tokens.push(
        { text: cleanText.substring(0, mid), isFragment: true,  hasSpace },
        { text: cleanText.substring(mid),    isFragment: false, hasSpace: false }
      );
    } else {
      tokens.push({ text: cleanText, isFragment: false, hasSpace });
    }
  });

  return tokens;
}

/**
 * Creates a token stream visualizer in the DOM.
 *
 * @param {string|Element} target  - Container element or CSS selector.
 * @param {Object}         options - { text, tokens, colors, showLabels, generateIds, spaceMarker, onTokenClick, onTokenHover, emptyMessage }
 * @returns {{ element, update(textOrTokens), destroy() }}
 */
export function createStream(target, options = {}) {
  let container = typeof target === "string" ? document.querySelector(target) : target;
  if (!container) {
    console.warn(`createStream: container not found for "${target}". Using detached div.`);
    container = document.createElement("div");
  }

  container.classList.add("org-token-stream");

  const spaceMarker = options.spaceMarker !== undefined ? options.spaceMarker : "Ġ";
  const showLabels  = options.showLabels !== false;
  const generateIds = options.generateIds !== false;
  const colors      = options.colors || [
    theme.colors.info, theme.colors.danger, theme.colors.success,
    theme.colors.warning, theme.colors.primary, theme.colors.debug
  ];

  let currentTokens = [];

  function _render(tokensToRender) {
    container.innerHTML = "";
    currentTokens = tokensToRender || [];

    if (currentTokens.length === 0) {
      container.classList.add("is-empty");
      const msg = document.createElement("div");
      msg.className   = "text-muted p-3 italic small";
      msg.textContent = options.emptyMessage || "Aucun texte à afficher...";
      container.appendChild(msg);
      return;
    }

    container.classList.remove("is-empty");

    currentTokens.forEach((tok, index) => {
      const textVal    = typeof tok === "object" ? tok.text : tok;
      const hasSpace   = typeof tok === "object" ? !!tok.hasSpace : false;
      const isFragment = typeof tok === "object" ? !!tok.isFragment : false;

      let color = colors[index % colors.length];
      if (typeof tok === "object" && tok.color) color = tok.color;

      let labelVal = "";
      if (showLabels) {
        labelVal = typeof tok === "object" && tok.label !== undefined
          ? tok.label
          : (generateIds
            ? (typeof tok === "object" && tok.id !== undefined
              ? tok.id
              : Math.floor(Math.abs(Math.sin(index + 1) * 90000) + 10000))
            : "");
      }

      const tooltip = typeof tok === "object" && tok.tooltip
        ? tok.tooltip
        : `Token: "${textVal}"\nIndex: ${index}\nFragment: ${isFragment ? 'Oui' : 'Non'}${labelVal ? `\nID: ${labelVal}` : ''}`;

      const tokenEl  = document.createElement("div");
      tokenEl.className = "mol-token";
      tokenEl.style.setProperty("--token-color", color);

      const node = document.createElement("div");
      node.className = `token-node ${isFragment ? "is-fragment" : ""}`;
      node.setAttribute("title", tooltip);

      if (hasSpace && spaceMarker) {
        const marker = document.createElement("span");
        marker.className   = "space-marker";
        marker.textContent = spaceMarker;
        node.appendChild(marker);
      }

      const textSpan       = document.createElement("span");
      textSpan.textContent = textVal;
      node.appendChild(textSpan);
      tokenEl.appendChild(node);

      if (showLabels && labelVal) {
        const labelEl       = document.createElement("div");
        labelEl.className   = "token-id";
        labelEl.textContent = labelVal;
        tokenEl.appendChild(labelEl);
      }

      node.addEventListener("click", (e) => {
        if (typeof options.onTokenClick === "function") {
          options.onTokenClick({ ...tok, text: textVal, index, color, label: labelVal }, index, e);
        }
        container.dispatchEvent(new CustomEvent("token-click", {
          detail: { token: tok, index, color, label: labelVal }
        }));
      });

      node.addEventListener("mouseenter", (e) => {
        if (typeof options.onTokenHover === "function") {
          options.onTokenHover({ ...tok, text: textVal, index, color, label: labelVal }, index, true, e);
        }
      });

      node.addEventListener("mouseleave", (e) => {
        if (typeof options.onTokenHover === "function") {
          options.onTokenHover({ ...tok, text: textVal, index, color, label: labelVal }, index, false, e);
        }
      });

      container.appendChild(tokenEl);
    });
  }

  _render(options.tokens || (options.text ? tokenize(options.text) : []));

  const controller = {
    element: container,
    update: (newInput) => {
      _render(typeof newInput === "string" ? tokenize(newInput) : newInput);
      return controller;
    },
    destroy: () => {
      container.innerHTML = "";
      container.classList.remove("org-token-stream", "is-empty");
    }
  };

  return controller;
}
