const DARK_MODE_CLASS = 'dark-mode';
const DARK_MODE_LOCAL_STORAGE_KEY = 'isDarkMode';

const BLOG_LIST_FETCH_URL = '/blog/data/blog_list.json';

let blogListFetch = null;

const getBlogList = async (category) => {
  if (!blogListFetch) {
    blogListFetch = fetch(BLOG_LIST_FETCH_URL)
      .then(res => res.json());
  }

  const blogs = await blogListFetch;

  return blogs.filter(item => !category || item.category === category);
}

const aggregateArticles = async () => {
  const articleList = document.getElementById('articles-list');

  if (!articleList) {
    return;
  }

  const list = await getBlogList(articleList.getAttribute('data-category'));

  for (const { href } of list) {
    const item = document.createElement('li');
    const frame = document.createElement('iframe');
    frame.classList.add('loading-blog-post');
    frame.src = href;

    frame.onload = () => {
      const inner = frame.contentWindow.document;
      const article = inner.querySelector('article#content');

      item.removeChild(frame);
      item.appendChild(article);

      const links = article.querySelectorAll('a[data-headline]');

      for (const link of Array.from(links)) {
        link.href = href;
      }
    };

    item.appendChild(frame);

    articleList.appendChild(item);
  }
};

const aggregateBlogLinks = async () => {
  const linkList = document.getElementById('blogs-links-list');

  if (!linkList) {
    return;
  }

  const list = await getBlogList(linkList.getAttribute('data-category'));

  const listElement = document.createElement('ul');

  for (const { href, title, date } of list) {
    const item = document.createElement('li');

    const link = document.createElement('a');
    link.href = href;
    link.textContent = title;

    const time = document.createElement('time');
    const timestamp = new Date(date);

    time.textContent = timestamp.toLocaleDateString();

    item.appendChild(link);
    item.appendChild(document.createTextNode(' '));
    item.appendChild(time);

    listElement.appendChild(item);
  }

  linkList.appendChild(listElement);
};

const mainAggregation = () => {
  aggregateArticles();
  aggregateBlogLinks();
};

const mainFunction = () => {
  try {
    const isDark = localStorage.getItem(DARK_MODE_LOCAL_STORAGE_KEY) === 'true' || false;

    if (isDark) {
      document.body.classList.add(DARK_MODE_CLASS);
    }
  } catch {
    console.warn('Error occurred in reading dark mode setting from local storage');
  }

  document.getElementById('toggle-theme').addEventListener('click', () => {
    const isDark = document.body.classList.contains(DARK_MODE_CLASS);
    document.body.classList.toggle(DARK_MODE_CLASS);
    try {
      if (isDark) {
        localStorage.removeItem(DARK_MODE_LOCAL_STORAGE_KEY);
      } else {
        localStorage.setItem(DARK_MODE_LOCAL_STORAGE_KEY, "true");
      }
    } catch {
      console.warn('Error occurred saving dark mode setting to local storage');
    }
  });

  mainAggregation();
}

document.addEventListener('DOMContentLoaded', mainFunction);
