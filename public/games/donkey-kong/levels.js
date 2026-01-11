/** @type {typeof Phaser} */

// Level configurations from your data
const LEVELS = [
  {
    playerStart: { x: 10, y: 545 },
    platformData: [
      { x: 0, y: 500 },
      { x: 80, y: 380 },
      { x: 30, y: 200 },
      { x: 80, y: 120 },
    ],
    fireData: [
      { x: 40, y: 479 },
      { x: 120, y: 359 },
      { x: 70, y: 179 },
    ],
    goal: { x: 20, y: 90 },
    barrelFrequency: 5,
    barrelSpeed: 120,
  },
  {
    playerStart: { x: 10, y: 545 },
    platformData: [
      { x: 0, y: 460 },
      { x: 200, y: 400 },
      { x: 50, y: 250 },
      { x: 220, y: 150 },
    ],
    fireData: [
      { x: 30, y: 439 },
      { x: 220, y: 379 },
      { x: 70, y: 229 },
    ],
    goal: { x: 230, y: 90 },
    barrelFrequency: 6,
    barrelSpeed: 100,
  },
  {
    playerStart: { x: 10, y: 545 },
    platformData: [
      { x: 0, y: 480 },
      { x: 220, y: 460 },
      { x: 100, y: 350 },
      { x: 250, y: 250 },
      { x: 150, y: 100 },
    ],
    fireData: [
      { x: 250, y: 439 },
      { x: 280, y: 229 },
    ],
    goal: { x: 160, y: 50 },
    barrelFrequency: 5,
    barrelSpeed: 130,
  },
]
