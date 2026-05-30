window.ui.mol = {
  slider: ({label, labels, value = 0, min = 0, max = 3, step = 1, state}) => {
    const container = document.createElement('div');
    container.className = 'mol-slider';
    // Use explicit state if provided, otherwise fallback to value for backward compatibility
    const colorState = state !== undefined ? state : value;
    container.setAttribute('data-state', colorState);

    const header = document.createElement('div');
    header.className = 'slider-header';

    const labelEl = window.ui.atom.label(label);
    const badgeEl = window.ui.atom.badge(labels ? labels[value] : value);

    header.appendChild(labelEl);
    header.appendChild(badgeEl);

    const input = document.createElement('input');
    input.type = 'range';
    input.min = min;
    input.max = max;
    input.step = step;
    input.value = value;
    input.className = 'premium-slider'; // Keep for track styling

    container.appendChild(header);
    container.appendChild(input);

    if (labels) {
      const ticks = document.createElement('div');
      ticks.className = 'slider-ticks';
      labels.forEach(l => {
        const span = document.createElement('span');
        span.innerText = l;
        ticks.appendChild(span);
      });
      container.appendChild(ticks);
    }

    input.oninput = () => {
      // Maintain the color state even when value changes
      container.setAttribute('data-state', state !== undefined ? state : input.value);
      badgeEl.innerText = labels ? labels[input.value] : input.value;
      container.value = step % 1 === 0 ? parseInt(input.value) : parseFloat(input.value);
      container.dispatchEvent(new CustomEvent("input"));
    };

    container.value = value;
    return container;
  },
  toggle: ({label, options, value, states, layout = 'horizontal'}) => {
    const container = document.createElement('div');
    container.className = `mol-toggle ${layout === 'horizontal' ? 'is-horizontal' : ''}`;

    if (label) container.appendChild(window.ui.atom.label(label));

    const group = document.createElement('div');
    group.className = 'toggle-group';

    const isObjectOptions = !Array.isArray(options);
    const keys = isObjectOptions ? Object.keys(options) : options;

    keys.forEach(key => {
      const displayValue = isObjectOptions ? options[key] : key;
      const btn = document.createElement('button');
      btn.className = `toggle-option ${key === value ? 'active' : ''}`;

      // Semantic states
      if (states && states[key]) {
        btn.setAttribute('data-state', states[key]);
      }

      btn.innerText = displayValue;
      btn.onclick = () => {
        group.querySelectorAll('.toggle-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        container.value = key;
        container.dispatchEvent(new CustomEvent("input"));
      };
      group.appendChild(btn);
    });

    container.appendChild(group);
    container.value = value;
    return container;
  },
  checkbox: ({label, value = false}) => {
    const container = document.createElement('div');
    container.className = 'mol-checkbox';

    const btn = document.createElement('button');
    btn.className = `checkbox-toggle ${value ? 'is-active' : ''}`;

    const icon = document.createElement('span');
    icon.className = 'checkbox-icon';
    icon.innerText = value ? '✓' : '';

    const text = document.createElement('span');
    text.className = 'checkbox-text';
    text.innerText = label;

    btn.appendChild(icon);
    btn.appendChild(text);

    btn.onclick = () => {
      const newValue = !container.value;
      container.value = newValue;
      btn.classList.toggle('is-active', newValue);
      icon.innerText = newValue ? '✓' : '';
      container.dispatchEvent(new CustomEvent("input"));
    };

    container.appendChild(btn);
    container.value = value;
    return container;
  },
  slider_vertical: ({label, value = 0, min = 0, max = 100, step = 1, color = window.theme.blue, unit = '', height = '200px'}) => {
    const container = document.createElement('div');
    container.className = 'mol-slider-vertical';
    container.style.minHeight = height;
    container.style.setProperty('--current-color', color);

    const header = document.createElement('div');
    header.className = 'slider-header';
    header.appendChild(window.ui.atom.label(label));
    
    const valueDisplay = document.createElement('div');
    valueDisplay.className = 'slider-value';
    valueDisplay.innerText = value + unit;
    header.appendChild(valueDisplay);
    container.appendChild(header);

    const trackContainer = document.createElement('div');
    trackContainer.className = 'slider-track-container';
    
    const fill = document.createElement('div');
    fill.className = 'slider-fill';
    const updateFill = (v) => {
      const pct = ((v - min) / (max - min)) * 100;
      fill.style.height = pct + '%';
    };
    updateFill(value);
    trackContainer.appendChild(fill);

    const input = document.createElement('input');
    input.type = 'range';
    input.className = 'slider-input';
    input.min = min;
    input.max = max;
    input.step = step;
    input.value = value;
    trackContainer.appendChild(input);
    container.appendChild(trackContainer);

    input.oninput = () => {
      const v = step % 1 === 0 ? parseInt(input.value) : parseFloat(input.value);
      updateFill(v);
      valueDisplay.innerText = (step % 1 === 0 ? v : v.toFixed(2)) + unit;
      container.value = v;
      container.dispatchEvent(new CustomEvent("input"));
    };

    container.value = value;
    return container;
  },
  thermometer: ({label, value = 0.7, min = 0, max = 2, step = 0.01, height = '220px'}) => {
    const container = document.createElement('div');
    container.className = 'mol-thermometer';
    container.style.minHeight = height;

    const header = document.createElement('div');
    header.className = 'slider-header';
    header.appendChild(window.ui.atom.label(label));
    const valueDisplay = document.createElement('div');
    valueDisplay.className = 'slider-value';
    header.appendChild(valueDisplay);
    container.appendChild(header);

    const trackContainer = document.createElement('div');
    trackContainer.className = 'slider-track-container';
    
    // Frost overlay
    const frost = document.createElement('div');
    frost.className = 'frost-overlay';
    trackContainer.appendChild(frost);

    // Ticks
    const ticks = document.createElement('div');
    ticks.className = 'thermometer-ticks';
    for (let i = 0; i < 6; i++) {
      const tick = document.createElement('div');
      tick.className = 'tick';
      ticks.appendChild(tick);
    }
    trackContainer.appendChild(ticks);

    const fill = document.createElement('div');
    fill.className = 'slider-fill';
    trackContainer.appendChild(fill);

    const input = document.createElement('input');
    input.type = 'range';
    input.className = 'slider-input';
    input.min = min;
    input.max = max;
    input.step = step;
    input.value = value;
    trackContainer.appendChild(input);
    container.appendChild(trackContainer);

    const bulb = document.createElement('div');
    bulb.className = 'thermometer-bulb';
    
    const bulbIcon = document.createElement('i');
    bulbIcon.className = 'bi';
    bulbIcon.style.cssText = `
      color: rgba(255, 255, 255, 0.9);
      font-size: 1.6rem;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    `;
    bulb.appendChild(bulbIcon);
    container.appendChild(bulb);

    const update = (v) => {
      const pct = ((v - min) / (max - min)) * 100;
      fill.style.height = Math.max(5, pct) + "%";
      
      // Dynamic colors and effects
      if (v < 0.4) {
        container.style.setProperty('--current-color', window.theme.blue);
        container.classList.add('is-cold');
        bulbIcon.className = 'bi bi-snow';
      } else if (v > 1.4) {
        container.style.setProperty('--current-color', window.theme.red);
        container.classList.remove('is-cold');
        bulbIcon.className = 'bi bi-fire';
      } else {
        container.style.setProperty('--current-color', window.theme.green);
        container.classList.remove('is-cold');
        bulbIcon.className = 'bi bi-thermometer-half';
      }

      valueDisplay.innerText = v.toFixed(2);
      container.value = v;
      container.dispatchEvent(new CustomEvent("input"));
    };

    input.oninput = () => update(parseFloat(input.value));
    update(value);

    return container;
  },
  blade_slider: ({label, value = 8, min = 1, max = 8, height = '220px'}) => {
    const container = document.createElement('div');
    container.className = 'mol-blade-slider';
    container.style.minHeight = height;

    const header = document.createElement('div');
    header.className = 'slider-header';
    header.appendChild(window.ui.atom.label(label));
    const valueDisplay = document.createElement('div');
    valueDisplay.className = 'slider-value';
    header.appendChild(valueDisplay);
    container.appendChild(header);

    const trackContainer = document.createElement('div');
    trackContainer.className = 'slider-track-container';

    const segmentsContainer = document.createElement('div');
    segmentsContainer.className = 'blade-segments';
    const segments = [];
    for (let i = 0; i < max; i++) {
      const seg = document.createElement('div');
      seg.className = 'segment';
      segmentsContainer.appendChild(seg);
      segments.push(seg);
    }
    trackContainer.appendChild(segmentsContainer);

    const blade = document.createElement('div');
    blade.className = 'blade-handle';
    trackContainer.appendChild(blade);

    const input = document.createElement('input');
    input.type = 'range';
    input.className = 'slider-input';
    input.min = min;
    input.max = max;
    input.step = 1;
    input.value = value;
    trackContainer.appendChild(input);
    container.appendChild(trackContainer);

    const update = (v) => {
      const pct = (v / max) * 100;
      blade.style.top = pct + '%';
      
      segments.forEach((seg, i) => {
        // Active segments are now counted from the bottom
        seg.classList.toggle('is-active', i < v);
      });
      
      valueDisplay.innerText = v;
      container.value = v;
      container.dispatchEvent(new CustomEvent("input"));
    };

    input.oninput = () => update(parseInt(input.value));
    update(value);

    return container;
  },
  slider_radial: ({label, value = 0, min = 0, max = 100, step = 1, color = window.theme.yellow, unit = '', size = 100}) => {
    const container = document.createElement('div');
    container.className = 'mol-slider-radial';
    container.style.setProperty('--current-color', color);
    
    if (label) container.appendChild(window.ui.atom.label(label));

    const radialContainer = document.createElement('div');
    radialContainer.className = 'radial-container';
    radialContainer.style.width = size + 'px';
    radialContainer.style.height = size + 'px';

    const r = (size / 2) - 10;
    const circ = 2 * Math.PI * r;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "radial-svg");
    svg.setAttribute("viewBox", `0 0 ${size} ${size}`);

    const track = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    track.setAttribute("class", "radial-track");
    track.setAttribute("cx", size / 2);
    track.setAttribute("cy", size / 2);
    track.setAttribute("r", r);
    svg.appendChild(track);

    const progress = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    progress.setAttribute("class", "radial-progress");
    progress.setAttribute("cx", size / 2);
    progress.setAttribute("cy", size / 2);
    progress.setAttribute("r", r);
    progress.style.strokeDasharray = circ;
    
    const updateProgress = (v) => {
      const pct = (v - min) / (max - min);
      progress.style.strokeDashoffset = circ * (1 - pct);
    };
    
    svg.appendChild(progress);
    radialContainer.appendChild(svg);

    const center = document.createElement('div');
    center.className = 'radial-center';
    const valueDisplay = document.createElement('div');
    valueDisplay.className = 'radial-value';
    center.appendChild(valueDisplay);
    radialContainer.appendChild(center);
    container.appendChild(radialContainer);

    const update = (v) => {
      v = Math.max(min, Math.min(max, v));
      if (step) v = Math.round(v / step) * step;
      
      updateProgress(v);
      valueDisplay.innerText = (step % 1 === 0 ? v : v.toFixed(2)) + unit;
      container.value = v;
      container.dispatchEvent(new CustomEvent("input"));
    };

    let isDragging = false;
    const handleMove = (e) => {
      if (!isDragging) return;
      const rect = radialContainer.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      
      // Calculate angle (0 at top, clockwise)
      let angle = Math.atan2(dy, dx) + Math.PI / 2;
      if (angle < 0) angle += 2 * Math.PI;
      
      const pct = angle / (2 * Math.PI);
      const v = min + pct * (max - min);
      update(v);
    };

    radialContainer.addEventListener('pointerdown', (e) => {
      isDragging = true;
      radialContainer.setPointerCapture(e.pointerId);
      handleMove(e);
    });

    radialContainer.addEventListener('pointermove', handleMove);
    
    radialContainer.addEventListener('pointerup', (e) => {
      isDragging = false;
      radialContainer.releasePointerCapture(e.pointerId);
    });

    update(value);
    return container;
  },
  field: ({label, element}) => {
    const container = document.createElement('div');
    container.className = 'mol-field';
    if (label) container.appendChild(window.ui.atom.label(label));
    container.appendChild(element);

    // Mirror value and events
    element.oninput = () => {
      container.value = element.value;
      container.dispatchEvent(new CustomEvent("input"));
    };
    container.value = element.value;
    return container;
  }
};
