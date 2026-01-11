/* global Phaser */

class ParticleManager {
  constructor(scene) {
    this.scene = scene

    // Create particle emitters for different effects
    this.initParticleEmitters()
  }

  initParticleEmitters() {
    // Create general particle emitter
    this.particleEmitter = this.scene.add.particles(0, 0, "particle", {
      lifespan: 500,
      speed: { min: 50, max: 200 },
      scale: { start: 0.5, end: 0 },
      blendMode: window.Phaser.BlendModes.ADD,
      emitting: false,
    })

    // Create explosion emitter
    this.explosionEmitter = this.scene.add.particles(0, 0, "particle", {
      lifespan: 800,
      speed: { min: 100, max: 300 },
      scale: { start: 0.8, end: 0 },
      angle: { min: 0, max: 360 },
      blendMode: window.Phaser.BlendModes.ADD,
      emitting: false,
    })

    // Create engine trail emitter
    this.engineEmitter = this.scene.add.particles(0, 0, "particle", {
      lifespan: 300,
      speed: { min: 10, max: 50 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.6, end: 0 },
      angle: { min: 80, max: 100 },
      blendMode: window.Phaser.BlendModes.ADD,
      emitting: false,
    })

    // Create smoke trail emitter for missiles
    this.smokeEmitter = this.scene.add.particles(0, 0, "particle", {
      lifespan: 600,
      speed: { min: 5, max: 25 },
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.4, end: 0 },
      tint: 0x666666,
      blendMode: window.Phaser.BlendModes.NORMAL,
      emitting: false,
    })

    // Create beam effect emitter
    this.beamEmitter = this.scene.add.particles(0, 0, "particle", {
      lifespan: 200,
      speed: { min: 5, max: 20 },
      scale: { start: 0.3, end: 0 },
      blendMode: window.Phaser.BlendModes.ADD,
      emitting: false,
    })
  }

  createImpact(x, y, color = 0xffffff) {
    // Create impact effect at position
    this.particleEmitter.setPosition(x, y)
    this.particleEmitter.setTint(color)
    this.particleEmitter.explode(15)
  }

  createExplosion(x, y, scale = 1, color = 0xff6600) {
    // Create explosion effect at position
    this.explosionEmitter.setPosition(x, y)
    this.explosionEmitter.setTint(color)
    this.explosionEmitter.explode(30 * scale)

    // Add flash effect
    const flash = this.scene.add.circle(x, y, 50 * scale, color, 0.8)
    flash.setBlendMode(window.Phaser.BlendModes.ADD)

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2,
      duration: 200,
      onComplete: () => flash.destroy(),
    })

    // Create shockwave effect
    const shockwave = this.scene.add.circle(x, y, 10 * scale, color, 0.4)
    shockwave.setBlendMode(window.Phaser.BlendModes.ADD)
    shockwave.setDepth(5)

    this.scene.tweens.add({
      targets: shockwave,
      alpha: 0,
      radius: 80 * scale,
      duration: 300,
      onComplete: () => shockwave.destroy(),
    })

    // Add debris particles
    for (let i = 0; i < 5 * scale; i++) {
      const angle = window.Phaser.Math.Between(0, 360)
      const speed = window.Phaser.Math.Between(50, 150)
      const distance = window.Phaser.Math.Between(20, 60) * scale

      const debris = this.scene.add.rectangle(
        x,
        y,
        window.Phaser.Math.Between(3, 8),
        window.Phaser.Math.Between(3, 8),
        color,
      )

      const targetX = x + Math.cos(angle) * distance
      const targetY = y + Math.sin(angle) * distance

      this.scene.tweens.add({
        targets: debris,
        x: targetX,
        y: targetY,
        alpha: 0,
        angle: window.Phaser.Math.Between(0, 360),
        duration: window.Phaser.Math.Between(300, 600),
        onComplete: () => debris.destroy(),
      })
    }
  }

  createEngineTrail(source) {
    // Set up engine trail for player or enemy ships
    this.engineEmitter.setPosition(source.x, source.y + 20)
    this.engineEmitter.setTint(0x66ffff)
    this.engineEmitter.flow(20)

    // Update position with source
    source.on("update", () => {
      if (source.active && this.engineEmitter) {
        this.engineEmitter.setPosition(source.x, source.y + 20)
      } else {
        this.engineEmitter.stop()
      }
    })
  }

  createSmokeTrail(source) {
    // Create smoke trail behind moving objects like missiles
    if (!source.active || !this.smokeEmitter) return

    this.smokeEmitter.setPosition(source.x, source.y)
    this.smokeEmitter.emitParticle(1)
  }

  createBulletTrail(bullet, color = 0xffffff) {
    // Create a trail behind bullets
    if (!bullet.active || !this.particleEmitter) return

    this.particleEmitter.setPosition(bullet.x, bullet.y)
    this.particleEmitter.setTint(color)
    this.particleEmitter.emitParticle(1)
  }

  createBeamEffect(line) {
    // Create particle effects along a beam line
    if (!this.beamEmitter) return

    // Get points along the line
    const points = []
    for (let i = 0; i < 10; i++) {
      const t = i / 10
      const point = line.getPoint(t)
      points.push(point)
    }

    // Emit particles at each point
    points.forEach((point) => {
      this.beamEmitter.setPosition(point.x, point.y)
      this.beamEmitter.setTint(0x66ff66)
      this.beamEmitter.emitParticle(1)
    })
  }

  createLaserImpact(x, y) {
    // Create impact effect for laser beams
    const impact = this.scene.add.circle(x, y, 10, 0x66ff66, 0.8)
    impact.setBlendMode(window.Phaser.BlendModes.ADD)

    this.scene.tweens.add({
      targets: impact,
      alpha: 0,
      scale: 1.5,
      duration: 100,
      onComplete: () => impact.destroy(),
    })

    // Add some particles for good measure
    this.particleEmitter.setPosition(x, y)
    this.particleEmitter.setTint(0x66ff66)
    this.particleEmitter.explode(5)
  }

  createDamageEffect(x, y, color = 0xffffff) {
    // Create damage indication effect
    const spark = this.scene.add.circle(x, y, 5, color, 0.8)
    spark.setBlendMode(window.Phaser.BlendModes.ADD)

    this.scene.tweens.add({
      targets: spark,
      alpha: 0,
      scale: 2,
      duration: 100,
      onComplete: () => spark.destroy(),
    })
  }
}
