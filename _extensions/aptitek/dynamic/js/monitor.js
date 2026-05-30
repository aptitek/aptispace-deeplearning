window.ui = window.ui || {};
window.ui.org = window.ui.org || {};

window.ui.org.monitor = ({ header, height = 'auto' } = {}) => {
  const container = document.createElement('div');
  container.className = 'org-monitor';
  if (height !== 'auto') {
    container.style.minHeight = height;
  }

  if (header) {
    const head = document.createElement('div');
    head.className = 'monitor-header';

    const title = document.createElement('span');
    title.className = 'monitor-title';
    title.innerText = header;
    head.appendChild(title);
    container.appendChild(head);
  }

  const grid = document.createElement('div');
  grid.className = 'monitor-grid';
  container.appendChild(grid);

  // Expose grid to allow custom appends if needed
  container.body = grid;

  // 1. Value (like BPE)
  container.addValue = (label, value, { comment = '', color = window.theme.blue } = {}) => {
    const el = document.createElement('div');
    el.className = 'mol-stat-card';
    el.style.setProperty('--card-color', color);

    const labelEl = document.createElement('div');
    labelEl.className = 'stat-label';
    labelEl.innerText = label;

    const valueEl = document.createElement('div');
    valueEl.className = 'stat-value';
    valueEl.style.color = color;
    valueEl.innerText = value;

    el.appendChild(labelEl);
    el.appendChild(valueEl);

    const commentEl = document.createElement('div');
    commentEl.className = 'stat-comment';
    commentEl.innerText = comment;
    el.appendChild(commentEl);

    grid.appendChild(el);

    return {
      el,
      update: (newVal, newComment) => {
        valueEl.innerText = newVal;
        if (newComment !== undefined) {
          commentEl.innerText = newComment;
        }
      }
    };
  };

  // 2. Versus (competing values)
  container.addVersus = (label, valA, valB, { labelA = 'A', labelB = 'B', colorA = window.theme.blue, colorB = window.theme.red } = {}) => {
    const el = document.createElement('div');
    el.className = 'mol-versus-card';

    const header = document.createElement('div');
    header.className = 'versus-header';
    header.innerText = label;

    const valuesCont = document.createElement('div');
    valuesCont.className = 'versus-values';

    const left = document.createElement('div');
    left.className = 'v-left';
    left.style.color = colorA;
    left.innerHTML = `<span class="v-val">${valA}</span><span class="v-lbl">${labelA}</span>`;

    const right = document.createElement('div');
    right.className = 'v-right';
    right.style.color = colorB;
    right.innerHTML = `<span class="v-lbl">${labelB}</span><span class="v-val">${valB}</span>`;

    valuesCont.appendChild(left);
    valuesCont.appendChild(right);

    const bar = document.createElement('div');
    bar.className = 'versus-bar';
    const fillA = document.createElement('div');
    fillA.className = 'v-fill-a';
    fillA.style.background = colorA;
    const fillB = document.createElement('div');
    fillB.className = 'v-fill-b';
    fillB.style.background = colorB;

    bar.appendChild(fillA);
    bar.appendChild(fillB);

    const updateBars = (a, b) => {
      const total = (a + b) || 1;
      const pctA = (a / total) * 100;
      fillA.style.width = pctA + '%';
      fillB.style.width = (100 - pctA) + '%';
    };

    updateBars(valA, valB);

    el.appendChild(header);
    el.appendChild(valuesCont);
    el.appendChild(bar);

    grid.appendChild(el);

    return {
      el,
      update: (newA, newB) => {
        left.querySelector('.v-val').innerText = newA;
        right.querySelector('.v-val').innerText = newB;
        updateBars(newA, newB);
      }
    };
  };

  // 3. Comparison (Ratio focus, can be > 1)
  container.addComparison = (label, valA, valB, { labelA = 'Initial', labelB = 'Final', colorA = window.theme.blue, colorB = window.theme.green } = {}) => {
    const el = document.createElement('div');
    el.className = 'mol-ratio-card';

    const header = document.createElement('div');
    header.className = 'ratio-header';
    header.innerText = label;

    const body = document.createElement('div');
    body.className = 'ratio-body';

    const left = document.createElement('div');
    left.className = 'r-box r-left';
    left.style.setProperty('--r-color', colorA);
    left.innerHTML = `<div class="r-label">${labelA}</div><div class="r-val">${valA}</div>`;

    const center = document.createElement('div');
    center.className = 'r-center';
    const ratioEl = document.createElement('div');
    ratioEl.className = 'r-multiplier';
    center.appendChild(ratioEl);

    const right = document.createElement('div');
    right.className = 'r-box r-right';
    right.style.setProperty('--r-color', colorB);
    right.innerHTML = `<div class="r-label">${labelB}</div><div class="r-val">${valB}</div>`;

    body.appendChild(left);
    body.appendChild(center);
    body.appendChild(right);

    const bars = document.createElement('div');
    bars.className = 'ratio-bars';
    const barA = document.createElement('div');
    barA.className = 'r-bar r-bar-a';
    barA.style.background = colorA;
    const barB = document.createElement('div');
    barB.className = 'r-bar r-bar-b';
    barB.style.background = colorB;
    bars.appendChild(barA);
    bars.appendChild(barB);

    const updateUI = (a, b) => {
      const ratio = (b / (a || 1));
      ratioEl.innerText = 'x' + ratio.toFixed(1);
      if (ratio > 1) ratioEl.classList.add('is-gain');
      else ratioEl.classList.remove('is-gain');

      const max = Math.max(a, b) || 1;
      barA.style.width = (a / max * 100) + '%';
      barB.style.width = (b / max * 100) + '%';
    };

    updateUI(valA, valB);

    el.appendChild(header);
    el.appendChild(body);
    el.appendChild(bars);
    grid.appendChild(el);

    return {
      el,
      update: (newA, newB) => {
        left.querySelector('.r-val').innerText = newA;
        right.querySelector('.r-val').innerText = newB;
        updateUI(newA, newB);
      }
    };
  };

  // 3. Status (semantic alerts)
  container.addStatus = (label, statusText, level = 'info', { comment = '' } = {}) => {
    const el = document.createElement('div');
    el.className = `mol-status-card is-${level}`;

    const labelEl = document.createElement('div');
    labelEl.className = 'status-label';
    labelEl.innerText = label;

    const textEl = document.createElement('div');
    textEl.className = 'status-text';
    textEl.innerText = statusText;

    const commentEl = document.createElement('div');
    commentEl.className = 'stat-comment';
    commentEl.style.marginTop = '4px';
    commentEl.innerText = comment;

    el.appendChild(labelEl);
    el.appendChild(textEl);
    el.appendChild(commentEl);

    grid.appendChild(el);

    return {
      el,
      update: (newText, newLevel, newComment) => {
        if (newText !== undefined) textEl.innerText = newText;
        if (newLevel) {
          el.className = `mol-status-card is-${newLevel}`;
        }
        if (newComment !== undefined) {
          commentEl.innerText = newComment;
        }
      }
    };
  };

  // 4. Vu-meter (LED style)
  container.addVuMeter = (label, value, { min = 0, max = 1, segments = 50 } = {}) => {
    const el = document.createElement('div');
    el.className = 'mol-vumeter';

    const labelCont = document.createElement('div');
    labelCont.className = 'vumeter-label-cont';
    const labelEl = document.createElement('span');
    labelEl.className = 'vumeter-label';
    labelEl.innerText = label;
    const valueEl = document.createElement('span');
    valueEl.className = 'vumeter-value';
    labelCont.appendChild(labelEl);
    labelCont.appendChild(valueEl);

    const bar = document.createElement('div');
    bar.className = 'vumeter-bar';

    for (let i = 0; i < segments; i++) {
      const seg = document.createElement('div');
      seg.className = 'vumeter-segment';
      bar.appendChild(seg);
    }

    const update = (v) => {
      const pct = Math.max(0, Math.min(1, (v - min) / (max - min)));
      valueEl.innerText = (pct * 100).toFixed(1) + '%';
      if (pct > 0.85) valueEl.classList.add('is-danger');
      else valueEl.classList.remove('is-danger');

      const activeCount = Math.floor(pct * segments);
      const segs = bar.children;
      for (let i = 0; i < segments; i++) {
        segs[i].className = 'vumeter-segment';
        if (i < activeCount) {
          if (i < segments * 0.6) segs[i].classList.add('active-green');
          else if (i < segments * 0.85) segs[i].classList.add('active-yellow');
          else segs[i].classList.add('active-red');
        }
      }
    };

    update(value);

    el.appendChild(labelCont);
    el.appendChild(bar);
    grid.appendChild(el);

    return {
      el,
      update: (newVal) => update(newVal)
    };
  };

  // 5. History (Area chart)
  container.addHistory = (label, data, { min = 0, max = 1, color = window.theme.blue } = {}) => {
    const el = document.createElement('div');
    el.className = 'mol-history-card';

    const labelEl = document.createElement('div');
    labelEl.className = 'history-label';
    labelEl.innerText = label;

    const chartCont = document.createElement('div');
    chartCont.className = 'history-container';

    const render = (d) => {
      chartCont.innerHTML = '';
      const P = window.Plot || (typeof Plot !== 'undefined' ? Plot : null);
      if (P) {
        const plot = P.plot({
          width: chartCont.clientWidth || 300,
          height: 120,
          style: { background: "transparent", color: window.theme.base01 },
          x: { axis: null },
          y: { domain: [min, max], axis: "right", ticks: 3, tickFormat: d => (d * 100).toFixed(0) + '%' },
          marks: [
            P.areaY(d, { x: "t", y: "v", fill: color, fillOpacity: 0.2, curve: "basis" }),
            P.lineY(d, { x: "t", y: "v", stroke: color, strokeWidth: 2, curve: "basis" })
          ]
        });
        chartCont.appendChild(plot);
      } else {
        chartCont.innerHTML = '<div class="history-fallback">PlotHQ non disponible</div>';
      }
    };

    el.appendChild(labelEl);
    el.appendChild(chartCont);
    grid.appendChild(el);

    // Initial render after a small delay to ensure container width
    setTimeout(() => render(data), 50);

    return {
      el,
      update: (newData) => render(newData)
    };
  };

  // 6. Pie Chart (SVG based)
  container.addPieChart = (label, data) => {
    const el = document.createElement('div');
    el.className = 'mol-piechart-card';

    const labelEl = document.createElement('div');
    labelEl.className = 'pie-label';
    labelEl.innerText = label;

    const chartCont = document.createElement('div');
    chartCont.className = 'pie-container';

    const legend = document.createElement('div');
    legend.className = 'pie-legend';

    const render = (d) => {
      chartCont.innerHTML = '';
      legend.innerHTML = '';

      const size = 120;
      const r = size / 2;
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", size);
      svg.setAttribute("height", size);
      svg.setAttribute("viewBox", `0 0 ${size} ${size}`);

      let total = d.reduce((acc, item) => acc + item.value, 0);
      if (total === 0) total = 1;

      let startAngle = 0;
      d.forEach(item => {
        const pct = item.value / total;
        const angle = pct * 2 * Math.PI;
        const endAngle = startAngle + angle;

        const x1 = r + r * Math.sin(startAngle);
        const y1 = r - r * Math.cos(startAngle);
        const x2 = r + r * Math.sin(endAngle);
        const y2 = r - r * Math.cos(endAngle);

        const largeArc = pct > 0.5 ? 1 : 0;
        const pathData = pct === 1
          ? `M ${r},${r} m -${r},0 a ${r},${r} 0 1,0 ${r * 2},0 a ${r},${r} 0 1,0 -${r * 2},0`
          : `M ${r},${r} L ${x1},${y1} A ${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`;

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", pathData);
        path.setAttribute("fill", item.color);
        path.setAttribute("stroke", window.theme.base02);
        path.setAttribute("stroke-width", "1");
        svg.appendChild(path);

        startAngle = endAngle;

        // Add to legend
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.innerHTML = `<span class="legend-color" style="background: ${item.color}"></span><span class="legend-name">${item.name}</span><span class="legend-value">${item.value}</span>`;
        legend.appendChild(legendItem);
      });

      // Donut hole
      const hole = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      hole.setAttribute("cx", r);
      hole.setAttribute("cy", r);
      hole.setAttribute("r", r * 0.6);
      hole.setAttribute("fill", window.theme.base02);
      svg.appendChild(hole);

      chartCont.appendChild(svg);
    };

    render(data);

    el.appendChild(labelEl);
    el.appendChild(chartCont);
    el.appendChild(legend);
    grid.appendChild(el);

    return {
      el,
      update: (newData) => render(newData)
    };
  };

  // 7. Progress Bar (smooth)
  container.addProgressBar = (label, value, { min = 0, max = 1, threshold = 0.5, colorGood = window.theme.green, colorBad = window.theme.red } = {}) => {
    const el = document.createElement('div');
    el.className = 'mol-progressbar-card';

    const labelCont = document.createElement('div');
    labelCont.className = 'progress-label-cont';
    const labelEl = document.createElement('span');
    labelEl.className = 'progress-label';
    labelEl.innerText = label;
    const valueEl = document.createElement('span');
    valueEl.className = 'progress-value';
    labelCont.appendChild(labelEl);
    labelCont.appendChild(valueEl);

    const track = document.createElement('div');
    track.className = 'progress-track';
    const fill = document.createElement('div');
    fill.className = 'progress-fill';
    track.appendChild(fill);

    const update = (v) => {
      const pct = Math.max(0, Math.min(1, (v - min) / (max - min)));
      valueEl.innerText = (pct * 100).toFixed(1) + '%';
      fill.style.width = (pct * 100) + '%';

      const isGood = pct >= threshold;
      fill.style.background = isGood ? colorGood : colorBad;
      fill.style.boxShadow = `0 0 10px ${isGood ? colorGood : colorBad}44`;
    };

    update(value);

    el.appendChild(labelCont);
    el.appendChild(track);
    grid.appendChild(el);

    return {
      el,
      update: (newVal) => update(newVal)
    };
  };

  container.clear = () => { grid.innerHTML = ''; };

  return container;
};

// Aliases for compatibility/consistency
window.ui.atom.monitor = window.ui.org.monitor;
window.ui.mol.stats = window.ui.org.monitor;
