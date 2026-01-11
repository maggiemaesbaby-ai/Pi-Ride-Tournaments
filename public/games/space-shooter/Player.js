import Phaser from "phaser"

class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "player")

    // Add to scene and enable physics
    scene.add.existing(this)
    scene.physics.add.existing(this)

    // Initialize player properties
    this.init()

    // Set collision body size
    this.body.setSize(this.width * 0.8, this.height * 0.8)

    // Create engine effects
    this.createEngineEffects()
  }

  init() {
    // Set up player properties
    this.setScale(1.2)
    this.setDepth(10)

    // Initialize health/immunity
    this.setData("invulnerable", false)
  }

  createEngineEffects() {
    // Add engine glow
    this.engineGlow = this.scene.add
      .image(this.x, this.y + 20, "player-engine")
      .setScale(1.2)
      .setAlpha(0.7)
      .setDepth(9)

    // Pulse the engine glow
    this.scene.tweens.add({
      targets: this.engineGlow,
      alpha: 0.4,
      scale: 1.1,
      duration: 500,
      yoyo: true,
      repeat: -1,
    })
  }

  flash() {
    // Flash effect when taking damage
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 5,
      onUpdate: () => {
        this.engineGlow.alpha = this.alpha * 0.7
      },
      onComplete: () => {
        this.setAlpha(1)
        this.engineGlow.setAlpha(0.7)
      },
    })
  }

  update() {
    // Update engine position to follow player
    if (this.engineGlow) {
      this.engineGlow.x = this.x
      this.engineGlow.y = this.y + 20
    }

    // Visual effect if invulnerable
    if (this.getData("invulnerable") && this.scene.time.now % 200 < 100) {
      this.setAlpha(0.5)
      if (this.engineGlow) this.engineGlow.setAlpha(0.3)
    } else {
      this.setAlpha(1)
      if (this.engineGlow) this.engineGlow.setAlpha(0.7)
    }
  }

  destroy() {
    // Clean up engine effect
    if (this.engineGlow) {
      this.engineGlow.destroy()
    }

    super.destroy()
  }
}
