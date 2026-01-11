/* global Phaser */

class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type = "basic") {
    super(scene, x, y, `enemy-${type}`)

    // Add to scene and enable physics
    scene.add.existing(this)
    scene.physics.add.existing(this)

    // Store the enemy type
    this.enemyType = type

    // Initialize enemy properties based on type
    this.init()

    // Set collision body size
    this.body.setSize(this.width * 0.8, this.height * 0.8)
  }

  init() {
    // Set up enemy properties based on type
    switch (this.enemyType) {
      case "basic":
        this.health = 2
        this.setScale(0.8)
        this.scoreValue = 100
        this.fireRate = 3000
        this.bulletSpeed = 200
        this.color = 0x00ffff
        break

      case "bomber":
        this.health = 4
        this.setScale(1)
        this.scoreValue = 200
        this.fireRate = 2500
        this.bulletSpeed = 220
        this.color = 0xff6600
        break

      case "elite":
        this.health = 6
        this.setScale(1.2)
        this.scoreValue = 300
        this.fireRate = 2000
        this.bulletSpeed = 250
        this.color = 0xff00ff
        break

      case "boss":
        this.health = 30
        this.setScale(2)
        this.scoreValue = 1000
        this.fireRate = 1000
        this.bulletSpeed = 300
        this.color = 0xff0000
        break

      default:
        this.health = 1
        this.setScale(0.8)
        this.scoreValue = 50
        this.fireRate = 3000
        this.bulletSpeed = 200
        this.color = 0x00ffff
    }

    // Add random rotation effect
    if (this.enemyType !== "boss") {
      this.scene.tweens.add({
        targets: this,
        angle: Phaser.Math.Between(-10, 10),
        duration: Phaser.Math.Between(1000, 2000),
        yoyo: true,
        repeat: -1,
      })
    }

    // Add glow effect for elite and boss enemies
    if (this.enemyType === "elite" || this.enemyType === "boss") {
      this.glowEffect = this.scene.add
        .image(this.x, this.y, `enemy-${this.enemyType}`)
        .setScale(this.scaleX * 1.2)
        .setAlpha(0.3)
        .setTint(this.color)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(this.depth - 1)

      this.scene.tweens.add({
        targets: this.glowEffect,
        alpha: 0.1,
        scale: this.scaleX * 1.3,
        duration: 800,
        yoyo: true,
        repeat: -1,
      })
    }
  }

  damage(amount) {
    // Reduce health
    this.health -= amount

    // Flash effect when taking damage
    this.scene.tweens.add({
      targets: this,
      alpha: 0.5,
      duration: 50,
      yoyo: true,
      repeat: 1,
    })

    // Create damage particle effect
    if (this.scene.particleManager) {
      this.scene.particleManager.createDamageEffect(this.x, this.y, this.color)
    }

    // Check if destroyed
    if (this.health <= 0) {
      this.destroy()
    }
  }

  shoot(target) {
    // Don't shoot if not active or no target
    if (!this.active || !target || !target.active) return

    // Create bullet
    const bullet = this.scene.enemyBullets.create(this.x, this.y + 20, "bullet-basic")
    bullet.setTint(this.color)

    // Add special properties for different enemy types
    switch (this.enemyType) {
      case "basic":
        // Basic enemies shoot straight down
        bullet.setVelocityY(this.bulletSpeed)
        break

      case "bomber":
        // Bombers shoot 3 bullets in spread
        const spread = 30 // degrees

        // Create left and right bullets for bombers
        if (Phaser.Math.Between(1, 3) === 1) {
          const leftBullet = this.scene.enemyBullets.create(this.x - 10, this.y + 20, "bullet-basic")
          leftBullet.setTint(this.color)
          const leftAngle = Phaser.Math.DegToRad(90 - spread)
          leftBullet.setVelocity(Math.cos(leftAngle) * this.bulletSpeed, Math.sin(leftAngle) * this.bulletSpeed)

          const rightBullet = this.scene.enemyBullets.create(this.x + 10, this.y + 20, "bullet-basic")
          rightBullet.setTint(this.color)
          const rightAngle = Phaser.Math.DegToRad(90 + spread)
          rightBullet.setVelocity(Math.cos(rightAngle) * this.bulletSpeed, Math.sin(rightAngle) * this.bulletSpeed)
        }

        // Center bullet goes straight down
        bullet.setVelocityY(this.bulletSpeed)
        break

      case "elite":
        // Elite enemies shoot at player
        const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y)
        bullet.setVelocity(Math.cos(angle) * this.bulletSpeed, Math.sin(angle) * this.bulletSpeed)

        // Add a slight pulse effect to elite enemy bullets
        bullet.setScale(1.3)
        this.scene.tweens.add({
          targets: bullet,
          scale: 1,
          duration: 200,
          yoyo: true,
          repeat: -1,
        })
        break

      case "boss":
        // Boss enemies shoot multiple bullets in a pattern
        const angleToPlayer = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y)

        // Create a circular burst of bullets
        for (let i = 0; i < 8; i++) {
          const bulletAngle = angleToPlayer + (i * Math.PI) / 4
          const bulletSpeed = this.bulletSpeed

          const bossBullet = this.scene.enemyBullets.create(this.x, this.y, "bullet-plasma")
          bossBullet.setTint(this.color)
          bossBullet.setVelocity(Math.cos(bulletAngle) * bulletSpeed, Math.sin(bulletAngle) * bulletSpeed)

          // Add special effect to boss bullets
          bossBullet.setScale(1.5)

          // Create particle trail for boss bullets
          bossBullet.update = function () {
            if (this.scene && this.scene.particleManager) {
              this.scene.particleManager.createBulletTrail(this, 0xff0000)
            }
          }
        }

        // Main bullet targets player
        bullet.setVelocity(Math.cos(angleToPlayer) * this.bulletSpeed, Math.sin(angleToPlayer) * this.bulletSpeed)
        break

      default:
        // Default behavior - shoot at player with some inaccuracy
        const randomOffset = Phaser.Math.Between(-20, 20)
        const targetX = target.x + randomOffset
        const targetAngle = Phaser.Math.Angle.Between(this.x, this.y, targetX, target.y)

        bullet.setVelocity(Math.cos(targetAngle) * this.bulletSpeed, Math.sin(targetAngle) * this.bulletSpeed)
    }

    // Set bullet properties
    bullet.setDepth(5)

    // Add bullet rotation for visual effect
    bullet.setAngularVelocity(Phaser.Math.Between(-100, 100))

    // Bullet lifespan to prevent memory leaks from bullets that go off screen
    this.scene.time.delayedCall(5000, () => {
      if (bullet && bullet.active) {
        bullet.destroy()
      }
    })

    // Play sound effect (but throttle for performance)
    if (Phaser.Math.Between(1, 3) === 1) {
      this.scene.sound.play("laser-sound", { volume: 0.2, detune: Phaser.Math.Between(-300, 300) })
    }
  }

  update() {
    // Update glow effect position
    if (this.glowEffect) {
      this.glowEffect.x = this.x
      this.glowEffect.y = this.y
      this.glowEffect.rotation = this.rotation
    }

    // Ensure enemy stays within bounds
    if (this.active) {
      const bounds = this.scene.physics.world.bounds

      if (this.x < bounds.x + this.width / 2) {
        this.x = bounds.x + this.width / 2
        if (this.body.velocity.x < 0) {
          this.body.velocity.x = -this.body.velocity.x
        }
      } else if (this.x > bounds.right - this.width / 2) {
        this.x = bounds.right - this.width / 2
        if (this.body.velocity.x > 0) {
          this.body.velocity.x = -this.body.velocity.x
        }
      }

      // If enemy moves too far below screen, remove it
      if (this.y > bounds.bottom + 100) {
        this.destroy()
      }
    }
  }

  destroy() {
    // Create explosion effect
    if (this.scene && this.scene.particleManager) {
      // Scale explosion based on enemy type
      const scale = this.enemyType === "boss" ? 2 : this.enemyType === "elite" ? 1.5 : 1

      this.scene.particleManager.createExplosion(this.x, this.y, scale, this.color)
    }

    // Play explosion sound
    if (this.scene) {
      this.scene.sound.play("explosion-sound", {
        volume: this.enemyType === "boss" ? 0.8 : 0.4,
        detune: Phaser.Math.Between(-200, 200),
      })

      // Add score if this was caused by player
      if (this.scene.score !== undefined) {
        this.scene.score += this.scoreValue
        if (this.scene.scoreText) {
          this.scene.scoreText.setText(`SCORE: ${this.scene.score}`)
        }
      }

      // Clean up glow effect
      if (this.glowEffect) {
        this.glowEffect.destroy()
      }
    }

    super.destroy()
  }
}
