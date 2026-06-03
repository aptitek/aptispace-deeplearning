// =====================================================================
// word-embeddings.js — 2-D word embedding space + ELMo layer weights
// =====================================================================
import { resolveCssValue } from "../core/core.js";
import { plotReact, plotBars } from "../core/plots.js";

// ── Pre-computed 2-D projections (illustrative PCA projection) ─────────
const WORDS = [
  { word: "roi",       x: 2.1,  y: 1.8,  group: "Royauté"    },
  { word: "reine",     x: 2.0,  y: 0.9,  group: "Royauté"    },
  { word: "prince",    x: 2.6,  y: 1.5,  group: "Royauté"    },
  { word: "homme",     x: 0.8,  y: 1.6,  group: "Genre"      },
  { word: "femme",     x: 0.7,  y: 0.7,  group: "Genre"      },
  { word: "chien",     x: -1.2, y: 1.4,  group: "Animaux"    },
  { word: "chat",      x: -1.5, y: 0.6,  group: "Animaux"    },
  { word: "loup",      x: -1.0, y: 2.0,  group: "Animaux"    },
  { word: "médecin",   x: -0.5, y: -1.5, group: "Profession" },
  { word: "avocat",    x: 0.2,  y: -1.8, group: "Profession" },
  { word: "ingénieur", x: -0.8, y: -1.2, group: "Profession" },
  { word: "IA",        x: 1.0,  y: -1.0, group: "Tech"       },
  { word: "réseau",    x: 1.4,  y: -0.6, group: "Tech"       },
  { word: "données",   x: 1.8,  y: -1.3, group: "Tech"       },
];

const GROUP_COLORS = {
  "Royauté":    "var(--sol-yellow)",
  "Genre":      "var(--sol-orange)",
  "Animaux":    "var(--sol-green)",
  "Profession": "var(--sol-blue)",
  "Tech":       "var(--sol-violet)",
};

const ANALOGIES = {
  "roi - homme + femme = reine": {
    from: "homme", to: "roi", result: "reine", via: "femme",
  },
  "médecin − homme + femme": {
    from: "homme", to: "médecin", result: "avocat", via: "femme",
  },
};

export const ANALOGY_OPTIONS = ["(aucune)", ...Object.keys(ANALOGIES)];

/**
 * @param {HTMLElement} chartEl
 * @param {string} analogyKey  key from ANALOGIES or ""
 */
export function updateEmbeddingViz(chartEl, analogyKey = "") {
  if (!chartEl) return;

  const groups = [...new Set(WORDS.map(w => w.group))];

  const traces = groups.map(g => {
    const pts = WORDS.filter(w => w.group === g);
    const col = resolveCssValue(GROUP_COLORS[g]);
    return {
      x: pts.map(p => p.x),
      y: pts.map(p => p.y),
      mode: "markers+text",
      type: "scatter",
      name: g,
      text: pts.map(p => p.word),
      textposition: "top center",
      textfont: { size: 11, color: col },
      marker: { size: 10, color: col, opacity: 0.85 },
    };
  });

  const shapes      = [];
  const annotations = [];

  if (analogyKey && ANALOGIES[analogyKey]) {
    const a  = ANALOGIES[analogyKey];
    const wF = WORDS.find(w => w.word === a.from);
    const wT = WORDS.find(w => w.word === a.to);
    const wR = WORDS.find(w => w.word === a.result);
    const wV = WORDS.find(w => w.word === a.via);
    const cM = resolveCssValue("var(--sol-magenta)");
    const cR = resolveCssValue("var(--sol-red)");

    if (wF && wT) shapes.push({ type: "line", x0: wF.x, y0: wF.y, x1: wT.x, y1: wT.y, line: { color: cM, width: 2, dash: "dot" } });
    if (wV && wR) shapes.push({ type: "line", x0: wV.x, y0: wV.y, x1: wR.x, y1: wR.y, line: { color: cR, width: 2.5, dash: "dot" } });
    if (wR) annotations.push({ x: wR.x, y: wR.y - 0.25, text: `≈ ${wR.word}`, showarrow: false, font: { color: cR, size: 12 }, xanchor: "center" });
    if (wT && wF) annotations.push({ x: (wT.x + wF.x) / 2, y: (wT.y + wF.y) / 2 + 0.15, text: `${wT.word} − ${wF.word}`, showarrow: false, font: { color: cM, size: 10 }, xanchor: "center" });
  }

  plotReact(chartEl, traces, {
    showlegend: true,
    height: 320,
    margin: { t: 20, b: 40, l: 40, r: 20 },
    xaxis: { title: { text: "Dim 1 (PC1)" }, zeroline: false },
    yaxis: { title: { text: "Dim 2 (PC2)" }, zeroline: false },
    legend: { x: 1, xanchor: "right", y: 1, bgcolor: "transparent", font: { size: 11 } },
    shapes,
    annotations,
  });
}


// ── ELMo layer weight visualization ────────────────────────────────────
const ELMO_TASK_WEIGHTS = {
  "NER (Entités Nommées)":    [0.55, 0.35, 0.10],
  "Analyse de Sentiment":     [0.10, 0.20, 0.70],
  "SRL (Rôles Sémantiques)":  [0.15, 0.65, 0.20],
  "Désambiguïsation (WSD)":   [0.05, 0.15, 0.80],
};

export const ELMO_TASK_OPTIONS = Object.keys(ELMO_TASK_WEIGHTS);

/**
 * @param {HTMLElement} chartEl
 * @param {string} task
 */
export function updateElmoViz(chartEl, task = "NER (Entités Nommées)") {
  if (!chartEl) return;

  const weights = ELMO_TASK_WEIGHTS[task] ?? ELMO_TASK_WEIGHTS["NER (Entités Nommées)"];
  const colors  = ["var(--sol-green)", "var(--sol-blue)", "var(--sol-orange)"];
  const layers  = ["Couche 0\n(Tokens)", "Couche 1\n(Syntaxe)", "Couche 2\n(Sémantique)"];

  plotBars(chartEl, layers.map((label, i) => ({
    label,
    value: weights[i],
    color: colors[i],
  })), {
    height: 240,
    margin: { t: 30, b: 60, l: 50, r: 20 },
    xaxis: { showgrid: false, tickfont: { size: 11 } },
    yaxis: { range: [0, 1], title: { text: "Poids s_j^task", font: { size: 11 } } },
    title: { text: `Poids par couche — ${task}`, font: { size: 12 }, x: 0.5 },
  });
}
