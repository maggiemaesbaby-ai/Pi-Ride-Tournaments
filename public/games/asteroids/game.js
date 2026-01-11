console.log("[v0] ========== ASTEROIDS V782 LOADING ==========")
const Phaser = window.Phaser

let tournamentEntryId = null
let tournamentUserId = null

window.addEventListener("message", (event) => {
  if (event.data.type === "SET_TOURNAMENT_ENTRY_ID") {
    tournamentEntryId = event.data.entryId
    console.log("[v0] Received tournament entry ID:", tournamentEntryId)
  }
  if (event.data.type === "SET_TOURNAMENT_USER_ID") {
    tournamentUserId = event.data.userId
    console.log("[v0] Received tournament user ID:", tournamentUserId)
  }
})

class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene")
  }

  preload() {
    console.log("[v0] Preloading asteroid images...")
    this.load.image("asteroid1", "/games/asteroids/asteroid1.jpg")
    this.load.image("asteroid2", "/games/asteroids/asteroid2.jpg")
    this.load.image("asteroid3", "/games/asteroids/asteroid3.jpg")
  }

  create() {
    console.log("[v0] GameScene CREATE V782 - Adding alien ships feature")

    const bg = this.add.graphics()
    bg.fillStyle(0x000000, 1)
    bg.fillRect(0, 0, 800, 600)
    bg.setDepth(0)

    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, 800)
      const y = Phaser.Math.Between(0, 600)
      const brightness = Phaser.Math.FloatBetween(0.3, 1)
      bg.fillStyle(0xffffff, brightness)
      bg.fillCircle(x, y, 1)
    }

    this.cameras.main.setBounds(0, 0, 800, 600)
    this.physics.world.setBounds(0, 0, 800, 600)

    this.score = 0
    this.level = 1
    this.lives = 3
    this.isInvincible = false
    this.gameStartTime = Date.now()
    this.maxLevel = 3
    this.isLevelTransition = false
    this.portraitPaused = false
    this.manualPaused = false
    this.portraitMessage = null
    this.portraitText = null
    this.wasManuallyPaused = false

    const urlParams = new URLSearchParams(window.location.search)
    this.isTournamentMode = urlParams.get("entryId") !== null
    this.tournamentTimeRemaining = this.isTournamentMode ? 180 : null // 3 minutes only in tournament
    this.lastPauseUpdate = 0
    this.isPausedByUser = false
    this.pauseOverlay = null
    this.pauseText = null
    this.pauseTimerText = null
    // </CHANGE>

    this.alienShips = []
    this.alienBullets = []
    this.nextAlienSpawn = 0
    this.alienSpawnDelay = this.getRandomAlienDelay()

    this.ship = this.add.triangle(400, 300, 0, -15, -10, 10, 10, 10, 0xffffff)
    this.physics.add.existing(this.ship)
    this.ship.body.setDrag(100)
    this.ship.body.setMaxVelocity(300)
    this.ship.setDepth(100)

    this.scoreText = this.add
      .text(400, 20, "Score: 0  |  Level: 1  |  Lives: 3", {
        fontSize: "24px",
        fill: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setScrollFactor(0)
      .setDepth(9999)
      .setOrigin(0.5, 0)

    this.asteroids = []
    this.spawnLevelAsteroids()

    this.bullets = []
    this.lastFired = -1000 // Initialize to negative so first fire happens immediately

    this.cursors = this.input.keyboard.createCursorKeys()
    this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC)
    // </CHANGE>

    this.createTouchControls()

    this.input.addPointer(3) // Support up to 4 simultaneous touches

    this.setupControls()
    this.setupMessageListener()

    this.initAudio()

    this.isThrustSoundPlaying = false
    this.audioMuted = false // Add mute state tracking

    console.log("[v0] GameScene CREATE complete - Ship at 400,300, Level 1 starting with alien ships enabled")
  }

  getRandomAlienDelay() {
    return Phaser.Math.Between(15000, 20000)
  }

  createAlienShip(type) {
    const isLarge = type === "large"
    const size = isLarge ? 30 : 25
    const points = isLarge ? 200 : 1000

    // Spawn from random edge
    const edge = Phaser.Math.Between(0, 3)
    let x, y

    if (edge === 0) {
      // Left
      x = -50
      y = Phaser.Math.Between(100, 500)
    } else if (edge === 1) {
      // Right
      x = 850
      y = Phaser.Math.Between(100, 500)
    } else if (edge === 2) {
      // Top
      x = Phaser.Math.Between(100, 700)
      y = -50
    } else {
      // Bottom
      x = Phaser.Math.Between(100, 700)
      y = 650
    }

    const container = this.add.container(x, y)

    // Draw UFO shape inspired by the reference images
    const graphics = this.add.graphics()

    if (isLarge) {
      // Large saucer - inspired by green UFO with dome and windows
      // Main disk body (ellipse)
      graphics.fillStyle(0x88ff44, 1)
      graphics.fillEllipse(0, 0, size * 2, size)
      graphics.lineStyle(2, 0x66dd22)
      graphics.strokeEllipse(0, 0, size * 2, size)

      // Dome on top
      graphics.fillStyle(0xaaffaa, 0.6)
      graphics.fillEllipse(0, -size / 2, size, size / 2)
      graphics.lineStyle(1, 0x88ff44)
      graphics.strokeEllipse(0, -size / 2, size, size / 2)

      // Windows (5 white circles around the rim)
      graphics.fillStyle(0xffffff, 0.9)
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2
        const wx = Math.cos(angle) * (size * 0.7)
        const wy = Math.sin(angle) * (size * 0.3)
        graphics.fillCircle(wx, wy, 3)
      }
    } else {
      // Small saucer - inspired by dark metallic UFO with red lights
      // Main disk body
      graphics.fillStyle(0x444466, 1)
      graphics.fillEllipse(0, 0, size * 2, size)
      graphics.lineStyle(2, 0x222233)
      graphics.strokeEllipse(0, 0, size * 2, size)

      // Dome on top
      graphics.fillStyle(0x666688, 0.8)
      graphics.fillEllipse(0, -size / 2, size * 0.8, size / 2)
      graphics.lineStyle(1, 0x444466)
      graphics.strokeEllipse(0, -size / 2, size * 0.8, size / 2)

      // Red lights around the rim
      graphics.fillStyle(0xff3333, 0.9)
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2
        const lx = Math.cos(angle) * (size * 0.75)
        const ly = Math.sin(angle) * (size * 0.35)
        graphics.fillCircle(lx, ly, 2)
      }
    }

    container.add(graphics)
    container.setDepth(90)

    // Add physics
    this.physics.add.existing(container)
    container.body.setCircle(size)

    // Set velocity to move across screen
    const speed = isLarge ? 80 : 120
    const targetX = x < 400 ? 850 : -50
    const targetY = Phaser.Math.Between(100, 500)

    const angle = Math.atan2(targetY - y, targetX - x)
    container.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)

    // Store alien properties
    container.alienType = type
    container.alienSize = size
    container.alienPoints = points
    container.lastShot = 0
    container.shootDelay = isLarge ? 2000 : 1000 // Small shoots more frequently

    this.alienShips.push(container)

    console.log(`[v0] Spawned ${type} alien ship at (${x}, ${y}) worth ${points} points`)

    return container
  }

  alienShoot(alien) {
    if (alien.x < 0 || alien.x > 800 || alien.y < 0 || alien.y > 600) {
      return // Don't shoot if off screen
    }

    const bulletX = alien.x
    const bulletY = alien.y

    const bullet = this.add.circle(bulletX, bulletY, 2, 0xff0000)
    bullet.setDepth(100)
    this.physics.add.existing(bullet)

    if (alien.alienType === "large") {
      // Large saucer shoots randomly
      const randomAngle = Phaser.Math.FloatBetween(0, Math.PI * 2)
      this.physics.velocityFromRotation(randomAngle, 300, bullet.body.velocity)
    } else {
      // Small saucer aims at player ship
      const angle = Math.atan2(this.ship.y - bulletY, this.ship.x - bulletX)
      // Add slight inaccuracy
      const inaccuracy = Phaser.Math.FloatBetween(-0.2, 0.2)
      this.physics.velocityFromRotation(angle + inaccuracy, 350, bullet.body.velocity)
    }

    this.alienBullets.push(bullet)
    this.playAlienLaserSound()
  }

  setupControls() {
    const isPiBrowser = () => {
      const ua = window.navigator.userAgent.toLowerCase()
      return (
        ua.includes("pibrowser") ||
        ua.includes("pi browser") ||
        window.PiNetwork !== undefined ||
        window.Pi !== undefined ||
        // Check if parent window has Pi SDK
        (window.parent && (window.parent.Pi || window.parent.PiNetwork))
      )
    }

    // Only show rotation message in PWA/regular browsers, not Pi Browser
    if (!isPiBrowser()) {
      this.setupOrientationListener()
    } else {
      console.log("[v0] Pi Browser detected - skipping orientation check")
    }
  }

  setupOrientationListener() {
    const isPortrait = () => window.innerHeight > window.innerWidth

    if (isPortrait()) {
      this.showPortraitMessage()
    }

    // Listen for orientation changes
    window.addEventListener("resize", () => {
      if (isPortrait()) {
        this.showPortraitMessage()
      } else {
        this.hidePortraitMessage()
      }
    })
  }

  showPortraitMessage() {
    if (this.portraitMessage) return

    // Pause the game
    this.physics.pause()
    this.isPaused = true

    // Create semi-transparent overlay
    this.portraitOverlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8)
    this.portraitOverlay.setDepth(1000)

    // Create message text
    this.portraitMessage = this.add.text(400, 300, "PLEASE ROTATE TO LANDSCAPE MODE", {
      fontSize: "32px",
      fontFamily: "Arial",
      color: "#ffffff",
      align: "center",
      wordWrap: { width: 700 },
    })
    this.portraitMessage.setOrigin(0.5)
    this.portraitMessage.setDepth(1001)

    // Add rotation icon hint
    const hint = this.add.text(400, 360, "↻ Hold your device sideways", {
      fontSize: "18px",
      fontFamily: "Arial",
      color: "#ffaa00",
      align: "center",
    })
    hint.setOrigin(0.5)
    hint.setDepth(1001)
    this.portraitHint = hint
  }

  hidePortraitMessage() {
    if (!this.portraitMessage) return

    // Remove message and overlay
    this.portraitMessage.destroy()
    this.portraitHint.destroy()
    this.portraitOverlay.destroy()
    this.portraitMessage = null
    this.portraitHint = null
    this.portraitOverlay = null

    // Resume the game
    this.physics.resume()
    this.isPaused = false
  }

  setupMessageListener() {
    // Placeholder for setupMessageListener function
    console.log("[v0] Setup message listener")
  }

  spawnLevelAsteroids() {
    let numAsteroids = 4 // Level 1
    if (this.level === 2) numAsteroids = 6
    else if (this.level === 3) numAsteroids = 8
    else if (this.level >= 4) numAsteroids = 10

    console.log(`[v0] Spawning ${numAsteroids} large asteroids for level ${this.level}`)

    for (let i = 0; i < numAsteroids; i++) {
      this.spawnAsteroid()
    }
  }

  spawnAsteroid(x = null, y = null, size = 30) {
    if (x === null || y === null) {
      let attempts = 0
      do {
        const edge = Phaser.Math.Between(0, 3)
        if (edge === 0) {
          x = 0
          y = Phaser.Math.Between(0, 600)
        } else if (edge === 1) {
          x = 800
          y = Phaser.Math.Between(0, 600)
        } else if (edge === 2) {
          x = Phaser.Math.Between(0, 800)
          y = 0
        } else {
          x = Phaser.Math.Between(0, 800)
          y = 600
        }
        attempts++
      } while (Phaser.Math.Distance.Between(x, y, this.ship.x, this.ship.y) < 150 && attempts < 10)
    }

    const asteroidType = Phaser.Math.Between(1, 3)
    const asteroid = this.add.sprite(x, y, `asteroid${asteroidType}`)
    asteroid.asteroidSize = size
    asteroid.isLargeUnhit = size >= 30

    const displaySize = size * 2
    asteroid.setDisplaySize(displaySize, displaySize)

    const mask = this.make.graphics()
    mask.fillStyle(0xffffff)
    mask.fillCircle(x, y, size)
    asteroid.setMask(mask.createGeometryMask())

    asteroid.customMask = mask
    asteroid.setBlendMode(Phaser.BlendModes.ADD)

    asteroid.rotation = (Phaser.Math.Between(0, 360) * Math.PI) / 180
    asteroid.angularVelocity = Phaser.Math.Between(-2, 2)
    asteroid.setDepth(50)

    this.physics.add.existing(asteroid)
    asteroid.body.setCircle(size)

    const baseSpeed = 50 + this.level * 10
    const speed = Phaser.Math.Between(baseSpeed, baseSpeed + 100)
    const angle = Phaser.Math.Between(0, 360)
    const velocityX = Math.cos((angle * Math.PI) / 180) * speed
    const velocityY = Math.sin((angle * Math.PI) / 180) * speed
    asteroid.body.setVelocity(velocityX, velocityY)

    this.asteroids.push(asteroid)
    return asteroid
  }

  createTouchControls() {
    const isPWA = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true
    const isPiBrowser = () => {
      const ua = window.navigator.userAgent.toLowerCase()
      return (
        ua.includes("pibrowser") ||
        ua.includes("pi browser") ||
        window.PiNetwork !== undefined ||
        window.Pi !== undefined ||
        (window.parent && (window.parent.Pi || window.parent.PiNetwork))
      )
    }

    const isPortraitMode = !isPWA && isPiBrowser() && window.innerHeight > window.innerWidth

    const size = isPortraitMode ? 43 : 45

    const visualY = isPortraitMode ? 533 : 420
    const hitboxY = isPortraitMode ? 533 : 480

    const leftX = isPortraitMode ? 280 : 80
    const rightX = isPortraitMode ? 355 : 155
    const thrustX = isPortraitMode ? 450 : 560
    const fireX = isPortraitMode ? 525 : 655

    console.log("[v0] Touch controls - PWA:", isPWA, "Pi Browser:", isPiBrowser(), "Portrait:", isPortraitMode)

    const depth = 10000

    const createArcadeButton = (x, y, color) => {
      const base = this.add
        .circle(x, y, size / 2, color, 0.8)
        .setScrollFactor(0)
        .setDepth(depth)

      const button = this.add
        .circle(x, y + 3, size / 3.5, 0xffffff, 0.95)
        .setScrollFactor(0)
        .setDepth(depth + 1)

      const shadow = this.add
        .circle(x, y + 5, size / 3.7, 0x000000, 0.4)
        .setScrollFactor(0)
        .setDepth(depth - 1)

      return { base, button, shadow }
    }

    const leftVisual = createArcadeButton(leftX, visualY, 0x4444ff)
    const rightVisual = createArcadeButton(rightX, visualY, 0x4444ff)
    const thrustVisual = createArcadeButton(thrustX, visualY, 0x44ff44)
    const fireVisual = createArcadeButton(fireX, visualY, 0xff4444)

    this.leftButtonVisual = leftVisual.button
    this.rightButtonVisual = rightVisual.button
    this.thrustButtonVisual = thrustVisual.button
    this.fireButtonVisual = fireVisual.button

    // PWA landscape: hitboxes match visual button positions
    const leftHitboxX = isPortraitMode ? leftX - 175 : leftX
    const rightHitboxX = isPortraitMode ? rightX - 55 : rightX
    const thrustHitboxX = isPortraitMode ? thrustX + 55 : thrustX
    const fireHitboxX = isPortraitMode ? fireX + 175 : fireX

    this.leftButton = this.add
      .circle(leftHitboxX, hitboxY, size, 0x4444ff, 0)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0)
      .setDepth(depth + 2)
    this.rightButton = this.add
      .circle(rightHitboxX, hitboxY, size, 0x4444ff, 0)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0)
      .setDepth(depth + 2)
    this.thrustButton = this.add
      .circle(thrustHitboxX, hitboxY, size, 0x44ff44, 0)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0)
      .setDepth(depth + 2)
    this.fireButton = this.add
      .circle(fireHitboxX, hitboxY, size, 0xff4444, 0)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0)
      .setDepth(depth + 2)

    this.touchStates = {
      left: false,
      right: false,
      thrust: false,
      fire: false,
    }

    this.leftButton
      .on("pointerdown", () => {
        this.touchStates.left = true
        this.leftButtonVisual.y = visualY + 5
      })
      .on("pointerup", () => {
        this.touchStates.left = false
        this.leftButtonVisual.y = visualY + 3
      })
      .on("pointerout", () => {
        this.touchStates.left = false
        this.leftButtonVisual.y = visualY + 3
      })
      .on("pointerupoutside", () => {
        this.touchStates.left = false
        this.leftButtonVisual.y = visualY + 3
      })

    this.rightButton
      .on("pointerdown", () => {
        this.touchStates.right = true
        this.rightButtonVisual.y = visualY + 5
      })
      .on("pointerup", () => {
        this.touchStates.right = false
        this.rightButtonVisual.y = visualY + 3
      })
      .on("pointerout", () => {
        this.touchStates.right = false
        this.rightButtonVisual.y = visualY + 3
      })
      .on("pointerupoutside", () => {
        this.touchStates.right = false
        this.rightButtonVisual.y = visualY + 3
      })

    this.thrustButton
      .on("pointerdown", () => {
        this.touchStates.thrust = true
        this.thrustButtonVisual.y = visualY + 5
      })
      .on("pointerup", () => {
        this.touchStates.thrust = false
        this.thrustButtonVisual.y = visualY + 3
      })
      .on("pointerout", () => {
        this.touchStates.thrust = false
        this.thrustButtonVisual.y = visualY + 3
      })
      .on("pointerupoutside", () => {
        this.touchStates.thrust = false
        this.thrustButtonVisual.y = visualY + 3
      })

    this.fireButton
      .on("pointerdown", () => {
        this.touchStates.fire = true
        this.fireButtonVisual.y = visualY + 5
      })
      .on("pointerup", () => {
        this.touchStates.fire = false
        this.fireButtonVisual.y = visualY + 3
      })
      .on("pointerout", () => {
        this.touchStates.fire = false
        this.fireButtonVisual.y = visualY + 3
      })
      .on("pointerupoutside", () => {
        this.touchStates.fire = false
        this.fireButtonVisual.y = visualY + 3
      })

    console.log("[v0] Touch controls created and always visible for all modes")
  }

  explodeShip() {
    console.log("[v0] Ship exploding!")
    this.playShipExplosionSound()

    for (let i = 0; i < 20; i++) {
      const particle = this.add.circle(this.ship.x, this.ship.y, 3, 0xff6600)
      particle.setDepth(200)
      this.physics.add.existing(particle)

      const angle = (i / 20) * Math.PI * 2
      const speed = Phaser.Math.Between(50, 150)
      particle.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)

      this.tweens.add({
        targets: particle,
        alpha: 0,
        duration: 1000,
        onComplete: () => particle.destroy(),
      })
    }

    this.ship.setVisible(false)
  }

  showLevelTransition(levelNumber) {
    this.isLevelTransition = true

    const bg = this.add.graphics()
    if (levelNumber === 2) {
      bg.fillStyle(0x001122, 1) // Darker blue for level 2
    } else if (levelNumber === 3) {
      bg.fillStyle(0x110022, 1) // Purple tint for level 3
    } else {
      bg.fillStyle(0x000000, 1)
    }
    bg.fillRect(0, 0, 800, 600)
    bg.setDepth(0)

    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, 800)
      const y = Phaser.Math.Between(0, 600)
      const brightness = Phaser.Math.FloatBetween(0.3, 1)
      bg.fillStyle(0xffffff, brightness)
      bg.fillCircle(x, y, 1)
    }

    const levelText = this.add
      .text(400, 300, `LEVEL ${levelNumber}`, {
        fontSize: "64px",
        fill: "#00ff00",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(99999)

    console.log(`[v0] Showing LEVEL ${levelNumber} for 3 seconds...`)

    this.time.delayedCall(3000, () => {
      levelText.destroy()
      this.isLevelTransition = false
      console.log(`[v0] Level ${this.level} gameplay started!`)
    })
  }

  update(time, delta) {
    const isLandscape = window.innerWidth > window.innerHeight

    if (this.isTournamentMode && Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
      this.togglePause()
    }
    // </CHANGE>

    if (this.isPausedByUser) {
      this.updatePauseTimer(time, delta)
      return
    }
    // </CHANGE>

    // If scene is paused, don't run game logic
    if (this.scene.isPaused()) {
      return
    }

    if (!this.ship || !this.ship.active) return

    if (time > this.nextAlienSpawn && !this.isLevelTransition && time > 15000) {
      const type = this.score >= 4000 ? "small" : "large"
      this.createAlienShip(type)
      this.nextAlienSpawn = time + this.getRandomAlienDelay()
      console.log(`[v0] Next alien spawn in ${(this.nextAlienSpawn - time) / 1000}s`)
    }

    for (let i = this.alienShips.length - 1; i >= 0; i--) {
      const alien = this.alienShips[i]

      // Remove if off screen
      if (alien.x < -100 || alien.x > 900 || alien.y < -100 || alien.y > 700) {
        alien.destroy()
        this.alienShips.splice(i, 1)
        continue
      }

      // Alien shooting - only if fully visible on screen with margin
      if (time > alien.lastShot + alien.shootDelay) {
        if (alien.x >= 50 && alien.x <= 750 && alien.y >= 50 && alien.y <= 550) {
          this.alienShoot(alien)
          alien.lastShot = time
        }
      }
    }

    for (let i = this.alienBullets.length - 1; i >= 0; i--) {
      const bullet = this.alienBullets[i]

      // Remove if off screen
      if (bullet.x < -10 || bullet.x > 810 || bullet.y < -10 || bullet.y > 610) {
        bullet.destroy()
        this.alienBullets.splice(i, 1)
        continue
      }

      if (
        this.ship.visible &&
        !this.ship.invincible &&
        this.ship.x >= 0 &&
        this.ship.x <= 800 &&
        this.ship.y >= 0 &&
        this.ship.y <= 600
      ) {
        // Check center
        const centerDistance = Phaser.Math.Distance.Between(bullet.x, bullet.y, this.ship.x, this.ship.y)

        // Check apex (front tip of triangle)
        const apexWorldX = this.ship.x + Math.cos(this.ship.rotation - Math.PI / 2) * 25
        const apexWorldY = this.ship.y + Math.sin(this.ship.rotation - Math.PI / 2) * 25
        const apexDistance = Phaser.Math.Distance.Between(bullet.x, bullet.y, apexWorldX, apexWorldY)

        if (centerDistance < 15 || apexDistance < 15) {
          console.log("[v0] Ship hit by alien bullet!")
          this.explodeShip()
          this.lives--
          this.scoreText.setText(`Score: ${this.score}  |  Level: ${this.level}  |  Lives: ${this.lives}`)

          bullet.destroy()
          this.alienBullets.splice(i, 1)

          if (this.lives <= 0) {
            this.endGame(false)
            return
          }

          this.ship.invincible = true

          this.time.delayedCall(1000, () => {
            this.ship.x = 400
            this.ship.y = 300
            this.ship.rotation = 0
            this.ship.body.setVelocity(0, 0)
            this.ship.setVisible(true)
            this.ship.setAlpha(0.3)
          })

          this.time.delayedCall(3000, () => {
            this.ship.setAlpha(1)
            this.ship.invincible = false
          })
        }
      }
    }

    if (this.cursors.left.isDown || this.touchStates.left) this.ship.rotation -= 0.05
    if (this.cursors.right.isDown || this.touchStates.right) this.ship.rotation += 0.05

    if (this.cursors.up.isDown || this.touchStates.thrust) {
      this.physics.velocityFromRotation(this.ship.rotation - Math.PI / 2, 200, this.ship.body.acceleration)
      if (!this.isThrustSoundPlaying) {
        this.playThrustSound()
        this.isThrustSoundPlaying = true
      }
    } else {
      this.ship.body.setAcceleration(0)
      if (this.isThrustSoundPlaying) {
        this.stopThrustSound()
        this.isThrustSoundPlaying = false
      }
    }

    if ((this.fireKey.isDown || this.touchStates.fire) && time > this.lastFired + 200) {
      this.fireBullet()
      this.lastFired = time
    }

    if (this.asteroids.length === 0 && !this.isLevelTransition) {
      if (this.level >= this.maxLevel) {
        this.endGame(true)
        return
      }

      this.isLevelTransition = true // Prevent multiple triggers

      const completeText = this.add
        .text(400, 300, `LEVEL ${this.level} COMPLETE`, {
          fontSize: "64px",
          fill: "#00ff00",
          stroke: "#000000",
          strokeThickness: 6,
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(99999)

      this.time.delayedCall(1000, () => {
        completeText.destroy()
        this.level++
        console.log(`[v0] Advancing to Level ${this.level}`)
        this.spawnLevelAsteroids()
        this.scoreText.setText(`Score: ${this.score}  |  Level: ${this.level}  |  Lives: ${this.lives}`)
        this.showLevelTransition(this.level)
      })
    }

    this.asteroids.forEach((a) => {
      if (a.angularVelocity) {
        a.rotation += a.angularVelocity * 0.02
      }
      if (a.customMask) {
        a.customMask.clear()
        a.customMask.fillStyle(0xffffff)
        a.customMask.fillCircle(a.x, a.y, a.asteroidSize)
      }
    })

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i]

      if (bullet.x < 0 || bullet.x > 800 || bullet.y < 0 || bullet.y > 600) {
        bullet.destroy()
        this.bullets.splice(i, 1)
        continue
      }

      for (let j = this.alienShips.length - 1; j >= 0; j--) {
        const alien = this.alienShips[j]
        const distance = Phaser.Math.Distance.Between(bullet.x, bullet.y, alien.x, alien.y)

        if (distance < alien.alienSize + 3) {
          console.log(`[v0] ${alien.alienType} alien destroyed! +${alien.alienPoints} points`)
          this.score += alien.alienPoints
          this.scoreText.setText(`Score: ${this.score}  |  Level: ${this.level}  |  Lives: ${this.lives}`)
          window.parent.postMessage({ type: "GAME_SCORE_UPDATE", score: this.score }, "*")

          this.playAlienExplosionSound()

          // Explosion effect
          for (let k = 0; k < 15; k++) {
            const particle = this.add.circle(alien.x, alien.y, 3, 0xff6600)
            particle.setDepth(200)
            this.physics.add.existing(particle)

            const angle = (k / 15) * Math.PI * 2
            const speed = Phaser.Math.Between(50, 120)
            particle.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed)

            this.tweens.add({
              targets: particle,
              alpha: 0,
              duration: 800,
              onComplete: () => particle.destroy(),
            })
          }

          alien.destroy()
          this.alienShips.splice(j, 1)
          bullet.destroy()
          this.bullets.splice(i, 1)
          break
        }
      }

      for (let j = this.asteroids.length - 1; j >= 0; j--) {
        const asteroid = this.asteroids[j]
        const distance = Phaser.Math.Distance.Between(bullet.x, bullet.y, asteroid.x, asteroid.y)

        if (distance < asteroid.asteroidSize + 3) {
          if (asteroid.isLargeUnhit) {
            this.playBigExplosionSound()
          } else if (asteroid.asteroidSize >= 15) {
            this.playMediumExplosionSound()
          } else {
            this.playSmallExplosionSound()
          }

          if (asteroid.asteroidSize >= 30) {
            this.score += 20
            this.spawnAsteroid(asteroid.x, asteroid.y, 15)
            this.spawnAsteroid(asteroid.x, asteroid.y, 15)
          } else if (asteroid.asteroidSize >= 15) {
            this.score += 50
            this.spawnAsteroid(asteroid.x, asteroid.y, 8)
            this.spawnAsteroid(asteroid.x, asteroid.y, 8)
          } else {
            this.score += 100
          }

          this.scoreText.setText(`Score: ${this.score}  |  Level: ${this.level}  |  Lives: ${this.lives}`)
          window.parent.postMessage({ type: "GAME_SCORE_UPDATE", score: this.score }, "*")

          if (asteroid.customMask) {
            asteroid.customMask.destroy()
          }
          asteroid.destroy()
          this.asteroids.splice(j, 1)
          bullet.destroy()
          this.bullets.splice(i, 1)
          break
        }
      }
    }

    if (this.ship.x < 0) this.ship.x = 800
    if (this.ship.x > 800) this.ship.x = 0
    if (this.ship.y < 0) this.ship.y = 600
    if (this.ship.y > 600) this.ship.y = 0

    this.asteroids.forEach((a) => {
      const isOffScreen = a.x < -50 || a.x > 850 || a.y < -50 || a.y > 650

      if (isOffScreen) {
        if (!a.offScreenTime) {
          a.offScreenTime = time
        } else if (time - a.offScreenTime > 10000) {
          if (a.x < -50) a.x = 50
          else if (a.x > 850) a.x = 750
          if (a.y < -50) a.y = 50
          else if (a.y > 650) a.y = 550
          a.offScreenTime = null
          return // Skip screen wrapping for this asteroid this frame
        }
      } else {
        a.offScreenTime = null
      }

      // Normal screen wrapping
      if (a.x < -50) a.x = 850
      if (a.x > 850) a.x = -50
      if (a.y < -50) a.y = 650
      if (a.y > 650) a.y = -50
    })

    if (
      !this.ship.invincible &&
      this.ship.visible &&
      this.ship.x >= 0 &&
      this.ship.x <= 800 &&
      this.ship.y >= 0 &&
      this.ship.y <= 600
    ) {
      for (let j = this.asteroids.length - 1; j >= 0; j--) {
        const asteroid = this.asteroids[j]

        const centerDistance = Phaser.Math.Distance.Between(this.ship.x, this.ship.y, asteroid.x, asteroid.y)

        // Calculate apex world position
        const apexLocalX = -9.5
        const apexLocalY = -25
        const cos = Math.cos(this.ship.rotation)
        const sin = Math.sin(this.ship.rotation)
        const apexWorldX = this.ship.x + (apexLocalX * cos - apexLocalY * sin)
        const apexWorldY = this.ship.y + (apexLocalX * sin + apexLocalY * cos)
        const apexDistance = Phaser.Math.Distance.Between(apexWorldX, apexWorldY, asteroid.x, asteroid.y)

        // Check if either center or apex collides
        if (centerDistance < asteroid.asteroidSize + 12 || apexDistance < asteroid.asteroidSize + 5) {
          console.log(`[v0] Ship collision with asteroid! Lives before: ${this.lives}`)

          this.explodeShip()

          this.lives--
          this.scoreText.setText(`Score: ${this.score}  |  Level: ${this.level}  |  Lives: ${this.lives}`)

          if (this.lives <= 0) {
            this.endGame(false)
            return
          }

          this.ship.invincible = true
          console.log(`[v0] Invincibility activated. Lives remaining: ${this.lives}`)

          this.time.delayedCall(1000, () => {
            this.ship.x = 400
            this.ship.y = 300
            this.ship.rotation = 0
            this.ship.body.setVelocity(0, 0)
            this.ship.setVisible(true)
            this.ship.setAlpha(0.3)
          })

          this.time.delayedCall(3000, () => {
            this.ship.setAlpha(1)
            this.ship.invincible = false
            console.log("[v0] Invincibility ended")
          })

          break
        }
      }
    }
    // </CHANGE>

    if (
      !this.ship.invincible &&
      this.ship.visible &&
      this.ship.x >= 0 &&
      this.ship.x <= 800 &&
      this.ship.y >= 0 &&
      this.ship.y <= 600
    ) {
      for (let j = this.alienShips.length - 1; j >= 0; j--) {
        const alien = this.alienShips[j]
        const distance = Phaser.Math.Distance.Between(this.ship.x, this.ship.y, alien.x, alien.y)

        if (distance < alien.alienSize + 15) {
          console.log("[v0] Ship collision with alien!")
          this.explodeShip()

          this.lives--
          this.scoreText.setText(`Score: ${this.score}  |  Level: ${this.level}  |  Lives: ${this.lives}`)

          // Also destroy the alien
          alien.destroy()
          this.alienShips.splice(j, 1)

          if (this.lives <= 0) {
            this.endGame(false)
            return
          }

          this.ship.invincible = true

          this.time.delayedCall(1000, () => {
            this.ship.x = 400
            this.ship.y = 300
            this.ship.rotation = 0
            this.ship.body.setVelocity(0, 0)
            this.ship.setVisible(true)
            this.ship.setAlpha(0.3)
          })

          this.time.delayedCall(3000, () => {
            this.ship.setAlpha(1)
            this.ship.invincible = false
            console.log("[v0] Invincibility ended")
          })

          break
        }
      }

      for (let j = this.asteroids.length - 1; j >= 0; j--) {
        const asteroid = this.asteroids[j]

        const centerDistance = Phaser.Math.Distance.Between(this.ship.x, this.ship.y, asteroid.x, asteroid.y)

        // Calculate apex world position
        const apexLocalX = -9.5
        const apexLocalY = -25
        const cos = Math.cos(this.ship.rotation)
        const sin = Math.sin(this.ship.rotation)
        const apexWorldX = this.ship.x + (apexLocalX * cos - apexLocalY * sin)
        const apexWorldY = this.ship.y + (apexLocalX * sin + apexLocalY * cos)
        const apexDistance = Phaser.Math.Distance.Between(apexWorldX, apexWorldY, asteroid.x, asteroid.y)

        // Check if either center or apex collides
        if (centerDistance < asteroid.asteroidSize + 12 || apexDistance < asteroid.asteroidSize + 5) {
          console.log(`[v0] Ship collision with asteroid! Lives before: ${this.lives}`)

          this.explodeShip()

          this.lives--
          this.scoreText.setText(`Score: ${this.score}  |  Level: ${this.level}  |  Lives: ${this.lives}`)

          if (this.lives <= 0) {
            this.endGame(false)
            return
          }

          this.ship.invincible = true
          console.log(`[v0] Invincibility activated. Lives remaining: ${this.lives}`)

          this.time.delayedCall(1000, () => {
            this.ship.x = 400
            this.ship.y = 300
            this.ship.rotation = 0
            this.ship.body.setVelocity(0, 0)
            this.ship.setVisible(true)
            this.ship.setAlpha(0.3)
          })

          this.time.delayedCall(3000, () => {
            this.ship.setAlpha(1)
            this.ship.invincible = false
            console.log("[v0] Invincibility ended")
          })

          break
        }
      }
    }
  }

  togglePause() {
    if (this.isPausedByUser) {
      // Unpause
      this.resumeGame()
    } else {
      // Pause
      this.pauseGame()
    }
  }

  pauseGame() {
    console.log("[v0] Pausing game - tournament timer active")
    this.isPausedByUser = true
    this.lastPauseUpdate = this.time.now

    this.physics.pause()

    if (this.ship) {
      this.ship.invincible = true
      this.ship.setVisible(false)
    }

    // Stop ship body velocity
    if (this.ship && this.ship.body) {
      this.ship.body.setVelocity(0, 0)
    }

    // Stop all asteroid movement
    this.asteroids.forEach((a) => {
      if (a.body) a.body.setVelocity(0, 0)
    })

    // Stop all alien ships
    this.alienShips.forEach((alien) => {
      if (alien.body) alien.body.setVelocity(0, 0)
    })
    // </CHANGE>

    this.alienBullets.forEach((bullet) => {
      if (bullet.body) bullet.body.setVelocity(0, 0)
    })

    // Stop all player bullets
    this.bullets.forEach((bullet) => {
      if (bullet.body) bullet.body.setVelocity(0, 0)
    })
    // </CHANGE>

    // Create semi-transparent overlay
    this.pauseOverlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.85)
    this.pauseOverlay.setDepth(10000)

    // Create pause text
    this.pauseText = this.add.text(400, 200, "GAME PAUSED", {
      fontSize: "64px",
      fontFamily: "Arial",
      color: "#00ffff",
      align: "center",
      stroke: "#000000",
      strokeThickness: 6,
    })
    this.pauseText.setOrigin(0.5)
    this.pauseText.setDepth(10001)

    const volumeButtonY = this.isTournamentMode && this.tournamentTimeRemaining !== null ? 450 : 350

    // Add background for volume button
    this.volumeToggleButtonBg = this.add.rectangle(400, volumeButtonY, 350, 60, 0x333333, 1)
    this.volumeToggleButtonBg.setDepth(10001)
    this.volumeToggleButtonBg.setInteractive({ useHandCursor: true })

    this.volumeToggleButton = this.add.text(400, volumeButtonY, this.audioMuted ? "🔇 UNMUTE SOUND" : "🔊 MUTE SOUND", {
      fontSize: "28px",
      fontFamily: "Arial",
      color: "#ffffff",
      align: "center",
      stroke: "#000000",
      strokeThickness: 4,
    })
    this.volumeToggleButton.setOrigin(0.5)
    this.volumeToggleButton.setDepth(10002)
    this.volumeToggleButton.setInteractive({ useHandCursor: true })

    const toggleAudio = () => {
      this.audioMuted = !this.audioMuted
      this.volumeToggleButton.setText(this.audioMuted ? "🔇 UNMUTE SOUND" : "🔊 MUTE SOUND")
      console.log("[v0] Audio muted:", this.audioMuted)
    }

    this.volumeToggleButton.on("pointerdown", toggleAudio)
    this.volumeToggleButtonBg.on("pointerdown", toggleAudio)
    // </CHANGE>

    if (this.isTournamentMode && this.tournamentTimeRemaining !== null) {
      const minutes = Math.floor(this.tournamentTimeRemaining / 60)
      const seconds = this.tournamentTimeRemaining % 60
      const timeString = `${minutes}:${seconds.toString().padStart(2, "0")}`

      this.pauseTimerText = this.add.text(400, 300, `Time Remaining: ${timeString}`, {
        fontSize: "48px",
        fontFamily: "Arial",
        color: "#ffff00",
        align: "center",
        stroke: "#000000",
        strokeThickness: 4,
      })
      this.pauseTimerText.setOrigin(0.5)
      this.pauseTimerText.setDepth(10001)
    }
    // </CHANGE>

    // Instructions
    const instructions = this.add.text(400, volumeButtonY + 80, "Press ESC to Resume", {
      fontSize: "24px",
      fontFamily: "Arial",
      color: "#ffffff",
      align: "center",
    })
    this.pauseInstructions = instructions
    this.pauseInstructions.setOrigin(0.5)
    this.pauseInstructions.setDepth(10001)
  }

  resumeGame() {
    console.log("[v0] Resuming game")
    this.isPausedByUser = false

    // Clear pause UI
    if (this.pauseOverlay) this.pauseOverlay.destroy()
    if (this.pauseText) this.pauseText.destroy()
    if (this.pauseTimerText) this.pauseTimerText.destroy()
    if (this.pauseInstructions) this.pauseInstructions.destroy()
    if (this.volumeToggleButton) this.volumeToggleButton.destroy()
    if (this.volumeToggleButtonBg) this.volumeToggleButtonBg.destroy()
    // </CHANGE>

    this.physics.resume()

    if (this.ship) {
      this.ship.invincible = true
      this.ship.setVisible(false)

      // Make ship visible after 1 second
      this.time.delayedCall(1000, () => {
        if (this.ship) {
          this.ship.setVisible(true)
          this.ship.setAlpha(0.3)
        }
      })

      // End invincibility after 3 seconds total
      this.time.delayedCall(3000, () => {
        if (this.ship) {
          this.ship.setAlpha(1)
          this.ship.invincible = false
          console.log("[v0] Post-pause invincibility ended")
        }
      })
    }
    // </CHANGE>
  }

  updatePauseTimer(time, delta) {
    if (!this.isTournamentMode || this.tournamentTimeRemaining === null) return
    // </CHANGE>

    // Decrease time remaining
    const deltaSeconds = delta / 1000
    this.tournamentTimeRemaining -= deltaSeconds

    // Update timer display every frame
    if (this.pauseTimerText) {
      const minutes = Math.floor(Math.max(0, this.tournamentTimeRemaining) / 60)
      const seconds = Math.floor(Math.max(0, this.tournamentTimeRemaining) % 60)
      const timeString = `${minutes}:${seconds.toString().padStart(2, "0")}`
      this.pauseTimerText.setText(`Time Remaining: ${timeString}`)

      // Change color when time is low
      if (this.tournamentTimeRemaining < 30) {
        this.pauseTimerText.setColor("#ff0000")
      } else if (this.tournamentTimeRemaining < 60) {
        this.pauseTimerText.setColor("#ff8800")
      }
    }

    // If time expires, end the game
    if (this.tournamentTimeRemaining <= 0) {
      console.log("[v0] Tournament time expired - ending game")
      this.handleTimeExpired()
    }
  }

  handleTimeExpired() {
    // Clean up pause UI
    if (this.pauseOverlay) this.pauseOverlay.destroy()
    if (this.pauseText) this.pauseText.destroy()
    if (this.pauseTimerText) this.pauseTimerText.destroy()
    if (this.pauseInstructions) this.pauseInstructions.destroy()

    this.isPausedByUser = false

    // Create expiration message
    const expiredOverlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.9)
    expiredOverlay.setDepth(10000)

    const expiredText = this.add.text(400, 250, "GAME TIME EXPIRED", {
      fontSize: "56px",
      fontFamily: "Arial",
      color: "#ff0000",
      align: "center",
      stroke: "#000000",
      strokeThickness: 6,
    })
    expiredText.setOrigin(0.5)
    expiredText.setDepth(10001)

    const scoreText = this.add.text(400, 340, `Final Score: ${this.score}`, {
      fontSize: "36px",
      fontFamily: "Arial",
      color: "#ffffff",
      align: "center",
      stroke: "#000000",
      strokeThickness: 4,
    })
    scoreText.setOrigin(0.5)
    scoreText.setDepth(10001)

    const returnText = this.add.text(400, 420, "Returning to Arcade...", {
      fontSize: "24px",
      fontFamily: "Arial",
      color: "#ffff00",
      align: "center",
    })
    returnText.setOrigin(0.5)
    returnText.setDepth(10001)

    // Send game complete message with current score
    const completionTime = Math.floor((Date.now() - this.gameStartTime) / 1000)
    console.log("[v0] Sending GAME_OVER due to time expiration:", {
      score: this.score,
      time: completionTime,
      reason: "timeout",
    })

    window.parent.postMessage(
      {
        type: "GAME_OVER",
        score: this.score,
        time: completionTime,
      },
      "*",
    )

    // Return to arcade after 3 seconds
    this.time.delayedCall(3000, () => {
      window.parent.postMessage({ type: "RETURN_TO_ARCADE" }, "*")
    })
  }
  // </CHANGE>

  endGame(victory) {
    const gameTime = Math.floor((Date.now() - this.gameStartTime) / 1000)

    console.log(`[v0] 🎮 Game ${victory ? "Complete" : "Over"}! Final Score: ${this.score}, Time: ${gameTime}s`)

    this.scene.pause()

    const message = victory ? "LEVEL 3 COMPLETE!" : "GAME OVER"
    const color = victory ? "#00ff00" : "#ff0000"

    this.add
      .text(400, 200, message, {
        fontSize: "64px",
        fill: color,
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(99999)

    this.add
      .text(400, 300, `Final Score: ${this.score}`, {
        fontSize: "40px",
        fill: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(99999)

    this.add
      .text(400, 360, `Time: ${gameTime}s`, {
        fontSize: "28px",
        fill: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(99999)

    const lifeBonus = this.lives * 1000
    const totalScore = this.score + lifeBonus

    if (this.lives > 0) {
      this.add
        .text(400, 420, `Lives Remaining: ${this.lives} x 1000 = ${lifeBonus}`, {
          fontSize: "24px",
          fill: "#ffff00",
          stroke: "#000000",
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(99999)

      this.add
        .text(400, 460, `Tournament Score: ${totalScore}`, {
          fontSize: "32px",
          fill: "#00ffff",
          stroke: "#000000",
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(99999)
    }

    const playAgainBtn = this.add
      .text(280, 450, "PLAY AGAIN", {
        fontSize: "24px",
        fill: "#00ff00",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(99999)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        this.scene.restart()
      })

    const backBtn = this.add
      .text(520, 450, "BACK TO ARCADE", {
        fontSize: "24px",
        fill: "#ffff00",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(99999)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => {
        if (window.parent) {
          window.parent.postMessage({ type: "RETURN_TO_ARCADE" }, "*")
        }
      })

    if (window.parent) {
      console.log("[v0] 🎮 Asteroids game ended!")
      console.log("[v0] 🎮 Final score:", this.score)
      console.log("[v0] 🎮 Game time:", gameTime)
      console.log("[v0] 🎮 Victory:", victory)
      console.log("[v0] 🎮 Sending GAME_COMPLETE message to parent...")

      const message = {
        type: "GAME_COMPLETE",
        gameId: "asteroids",
        score: this.score,
        gameTime: gameTime,
        victory: victory,
      }
      console.log("[v0] 🎮 Message being sent:", message)
      window.parent.postMessage(message, "*")
      console.log("[v0] 🎮 postMessage called successfully")
    } else {
      console.error("[v0] ❌ No window.parent available!")
    }
  }

  fireBullet() {
    // Ship's triangle apex points UP in local space
    // Rotate the apex point by the ship's rotation to get world position
    const apexLocalX = -9.5
    const apexLocalY = -25

    const cos = Math.cos(this.ship.rotation)
    const sin = Math.sin(this.ship.rotation)

    const rotatedOffsetX = apexLocalX * cos - apexLocalY * sin
    const rotatedOffsetY = apexLocalX * sin + apexLocalY * cos

    const bulletX = this.ship.x + rotatedOffsetX
    const bulletY = this.ship.y + rotatedOffsetY

    const bullet = this.add.circle(bulletX, bulletY, 3, 0x00ffff)
    bullet.setDepth(100)
    this.physics.add.existing(bullet)

    // Ship's forward direction is rotation - 90 degrees since apex points UP
    const bulletAngle = this.ship.rotation - Math.PI / 2
    this.physics.velocityFromRotation(bulletAngle, 400, bullet.body.velocity)

    this.bullets.push(bullet)

    this.playLaserSound()
  }

  initAudio() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    }
  }

  playLaserSound() {
    if (!this.audioContext || this.audioMuted) return // Check mute state

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.type = "sawtooth"
    oscillator.frequency.setValueAtTime(1200, this.audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(80, this.audioContext.currentTime + 0.35)

    gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime)
    gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime + 0.05)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.35)

    oscillator.start()
    oscillator.stop(this.audioContext.currentTime + 0.35)
  }

  playAlienLaserSound() {
    if (!this.audioContext || this.audioMuted) return // Check mute state

    const now = this.audioContext.currentTime

    // Main alien laser with warbling effect
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    // LFO for warbling effect
    const lfo = this.audioContext.createOscillator()
    const lfoGain = this.audioContext.createGain()

    lfo.frequency.setValueAtTime(8, now) // 8Hz warble
    lfoGain.gain.setValueAtTime(80, now) // Warble depth

    lfo.connect(lfoGain)
    lfoGain.connect(oscillator.frequency)

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    // Square wave for that electronic alien sound
    oscillator.type = "square"
    oscillator.frequency.setValueAtTime(900, now)
    oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.25)

    gainNode.gain.setValueAtTime(0.12, now)
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25)

    lfo.start(now)
    lfo.stop(now + 0.25)
    oscillator.start(now)
    oscillator.stop(now + 0.25)

    // High-frequency "zap" layer for alien character
    const zap = this.audioContext.createOscillator()
    const zapGain = this.audioContext.createGain()

    zap.connect(zapGain)
    zapGain.connect(this.audioContext.destination)

    zap.type = "sine"
    zap.frequency.setValueAtTime(2400, now)
    zap.frequency.exponentialRampToValueAtTime(1200, now + 0.15)

    zapGain.gain.setValueAtTime(0.08, now)
    zapGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15)

    zap.start(now)
    zap.stop(now + 0.15)
  }

  playBigExplosionSound() {
    if (!this.audioContext || this.audioMuted) return // Check mute state

    if (typeof window !== "undefined" && window.parent) {
      console.log("[v0] Sending MAX BIG vibration to parent window")
      window.parent.postMessage(
        {
          type: "GAME_VIBRATE",
          pattern: [500, 100, 500, 100, 500], // MAX vibration
          intensity: "big",
        },
        "*",
      )
    }

    const now = this.audioContext.currentTime

    // Create convolver for reverb/echo effect
    const convolver = this.audioContext.createConvolver()
    const reverbBuffer = this.audioContext.createBuffer(
      2,
      this.audioContext.sampleRate * 3,
      this.audioContext.sampleRate,
    )
    const leftChannel = reverbBuffer.getChannelData(0)
    const rightChannel = reverbBuffer.getChannelData(1)

    // Create echo/reverb impulse response
    for (let i = 0; i < reverbBuffer.length; i++) {
      const decay = Math.exp(-i / (this.audioContext.sampleRate * 0.8))
      leftChannel[i] = (Math.random() * 2 - 1) * decay * 0.3
      rightChannel[i] = (Math.random() * 2 - 1) * decay * 0.3
    }
    convolver.buffer = reverbBuffer

    const initialBoom = this.audioContext.createOscillator()
    const initialBoomGain = this.audioContext.createGain()
    initialBoom.connect(initialBoomGain)
    initialBoomGain.connect(convolver)
    convolver.connect(this.audioContext.destination)
    initialBoom.type = "sine"
    initialBoom.frequency.setValueAtTime(150, now) // Start higher for impact
    initialBoom.frequency.exponentialRampToValueAtTime(20, now + 0.3) // Sharp drop
    initialBoomGain.gain.setValueAtTime(1.0, now) // MAXIMUM volume for initial boom
    initialBoomGain.gain.exponentialRampToValueAtTime(0.4, now + 0.15) // Stay loud longer
    initialBoomGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5)
    initialBoom.start(now)
    initialBoom.stop(now + 0.5)

    // Deep sub-bass rumble (much deeper and longer)
    const bass = this.audioContext.createOscillator()
    const bassGain = this.audioContext.createGain()
    bass.connect(bassGain)
    bassGain.connect(convolver)
    convolver.connect(this.audioContext.destination)
    bass.type = "sine"
    bass.frequency.setValueAtTime(100, now + 0.1)
    bass.frequency.exponentialRampToValueAtTime(15, now + 1.2)
    bassGain.gain.setValueAtTime(0.7, now + 0.1)
    bassGain.gain.exponentialRampToValueAtTime(0.01, now + 1.2)
    bass.start(now + 0.1)
    bass.stop(now + 1.2)

    // Secondary bass layer for extra depth
    const bass2 = this.audioContext.createOscillator()
    const bass2Gain = this.audioContext.createGain()
    bass2.connect(bass2Gain)
    bass2Gain.connect(convolver)
    convolver.connect(this.audioContext.destination)
    bass2.type = "triangle"
    bass2.frequency.setValueAtTime(60, now + 0.15)
    bass2.frequency.exponentialRampToValueAtTime(10, now + 1.0)
    bass2Gain.gain.setValueAtTime(0.6, now + 0.15)
    bass2Gain.gain.exponentialRampToValueAtTime(0.01, now + 1.0)
    bass2.start(now + 0.15)
    bass2.stop(now + 1.0)

    // Loud mid-range crunch
    const crunch = this.audioContext.createOscillator()
    const crunchGain = this.audioContext.createGain()
    crunch.connect(crunchGain)
    crunchGain.connect(convolver)
    convolver.connect(this.audioContext.destination)
    crunch.type = "sawtooth"
    crunch.frequency.setValueAtTime(300, now + 0.05)
    crunch.frequency.exponentialRampToValueAtTime(30, now + 0.8)
    crunchGain.gain.setValueAtTime(0.5, now + 0.05)
    crunchGain.gain.exponentialRampToValueAtTime(0.01, now + 0.8)
    crunch.start(now + 0.05)
    crunch.stop(now + 0.8)

    // High-frequency sizzle with echo
    const noise = this.audioContext.createBufferSource()
    const noiseBuffer = this.audioContext.createBuffer(
      1,
      this.audioContext.sampleRate * 0.7,
      this.audioContext.sampleRate,
    )
    const noiseData = noiseBuffer.getChannelData(0)
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = Math.random() * 2 - 1
    }
    noise.buffer = noiseBuffer

    const noiseFilter = this.audioContext.createBiquadFilter()
    noiseFilter.type = "highpass"
    noiseFilter.frequency.setValueAtTime(2000, now)

    const noiseGain = this.audioContext.createGain()
    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(convolver)
    convolver.connect(this.audioContext.destination)
    noiseGain.gain.setValueAtTime(0.4, now + 0.05)
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.7)
    noise.start(now + 0.05)
  }

  playShipExplosionSound() {
    if (!this.audioContext || this.audioMuted) return // Check mute state

    if (typeof window !== "undefined" && window.parent) {
      console.log("[v0] Sending MAX SHIP vibration to parent window")
      window.parent.postMessage(
        {
          type: "GAME_VIBRATE",
          pattern: [1000, 100, 1000, 100, 1000], // MAX STRONGEST vibration
          intensity: "ship",
        },
        "*",
      )
    }

    const now = this.audioContext.currentTime

    // Create convolver for reverb/echo effect
    const convolver = this.audioContext.createConvolver()
    const reverbBuffer = this.audioContext.createBuffer(
      2,
      this.audioContext.sampleRate * 4,
      this.audioContext.sampleRate,
    )
    const leftChannel = reverbBuffer.getChannelData(0)
    const rightChannel = reverbBuffer.getChannelData(1)

    for (let i = 0; i < reverbBuffer.length; i++) {
      const decay = Math.exp(-i / (this.audioContext.sampleRate * 1.0))
      leftChannel[i] = (Math.random() * 2 - 1) * decay * 0.4
      rightChannel[i] = (Math.random() * 2 - 1) * decay * 0.4
    }
    convolver.buffer = reverbBuffer

    // Initial boom - held longer
    const initialBoom = this.audioContext.createOscillator()
    const initialBoomGain = this.audioContext.createGain()
    initialBoom.connect(initialBoomGain)
    initialBoomGain.connect(convolver)
    convolver.connect(this.audioContext.destination)
    initialBoom.type = "sine"
    initialBoom.frequency.setValueAtTime(150, now)
    initialBoom.frequency.exponentialRampToValueAtTime(20, now + 0.5)
    initialBoomGain.gain.setValueAtTime(1.0, now)
    initialBoomGain.gain.exponentialRampToValueAtTime(0.5, now + 0.3)
    initialBoomGain.gain.exponentialRampToValueAtTime(0.01, now + 0.8)
    initialBoom.start(now)
    initialBoom.stop(now + 0.8)

    // Deep sub-bass rumble - extended duration
    const bass = this.audioContext.createOscillator()
    const bassGain = this.audioContext.createGain()
    bass.connect(bassGain)
    bassGain.connect(convolver)
    convolver.connect(this.audioContext.destination)
    bass.type = "sine"
    bass.frequency.setValueAtTime(100, now + 0.1)
    bass.frequency.exponentialRampToValueAtTime(12, now + 1.8)
    bassGain.gain.setValueAtTime(0.8, now + 0.1)
    bassGain.gain.exponentialRampToValueAtTime(0.01, now + 1.8)
    bass.start(now + 0.1)
    bass.stop(now + 1.8)

    // Secondary bass layer - longer
    const bass2 = this.audioContext.createOscillator()
    const bass2Gain = this.audioContext.createGain()
    bass2.connect(bass2Gain)
    bass2Gain.connect(convolver)
    convolver.connect(this.audioContext.destination)
    bass2.type = "triangle"
    bass2.frequency.setValueAtTime(60, now + 0.15)
    bass2.frequency.exponentialRampToValueAtTime(8, now + 1.5)
    bass2Gain.gain.setValueAtTime(0.7, now + 0.15)
    bass2Gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5)
    bass2.start(now + 0.15)
    bass2.stop(now + 1.5)

    // Tertiary ultra-low bass for maximum depth
    const bass3 = this.audioContext.createOscillator()
    const bass3Gain = this.audioContext.createGain()
    bass3.connect(bass3Gain)
    bass3Gain.connect(convolver)
    convolver.connect(this.audioContext.destination)
    bass3.type = "sine"
    bass3.frequency.setValueAtTime(40, now + 0.2)
    bass3.frequency.exponentialRampToValueAtTime(3, now + 1.8)
    bass3Gain.gain.setValueAtTime(0.7, now + 0.2)
    bass3Gain.gain.exponentialRampToValueAtTime(0.01, now + 1.8)
    bass3.start(now + 0.2)
    bass3.stop(now + 1.8)

    // Mid-range crunch - extended
    const crunch = this.audioContext.createOscillator()
    const crunchGain = this.audioContext.createGain()
    crunch.connect(crunchGain)
    crunchGain.connect(convolver)
    convolver.connect(this.audioContext.destination)
    crunch.type = "sawtooth"
    crunch.frequency.setValueAtTime(300, now + 0.05)
    crunch.frequency.exponentialRampToValueAtTime(25, now + 1.2)
    crunchGain.gain.setValueAtTime(0.6, now + 0.05)
    crunchGain.gain.exponentialRampToValueAtTime(0.01, now + 1.2)
    crunch.start(now + 0.05)
    crunch.stop(now + 1.2)

    // High-frequency sizzle - held longer
    const noise = this.audioContext.createBufferSource()
    const noiseBuffer = this.audioContext.createBuffer(
      1,
      this.audioContext.sampleRate * 1.0,
      this.audioContext.sampleRate,
    )
    const noiseData = noiseBuffer.getChannelData(0)
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = Math.random() * 2 - 1
    }
    noise.buffer = noiseBuffer

    const noiseFilter = this.audioContext.createBiquadFilter()
    noiseFilter.type = "highpass"
    noiseFilter.frequency.setValueAtTime(2000, now)

    const noiseGain = this.audioContext.createGain()
    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(convolver)
    convolver.connect(this.audioContext.destination)
    noiseGain.gain.setValueAtTime(0.5, now + 0.05)
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 1.0)
    noise.start(now + 0.05)
  }

  playAlienExplosionSound() {
    if (!this.audioContext || this.audioMuted) return // Check mute state

    if (typeof window !== "undefined" && window.parent) {
      console.log("[v0] Sending MAX ALIEN vibration to parent window")
      window.parent.postMessage(
        {
          type: "GAME_VIBRATE",
          pattern: [800, 100, 800, 100, 800], // MAX vibration
          intensity: "alien",
        },
        "*",
      )
    }

    const now = this.audioContext.currentTime

    // Create massive reverb for alien destruction
    const convolver = this.audioContext.createConvolver()
    const reverbBuffer = this.audioContext.createBuffer(
      2,
      this.audioContext.sampleRate * 5,
      this.audioContext.sampleRate,
    )
    const leftChannel = reverbBuffer.getChannelData(0)
    const rightChannel = reverbBuffer.getChannelData(1)

    for (let i = 0; i < reverbBuffer.length; i++) {
      const decay = Math.exp(-i / (this.audioContext.sampleRate * 1.2))
      leftChannel[i] = (Math.random() * 2 - 1) * decay * 0.5
      rightChannel[i] = (Math.random() * 2 - 1) * decay * 0.5
    }
    convolver.buffer = reverbBuffer

    // MASSIVE initial impact boom
    const initialBoom = this.audioContext.createOscillator()
    const initialBoomGain = this.audioContext.createGain()
    initialBoom.connect(initialBoomGain)
    initialBoomGain.connect(convolver)
    convolver.connect(this.audioContext.destination)
    initialBoom.type = "sine"
    initialBoom.frequency.setValueAtTime(200, now)
    initialBoom.frequency.exponentialRampToValueAtTime(15, now + 0.6)
    initialBoomGain.gain.setValueAtTime(1.0, now)
    initialBoomGain.gain.exponentialRampToValueAtTime(0.6, now + 0.2)
    initialBoomGain.gain.exponentialRampToValueAtTime(0.01, now + 0.9)
    initialBoom.start(now)
    initialBoom.stop(now + 0.9)

    // Ultra-deep sub-bass earthquake
    const bass = this.audioContext.createOscillator()
    const bassGain = this.audioContext.createGain()
    bass.connect(bassGain)
    bassGain.connect(convolver)
    convolver.connect(this.audioContext.destination)
    bass.type = "sine"
    bass.frequency.setValueAtTime(120, now + 0.1)
    bass.frequency.exponentialRampToValueAtTime(8, now + 2.2)
    bassGain.gain.setValueAtTime(0.9, now + 0.1)
    bassGain.gain.exponentialRampToValueAtTime(0.01, now + 2.2)
    bass.start(now + 0.1)
    bass.stop(now + 2.2)

    // Secondary massive bass layer
    const bass2 = this.audioContext.createOscillator()
    const bass2Gain = this.audioContext.createGain()
    bass2.connect(bass2Gain)
    bass2Gain.connect(convolver)
    convolver.connect(this.audioContext.destination)
    bass2.type = "triangle"
    bass2.frequency.setValueAtTime(80, now + 0.15)
    bass2.frequency.exponentialRampToValueAtTime(5, now + 2.0)
    bass2Gain.gain.setValueAtTime(0.8, now + 0.15)
    bass2Gain.gain.exponentialRampToValueAtTime(0.01, now + 2.0)
    bass2.start(now + 0.15)
    bass2.stop(now + 2.0)

    // Tertiary ultra-low bass for maximum depth
    const bass3 = this.audioContext.createOscillator()
    const bass3Gain = this.audioContext.createGain()
    bass3.connect(bass3Gain)
    bass3Gain.connect(convolver)
    convolver.connect(this.audioContext.destination)
    bass3.type = "sine"
    bass3.frequency.setValueAtTime(40, now + 0.2)
    bass3.frequency.exponentialRampToValueAtTime(3, now + 1.8)
    bass3Gain.gain.setValueAtTime(0.7, now + 0.2)
    bass3Gain.gain.exponentialRampToValueAtTime(0.01, now + 1.8)
    bass3.start(now + 0.2)
    bass3.stop(now + 1.8)

    // Heavy mid-range destruction crunch
    const crunch = this.audioContext.createOscillator()
    const crunchGain = this.audioContext.createGain()
    crunch.connect(crunchGain)
    crunchGain.connect(convolver)
    convolver.connect(this.audioContext.destination)
    crunch.type = "sawtooth"
    crunch.frequency.setValueAtTime(400, now + 0.05)
    crunch.frequency.exponentialRampToValueAtTime(20, now + 1.4)
    crunchGain.gain.setValueAtTime(0.7, now + 0.05)
    crunchGain.gain.exponentialRampToValueAtTime(0.01, now + 1.4)
    crunch.start(now + 0.05)
    crunch.stop(now + 1.4)

    // Secondary crunch layer for extra power
    const crunch2 = this.audioContext.createOscillator()
    const crunch2Gain = this.audioContext.createGain()
    crunch2.connect(crunch2Gain)
    crunch2Gain.connect(convolver)
    convolver.connect(this.audioContext.destination)
    crunch2.type = "square"
    crunch2.frequency.setValueAtTime(250, now + 0.08)
    crunch2.frequency.exponentialRampToValueAtTime(18, now + 1.2)
    crunch2Gain.gain.setValueAtTime(0.5, now + 0.08)
    crunch2Gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2)
    crunch2.start(now + 0.08)
    crunch2.stop(now + 1.2)

    // Extended high-frequency alien destruction sizzle
    const noise = this.audioContext.createBufferSource()
    const noiseBuffer = this.audioContext.createBuffer(
      1,
      this.audioContext.sampleRate * 1.3,
      this.audioContext.sampleRate,
    )
    const noiseData = noiseBuffer.getChannelData(0)
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = Math.random() * 2 - 1
    }
    noise.buffer = noiseBuffer

    const noiseFilter = this.audioContext.createBiquadFilter()
    noiseFilter.type = "highpass"
    noiseFilter.frequency.setValueAtTime(2500, now)

    const noiseGain = this.audioContext.createGain()
    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(convolver)
    convolver.connect(this.audioContext.destination)
    noiseGain.gain.setValueAtTime(0.6, now + 0.05)
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 1.3)
    noise.start(now + 0.05)
  }

  playMediumExplosionSound() {
    if (!this.audioContext || this.audioMuted) return // Check mute state

    if (typeof window !== "undefined" && window.parent) {
      console.log("[v0] Sending MAX MEDIUM vibration to parent window")
      window.parent.postMessage(
        {
          type: "GAME_VIBRATE",
          pattern: [400, 80, 400, 80, 400], // MAX vibration
          intensity: "medium",
        },
        "*",
      )
    }

    const now = this.audioContext.currentTime

    // Create convolver for reverb/echo effect (same as big explosion but shorter)
    const convolver = this.audioContext.createConvolver()
    const reverbBuffer = this.audioContext.createBuffer(
      2,
      this.audioContext.sampleRate * 2,
      this.audioContext.sampleRate,
    )
    const leftChannel = reverbBuffer.getChannelData(0)
    const rightChannel = reverbBuffer.getChannelData(1)

    for (let i = 0; i < reverbBuffer.length; i++) {
      const decay = Math.exp(-i / (this.audioContext.sampleRate * 0.6))
      leftChannel[i] = (Math.random() * 2 - 1) * decay * 0.25
      rightChannel[i] = (Math.random() * 2 - 1) * decay * 0.25
    }
    convolver.buffer = reverbBuffer

    const initialBoom = this.audioContext.createOscillator()
    const initialBoomGain = this.audioContext.createGain()
    initialBoom.connect(initialBoomGain)
    initialBoomGain.connect(convolver)
    convolver.connect(this.audioContext.destination)
    initialBoom.type = "sine"
    initialBoom.frequency.setValueAtTime(130, now)
    initialBoom.frequency.exponentialRampToValueAtTime(18, now + 0.25)
    initialBoomGain.gain.setValueAtTime(0.8, now)
    initialBoomGain.gain.exponentialRampToValueAtTime(0.3, now + 0.12)
    initialBoomGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4)
    initialBoom.start(now)
    initialBoom.stop(now + 0.4)

    // Deep sub-bass rumble (70% volume, shorter)
    const bass = this.audioContext.createOscillator()
    const bassGain = this.audioContext.createGain()
    bass.connect(bassGain)
    bassGain.connect(convolver)
    convolver.connect(this.audioContext.destination)
    bass.type = "sine"
    bass.frequency.setValueAtTime(85, now + 0.08)
    bass.frequency.exponentialRampToValueAtTime(13, now + 0.8)
    bassGain.gain.setValueAtTime(0.5, now + 0.08) // 70% of 0.7
    bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.8)
    bass.start(now + 0.08)
    bass.stop(now + 0.8)

    // Secondary bass layer
    const bass2 = this.audioContext.createOscillator()
    const bass2Gain = this.audioContext.createGain()
    bass2.connect(bass2Gain)
    bass2Gain.connect(convolver)
    convolver.connect(this.audioContext.destination)
    bass2.type = "triangle"
    bass2.frequency.setValueAtTime(50, now + 0.12)
    bass2.frequency.exponentialRampToValueAtTime(9, now + 0.7)
    bass2Gain.gain.setValueAtTime(0.4, now + 0.12) // 70% of 0.6
    bass2Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7)
    bass2.start(now + 0.12)
    bass2.stop(now + 0.7)

    // Mid-range crunch
    const crunch = this.audioContext.createOscillator()
    const crunchGain = this.audioContext.createGain()
    crunch.connect(crunchGain)
    crunchGain.connect(convolver)
    convolver.connect(this.audioContext.destination)
    crunch.type = "sawtooth"
    crunch.frequency.setValueAtTime(250, now + 0.04)
    crunch.frequency.exponentialRampToValueAtTime(28, now + 0.6)
    crunchGain.gain.setValueAtTime(0.35, now + 0.04) // 70% of 0.5
    crunchGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6)
    crunch.start(now + 0.04)
    crunch.stop(now + 0.6)

    // High-frequency sizzle
    const noise = this.audioContext.createBufferSource()
    const noiseBuffer = this.audioContext.createBuffer(
      1,
      this.audioContext.sampleRate * 0.5,
      this.audioContext.sampleRate,
    )
    const noiseData = noiseBuffer.getChannelData(0)
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = Math.random() * 2 - 1
    }
    noise.buffer = noiseBuffer

    const noiseFilter = this.audioContext.createBiquadFilter()
    noiseFilter.type = "highpass"
    noiseFilter.frequency.setValueAtTime(1800, now)

    const noiseGain = this.audioContext.createGain()
    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(convolver)
    convolver.connect(this.audioContext.destination)
    noiseGain.gain.setValueAtTime(0.28, now + 0.04) // 70% of 0.4
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5)
    noise.start(now + 0.04)
  }

  playSmallExplosionSound() {
    if (!this.audioContext || this.audioMuted) return // Check mute state

    if (typeof window !== "undefined" && window.parent) {
      console.log("[v0] Sending MAX SMALL vibration to parent window")
      window.parent.postMessage(
        {
          type: "GAME_VIBRATE",
          pattern: [200, 50, 200], // MAX vibration (double pulse)
          intensity: "small",
        },
        "*",
      )
    }

    const now = this.audioContext.currentTime

    // Create convolver for subtle reverb
    const convolver = this.audioContext.createConvolver()
    const reverbBuffer = this.audioContext.createBuffer(
      2,
      this.audioContext.sampleRate * 1,
      this.audioContext.sampleRate,
    )
    const leftChannel = reverbBuffer.getChannelData(0)
    const rightChannel = reverbBuffer.getChannelData(1)

    for (let i = 0; i < reverbBuffer.length; i++) {
      const decay = Math.exp(-i / (this.audioContext.sampleRate * 0.3))
      leftChannel[i] = (Math.random() * 2 - 1) * decay * 0.15
      rightChannel[i] = (Math.random() * 2 - 1) * decay * 0.15
    }
    convolver.buffer = reverbBuffer

    const initialBoom = this.audioContext.createOscillator()
    const initialBoomGain = this.audioContext.createGain()
    initialBoom.connect(initialBoomGain)
    initialBoomGain.connect(convolver)
    convolver.connect(this.audioContext.destination)
    initialBoom.type = "sine"
    initialBoom.frequency.setValueAtTime(110, now)
    initialBoom.frequency.exponentialRampToValueAtTime(22, now + 0.15)
    initialBoomGain.gain.setValueAtTime(0.6, now)
    initialBoomGain.gain.exponentialRampToValueAtTime(0.15, now + 0.08)
    initialBoomGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25)
    initialBoom.start(now)
    initialBoom.stop(now + 0.25)

    // Deep sub-bass rumble (40% volume, quick)
    const bass = this.audioContext.createOscillator()
    const bassGain = this.audioContext.createGain()
    bass.connect(bassGain)
    bassGain.connect(convolver)
    convolver.connect(this.audioContext.destination)
    bass.type = "sine"
    bass.frequency.setValueAtTime(70, now + 0.05)
    bass.frequency.exponentialRampToValueAtTime(16, now + 0.4)
    bassGain.gain.setValueAtTime(0.3, now + 0.05) // 40% of 0.7
    bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4)
    bass.start(now + 0.05)
    bass.stop(now + 0.4)

    // Secondary bass layer
    const bass2 = this.audioContext.createOscillator()
    const bass2Gain = this.audioContext.createGain()
    bass2.connect(bass2Gain)
    bass2Gain.connect(convolver)
    convolver.connect(this.audioContext.destination)
    bass2.type = "triangle"
    bass2.frequency.setValueAtTime(45, now + 0.08)
    bass2.frequency.exponentialRampToValueAtTime(12, now + 0.35)
    bass2Gain.gain.setValueAtTime(0.25, now + 0.08) // 40% of 0.6
    bass2Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35)
    bass2.start(now + 0.08)
    bass2.stop(now + 0.35)

    // Mid-range crunch
    const crunch = this.audioContext.createOscillator()
    const crunchGain = this.audioContext.createGain()
    crunch.connect(crunchGain)
    crunchGain.connect(convolver)
    convolver.connect(this.audioContext.destination)
    crunch.type = "sawtooth"
    crunch.frequency.setValueAtTime(220, now + 0.02)
    crunch.frequency.exponentialRampToValueAtTime(32, now + 0.3)
    crunchGain.gain.setValueAtTime(0.2, now + 0.02) // 40% of 0.5
    crunchGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)
    crunch.start(now + 0.02)
    crunch.stop(now + 0.3)

    // High-frequency sizzle
    const noise = this.audioContext.createBufferSource()
    const noiseBuffer = this.audioContext.createBuffer(
      1,
      this.audioContext.sampleRate * 0.25,
      this.audioContext.sampleRate,
    )
    const noiseData = noiseBuffer.getChannelData(0)
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = Math.random() * 2 - 1
    }
    noise.buffer = noiseBuffer

    const noiseFilter = this.audioContext.createBiquadFilter()
    noiseFilter.type = "highpass"
    noiseFilter.frequency.setValueAtTime(2200, now)

    const noiseGain = this.audioContext.createGain()
    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(convolver)
    convolver.connect(this.audioContext.destination)
    noiseGain.gain.setValueAtTime(0.16, now + 0.02) // 40% of 0.4
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25)
    noise.start(now + 0.02)
  }

  playThrustSound() {
    if (!this.audioContext || this.audioMuted) return // Check mute state

    // Stop any existing thrust sound
    this.stopThrustSound()

    const now = this.audioContext.currentTime

    // Create a continuous rumbling thrust sound with pulsing effect

    // Deep rumbling bass engine
    const bassOsc = this.audioContext.createOscillator()
    const bassGain = this.audioContext.createGain()
    bassOsc.type = "sawtooth"
    bassOsc.frequency.setValueAtTime(40, now)
    bassOsc.frequency.linearRampToValueAtTime(35, now + 0.1)
    bassGain.gain.setValueAtTime(0.4, now)
    bassOsc.connect(bassGain)
    bassGain.connect(this.audioContext.destination)
    bassOsc.start(now)

    // Mid-range engine roar with pulsing
    const midOsc = this.audioContext.createOscillator()
    const midGain = this.audioContext.createGain()
    const midLFO = this.audioContext.createOscillator()
    const midLFOGain = this.audioContext.createGain()

    midOsc.type = "sawtooth"
    midOsc.frequency.setValueAtTime(80, now)
    midLFO.frequency.setValueAtTime(8, now) // 8Hz pulse
    midLFOGain.gain.setValueAtTime(0.15, now)

    midLFO.connect(midLFOGain)
    midLFOGain.connect(midGain.gain)
    midOsc.connect(midGain)
    midGain.gain.setValueAtTime(0.3, now)
    midGain.connect(this.audioContext.destination)

    midOsc.start(now)
    midLFO.start(now)

    // High-frequency sizzle for rocket exhaust
    const noiseBuffer = this.audioContext.createBuffer(
      1,
      this.audioContext.sampleRate * 2,
      this.audioContext.sampleRate,
    )
    const noiseData = noiseBuffer.getChannelData(0)
    for (let i = 0; i < noiseBuffer.length; i++) {
      noiseData[i] = Math.random() * 2 - 1
    }

    const noiseSource = this.audioContext.createBufferSource()
    noiseSource.buffer = noiseBuffer
    noiseSource.loop = true

    const noiseFilter = this.audioContext.createBiquadFilter()
    noiseFilter.type = "highpass"
    noiseFilter.frequency.setValueAtTime(800, now)

    const noiseGain = this.audioContext.createGain()
    noiseGain.gain.setValueAtTime(0.15, now)

    noiseSource.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(this.audioContext.destination)

    noiseSource.start(now)

    // Store references for cleanup
    this.thrustOscillators = [bassOsc, midOsc, midLFO, noiseSource]
    this.thrustGains = [bassGain, midGain, noiseGain]
  }

  stopThrustSound() {
    if (this.thrustOscillators) {
      const now = this.audioContext.currentTime

      // Fade out smoothly
      this.thrustGains.forEach((gain) => {
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1)
      })

      // Stop oscillators after fade
      setTimeout(() => {
        this.thrustOscillators.forEach((osc) => {
          try {
            osc.stop()
          } catch (e) {
            // Already stopped
          }
        })
        this.thrustOscillators = null
        this.thrustGains = null
      }, 150)
    }
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "game-container",
  backgroundColor: "#000000",
  physics: { default: "arcade", arcade: { debug: false } },
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.NONE,
    width: 800,
    height: 600,
  },
}

console.log("[v0] Creating Phaser Game V782 with alien ships")
new Phaser.Game(config)
