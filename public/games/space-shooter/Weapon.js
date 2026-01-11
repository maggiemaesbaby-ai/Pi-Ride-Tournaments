/* global Phaser */

class Weapon {
  constructor(scene, type, config) {
    this.scene = scene
    this.type = type
    this.config = config
    this.lastFired = 0
  }

  fire(source) {
    const time = this.scene.time.now

    // Check if weapon can fire based on fire rate
    if (this.config.fireRate > 0 && time < this.lastFired + this.config.fireRate) {
      return false
    }

    this.lastFired = time

    // Different firing behavior based on weapon type
    switch (this.type) {
      case "basic":
        this.fireBasic(source)
        break

      case "plasma":
        this.firePlasma(source)
        break

      case "missile":
        this.fireMissile(source)
        break

      case "beam":
        this.fireBeam(source)
        break

      default:
        this.fireBasic(source)
    }

    return true
  }

  fireBasic(source) {
    // Create bullet
    const bullet = this.createBullet(source.x, source.y - 20)

    // Set velocity (going up)
    bullet.setVelocityY(-this.config.bulletSpeed)

    // Play sound effect
    this.scene.sound.play(this.config.sound, { volume: 0.3 })
  }

  firePlasma(source) {
    // Create plasma bullet
    const bullet = this.createBullet(source.x, source.y - 20)

    // Make plasma bullets larger
    bullet.setScale(1.5)

    // Set velocity (going up)
    bullet.setVelocityY(-this.config.bulletSpeed)

    // Add pulsing effect to plasma bullets
    this.scene.tweens.add({
      targets: bullet,
      scale: 1.8,
      duration: 200,
      yoyo: true,
      repeat: -1,
    })

    // Add particle trail to plasma bullet
    bullet.update = function () {
      if (this.scene && this.scene.particleManager) {
        this.scene.particleManager.createBulletTrail(this, this.getData("particleColor"))
      }
    }

    // Play sound effect
    this.scene.sound.play(this.config.sound, { volume: 0.4 })
  }

  fireMissile(source) {
    // Create missile on each side of the player
    const leftMissile = this.createBullet(source.x - 15, source.y)
    const rightMissile = this.createBullet(source.x + 15, source.y)

    // Add slight angle to missiles
    leftMissile.setVelocity(-20, -this.config.bulletSpeed)
    rightMissile.setVelocity(20, -this.config.bulletSpeed)

    // Setup missile behavior
    ;[leftMissile, rightMissile].forEach((missile) => {
      // Find nearby enemies for homing behavior
      const findTarget = () => {
        if (!missile.active || !this.scene || !this.scene.enemies) return

        // Find closest enemy
        let closestEnemy = null
        let closestDistance = Number.POSITIVE_INFINITY

        this.scene.enemies.getChildren().forEach((enemy) => {
          if (enemy.active) {
            const distance = window.Phaser.Math.Distance.Between(missile.x, missile.y, enemy.x, enemy.y)

            // Only target enemies above the missile (to avoid targeting enemies behind)
            if (distance < closestDistance && enemy.y < missile.y) {
              closestDistance = distance
              closestEnemy = enemy
            }
          }
        })

        // Set target if found
        if (closestEnemy && closestDistance < 300) {
          missile.setData("target", closestEnemy)
        }
      }

      // Find initial target
      findTarget()

      // Set up missile update behavior
      missile.update = function () {
        if (!this.active || !this.scene) return

        // Create smoke trail
        if (this.scene.particleManager) {
          this.scene.particleManager.createSmokeTrail(this)
        }

        // Get target
        const target = this.getData("target")

        // If no target or target is inactive, find a new one
        if (!target || !target.active) {
          findTarget.call(this)
        }

        // If we have a target, adjust course towards it
        if (target && target.active) {
          // Calculate angle to target
          const targetAngle = window.Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y)

          // Gradually rotate towards target
          const currentAngle = this.body.velocity.angle()
          const newAngle = window.Phaser.Math.Angle.RotateTo(currentAngle, targetAngle, 0.05)

          // Update velocity based on new angle
          const speed = this.body.velocity.length()
          this.body.velocity.x = Math.cos(newAngle) * speed
          this.body.velocity.y = Math.sin(newAngle) * speed

          // Set rotation to match direction
          this.rotation = newAngle + Math.PI / 2
        }
      }
    })

    // Play sound effect
    this.scene.sound.play(this.config.sound, { volume: 0.5 })
  }

  fireBeam(source) {
    // Create a line representing the beam
    const line = new Phaser.Geom.Line(source.x, source.y, source.x, 0)

    // Create visual beam effect
    this.scene.particleManager.createBeamEffect(line)

    // Check for enemies in the beam path
    this.scene.enemies.getChildren().forEach((enemy) => {
      // If enemy is in the beam's path
      if (Math.abs(enemy.x - source.x) < 20 && enemy.y < source.y) {
        // Apply damage
        enemy.damage(this.config.damage)

        // Create impact effect at enemy position
        this.scene.particleManager.createLaserImpact(source.x, enemy.y)
      }
    })

    // Play sound effect
    if (!this.beamSound || !this.beamSound.isPlaying) {
      this.beamSound = this.scene.sound.add(this.config.sound, {
        volume: 0.3,
        loop: true,
      })
      this.beamSound.play()

      // Stop sound when player stops firing
      this.scene.time.delayedCall(200, () => {
        if (this.beamSound && !this.scene.isFiring) {
          this.beamSound.stop()
        }
      })
    }
  }

  createBullet(x, y) {
    // Get bullet image based on weapon type
    let bulletKey
    switch (this.type) {
      case "plasma":
        bulletKey = "bullet-plasma"
        break
      case "missile":
        bulletKey = "missile"
        break
      case "beam":
        bulletKey = "bullet-laser"
        break
      default:
        bulletKey = "bullet-basic"
    }

    // Create the bullet
    const bullet = this.scene.playerBullets.create(x, y, bulletKey)

    // Set bullet properties
    bullet.setTint(this.config.color)
    bullet.setData("type", this.type)
    bullet.setData("damage", this.config.damage)
    bullet.setData("particleColor", this.config.particleColor)

    // Set depth
    bullet.setDepth(5)

    // Bullet lifespan to prevent memory leaks from bullets that go off screen
    this.scene.time.delayedCall(5000, () => {
      if (bullet.active) {
        bullet.destroy()
      }
    })

    return bullet
  }
}

// Bullet class for physics group
class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "bullet-basic")
  }

  fire(x, y, velocityX, velocityY) {
    this.body.reset(x, y)
    this.setActive(true)
    this.setVisible(true)
    this.setVelocity(velocityX, velocityY)
  }

  update(time, delta) {
    // Special effects for different bullet types
    const type = this.getData("type")

    switch (type) {
      case "plasma":
        // Create particle trail for plasma bullets
        if (this.scene && this.scene.particleManager) {
          this.scene.particleManager.createBulletTrail(this, this.getData("particleColor"))
        }
        break

      case "missile":
        // Handled in the missile fire method
        break
    }

    // Destroy bullets that go off-screen
    if (
      this.y < -50 ||
      this.y > this.scene.game.config.height + 50 ||
      this.x < -50 ||
      this.x > this.scene.game.config.width + 50
    ) {
      this.destroy()
    }
  }
}
