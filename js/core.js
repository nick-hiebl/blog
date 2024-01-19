const DARK_MODE_CLASS = 'dark-mode';
const DARK_MODE_LOCAL_STORAGE_KEY = 'isDarkMode';

const createDivWithId = (id) => {
  const newDiv = document.createElement('div');
  newDiv.id = id;

  return newDiv;
}

const getSubcategory = () => {
  const path = location.pathname;
  const [_empty, _blog, group] = path.split('/');

  const map = {
    rpg: 'rpg',
    meta: 'meta',
    dev: 'dev',
  };

  return map[group] || 'home';
}

const getSubcategoryHomeHref = () => {
  const cat = getSubcategory();

  return {
    rpg: '/blog/rpg/',
    meta: '/blog/meta/',
    dev: '/blog/dev/',
    home: '/blog/',
  }[cat];
}

const getSubcategoryLogo = () => {
  const cat = getSubcategory();

  if (cat === 'home') {
    const brand = document.createElement('strong');
    brand.classList.add('brand');
    brand.textContent = 'home';
    return brand;
  } else if (cat === 'rpg') {
    const brand = document.createElement('strong');
    brand.classList.add('brand');
    brand.textContent = 'RPG';
    return brand;
  } else if (cat === 'meta') {
    const brand = document.createElement('code');
    brand.classList.add('monospace');
    brand.textContent = 'meta';
    return brand;
  } else {
    return document.createTextNode('');
  }
}

const createHeader = () => {
  const header = document.createElement('header');
  header.id = 'header';

  const toggleButton = document.createElement('button');
  toggleButton.textContent = 'Toggle dark mode';

  toggleButton.addEventListener('click', () => {
    const isDark = document.body.classList.contains(DARK_MODE_CLASS);
    document.body.classList.toggle(DARK_MODE_CLASS);
    try {
      localStorage.setItem(DARK_MODE_LOCAL_STORAGE_KEY, !isDark);
    } catch {
      console.warn('Error occurred saving dark mode setting to local storage');
    }
  });

  const logoLink = document.createElement('a');
  logoLink.href = getSubcategoryHomeHref();

  const logo = document.createElement('h1');
  logo.classList.add('logo');

  const brand = getSubcategoryLogo();
  logo.appendChild(brand);
  logo.appendChild(document.createTextNode(' Jumpoy blog'));

  logoLink.appendChild(logo);

  header.appendChild(logoLink);
  header.appendChild(toggleButton);

  return header;
}

// const createLeftPanel = () => {
//   return createDivWithId('left-panel');
// }

const createRightPanel = () => {
  return createDivWithId('right-panel');
}

const mainFunction = () => {
  try {
    const isDark = localStorage.getItem(DARK_MODE_LOCAL_STORAGE_KEY) || false;
    if (isDark) {
      document.body.classList.add(DARK_MODE_CLASS);
    }
  } catch {
    console.warn('Error occurred in reading dark mode setting from local storage');
  }
  const core = document.getElementById('core');

  const content = createDivWithId('content');
  const page = createDivWithId('page');

  content.appendChild(core);

  page.appendChild(createHeader());
  // page.appendChild(createLeftPanel());
  page.appendChild(content);
  page.appendChild(createRightPanel());

  document.body.appendChild(page);
}

document.addEventListener('DOMContentLoaded', mainFunction);
