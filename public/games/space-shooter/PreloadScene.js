/* global Phaser */

class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene")
  }

  preload() {
    // Create loading bar
    const width = this.cameras.main.width
    const height = this.cameras.main.height

    // Display logo
    const logo = this.add.image(width / 2, height / 2 - 100, "logo")
    logo.setScale(0.5)

    // Progress bar background
    const progressBox = this.add.graphics()
    progressBox.fillStyle(0x222222, 0.8)
    progressBox.fillRect(width / 2 - 160, height / 2, 320, 50)

    // Loading text
    const loadingText = this.add.text(width / 2, height / 2 - 20, "Loading...", {
      fontFamily: "Arial",
      fontSize: "20px",
      fill: "#ffffff",
    })
    loadingText.setOrigin(0.5)

    // Percent text
    const percentText = this.add.text(width / 2, height / 2 + 70, "0%", {
      fontFamily: "Arial",
      fontSize: "18px",
      fill: "#ffffff",
    })
    percentText.setOrigin(0.5)

    // Progress bar
    const progressBar = this.add.graphics()

    // Loading event listeners
    this.load.on("progress", (value) => {
      progressBar.clear()
      progressBar.fillStyle(0x00ffff, 1)
      progressBar.fillRect(width / 2 - 150, height / 2 + 10, 300 * value, 30)
      percentText.setText(Number.parseInt(value * 100) + "%")
    })

    this.load.on("complete", () => {
      progressBar.destroy()
      progressBox.destroy()
      loadingText.destroy()
      percentText.destroy()
    })

    // Load game assets

    // Player assets
    this.load.image("player", "assets/images/player.png")
    this.load.image("player-engine", "assets/images/player-engine.png")

    // Enemy assets
    this.load.image("enemy-basic", "assets/images/enemy-basic.png")
    this.load.image("enemy-bomber", "assets/images/enemy-bomber.png")
    this.load.image("enemy-elite", "assets/images/enemy-elite.png")
    this.load.image("enemy-boss", "assets/images/enemy-boss.png")

    // Weapon assets
    this.load.image("bullet-basic", "assets/images/bullet-basic.png")
    this.load.image("bullet-laser", "assets/images/bullet-laser.png")
    this.load.image("bullet-plasma", "assets/images/bullet-plasma.png")
    this.load.image("missile", "assets/images/missile.png")

    // Explosion and effect assets
    this.load.image("particle", "assets/images/particle.png")
    this.load.spritesheet("explosion", "assets/images/explosion.png", {
      frameWidth: 64,
      frameHeight: 64,
      endFrame: 16,
    })

    // UI elements
    this.load.image("background", "assets/images/background.png")
    this.load.image("stars", "assets/images/stars.png")
    this.load.image("button", "assets/images/button.png")

    // Audio
    this.load.audio("laser-sound", "assets/sounds/laser.mp3")
    this.load.audio("explosion-sound", "assets/sounds/explosion.mp3")
    this.load.audio("plasma-sound", "assets/sounds/plasma.mp3")
    this.load.audio("missile-sound", "assets/sounds/missile.mp3")
    this.load.audio("powerup-sound", "assets/sounds/powerup.mp3")
    this.load.audio("game-music", "assets/sounds/game-music.mp3")
    this.load.audio("menu-music", "assets/sounds/menu-music.mp3")
  }

  create() {
    // Create explosion animation
    this.anims.create({
      key: "explode",
      frames: this.anims.generateFrameNumbers("explosion", { start: 0, end: 15 }),
      frameRate: 24,
      repeat: 0,
    })

    this.scene.start("MenuScene")
  }
}
