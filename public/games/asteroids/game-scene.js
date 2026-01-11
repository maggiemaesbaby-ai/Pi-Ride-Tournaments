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
    this.lastFired = 0

    this.cursors = this.input.keyboard.createCursorKeys()
    this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
    this.createTouchControls()

    this.input.addPointer(3) // Support up to 4 simultaneous touches

    this.setupControls()
    this.setupMessageListener()

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

    console.log(
      `[v0] Touch controls - PWA: ${isPWA}, Pi Browser: ${isPiBrowser()}, Portrait: ${isPortraitMode}, Y: ${visualY}`,
    )

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

    // If scene is paused, don't run game logic
    if (this.scene.isPaused()) {
      return
    }

    if (!this.ship || !this.ship.active) return

    if (time > this.nextAlienSpawn && !this.isLevelTransition && time > 15000) {
      // Determine which type to spawn based on score
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

      if (this.ship.visible && !this.ship.invincible) {
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

          break
        }
      }
    }

    if (this.cursors.left.isDown || this.touchStates.left) this.ship.rotation -= 0.05
    if (this.cursors.right.isDown || this.touchStates.right) this.ship.rotation += 0.05

    if (this.cursors.up.isDown || this.touchStates.thrust) {
      this.physics.velocityFromRotation(this.ship.rotation - Math.PI / 2, 200, this.ship.body.acceleration)
    } else {
      this.ship.body.setAcceleration(0)
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

    if (this.ship.x < 0) this.ship.x = 800
    if (this.ship.x > 800) this.ship.x = 0
    if (this.ship.y < 0) this.ship.y = 600
    if (this.ship.y > 600) this.ship.y = 0

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

          if (asteroid.customMask) {
            asteroid.customMask.destroy()
          }
          asteroid.destroy()
          this.asteroids.splice(j, 1)

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

          break
        }
      }
    }

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
  }

  endGame(victory) {
    const gameTime = Math.floor((Date.now() - this.gameStartTime) / 1000)

    console.log(`[v0] Game ${victory ? "Complete" : "Over"}! Final Score: ${this.score}, Time: ${gameTime}s`)

    if (tournamentEntryId && tournamentUserId) {
      const isPWA = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true
      const platform = isPWA ? "pwa" : "pi-browser"

      console.log(
        `[v0] Submitting tournament score: ${this.score}, Platform: ${platform}, Entry ID: ${tournamentEntryId}`,
      )

      fetch("/api/arcade/tournament/submit-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryId: tournamentEntryId,
          userId: tournamentUserId,
          gameId: "asteroids",
          score: this.score,
          gameTime,
          platform,
        }),
      })
        .then((res) => res.json())
        .then((data) => console.log("[v0] Score submitted successfully:", data))
        .catch((err) => console.error("[v0] Score submission error:", err))
    } else {
      console.log("[v0] No tournament entry ID - this is free play mode")
    }

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
      window.parent.postMessage(
        {
          type: "GAME_COMPLETE",
          gameId: "asteroids",
          score: this.score,
          gameTime: gameTime,
          victory: victory,
        },
        "*",
      )
    }
  }

  fireBullet() {
    // Ship's triangle apex points UP in local space
    // Rotate the apex point by the ship's rotation to get world position
    const apexLocalX = -9.5
    const apexLocalY = -25

    const cos = Math.cos(this.ship.rotation)
    const sin = Math.sin(this.ship.rotation)

    const apexWorldX = apexLocalX * cos - apexLocalY * sin
    const apexWorldY = apexLocalX * sin + apexLocalY * cos

    const bulletX = this.ship.x + apexWorldX
    const bulletY = this.ship.y + apexWorldY

    console.log(
      `[v0] Firing bullet from (-9.5, -25) local: ship at (${this.ship.x.toFixed(1)}, ${this.ship.y.toFixed(1)}), rotation ${this.ship.rotation.toFixed(2)}, bullet at (${bulletX.toFixed(1)}, ${bulletY.toFixed(1)})`,
    )

    const bullet = this.add.circle(bulletX, bulletY, 3, 0x00ffff)
    bullet.setDepth(100)
    this.physics.add.existing(bullet)

    // Ship's forward direction is rotation - 90 degrees since apex points UP
    const bulletAngle = this.ship.rotation - Math.PI / 2
    this.physics.velocityFromRotation(bulletAngle, 400, bullet.body.velocity)

    this.bullets.push(bullet)
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
