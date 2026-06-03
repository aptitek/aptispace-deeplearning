export function renderVisionArchitectureComparison() {
  const rows = [
    ["VGG", "Empilage 3x3", "Fort (local)", "Modéré", "Simplicité, transfert learning"],
    ["ResNet", "Skip connections", "Fort (local)", "Modéré", "Profondeur extrême, robustesse"],
    ["EfficientNet", "Compound scaling", "Fort (local)", "Modéré", "Efficacité paramétrique"],
    ["ViT", "Attention globale", "Faible", "Très élevé (JFT-300M)", "Scalabilité, compréhension globale"]
  ];

  const wrapper = document.createElement("div");
  wrapper.className = "px-3 pb-3 pt-2";
  const table = document.createElement("table");
  table.className = "table table-sm table-striped";

  const head = document.createElement("thead");
  const headRow = document.createElement("tr");
  ["Architecture", "Innovation", "Biais inductif", "Données requises", "Points forts"].forEach(label => {
    const th = document.createElement("th");
    th.textContent = label;
    headRow.appendChild(th);
  });
  head.appendChild(headRow);
  table.appendChild(head);

  const body = document.createElement("tbody");
  rows.forEach(rowData => {
    const row = document.createElement("tr");
    rowData.forEach((value, index) => {
      const cell = document.createElement("td");
      if (index === 0) {
        const strong = document.createElement("strong");
        strong.textContent = value;
        cell.appendChild(strong);
      } else {
        cell.textContent = value;
      }
      row.appendChild(cell);
    });
    body.appendChild(row);
  });
  table.appendChild(body);
  wrapper.appendChild(table);

  const note = document.createElement("p");
  note.className = "text-muted small mb-0";
  note.textContent = "Le ViT surpasse les CNN sur les grands datasets mais reste gourmand en données sur les jeux restreints.";
  wrapper.appendChild(note);

  return wrapper;
}
