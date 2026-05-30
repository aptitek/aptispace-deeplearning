window.ui.org.card = (content, {title, status = 'debug'} = {}) => {
  const container = document.createElement('div');
  container.className = `org-card is-${status}`;
  if (title) {
    const header = document.createElement('div');
    header.className = 'card-header';
    header.innerText = title;
    container.appendChild(header);
  }
  const body = document.createElement('div');
  body.className = 'card-body';
  if (content instanceof HTMLElement) {
    body.appendChild(content);
  } else {
    body.innerHTML = content;
  }
  container.appendChild(body);
  return container;
};
