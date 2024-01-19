const list = ['/blog/meta/2024/01/first-post'];

const aggregateChildren = () => {
  const core = document.getElementById('core');

  for (const href of list) {
    const div = document.createElement('div');
    const frame = document.createElement('iframe');
    frame.src = href;

    frame.onload = () => {
      const inner = frame.contentWindow.document;
      const innerCore = inner.getElementById('core');

      div.removeChild(frame);
      div.appendChild(innerCore);

      const links = innerCore.getElementsByTagName('a');

      for (const link of Array.from(links)) {
        if (link.href === '' || link.href.endsWith('/blog/')) {
          link.href = href;
        }      }
    };

    div.appendChild(frame);
    
    core.appendChild(div);
  }
}

document.addEventListener('DOMContentLoaded', aggregateChildren);
