class CentipedeGame {
  constructor() {
    this.canvas = document.getElementById("gameCanvas")
    this.ctx = this.canvas.getContext("2d")
    this.canvas.width = 320
    this.canvas.height = 600

    this.score = 0
    this.lives = 3
    this.level = 1
    this.gameOver = false
    this.paused = false

    this.player = { x: 160, y: 550, width: 16, height: 16, speed: 3 }
    this.bullets = []
    this.mushrooms = []
    this.centipede = []
    this.spider = null
    this.flea = null
    this.scorpion = null

    this.keys = {}
    this.lastShot = 0
    this.shotCooldown = 200
    this.spiderSpawnTimer = 0
    this.scorpionSpawnTimer = 0
    this.fleaCheckTimer = 0

    this.setupControls()
    this.initLevel()
    this.gameLoop()
  }

  setupControls() {
    document.addEventListener("keydown", (e) => (this.keys[e.key] = true))
    document.addEventListener("keyup", (e) => (this.keys[e.key] = false))

    // Touch controls for mobile
    this.canvas.addEventListener("touchstart", (e) => {
      e.preventDefault()
      const touch = e.touches[0]
      const rect = this.canvas.getBoundingClientRect()
      const x = touch.clientX - rect.left
      this.player.x = x
      this.shoot()
    })

    this.canvas.addEventListener("touchmove", (e) => {
      e.preventDefault()
      const touch = e.touches[0]
      const rect = this.canvas.getBoundingClientRect()
      this.player.x = Math.max(0, Math.min(this.canvas.width - this.player.width, touch.clientX - rect.left))
    })
  }

  initLevel() {
    // Generate random mushroom field
    this.mushrooms = []
    const mushroomArea = this.canvas.height - 120 // Player area is bottom 120px
    for (let i = 0; i < 40 + this.level * 5; i++) {
      this.mushrooms.push({
        x: Math.floor(Math.random() * 20) * 16,
        y: Math.floor(Math.random() * (mushroomArea / 16)) * 16,
        health: 4,
        poisoned: false,
      })
    }

    // Create centipede with additional fast heads based on level
    this.centipede = []
    const segmentCount = 12
    for (let i = 0; i < segmentCount; i++) {
      this.centipede.push({
        x: 160 - i * 16,
        y: 0,
        isHead: i === 0,
        direction: 1, // 1 = right, -1 = left
        speed: 1 + this.level * 0.1,
        diving: false,
        diveX: 0,
      })
    }

    // Add fast heads for higher levels
    for (let i = 0; i < this.level - 1; i++) {
      this.centipede.push({
        x: Math.random() * this.canvas.width,
        y: this.canvas.height - 120,
        isHead: true,
        direction: Math.random() < 0.5 ? 1 : -1,
        speed: 2 + this.level * 0.2,
        diving: false,
        fromBottom: true,
      })
    }

    this.spiderSpawnTimer = 3000 + Math.random() * 5000
    this.scorpionSpawnTimer = this.level > 2 ? 10000 + Math.random() * 20000 : 0
  }

  shoot() {
    const now = Date.now()
    if (now - this.lastShot > this.shotCooldown) {
      this.bullets.push({ x: this.player.x + 7, y: this.player.y, speed: 5 })
      this.lastShot = now
    }
  }

  update(deltaTime) {
    if (this.paused || this.gameOver) return

    // Player movement
    if (this.keys["ArrowLeft"] && this.player.x > 0) this.player.x -= this.player.speed
    if (this.keys["ArrowRight"] && this.player.x < this.canvas.width - this.player.width)
      this.player.x += this.player.speed
    if (this.keys["ArrowUp"] && this.player.y > this.canvas.height - 120) this.player.y -= this.player.speed
    if (this.keys["ArrowDown"] && this.player.y < this.canvas.height - this.player.height)
      this.player.y += this.player.speed
    if (this.keys[" "]) this.shoot()

    // Update bullets
    this.bullets = this.bullets.filter((b) => {
      b.y -= b.speed

      // Check mushroom collisions
      for (const m of this.mushrooms) {
        if (this.collision(b, m, 16, 16)) {
          m.health--
          if (m.health <= 0) {
            this.score += 1
            this.mushrooms = this.mushrooms.filter((mush) => mush !== m)
          }
          return false
        }
      }

      // Check centipede collisions
      for (let i = 0; i < this.centipede.length; i++) {
        const seg = this.centipede[i]
        if (this.collision(b, seg, 16, 16)) {
          this.score += seg.isHead ? 100 : 10

          // Create mushroom at hit location
          this.mushrooms.push({ x: seg.x, y: seg.y, health: 4, poisoned: false })

          // Split centipede if hit in middle
          if (i > 0 && i < this.centipede.length - 1) {
            const backPart = this.centipede.splice(i + 1)
            backPart[0].isHead = true
            this.centipede = this.centipede.concat(backPart)
          }

          this.centipede.splice(i, 1)
          return false
        }
      }

      // Check spider collision
      if (this.spider && this.collision(b, this.spider, 24, 24)) {
        const distance = Math.abs(this.spider.y - this.player.y)
        this.score += distance < 50 ? 900 : distance < 150 ? 600 : 300
        this.spider = null
        return false
      }

      // Check flea collision
      if (this.flea && this.collision(b, this.flea, 16, 16)) {
        this.score += 200
        this.flea = null
        return false
      }

      // Check scorpion collision
      if (this.scorpion && this.collision(b, this.scorpion, 32, 16)) {
        this.score += 1000
        this.scorpion = null
        return false
      }

      return b.y > 0
    })

    // Update centipede
    this.centipede.forEach((seg) => {
      if (seg.diving) {
        // Diving behavior from poisoned mushroom
        seg.y += seg.speed * 2
        seg.x += seg.diveX
        if (seg.x <= 0 || seg.x >= this.canvas.width - 16) seg.diveX *= -1

        if (seg.y >= this.canvas.height - 120) {
          seg.diving = false
          seg.fromBottom = true
        }
      } else {
        seg.x += seg.direction * seg.speed

        // Check edges and mushrooms
        let shouldDrop = false
        if (seg.x <= 0 || seg.x >= this.canvas.width - 16) {
          shouldDrop = true
        }

        // Check mushroom collision
        for (const m of this.mushrooms) {
          if (this.collision(seg, m, 16, 16)) {
            shouldDrop = true
            if (m.poisoned) {
              seg.diving = true
              seg.diveX = seg.direction * 2
            }
            break
          }
        }

        if (shouldDrop) {
          seg.y += 16
          seg.direction *= -1
        }

        // Reach bottom, start moving up
        if (seg.y >= this.canvas.height - 120 && !seg.fromBottom) {
          seg.fromBottom = true
        }

        if (seg.fromBottom && seg.y <= 0) {
          seg.fromBottom = false
        }
      }

      // Check player collision
      if (this.collision(seg, this.player, 16, 16)) {
        this.lives--
        if (this.lives <= 0) {
          this.gameOver = true
          window.parent.postMessage({ type: "gameOver", score: this.score }, "*")
        } else {
          this.player.x = 160
          this.player.y = 550
        }
      }
    })

    // Update spider
    this.spiderSpawnTimer -= deltaTime
    if (this.spiderSpawnTimer <= 0 && !this.spider) {
      this.spider = {
        x: Math.random() < 0.5 ? 0 : this.canvas.width,
        y: this.canvas.height - 100,
        dx: (Math.random() < 0.5 ? 1 : -1) * (1 + Math.random() * 2),
        dy: 0,
        erraticTimer: 0,
      }
      this.spiderSpawnTimer = 3000 + Math.random() * 5000
    }

    if (this.spider) {
      this.spider.erraticTimer += deltaTime
      if (this.spider.erraticTimer > 200) {
        this.spider.dy = (Math.random() - 0.5) * 3
        this.spider.erraticTimer = 0
      }

      this.spider.x += this.spider.dx
      this.spider.y += this.spider.dy

      // Eat mushrooms
      this.mushrooms = this.mushrooms.filter((m) => {
        if (m.y > this.canvas.height - 120 && this.collision(this.spider, m, 24, 16)) {
          return Math.random() > 0.3 // 30% chance to eat
        }
        return true
      })

      // Remove if off screen
      if (this.spider.x < -32 || this.spider.x > this.canvas.width + 32) {
        this.spider = null
      }

      // Check player collision
      if (this.collision(this.spider, this.player, 24, 16)) {
        this.lives--
        if (this.lives <= 0) {
          this.gameOver = true
          window.parent.postMessage({ type: "gameOver", score: this.score }, "*")
        }
        this.spider = null
      }
    }

    // Update flea
    this.fleaCheckTimer += deltaTime
    if (this.fleaCheckTimer > 2000) {
      const playerAreaMushrooms = this.mushrooms.filter((m) => m.y > this.canvas.height - 120).length
      if (playerAreaMushrooms < 5 && !this.flea) {
        this.flea = { x: Math.random() * this.canvas.width, y: 0, speed: 2 }
      }
      this.fleaCheckTimer = 0
    }

    if (this.flea) {
      this.flea.y += this.flea.speed

      // Drop mushrooms (80% density)
      if (Math.random() < 0.8 && this.flea.y % 16 === 0) {
        this.mushrooms.push({ x: Math.floor(this.flea.x / 16) * 16, y: this.flea.y, health: 4, poisoned: false })
      }

      if (this.flea.y > this.canvas.height) this.flea = null

      // Check player collision
      if (this.flea && this.collision(this.flea, this.player, 16, 16)) {
        this.lives--
        if (this.lives <= 0) {
          this.gameOver = true
          window.parent.postMessage({ type: "gameOver", score: this.score }, "*")
        }
        this.flea = null
      }
    }

    // Update scorpion
    if (this.level > 2) {
      this.scorpionSpawnTimer -= deltaTime
      if (this.scorpionSpawnTimer <= 0 && !this.scorpion) {
        this.scorpion = {
          x: Math.random() < 0.5 ? 0 : this.canvas.width,
          y: Math.floor(Math.random() * 15) * 16,
          direction: Math.random() < 0.5 ? 1 : -1,
          speed: 1.5,
        }
        this.scorpionSpawnTimer = 10000 + Math.random() * 20000
      }

      if (this.scorpion) {
        this.scorpion.x += this.scorpion.direction * this.scorpion.speed

        // Poison mushrooms
        for (const m of this.mushrooms) {
          if (Math.abs(m.y - this.scorpion.y) < 8 && Math.abs(m.x - this.scorpion.x) < 16) {
            m.poisoned = true
          }
        }

        if (this.scorpion.x < -32 || this.scorpion.x > this.canvas.width + 32) {
          this.scorpion = null
        }
      }
    }

    // Check level complete
    if (this.centipede.length === 0) {
      // Bonus points for remaining mushrooms
      this.mushrooms.forEach((m) => (this.score += m.poisoned ? 5 : 5))
      this.level++
      this.initLevel()
    }

    // Send score update
    window.parent.postMessage({ type: "scoreUpdate", score: this.score, lives: this.lives }, "*")
  }

  collision(a, b, bw, bh) {
    return a.x < b.x + bw && a.x + 16 > b.x && a.y < b.y + bh && a.y + 16 > b.y
  }

  draw() {
    // Clear screen
    this.ctx.fillStyle = "#000"
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // Draw player area boundary
    this.ctx.strokeStyle = "#0f0"
    this.ctx.strokeRect(0, this.canvas.height - 120, this.canvas.width, 120)

    // Draw mushrooms
    this.mushrooms.forEach((m) => {
      this.ctx.fillStyle = m.poisoned ? "#f0f" : ["#fff", "#ddd", "#aaa", "#888"][4 - m.health]
      this.ctx.fillRect(m.x, m.y, 16, 16)
      this.ctx.strokeStyle = "#555"
      this.ctx.strokeRect(m.x, m.y, 16, 16)
    })

    // Draw centipede
    this.centipede.forEach((seg) => {
      this.ctx.fillStyle = seg.isHead ? "#f00" : "#0f0"
      this.ctx.fillRect(seg.x, seg.y, 16, 16)
      this.ctx.strokeStyle = "#fff"
      this.ctx.strokeRect(seg.x, seg.y, 16, 16)
    })

    // Draw player
    this.ctx.fillStyle = "#0ff"
    this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height)

    // Draw bullets
    this.ctx.fillStyle = "#ff0"
    this.bullets.forEach((b) => this.ctx.fillRect(b.x, b.y, 2, 8))

    // Draw spider
    if (this.spider) {
      this.ctx.fillStyle = "#f0f"
      this.ctx.fillRect(this.spider.x, this.spider.y, 24, 24)
    }

    // Draw flea
    if (this.flea) {
      this.ctx.fillStyle = "#fff"
      this.ctx.fillRect(this.flea.x, this.flea.y, 16, 16)
    }

    // Draw scorpion
    if (this.scorpion) {
      this.ctx.fillStyle = "#ff0"
      this.ctx.fillRect(this.scorpion.x, this.scorpion.y, 32, 16)
    }

    // Draw UI
    this.ctx.fillStyle = "#fff"
    this.ctx.font = "16px Arial"
    this.ctx.fillText(`Score: ${this.score}`, 10, 20)
    this.ctx.fillText(`Lives: ${this.lives}`, 10, 40)
    this.ctx.fillText(`Level: ${this.level}`, 10, 60)

    if (this.gameOver) {
      this.ctx.fillStyle = "rgba(0,0,0,0.7)"
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
      this.ctx.fillStyle = "#fff"
      this.ctx.font = "32px Arial"
      this.ctx.textAlign = "center"
      this.ctx.fillText("GAME OVER", this.canvas.width / 2, this.canvas.height / 2)
      this.ctx.font = "20px Arial"
      this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 40)
    }

    if (this.paused) {
      this.ctx.fillStyle = "rgba(0,0,0,0.5)"
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
      this.ctx.fillStyle = "#fff"
      this.ctx.font = "32px Arial"
      this.ctx.textAlign = "center"
      this.ctx.fillText("PAUSED", this.canvas.width / 2, this.canvas.height / 2)
    }
  }

  gameLoop() {
    const loop = (timestamp) => {
      if (!this.lastTimestamp) this.lastTimestamp = timestamp
      const deltaTime = timestamp - this.lastTimestamp
      this.lastTimestamp = timestamp

      this.update(deltaTime)
      this.draw()

      requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
  }
}

// Listen for pause/resume from parent
window.addEventListener("message", (event) => {
  if (event.data.type === "pause") {
    if (window.game) window.game.paused = true
  } else if (event.data.type === "resume") {
    if (window.game) window.game.paused = false
  }
})

// Start game when loaded
window.addEventListener("load", () => {
  window.game = new CentipedeGame()
})
