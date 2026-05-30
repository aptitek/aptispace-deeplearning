// ==========================================
// sim/cabling.js — Interactive Cabling Exercise (jsPlumb)
// ==========================================
// Usage (OJS):
//   import { createCabling } from "./assets/js/sim/cabling.js"
//   engine = createCabling("#cabling-canvas", leftItems, rightItems, onStateUpdate)

/**
 * Creates and mounts a jsPlumb-based drag-and-drop connector exercise.
 *
 * @param {string}   containerId    - CSS selector for the canvas container.
 * @param {Array}    leftItems      - Left column items: [{ id, label, match, feedback }]
 * @param {Array}    rightItems     - Right column items: [{ id, label }]
 * @param {Function} onStateUpdate  - Called with current state on every connection change.
 * @returns {CablingManager}
 */
export function createCabling(containerId, leftItems, rightItems, onStateUpdate) {
  return new CablingManager(containerId, leftItems, rightItems, onStateUpdate);
}

class CablingManager {
  constructor(containerId, leftItems, rightItems, onStateUpdate) {
    this.containerId   = containerId;
    this.container     = document.querySelector(containerId);
    this.leftItems     = leftItems;
    this.rightItems    = rightItems;
    this.onStateUpdate = onStateUpdate;

    this.connections = {};
    this.activeNode  = null;
    this.validated   = false;
    this.jsp         = null;
    this._connMap    = new Map();
    this._sparks     = [];

    if (this.container) this._init();
  }

  async _init() {
    const { newInstance } = await import("https://esm.sh/@jsplumb/browser-ui@6.2.10");

    this.container.innerHTML = "";
    this.container.style.position  = "relative";
    this.container.style.display   = "flex";
    this.container.style.alignItems = "center";

    const colLeft  = this._makeColumn("left");
    const colMid   = this._makeMidColumn();
    const colRight = this._makeColumn("right");

    this.leftItems.forEach((it, i) => colLeft.appendChild(this._makePill(it, "left", i)));
    this.rightItems.forEach((it, i) => colRight.appendChild(this._makePill(it, "right", i)));
    this.container.append(colLeft, colMid, colRight);

    this.jsp = newInstance({
      container: this.container,
      connector: { type: "Bezier", options: { curviness: 80 } },
      paintStyle: {
        stroke: "var(--sol-cyan)", strokeWidth: 4,
        outlineStroke: "rgba(0,0,0,0.3)", outlineWidth: 2
      },
      hoverPaintStyle: {
        stroke: "var(--sol-yellow)", strokeWidth: 5,
        outlineStroke: "rgba(0,0,0,0.4)", outlineWidth: 2
      },
      endpoint: "Dot",
      endpointStyle: { fill: "var(--sol-base01)", radius: 6 }
    });

    const SOCKET = { fill: "var(--lever-slot-bg)", stroke: "var(--sol-base01)", strokeWidth: 4 };
    const SOCKET_HOVER = { fill: "var(--lever-slot-bg)", stroke: "var(--sol-cyan)", strokeWidth: 4 };

    this.leftItems.forEach((it) => {
      const el = this.container.querySelector(`[data-id="L_${it.id}"]`);
      if (!el) return;
      this.jsp.addEndpoint(el, {
        anchor: [1, 0.5, 1, 0.4], source: true, target: false,
        endpoint: { type: "Dot", options: { radius: 14 } },
        paintStyle: SOCKET, hoverPaintStyle: SOCKET_HOVER,
        maxConnections: 1, connectionsDetachable: true,
        cssClass: "cabling-ep-left"
      });
    });

    this.rightItems.forEach((it) => {
      const el = this.container.querySelector(`[data-id="R_${it.id}"]`);
      if (!el) return;
      this.jsp.addEndpoint(el, {
        anchor: [0, 0.5, -1, 0.4], source: false, target: true,
        endpoint: { type: "Dot", options: { radius: 14 } },
        paintStyle: SOCKET, hoverPaintStyle: SOCKET_HOVER,
        maxConnections: 1, connectionsDetachable: true,
        cssClass: "cabling-ep-right"
      });
    });

    this.jsp.bind("beforeDrop", (info) => {
      if (this.validated) return false;
      const srcGroup = info.connection.source.dataset.group;
      const tgtGroup = info.dropEndpoint.element.dataset.group;
      return srcGroup !== tgtGroup;
    });

    this.jsp.bind("connection", ({ source, target, connection }) => {
      const leftEl  = source.dataset.group === "left" ? source : target;
      const rightEl = source.dataset.group === "right" ? source : target;
      const lid = leftEl.dataset.srcId;
      const rid = rightEl.dataset.srcId;
      if (!lid || !rid) return;

      const old = this._connMap.get(lid);
      if (old && old !== connection) {
        try { this.jsp.deleteConnection(old); } catch {}
      }
      this.connections[lid] = rid;
      this._connMap.set(lid, connection);

      const ci = this.leftItems.findIndex(it => it.id === lid);
      const colors = ["var(--sol-cyan)", "var(--sol-magenta)", "var(--sol-orange)", "var(--sol-violet)", "var(--sol-blue)"];
      connection.setPaintStyle({ stroke: colors[ci % colors.length], strokeWidth: 4, outlineStroke: "rgba(0,0,0,0.3)", outlineWidth: 2 });
      connection.setHoverPaintStyle({ stroke: "var(--sol-yellow)", strokeWidth: 5, outlineStroke: "rgba(0,0,0,0.4)", outlineWidth: 2 });

      this._clearActive();
      this.onStateUpdate(this.getState());
    });

    this.jsp.bind("connectionDetached", ({ source, target }) => {
      const leftEl = source.dataset.group === "left" ? source : target;
      const lid = leftEl.dataset.srcId;
      if (lid) {
        delete this.connections[lid];
        this._connMap.delete(lid);
      }
      this.onStateUpdate(this.getState());
    });

    this.container.addEventListener("click", (e) => {
      if (this.validated) return;
      const pill = e.target.closest(".cabling-pill");
      if (!pill) return;

      const group = pill.dataset.group;
      const srcId = pill.dataset.srcId;

      if (!this.activeNode) { this._setActive(pill); return; }
      if (this.activeNode.srcId === srcId && this.activeNode.group === group) { this._clearActive(); return; }
      if (this.activeNode.group === group) { this._setActive(pill); return; }

      const leftEl  = group === "right" ? this.activeNode.el : pill;
      const rightEl = group === "right" ? pill : this.activeNode.el;
      this._connectElements(leftEl, rightEl);
    });

    this._resizeHandler = () => { if (this.jsp) this.jsp.repaintEverything(); };
    window.addEventListener("resize", this._resizeHandler);
  }

  _makeColumn(side) {
    const col = document.createElement("div");
    col.className = `cabling-col cabling-col--${side}`;
    return col;
  }

  _makeMidColumn() {
    const mid = document.createElement("div");
    mid.style.cssText = "flex: 1 1 auto; min-width: 80px;";
    return mid;
  }

  _makePill(item, group) {
    const pill = document.createElement("div");
    pill.className       = "cabling-pill";
    pill.dataset.id      = `${group === "left" ? "L" : "R"}_${item.id}`;
    pill.dataset.srcId   = item.id;
    pill.dataset.group   = group;
    pill.textContent     = item.label;
    return pill;
  }

  _setActive(pill) {
    this._clearActive();
    this.activeNode = { el: pill, srcId: pill.dataset.srcId, group: pill.dataset.group };
    pill.classList.add('is-active');
  }

  _clearActive() {
    if (this.activeNode?.el) this.activeNode.el.classList.remove('is-active');
    this.activeNode = null;
  }

  _connectElements(leftEl, rightEl) {
    if (!leftEl || !rightEl || !this.jsp) return;
    const lid = leftEl.dataset.srcId;
    const rid = rightEl.dataset.srcId;

    const oldLeft = this._connMap.get(lid);
    if (oldLeft) { try { this.jsp.deleteConnection(oldLeft); } catch {} }

    for (const [l, conn] of this._connMap.entries()) {
      if (this.connections[l] === rid && l !== lid) {
        try { this.jsp.deleteConnection(conn); } catch {}
        delete this.connections[l];
        this._connMap.delete(l);
      }
    }

    const leftEps  = this.jsp.getEndpoints(leftEl);
    const rightEps = this.jsp.getEndpoints(rightEl);
    if (leftEps.length && rightEps.length) {
      try { this.jsp.connect({ source: leftEps[0], target: rightEps[0] }); }
      catch (err) { console.warn("jsPlumb connect error:", err); }
    }
  }

  _addSparks(pillEl, side) {
    const containerRect = this.container.getBoundingClientRect();
    const pillRect      = pillEl.getBoundingClientRect();
    const x = side === "right" ? pillRect.right - containerRect.left : pillRect.left - containerRect.left;
    const y = pillRect.top + pillRect.height / 2 - containerRect.top;

    for (let i = 0; i < 6; i++) {
      const spark = document.createElement("span");
      spark.className = "cabling-spark";
      spark.style.left = `${x}px`;
      spark.style.top  = `${y}px`;
      spark.style.setProperty("--angle", `${i * 60}deg`);
      spark.style.animationDelay = `${(i * 0.1) % 0.6}s`;
      this.container.appendChild(spark);
      this._sparks.push(spark);
    }
  }

  validate() {
    if (Object.keys(this.connections).length < this.leftItems.length) {
      return { status: "incomplete", ...this.getState() };
    }

    this.validated = true;

    for (const [lid, conn] of this._connMap.entries()) {
      const rid       = this.connections[lid];
      const item      = this.leftItems.find(it => it.id === lid);
      const isCorrect = item && rid === item.match;
      conn.removeClass("conn-active");
      conn.addClass(isCorrect ? "conn-correct" : "conn-incorrect");

      if (!isCorrect) {
        const leftEl  = this.container.querySelector(`[data-src-id="${lid}"][data-group="left"]`);
        const rightEl = this.container.querySelector(`[data-src-id="${rid}"][data-group="right"]`);
        if (leftEl)  this._addSparks(leftEl, "right");
        if (rightEl) this._addSparks(rightEl, "left");
      }
    }

    this.jsp.repaintEverything();
    this.container.querySelectorAll(".cabling-pill").forEach(el => el.classList.add('is-validated'));
    return { status: "validated", ...this.getState() };
  }

  reset() {
    this.validated = false;
    this._clearActive();
    if (this.jsp) {
      this._connMap.forEach(c => {
        c.removeClass("conn-correct conn-incorrect");
        try { this.jsp.deleteConnection(c); } catch {}
      });
    }
    this.connections = {};
    this._connMap.clear();
    this._sparks.forEach(s => s.remove());
    this._sparks = [];
    this.container.querySelectorAll(".cabling-pill").forEach(el => el.classList.remove('is-active', 'is-validated'));
    return { status: "hidden", ...this.getState() };
  }

  clearValidation() {
    this.validated = false;
    this._clearActive();
    if (this.jsp) this._connMap.forEach(c => c.removeClass("conn-correct conn-incorrect"));
    this._sparks.forEach(s => s.remove());
    this._sparks = [];
    this.container.querySelectorAll(".cabling-pill").forEach(el => el.classList.remove('is-active', 'is-validated'));
    return { status: "hidden", ...this.getState() };
  }

  getState() {
    let score = 0;
    this.leftItems.forEach(it => { if (this.connections[it.id] === it.match) score++; });
    return { score, total: this.leftItems.length, connections: { ...this.connections } };
  }

  destroy() {
    if (this._resizeHandler) window.removeEventListener("resize", this._resizeHandler);
    if (this.jsp) { this.jsp.destroy(); this.jsp = null; }
  }
}
