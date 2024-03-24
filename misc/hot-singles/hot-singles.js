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
  const page1 = document.getElementById('page-1')
  const page2 = document.getElementById('page-2')
  const page3 = document.getElementById('page-3')
  const container = document.getElementById('scrolling-images')
  const images = []
  const clovers = []

  imageNames.forEach(preload)

  let cloversAdded = false

  const GROUP_COUNT = 3
  for (let i = 0; i < GROUP_COUNT; i++) {
    imageNames.forEach((name, index) => {
      const box = document.createElement('div')
      box.classList.add('moving-image')

      const image = document.createElement('img')
      image.src = name
      image.classList.add('single')
      images.push(image)

      const clover = document.createElement('img')
      clover.src = './images/clover.png'
      clover.classList.add('clover')
      clovers.push(clover)

      box.appendChild(image)
      box.appendChild(clover)

      const delay = imageNames.length * GROUP_COUNT - i * imageNames.length - index

      box.style['animation-delay'] = `${-delay}s`

      container.appendChild(box)
    })
  }

  const button = document.getElementById('button')

  button.addEventListener('click', async () => {
    page1.classList.add('hidden')
    page2.classList.remove('hidden')
    await timePromise(50)
    document.getElementById('loading-content').classList.add('loading-grow')

    const texter = document.getElementById('loading-text')
    for (let i = 0; i < 3; i++) {
      texter.textContent = rand(loadingText.filter(t => t !== texter.textContent))
      await timePromise(2000)
    }

    await timePromise(300)
    page2.classList.add('hidden')
    page3.classList.remove('hidden')
    document.getElementById('loading-content').classList.remove('loading-grow')
  })

  document.getElementById('quit').addEventListener('click', async () => {
    button.classList.add('hidden')
    document.getElementById('reveal').classList.remove('hidden')
    images.forEach(t => t.classList.add('gray'))
    page1.classList.remove('hidden')
    page3.classList.add('hidden')
  })

  document.getElementById('clover-trigger').addEventListener('click', () => {
    clovers.forEach(clover => clover.classList.toggle('visible'))
  })
})
