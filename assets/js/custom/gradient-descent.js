import { resolveCssValue } from "../core.js";
import { createPlot3D } from "../plots.js";

/**
 * 🏔️ 3D Gradient Descent Simulation Runner
 * Reacts to momentum slider and trigger counts.
 */
export function runGradientSimulation(optType, optParam, triggerCount, options = {}) {
  const { containerId, metrics = {} } = options;
  const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!container) return null;

  // Clear previous timer if any
  if (container.animationTimer) {
    clearInterval(container.animationTimer);
    container.animationTimer = null;
  }

  // Predefine function values and grids
  const x = []; const y = []; const z = [];
  for (let i = -2.5; i <= 2.5; i += 0.15) x.push(i);
  for (let j = -2.5; j <= 2.5; j += 0.15) y.push(j);

  for (let j = 0; j < y.length; j++) {
    const row = [];
    for (let i = 0; i < x.length; i++) {
      const xv = x[i]; const yv = y[j];
      row.push(Math.pow(xv, 4) - 4 * Math.pow(xv, 2) + Math.pow(yv, 2) + 0.5 * xv);
    }
    z.push(row);
  }

  const surfaceTrace = {
    x: x, y: y, z: z,
    type: "surface", colorscale: "Viridis", showscale: false,
    opacity: 0.9
  };

  const ballColor = resolveCssValue("var(--sol-red)");
  const trailColor = resolveCssValue("var(--sol-orange)");

  // If this is the first initialization, set up the plot
  if (!container.dataset.initialized) {
    const ballTrace = {
      x: [2.2], y: [1.5], z: [7.9],
      mode: "markers", type: "scatter3d", name: "La Balle",
      marker: { size: 8, color: ballColor, symbol: "circle" }
    };

    const trailTrace = {
      x: [], y: [], z: [],
      mode: "lines", type: "scatter3d", name: "Trajectoire",
      line: { width: 4, color: trailColor }
    };

    createPlot3D(container, [surfaceTrace, trailTrace, ballTrace], "", {
      scene: {
        xaxis: { title: "θ1" },
        yaxis: { title: "θ2" },
        zaxis: { title: "Coût" },
        camera: { eye: { x: -0.6, y: 2, z: 0.8 } }
      },
      layout: {
        height: 340,
        autosize: true,
        showlegend: false
      }
    });
    container.dataset.initialized = "true";
  }

  // If triggerCount > 0, run the simulation
  if (triggerCount > 0) {
    let cx = 2.2; let cy = 1.5;
    
    // Optimizer state variables
    let vx = 0; let vy = 0; // Momentum velocity / Adam first moment
    let sqGradX = 0; let sqGradY = 0; // RMSprop / AdaGrad / Adam second moment
    
    const eps = 1e-8;

    let pathX = [cx]; let pathY = [cy]; let pathV = [0];
    let pathZ = [Math.pow(cx, 4) - 4 * Math.pow(cx, 2) + Math.pow(cy, 2) + 0.5 * cx];

    for (let i = 0; i < 250; i++) {
      let gradX = 4 * Math.pow(cx, 3) - 8 * cx + 0.5;
      let gradY = 2 * cy;
      
      let stepX = 0;
      let stepY = 0;

      if (optType === "momentum") {
        const momentum = optParam;
        const lr = 0.03;
        vx = momentum * vx + lr * gradX;
        vy = momentum * vy + lr * gradY;
        stepX = vx;
        stepY = vy;
      } else if (optType === "rmsprop") {
        const beta = optParam;
        const lr = 0.04;
        sqGradX = beta * sqGradX + (1 - beta) * gradX * gradX;
        sqGradY = beta * sqGradY + (1 - beta) * gradY * gradY;
        stepX = (lr / (Math.sqrt(sqGradX) + eps)) * gradX;
        stepY = (lr / (Math.sqrt(sqGradY) + eps)) * gradY;
      } else if (optType === "adagrad") {
        const lr = optParam;
        sqGradX = sqGradX + gradX * gradX;
        sqGradY = sqGradY + gradY * gradY;
        stepX = (lr / (Math.sqrt(sqGradX) + eps)) * gradX;
        stepY = (lr / (Math.sqrt(sqGradY) + eps)) * gradY;
      } else if (optType === "adam") {
        const beta1 = optParam;
        const beta2 = 0.999;
        const lr = 0.1;
        const t = i + 1;

        vx = beta1 * vx + (1 - beta1) * gradX;
        vy = beta1 * vy + (1 - beta1) * gradY;

        sqGradX = beta2 * sqGradX + (1 - beta2) * gradX * gradX;
        sqGradY = beta2 * sqGradY + (1 - beta2) * gradY * gradY;

        const mHatX = vx / (1 - Math.pow(beta1, t));
        const mHatY = vy / (1 - Math.pow(beta1, t));
        const vHatX = sqGradX / (1 - Math.pow(beta2, t));
        const vHatY = sqGradY / (1 - Math.pow(beta2, t));

        stepX = (lr / (Math.sqrt(vHatX) + eps)) * mHatX;
        stepY = (lr / (Math.sqrt(vHatY) + eps)) * mHatY;
      }

      cx = cx - stepX;
      cy = cy - stepY;

      if (cx < -2.5) cx = -2.5; if (cx > 2.5) cx = 2.5;
      if (cy < -2.5) cy = -2.5; if (cy > 2.5) cy = 2.5;
      let cz = Math.pow(cx, 4) - 4 * Math.pow(cx, 2) + Math.pow(cy, 2) + 0.5 * cx;
      pathX.push(cx); pathY.push(cy); pathZ.push(cz);
      pathV.push(Math.sqrt(stepX * stepX + stepY * stepY));
    }

    // Cache elements to update metrics
    const costEl = document.getElementById(metrics.cost);
    const theta1El = document.getElementById(metrics.theta1);
    const theta2El = document.getElementById(metrics.theta2);
    const speedEl = document.getElementById(metrics.speed);

    let frame = 0;
    container.animationTimer = setInterval(() => {
      if (frame >= pathX.length) {
        clearInterval(container.animationTimer);
        container.animationTimer = null;
        return;
      }

      const ballTraceUpdate = {
        x: [pathX[frame]],
        y: [pathY[frame]],
        z: [pathZ[frame]],
        mode: "markers", type: "scatter3d", name: "La Balle",
        marker: { size: 8, color: ballColor, symbol: "circle" }
      };

      const trailTraceUpdate = {
        x: pathX.slice(0, frame + 1),
        y: pathY.slice(0, frame + 1),
        z: pathZ.slice(0, frame + 1),
        mode: "lines", type: "scatter3d", name: "Trajectoire",
        line: { width: 4, color: trailColor }
      };

      // Plotly reacts to update traces; container.layout preserves user rotation
      Plotly.react(container, [surfaceTrace, trailTraceUpdate, ballTraceUpdate], container.layout);

      // Update metrics DOM elements directly for high performance
      if (costEl) costEl.textContent = pathZ[frame].toFixed(4);
      if (theta1El) theta1El.textContent = pathX[frame].toFixed(3);
      if (theta2El) theta2El.textContent = pathY[frame].toFixed(3);
      if (speedEl) speedEl.textContent = (pathV[frame] * 10).toFixed(2);

      frame++;
    }, 40);
  }

  return container;
}
