console.log("[v0] ========== PAC-MAN V2004 LOADING ==========")

const Phaser = window.Phaser
let tournamentEntryId = null

const GAME_WIDTH = 448
const GAME_HEIGHT = 496
const CELL_SIZE = 32

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" })
  }

  init(data) {
    console.log("[v0] Pac-Man init with data:", data)
    tournamentEntryId = data.tournamentEntryId || null
  }

  preload() {
    console.log("[v0] Pac-Man preload")
  }

  create() {
    console.log("[v0] Pac-Man GameScene CREATE V2004 - Classic Arcade Style")

    this.score = 0
    this.level = 1
    this.lives = 3
    this.gameStarted = false
    this.powerMode = false
    this.powerModeTimer = 0
    this.ghostsEatenInPower = 0
    this.gameStartTime = Date.now()
    this.ghostMoveDelay = 150
    this.lastGhostMoveTime = 0
    this.dotsEaten = 0
    this.distanceTravelled = 0
    this.ghostsEatenTotal = 0
    this.lastPacmanX = 0
    this.lastPacmanY = 0

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000)

    this.maze = [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1],
      [1, 2, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 2, 1],
      [1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 3, 3, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 3, 3, 3, 3, 3, 3, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 3, 3, 3, 3, 3, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1],
      [1, 2, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 2, 1],
      [1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1],
      [1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ]

    this.dotsRemaining = 0
    this.createMaze()
    this.createPacman()
    this.createGhosts()
    this.createUI()
    this.createCollisions()

    this.cursors = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      d: Phaser.Input.Keyboard.KeyCodes.D,
    })

    this.createJoystickControls()

    console.log("[v0] Pac-Man game initialized with", this.dotsRemaining, "dots")

    window.parent.postMessage(
      {
        type: "GAME_LOADED",
        game: "pacman",
        version: "V2004",
      },
      "*",
    )
  }

  createJoystickControls() {
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

    const joystickX = GAME_WIDTH / 2
    const joystickY = isPortraitMode ? GAME_HEIGHT + 100 : GAME_HEIGHT + 150
    const joystickRadius = 50
    const knobRadius = 20

    this.joystickBase = this.add.circle(joystickX, joystickY, joystickRadius, 0x333333, 0.5)
    this.joystickKnob = this.add.circle(joystickX, joystickY, knobRadius, 0xffffff, 0.8)
    this.joystickKnob.setInteractive({ draggable: true })

    this.joystickActive = false
    this.joystickDirection = null

    this.input.on("pointerdown", (pointer) => {
      const distance = Phaser.Math.Distance.Between(pointer.x, pointer.y, joystickX, joystickY)
      if (distance < joystickRadius + 20) {
        this.joystickActive = true
        if (!this.gameStarted) {
          this.startGame()
        }
      }
    })

    this.input.on("pointermove", (pointer) => {
      if (this.joystickActive && pointer.isDown) {
        const angle = Phaser.Math.Angle.Between(joystickX, joystickY, pointer.x, pointer.y)
        const distance = Math.min(
          Phaser.Math.Distance.Between(pointer.x, pointer.y, joystickX, joystickY),
          joystickRadius - knobRadius,
        )

        this.joystickKnob.x = joystickX + Math.cos(angle) * distance
        this.joystickKnob.y = joystickY + Math.sin(angle) * distance

        const degrees = Phaser.Math.RadToDeg(angle)
        if (degrees >= -45 && degrees < 45) {
          this.joystickDirection = "right"
        } else if (degrees >= 45 && degrees < 135) {
          this.joystickDirection = "down"
        } else if (degrees >= -135 && degrees < -45) {
          this.joystickDirection = "up"
        } else {
          this.joystickDirection = "left"
        }
      }
    })

    this.input.on("pointerup", () => {
      this.joystickActive = false
      this.joystickKnob.x = joystickX
      this.joystickKnob.y = joystickY
    })
  }

  createMaze() {
    this.walls = this.physics.add.staticGroup()
    this.dots = this.physics.add.group()
    this.powerPellets = this.physics.add.group()

    const mazeGraphics = this.add.graphics()

    for (let y = 0; y < this.maze.length; y++) {
      for (let x = 0; x < this.maze[y].length; x++) {
        const px = x * CELL_SIZE
        const py = y * CELL_SIZE

        if (this.maze[y][x] === 1) {
          const wall = this.add.rectangle(px + CELL_SIZE / 2, py + CELL_SIZE / 2, CELL_SIZE, CELL_SIZE, 0x000000)
          wall.setStrokeStyle(2, 0x00bfff, 1)
          this.walls.add(wall)
        } else if (this.maze[y][x] === 0) {
          const dot = this.add.circle(px + CELL_SIZE / 2, py + CELL_SIZE / 2, 2, 0xffff00)
          this.dots.add(dot)
          this.dotsRemaining++
        } else if (this.maze[y][x] === 2) {
          const pellet = this.add.circle(px + CELL_SIZE / 2, py + CELL_SIZE / 2, 6, 0xffff00)
          this.powerPellets.add(pellet)
        }
      }
    }
  }

  createPacman() {
    this.pacman = this.add.circle(14 * CELL_SIZE, 23 * CELL_SIZE, 10, 0xffff00)
    this.physics.add.existing(this.pacman)
    this.pacman.body.setCollideWorldBounds(false)
    this.pacman.currentDirection = null
    this.pacman.nextDirection = null

    this.pacman.mouthOpen = 0
    this.pacman.mouthDirection = 1

    this.pacmanGraphics = this.add.graphics()
    this.lastPacmanX = this.pacman.x
    this.lastPacmanY = this.pacman.y

    this.physics.add.collider(this.pacman, this.walls)
  }

  createGhosts() {
    this.ghosts = this.physics.add.group()
    const ghostConfigs = [
      { x: 13.5, y: 11, color: 0xff0000, name: "blinky" },
      { x: 13.5, y: 14, color: 0xffb8ff, name: "pinky" },
      { x: 11.5, y: 14, color: 0x00ffde, name: "inky" },
      { x: 15.5, y: 14, color: 0xffb851, name: "clyde" },
    ]

    ghostConfigs.forEach((config) => {
      const ghost = this.add.container(config.x * CELL_SIZE, config.y * CELL_SIZE)

      const graphics = this.add.graphics()
      graphics.fillStyle(config.color, 1)

      graphics.beginPath()
      graphics.arc(0, -4, 12, Math.PI, 0, true)
      graphics.lineTo(12, 8)
      graphics.lineTo(9, 4)
      graphics.lineTo(6, 8)
      graphics.lineTo(3, 4)
      graphics.lineTo(0, 8)
      graphics.lineTo(-3, 4)
      graphics.lineTo(-6, 8)
      graphics.lineTo(-9, 4)
      graphics.lineTo(-12, 8)
      graphics.lineTo(-12, -4)
      graphics.closePath()
      graphics.fillPath()

      const leftEye = this.add.circle(-4, -2, 3, 0xffffff)
      const rightEye = this.add.circle(4, -2, 3, 0xffffff)
      const leftPupil = this.add.circle(-4, -2, 1.5, 0x0000ff)
      const rightPupil = this.add.circle(4, -2, 1.5, 0x0000ff)

      ghost.add([graphics, leftEye, rightEye, leftPupil, rightPupil])

      ghost.originalColor = config.color
      ghost.name = config.name
      ghost.direction = { x: 0, y: 0 }

      this.physics.add.existing(ghost)
      ghost.body.setSize(24, 24)
      this.ghosts.add(ghost)
    })
  }

  createUI() {
    this.scoreText = this.add.text(10, 10, "1 UP", {
      fontSize: "16px",
      fontFamily: "Courier New",
      color: "#ffffff",
      fontStyle: "bold",
    })

    this.scoreValueText = this.add.text(10, 30, "0", {
      fontSize: "20px",
      fontFamily: "Courier New",
      color: "#ffffff",
      fontStyle: "bold",
    })

    this.highScoreText = this.add.text(GAME_WIDTH - 150, 10, "HIGH SCORE", {
      fontSize: "16px",
      fontFamily: "Courier New",
      color: "#ffffff",
      fontStyle: "bold",
    })

    this.highScoreValue = this.add.text(GAME_WIDTH - 150, 30, "0", {
      fontSize: "20px",
      fontFamily: "Courier New",
      color: "#ffffff",
      fontStyle: "bold",
    })

    this.livesDisplay = []
    this.updateLivesDisplay()
  }

  updateLivesDisplay() {
    this.livesDisplay.forEach((life) => life.destroy())
    this.livesDisplay = []

    for (let i = 0; i < this.lives; i++) {
      const lifeIcon = this.add.circle(30 + i * 35, GAME_HEIGHT - 20, 10, 0xffff00)
      this.livesDisplay.push(lifeIcon)
    }
  }

  createCollisions() {
    this.physics.add.overlap(this.pacman, this.dots, this.eatDot, null, this)
    this.physics.add.overlap(this.pacman, this.powerPellets, this.eatPowerPellet, null, this)
    this.physics.add.overlap(this.pacman, this.ghosts, this.hitGhost, null, this)
  }

  eatDot(pacman, dot) {
    if (!this.gameStarted) return
    dot.destroy()
    this.score += 10
    this.dotsEaten++
    this.dotsRemaining--
    this.scoreValueText.setText(this.score.toString())

    window.parent.postMessage({ type: "GAME_SCORE_UPDATE", score: this.score }, "*")

    if (this.dotsRemaining === 0) {
      this.levelComplete()
    }
  }

  eatPowerPellet(pacman, pellet) {
    if (!this.gameStarted) return
    pellet.destroy()
    this.score += 50
    this.scoreValueText.setText(this.score.toString())
    this.powerMode = true
    this.powerModeTimer = 8000
    this.ghostsEatenInPower = 0

    this.ghosts.children.entries.forEach((ghost) => {
      const graphics = ghost.getAt(0)
      graphics.clear()
      graphics.fillStyle(0x0000ff, 1)
      graphics.beginPath()
      graphics.arc(0, -4, 12, Math.PI, 0, true)
      graphics.lineTo(12, 8)
      graphics.lineTo(9, 4)
      graphics.lineTo(6, 8)
      graphics.lineTo(3, 4)
      graphics.lineTo(0, 8)
      graphics.lineTo(-3, 4)
      graphics.lineTo(-6, 8)
      graphics.lineTo(-9, 4)
      graphics.lineTo(-12, 8)
      graphics.lineTo(-12, -4)
      graphics.closePath()
      graphics.fillPath()
    })

    window.parent.postMessage({ type: "GAME_SCORE_UPDATE", score: this.score }, "*")
  }

  hitGhost(pacman, ghost) {
    if (!this.gameStarted) return

    if (this.powerMode) {
      this.ghostsEatenInPower++
      this.ghostsEatenTotal++
      const points = 200 * Math.pow(2, this.ghostsEatenInPower - 1)
      this.score += points
      this.scoreValueText.setText(this.score.toString())

      ghost.x = 13.5 * CELL_SIZE
      ghost.y = 14 * CELL_SIZE
      ghost.direction = { x: 0, y: 0 }

      window.parent.postMessage({ type: "GAME_SCORE_UPDATE", score: this.score }, "*")
    } else {
      this.loseLife()
    }
  }

  loseLife() {
    this.lives--
    this.updateLivesDisplay()

    if (this.lives <= 0) {
      this.gameOver()
    } else {
      this.pacman.x = 14 * CELL_SIZE
      this.pacman.y = 23 * CELL_SIZE
      this.pacman.currentDirection = null
      this.pacman.body.setVelocity(0, 0)

      this.ghosts.children.entries.forEach((ghost, i) => {
        const configs = [
          { x: 13.5, y: 11 },
          { x: 13.5, y: 14 },
          { x: 11.5, y: 14 },
          { x: 15.5, y: 14 },
        ]
        ghost.x = configs[i].x * CELL_SIZE
        ghost.y = configs[i].y * CELL_SIZE
        ghost.direction = { x: 0, y: 0 }
      })
    }
  }

  levelComplete() {
    this.level++
    this.gameStarted = false
    console.log("[v0] Level complete! Starting level", this.level)
    this.scene.restart()
  }

  gameOver() {
    this.gameStarted = false
    const gameTime = Math.floor((Date.now() - this.gameStartTime) / 1000)

    console.log("[v0] Game Over! Final Score:", this.score, "Time:", gameTime)

    window.parent.postMessage(
      {
        type: "GAME_OVER",
        score: this.score,
        gameTime: gameTime,
      },
      "*",
    )
  }

  startGame() {
    if (this.gameStarted) return
    this.gameStarted = true
    this.gameStartTime = Date.now()
    console.log("[v0] Pac-Man game started!")
  }

  update(time, delta) {
    if (!this.gameStarted) return

    const dx = this.pacman.x - this.lastPacmanX
    const dy = this.pacman.y - this.lastPacmanY
    const distance = Math.sqrt(dx * dx + dy * dy)
    this.distanceTravelled += distance
    this.lastPacmanX = this.pacman.x
    this.lastPacmanY = this.pacman.y

    if (this.powerMode) {
      this.powerModeTimer -= delta
      if (this.powerModeTimer <= 0) {
        this.powerMode = false
        this.ghosts.children.entries.forEach((ghost) => {
          const graphics = ghost.getAt(0)
          graphics.clear()
          graphics.fillStyle(ghost.originalColor, 1)
          graphics.beginPath()
          graphics.arc(0, -4, 12, Math.PI, 0, true)
          graphics.lineTo(12, 8)
          graphics.lineTo(9, 4)
          graphics.lineTo(6, 8)
          graphics.lineTo(3, 4)
          graphics.lineTo(0, 8)
          graphics.lineTo(-3, 4)
          graphics.lineTo(-6, 8)
          graphics.lineTo(-9, 4)
          graphics.lineTo(-12, 8)
          graphics.lineTo(-12, -4)
          graphics.closePath()
          graphics.fillPath()
        })
      }
    }

    let inputDirection = null
    if (this.joystickDirection) {
      inputDirection = this.joystickDirection
    } else if (this.cursors.left.isDown || this.cursors.a.isDown) {
      inputDirection = "left"
    } else if (this.cursors.right.isDown || this.cursors.d.isDown) {
      inputDirection = "right"
    } else if (this.cursors.up.isDown || this.cursors.w.isDown) {
      inputDirection = "up"
    } else if (this.cursors.down.isDown || this.cursors.s.isDown) {
      inputDirection = "down"
    }

    if (inputDirection) {
      this.pacman.nextDirection = inputDirection
    }

    if (this.pacman.nextDirection) {
      const canMove = this.canMoveTo(this.pacman.x, this.pacman.y, this.pacman.nextDirection)
      if (canMove) {
        this.pacman.currentDirection = this.pacman.nextDirection
        this.pacman.nextDirection = null
      }
    }

    if (this.pacman.currentDirection) {
      const speed = 100
      const canMove = this.canMoveTo(this.pacman.x, this.pacman.y, this.pacman.currentDirection)

      if (canMove) {
        switch (this.pacman.currentDirection) {
          case "left":
            this.pacman.body.setVelocity(-speed, 0)
            break
          case "right":
            this.pacman.body.setVelocity(speed, 0)
            break
          case "up":
            this.pacman.body.setVelocity(0, -speed)
            break
          case "down":
            this.pacman.body.setVelocity(0, speed)
            break
        }
      } else {
        this.pacman.body.setVelocity(0, 0)
      }
    }

    this.pacman.mouthOpen += this.pacman.mouthDirection * delta * 0.008
    if (this.pacman.mouthOpen > 0.5 || this.pacman.mouthOpen < 0) {
      this.pacman.mouthDirection *= -1
    }

    this.pacmanGraphics.clear()
    this.pacmanGraphics.fillStyle(0xffff00, 1)
    const startAngle = this.pacman.mouthOpen
    const endAngle = Math.PI * 2 - this.pacman.mouthOpen

    let rotation = 0
    if (this.pacman.currentDirection === "right") rotation = 0
    else if (this.pacman.currentDirection === "down") rotation = Math.PI / 2
    else if (this.pacman.currentDirection === "left") rotation = Math.PI
    else if (this.pacman.currentDirection === "up") rotation = (3 * Math.PI) / 2

    this.pacmanGraphics.slice(this.pacman.x, this.pacman.y, 10, startAngle + rotation, endAngle + rotation, false)
    this.pacmanGraphics.fillPath()

    if (time > this.lastGhostMoveTime + this.ghostMoveDelay) {
      this.lastGhostMoveTime = time
      this.ghosts.children.entries.forEach((ghost) => {
        this.moveGhost(ghost)
      })
    }
  }

  canMoveTo(x, y, direction) {
    const checkDistance = CELL_SIZE
    let targetX = x
    let targetY = y

    switch (direction) {
      case "left":
        targetX -= checkDistance
        break
      case "right":
        targetX += checkDistance
        break
      case "up":
        targetY -= checkDistance
        break
      case "down":
        targetY += checkDistance
        break
    }

    const gridX = Math.round(targetX / CELL_SIZE)
    const gridY = Math.round(targetY / CELL_SIZE)

    if (gridY < 0 || gridY >= this.maze.length || gridX < 0 || gridX >= this.maze[0].length) {
      return false
    }

    return this.maze[gridY][gridX] !== 1
  }

  moveGhost(ghost) {
    const directions = ["left", "right", "up", "down"]
    const possibleDirections = directions.filter((dir) => {
      return this.canMoveTo(ghost.x, ghost.y, dir)
    })

    if (possibleDirections.length > 0) {
      const randomDir = Phaser.Math.RND.pick(possibleDirections)
      ghost.direction = this.directionToVector(randomDir)
    }

    const speed = this.powerMode ? 40 : 60
    ghost.body.setVelocity(ghost.direction.x * speed, ghost.direction.y * speed)
  }

  directionToVector(direction) {
    switch (direction) {
      case "left":
        return { x: -1, y: 0 }
      case "right":
        return { x: 1, y: 0 }
      case "up":
        return { x: 0, y: -1 }
      case "down":
        return { x: 0, y: 1 }
      default:
        return { x: 0, y: 0 }
    }
  }
}

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: "game-container",
  backgroundColor: "#000000",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
}

const game = new Phaser.Game(config)

console.log("[v0] Pac-Man V2004 initialized with classic arcade styling")
