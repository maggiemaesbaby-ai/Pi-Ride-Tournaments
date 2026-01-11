// Donkey Kong with tournament integration
const Phaser = window.Phaser // Declare Phaser variable
const config = {
  type: Phaser.AUTO,
  width: 320,
  height: 576,
  parent: "game-container",
  physics: {
    default: "arcade",
    arcade: { gravity: { y: 800 }, debug: false },
  },
  scene: { preload, create, update },
}

const game = new Phaser.Game(config)
let player, platforms, barrels, princess, cursors, jumpButton
let score = 0,
  lives = 3,
  level = 1,
  gameOver = false
let scoreText, livesText, levelText

const levelData = [
  {
    platforms: [
      { x: 0, y: 460, w: 320, h: 20 },
      { x: 200, y: 400, w: 120, h: 20 },
      { x: 0, y: 300, w: 120, h: 20 },
      { x: 200, y: 200, w: 120, h: 20 },
    ],
    goal: { x: 280, y: 160 },
  },
]

function preload() {
  // Create colored rectangles for game objects
  this.textures.generate("player", { data: ["333", "333"], pixelWidth: 6 })
  this.textures.generate("platform", { data: ["111"], pixelWidth: 20, pixelHeight: 4 })
  this.textures.generate("barrel", { data: ["66", "66"], pixelWidth: 6 })
  this.textures.generate("princess", { data: ["555", "555"], pixelWidth: 6 })
}

function create() {
  // Create platforms
  platforms = this.physics.add.staticGroup()
  levelData[0].platforms.forEach((p) => {
    const platform = platforms.create(p.x + p.w / 2, p.y, "platform")
    platform.setScale(p.w / 20, 1).refreshBody()
  })

  // Player
  player = this.physics.add.sprite(40, 400, "player")
  player.setScale(4)
  player.setCollideWorldBounds(true)

  // Princess (goal)
  princess = this.add.sprite(levelData[0].goal.x, levelData[0].goal.y, "princess")
  princess.setScale(4)

  // Barrels
  barrels = this.physics.add.group()

  // Controls
  cursors = this.input.keyboard.createCursorKeys()
  jumpButton = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

  // Collisions
  this.physics.add.collider(player, platforms)
  this.physics.add.collider(barrels, platforms)
  this.physics.add.overlap(player, barrels, hitBarrel, null, this)

  // UI
  scoreText = this.add.text(16, 16, "Score: 0", { fontSize: "16px", fill: "#fff" })
  livesText = this.add.text(16, 36, "Lives: 3", { fontSize: "16px", fill: "#fff" })
  levelText = this.add.text(16, 56, "Level: 1", { fontSize: "16px", fill: "#fff" })

  // Spawn barrels
  this.time.addEvent({
    delay: 2000,
    callback: spawnBarrel,
    callbackScope: this,
    loop: true,
  })

  // Send initial score
  window.parent.postMessage({ type: "score", score: 0, lives: 3 }, "*")
}

function update() {
  if (gameOver) return

  // Player movement
  if (cursors.left.isDown) {
    player.setVelocityX(-160)
  } else if (cursors.right.isDown) {
    player.setVelocityX(160)
  } else {
    player.setVelocityX(0)
  }

  // Jump
  if (Phaser.Input.Keyboard.JustDown(jumpButton) && player.body.touching.down) {
    player.setVelocityY(-400)
  }

  // Check if reached princess
  if (Phaser.Math.Distance.Between(player.x, player.y, princess.x, princess.y) < 30) {
    score += 1000
    level++
    scoreText.setText("Score: " + score)
    levelText.setText("Level: " + level)

    window.parent.postMessage({ type: "score", score, lives }, "*")

    // Reset positions
    player.setPosition(40, 400)
    barrels.clear(true, true)
  }
}

function spawnBarrel() {
  if (gameOver) return
  const barrel = barrels.create(280, 180, "barrel")
  barrel.setScale(3)
  barrel.setVelocity(-100, 0)
  barrel.setBounce(0.5)
}

function hitBarrel(player, barrel) {
  barrel.destroy()
  lives--
  livesText.setText("Lives: " + lives)

  window.parent.postMessage({ type: "score", score, lives }, "*")

  if (lives <= 0) {
    gameOver = true
    player.setTint(0xff0000)
    this.add.text(160, 288, "GAME OVER", { fontSize: "32px", fill: "#fff" }).setOrigin(0.5)
    window.parent.postMessage({ type: "gameOver", score, lives: 0 }, "*")
  } else {
    player.setTint(0xff0000)
    this.time.delayedCall(500, () => {
      player.clearTint()
      player.setPosition(40, 400)
    })
  }
}

// Listen for pause/resume
window.addEventListener("message", (event) => {
  if (event.data.type === "pause") {
    game.scene.pause("default")
  } else if (event.data.type === "resume") {
    game.scene.resume("default")
  }
})
