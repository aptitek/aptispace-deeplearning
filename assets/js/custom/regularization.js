// =====================================================================
// regularization.js — Regularization simulation using Plotly
// =====================================================================
import { resolveCssValue, parseTableData, renderTemplate } from "../core.js";
import { createMultiLine } from "../plots.js";

let _variables = null;

export function loadVariables(selector = "#reg-variables table") {
  const rows = parseTableData(selector);
  _variables = rows.map(r => ({
    id: r.id,
    name: r.name,
    w0: parseFloat(r.w0),
    color: r.color,
    desc: r.desc,
    lassoThreshold: parseFloat(r.lassoThreshold),
    elasticThreshold: parseFloat(r.elasticThreshold)
  }));
  return _variables;
}

function getVariables() {
  return _variables ?? loadVariables();
}

export function calculateCoefficients(type, lambda) {
  const variables = getVariables();
  const x = Number.isFinite(Number(lambda)) ? Number(lambda) / 100 : 0;

  return variables.map(v => {
    let w = v.w0;
    if (type === "ridge") {
      w = v.w0 / (1 + x * 9);
    } else if (type === "lasso") {
      w = x >= v.lassoThreshold ? 0 : v.w0 * (1 - x / v.lassoThreshold);
    } else {
      w = x >= v.elasticThreshold ? 0 : (v.w0 * (1 - x / v.elasticThreshold)) / (1 + x * 2.5);
    }
    return { ...v, w: parseFloat(w.toFixed(2)) };
  });
}

export function updateRegularization(type, lambda, containers = {}) {
  const { svgEl, varsEl, detailsEl } = containers;
  if (!svgEl || !varsEl || !detailsEl) return;

  const safeType = typeof type === "string" ? type : "lasso";
  const safeLambda = Number.isFinite(Number(lambda)) ? Number(lambda) : 0;
  const currentCoeffs = calculateCoefficients(safeType, safeLambda);

  renderChart(svgEl, safeType, safeLambda, currentCoeffs);
  renderVars(varsEl, currentCoeffs);
  renderDetails(detailsEl, safeType, safeLambda);
}

export function renderChart(svgEl, type, lambda, currentCoeffs) {
  const variables = getVariables();

  const lineTraces = variables.map(v => {
    const xs = [], ys = [];
    for (let l = 0; l <= 100; l += 5) {
      const coeffs = calculateCoefficients(type, l);
      xs.push(l);
      ys.push(coeffs.find(c => c.id === v.id).w);
    }
    return {
      x: xs, y: ys,
      mode: 'lines', type: 'scatter', name: v.name,
      line: { color: resolveCssValue(v.color), width: 2.5 },
      hoverinfo: 'skip'
    };
  });

  const dotsTrace = {
    x: currentCoeffs.map(() => lambda),
    y: currentCoeffs.map(c => c.w),
    mode: 'markers', type: 'scatter', name: 'Actuel',
    marker: {
      color: currentCoeffs.map(c => resolveCssValue(c.color)),
      size: 9,
      line: { color: '#ffffff', width: 1 }
    },
    hoverinfo: 'text',
    text: currentCoeffs.map(c => `${c.name}: ${c.w > 0 ? '+' : ''}${c.w.toFixed(2)}`)
  };

  createMultiLine(svgEl, [...lineTraces, dotsTrace], {
    xaxis: { range: [0, 100] },
    yaxis: { range: [-5, 9] },
    shapes: [{
      type: 'line',
      x0: lambda, y0: -5, x1: lambda, y1: 9,
      line: { color: resolveCssValue('var(--sol-magenta, #d33682)'), width: 1.5, dash: 'dash' }
    }]
  });
}

function renderVars(varsEl, currentCoeffs) {
  varsEl.innerHTML = "";

  currentCoeffs.forEach(c => {
    const isActive = Math.abs(c.w) > 0.01;
    const pct = Math.min(100, Math.max(0, (Math.abs(c.w) / 10) * 100));

    const item = document.createElement("div");
    item.className = "list-group-item d-flex justify-content-between align-items-center py-2 px-3 border-0 border-bottom";
    item.style.backgroundColor = "transparent";

    const labelCol = document.createElement("div");
    labelCol.className = "d-flex flex-column";

    const nameSpan = document.createElement("span");
    nameSpan.className = "fw-bold";
    nameSpan.style.color = resolveCssValue(c.color);
    nameSpan.textContent = c.name;

    const descSpan = document.createElement("span");
    descSpan.className = "text-muted small";
    descSpan.textContent = c.desc;

    labelCol.append(nameSpan, descSpan);

    const valueCol = document.createElement("div");
    valueCol.className = "d-flex align-items-center gap-3";

    const valueSpan = document.createElement("span");
    valueSpan.className = "font-monospace fw-bold";
    valueSpan.textContent = `${c.w >= 0 ? "+" : ""}${c.w.toFixed(2)}`;

    const progressContainer = document.createElement("div");
    progressContainer.style.cssText = `
      background: var(--sol-base03);
      border: 1px solid var(--sol-base01);
      height: 8px;
      width: 60px;
      border-radius: 3px;
      overflow: hidden;
      display: flex;
      ${c.w < 0 ? "justify-content: flex-end;" : "justify-content: flex-start;"}
    `;

    const bar = document.createElement("div");
    bar.style.cssText = `
      height: 100%;
      width: ${pct}%;
      background-color: ${c.w < 0 ? "var(--sol-red)" : "var(--sol-cyan)"};
    `;
    progressContainer.appendChild(bar);

    const badge = document.createElement("span");
    badge.className = isActive
      ? "badge bg-success-subtle text-success border border-success-subtle"
      : "badge bg-danger-subtle text-danger border border-danger-subtle";
    badge.textContent = isActive ? "Actif" : "Éliminé";

    valueCol.append(valueSpan, progressContainer, badge);
    item.append(labelCol, valueCol);
    varsEl.appendChild(item);
  });
}

// Details config: data separated from DOM construction.
// title may be a string or a function of lambda.
const _details = {
  lasso: [
    { when: l => l === 0,
      color: "var(--sol-cyan)",
      title: "🟡 Lasso (λ = 0) : Régression standard (Moindres Carrés)",
      body: "Sans aucune pénalité, le modèle garde toutes les variables, y compris la variable de <b>bruit purement aléatoire</b> avec un coefficient de +1.5. C'est la zone propice au <strong>surapprentissage (overfitting)</strong>."
    },
    { when: l => l < 35,
      color: "var(--sol-green)",
      title: l => `🏆 Lasso (λ = ${l}) : Sélection intelligente active !`,
      body: "La pénalité L1 a immédiatement annulé la variable de <i>Bruit</i> (w = 0) ! Elle a également fortement réduit le coefficient de la variable <i>Garage</i> (qui fait doublon avec la <i>Taille</i>). Le modèle se concentre sur les variables réellement importantes."
    },
    { when: l => l < 75,
      color: "var(--sol-yellow)",
      title: l => `🟡 Lasso (λ = ${l}) : Sélection sévère`,
      body: "La pénalité élimine maintenant l'<i>Âge</i> et le <i>Garage</i>. Seules les variables fondamentales <i>Taille</i> et <i>Chambres</i> survivent dans l'équation. C'est idéal pour obtenir un modèle <strong>très parcimonieux</strong> et simple."
    },
    { when: () => true,
      color: "var(--sol-red)",
      title: l => `⚠️ Lasso (λ = ${l}) : Sous-apprentissage (Underfitting)`,
      body: "La pénalité L1 est trop agressive. Elle a tué quasiment tous les coefficients. Même la <i>Taille</i> (variable majeure) s'approche de zéro. Le modèle a perdu sa capacité prédictive."
    }
  ],
  ridge: [
    { when: l => l === 0,
      color: "var(--sol-cyan)",
      title: "🟡 Ridge (λ = 0) : Aucune régularisation",
      body: "Le modèle conserve tous les coefficients au maximum. La colinéarité entre <i>Taille</i> et <i>Garage</i> n'est pas traitée, ce qui gonfle artificiellement la variance du modèle."
    },
    { when: () => true,
      color: "var(--sol-green)",
      title: l => `🏆 Ridge (λ = ${l}) : Réduction de la variance (L2)`,
      body: "Observez la différence avec Lasso ! La pénalité Ridge <strong>ne réduit jamais aucun coefficient à exactement zéro</strong> (toutes les variables restent actives). Elle courbe et atténue les poids de manière progressive pour stabiliser le modèle face au bruit, ce qui est parfait pour gérer la <b>colinéarité (les variables corrélées)</b> sans jeter d'information."
    }
  ],
  elastic: [
    { when: () => true,
      color: "var(--sol-magenta)",
      title: l => `🏆 ElasticNet (λ = ${l}) : Le Compromis L1 + L2`,
      body: "ElasticNet mélange le meilleur des deux mondes : il <strong>élimine</strong> complètement les variables de bruit (comme Lasso) tout en conservant les variables corrélées ensemble avec des coefficients stables (effet de groupe Ridge), évitant le choix aléatoire d'une variable par rapport à une autre."
    }
  ]
};

function renderDetails(detailsEl, type, lambda) {
  const rules = _details[type] ?? _details.elastic;
  const cfg = rules.find(r => r.when(lambda));
  if (!cfg) return;

  const titleColor = resolveCssValue(cfg.color);
  detailsEl.style.borderLeftColor = titleColor;

  renderTemplate(detailsEl, {
    title: typeof cfg.title === "function" ? cfg.title(lambda) : cfg.title,
    titleColor,
    body: cfg.body
  });
}
