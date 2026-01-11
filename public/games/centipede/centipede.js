// Constants
var HEADER_OFFSET = 16
var PLAYER_SPEED = 300
var BOUND_PLAYER_HIGH = 432
var BOUND_PLAYER_LOW = 528
var TOUCH = window.Phaser.Device.touch

var game
var Phaser = window.Phaser

if (TOUCH) {
  game = new Phaser.Game(
    512,
    688,
    Phaser.CANVAS,
    "game",
    { preload: preload, create: create, update: update },
    null,
    false,
    false,
  )
} else {
  game = new Phaser.Game(
    512,
    544,
    Phaser.CANVAS,
    "game",
    { preload: preload, create: create, update: update },
    null,
    false,
    false,
  )
}

// Global variables
var player, bolts, centipedes, centipede, section, spider, scorpion, flea, mushrooms, life_sprites, monsters
var lives,
  score,
  score_disp,
  hi_score_disp,
  speed,
  wave,
  wave_offset,
  fire_button,
  cursors,
  touch,
  touch_button,
  mushrows,
  mush_array
var flea_timer, scorpion_timer, spider_timer, score_timer

// Set up assets
function preload() {
  game.load.bitmapFont("2P", "assets/2P.png", "assets/2P.fnt")
  game.load.atlasJSONHash("atlas", "assets/centipede_sprites_1.png", "assets/cent_sprites.json")
  game.load.spritesheet("button", "assets/button.png", 512, 144)
}

function create() {
  score_disp = game.add.bitmapText(game.width / 8, 0, "2P", null, 16)
  hi_score_disp = game.add.bitmapText(game.width / 2 - 20, 0, "2P", null, 16)
  mushrows = []
  lives = 3
  speed = 5
  score = 0
  score_disp.setText(score.toString())
  hi_score_disp.setText(16543)
  wave_offset = 0
  game.physics.startSystem(Phaser.Physics.ARCADE)

  mushrooms = game.add.group()
  mushrooms.enableBody = true
  mushrooms.physicsBodyType = Phaser.Physics.ARCADE
  spawnMushrooms()

  bolts = game.add.group()
  bolts.enableBody = true
  bolts.physicsBodyType = Phaser.Physics.ARCADE
  bolts.createMultiple(1, "atlas", "bolt")
  bolts.setAll("anchor.x", 0.5)
  bolts.setAll("anchor.y", 1)
  bolts.setAll("outOfBoundsKill", true)
  bolts.setAll("checkWorldBounds", true)

  centipedes = game.add.group()
  centipedes.enableBody = true
  centipedes.physicsBodyType = Phaser.Physics.ARCADE
  centipedes.setAll("checkWorldBounds", true)

  if (TOUCH) {
    player = game.add.sprite(game.width / 2, game.height - 152, "atlas", "player")
  } else {
    player = game.add.sprite(game.width / 2, game.height, "atlas", "player")
  }
  player.anchor.setTo(0.5, 0.5)
  player.alive = true
  game.physics.enable(player, Phaser.Physics.ARCADE)
  player.body.collideWorldBounds = true
  player.animations.add("die", Phaser.Animation.generateFrameNames("bigexplosion", 0, 7, "", 2), 30, true)

  cursors = game.input.keyboard.createCursorKeys()
  fire_button = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR)

  if (TOUCH) {
    touch_button = game.add.button(256, 616, "button", touchButton, this, 2, 1, 0)
    touch_button.name = "touch_button"
    touch_button.anchor.setTo(0.5, 0.5)
  }

  monsters = new MonsterManager(game)
  var monster = new MonsterGenerator(game, "atlas", monsters)
  var spider = new monster("spider00", 1)
  spider.addAnimation("move", Phaser.Animation.generateFrameNames("spider", 0, 7, "", 2))
  spider.addAnimation("die", Phaser.Animation.generateFrameNames("bigexplosion", 0, 7, "", 2))
  spider.onCreation((creature) => {
    creature.animations.play("move")
  })

  spider.onDeath((creature) => {
    creature.animations.play("die", 30, false, true)
    score += 900
    score_disp.setText(score.toString())
  })
  spider.set("state", true)
  spider.set("time", 0)
  spider.set("dir", Math.random() < 0.5 ? -1 : 1)

  function zigZag(creature) {
    creature.x += 1
    if (Math.ceil(Math.abs(creature.x)) % 100 === 0) {
      creature.dir = creature.dir * -1
    }
    creature.y += 1 * creature.dir
  }

  function upAndDown(creature) {
    if (Math.ceil(Math.abs(creature.time)) % 75 === 0) {
      creature.dir = creature.dir * -1
    }
    creature.y += 2 * creature.dir
  }

  spider.addMovement((creature) => {
    creature.time += 1
    if (Math.ceil(Math.abs(creature.time)) % 100 === 0) {
      creature.state = !creature.state
    }
    if (creature.state) {
      zigZag(creature)
    } else {
      upAndDown(creature)
    }
  })

  for (var i = 0; i < 1; i++) {
    function rand() {
      return Math.random() * 400
    }
    spider.create(rand(), rand())
  }

  spawnCentipede(game.width / 2, 16)
  spawnScorpion()
  spawnFlea()
}

function update() {
  game.physics.arcade.collide(player, mushrooms)
  game.physics.arcade.collide(bolts, mushrooms, boltHitsMushroom, null, this)
  game.physics.arcade.collide(centipedes, mushrooms, centipedeHitsMushroom, null, this)
  game.physics.arcade.overlap(scorpion, mushrooms, scorpionHitsMushroom, null, this)
  game.physics.arcade.overlap(flea, player, fleaHitsPlayer, null, this)
  game.physics.arcade.overlap(bolts, flea, boltHitsFlea, null, this)
  game.physics.arcade.overlap(bolts, scorpion, boltHitsScorpion, null, this)
  game.physics.arcade.overlap(bolts, monsters.getGroup(), monsters.damage, null, this)
  player.body.velocity.setTo(0, 0)

  if (cursors.left.isDown) {
    player.body.velocity.x = -PLAYER_SPEED
  }
  if (cursors.right.isDown) {
    player.body.velocity.x = PLAYER_SPEED
  }
  if (player.y >= BOUND_PLAYER_HIGH) {
    if (cursors.up.isDown) {
      player.body.velocity.y = -PLAYER_SPEED
    }
  }
  if (player.y <= BOUND_PLAYER_LOW) {
    if (cursors.down.isDown) {
      player.body.velocity.y = PLAYER_SPEED
    }
  }
  if (fire_button.isDown) {
    fireBolt()
  }

  moveCentipede(centipede)

  if (scorpion) {
    moveScorpion()
  }

  monsters.move()

  if (flea) {
    moveFlea()
  }
}

function spawnMushrooms() {
  // Implementation of spawnMushrooms
}

function touchButton() {
  // Implementation of touchButton
}

function MonsterManager(game) {
  // Implementation of MonsterManager
}

function MonsterGenerator(game, atlas, manager) {
  // Implementation of MonsterGenerator
}

function spawnCentipede(x, y) {
  // Implementation of spawnCentipede
}

function spawnScorpion() {
  // Implementation of spawnScorpion
}

function spawnFlea() {
  // Implementation of spawnFlea
}

function boltHitsMushroom(bolt, mushroom) {
  // Implementation of boltHitsMushroom
}

function centipedeHitsMushroom(centipede, mushroom) {
  // Implementation of centipedeHitsMushroom
}

function scorpionHitsMushroom(scorpion, mushroom) {
  // Implementation of scorpionHitsMushroom
}

function fleaHitsPlayer(flea, player) {
  // Implementation of fleaHitsPlayer
}

function boltHitsFlea(bolt, flea) {
  // Implementation of boltHitsFlea
}

function boltHitsScorpion(bolt, scorpion) {
  // Implementation of boltHitsScorpion
}

function fireBolt() {
  // Implementation of fireBolt
}

function moveCentipede(centipede) {
  // Implementation of moveCentipede
}

function moveScorpion() {
  // Implementation of moveScorpion
}

function moveFlea() {
  // Implementation of moveFlea
}
