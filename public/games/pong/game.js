/** @type {typeof Phaser} */
const Phaser = window.Phaser

let tournamentScore = 0
let gameActive = false

window.addEventListener("message", (event) => {
  if (event.data.type === "PAUSE_GAME") {
    if (game && game.scene.isActive("GameScene")) game.scene.pause("GameScene")
  } else if (event.data.type === "RESUME_GAME") {
    if (game && game.scene.isPaused("GameScene")) game.scene.resume("GameScene")
  }
})

function sendScoreUpdate() {
  window.parent.postMessage({ type: "SCORE_UPDATE", score: tournamentScore }, "*")
}

function sendGameOver() {
  gameActive = false
  window.parent.postMessage({ type: "GAME_OVER", finalScore: tournamentScore }, "*")
}

class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene")
    this.score = 0
    this.cpuScore = 0
  }

  create() {
    gameActive = true
    tournamentScore = 0

    // Create paddles
    this.player = this.add.rectangle(30, 300, 10, 80, 0xffffff)
    this.physics.add.existing(this.player, true)

    this.cpu = this.add.rectangle(770, 300, 10, 80, 0xffffff)
    this.physics.add.existing(this.cpu, true)

    // Create ball
    this.ball = this.add.circle(400, 300, 8, 0xffffff)
    this.physics.add.existing(this.ball)
    this.ball.body.setCollideWorldBounds(true)
    this.ball.body.setBounce(1, 1)
    this.ball.body.setVelocity(200, 200)

    // Controls
    this.cursors = this.input.keyboard.createCursorKeys()

    // Collisions
    this.physics.add.collider(this.ball, this.player)
    this.physics.add.collider(this.ball, this.cpu)

    // UI
    this.scoreText = this.add
      .text(400, 30, "0 - 0", {
        fontSize: "32px",
        fill: "#fff",
      })
      .setOrigin(0.5)

    sendScoreUpdate()
  }

  update() {
    if (!gameActive) return

    // Player controls
    if (this.cursors.up.isDown && this.player.y > 40) {
      this.player.y -= 5
    } else if (this.cursors.down.isDown && this.player.y < 560) {
      this.player.y += 5
    }

    // CPU AI
    if (this.ball.x > 400) {
      if (this.cpu.y < this.ball.y - 10) {
        this.cpu.y += 3
      } else if (this.cpu.y > this.ball.y + 10) {
        this.cpu.y -= 3
      }
    }

    // Score
    if (this.ball.x < 0) {
      this.cpuScore++
      this.resetBall()
    } else if (this.ball.x > 800) {
      this.score++
      tournamentScore = this.score
      sendScoreUpdate()
      this.resetBall()
    }

    this.scoreText.setText(`${this.score} - ${this.cpuScore}`)

    // Win condition
    if (this.score >= 11) {
      this.winGame()
    } else if (this.cpuScore >= 11) {
      this.loseGame()
    }
  }

  resetBall() {
    this.ball.setPosition(400, 300)
    this.ball.body.setVelocity(Phaser.Math.Between(-1, 1) > 0 ? 200 : -200, Phaser.Math.Between(-200, 200))
  }

  winGame() {
    gameActive = false
    this.add
      .text(400, 300, "YOU WIN!", {
        fontSize: "48px",
        fill: "#0F0",
      })
      .setOrigin(0.5)

    this.time.delayedCall(2000, () => sendGameOver())
  }

  loseGame() {
    gameActive = false
    this.add
      .text(400, 300, "GAME OVER", {
        fontSize: "48px",
        fill: "#F00",
      })
      .setOrigin(0.5)

    this.time.delayedCall(2000, () => sendGameOver())
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "game-container",
  backgroundColor: "#000000",
  physics: {
    default: "arcade",
    arcade: { gravity: { y: 0 } },
  },
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
}

const game = new Phaser.Game(config)
