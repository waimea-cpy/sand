const SCALE  = 5
const WIDTH  = Math.floor(800 / SCALE)
const HEIGHT = Math.floor(600 / SCALE)

const targetFPS = 30;
const frameDelay = 1000 / targetFPS;

const canvas = document.getElementById("canvas")
const ctx = canvas.getContext('2d');
let imageData
let imageDataArray

let mouseX = 0
let mouseY = 0
let isLeftMouseDown = false
let isRightMouseDown = false
let isShiftDown = false

let hue = 40

const brush = [
                        [-1, -3], [ 0, -3], [ 1, -3],
              [-2, -2], [-1, -2], [ 0, -2], [ 1, -2], [ 2, -2],
    [-3, -1], [-2, -1], [-1, -1], [ 0, -1], [ 1, -1], [ 2, -1], [ 3, -1],
    [-3,  0], [-2,  0], [-1,  0], [ 0,  0], [ 1,  0], [ 2,  0], [ 3,  0],
    [-3,  1], [-2,  1], [-1,  1], [ 0,  1], [ 1,  1], [ 2,  1], [ 3,  1],
              [-2,  2], [-1,  2], [ 0,  2], [ 1,  2], [ 2,  2],
                        [-1,  3], [ 0,  3], [ 1,  3]
]


const grid = []

const ANY   = " "
const EMPTY = "E"
const WALL  = "W"
const SAND  = "S"

const ANY_ROW = "   "
const MATCH_SIZE = 3
const MATCH_OFFSET = Math.floor(MATCH_SIZE / 2)
const MATCH_ALL = MATCH_SIZE * MATCH_SIZE

console.log(MATCH_SIZE, MATCH_OFFSET, MATCH_ALL)

class Particle {
    constructor(col, rules) {
        this.col = col
        this.rules = rules
    }

    update(cell) {
        this.rules.forEach(rule => {
            const didUpdate = rule.update(cell)
            if (didUpdate)
                return
        })
    }
}

class Rule {
    constructor(match, action, canMirror) {
        this.match = match
        this.action = action
        this.canMirror = canMirror
    }

    update(cell) {
        const reverseMatch = this.canMirror & Math.random() < 0.5

        let matches = 0
        let yOff = WIDTH * -MATCH_OFFSET
        this.match.forEach(matchRow => {
            if (matchRow === ANY_ROW) {
                matches += 3
            }
            else {
                for(let i = 0; i < MATCH_SIZE; i++) {
                    const matchIndex = reverseMatch ? MATCH_SIZE - i - 1 : i
                    const matchCode = matchRow[matchIndex]
                    if (matchCode === ANY || matchCode === grid[cell + yOff - MATCH_OFFSET + i]) {
                        matches++
                    }
                }
            }
            yOff += WIDTH
        })

        if (matches !== MATCH_ALL)
            return false

        yOff = WIDTH * -MATCH_OFFSET
        this.action.forEach(actionRow => {
            for(let i = 0; i < MATCH_SIZE; i++) {
                const actionIndex = reverseMatch ? MATCH_SIZE - i - 1 : i
                const code = actionRow[actionIndex]
                if (code !== ANY) {
                    grid[cell + yOff - MATCH_OFFSET + i] = code
                }
            }
            yOff += WIDTH
        })

        return true
    }
}

const particles = {
    "E": new Particle(
        [0, 0, 0],
        []
    ),

    "W": new Particle(
        [255, 255, 255],
        []
    ),

    "S": new Particle(
        [255, 255, 0],
        [
            new Rule(
                [
                    "   ",
                    " S ",
                    " E "
                ],
                [
                    "   ",
                    " E ",
                    " S "
                ],
                false
            ),
            new Rule(
                [
                    "   ",
                    " S ",
                    "  E"
                ],
                [
                    "   ",
                    " E ",
                    "  S"
                ],
                true
            ),
        ]
    )
}

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
            clearGrid()
        }
    })

    document.addEventListener('keyup', (e) => {
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
            isShiftDown = false
        }
    })
}

const initGrid = () => {
    const cells = WIDTH * HEIGHT

    for(let cell = 0; cell < cells; cell++) {
        grid[cell] = EMPTY
    }
}

const clearGrid = () => {
    for(let cell = 0; cell < grid.length; cell++) {
        if (!isShiftDown && grid[cell] !== WALL) {
            grid[cell] = EMPTY
            continue
        }
        if (isShiftDown && grid[cell] === WALL) {
            grid[cell] = EMPTY
            continue
        }
    }
}

const xyCell = (x, y) => {
    return (y * WIDTH) + x
}

const swapCells = (cell1, cell2) => {
    const val1 = grid[cell1]
    const val2 = grid[cell2]
    grid[cell1] = val2
    grid[cell2] = val1
}

const checkMouse = () => {
    if (isLeftMouseDown) {
        if (isShiftDown) {
            grid[xyCell(mouseX, mouseY)] = WALL
            return
        }

        brush.forEach(([x, y]) => {
            const cell = xyCell(mouseX + x, mouseY + y)
            if (grid[cell] !== WALL && Math.random() > 0.7) {
                grid[cell] = SAND
            }
        })
        return
    }

    if (isRightMouseDown) {
        brush.forEach(([x, y]) => {
            grid[xyCell(mouseX + x, mouseY + y)] = EMPTY
        })
    }
}

const updateGrid = () => {
    const updateDirection = Math.random() < 0.5 ? WIDTH : 0

    for (let cell = grid.length - 1; cell >= 0; cell--) {
        const particleType = grid[cell]
        const particle = particles[particleType]
        particle.update(cell)
    }
}

const drawGrid = () => {
    for (let cell = 0; cell < grid.length; cell++) {
        const particle = particles[grid[cell]]
        const [r, g, b] = particle.col
        const imageIndex = cell * 4
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
    updateGrid()

    if (currentTime - lastTime >= frameDelay) {
        drawGrid()
        lastTime = currentTime;
    }

    requestAnimationFrame(animate)
}


initCanvas()
initGrid()
animate()
