import { createBpeDemoPanel } from "../components/token-stream.js";

const BPE_SPLITS = {
  anticonstitutionnellement: ["anti", "constitution", "nelle", "ment"],
  apprentissage: ["apprent", "issage"],
  profond: ["pro", "fond"],
  comprend: ["comp", "rend"],
  transformer: ["transform", "er"],
  attention: ["attent", "ion"]
};

export function tokenizeBpeDemoText(text = "") {
  if (text.trim() === "") return { tokens: [], chars: 0, count: 0 };

  const base = text.match(/ ?[a-zA-ZÀ-ÿ-ɏ0-9]+| ?[^\s\w]+/gu) || [];
  const tokens = [];

  base.forEach(rawToken => {
    const hasSpace = rawToken.startsWith(" ");
    const clean = hasSpace ? rawToken.slice(1) : rawToken;
    const lower = clean.toLowerCase();
    const split = BPE_SPLITS[lower];

    if (split) {
      split.forEach((fragment, index) => {
        tokens.push({ text: fragment, fragment: true, space: index === 0 && hasSpace });
      });
      return;
    }

    if (clean.length > 10) {
      const middle = Math.floor(clean.length / 2);
      tokens.push({ text: clean.slice(0, middle), fragment: true, space: hasSpace });
      tokens.push({ text: clean.slice(middle), fragment: false, space: false });
      return;
    }

    tokens.push({ text: clean, fragment: false, space: hasSpace });
  });

  return { tokens, chars: text.length, count: tokens.length };
}

export function createTokenizerDemoPanel(text = "") {
  return createBpeDemoPanel(tokenizeBpeDemoText(text));
}
