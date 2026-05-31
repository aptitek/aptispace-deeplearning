// =====================================================================
// augmentation.js — Data augmentation preview helpers
// =====================================================================

const AUGMENTATION_STEPS = {
  rotation: {
    label: "Rotation",
    transform: "rotate(25deg)",
    summary: "Le modèle apprend que l'orientation exacte ne porte pas toujours le signal."
  },
  flip: {
    label: "Miroir",
    transform: "scaleX(-1)",
    summary: "La symétrie force le modèle à chercher la forme, pas le sens de lecture."
  },
  zoom: {
    label: "Zoom",
    transform: "scale(1.8)",
    summary: "Le changement d'échelle évite de lier la classe à une distance fixe."
  }
};

function normalizeTransforms(transforms) {
  if (!Array.isArray(transforms)) return [];
  return transforms.filter((key) => Object.prototype.hasOwnProperty.call(AUGMENTATION_STEPS, key));
}

function renderPreview(previewEl, activeTransforms, symbol) {
  previewEl.innerHTML = "";

  const viewport = document.createElement("div");
  viewport.className = "augmentation-viewport";

  const emoji = document.createElement("div");
  emoji.className = "augmentation-emoji";
  emoji.textContent = symbol;

  const transform = activeTransforms
    .map((key) => AUGMENTATION_STEPS[key].transform)
    .join(" ");
  emoji.style.transform = transform || "none";

  const overlay = document.createElement("div");
  overlay.className = "augmentation-overlay";

  viewport.append(emoji, overlay);
  previewEl.appendChild(viewport);
}

function renderAnalysis(analysisEl, activeTransforms) {
  analysisEl.innerHTML = "";

  const title = document.createElement("div");
  title.className = "augmentation-analysis-title";
  title.textContent = "Analyse machine";

  const lead = document.createElement("p");
  lead.className = "mb-2";
  lead.textContent = activeTransforms.length
    ? "La même classe produit plusieurs matrices de pixels : le modèle doit isoler les invariants."
    : "Sans transformation, le modèle risque d'associer la classe à une pose unique.";

  const list = document.createElement("ul");
  list.className = "augmentation-analysis-list";

  const steps = activeTransforms.length ? activeTransforms : ["rotation", "flip", "zoom"];
  steps.forEach((key) => {
    const step = AUGMENTATION_STEPS[key];
    const item = document.createElement("li");
    item.className = activeTransforms.includes(key) ? "is-active" : "";
    item.innerHTML = `<strong>${step.label}</strong> : ${step.summary}`;
    list.appendChild(item);
  });

  analysisEl.append(title, lead, list);
}

export function updateDataAugmentation({
  transforms = [],
  previewEl,
  analysisEl,
  symbol = "🐶"
} = {}) {
  const activeTransforms = normalizeTransforms(transforms);

  if (previewEl) {
    renderPreview(previewEl, activeTransforms, symbol);
  }

  if (analysisEl) {
    renderAnalysis(analysisEl, activeTransforms);
  }
}
