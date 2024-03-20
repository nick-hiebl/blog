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

document.addEventListener('DOMContentLoaded', () => {
  const page1 = document.getElementById('page-1')
  const page2 = document.getElementById('page-2')
  const page3 = document.getElementById('page-3')
  const container = document.getElementById('scrolling-images')
  const children = Array.from(container.childNodes).filter(t => t instanceof HTMLImageElement)
  children.forEach(preload)

  for (let i = 0; i < children.length; i++) {
    const delay = i - children.length
    children[i].style['animation-delay'] = `${delay}s`
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
    children.forEach(t => t.classList.add('gray'))
    page1.classList.remove('hidden')
    page3.classList.add('hidden')
  })
})
