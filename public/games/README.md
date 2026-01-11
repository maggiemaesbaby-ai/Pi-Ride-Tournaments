# Phaser Games Integration Guide

This folder contains Phaser game implementations for the Pi Ride Arcade tournament system.

## Game Structure

Each game should be in its own folder:
```
/public/games/
  ├── centipede/
  │   ├── index.html
  │   └── assets/
  ├── pac-man/
  │   ├── index.html
  │   └── assets/
  └── ...
```

## Communication Protocol

Games communicate with the arcade using `postMessage`:

### From Game → Parent (Tournament System)

```javascript
// Update score during gameplay
window.parent.postMessage({ 
  type: 'GAME_SCORE_UPDATE', 
  score: currentScore 
}, '*');

// When game ends
window.parent.postMessage({ 
  type: 'GAME_OVER', 
  score: finalScore 
}, '*');

// Optional: Game ready signal
window.parent.postMessage({ 
  type: 'GAME_READY' 
}, '*');
```

### From Parent → Game (Pause/Resume)

```javascript
window.addEventListener('message', (event) => {
  if (event.data.type === 'PAUSE_GAME') {
    game.scene.pause(); // Pause your Phaser scene
  } else if (event.data.type === 'RESUME_GAME') {
    game.scene.resume(); // Resume your Phaser scene
  }
});
```

## Implementation Checklist

For each game, ensure:
- [ ] index.html loads Phaser and game code
- [ ] Score updates sent via postMessage
- [ ] Game over event sent when player loses
- [ ] Pause/resume message handlers implemented
- [ ] Game works in iframe (no X-Frame-Options issues)
- [ ] Assets load correctly from relative paths

## Example Template

See `/public/games/centipede/index.html` for a complete example.
