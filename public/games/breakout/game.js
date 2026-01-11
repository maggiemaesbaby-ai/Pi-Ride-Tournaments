// Breakout game with tournament integration
const Phaser = window.Phaser // Declare the Phaser variable
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "game-container",
  physics: {
    default: "arcade",
    arcade: { gravity: { y: 0 }, debug: false },
  },
  scene: { preload, create, update },
}

const game = new Phaser.Game(config)
let paddle,
  ball,
  bricks,
  score = 0,
  lives = 3
let scoreText,
  livesText,
  gameOver = false

function preload() {
  // Create simple colored rectangles for game objects
  this.textures.generate("paddle", { data: ["11111111"], pixelWidth: 10, pixelHeight: 2 })
  this.textures.generate("ball", { data: ["1"], pixelWidth: 8 })
  this.textures.generate("brick-red", { data: ["1111"], pixelWidth: 12, pixelHeight: 3 })
  this.textures.generate("brick-blue", { data: ["2222"], pixelWidth: 12, pixelHeight: 3 })
  this.textures.generate("brick-green", { data: ["3333"], pixelWidth: 12, pixelHeight: 3 })
}

function create() {
  // Paddle
  paddle = this.physics.add.sprite(400, 550, "paddle")
  paddle.setScale(10, 3)
  paddle.setImmovable(true)
  paddle.setCollideWorldBounds(true)

  // Ball
  ball = this.physics.add.sprite(400, 500, "ball")
  ball.setScale(2)
  ball.setVelocity(200, -200)
  ball.setBounce(1, 1)
  ball.setCollideWorldBounds(true)

  // Bricks
  bricks = this.physics.add.staticGroup()
  const colors = ["brick-red", "brick-blue", "brick-green"]
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 10; col++) {
      const brick = bricks.create(80 + col * 70, 50 + row * 40, colors[row % 3])
      brick.setScale(5, 2)
      brick.refreshBody()
    }
  }

  // Collisions
  this.physics.add.collider(ball, paddle, hitPaddle, null, this)
  this.physics.add.collider(ball, bricks, hitBrick, null, this)

  // Input
  this.input.on("pointermove", (pointer) => {
    paddle.x = Phaser.Math.Clamp(pointer.x, 50, 750)
  })

  // UI
  scoreText = this.add.text(16, 16, "Score: 0", { fontSize: "24px", fill: "#fff" })
  livesText = this.add.text(16, 50, "Lives: 3", { fontSize: "24px", fill: "#fff" })

  // Send initial score
  window.parent.postMessage({ type: "score", score: 0, lives: 3 }, "*")
}

function update() {
  if (gameOver) return

  // Check if ball fell off bottom
  if (ball.y > 600) {
    lives--
    livesText.setText("Lives: " + lives)

    window.parent.postMessage({ type: "score", score, lives }, "*")

    if (lives <= 0) {
      gameOver = true
      this.add.text(400, 300, "GAME OVER", { fontSize: "64px", fill: "#fff" }).setOrigin(0.5)
      window.parent.postMessage({ type: "gameOver", score, lives: 0 }, "*")
    } else {
      ball.setPosition(400, 500)
      ball.setVelocity(200, -200)
    }
  }

  // Check for level complete
  if (bricks.countActive() === 0 && !gameOver) {
    this.add.text(400, 300, "LEVEL COMPLETE!", { fontSize: "48px", fill: "#0f0" }).setOrigin(0.5)
    gameOver = true
    window.parent.postMessage({ type: "gameOver", score, lives }, "*")
  }
}

function hitPaddle(ball, paddle) {
  const diff = ball.x - paddle.x
  ball.setVelocityX(diff * 10)
}

function hitBrick(ball, brick) {
  brick.disableBody(true, true)
  score += 10
  scoreText.setText("Score: " + score)
  window.parent.postMessage({ type: "score", score, lives }, "*")
}

// Listen for pause/resume
window.addEventListener("message", (event) => {
  if (event.data.type === "pause") {
    game.scene.pause("default")
  } else if (event.data.type === "resume") {
    game.scene.resume("default")
  }
})
