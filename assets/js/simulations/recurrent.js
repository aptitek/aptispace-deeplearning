export function renderGruParameterComparison({ hiddenDim = 128, inputDim = 64 } = {}) {
  const lstm = 4 * hiddenDim * (hiddenDim + inputDim + 1);
  const gru = 3 * hiddenDim * (hiddenDim + inputDim + 1);
  const saving = (((lstm - gru) / lstm) * 100).toFixed(1);

  const wrapper = document.createElement("div");
  wrapper.className = "px-3 pb-3";

  const table = document.createElement("table");
  table.className = "table table-sm mb-2";
  const head = document.createElement("thead");
  const headRow = document.createElement("tr");
  ["Architecture", "Paramètres", "Économie"].forEach(label => {
    const th = document.createElement("th");
    th.textContent = label;
    headRow.appendChild(th);
  });
  head.appendChild(headRow);
  table.appendChild(head);

  const body = document.createElement("tbody");
  [
    ["LSTM", lstm.toLocaleString(), "-"],
    ["GRU", gru.toLocaleString(), `-${saving}%`]
  ].forEach(([name, params, economy]) => {
    const row = document.createElement("tr");
    [name, params, economy].forEach((value, index) => {
      const td = document.createElement("td");
      if (index === 1) {
        const strong = document.createElement("strong");
        strong.textContent = value;
        td.appendChild(strong);
      } else {
        td.textContent = value;
      }
      if (name === "GRU" && index === 2) td.className = "text-success";
      row.appendChild(td);
    });
    body.appendChild(row);
  });
  table.appendChild(body);
  wrapper.appendChild(table);

  const caption = document.createElement("p");
  caption.className = "text-muted small mb-0";
  caption.textContent = `La GRU est ${saving}% plus légère que la LSTM pour d_h=${hiddenDim}, d_x=${inputDim}.`;
  wrapper.appendChild(caption);

  return wrapper;
}

export function renderLstmParameterComparison({ hiddenDim = 128, inputDim = 64 } = {}) {
  const rnn = hiddenDim * (hiddenDim + inputDim) + hiddenDim;
  const lstm = 4 * hiddenDim * (hiddenDim + inputDim + 1);
  const ratio = (lstm / rnn).toFixed(1);

  const wrapper = document.createElement("div");
  wrapper.className = "px-3 pb-3";
  const table = document.createElement("table");
  table.className = "table table-sm table-borderless mb-0";

  const head = document.createElement("thead");
  const headRow = document.createElement("tr");
  ["Architecture", "Paramètres", "Ratio"].forEach(label => {
    const th = document.createElement("th");
    th.textContent = label;
    headRow.appendChild(th);
  });
  head.appendChild(headRow);
  table.appendChild(head);

  const body = document.createElement("tbody");
  [
    ["RNN simple", rnn.toLocaleString(), "1x"],
    ["LSTM", lstm.toLocaleString(), `${ratio}x`]
  ].forEach(rowData => {
    const row = document.createElement("tr");
    rowData.forEach((value, index) => {
      const td = document.createElement("td");
      if (index === 1) {
        const strong = document.createElement("strong");
        strong.textContent = value;
        td.appendChild(strong);
      } else {
        td.textContent = value;
      }
      row.appendChild(td);
    });
    body.appendChild(row);
  });
  table.appendChild(body);
  wrapper.appendChild(table);

  const caption = document.createElement("p");
  caption.className = "text-muted small mb-0 mt-2";
  caption.textContent = `d_h = ${hiddenDim}, d_x = ${inputDim} - Formule LSTM : 4 x d_h x (d_h + d_x + 1)`;
  wrapper.appendChild(caption);

  return wrapper;
}

export function renderLeakageValidationTable() {
  const rows = [
    ["10-fold Cross-Validation", "Jusqu'à +20,5%", "Très vulnérable", "text-danger"],
    ["Division chronologique 2-way", "< 5%", "Robuste", "text-success"],
    ["Division chronologique 3-way", "< 5%", "Robuste", "text-success"],
    ["Walk-forward validation", "~0%", "Optimal (mais coûteux)", "text-success"]
  ];

  const wrapper = document.createElement("div");
  wrapper.className = "px-3 pb-3 pt-2";
  const table = document.createElement("table");
  table.className = "table table-sm table-striped mb-2";
  const head = document.createElement("thead");
  const headRow = document.createElement("tr");
  ["Stratégie de validation", "RMSE Gain (optimisme artificiel)", "Robustesse"].forEach(label => {
    const th = document.createElement("th");
    th.textContent = label;
    headRow.appendChild(th);
  });
  head.appendChild(headRow);
  table.appendChild(head);

  const body = document.createElement("tbody");
  rows.forEach(([strategy, gain, robustness, state]) => {
    const tr = document.createElement("tr");
    const strategyCell = document.createElement("td");
    strategyCell.textContent = strategy;
    const gainCell = document.createElement("td");
    gainCell.className = state;
    const strong = document.createElement("strong");
    strong.textContent = gain;
    gainCell.appendChild(strong);
    const robustnessCell = document.createElement("td");
    robustnessCell.textContent = robustness;
    tr.append(strategyCell, gainCell, robustnessCell);
    body.appendChild(tr);
  });
  table.appendChild(body);
  wrapper.appendChild(table);

  const note = document.createElement("p");
  note.className = "text-muted small mb-0";
  note.textContent = "Source : Albelali & Ahmed (2025). Des fenêtres réduites et des décalages plus longs exacerbent le risque de fuite.";
  wrapper.appendChild(note);

  return wrapper;
}
