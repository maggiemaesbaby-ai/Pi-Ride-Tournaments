/* global Phaser */

class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene")
  }

  init(data) {
    this.score = data.score || 0
  }

  create() {
    const width = this.cameras.main.width
    const height = this.cameras.main.height

    // Background
    this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0)

    // Game over text
    const gameOverText = this.add
      .text(width / 2, height / 3, "GAME OVER", {
        fontFamily: "Arial",
        fontSize: "64px",
        fontStyle: "bold",
        color: "#ff0000",
        stroke: "#000000",
        strokeThickness: 6,
        shadow: { offsetX: 2, offsetY: 2, color: "#000", blur: 5, stroke: true, fill: true },
      })
      .setOrigin(0.5)

    // Create a pulse effect
    this.tweens.add({
      targets: gameOverText,
      scale: 1.1,
      duration: 800,
      yoyo: true,
      repeat: -1,
    })

    // Score text
    this.add
      .text(width / 2, height / 2, `FINAL SCORE: ${this.score}`, {
        fontFamily: "Arial",
        fontSize: "32px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)

    // Play again button
    const playAgainButton = this.add.image(width / 2, (height * 2) / 3, "button")
    playAgainButton.setInteractive({ useHandCursor: true })

    const playAgainText = this.add
      .text(width / 2, (height * 2) / 3, "PLAY AGAIN", {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#ffffff",
      })
      .setOrigin(0.5)

    // Button hover effect
    playAgainButton.on("pointerover", () => {
      playAgainButton.setTint(0x66ff66)
    })

    playAgainButton.on("pointerout", () => {
      playAgainButton.clearTint()
    })

    // Button click event
    playAgainButton.on("pointerdown", () => {
      this.cameras.main.fade(500, 0, 0, 0)
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("GameScene")
      })
    })

    // Main menu button
    const menuButton = this.add.image(width / 2, (height * 2) / 3 + 80, "button")
    menuButton.setInteractive({ useHandCursor: true })

    const menuText = this.add
      .text(width / 2, (height * 2) / 3 + 80, "MAIN MENU", {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#ffffff",
      })
      .setOrigin(0.5)

    // Button hover effect
    menuButton.on("pointerover", () => {
      menuButton.setTint(0x66ff66)
    })

    menuButton.on("pointerout", () => {
      menuButton.clearTint()
    })

    // Button click event
    menuButton.on("pointerdown", () => {
      this.cameras.main.fade(500, 0, 0, 0)
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("MenuScene")
      })
    })
  }
}
