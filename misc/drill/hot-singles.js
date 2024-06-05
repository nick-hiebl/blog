const timePromise = (ms) => {
  return new Promise(res => setTimeout(res, ms))
}

const loadingText = [
  'Analysing outgoing messages',
  'Analysing camera',
  'Analysing captured audio',
  'Analysing social media presence',
  'Analysing recorded behavioral metrics',
  'Analysing daily GPS activity',
  'Analysing web history',
]

function rand(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function preload(img) {
  const image = new Image()
  image.src = img.src
}

const imageNames = [
  './images/01.png',
  './images/02.png',
  './images/03.png',
  './images/04.png',
  './images/05.png',
  './images/06.png',
  './images/07.png',
  './images/08.png',
]

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('scrolling-images')
  const images = []

  imageNames.forEach(preload)

  const GROUP_COUNT = 1
  for (let i = 0; i < GROUP_COUNT; i++) {
    imageNames.forEach((name, index) => {
      const box = document.createElement('div')
      box.classList.add('moving-image')

      const image = document.createElement('img')
      image.src = name
      image.classList.add('single')
      images.push(image)

      box.appendChild(image)

      const delay = imageNames.length * GROUP_COUNT - i * imageNames.length - index

      box.style['animation-delay'] = `${-1.5 * delay}s`

      container.appendChild(box)
    })
  }
})
