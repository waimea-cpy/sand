const canvas = document.getElementById("canvas")
const ctx = canvas.getContext('2d');

const SCALE  = 5
const WIDTH  = Math.floor(1000 / SCALE)
const HEIGHT = Math.floor(600 / SCALE)

const sand = []

const EMPTY = 0
const SOLID = [255, 255, 255]

let imageData
let imageDataArray

let mouseX = 0
let mouseY = 0
let isLeftMouseDown = false
let isRightMouseDown = false
let isShiftDown = false

const targetFPS = 30;
const frameDelay = 1000 / targetFPS;

let hue = 0

const brush = [
                        [-1, -3], [ 0, -3], [ 1, -3],
              [-2, -2], [-1, -2], [ 0, -2], [ 1, -2], [ 2, -2],
    [-3, -1], [-2, -1], [-1, -1], [ 0, -1], [ 1, -1], [ 2, -1], [ 3, -1],
    [-3,  0], [-2,  0], [-1,  0], [ 0,  0], [ 1,  0], [ 2,  0], [ 3,  0],
    [-3,  1], [-2,  1], [-1,  1], [ 0,  1], [ 1,  1], [ 2,  1], [ 3,  1],
              [-2,  2], [-1,  2], [ 0,  2], [ 1,  2], [ 2,  2],
                        [-1,  3], [ 0,  3], [ 1,  3]
]

const hslToRgb = (h, s, l) => {
    // h: 0-360, s: 0-100, l: 0-100
    s /= 100
    l /= 100

    const c = (1 - Math.abs(2 * l - 1)) * s
    const x = c * (1 - Math.abs((h / 60) % 2 - 1))
    const m = l - c / 2

    let r, g, b

    if (h < 60) {
        [r, g, b] = [c, x, 0]
    } else if (h < 120) {
        [r, g, b] = [x, c, 0]
    } else if (h < 180) {
        [r, g, b] = [0, c, x]
    } else if (h < 240) {
        [r, g, b] = [0, x, c]
    } else if (h < 300) {
        [r, g, b] = [x, 0, c]
    } else {
        [r, g, b] = [c, 0, x]
    }

    return [
        Math.round((r + m) * 255),
        Math.round((g + m) * 255),
        Math.round((b + m) * 255)
    ]
}


const initCanvas = () => {
    canvas.width = WIDTH * SCALE
    canvas.height = HEIGHT * SCALE

    ctx.imageSmoothingEnabled = false  // Crisp pixels

    imageData = ctx.createImageData(WIDTH, HEIGHT)
    imageDataArray = imageData.data

    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            isLeftMouseDown = true
            isRightMouseDown = false
        }
        else if (e.button === 2) {
            isLeftMouseDown = false
            isRightMouseDown = true
            e.preventDefault()
        }
    })

    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault()
    })

    canvas.addEventListener('mouseup', () => {
        isLeftMouseDown = false
        isRightMouseDown = false
    })

    canvas.addEventListener('mouseleave', () => {
        isLeftMouseDown = false
        isRightMouseDown = false
    })

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect()
        mouseX = Math.floor((e.clientX - rect.left) / SCALE)
        mouseY = Math.floor((e.clientY - rect.top) / SCALE)
    })

    document.addEventListener('keydown', (e) => {
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
            isShiftDown = true
        }

        if (e.code === 'Space') {
            e.preventDefault()
            clearSand()
        }
    })

    document.addEventListener('keyup', (e) => {
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
            isShiftDown = false
        }
    })
}


class Action {
    constructor(mapping, action) {
        this.mapping = mapping
        this.action = action
    }
}

class Particle {
    constructor(type, col, actions) {
        this.type = type
        this.col = col
        this.actions = actions
    }

    update(grid) {
        this.actions.forEach(action => {

        })
    }
}




const initSand = () => {
    const cells = WIDTH * HEIGHT

    for(let cell = 0; cell < cells; cell++) {
        sand[cell] = EMPTY
    }
}

const clearSand = () => {
    for(let cell = 0; cell < sand.length; cell++) {
        if (!isShiftDown && sand[cell] !== SOLID) {
            sand[cell] = EMPTY
            continue
        }
        if (isShiftDown && sand[cell] === SOLID) {
            sand[cell] = EMPTY
            continue
        }
    }
}

const xyCell = (x, y) => {
    return (y * WIDTH) + x
}

const swapSand = (cell1, cell2) => {
    const val1 = sand[cell1]
    const val2 = sand[cell2]
    sand[cell1] = val2
    sand[cell2] = val1
}

const checkMouse = () => {
    if (isLeftMouseDown) {
        if (isShiftDown) {
            const cell = xyCell(mouseX, mouseY)
            sand[cell] = SOLID
            return
        }

        brush.forEach(([x, y]) => {
            const cell = xyCell(mouseX + x, mouseY + y)

            if (sand[cell] !== SOLID && Math.random() > 0.7) {
                const light = Math.floor(40 + Math.random() * 10)
                sand[cell] = hslToRgb(hue, 50, light)
            }

            if (Math.random() > 0.99) {
                hue = (hue + 1) % 360
            }
        })
        return
    }

    if (isRightMouseDown) {
        brush.forEach(([x, y]) => {
            sand[xyCell(mouseX + x, mouseY + y)] = EMPTY
        })
    }
}

let scanDirection = 1
const updateSand = () => {
    for (let y = HEIGHT - 1; y >= 0; y--) {
        scanDirection *= -1

        const start = scanDirection > 0 ? 0 : WIDTH - 1
        const end = scanDirection > 0 ? WIDTH : -1

        for (let x = start; x !== end; x += scanDirection) {
            const cell = xyCell(x, y)
            const cellBelow = cell + WIDTH

            if (sand[cell] === EMPTY || sand[cell] === SOLID) continue
            // if (sand[cellBelow] === SOLID) continue

            if (sand[cellBelow] === EMPTY) {
                swapSand(cell, cellBelow)
                continue
            }

            const tryLeftFirst = Math.random() < 0.5
            const diagonals = tryLeftFirst
                ? [cellBelow - 1, cellBelow + 1, cellBelow - 2, cellBelow + 2]
                : [cellBelow + 1, cellBelow - 1, cellBelow + 2, cellBelow - 2]
            const sides = tryLeftFirst
                ? [cell - 1, cell + 1, cell - 2, cell + 2]
                : [cell + 1, cell - 1, cell + 2, cell - 2]

            let swapped = false
            for (const diagonal of diagonals) {
                if (sand[diagonal] === EMPTY) {
                    swapSand(cell, diagonal)
                    swapped = true
                    break
                }
            }

            // if (!swapped) {
            //     for (const side of sides) {
            //         if (sand[side] === EMPTY) {
            //             swapSand(cell, side)
            //             break
            //         }
            //     }
            // }
        }
    }
}

const drawSand = () => {
    for (let i = 0; i < sand.length; i++) {
        const imageIndex = i * 4

        if (sand[i]) {
            [r, g, b] = sand[i]
        }
        else {
            [r, g, b] = [0, 0, 0]
        }

        imageDataArray[imageIndex + 0] = r
        imageDataArray[imageIndex + 1] = g
        imageDataArray[imageIndex + 2] = b
        imageDataArray[imageIndex + 3] = 255
    }

    ctx.putImageData(imageData, 0, 0)
    ctx.drawImage(
        canvas,
        0, 0, WIDTH, HEIGHT,
        0, 0, WIDTH * SCALE, HEIGHT * SCALE
    )
}

let lastTime = 0;
animate = (currentTime) => {
    checkMouse()
    updateSand()

    if (currentTime - lastTime >= frameDelay) {
        drawSand()
        lastTime = currentTime;
    }

    requestAnimationFrame(animate)
}


initCanvas()
initSand()
animate()
