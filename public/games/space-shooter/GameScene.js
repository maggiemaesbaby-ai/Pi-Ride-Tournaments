/* global Phaser, GameSettings, ParticleManager, Player, Bullet, Weapon, Enemy */

class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene")
  }

  init() {
    this.score = 0
    this.lives = GameSettings.initialLives
    this.level = 1
    this.gameOver = false
    this.currentWeapon = "basic"
    this.canFire = true
    this.specialAttackAvailable = true
  }

  create() {
    const width = this.cameras.main.width
    const height = this.cameras.main.height

    // Create background with parallax effect
    this.background = this.add.tileSprite(0, 0, width, height, "background").setOrigin(0)
    this.stars = this.add.tileSprite(0, 0, width, height, "stars").setOrigin(0)

    // Create particle manager for all special effects
    this.particleManager = new ParticleManager(this)

    // Create player
    this.createPlayer()

    // Create weapon systems
    this.createWeapons()

    // Create enemy waves
    this.createEnemies()

    // Setup collisions
    this.setupCollisions()

    // Add UI elements
    this.createUI()

    // Input handling
    this.createInputs()

    // Play game music
    this.gameMusic = this.sound.add("game-music", {
      loop: true,
      volume: 0.4,
    })
    this.gameMusic.play()
  }

  update() {
    if (this.gameOver) return

    // Update parallax background
    this.stars.tilePositionY += 2
    this.background.tilePositionY += 0.5

    // Update player movement
    this.updatePlayerMovement()

    // Enemy movement
    this.updateEnemies()

    // Weapon trails and effects
    this.updateWeaponEffects()
  }

  createPlayer() {
    // Create player ship in the center bottom of the screen
    this.player = new Player(this, this.cameras.main.width / 2, this.cameras.main.height - 80)

    // Add engine particles
    this.particleManager.createEngineTrail(this.player)
  }

  createWeapons() {
    // Create weapon groups
    this.playerBullets = this.physics.add.group({
      classType: Bullet,
      runChildUpdate: true,
    })

    this.enemyBullets = this.physics.add.group()

    // Set up weapon types
    this.weapons = {}

    // Initialize all weapon types
    for (const [type, config] of Object.entries(GameSettings.weapons)) {
      this.weapons[type] = new Weapon(this, type, config)
    }
  }

  createEnemies() {
    // Create enemy group
    this.enemies = this.physics.add.group({
      classType: Enemy,
      runChildUpdate: true,
    })

    // Create first wave
    this.spawnEnemyWave()

    // Timer for spawning enemies
    this.time.addEvent({
      delay: 8000,
      callback: this.spawnEnemyWave,
      callbackScope: this,
      loop: true,
    })
  }

  spawnEnemyWave() {
    const types = ["basic", "bomber", "elite"]
    const width = this.cameras.main.width

    // Create a formation pattern
    const points = []

    // Arc formation
    const rows = 3
    const cols = 8

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = 100 + (width - 200) * (col / (cols - 1))
        const y = -100 - row * 60

        // Choose enemy type based on row (more powerful enemies in back rows)
        const type = types[Math.min(row, types.length - 1)]

        // Create enemy
        const enemy = new Enemy(this, x, y, type)
        this.enemies.add(enemy)

        // Add entry movement pattern
        if (row === 0) {
          // First row does a swooping entry
          this.tweens.add({
            targets: enemy,
            x: x + Phaser.Math.Between(-200, 200),
            y: Phaser.Math.Between(100, 200),
            ease: "Sine.easeInOut",
            duration: 3000,
            yoyo: false,
            repeat: 0,
            onComplete: () => {
              // Start shooting after entry
              this.time.addEvent({
                delay: Phaser.Math.Between(1000, 3000),
                callback: () => {
                  enemy.shoot(this.player)
                },
                callbackScope: this,
                loop: true,
              })
            },
          })
        } else {
          // Other rows come in more directly
          this.tweens.add({
            targets: enemy,
            y: 100 + row * 70,
            ease: "Back.easeOut",
            duration: 2500,
            delay: row * 200,
            onComplete: () => {
              // Start shooting after entry
              this.time.addEvent({
                delay: Phaser.Math.Between(2000, 4000),
                callback: () => {
                  enemy.shoot(this.player)
                },
                callbackScope: this,
                loop: true,
              })
            },
          })
        }
      }
    }
  }

  setupCollisions() {
    // Player bullets hitting enemies
    this.physics.add.collider(this.playerBullets, this.enemies, this.bulletHitEnemy, null, this)

    // Enemy bullets hitting player
    this.physics.add.collider(this.enemyBullets, this.player, this.bulletHitPlayer, null, this)

    // Enemies colliding with player
    this.physics.add.collider(this.enemies, this.player, this.enemyHitPlayer, null, this)
  }

  createUI() {
    // Score text
    this.scoreText = this.add.text(20, 20, "SCORE: 0", {
      fontFamily: "Arial",
      fontSize: "24px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
    })

    // Lives display
    this.livesText = this.add.text(20, 60, `LIVES: ${this.lives}`, {
      fontFamily: "Arial",
      fontSize: "24px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
    })

    // Weapon indicator
    this.weaponText = this.add
      .text(this.cameras.main.width - 20, 20, `WEAPON: ${GameSettings.weapons[this.currentWeapon].name}`, {
        fontFamily: "Arial",
        fontSize: "20px",
        color: "#00ffff",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(1, 0)

    // Level indicator
    this.levelText = this.add
      .text(this.cameras.main.width / 2, 20, `LEVEL ${this.level}`, {
        fontFamily: "Arial",
        fontSize: "20px",
        color: "#ffff00",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5, 0)

    // Special attack cooldown indicator
    this.specialAttackBar = this.add.graphics()
    this.updateSpecialAttackBar()
  }

  createInputs() {
    // Keyboard controls
    this.cursors = this.input.keyboard.createCursorKeys()

    // WASD keys
    this.wasd = {
      up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    }

    // Fire button
    this.fireButton = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)

    // Special attack button
    this.specialButton = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)

    // Weapon selection keys
    this.weaponKeys = [
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE), // Basic laser
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO), // Plasma cannon
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE), // Missiles
      this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR), // Beam laser
    ]

    // Add event listeners for weapon selection
    this.weaponKeys[0].on("down", () => this.switchWeapon("basic"))
    this.weaponKeys[1].on("down", () => this.switchWeapon("plasma"))
    this.weaponKeys[2].on("down", () => this.switchWeapon("missile"))
    this.weaponKeys[3].on("down", () => this.switchWeapon("beam"))

    // Special attack event listener
    this.specialButton.on("down", () => this.triggerSpecialAttack())

    // Setup continuous firing when space is held
    this.fireButton.on("down", () => {
      this.isFiring = true
    })

    this.fireButton.on("up", () => {
      this.isFiring = false
    })
  }

  updatePlayerMovement() {
    // Skip if player is dead
    if (!this.player.active) return

    // Reset velocity
    this.player.setVelocity(0)

    // Handle movement with either arrow keys or WASD
    const moveUp = this.cursors.up.isDown || this.wasd.up.isDown
    const moveDown = this.cursors.down.isDown || this.wasd.down.isDown
    const moveLeft = this.cursors.left.isDown || this.wasd.left.isDown
    const moveRight = this.cursors.right.isDown || this.wasd.right.isDown

    // Set velocity based on input
    if (moveLeft) {
      this.player.setVelocityX(-GameSettings.playerSpeed)
    } else if (moveRight) {
      this.player.setVelocityX(GameSettings.playerSpeed)
    }

    if (moveUp) {
      this.player.setVelocityY(-GameSettings.playerSpeed)
    } else if (moveDown) {
      this.player.setVelocityY(GameSettings.playerSpeed)
    }

    // Handle diagonal movement (normalize velocity)
    if ((moveLeft || moveRight) && (moveUp || moveDown)) {
      this.player.body.velocity.normalize().scale(GameSettings.playerSpeed)
    }

    // Keep player within game bounds
    const halfWidth = this.player.width / 2
    const halfHeight = this.player.height / 2

    this.player.x = Phaser.Math.Clamp(this.player.x, halfWidth, this.cameras.main.width - halfWidth)

    this.player.y = Phaser.Math.Clamp(this.player.y, halfHeight, this.cameras.main.height - halfHeight)

    // Fire weapon if button is held down
    if (this.isFiring) {
      this.fireWeapon()
    }
  }

  fireWeapon() {
    if (!this.canFire || !this.player.active) return

    // Get current weapon
    const weapon = this.weapons[this.currentWeapon]
    weapon.fire(this.player)

    // Set cooldown
    this.canFire = false
    this.time.delayedCall(
      weapon.config.fireRate,
      () => {
        this.canFire = true
      },
      [],
      this,
    )
  }

  switchWeapon(type) {
    if (!this.weapons[type]) return

    this.currentWeapon = type

    // Update weapon text
    this.weaponText.setText(`WEAPON: ${GameSettings.weapons[type].name}`)

    // Flash the text to indicate weapon change
    this.tweens.add({
      targets: this.weaponText,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 3,
    })

    // Play sound effect
    this.sound.play("powerup-sound", { volume: 0.5 })
  }

  triggerSpecialAttack() {
    if (!this.specialAttackAvailable || !this.player.active) return

    // Different special attack based on current weapon
    switch (this.currentWeapon) {
      case "basic":
        // Bullet spray pattern
        for (let angle = -60; angle <= 60; angle += 15) {
          const bullet = this.weapons.basic.createBullet(this.player.x, this.player.y)
          const radians = Phaser.Math.DegToRad(angle - 90)
          bullet.body.velocity.x = Math.cos(radians) * GameSettings.bulletSpeed
          bullet.body.velocity.y = Math.sin(radians) * GameSettings.bulletSpeed
        }
        break

      case "plasma":
        // Big plasma explosion
        const plasma = this.add.sprite(this.player.x, this.player.y - 50, "explosion")
        plasma.setScale(2)
        plasma.setTint(0xff00ff)
        plasma.play("explode")

        // Damage all enemies within radius
        this.enemies.getChildren().forEach((enemy) => {
          const distance = Phaser.Math.Distance.Between(plasma.x, plasma.y, enemy.x, enemy.y)

          if (distance < 200) {
            enemy.damage(5)
            // Push enemies away from blast
            const angle = Phaser.Math.Angle.Between(plasma.x, plasma.y, enemy.x, enemy.y)
            const force = (200 - distance) * 2
            enemy.body.velocity.x += Math.cos(angle) * force
            enemy.body.velocity.y += Math.sin(angle) * force
          }
        })

        // Screen shake effect
        this.cameras.main.shake(300, 0.01)
        break

      case "missile":
        // Launch homing missiles at all enemies
        const targets = this.enemies.getChildren().slice(0, 5) // Target up to 5 enemies

        targets.forEach((target) => {
          const missile = this.weapons.missile.createBullet(this.player.x, this.player.y)
          missile.setData("target", target)

          // Add update logic to follow the target
          missile.update = function () {
            const target = this.getData("target")
            if (target && target.active) {
              // Calculate angle to target
              const targetAngle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y)

              // Gradually rotate towards target
              const currentAngle = this.rotation
              const newAngle = Phaser.Math.Angle.RotateTo(currentAngle, targetAngle, 0.1)
              this.rotation = newAngle

              // Move in the direction of the rotation
              this.body.velocity.x = Math.cos(newAngle) * 300
              this.body.velocity.y = Math.sin(newAngle) * 300

              // Create smoke trail
              if (this.scene) {
                this.scene.particleManager.createSmokeTrail(this)
              }
            }
          }
        })
        break

      case "beam":
        // Create powerful beam laser
        const beam = this.add.rectangle(this.player.x, this.player.y - 300, 20, 600, 0x66ff66)
        beam.setOrigin(0.5, 1) // Bottom center origin

        // Add glow effect
        this.tweens.add({
          targets: beam,
          alpha: 0.7,
          width: 15,
          duration: 50,
          yoyo: true,
          repeat: 10,
          onComplete: () => {
            beam.destroy()
          },
        })

        // Add particles along the beam
        for (let y = this.player.y; y > this.player.y - 600; y -= 20) {
          this.particleManager.createLaserImpact(this.player.x, y)
        }

        // Damage enemies in the path
        this.enemies.getChildren().forEach((enemy) => {
          if (Math.abs(enemy.x - this.player.x) < 30) {
            enemy.damage(10)
          }
        })

        // Screen shake effect
        this.cameras.main.shake(500, 0.005)
        break
    }

    // Play sound effect
    this.sound.play(`${this.currentWeapon}-sound`, { volume: 0.7 })

    // Set cooldown
    this.specialAttackAvailable = false
    this.updateSpecialAttackBar()

    // Recharge after delay
    this.time.delayedCall(
      5000,
      () => {
        this.specialAttackAvailable = true
        this.updateSpecialAttackBar()
      },
      [],
      this,
    )
  }

  updateSpecialAttackBar() {
    this.specialAttackBar.clear()

    // Border
    this.specialAttackBar.lineStyle(2, 0xffffff, 1)
    this.specialAttackBar.strokeRect(20, 100, 200, 20)

    // Fill
    if (this.specialAttackAvailable) {
      this.specialAttackBar.fillStyle(0x00ff00, 1)
      this.specialAttackBar.fillRect(22, 102, 196, 16)
    } else {
      // Show recharging animation
      const rechargeTime = 5000
      const elapsed = this.time.now - (this.lastSpecialAttackTime || this.time.now - rechargeTime)
      const progress = Math.min(elapsed / rechargeTime, 1)

      this.specialAttackBar.fillStyle(0xff0000, 1)
      this.specialAttackBar.fillRect(22, 102, 196 * progress, 16)
    }

    // Text
    if (!this.specialAttackText) {
      this.specialAttackText = this.add
        .text(126, 85, "SPECIAL ATTACK", {
          fontFamily: "Arial",
          fontSize: "12px",
          color: "#ffffff",
        })
        .setOrigin(0.5, 0)
    }
  }

  updateEnemies() {
    // Give some enemies random movement patterns
    this.enemies.getChildren().forEach((enemy) => {
      if (!enemy.getData("hasPattern") && Phaser.Math.Between(1, 1000) === 1) {
        enemy.setData("hasPattern", true)

        // Random movement pattern
        const targetX = Phaser.Math.Between(100, this.cameras.main.width - 100)
        const targetY = Phaser.Math.Between(100, 300)

        this.tweens.add({
          targets: enemy,
          x: targetX,
          y: targetY,
          duration: 2000,
          ease: "Sine.easeInOut",
          onComplete: () => {
            enemy.setData("hasPattern", false)
          },
        })
      }
    })
  }

  updateWeaponEffects() {
    // Update any active weapon effects
    if (this.currentWeapon === "beam" && this.isFiring) {
      // Create beam line effect
      const line = new Phaser.Geom.Line(this.player.x, this.player.y, this.player.x, 0)

      // Add particles along the beam
      this.particleManager.createBeamEffect(line)

      // Check for enemies in the path
      this.enemies.getChildren().forEach((enemy) => {
        if (Math.abs(enemy.x - this.player.x) < 20 && enemy.y < this.player.y) {
          enemy.damage(GameSettings.weapons.beam.damage)
          this.particleManager.createLaserImpact(this.player.x, enemy.y)
        }
      })
    }
  }

  bulletHitEnemy(bullet, enemy) {
    // Get weapon type from bullet
    const weaponType = bullet.getData("type")
    const weaponConfig = GameSettings.weapons[weaponType || "basic"]

    // Apply damage
    enemy.damage(weaponConfig.damage)

    // Create impact effect
    this.particleManager.createImpact(bullet.x, bullet.y, weaponConfig.particleColor)

    // Destroy bullet (except for beam which passes through)
    if (weaponType !== "beam") {
      bullet.destroy()
    }

    // Update score if enemy died
    if (!enemy.active) {
      this.score += GameSettings.scorePerKill
      this.scoreText.setText(`SCORE: ${this.score}`)
    }
  }

  bulletHitPlayer(bullet, player) {
    // Create impact effect
    this.particleManager.createImpact(bullet.x, bullet.y, 0xff0000)

    // Destroy bullet
    bullet.destroy()

    // Reduce player health/lives
    this.lives--
    this.livesText.setText(`LIVES: ${this.lives}`)

    // Screen shake effect
    this.cameras.main.shake(200, 0.01)

    if (this.lives <= 0) {
      this.playerDeath()
    } else {
      // Player takes damage but survives
      this.player.flash()

      // Brief invulnerability
      this.player.setData("invulnerable", true)
      this.time.delayedCall(
        2000,
        () => {
          this.player.setData("invulnerable", false)
        },
        [],
        this,
      )
    }
  }

  enemyHitPlayer(enemy, player) {
    // Skip if player is invulnerable
    if (player.getData("invulnerable")) return

    // Create explosion effect
    this.particleManager.createExplosion(enemy.x, enemy.y)

    // Destroy enemy
    enemy.destroy()

    // Reduce player health/lives
    this.lives--
    this.livesText.setText(`LIVES: ${this.lives}`)

    // Screen shake effect
    this.cameras.main.shake(400, 0.02)

    if (this.lives <= 0) {
      this.playerDeath()
    } else {
      // Player takes damage but survives
      this.player.flash()

      // Brief invulnerability
      this.player.setData("invulnerable", true)
      this.time.delayedCall(
        2000,
        () => {
          this.player.setData("invulnerable", false)
        },
        [],
        this,
      )
    }
  }

  playerDeath() {
    // Create explosion effect
    this.particleManager.createExplosion(this.player.x, this.player.y)

    // Hide player
    this.player.setVisible(false)
    this.player.setActive(false)

    // Stop background music
    this.gameMusic.stop()

    // Play explosion sound
    this.sound.play("explosion-sound", { volume: 0.7 })

    // Fade screen and show game over
    this.cameras.main.fade(1500, 0, 0, 0)
    this.time.delayedCall(
      1500,
      () => {
        this.scene.start("GameOverScene", { score: this.score })
      },
      [],
      this,
    )

    this.gameOver = true
  }
}
