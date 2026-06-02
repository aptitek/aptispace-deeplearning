import { resolveCssValue, StateMachine } from "../core.js";
import { createPlot3D } from "../plots.js";

/**
 * 🏔️ 3D Gradient Descent Simulation
 *
 * Pre-computes the full descent path for the given optimizer, initialises the
 * Plotly 3D surface, then returns a StateMachine whose states are animation
 * frames. Wire it to a SimulationController for play / pause / reset control.
 *
 * @param {string}  optType   - "momentum" | "rmsprop" | "adagrad" | "adam"
 * @param {number}  optParam  - Primary hyper-parameter (momentum β, lr, β₁…)
 * @param {Object}  options   - { containerId, metrics: { cost, theta1, theta2, speed } }
 * @returns {StateMachine|null}
 */
export function createGradientSimulation(optType, optParam, options = {}) {
  const { containerId, metrics = {} } = options;
  const container =
    typeof containerId === "string"
      ? document.getElementById(containerId)
      : containerId;
  if (!container) return null;

  // ── Build loss-surface grid ───────────────────────────────────────────────
  const xs = [], ys = [], zs = [];
  for (let i = -2.5; i <= 2.5; i += 0.15) xs.push(i);
  for (let j = -2.5; j <= 2.5; j += 0.15) ys.push(j);
  for (let j = 0; j < ys.length; j++) {
    const row = [];
    for (let i = 0; i < xs.length; i++) {
      const xv = xs[i], yv = ys[j];
      row.push(Math.pow(xv, 4) - 4 * Math.pow(xv, 2) + Math.pow(yv, 2) + 0.5 * xv);
    }
    zs.push(row);
  }

  // ── Pre-compute descent path ──────────────────────────────────────────────
  let cx = 2.2, cy = 1.5;
  let vx = 0, vy = 0, sqGradX = 0, sqGradY = 0;
  const eps = 1e-8;

  const pathX = [cx], pathY = [cy], pathV = [0];
  const pathZ = [Math.pow(cx, 4) - 4 * Math.pow(cx, 2) + Math.pow(cy, 2) + 0.5 * cx];

  for (let i = 0; i < 250; i++) {
    const gradX = 4 * Math.pow(cx, 3) - 8 * cx + 0.5;
    const gradY = 2 * cy;
    let stepX = 0, stepY = 0;

    if (optType === "momentum") {
      const lr = 0.03;
      vx = optParam * vx + lr * gradX;
      vy = optParam * vy + lr * gradY;
      stepX = vx; stepY = vy;
    } else if (optType === "rmsprop") {
      const lr = 0.04;
      sqGradX = optParam * sqGradX + (1 - optParam) * gradX * gradX;
      sqGradY = optParam * sqGradY + (1 - optParam) * gradY * gradY;
      stepX = (lr / (Math.sqrt(sqGradX) + eps)) * gradX;
      stepY = (lr / (Math.sqrt(sqGradY) + eps)) * gradY;
    } else if (optType === "adagrad") {
      sqGradX += gradX * gradX;
      sqGradY += gradY * gradY;
      stepX = (optParam / (Math.sqrt(sqGradX) + eps)) * gradX;
      stepY = (optParam / (Math.sqrt(sqGradY) + eps)) * gradY;
    } else { // adam
      const beta2 = 0.999, lr = 0.1, t = i + 1;
      vx = optParam * vx + (1 - optParam) * gradX;
      vy = optParam * vy + (1 - optParam) * gradY;
      sqGradX = beta2 * sqGradX + (1 - beta2) * gradX * gradX;
      sqGradY = beta2 * sqGradY + (1 - beta2) * gradY * gradY;
      const mHatX = vx / (1 - Math.pow(optParam, t));
      const mHatY = vy / (1 - Math.pow(optParam, t));
      const vHatX = sqGradX / (1 - Math.pow(beta2, t));
      const vHatY = sqGradY / (1 - Math.pow(beta2, t));
      stepX = (lr / (Math.sqrt(vHatX) + eps)) * mHatX;
      stepY = (lr / (Math.sqrt(vHatY) + eps)) * mHatY;
    }

    cx = Math.max(-2.5, Math.min(2.5, cx - stepX));
    cy = Math.max(-2.5, Math.min(2.5, cy - stepY));
    pathX.push(cx); pathY.push(cy);
    pathZ.push(Math.pow(cx, 4) - 4 * Math.pow(cx, 2) + Math.pow(cy, 2) + 0.5 * cx);
    pathV.push(Math.sqrt(stepX * stepX + stepY * stepY));
  }

  // ── Colours (resolved once, CSS-var-safe) ────────────────────────────────
  const ballColor  = resolveCssValue("var(--sol-red)");
  const trailColor = resolveCssValue("var(--sol-orange)");

  const surfaceTrace = {
    x: xs, y: ys, z: zs,
    type: "surface", colorscale: "Viridis", showscale: false, opacity: 0.9
  };

  // ── (Re-)initialise the Plotly canvas ────────────────────────────────────
  createPlot3D(container, [
    surfaceTrace,
    { x: [], y: [], z: [], mode: "lines",   type: "scatter3d", name: "Trajectoire",
      line: { width: 4, color: trailColor } },
    { x: [2.2], y: [1.5], z: [7.9], mode: "markers", type: "scatter3d", name: "La Balle",
      marker: { size: 8, color: ballColor, symbol: "circle" } }
  ], "", {
    scene: {
      xaxis: { title: "θ₁" }, yaxis: { title: "θ₂" }, zaxis: { title: "Coût" },
      camera: { eye: { x: -0.6, y: 2, z: 0.8 } }
    },
    layout: { height: 340, autosize: true, showlegend: false }
  });

  // ── Metric DOM refs ───────────────────────────────────────────────────────
  const costEl   = document.getElementById(metrics.cost);
  const theta1El = document.getElementById(metrics.theta1);
  const theta2El = document.getElementById(metrics.theta2);
  const speedEl  = document.getElementById(metrics.speed);

  // ── Build StateMachine — one state per animation frame ───────────────────
  const states = pathX.map((_, i) => ({ index: i }));

  return new StateMachine({
    states,
    interval: 40,   // ~25 fps
    loop: false,
    onStateChange: ({ index: i }) => {
      // Only restyle the two changing traces (trail + ball).
      // The static surface (trace 0) is never touched, avoiding a full rediff each frame.
      Plotly.restyle(container, {
        x: [pathX.slice(0, i + 1), [pathX[i]]],
        y: [pathY.slice(0, i + 1), [pathY[i]]],
        z: [pathZ.slice(0, i + 1), [pathZ[i]]]
      }, [1, 2]);

      if (costEl)   costEl.textContent   = pathZ[i].toFixed(4);
      if (theta1El) theta1El.textContent = pathX[i].toFixed(3);
      if (theta2El) theta2El.textContent = pathY[i].toFixed(3);
      if (speedEl)  speedEl.textContent  = (pathV[i] * 10).toFixed(2);
    }
  });
}
