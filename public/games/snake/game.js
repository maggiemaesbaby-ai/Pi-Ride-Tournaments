// Snake game with tournament integration
const Phaser = window.Phaser // Declare the Phaser variable
const config = {
  type: Phaser.AUTO,
  width: 640,
  height: 640,
  parent: "game-container",
  scene: { preload, create, update },
}

const game = new Phaser.Game(config)
const gridSize = 20
const tileSize = 32
let snake,
  food,
  direction,
  nextDirection,
  moveTime = 0,
  gameOver = false
let score = 0,
  scoreText

function preload() {
  this.textures.generate("snake", { data: ["22"], pixelWidth: tileSize })
  this.textures.generate("food", { data: ["33"], pixelWidth: tileSize })
}

function create() {
  // Initialize snake
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ]

  direction = { x: 1, y: 0 }
  nextDirection = { x: 1, y: 0 }

  // Spawn food
  spawnFood.call(this)

  // Controls
  this.input.keyboard.on("keydown-UP", () => {
    if (direction.y === 0) nextDirection = { x: 0, y: -1 }
  })
  this.input.keyboard.on("keydown-DOWN", () => {
    if (direction.y === 0) nextDirection = { x: 0, y: 1 }
  })
  this.input.keyboard.on("keydown-LEFT", () => {
    if (direction.x === 0) nextDirection = { x: -1, y: 0 }
  })
  this.input.keyboard.on("keydown-RIGHT", () => {
    if (direction.x === 0) nextDirection = { x: 1, y: 0 }
  })

  // UI
  scoreText = this.add.text(16, 16, "Score: 0", { fontSize: "24px", fill: "#fff" })

  // Send initial score
  window.parent.postMessage({ type: "score", score: 0, lives: 1 }, "*")
}

function update(time) {
  if (gameOver) return

  if (time >= moveTime) {
    moveTime = time + 150 // Move every 150ms
    direction = nextDirection

    // Calculate new head position
    const head = snake[0]
    const newHead = {
      x: head.x + direction.x,
      y: head.y + direction.y,
    }

    // Check wall collision
    if (newHead.x < 0 || newHead.x >= gridSize || newHead.y < 0 || newHead.y >= gridSize) {
      endGame.call(this)
      return
    }

    // Check self collision
    for (const segment of snake) {
      if (segment.x === newHead.x && segment.y === newHead.y) {
        endGame.call(this)
        return
      }
    }

    // Add new head
    snake.unshift(newHead)

    // Check food collision
    if (newHead.x === food.x && newHead.y === food.y) {
      score += 10
      scoreText.setText("Score: " + score)
      window.parent.postMessage({ type: "score", score, lives: 1 }, "*")
      spawnFood.call(this)
    } else {
      // Remove tail if not eating
      snake.pop()
    }

    // Redraw
    this.children.removeAll()
    this.add.existing(scoreText)

    // Draw snake
    snake.forEach((segment, i) => {
      const color = i === 0 ? 0x00ff00 : 0x00aa00
      this.add.rectangle(
        segment.x * tileSize + tileSize / 2,
        segment.y * tileSize + tileSize / 2,
        tileSize - 2,
        tileSize - 2,
        color,
      )
    })

    // Draw food
    this.add.rectangle(
      food.x * tileSize + tileSize / 2,
      food.y * tileSize + tileSize / 2,
      tileSize - 2,
      tileSize - 2,
      0xff0000,
    )
  }
}

function spawnFood() {
  let validPosition = false
  while (!validPosition) {
    food = {
      x: Phaser.Math.Between(0, gridSize - 1),
      y: Phaser.Math.Between(0, gridSize - 1),
    }

    validPosition = true
    for (const segment of snake) {
      if (segment.x === food.x && segment.y === food.y) {
        validPosition = false
        break
      }
    }
  }
}

function endGame() {
  gameOver = true
  this.add.text(320, 320, "GAME OVER", { fontSize: "48px", fill: "#fff" }).setOrigin(0.5)
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
