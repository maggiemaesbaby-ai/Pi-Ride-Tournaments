// Tetris with tournament integration
const Phaser = window.Phaser // Declare the Phaser variable
const config = {
  type: Phaser.AUTO,
  width: 400,
  height: 800,
  parent: "game-container",
  scene: { create, update },
}

const game = new Phaser.Game(config)
const COLS = 10,
  ROWS = 20,
  BLOCK_SIZE = 40
let grid,
  currentPiece,
  nextPiece,
  score = 0,
  level = 1,
  lines = 0
let gameOver = false,
  dropTime = 0,
  dropInterval = 500
let scoreText, levelText, linesText, cursors, scene

const PIECES = [
  [[1, 1, 1, 1]], // I
  [
    [1, 1],
    [1, 1],
  ], // O
  [
    [0, 1, 0],
    [1, 1, 1],
  ], // T
  [
    [1, 0, 0],
    [1, 1, 1],
  ], // L
  [
    [0, 0, 1],
    [1, 1, 1],
  ], // J
  [
    [0, 1, 1],
    [1, 1, 0],
  ], // S
  [
    [1, 1, 0],
    [0, 1, 1],
  ], // Z
]

const COLORS = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xffa500]

function create() {
  scene = this

  // Initialize grid
  grid = Array(ROWS)
    .fill()
    .map(() => Array(COLS).fill(0))

  // Draw grid border
  this.add.rectangle(200, 400, COLS * BLOCK_SIZE + 4, ROWS * BLOCK_SIZE + 4, 0xffffff).setStrokeStyle(2, 0xffffff)

  // Controls
  cursors = this.input.keyboard.createCursorKeys()
  this.input.keyboard.on("keydown-SPACE", rotatePiece)
  this.input.keyboard.on("keydown-DOWN", dropPiece)

  // UI
  scoreText = this.add.text(16, 16, "Score: 0", { fontSize: "20px", fill: "#fff" })
  levelText = this.add.text(16, 42, "Level: 1", { fontSize: "20px", fill: "#fff" })
  linesText = this.add.text(16, 68, "Lines: 0", { fontSize: "20px", fill: "#fff" })

  // Spawn first piece
  spawnPiece()

  // Send initial score
  window.parent.postMessage({ type: "score", score: 0, lives: 1 }, "*")
}

function update(time) {
  if (gameOver) return

  // Handle left/right movement
  if (Phaser.Input.Keyboard.JustDown(cursors.left)) {
    movePiece(-1, 0)
  }
  if (Phaser.Input.Keyboard.JustDown(cursors.right)) {
    movePiece(1, 0)
  }

  // Auto drop
  if (time > dropTime) {
    dropTime = time + dropInterval
    if (!movePiece(0, 1)) {
      lockPiece()
      clearLines()
      spawnPiece()
    }
  }

  // Render
  drawGame()
}

function spawnPiece() {
  const pieceIndex = Phaser.Math.Between(0, PIECES.length - 1)
  currentPiece = {
    shape: PIECES[pieceIndex],
    color: COLORS[pieceIndex],
    x: Math.floor(COLS / 2) - 1,
    y: 0,
  }

  if (!isValidMove(currentPiece.x, currentPiece.y, currentPiece.shape)) {
    endGame()
  }
}

function movePiece(dx, dy) {
  if (isValidMove(currentPiece.x + dx, currentPiece.y + dy, currentPiece.shape)) {
    currentPiece.x += dx
    currentPiece.y += dy
    return true
  }
  return false
}

function rotatePiece() {
  if (gameOver) return
  const rotated = currentPiece.shape[0].map((_, i) => currentPiece.shape.map((row) => row[i]).reverse())
  if (isValidMove(currentPiece.x, currentPiece.y, rotated)) {
    currentPiece.shape = rotated
  }
}

function dropPiece() {
  while (movePiece(0, 1)) {}
}

function isValidMove(x, y, shape) {
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const newX = x + col
        const newY = y + row
        if (newX < 0 || newX >= COLS || newY >= ROWS) return false
        if (newY >= 0 && grid[newY][newX]) return false
      }
    }
  }
  return true
}

function lockPiece() {
  currentPiece.shape.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell) {
        const y = currentPiece.y + r
        const x = currentPiece.x + c
        if (y >= 0) grid[y][x] = currentPiece.color
      }
    })
  })
}

function clearLines() {
  let linesCleared = 0
  for (let row = ROWS - 1; row >= 0; row--) {
    if (grid[row].every((cell) => cell !== 0)) {
      grid.splice(row, 1)
      grid.unshift(Array(COLS).fill(0))
      linesCleared++
      row++ // Check this row again
    }
  }

  if (linesCleared > 0) {
    lines += linesCleared
    score += linesCleared * 100 * level
    level = Math.floor(lines / 10) + 1
    dropInterval = Math.max(100, 500 - (level - 1) * 50)

    scoreText.setText("Score: " + score)
    levelText.setText("Level: " + level)
    linesText.setText("Lines: " + lines)

    window.parent.postMessage({ type: "score", score, lives: 1 }, "*")
  }
}

function drawGame() {
  scene.children.removeAll()

  // Redraw UI
  scene.add.existing(scoreText)
  scene.add.existing(levelText)
  scene.add.existing(linesText)

  // Draw grid border
  scene.add.rectangle(200, 400, COLS * BLOCK_SIZE + 4, ROWS * BLOCK_SIZE + 4, 0x000000).setStrokeStyle(2, 0xffffff)

  // Draw locked blocks
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (grid[row][col]) {
        scene.add.rectangle(
          col * BLOCK_SIZE + BLOCK_SIZE / 2,
          row * BLOCK_SIZE + BLOCK_SIZE / 2,
          BLOCK_SIZE - 2,
          BLOCK_SIZE - 2,
          grid[row][col],
        )
      }
    }
  }

  // Draw current piece
  if (currentPiece) {
    currentPiece.shape.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell) {
          scene.add.rectangle(
            (currentPiece.x + c) * BLOCK_SIZE + BLOCK_SIZE / 2,
            (currentPiece.y + r) * BLOCK_SIZE + BLOCK_SIZE / 2,
            BLOCK_SIZE - 2,
            BLOCK_SIZE - 2,
            currentPiece.color,
          )
        }
      })
    })
  }
}

function endGame() {
  gameOver = true
  scene.add.text(200, 400, "GAME OVER", { fontSize: "48px", fill: "#fff" }).setOrigin(0.5)
  window.parent.postMessage({ type: "gameOver", score, lives: 0 }, "*")
}

// Listen for pause/resume
window.addEventListener("message", (event) => {
  if (event.data.type === "pause") {
    game.scene.pause("default")
  } else if (event.data.type === "resume") {
    game.scene.resume("default")
  }
})
