import { resolveCssValue, StateMachine } from "../core.js";
import { createPlot3D } from "../plots.js";

/**
 * 🏔️ 3D Gradient Descent Simulation
 *
 * Initialises the Plotly 3D surface once (expensive), then returns a StateMachine
 * extended with an `updatePath(optType, optParam)` method that recomputes the
 * descent trajectory cheaply — no chart re-init needed when only the param changes.
 *
 * Usage pattern (OJS):
 *   // Cell A — re-init only when optimizer TYPE changes
 *   _gradSim = { const sm = createGradientSimulation(optType, options); ... return sm; }
 *   // Cell B — fast param update, no chart re-init
 *   _gradPath = { _gradSim.updatePath(optType, optParam); }
 *
 * @param {string}  optType   - "momentum" | "rmsprop" | "adagrad" | "adam"
 * @param {Object}  options   - { containerId, metrics: { cost, theta1, theta2, speed } }
 * @returns {StateMachine|null}
 */
export function createGradientSimulation(options = {}) {
  const { containerId, metrics = {} } = options;
  const container =
    typeof containerId === "string"
      ? document.getElementById(containerId)
      : containerId;
  if (!container) return null;

  // ── Build loss-surface grid (same for all optimizers) ──────────────────────
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

  // ── Colours ────────────────────────────────────────────────────────────────
  const ballColor  = resolveCssValue("var(--sol-red)");
  const trailColor = resolveCssValue("var(--sol-orange)");

  // ── Initialise Plotly canvas (once per optType change) ─────────────────────
  createPlot3D(container, [
    { x: xs, y: ys, z: zs, type: "surface", colorscale: "Viridis", showscale: false, opacity: 0.9 },
    { x: [], y: [], z: [], mode: "lines", type: "scatter3d", name: "Trajectoire",
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

  // ── Metric DOM refs ────────────────────────────────────────────────────────
  const costEl   = document.getElementById(metrics.cost);
  const theta1El = document.getElementById(metrics.theta1);
  const theta2El = document.getElementById(metrics.theta2);
  const speedEl  = document.getElementById(metrics.speed);

  // ── Path computation (pure JS — cheap, called on every param change) ───────
  function computePath(type, param) {
    let cx = 2.2, cy = 1.5, vx = 0, vy = 0, sqGradX = 0, sqGradY = 0;
    const eps = 1e-8;
    const pathX = [cx], pathY = [cy], pathV = [0];
    const pathZ = [Math.pow(cx, 4) - 4 * Math.pow(cx, 2) + Math.pow(cy, 2) + 0.5 * cx];

    for (let i = 0; i < 250; i++) {
      const gradX = 4 * Math.pow(cx, 3) - 8 * cx + 0.5;
      const gradY = 2 * cy;
      let stepX = 0, stepY = 0;

      if (type === "momentum") {
        const lr = 0.03;
        vx = param * vx + lr * gradX;
        vy = param * vy + lr * gradY;
        stepX = vx; stepY = vy;
      } else if (type === "rmsprop") {
        const lr = 0.04;
        sqGradX = param * sqGradX + (1 - param) * gradX * gradX;
        sqGradY = param * sqGradY + (1 - param) * gradY * gradY;
        stepX = (lr / (Math.sqrt(sqGradX) + eps)) * gradX;
        stepY = (lr / (Math.sqrt(sqGradY) + eps)) * gradY;
      } else if (type === "adagrad") {
        sqGradX += gradX * gradX;
        sqGradY += gradY * gradY;
        stepX = (param / (Math.sqrt(sqGradX) + eps)) * gradX;
        stepY = (param / (Math.sqrt(sqGradY) + eps)) * gradY;
      } else { // adam
        const beta2 = 0.999, lr = 0.1, t = i + 1;
        vx = param * vx + (1 - param) * gradX;
        vy = param * vy + (1 - param) * gradY;
        sqGradX = beta2 * sqGradX + (1 - beta2) * gradX * gradX;
        sqGradY = beta2 * sqGradY + (1 - beta2) * gradY * gradY;
        const mHatX = vx / (1 - Math.pow(param, t));
        const mHatY = vy / (1 - Math.pow(param, t));
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

    return { pathX, pathY, pathZ, pathV };
  }

  // ── Mutable path arrays (closed over by onStateChange) ────────────────────
  let pathX = [2.2], pathY = [1.5], pathZ = [7.9], pathV = [0];

  // ── StateMachine ──────────────────────────────────────────────────────────
  const sm = new StateMachine({
    states: [{ index: 0 }],
    interval: 40,
    loop: false,
    onStateChange: ({ index: i }) => {
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

  // ── updatePath — recompute trajectory, reset animation ────────────────────
  // Called by the OJS param-update cell on every optParam change.
  // Does NOT reinitialise Plotly — only updates path data and resets the ball.
  sm.updatePath = (type, param) => {
    sm.stop();
    sm.currentIndex = 0;

    const p = computePath(type, param);
    pathX = p.pathX; pathY = p.pathY; pathZ = p.pathZ; pathV = p.pathV;
    sm.states = p.pathX.map((_, i) => ({ index: i }));

    Plotly.restyle(container, {
      x: [[], [pathX[0]]],
      y: [[], [pathY[0]]],
      z: [[], [pathZ[0]]]
    }, [1, 2]);

    if (costEl)   costEl.textContent   = pathZ[0].toFixed(4);
    if (theta1El) theta1El.textContent = pathX[0].toFixed(3);
    if (theta2El) theta2El.textContent = pathY[0].toFixed(3);
    if (speedEl)  speedEl.textContent  = "0.00";
  };

  return sm;
}
