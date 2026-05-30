window.ui.atom = {
  button: (content, {status = 'primary', icon} = {}) => {
    const btn = document.createElement('button');
    btn.className = `atom-btn ${status === 'secondary' ? 'is-secondary' : ''}`;
    if (icon) {
      const iconSpan = document.createElement('span');
      iconSpan.innerText = icon;
      btn.appendChild(iconSpan);
    }
    const text = document.createElement('span');
    text.innerText = content;
    btn.appendChild(text);
    return btn;
  },
  label: (text) => {
    const label = document.createElement('span');
    label.className = 'atom-label';
    label.innerText = text;
    return label;
  },
  badge: (text) => {
    const badge = document.createElement('span');
    badge.className = 'atom-badge';
    badge.innerText = text;
    return badge;
  },
  input: ({value = '', placeholder = '', type = 'text'} = {}) => {
    const input = document.createElement('input');
    input.className = 'atom-input';
    input.type = type;
    input.value = value;
    input.placeholder = placeholder;
    return input;
  },
  textarea: ({value = '', rows = 3, placeholder = ''} = {}) => {
    const textarea = document.createElement('textarea');
    textarea.className = 'atom-textarea';
    textarea.rows = rows;
    textarea.value = value;
    textarea.placeholder = placeholder;
    return textarea;
  },
  select: ({options, value} = {}) => {
    const select = document.createElement('select');
    select.className = 'atom-select';
    const isObjectOptions = !Array.isArray(options);
    const keys = isObjectOptions ? Object.keys(options) : options;
    keys.forEach(key => {
      const option = document.createElement('option');
      option.value = key;
      option.innerText = isObjectOptions ? options[key] : key;
      if (key == value) option.selected = true;
      select.appendChild(option);
    });
    return select;
  }
};
