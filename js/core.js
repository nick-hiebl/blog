const createDivWithId = (id) => {
  const newDiv = document.createElement('div');
  newDiv.id = id;

  return newDiv;
}

const createHeader = () => {
  const header = document.createElement('header');
  header.id = 'header';

  const toggleButton = document.createElement('button');
  toggleButton.textContent = 'Toggle dark mode';

  toggleButton.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
  });

  header.appendChild(toggleButton);

  return header;
}

const createLeftPanel = () => {
  return createDivWithId('left-panel');
}

const createRightPanel = () => {
  return createDivWithId('right-panel');
}

const mainFunction = () => {
  const core = document.getElementById('core');

  const content = createDivWithId('content');
  const page = createDivWithId('page');

  content.appendChild(core);

  page.appendChild(createHeader());
  page.appendChild(createLeftPanel());
  page.appendChild(content);
  page.appendChild(createRightPanel());

  document.body.appendChild(page);
}

document.addEventListener('DOMContentLoaded', mainFunction);
