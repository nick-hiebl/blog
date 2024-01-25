const generatorsData = new Map();

const registerGenerator = (name, itemList) => {
  generatorsData.set(name, itemList);
};

const RETRY_TIMEOUT = [1000, 1000, 3000, 5000, 10000];

const breakGenerator = (generator) => {
  generator.textContent = '🚫';
  generator.classList.add('disabled');
};

const setupGenerator = (generator, retries = 0) => {
  if (retries >= RETRY_TIMEOUT.length) {
    breakGenerator(generator);
    return;
  }

  const source = generator.getAttribute('data-generator-source');

  if (!source) {
    return;
  }

  if (!generatorsData.has(source)) {
    setTimeout(
      () => setupGenerator(generator, retries + 1),
      RETRY_TIMEOUT[retries],
    );
    generator.textContent = '⟳';
  }

  const data = generatorsData.get(source);
  generator.textContent = data[0];

  generator.addEventListener('click', () => {
    generator.textContent = data[Math.floor(Math.random() * data.length)];
  });
};

const mainGenerators = () => {
  const generators = document.querySelectorAll('button[data-generator]');

  generators.forEach(g => setupGenerator(g));
};

document.addEventListener('DOMContentLoaded', mainGenerators);
