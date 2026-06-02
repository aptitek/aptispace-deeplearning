// =====================================================================
// convolution.js — Convolution layer simulation logic
// =====================================================================
import { StateMachine, resolveCssValue } from "../core.js";

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

/**
 * Main update function called by OJS cell
 */
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
  const inputDim = 7; // 7x7 input grid
  const kernelDim = 3; // 3x3 kernel

  // 1. Get current kernel details
  const kernelInfo = KERNELS[kernelPreset] || KERNELS.sobel_v;
  const kernelWeights = kernelInfo.weights;
  const bias = kernelInfo.bias;

  // 2. Compute output dimensions
  const outputDim = Math.floor((inputDim - kernelDim + 2 * padding) / stride) + 1;

  // 3. Generate scanning states
  const scanStates = [];
  let indexCounter = 0;
  for (let y = 0; y < outputDim; y++) {
    for (let x = 0; x < outputDim; x++) {
      scanStates.push({
        index: indexCounter++,
        x: x,
        y: y
      });
    }
  }

  // 4. Handle StateMachine lifecycle
  if (state.currentIndex >= scanStates.length) {
    state.currentIndex = 0;
  }

  // Check if we need to reconstruct or update the state machine
  const stateCountChanged = !state.stateMachine || state.stateMachine.states.length !== scanStates.length;
  const speedChanged = state.stateMachine && state.stateMachine.interval !== speed;

  if (stateCountChanged || speedChanged) {
    if (state.stateMachine) {
      state.stateMachine.stop();
    }

    state.stateMachine = new StateMachine({
      states: scanStates,
      interval: speed,
      loop: true,
      onStateChange: (currentState) => {
        state.currentIndex = currentState.index;
        renderAll();
      }
    });

    // Restore index position
    state.stateMachine.currentIndex = state.currentIndex;
  }

  // Sync play/pause state
  if (isPlaying) {
    state.stateMachine.isPlaying = true;
    if (!state.stateMachine.timer) {
      state.stateMachine.start();
    }
  } else {
    if (state.stateMachine) {
      state.stateMachine.stop();
    }
  }

  // Define global render logic so both click events and animation ticks can trigger redraws
  function renderAll() {
    // Current scan state
    const currentScan = scanStates[state.currentIndex] || scanStates[0] || { x: 0, y: 0 };
    const xStart = currentScan.x * stride - padding;
    const yStart = currentScan.y * stride - padding;

    // Compute entire output feature map first
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
            const weightVal = kernelWeights[kY * kernelDim + kX];

            // Only compute if within input bounds (padding is 0 outside)
            if (inX >= 0 && inX < inputDim && inY >= 0 && inY < inputDim) {
              const pixelVal = state.inputValues[inY * inputDim + inX];
              sum += pixelVal * weightVal;
            }
          }
        }

        sum += bias;
        const activated = activation === "relu" ? Math.max(0, sum) : sum;
        outputValues[oY * outputDim + oX] = activated;
      }
    }

    // --- RENDER 1: INPUT GRID ---
    inputEl.innerHTML = "";
    for (let y = 0; y < inputDim; y++) {
      for (let x = 0; x < inputDim; x++) {
        const cellIdx = y * inputDim + x;
        const val = state.inputValues[cellIdx];
        const cell = document.createElement("div");
        cell.className = "conv-cell clickable";
        if (val === 1) cell.classList.add("pixel-active");

        // Is cell inside the sliding window (receptive field)?
        const insideX = x >= xStart && x < xStart + kernelDim;
        const insideY = y >= yStart && y < yStart + kernelDim;
        if (insideX && insideY) {
          cell.classList.add("in-receptive-field");
          if (x === xStart + 1 && y === yStart + 1) {
            cell.classList.add("receptive-field-center");
          }
        }

        cell.textContent = val;

        // Click to toggle pixel value
        cell.addEventListener("click", () => {
          state.inputValues[cellIdx] = val === 1 ? 0 : 1;
          renderAll();
        });

        inputEl.appendChild(cell);
      }
    }

    // --- RENDER 2: KERNEL GRID ---
    kernelEl.innerHTML = "";
    for (let i = 0; i < kernelWeights.length; i++) {
      const w = kernelWeights[i];
      const cell = document.createElement("div");
      cell.className = "conv-cell";
      cell.textContent = Number.isInteger(w) ? w : w.toFixed(2);
      kernelEl.appendChild(cell);
    }

    // --- RENDER 3: OUTPUT GRID ---
    outputEl.innerHTML = "";
    outputEl.style.gridTemplateColumns = `repeat(${outputDim}, 1fr)`;
    for (let y = 0; y < outputDim; y++) {
      for (let x = 0; x < outputDim; x++) {
        const outIdx = y * outputDim + x;
        const outVal = outputValues[outIdx];
        const cell = document.createElement("div");
        cell.className = "conv-cell output-active";
        cell.textContent = outVal.toFixed(1);

        // Map intensity for styling
        const normalized = Math.min(1.0, Math.max(0, outVal / kernelInfo.maxVal));
        cell.style.setProperty("--activation-intensity", normalized);

        // Highlight currently evaluated cell
        if (x === currentScan.x && y === currentScan.y) {
          cell.classList.add("evaluating");
        }

        outputEl.appendChild(cell);
      }
    }

    // --- RENDER 4: MATH DETAILS ---
    // Extract values inside current sliding window
    const calcSteps = [];
    let mathSum = 0;
    for (let kY = 0; kY < kernelDim; kY++) {
      for (let kX = 0; kX < kernelDim; kX++) {
        const inX = xStart + kX;
        const inY = yStart + kY;
        const w = kernelWeights[kY * kernelDim + kX];
        const inBounds = inX >= 0 && inX < inputDim && inY >= 0 && inY < inputDim;
        const px = inBounds ? state.inputValues[inY * inputDim + inX] : 0;
        
        mathSum += px * w;
        
        // Show calculations: W*X
        const wStr = w.toFixed(w % 1 === 0 ? 0 : 2);
        calcSteps.push(`(${px} × ${wStr})`);
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
    resultVal.innerHTML = `Sortie = <span style="color: var(--sol-blue); font-size: 1.1em;">${finalVal.toFixed(2)}</span>`;

    mathEl.append(title, formula, calcDetails, result, resultVal);
  }

  // Initial draw
  renderAll();
}
