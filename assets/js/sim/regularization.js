// ==========================================
// sim/regularization.js — Regularization Simulator Logic
// ==========================================
// Re-written from scratch to adhere strictly to the project architecture,
// code guidelines, and atomic design rules (SRP, DRY, no inline styles).

const variables = [
  { id: "taille", name: "Taille (m²)", w0: 8.0, desc: "Variable majeure très prédictive." },
  { id: "chambres", name: "Chambres", w0: 5.0, desc: "Variable importante modérée." },
  { id: "garage", name: "Garage", w0: 3.5, desc: "Corrélée à Taille (Redondance)." },
  { id: "age", name: "Âge", w0: -4.0, desc: "Impact négatif sur le prix." },
  { id: "bruit", name: "Bruit dB (Bruit)", w0: 1.5, desc: "Bruit aléatoire sans intérêt." }
];

/**
 * Calculates regularization path coefficients dynamically.
 *
 * @param {string} type   - Regularization type: 'lasso' | 'ridge' | 'elastic'
 * @param {number} lambda - Regularization penalty intensity (0 to 100)
 * @returns {Array} List of variables with calculated current weights
 */
export function calculateCoefficients(type, lambda) {
  const x = lambda / 100; // Normalized lambda in [0, 1]

  return variables.map(v => {
    let w = v.w0;

    if (type === "ridge") {
      // Ridge (L2) : smooth compression w = w0 / (1 + x * 9)
      w = v.w0 / (1 + x * 9);
    } else if (type === "lasso") {
      // Lasso (L1) : soft-thresholding
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
      // ElasticNet (L1 + L2 hybride)
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

/**
 * Updates the regularization paths simulator DOM components.
 *
 * @param {string} type      - Current regularization type
 * @param {number} lambda    - Current lambda intensity
 * @param {Object} selectors - DOM selectors for the simulator components
 */
export function updateRegularization(type, lambda, selectors = {}) {
  const {
    svgSelector = "#reg-svg",
    varsSelector = "#reg-vars",
    detailsSelector = "#reg-details",
    detailsCardSelector = "#reg-details-card",
    lambdaLabelSelector = "#reg-lambda-label"
  } = selectors;

  const svg = document.querySelector(svgSelector);
  const varsList = document.querySelector(varsSelector);
  const details = document.querySelector(detailsSelector);
  const detailsCard = document.querySelector(detailsCardSelector);
  const lambdaLabel = document.querySelector(lambdaLabelSelector);

  if (!svg || !varsList || !details || !detailsCard || !lambdaLabel) return;

  // 0. Update the lambda intensity value label
  lambdaLabel.textContent = lambda;

  // 1. Render SVG content
  let svgContent = `
    <!-- Axis lines -->
    <line x1="40" y1="110" x2="420" y2="110" class="reg-axis-center" />
    <text x="35" y="113" class="reg-axis-text" text-anchor="end">W = 0</text>
    <line x1="40" y1="10" x2="40" y2="200" class="reg-axis" />
    <text x="40" y="212" class="reg-axis-text" text-anchor="middle">λ = 0</text>
    <text x="420" y="212" class="reg-axis-text" text-anchor="middle">λ = Max</text>
  `;

  // Draw full regularization paths (dashed lines)
  variables.forEach(v => {
    let pointsStr = "";
    for (let l = 0; l <= 100; l += 5) {
      const tempCoeffs = calculateCoefficients(type, l);
      const coeffVal = tempCoeffs.find(tc => tc.id === v.id).w;

      // Coordinate projections: X from 40 to 420, Y from 10 to 200 (W from -10 to +10)
      const px = 40 + (l / 100) * 380;
      const py = 110 - (coeffVal / 10) * 100;
      pointsStr += `${px},${py} `;
    }
    svgContent += `<polyline points="${pointsStr}" class="reg-path path-${v.id}" />`;
  });

  // Draw current lambda vertical line
  const currentLambdaX = 40 + (lambda / 100) * 380;
  svgContent += `<line x1="${currentLambdaX}" y1="10" x2="${currentLambdaX}" y2="200" class="reg-current-line" />`;

  // Draw intersection indicator circles
  const currentCoeffs = calculateCoefficients(type, lambda);
  currentCoeffs.forEach(c => {
    const px = currentLambdaX;
    const py = 110 - (c.w / 10) * 100;
    svgContent += `<circle cx="${px}" cy="${py}" r="4" class="reg-dot dot-${c.id}" />`;
  });

  svg.innerHTML = svgContent;

  // 2. Render variables list
  let listHtml = "";
  currentCoeffs.forEach(c => {
    const isActive = Math.abs(c.w) > 0.01;
    const activeBadge = isActive
      ? `<span class="badge bg-success-subtle text-success border border-success-subtle">Actif</span>`
      : `<span class="badge bg-danger-subtle text-danger border border-danger-subtle">Éliminé</span>`;

    const pct = Math.min(100, Math.max(0, (Math.abs(c.w) / 10) * 100));
    const isNegative = c.w < 0;
    const alignClass = isNegative ? "justify-content-end" : "justify-content-start";
    const bgClass = isNegative ? "bg-danger" : "bg-primary";

    listHtml += `
      <div class="list-group-item d-flex justify-content-between align-items-center py-2 px-3 border-0 border-bottom">
        <div class="d-flex flex-column">
          <span class="fw-bold var-color-${c.id}">${c.name}</span>
          <span class="text-muted small">${c.desc}</span>
        </div>
        <div class="d-flex align-items-center gap-3">
          <span class="font-monospace fw-bold">${c.w > 0 ? "+" : ""}${c.w.toFixed(2)}</span>
          <div class="mag-progress-container ${alignClass}">
            <div class="mag-progress-bar ${bgClass}" style="width: ${pct}%;"></div>
          </div>
          ${activeBadge}
        </div>
      </div>
    `;
  });
  varsList.innerHTML = listHtml;

  // 3. Update pedagogical explainer
  let textExplain = "";
  let borderClass = "";

  if (type === "lasso") {
    if (lambda === 0) {
      textExplain = `
        <div class="fw-bold text-info mb-1">🟡 Lasso (λ = 0) : Régression standard (Moindres Carrés)</div>
        <div>Sans aucune pénalité, le modèle garde toutes les variables, y compris la variable de <b>bruit purement aléatoire</b> avec un coefficient de +1.5. C'est la zone propice au <strong>surapprentissage (overfitting)</strong>.</div>
      `;
      borderClass = "border-info";
    } else if (lambda > 0 && lambda < 35) {
      textExplain = `
        <div class="fw-bold text-success mb-1">🏆 Lasso (λ = ${lambda}) : Sélection intelligente active !</div>
        <div>La pénalité L1 a immédiatement <b>annulé</b> la variable de <i>Bruit</i> (w = 0) ! Elle a également fortement réduit le coefficient de la variable <i>Garage</i> (qui fait doublon avec la <i>Taille</i>). Le modèle se concentre sur les variables réellement importantes.</div>
      `;
      borderClass = "border-success";
    } else if (lambda >= 35 && lambda < 75) {
      textExplain = `
        <div class="fw-bold text-warning mb-1">🟡 Lasso (λ = ${lambda}) : Sélection sévère</div>
        <div>La pénalité élimine maintenant l'<i>Âge</i> et le <i>Garage</i>. Seules les variables fondamentales <i>Taille</i> et <i>Chambres</i> survivent dans l'équation. C'est idéal pour obtenir un modèle <b>très parcimonieux</b> et simple.</div>
      `;
      borderClass = "border-warning";
    } else {
      textExplain = `
        <div class="fw-bold text-danger mb-1">⚠️ Lasso (λ = ${lambda}) : Sous-apprentissage (Underfitting)</div>
        <div>La pénalité L1 est trop agressive. Elle a tué quasiment tous les coefficients. Même la <i>Taille</i> (variable majeure) s'approche de zéro. Le modèle a perdu sa capacité prédictive.</div>
      `;
      borderClass = "border-danger";
    }
  } else if (type === "ridge") {
    if (lambda === 0) {
      textExplain = `
        <div class="fw-bold text-info mb-1">🟡 Ridge (λ = 0) : Aucune régularisation</div>
        <div>Le modèle conserve tous les coefficients au maximum. La colinéarité entre <i>Taille</i> et <i>Garage</i> n'est pas traitée, ce qui gonfle artificiellement la variance du modèle.</div>
      `;
      borderClass = "border-info";
    } else {
      textExplain = `
        <div class="fw-bold text-success mb-1">🏆 Ridge (λ = ${lambda}) : Réduction de la variance (L2)</div>
        <div>Observez la différence avec Lasso ! La pénalité Ridge <b>ne réduit jamais aucun coefficient à exactement zéro</b> (toutes les variables restent actives). Elle courbe et atténue les poids de manière progressive pour stabiliser le modèle face au bruit, ce qui est parfait pour gérer la <b>colinéarité (les variables corrélées)</b> sans jeter d'information.</div>
      `;
      borderClass = "border-success";
    }
  } else {
    // ElasticNet
    textExplain = `
      <div class="fw-bold text-primary mb-1">🏆 ElasticNet (λ = ${lambda}) : Le Compromis L1 + L2</div>
      <div>ElasticNet mélange le meilleur des deux mondes : il <b>élimine</b> complètement les variables de bruit (comme Lasso) tout en conservant les variables corrélées ensemble avec des coefficients stables (effet de groupe Ridge), évitant le choix aléatoire d'une variable par rapport à une autre.</div>
    `;
    borderClass = "border-primary";
  }

  details.innerHTML = textExplain;
  detailsCard.className = `card border-start border-4 bg-light mt-3 ${borderClass}`;
}
