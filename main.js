import { Game } from './game.js';

/**
 * MAIN UI & GAME ENGINE INITIALIZATION
 */
window.addEventListener('DOMContentLoaded', () => {
  const menuOverlay = document.getElementById('menuOverlay');
  const campaignBtn = document.getElementById('campaignBtn');
  const infiniteBtn = document.getElementById('infiniteBtn');
  const mobileToggleBtn = document.getElementById('mobileToggleBtn'); // ADDED
  const systemMenu = document.getElementById('systemMenu');
  const resumeBtn = document.getElementById('resumeBtn');
  const quitBtn = document.getElementById('quitBtn');
  const canvas = document.getElementById('game');
  
  let gameInstance = null;
  let isMobileMode = false; // ADDED

  // ADDED: Mobile Toggle Logic
  mobileToggleBtn.addEventListener('click', () => {
    isMobileMode = !isMobileMode;
    document.body.classList.toggle('mobile-mode', isMobileMode);
    mobileToggleBtn.textContent = isMobileMode ? "📱 MOBILE MODE: ON" : "📱 MOBILE MODE: OFF";
  });

  // Listen for the Game engine requesting the next infinite loop
  window.addEventListener('generate-new-level', () => {
    if (gameInstance && gameInstance.isInfiniteMode) {
        const nextLevel = generateAdvancedLevel();
        gameInstance.loadGeneratedLevel(nextLevel);
    }
  });
  
  const startGame = (isInfinite = false) => {
    menuOverlay.style.display = 'none';
    
    // FULLSCREEN & ORIENTATION
    const container = document.getElementById('gameContainer');
    if (isMobileMode) {
      container.requestFullscreen().then(() => {
        if (screen.orientation && screen.orientation.lock) {
          screen.orientation.lock('landscape').catch(() => {});
        }
      }).catch(err => console.warn("Fullscreen failed", err));
    }
    if (!gameInstance) {
      gameInstance = new Game(canvas);
      gameInstance.isInfiniteMode = isInfinite; 
      if (isInfinite) {
        gameInstance.loadGeneratedLevel(generateAdvancedLevel());
      } else {
        gameInstance.loadLevel(0);
      }
      gameInstance.tick();
    } else {
      gameInstance.isInfiniteMode = isInfinite;
      gameInstance.paused = false;
      if (isInfinite) {
        gameInstance.loadGeneratedLevel(generateAdvancedLevel());
      } else {
        gameInstance.loadLevel(0);
      }
    }
  };

  campaignBtn.addEventListener('click', () => startGame(false));
  infiniteBtn.addEventListener('click', () => startGame(true));
  resumeBtn.addEventListener('click', () => gameInstance?.toggleSystemMenu());
  
  quitBtn.addEventListener('click', () => {
    if (gameInstance) {
      gameInstance.destroy(); 
      gameInstance = null;
      systemMenu.style.display = 'none';
      menuOverlay.style.display = 'flex';
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    }
  });
});

/**
 * =========================================================
 * THE "HUMAN-FEEL" MODULAR PROCEDURAL GENERATOR
 * =========================================================
 * Instead of pure RNG, we build levels by combining handcrafted
 * 300px-wide "Chunks". This ensures structure, fairness, and flow.
 */

function generateAdvancedLevel() {
  const MAX_ATTEMPTS = 50;
  
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const level = {
      name: `Vault Run ${Math.floor(Math.random() * 900) + 100}-${String.fromCharCode(65 + (attempt % 26))}`,
      objective: "Navigate the active sectors and extract.",
      tip: "Momentum is key. Plan your route through the modules.",
      start: { x: 70, y: 270 },
      exit: { x: 890, y: 270, r: 26 },
      walls: [
        // Outer boundaries
        { x: 0, y: 0, w: 960, h: 24 }, { x: 0, y: 516, w: 960, h: 24 },
        { x: 0, y: 0, w: 24, h: 540 }, { x: 936, y: 0, w: 24, h: 540 }
      ],
      shards: [],
      turrets: [],
      gates: []
    };

    // The canvas is 960 wide. Playable area is roughly X: 24 to 936.
    // We will place Two 300px wide "Chunks". 
    // Chunk 1: X = 150 to 450
    // Chunk 2: X = 530 to 830
    // This leaves a safe 80px "breathing corridor" in the middle (450-530).

    const chunk1 = getRandomChunk(150);
    const chunk2 = getRandomChunk(530);

    // Merge the chunks into the main level object
    level.walls.push(...chunk1.walls, ...chunk2.walls);
    level.shards.push(...chunk1.shards, ...chunk2.shards);
    level.turrets.push(...chunk1.turrets, ...chunk2.turrets);

    // Guarantee the path is actually beatable using BFS Validation
    const gridData = createCollisionGrid(level);
    if (!canReach(level.start, level.exit, gridData)) {
      continue; // If the combination created an impossible lock, scrap it and try again.
    }

    // Verify all shards are reachable
    let allShardsReachable = true;
    for (const shard of level.shards) {
      if (!canReach(level.start, shard, gridData)) {
        allShardsReachable = false;
        break;
      }
    }
    
    if (allShardsReachable) {
      return level; // Success!
    }
  }

  return createFallbackLevel();
}

/**
 * CHUNK LIBRARY
 * A chunk is a 300px wide, 492px tall set-piece.
 * OffsetX moves the entire chunk to its proper place in the world.
 */
function getRandomChunk(offsetX) {
  const type = Math.floor(Math.random() * 5); // Pick 1 of 5 designs
  const walls = [];
  const shards = [];
  const turrets = [];

  switch (type) {
    case 0: 
      // THE PINCH: Top and bottom walls squeeze the player into the middle. Fast laser.
      walls.push({ x: offsetX + 100, y: 24, w: 100, h: 180 });
      walls.push({ x: offsetX + 100, y: 336, w: 100, h: 180 });
      shards.push({ x: offsetX + 150, y: 270 });
      turrets.push({ x: offsetX + 150, y: 270, a: 0, omega: 1.5, range: 400, width: 8 });
      break;

    case 1: 
      // THE SPLIT: A horizontal wall divides the room. Player must pick top or bottom.
      walls.push({ x: offsetX + 40, y: 260, w: 220, h: 20 });
      shards.push({ x: offsetX + 150, y: 140 }); // Top path shard
      shards.push({ x: offsetX + 150, y: 400 }); // Bottom path shard
      turrets.push({ x: offsetX + 150, y: 260, a: 0.5, omega: 0.8, range: 600, width: 12 });
      break;

    case 2:
      // THE S-CURVE: A classic gauntlet zigzag
      walls.push({ x: offsetX + 50, y: 24, w: 40, h: 300 }); // Blocks top-left
      walls.push({ x: offsetX + 200, y: 216, w: 40, h: 300 }); // Blocks bottom-right
      shards.push({ x: offsetX + 140, y: 420 });
      shards.push({ x: offsetX + 140, y: 120 });
      // Small defensive turret in the curve
      turrets.push({ x: offsetX + 145, y: 270, a: Math.PI, omega: -0.9, range: 300, width: 10 });
      break;

    case 3:
      // THE CROSSFIRE: 4 pillars forming an arena, rotating laser in the exact center
      walls.push({ x: offsetX + 40, y: 80, w: 50, h: 50 });
      walls.push({ x: offsetX + 210, y: 80, w: 50, h: 50 });
      walls.push({ x: offsetX + 40, y: 410, w: 50, h: 50 });
      walls.push({ x: offsetX + 210, y: 410, w: 50, h: 50 });
      shards.push({ x: offsetX + 150, y: 150 });
      turrets.push({ x: offsetX + 150, y: 270, a: Math.random() * Math.PI, omega: 1.1, range: 800, width: 10 });
      break;

    case 4:
      // THE VAULT: A C-shaped room facing backward, forcing the player to wrap around
      walls.push({ x: offsetX + 200, y: 150, w: 40, h: 240 }); // The back wall
      walls.push({ x: offsetX + 80, y: 150, w: 120, h: 40 }); // Top lip
      walls.push({ x: offsetX + 80, y: 350, w: 120, h: 40 }); // Bottom lip
      shards.push({ x: offsetX + 140, y: 250 }); // Shard hidden inside the C
      turrets.push({ x: offsetX + 220, y: 270, a: 1.5, omega: 0.6, range: 500, width: 12 });
      break;
  }

  return { walls, shards, turrets };
}


/**
 * =========================================================
 * NAVIGATION & PATHFINDING UTILITIES
 * =========================================================
 */

function createCollisionGrid(level) {
  const CELL = 20; 
  const COLS = Math.ceil(960 / CELL);
  const ROWS = Math.ceil(540 / CELL);
  const grid = Array(ROWS).fill(0).map(() => Array(COLS).fill(0));
  
  // Padding creates a buffer so the ship's radius doesn't clip corners
  const PAD = 14; 

  level.walls.forEach(w => {
    const c1 = Math.max(0, Math.floor((w.x - PAD) / CELL));
    const c2 = Math.min(COLS - 1, Math.ceil((w.x + w.w + PAD) / CELL));
    const r1 = Math.max(0, Math.floor((w.y - PAD) / CELL));
    const r2 = Math.min(ROWS - 1, Math.ceil((w.y + w.h + PAD) / CELL));
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) grid[r][c] = 1;
    }
  });

  return { grid, CELL, ROWS, COLS };
}

function canReach(startPos, endPos, gridData) {
  const { grid, CELL, ROWS, COLS } = gridData;
  
  const toGrid = (pos) => ({
    r: Math.max(0, Math.min(ROWS - 1, Math.floor(pos.y / CELL))),
    c: Math.max(0, Math.min(COLS - 1, Math.floor(pos.x / CELL)))
  });

  const start = toGrid(startPos);
  const end = toGrid(endPos);

  if (grid[start.r][start.c] === 1 || grid[end.r][end.c] === 1) return false;

  const queue = [start];
  const visited = new Set([`${start.r},${start.c}`]);
  // Use diagonals so the pathfinder accurately reflects the player's 360-degree movement
  const dirs = [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];

  while (queue.length > 0) {
    const curr = queue.shift();
    if (curr.r === end.r && curr.c === end.c) return true;

    for (const [dr, dc] of dirs) {
      const nr = curr.r + dr;
      const nc = curr.c + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc] === 0) {
        const key = `${nr},${nc}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push({ r: nr, c: nc });
        }
      }
    }
  }
  return false;
}

function createFallbackLevel() {
  return {
    name: "Emergency Protocol",
    objective: "Generator fault detected. Proceed to exit.",
    tip: "It's quiet. Too quiet.",
    start: { x: 70, y: 270 },
    exit: { x: 890, y: 270, r: 26 },
    walls: [
      { x: 0, y: 0, w: 960, h: 24 }, { x: 0, y: 516, w: 960, h: 24 },
      { x: 0, y: 0, w: 24, h: 540 }, { x: 936, y: 0, w: 24, h: 540 }
    ],
    shards: [{ x: 480, y: 270 }],
    turrets: []
  };
}