window.ui.atom.terminal = ({header, height = '250px'} = {}) => {
  const container = document.createElement('div');
  container.className = 'atom-terminal';

  const head = document.createElement('div');
  head.className = 'terminal-header';

  ['red', 'yellow', 'green'].forEach(c => {
    const dot = document.createElement('span');
    dot.className = `terminal-dot is-${c}`;
    head.appendChild(dot);
  });

  if (header) {
    const title = document.createElement('span');
    title.className = 'terminal-title';
    title.innerText = header;
    head.appendChild(title);
  }

  const body = document.createElement('div');
  body.className = 'terminal-body';
  body.style.setProperty('--terminal-height', height);

  container.appendChild(head);
  container.appendChild(body);
  container.body = body;

  const scrollToBottom = () => {
    body.scrollTop = body.scrollHeight;
  };

  container.addLine = (text, type = '') => {
    const line = document.createElement('span');
    line.className = `terminal-line ${type}`;
    line.innerHTML = text;
    body.appendChild(line);
    scrollToBottom();
    return line;
  };

  container.addLabel = (text, type = '') => {
    const typeClass = type ? `is-${type}` : '';
    return `<span class="terminal-label ${typeClass}">${text}</span>`;
  };

  container.addProgress = (label, initialPercentage = 0, type = 'scan') => {
    const line = document.createElement('span');
    line.className = `terminal-line ${type}`;
    body.appendChild(line);
    scrollToBottom();

    const render = (percentage, text = '') => {
      const bars = 12;
      const p = Math.max(0, Math.min(100, percentage));
      const activeBars = Math.floor((p / 100) * bars);
      const progressStr = "█".repeat(activeBars) + "░".repeat(bars - activeBars);
      line.innerHTML = `> [${label}] ${progressStr} ${p}% ${text}`;
    };

    render(initialPercentage);

    return {
      update: (percentage, text = '') => {
        render(percentage, text);
      },
      remove: () => line.remove()
    };
  };

  container.addSpinner = (label, type = 'system') => {
    const line = document.createElement('span');
    line.className = `terminal-line ${type}`;
    body.appendChild(line);
    scrollToBottom();

    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;
    line.innerHTML = `> ${frames[i]} ${label}`;

    const interval = setInterval(() => {
      i = (i + 1) % frames.length;
      line.innerHTML = `> ${frames[i]} ${label}`;
    }, 80);

    return {
      update: (newLabel) => { label = newLabel; },
      stop: (finalText = '', finalType = type) => {
        clearInterval(interval);
        if (finalText) {
          line.innerHTML = `> ${finalText}`;
          line.className = `terminal-line ${finalType}`;
        } else {
          line.remove();
        }
      }
    };
  };

  container.clear = () => {
    body.innerHTML = '';
  };

  return container;
};

// Backwards compatibility alias
window.ui.org.terminal = window.ui.atom.terminal;
