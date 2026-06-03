const INPUT_VALUES = [12, 20, 30, 0, 8, 12, 2, 0, 34, 70, 37, 4, 112, 100, 25, 12];
const POOLED_VALUES = [20, 30, 112, 37];
const GROUP_NAMES = ["Rouge", "Bleue", "Verte", "Jaune"];
const GROUP_TEXT_CLASSES = ["text-danger", "text-primary", "text-success", "text-warning"];
const FEATURE_MAP = [
  [1, 3, 2, 4, 1, 0],
  [5, 6, 1, 2, 3, 2],
  [0, 1, 8, 5, 2, 1],
  [2, 3, 2, 9, 1, 0],
  [1, 0, 1, 2, 7, 3],
  [3, 2, 0, 1, 2, 6]
];

function groupForCell(index) {
  if ([0, 1, 4, 5].includes(index)) return 0;
  if ([2, 3, 6, 7].includes(index)) return 1;
  if ([8, 9, 12, 13].includes(index)) return 2;
  return 3;
}

function valueClass(value) {
  return `val-level-${Math.min(9, Math.max(0, Math.floor(value)))}`;
}

function tableFor(data, title) {
  const wrapper = document.createElement("div");
  wrapper.className = "me-3";

  const label = document.createElement("p");
  label.className = "text-muted small mb-1";
  label.textContent = title;
  wrapper.appendChild(label);

  const table = document.createElement("table");
  table.className = "table table-bordered table-sm mb-0 pooling-comparison-table";
  const tbody = document.createElement("tbody");
  data.forEach(row => {
    const tr = document.createElement("tr");
    row.forEach(value => {
      const td = document.createElement("td");
      td.className = valueClass(parseFloat(value));
      td.textContent = value;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrapper.appendChild(table);
  return wrapper;
}

export function renderPoolingInputGrid(selectedGroup = -1, onSelect = () => {}) {
  const container = document.createElement("div");
  container.className = "matrix-grid-in";
  INPUT_VALUES.forEach((value, index) => {
    const group = groupForCell(index);
    const values = INPUT_VALUES.filter((_, cellIndex) => groupForCell(cellIndex) === group);
    const isSelected = selectedGroup === group;
    const cell = document.createElement("div");
    cell.className = [
      "matrix-cell",
      `group-${group}`,
      isSelected ? "is-active-group" : "",
      isSelected && value === Math.max(...values) ? "is-max-cell" : ""
    ].filter(Boolean).join(" ");
    cell.textContent = value;
    cell.addEventListener("click", () => onSelect(group));
    container.appendChild(cell);
  });
  return container;
}

export function renderPoolingOutputGrid(selectedGroup = -1, onSelect = () => {}) {
  const container = document.createElement("div");
  container.className = "matrix-grid-out";
  POOLED_VALUES.forEach((value, index) => {
    const cell = document.createElement("div");
    cell.className = [
      "matrix-cell-out",
      `out-${index}`,
      selectedGroup === index ? "is-active-out" : ""
    ].filter(Boolean).join(" ");
    cell.textContent = value;
    cell.addEventListener("click", () => onSelect(index));
    container.appendChild(cell);
  });
  return container;
}

export function renderPoolingExplanation(selectedGroup = -1) {
  if (selectedGroup === -1) {
    const alert = document.createElement("div");
    alert.className = "alert alert-info border-0 mb-0 font-monospace small";
    alert.textContent = "💡 Astuce : cliquez sur une région colorée des grilles ci-dessus pour observer le processus de réduction (Max-Pooling).";
    return alert;
  }

  const values = INPUT_VALUES.filter((_, index) => groupForCell(index) === selectedGroup);
  const box = document.createElement("div");
  box.className = `pooling-explanation-box group-color-${selectedGroup}`;
  const group = document.createElement("strong");
  group.className = GROUP_TEXT_CLASSES[selectedGroup];
  group.textContent = GROUP_NAMES[selectedGroup];
  box.append("Dans la zone ", group, `, les valeurs comparées sont : [${values.join(", ")}]. La valeur maximale est ${Math.max(...values)}.`);
  return box;
}

export function renderPoolingComparison(poolSize = 2) {
  const outputSize = Math.floor(6 / poolSize);
  const maxPool = [];
  const avgPool = [];

  for (let i = 0; i < outputSize; i += 1) {
    maxPool[i] = [];
    avgPool[i] = [];
    for (let j = 0; j < outputSize; j += 1) {
      const values = [];
      for (let di = 0; di < poolSize; di += 1) {
        for (let dj = 0; dj < poolSize; dj += 1) {
          const value = FEATURE_MAP[i * poolSize + di]?.[j * poolSize + dj];
          if (value !== undefined) values.push(value);
        }
      }
      maxPool[i][j] = Math.max(...values);
      avgPool[i][j] = (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1);
    }
  }

  const wrapper = document.createElement("div");
  wrapper.className = "px-3 pb-3 pt-2 pooling-simulator";
  const row = document.createElement("div");
  row.className = "d-flex flex-wrap align-items-start gap-2";
  const arrow = document.createElement("div");
  arrow.className = "d-flex align-items-center fs-4 mt-4";
  arrow.textContent = "->";

  row.append(
    tableFor(FEATURE_MAP, "Carte d'entrée (6x6)"),
    arrow,
    tableFor(maxPool, `Max Pooling ${poolSize}x${poolSize} -> ${outputSize}x${outputSize}`),
    tableFor(avgPool, `Avg Pooling ${poolSize}x${poolSize} -> ${outputSize}x${outputSize}`)
  );
  wrapper.appendChild(row);

  const note = document.createElement("p");
  note.className = "text-muted small mt-2 mb-0";
  note.textContent = "Max pooling retient la valeur maximale (traits saillants) ; average pooling lisse (contexte global).";
  wrapper.appendChild(note);

  return wrapper;
}
