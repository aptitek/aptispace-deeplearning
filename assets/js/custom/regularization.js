// =====================================================================
// regularization.js — Regularization simulation using Plotly
// =====================================================================
import { resolveCssValue, getPlotlyTheme } from "../core.js";

// Spécification de nos 5 variables
const variables = [
  { id: "taille", name: "Taille (m²)", w0: 8.0, color: "var(--sol-cyan)", desc: "Variable majeure très prédictive." },
  { id: "chambres", name: "Chambres", w0: 5.0, color: "var(--sol-green)", desc: "Variable importante modérée." },
  { id: "garage", name: "Garage", w0: 3.5, color: "var(--sol-yellow)", desc: "Corrélée à Taille (Redondance)." },
  { id: "age", name: "Âge", w0: -4.0, color: "var(--sol-red)", desc: "Impact négatif sur le prix." },
  { id: "bruit", name: "Bruit dB (Bruit)", w0: 1.5, color: "var(--sol-magenta)", desc: "Bruit aléatoire sans intérêt." }
];

export function calculateCoefficients(type, lambda) {
  const x = lambda / 100; // Normalisé [0, 1]

  return variables.map(v => {
    let w = v.w0;
    if (type === "ridge") {
      w = v.w0 / (1 + x * 9);
    } else if (type === "lasso") {
      const thresholds = {
        bruit: 0.12,
        garage: 0.28,
        age: 0.48,
        chambres: 0.72,
        taille: 0.98
      };
      const th = thresholds[v.id];
      if (x >= th) {
        w = 0;
      } else {
        w = v.w0 * (1 - x / th);
      }
    } else {
      const thresholds = {
        bruit: 0.20,
        garage: 0.45,
        age: 0.68,
        chambres: 0.85,
        taille: 0.99
      };
      const th = thresholds[v.id];
      if (x >= th) {
        w = 0;
      } else {
        w = (v.w0 * (1 - x / th)) / (1 + x * 2.5);
      }
    }
    return {
      ...v,
      w: parseFloat(w.toFixed(2))
    };
  });
}

export function updateRegularization(type, lambda, containers = {}) {
  const { svgEl, varsEl, detailsEl } = containers;
  if (!svgEl || !varsEl || !detailsEl) return;

  const currentCoeffs = calculateCoefficients(type, lambda);

  // 1. Plotly-based Chart rendering
  renderChart(svgEl, type, lambda, currentCoeffs);

  // 2. Variables Sidebar list rendering
  renderVars(varsEl, currentCoeffs);

  // 3. Explainer text rendering
  renderDetails(detailsEl, type, lambda);
}

function renderChart(svgEl, type, lambda, currentCoeffs) {
  // Remove any old static SVG if present
  const oldSvg = svgEl.querySelector("svg");
  if (oldSvg) {
    oldSvg.remove();
  }

  // Set up traces for the regularization paths (0 to 100 lambda)
  const lineTraces = variables.map(v => {
    const pathX = [];
    const pathY = [];
    for (let l = 0; l <= 100; l += 5) {
      const coeffs = calculateCoefficients(type, l);
      const val = coeffs.find(tc => tc.id === v.id).w;
      pathX.push(l);
      pathY.push(val);
    }
    return {
      x: pathX,
      y: pathY,
      mode: 'lines',
      type: 'scatter',
      name: v.name,
      line: {
        color: resolveCssValue(v.color),
        width: 2.5
      },
      hoverinfo: 'skip'
    };
  });

  // Trace for the current value dots
  const dotsTrace = {
    x: currentCoeffs.map(() => lambda),
    y: currentCoeffs.map(c => c.w),
    mode: 'markers',
    type: 'scatter',
    name: 'Actuel',
    marker: {
      color: currentCoeffs.map(c => resolveCssValue(c.color)),
      size: 9,
      line: {
        color: '#ffffff',
        width: 1
      }
    },
    hoverinfo: 'text',
    text: currentCoeffs.map(c => `${c.name}: ${c.w > 0 ? '+' : ''}${c.w.toFixed(2)}`)
  };

  const themeLayout = getPlotlyTheme().layout;

  const layout = {
    ...themeLayout,
    showlegend: false,
    margin: { t: 15, r: 15, b: 35, l: 35 },
    xaxis: {
      ...themeLayout.xaxis,
      range: [0, 100],
      gridcolor: 'rgba(88, 110, 117, 0.15)',
      zerolinecolor: 'var(--sol-base01, #586e75)'
    },
    yaxis: {
      ...themeLayout.yaxis,
      range: [-5, 9],
      gridcolor: 'rgba(88, 110, 117, 0.15)',
      zerolinecolor: 'var(--sol-base01, #586e75)'
    },
    shapes: [{
      type: 'line',
      x0: lambda,
      y0: -5,
      x1: lambda,
      y1: 9,
      line: {
        color: resolveCssValue('var(--sol-magenta, #d33682)'),
        width: 1.5,
        dash: 'dash'
      }
    }]
  };

  const config = {
    responsive: true,
    displayModeBar: false
  };

  if (typeof Plotly !== 'undefined') {
    Plotly.react(svgEl, [...lineTraces, dotsTrace], layout, config);
  }
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

function renderDetails(detailsEl, type, lambda) {
  let textExplain = "";
  if (type === "lasso") {
    if (lambda === 0) {
      textExplain = `
        <div style="font-weight:bold; color:var(--sol-cyan); margin-bottom:6px;">🟡 Lasso (λ = 0) : Régression standard (Moindres Carrés)</div>
        <div>Sans aucune pénalité, le modèle garde toutes les variables, y compris la variable de <b>bruit purement aléatoire</b> avec un coefficient de +1.5. C'est la zone propice au <strong>surapprentissage (overfitting)</strong>.</div>
      `;
      detailsEl.style.borderLeftColor = "var(--sol-cyan)";
    } else if (lambda > 0 && lambda < 35) {
      textExplain = `
        <div style="font-weight:bold; color:var(--sol-green); margin-bottom:6px;">🏆 Lasso (λ = ${lambda}) : Sélection intelligente active !</div>
        <div>La pénalité L1 a immédiatement **annulé** la variable de <i>Bruit</i> (w = 0) ! Elle a également fortement réduit le coefficient de la variable <i>Garage</i> (qui fait doublon avec la <i>Taille</i>). Le modèle se concentre sur les variables réellement importantes.</div>
      `;
      detailsEl.style.borderLeftColor = "var(--sol-green)";
    } else if (lambda >= 35 && lambda < 75) {
      textExplain = `
        <div style="font-weight:bold; color:var(--sol-yellow); margin-bottom:6px;">🟡 Lasso (λ = ${lambda}) : Sélection sévère</div>
        <div>La pénalité élimine maintenant l'<i>Âge</i> et le <i>Garage</i>. Seules les variables fondamentales <i>Taille</i> et <i>Chambres</i> survivent dans l'équation. C'est idéal pour obtenir un modèle **très parcimonieux** et simple.</div>
      `;
      detailsEl.style.borderLeftColor = "var(--sol-yellow)";
    } else {
      textExplain = `
        <div style="font-weight:bold; color:var(--sol-red); margin-bottom:6px;">⚠️ Lasso (λ = ${lambda}) : Sous-apprentissage (Underfitting)</div>
        <div>La pénalité L1 est trop agressive. Elle a tué quasiment tous les coefficients. Même la <i>Taille</i> (variable majeure) s'approche de zéro. Le modèle a perdu sa capacité prédictive.</div>
      `;
      detailsEl.style.borderLeftColor = "var(--sol-red)";
    }
  } else if (type === "ridge") {
    if (lambda === 0) {
      textExplain = `
        <div style="font-weight:bold; color:var(--sol-cyan); margin-bottom:6px;">🟡 Ridge (λ = 0) : Aucune régularisation</div>
        <div>Le modèle conserve tous les coefficients au maximum. La colinéarité entre <i>Taille</i> et <i>Garage</i> n'est pas traitée, ce qui gonfle artificiellement la variance du modèle.</div>
      `;
      detailsEl.style.borderLeftColor = "var(--sol-cyan)";
    } else {
      textExplain = `
        <div style="font-weight:bold; color:var(--sol-green); margin-bottom:6px;">🏆 Ridge (λ = ${lambda}) : Réduction de la variance (L2)</div>
        <div>Observez la différence avec Lasso ! La pénalité Ridge **ne réduit jamais aucun coefficient à exactement zéro** (toutes les variables restent actives). Elle courbe et atténue les poids de manière progressive pour stabiliser le modèle face au bruit, ce qui est parfait pour gérer la <b>colinéarité (les variables corrélées)</b> sans jeter d'information.</div>
      `;
      detailsEl.style.borderLeftColor = "var(--sol-green)";
    }
  } else {
    textExplain = `
      <div style="font-weight:bold; color:var(--sol-magenta); margin-bottom:6px;">🏆 ElasticNet (λ = ${lambda}) : Le Compromis L1 + L2</div>
      <div>ElasticNet mélange le meilleur des deux mondes : il **élimine** complètement les variables de bruit (comme Lasso) tout en conservant les variables corrélées ensemble avec des coefficients stables (effet de groupe Ridge), évitant le choix aléatoire d'une variable par rapport à une autre.</div>
    `;
    detailsEl.style.borderLeftColor = "var(--sol-magenta)";
  }

  detailsEl.innerHTML = textExplain;
}
