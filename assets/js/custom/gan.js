// =====================================================================
// gan.js — GAN training duel visualisation
// =====================================================================

const PHASES = {
  danger:  { label: "Effondrement",   msg: "Le Faussaire produit du bruit aléatoire — le Policier gagne sans effort. Gradient nul pour G." },
  warning: { label: "Compétition",    msg: "Le Faussaire affine ses faux. La compétition s'intensifie — chacun contraint l'autre à progresser." },
  success: { label: "Équilibre Nash", msg: "Équilibre de Nash approché : D*(x) ≈ ½ partout. Le Policier ne peut plus distinguer réel du faux." }
};

/** Builds the full GAN duel DOM organism for a given training epoch (0–100). */
export function createGanDuel(epoch) {
  const blur       = Math.max(0, 10 - epoch / 10);
  const opacity    = 0.2 + epoch / 125;
  const scale      = 0.8 + epoch / 500;
  const nashReached = epoch > 80;
  const phase      = epoch < 30 ? "danger" : epoch < 80 ? "warning" : "success";

  const lossG = Math.max(0.05, 2.5 * Math.exp(-epoch / 40)).toFixed(2);
  const lossD = Math.max(0.05, 1.2 * Math.exp(-epoch / 35)).toFixed(2);
  const nash  = (0.5 + (1 - epoch / 100) * 0.45).toFixed(2);

  // Root organism
  const root = document.createElement("div");
  root.className = "gan-duel";
  root.dataset.phase = phase;

  // ── Arena ───────────────────────────────────────────────────────────────
  const arena = document.createElement("div");
  arena.className = "gan-arena";

  const makeCombatant = (labelText, labelClass, emojiChar, caption) => {
    const col = document.createElement("div");
    col.className = "gan-combatant";

    const label = document.createElement("div");
    label.className = `gan-label ${labelClass}`;
    label.textContent = labelText;

    const emoji = document.createElement("div");
    emoji.className = "gan-emoji";
    emoji.style.setProperty("--gan-blur",    `${blur}px`);
    emoji.style.setProperty("--gan-opacity", opacity);
    emoji.style.setProperty("--gan-scale",   scale);
    emoji.textContent = emojiChar;

    const cap = document.createElement("div");
    cap.className = "gan-caption";
    cap.textContent = caption;

    col.append(label, emoji, cap);
    return col;
  };

  const divider = document.createElement("div");
  divider.className = "gan-divider";
  divider.innerHTML = `<span class="gan-divider-icon">⚔️</span><div class="gan-divider-bar"></div>`;

  const verdict = document.createElement("div");
  verdict.className = "gan-verdict";
  verdict.textContent = nashReached ? "Vrai ?" : "FAUX !";

  const discriminatorCol = document.createElement("div");
  discriminatorCol.className = "gan-combatant";
  const discLabel = document.createElement("div");
  discLabel.className = "gan-label is-discriminator";
  discLabel.textContent = "Policier (D)";
  const discCaption = document.createElement("div");
  discCaption.className = "gan-caption";
  discCaption.textContent = "Réel vs Synthétique";
  discriminatorCol.append(discLabel, verdict, discCaption);

  arena.append(
    makeCombatant("Faussaire (G)", "is-generator", "🖼️", "Bruit → Structure"),
    divider,
    discriminatorCol
  );

  // ── Status ──────────────────────────────────────────────────────────────
  const status = document.createElement("div");
  status.className = "gan-status";
  const strong = document.createElement("strong");
  strong.textContent = `Époque ${epoch} / 100 : `;
  status.append(strong, document.createTextNode(PHASES[phase].msg));

  // ── Metrics ─────────────────────────────────────────────────────────────
  const metrics = document.createElement("div");
  metrics.className = "gan-metrics";

  const makeMetric = (labelText, value, valueClass) => {
    const card = document.createElement("div");
    card.className = "gan-metric";
    const lbl = document.createElement("div");
    lbl.className = "gan-metric-label";
    lbl.textContent = labelText;
    const val = document.createElement("div");
    val.className = `gan-metric-value ${valueClass}`;
    val.textContent = value;
    card.append(lbl, val);
    return card;
  };

  metrics.append(
    makeMetric("D*(x̂) estimé", nash,  "is-nash"),
    makeMetric("Loss G",        lossG, "is-g-loss"),
    makeMetric("Loss D",        lossD, "is-d-loss")
  );

  root.append(arena, status, metrics);
  return root;
}
