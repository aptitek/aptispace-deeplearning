// =====================================================================
// convolution.js — Convolution layer simulation logic
// =====================================================================
import { StateMachine } from "../core.js";

// Initialize global state for persistence across OJS updates
if (typeof window !== "undefined" && !window.convSimulatorState) {
  window.convSimulatorState = {
    inputValues: [
      0, 0, 1, 0, 0, 0, 0,
      0, 0, 1, 0, 1, 0, 0,
      0, 0, 1, 0, 1, 0, 0,
      0, 0, 1, 1, 1, 0, 0,
      0, 0, 0, 0, 1, 0, 0,
      0, 0, 0, 0, 1, 0, 0,
      0, 0, 0, 0, 1, 0, 0
    ],
    currentIndex: 0,
    stateMachine: null
  };
}

// Kernel configurations
const KERNELS = {
  sobel_v: {
    name: "Sobel Vertical (Bords)",
    weights: [
      -1, 0, 1,
      -2, 0, 2,
      -1, 0, 1
    ],
    bias: 0.0,
    maxVal: 4
  },
  sobel_h: {
    name: "Sobel Horizontal (Bords)",
    weights: [
      -1, -2, -1,
       0,  0,  0,
       1,  2,  1
    ],
    bias: 0.0,
    maxVal: 4
  },
  sharpen: {
    name: "Netteté (Sharpen)",
    weights: [
       0, -1,  0,
      -1,  5, -1,
       0, -1,  0
    ],
    bias: 0.0,
    maxVal: 5
  },
  blur: {
    name: "Flou (Box Blur)",
    weights: [
      0.11, 0.11, 0.11,
      0.11, 0.11, 0.11,
      0.11, 0.11, 0.11
    ],
    bias: 0.0,
    maxVal: 1
  },
  identity: {
    name: "Identité",
    weights: [
      0, 0, 0,
      0, 1, 0,
      0, 0, 0
    ],
    bias: 0.0,
    maxVal: 1
  }
};

// =====================================================================
// Pure computation — no DOM dependency
// =====================================================================

function computeFeatureMap({ inputValues, kernelWeights, inputDim, kernelDim, outputDim, stride, padding, bias, activation }) {
  const outputValues = new Array(outputDim * outputDim).fill(0);
  for (let oY = 0; oY < outputDim; oY++) {
    for (let oX = 0; oX < outputDim; oX++) {
      let sum = 0;
      const outXStart = oX * stride - padding;
      const outYStart = oY * stride - padding;
      for (let kY = 0; kY < kernelDim; kY++) {
        for (let kX = 0; kX < kernelDim; kX++) {
          const inX = outXStart + kX;
          const inY = outYStart + kY;
          if (inX >= 0 && inX < inputDim && inY >= 0 && inY < inputDim) {
            sum += inputValues[inY * inputDim + inX] * kernelWeights[kY * kernelDim + kX];
          }
        }
      }
      sum += bias;
      outputValues[oY * outputDim + oX] = activation === "relu" ? Math.max(0, sum) : sum;
    }
  }
  return outputValues;
}

// =====================================================================
// DOM renderers — each receives pre-computed data, no math inside
// =====================================================================

function renderInputGrid(inputEl, inputValues, inputDim, kernelDim, currentScan, stride, padding) {
  const xStart = currentScan.x * stride - padding;
  const yStart = currentScan.y * stride - padding;

  inputEl.innerHTML = "";
  for (let y = 0; y < inputDim; y++) {
    for (let x = 0; x < inputDim; x++) {
      const cellIdx = y * inputDim + x;
      const val = inputValues[cellIdx];
      const cell = document.createElement("div");
      cell.className = "conv-cell clickable";
      cell.dataset.idx = cellIdx;
      if (val === 1) cell.classList.add("pixel-active");

      const insideX = x >= xStart && x < xStart + kernelDim;
      const insideY = y >= yStart && y < yStart + kernelDim;
      if (insideX && insideY) {
        cell.classList.add("in-receptive-field");
        if (x === xStart + 1 && y === yStart + 1) cell.classList.add("receptive-field-center");
      }

      cell.textContent = val;
      inputEl.appendChild(cell);
    }
  }
}

function renderKernelGrid(kernelEl, kernelWeights) {
  kernelEl.innerHTML = "";
  for (const w of kernelWeights) {
    const cell = document.createElement("div");
    cell.className = "conv-cell";
    cell.textContent = Number.isInteger(w) ? w : w.toFixed(2);
    kernelEl.appendChild(cell);
  }
}

function renderOutputGrid(outputEl, outputValues, outputDim, maxVal, currentScan) {
  outputEl.style.setProperty("--output-dim", outputDim);
  outputEl.innerHTML = "";
  for (let y = 0; y < outputDim; y++) {
    for (let x = 0; x < outputDim; x++) {
      const outVal = outputValues[y * outputDim + x];
      const cell = document.createElement("div");
      cell.className = "conv-cell output-active";
      cell.textContent = outVal.toFixed(1);
      cell.style.setProperty("--activation-intensity", Math.min(1.0, Math.max(0, outVal / maxVal)));
      if (x === currentScan.x && y === currentScan.y) cell.classList.add("evaluating");
      outputEl.appendChild(cell);
    }
  }
}

function renderMathPanel(mathEl, { kernelWeights, kernelDim, inputValues, inputDim, currentScan, stride, padding, bias, activation }) {
  const xStart = currentScan.x * stride - padding;
  const yStart = currentScan.y * stride - padding;

  const calcSteps = [];
  let mathSum = 0;
  for (let kY = 0; kY < kernelDim; kY++) {
    for (let kX = 0; kX < kernelDim; kX++) {
      const inX = xStart + kX;
      const inY = yStart + kY;
      const w = kernelWeights[kY * kernelDim + kX];
      const inBounds = inX >= 0 && inX < inputDim && inY >= 0 && inY < inputDim;
      const px = inBounds ? inputValues[inY * inputDim + inX] : 0;
      mathSum += px * w;
      calcSteps.push(`(${px} × ${Number.isInteger(w) ? w : w.toFixed(2)})`);
    }
  }
  mathSum += bias;
  const finalVal = activation === "relu" ? Math.max(0, mathSum) : mathSum;

  mathEl.innerHTML = "";

  const title = document.createElement("div");
  title.className = "math-title";
  title.textContent = `Calcul Neurone (${currentScan.x}, ${currentScan.y})`;

  const formula = document.createElement("div");
  formula.className = "math-formula";
  formula.innerHTML = `Somme pondérée avec biais <i>b</i> = ${bias} :`;

  const calcDetails = document.createElement("div");
  calcDetails.className = "math-calc-details";
  calcDetails.innerHTML = `${calcSteps.join(" + ")} = <strong>${mathSum.toFixed(2)}</strong>`;

  const result = document.createElement("div");
  result.className = "math-result";
  const actText = activation === "relu" ? `ReLU(${mathSum.toFixed(2)})` : `Linear(${mathSum.toFixed(2)})`;
  result.innerHTML = `<span>f(x) = ${actText}</span>`;
  const badge = document.createElement("span");
  badge.className = finalVal > 0 ? "badge bg-success" : "badge bg-danger";
  badge.textContent = finalVal > 0 ? "Activé" : "Éteint";
  result.appendChild(badge);

  const resultVal = document.createElement("div");
  resultVal.className = "mt-2 pt-2 border-top text-end font-monospace fw-bold";
  const resultSpan = document.createElement("span");
  resultSpan.className = "math-output-value";
  resultSpan.textContent = finalVal.toFixed(2);
  resultVal.append("Sortie = ", resultSpan);

  mathEl.append(title, formula, calcDetails, result, resultVal);
}

// =====================================================================
// Main update function called by OJS cell
// =====================================================================

export function updateConvolutionSimulator({
  stride = 1,
  padding = 0,
  speed = 1000,
  kernelPreset = "sobel_v",
  activation = "relu",
  isPlaying = false,
  containers = {}
} = {}) {
  const { inputEl, kernelEl, outputEl, mathEl } = containers;
  if (!inputEl || !kernelEl || !outputEl || !mathEl) return;

  const state = window.convSimulatorState;
  const inputDim = 7;
  const kernelDim = 3;

  const kernelInfo = KERNELS[kernelPreset] || KERNELS.sobel_v;
  const kernelWeights = kernelInfo.weights;
  const bias = kernelInfo.bias;

  const outputDim = Math.floor((inputDim - kernelDim + 2 * padding) / stride) + 1;

  const scanStates = [];
  let indexCounter = 0;
  for (let y = 0; y < outputDim; y++) {
    for (let x = 0; x < outputDim; x++) {
      scanStates.push({ index: indexCounter++, x, y });
    }
  }

  if (state.currentIndex >= scanStates.length) state.currentIndex = 0;

  const stateCountChanged = !state.stateMachine || state.stateMachine.states.length !== scanStates.length;
  const speedChanged = state.stateMachine && state.stateMachine.interval !== speed;

  if (stateCountChanged || speedChanged) {
    if (state.stateMachine) state.stateMachine.stop();
    state.stateMachine = new StateMachine({
      states: scanStates,
      interval: speed,
      loop: true,
      onStateChange: (currentState) => {
        state.currentIndex = currentState.index;
        renderAll();
      }
    });
    state.stateMachine.currentIndex = state.currentIndex;
  }

  if (isPlaying) {
    state.stateMachine.isPlaying = true;
    if (!state.stateMachine.timer) state.stateMachine.start();
  } else {
    if (state.stateMachine) state.stateMachine.stop();
  }

  // Register click handler via event delegation once per mount
  if (!inputEl.dataset.delegated) {
    inputEl.addEventListener("click", (e) => {
      const cell = e.target.closest(".conv-cell.clickable");
      if (!cell) return;
      const idx = parseInt(cell.dataset.idx);
      if (!isNaN(idx)) {
        state.inputValues[idx] = state.inputValues[idx] === 1 ? 0 : 1;
        renderAll();
      }
    });
    inputEl.dataset.delegated = "true";
  }

  function renderAll() {
    const currentScan = scanStates[state.currentIndex] || scanStates[0] || { x: 0, y: 0 };

    const outputValues = computeFeatureMap({
      inputValues: state.inputValues,
      kernelWeights,
      inputDim,
      kernelDim,
      outputDim,
      stride,
      padding,
      bias,
      activation
    });

    renderInputGrid(inputEl, state.inputValues, inputDim, kernelDim, currentScan, stride, padding);
    renderKernelGrid(kernelEl, kernelWeights);
    renderOutputGrid(outputEl, outputValues, outputDim, kernelInfo.maxVal, currentScan);
    renderMathPanel(mathEl, {
      kernelWeights, kernelDim, inputValues: state.inputValues, inputDim,
      currentScan, stride, padding, bias, activation
    });
  }

  renderAll();
}

// =====================================================================
// Dimensionality comparison organism (MLP vs CNN parameter count)
// =====================================================================

export function createDimensionalityComparison(resIdx) {
  const resolutions = [28, 250, 1080, 3840];
  const res = resolutions[resIdx] ?? 250;
  const mlp_params = res * res * 3 * 100;
  const cnn_params = 3 * 3 * 3 * 100;

  // Cube size proportional to parameter ratio
  const fixed_cnn_size = 20;
  const size_ratio = Math.pow(mlp_params / cnn_params, 1 / 6);
  const s_cnn = fixed_cnn_size;
  const s_mlp = Math.min(180, s_cnn * size_ratio);

  const mlp_color = mlp_params > 10_000_000 ? "var(--accent-danger)"
    : mlp_params > 1_000_000 ? "var(--accent-warning)"
    : "var(--sol-yellow)";
  const cnn_color = "var(--accent-success)";

  const makeCube = (size, color, label) => {
    const offset = size * 0.35;
    const darken = (c, amt) => `color-mix(in srgb, ${c}, black ${amt}%)`;

    const wrapper = document.createElement("div");
    wrapper.className = "d-flex flex-column align-items-center gap-2";

    const cube = document.createElement("div");
    cube.className = "cube-container";
    cube.style.setProperty("--size", size + "px");
    cube.style.setProperty("--offset", offset + "px");
    cube.style.setProperty("--color", color);
    cube.style.setProperty("--color-top", darken(color, 15));
    cube.style.setProperty("--color-right", darken(color, 30));
    cube.innerHTML = `
      <div class="cube-face-top"></div>
      <div class="cube-face-right"></div>
      <div class="cube-face-front"></div>
    `;

    const labelSpan = document.createElement("span");
    labelSpan.className = "small fw-bold text-muted";
    labelSpan.textContent = label;

    wrapper.appendChild(cube);
    wrapper.appendChild(labelSpan);
    return wrapper;
  };

  const makeMonitor = (mlp, cnn, memoryAnalysis, memoryState) => {
    const total = mlp + cnn;
    const pctCnn = ((cnn / total) * 100).toFixed(1);
    const pctMlp = (100 - parseFloat(pctCnn)).toFixed(1);

    const card = document.createElement("div");
    card.className = "card bg-transparent border-0 w-100";

    const body = document.createElement("div");
    body.className = "card-body p-0 d-flex flex-column gap-3";

    // --- Parameter comparison panel ---
    const paramPanel = document.createElement("div");
    paramPanel.className = "arch-monitor-panel p-3 rounded border";

    const paramTitle = document.createElement("div");
    paramTitle.className = "small fw-bold text-muted mb-2";
    paramTitle.textContent = "Poids du Réseau (Paramètres)";

    const paramLabels = document.createElement("div");
    paramLabels.className = "d-flex justify-content-between mb-1 font-monospace small";
    const mlpLabel = document.createElement("span");
    mlpLabel.className = "arch-monitor-label-mlp";
    mlpLabel.textContent = `MLP (Full) : ${mlp.toLocaleString()}`;
    const cnnLabel = document.createElement("span");
    cnnLabel.className = "arch-monitor-label-cnn";
    cnnLabel.textContent = `CNN (Filtres) : ${cnn.toLocaleString()}`;
    paramLabels.appendChild(mlpLabel);
    paramLabels.appendChild(cnnLabel);

    const progress = document.createElement("div");
    progress.className = "progress";
    const barMlp = document.createElement("div");
    barMlp.className = "progress-bar arch-monitor-progress-mlp";
    barMlp.style.width = `${pctMlp}%`;
    const barCnn = document.createElement("div");
    barCnn.className = "progress-bar arch-monitor-progress-cnn";
    barCnn.style.width = `${pctCnn}%`;
    progress.appendChild(barMlp);
    progress.appendChild(barCnn);

    const pctRow = document.createElement("div");
    pctRow.className = "d-flex justify-content-between mt-1 text-muted extra-small font-monospace";
    pctRow.innerHTML = `<span>${pctMlp}%</span><span>${pctCnn}%</span>`;

    paramPanel.append(paramTitle, paramLabels, progress, pctRow);

    // --- Memory status panel ---
    const statusPanel = document.createElement("div");
    statusPanel.className = "arch-monitor-status p-3 rounded border d-flex align-items-center justify-content-between";
    statusPanel.dataset.state = memoryState;

    const statusText = document.createElement("div");
    const statusTitle = document.createElement("div");
    statusTitle.className = "small fw-bold text-muted";
    statusTitle.textContent = "État de la Mémoire";
    const statusSub = document.createElement("div");
    statusSub.className = "small mt-1 text-muted font-monospace";
    statusSub.textContent = "Empreinte RAM";
    statusText.appendChild(statusTitle);
    statusText.appendChild(statusSub);

    const badge = document.createElement("div");
    badge.className = "arch-monitor-badge badge font-monospace";
    badge.dataset.state = memoryState;
    badge.textContent = memoryAnalysis;

    statusPanel.appendChild(statusText);
    statusPanel.appendChild(badge);

    body.appendChild(paramPanel);
    body.appendChild(statusPanel);
    card.appendChild(body);
    return card;
  };

  const analysis = mlp_params > 100_000_000 ? "Incalculable sur PC (Saturation)"
    : mlp_params > 1_000_000 ? "Lent et Inefficace"
    : "Stable et Léger";
  const memState = mlp_params > 100_000_000 ? "danger"
    : mlp_params > 1_000_000 ? "warning"
    : "success";

  // Assemble Bootstrap row layout
  const row = document.createElement("div");
  row.className = "row g-4 align-items-center px-3 pb-3";

  const colCubes = document.createElement("div");
  colCubes.className = "col-md-6 d-flex justify-content-center align-items-end cube-viewport";
  const cubeWrapper = document.createElement("div");
  cubeWrapper.className = "d-flex gap-5 justify-content-center align-items-end w-100 pb-2";
  cubeWrapper.appendChild(makeCube(s_cnn, cnn_color, `CNN (${cnn_params.toLocaleString()})`));
  cubeWrapper.appendChild(makeCube(s_mlp, mlp_color, `MLP (${mlp_params.toLocaleString()})`));
  colCubes.appendChild(cubeWrapper);

  const colMonitor = document.createElement("div");
  colMonitor.className = "col-md-6";
  colMonitor.appendChild(makeMonitor(mlp_params, cnn_params, analysis, memState));

  row.appendChild(colCubes);
  row.appendChild(colMonitor);
  return row;
}
