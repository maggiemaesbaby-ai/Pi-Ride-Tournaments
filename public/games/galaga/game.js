// Import Phaser
const Phaser = require("phaser")

// Galaga-style space shooter with tournament integration
const config = {
  type: Phaser.AUTO,
  width: 640,
  height: 800,
  parent: "game-container",
  physics: {
    default: "arcade",
    arcade: { gravity: { y: 0 }, debug: false },
  },
  scene: { preload, create, update },
}

const game = new Phaser.Game(config)
let player,
  enemies,
  bullets,
  enemyBullets,
  score = 0,
  lives = 3
let scoreText,
  livesText,
  gameOver = false,
  cursors,
  fireButton

function preload() {
  // Create simple shapes for sprites
  this.textures.generate("player", { data: ["3333", "3333", "3333"], pixelWidth: 4 })
  this.textures.generate("enemy", { data: ["222", "222"], pixelWidth: 4 })
  this.textures.generate("bullet", { data: ["5"], pixelWidth: 4 })
}

function create() {
  // Player
  player = this.physics.add.sprite(320, 700, "player")
  player.setScale(3)
  player.setCollideWorldBounds(true)

  // Enemies
  enemies = this.physics.add.group()
  createEnemyFormation.call(this)

  // Bullets
  bullets = this.physics.add.group()
  enemyBullets = this.physics.add.group()

  // Controls
  cursors = this.input.keyboard.createCursorKeys()
  fireButton = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

  // Collisions
  this.physics.add.overlap(bullets, enemies, hitEnemy, null, this)
  this.physics.add.overlap(player, enemyBullets, hitPlayer, null, this)
  this.physics.add.overlap(player, enemies, hitPlayer, null, this)

  // UI
  scoreText = this.add.text(16, 16, "Score: 0", { fontSize: "24px", fill: "#fff" })
  livesText = this.add.text(16, 50, "Lives: 3", { fontSize: "24px", fill: "#fff" })

  // Enemy shooting
  this.time.addEvent({
    delay: 1000,
    callback: enemyShoot,
    callbackScope: this,
    loop: true,
  })

  // Send initial score to tournament system
  window.parent.postMessage({ type: "score", score: 0, lives: 3 }, "*")
}

function update() {
  if (gameOver) return

  // Player movement
  if (cursors.left.isDown) {
    player.setVelocityX(-300)
  } else if (cursors.right.isDown) {
    player.setVelocityX(300)
  } else {
    player.setVelocityX(0)
  }

  // Player shooting
  if (Phaser.Input.Keyboard.JustDown(fireButton)) {
    shootBullet.call(this)
  }

  // Move enemies
  enemies.children.entries.forEach((enemy) => {
    if (enemy.x <= 50 || enemy.x >= 590) {
      enemies.children.entries.forEach((e) => {
        e.y += 10
        e.velocityX *= -1
        e.setVelocityX(e.velocityX)
      })
    }
  })

  // Clean up bullets
  bullets.children.entries.forEach((bullet) => {
    if (bullet.y < 0) bullet.destroy()
  })
  enemyBullets.children.entries.forEach((bullet) => {
    if (bullet.y > 800) bullet.destroy()
  })
}

function createEnemyFormation() {
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 10; x++) {
      const enemy = enemies.create(100 + x * 50, 100 + y * 50, "enemy")
      enemy.setScale(3)
      enemy.velocityX = 50
      enemy.setVelocityX(50)
    }
  }
}

function shootBullet() {
  const bullet = bullets.create(player.x, player.y - 20, "bullet")
  bullet.setScale(2)
  bullet.setVelocityY(-400)
}

function enemyShoot() {
  if (gameOver || enemies.children.entries.length === 0) return
  const enemy = Phaser.Utils.Array.GetRandom(enemies.children.entries)
  if (enemy) {
    const bullet = enemyBullets.create(enemy.x, enemy.y + 20, "bullet")
    bullet.setScale(2)
    bullet.setTint(0xff0000)
    bullet.setVelocityY(200)
  }
}

function hitEnemy(bullet, enemy) {
  bullet.destroy()
  enemy.destroy()
  score += 10
  scoreText.setText("Score: " + score)

  // Send score update to parent
  window.parent.postMessage({ type: "score", score, lives }, "*")

  // Check for level complete
  if (enemies.children.entries.length === 0) {
    this.time.delayedCall(1000, () => {
      createEnemyFormation.call(this)
    })
  }
}

function hitPlayer() {
  lives--
  livesText.setText("Lives: " + lives)

  // Send score update to parent
  window.parent.postMessage({ type: "score", score, lives }, "*")

  if (lives <= 0) {
    gameOver = true
    player.setTint(0xff0000)
    this.add.text(320, 400, "GAME OVER", { fontSize: "64px", fill: "#fff" }).setOrigin(0.5)

    // Send game over to parent
    window.parent.postMessage({ type: "gameOver", score, lives: 0 }, "*")
  } else {
    player.setTint(0xff0000)
    this.time.delayedCall(500, () => {
      player.clearTint()
      player.setPosition(320, 700)
    })
  }
}

// Listen for pause/resume from parent
window.addEventListener("message", (event) => {
  if (event.data.type === "pause") {
    game.scene.pause("default")
  } else if (event.data.type === "resume") {
    game.scene.resume("default")
  }
})
