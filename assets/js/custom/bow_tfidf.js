// =====================================================================
// bow_tfidf.js — BoW vs TF-IDF horizontal bar chart
// =====================================================================
import { plotBars } from "../plots.js";

// ── Sample corpus ──────────────────────────────────────────────────────
const CORPUS = [
  {
    id: "doc1",
    label: "Doc 1 : NLP",
    text: "le réseau apprend les représentations texte pour comprendre le texte naturel",
  },
  {
    id: "doc2",
    label: "Doc 2 : Vision",
    text: "le réseau convolutif apprend les caractéristiques image pour reconnaître les images",
  },
  {
    id: "doc3",
    label: "Doc 3 : Général",
    text: "le modèle apprend les données pour faire des prédictions sur les données",
  },
];

function tokenize(text) {
  return text.toLowerCase().replace(/[^a-zàâäéèêëîïôùûü\s]/g, "").split(/\s+/).filter(Boolean);
}

function buildVocab(corpus) {
  const vocab = new Set();
  corpus.forEach(doc => tokenize(doc.text).forEach(w => vocab.add(w)));
  return [...vocab].sort();
}

function termFreq(tokens, vocab) {
  const count = {};
  tokens.forEach(w => { count[w] = (count[w] || 0) + 1; });
  return vocab.map(w => (count[w] || 0) / tokens.length);
}

function idf(corpus, vocab) {
  const N = corpus.length;
  return vocab.map(w => {
    const df = corpus.filter(doc => tokenize(doc.text).includes(w)).length;
    return Math.log((N + 1) / (df + 1)) + 1;
  });
}

/**
 * @param {HTMLElement} chartEl
 * @param {{ docIndex, mode }} params  mode: "bow" | "tfidf"
 */
export function updateBowTfIdfViz(chartEl, { docIndex = 0, mode = "bow" } = {}) {
  if (!chartEl) return;

  const vocab  = buildVocab(CORPUS);
  const idfVec = idf(CORPUS, vocab);
  const doc    = CORPUS[Math.min(docIndex, CORPUS.length - 1)];
  const tokens = tokenize(doc.text);
  const tfVec  = termFreq(tokens, vocab);

  const scores = mode === "tfidf"
    ? tfVec.map((tf, i) => +(tf * idfVec[i]).toFixed(4))
    : vocab.map(w => tokens.filter(t => t === w).length);

  const indexed = vocab
    .map((w, i) => ({ label: w, value: scores[i], color: mode === "tfidf" ? "var(--sol-green)" : "var(--sol-blue)" }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 12);

  plotBars(chartEl, {
    x: indexed.map(d => d.value),
    y: indexed.map(d => d.label),
    orientation: "h",
    color: mode === "tfidf" ? "var(--sol-green)" : "var(--sol-blue)",
    hovertemplate: "%{y}: %{x:.4f}<extra></extra>",
  }, {
    height: 280,
    margin: { t: 15, b: 50, l: 100, r: 20 },
    xaxis: { title: { text: mode === "tfidf" ? "Score TF-IDF" : "Fréquence (comptage)", font: { size: 11 } } },
    yaxis: { autorange: "reversed", showgrid: false },
    annotations: [{
      text: doc.label,
      x: 0.99, y: 1.05,
      xref: "paper", yref: "paper",
      xanchor: "right",
      showarrow: false,
      font: { size: 11, color: mode === "tfidf" ? "var(--sol-green)" : "var(--sol-blue)" },
    }],
  });
}

export const CORPUS_LABELS = CORPUS.map(d => d.label);
