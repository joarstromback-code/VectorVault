import { Game } from './game.js';

/**
 * MAIN UI & GAME ENGINE INITIALIZATION
 */
window.addEventListener('DOMContentLoaded', () => {
  const menuOverlay = document.getElementById('menuOverlay');
  const campaignBtn = document.getElementById('campaignBtn');
  const infiniteBtn = document.getElementById('infiniteBtn');
  const mobileToggleBtn = document.getElementById('mobileToggleBtn');
  const systemMenu = document.getElementById('systemMenu');
  const resumeBtn = document.getElementById('resumeBtn');
  const quitBtn = document.getElementById('quitBtn');
  const canvas = document.getElementById('game');
  
  let gameInstance = null;
  let isMobileMode = false;

  mobileToggleBtn.addEventListener('click', () => {
    isMobileMode = !isMobileMode;
    document.body.classList.toggle('mobile-mode', isMobileMode);
    mobileToggleBtn.textContent = isMobileMode ? "📱 MOBILE MODE: ON" : "📱 MOBILE MODE: OFF";
  });

  window.addEventListener('generate-new-level', () => {
    if (gameInstance && gameInstance.isInfiniteMode) {
        const nextLevel = generateAdvancedLevel();
        gameInstance.loadGeneratedLevel(nextLevel);
    }
  });
  
  const startGame = (isInfinite = false) => {
    menuOverlay.style.display = 'none';
    
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
        { x: 0, y: 0, w: 960, h: 24 }, { x: 0, y: 516, w: 960, h: 24 },
        { x: 0, y: 0, w: 24, h: 540 }, { x: 936, y: 0, w: 24, h: 540 }
      ],
      shards: [],
      turrets: [],
      gates: []
    };

    const chunk1 = getRandomChunk(150);
    const chunk2 = getRandomChunk(530);

    level.walls.push(...chunk1.walls, ...chunk2.walls);
    level.shards.push(...chunk1.shards, ...chunk2.shards);
    level.turrets.push(...chunk1.turrets, ...chunk2.turrets);

    const gridData = createCollisionGrid(level);
    if (!canReach(level.start, level.exit, gridData)) continue;

    let allShardsReachable = true;
    for (const shard of level.shards) {
      if (!canReach(level.start, shard, gridData)) {
        allShardsReachable = false;
        break;
      }
    }
    
    if (allShardsReachable) return level;
  }
  return createFallbackLevel();
}

/**
 * CHUNK LIBRARY
 */
function getRandomChunk(offsetX) {
  const type = Math.floor(Math.random() * 15); 
  const walls = [];
  const shards = [];
  const turrets = [];

  switch (type) {
    case 0: // THE PINCH
      walls.push({ x: offsetX + 80, y: 0, w: 140, h: 200 }, { x: offsetX + 80, y: 340, w: 140, h: 200 });
      shards.push({ x: offsetX + 150, y: 270 });
      turrets.push({ x: offsetX + 150, y: 270, a: 0, omega: 2.2, range: 450, width: 6 });
      break;

    case 1: // THE SPLIT
      walls.push({ x: offsetX + 20, y: 260, w: 260, h: 20 });
      shards.push({ x: offsetX + 50, y: 100 }, { x: offsetX + 250, y: 440 });
      turrets.push({ x: offsetX + 150, y: 120, a: 0, omega: 3.0, range: 200, width: 4 });
      turrets.push({ x: offsetX + 150, y: 420, a: 0, omega: 0.5, range: 200, width: 20 });
      break;

    case 2: // THE S-CURVE
      walls.push({ x: offsetX + 40, y: 0, w: 60, h: 320 }, { x: offsetX + 200, y: 220, w: 60, h: 320 });
      shards.push({ x: offsetX + 130, y: 450 }, { x: offsetX + 170, y: 90 });
      turrets.push({ x: offsetX + 150, y: 270, a: Math.PI, omega: -1.2, range: 400, width: 10 });
      break;

    case 3: // THE CROSSFIRE
      walls.push({ x: offsetX+60, y:100, w:40, h:40 }, { x: offsetX+200, y:100, w:40, h:40 }, { x: offsetX+60, y:400, w:40, h:40 }, { x: offsetX+200, y:400, w:40, h:40 });
      shards.push({ x: offsetX + 150, y: 270 });
      turrets.push({ x: offsetX + 150, y: 270, a: 0, omega: 1.8, range: 1000, width: 8 });
      break;

    case 4: // THE VAULT
      walls.push({ x: offsetX + 220, y: 140, w: 30, h: 260 }, { x: offsetX + 100, y: 140, w: 120, h: 30 }, { x: offsetX + 100, y: 370, w: 120, h: 30 });
      shards.push({ x: offsetX + 160, y: 270 });
      turrets.push({ x: offsetX + 210, y: 210, a: 0, omega: 0.7, range: 300, width: 10 }, { x: offsetX + 210, y: 330, a: Math.PI, omega: 0.7, range: 300, width: 10 });
      break;

    case 5: // THE SLALOM
      for(let i=0; i<3; i++) walls.push({ x: offsetX + 60 + (i*80), y: i%2==0 ? 0 : 340, w: 40, h: 200 });
      shards.push({ x: offsetX + 260, y: 270 });
      turrets.push({ x: offsetX + 20, y: 270, a: 0, omega: 0.4, range: 800, width: 15 });
      break;

    case 6: // THE EYE
      walls.push({ x: offsetX + 125, y: 245, w: 50, h: 50 });
      shards.push({ x: offsetX + 50, y: 50 }, { x: offsetX + 250, y: 490 });
      turrets.push({ x: offsetX + 150, y: 270, a: 0, omega: -2.5, range: 600, width: 5 }, { x: offsetX + 150, y: 270, a: Math.PI, omega: -2.5, range: 600, width: 5 });
      break;

    case 7: // THE CORRIDOR
      walls.push({ x: offsetX, y: 180, w: 300, h: 20 }, { x: offsetX, y: 360, w: 300, h: 20 });
      shards.push({ x: offsetX + 150, y: 270 });
      turrets.push({ x: offsetX - 50, y: 270, a: -0.5, omega: 0.3, range: 600, width: 40 });
      break;

    case 8: // THE WINDMILL
      shards.push({ x: offsetX + 150, y: 270 });
      for(let i=0; i<4; i++) {
        let ty = i < 2 ? 100 : 440;
        let tx = i % 2 == 0 ? 50 : 250;
        turrets.push({ x: offsetX + tx, y: ty, a: i, omega: 1.2, range: 300, width: 8 });
      }
      break;

    case 9: // THE ZIPPER
      for(let i=0; i<5; i++) walls.push({ x: offsetX + (i*60), y: i%2==0 ? 0 : 440, w: 20, h: 100 });
      shards.push({ x: offsetX + 280, y: 270 });
      turrets.push({ x: offsetX + 150, y: 270, a: 0, omega: 4.0, range: 150, width: 5 });
      break;

    case 10: // THE HOURGLASS
      walls.push({ x: offsetX+50, y:0, w:200, h:150 }, { x: offsetX+50, y:390, w:200, h:150 });
      shards.push({ x: offsetX + 30, y: 270 }, { x: offsetX + 270, y: 270 });
      turrets.push({ x: offsetX + 150, y: 270, a: 0, omega: 0.2, range: 500, width: 60 });
      break;

    case 11: // THE GAUNTLET
      walls.push({ x: offsetX + 50, y: 100, w: 20, h: 340 }, { x: offsetX + 50, y: 100, w: 200, h: 20 });
      shards.push({ x: offsetX + 150, y: 50 });
      turrets.push({ x: offsetX + 250, y: 270, a: 0, omega: 1.5, range: 400, width: 10 });
      break;

    case 12: // THE SCANNER
      walls.push({ x: offsetX+140, y:0, w:20, h:200 }, { x: offsetX+140, y:340, w:20, h:200 });
      shards.push({ x: offsetX + 150, y: 270 });
      turrets.push({ x: offsetX + 150, y: 0, a: 1.5, omega: 0.8, range: 540, width: 15 });
      break;

    case 13: // THE DIAMOND
      walls.push({ x: offsetX + 130, y: 230, w: 40, h: 40 });
      shards.push({ x: offsetX + 150, y: 150 }, { x: offsetX + 150, y: 390 });
      turrets.push({ x: offsetX + 80, y: 270, a: 0, omega: 2.0, range: 200, width: 5 }, { x: offsetX + 220, y: 270, a: Math.PI, omega: 2.0, range: 200, width: 5 });
      break;

    case 14: // THE CHAOS
      for(let i=0; i<3; i++) {
        let rx = Math.random() * 200, ry = Math.random() * 400;
        turrets.push({ x: offsetX + rx, y: ry, a: 0, omega: 5.0, range: 100, width: 4 });
        shards.push({ x: offsetX + rx + 20, y: ry + 20 });
      }
      break;
  }
  return { walls, shards, turrets };
}

/**
 * NAVIGATION & PATHFINDING UTILITIES
 */
function createCollisionGrid(level) {
  const CELL = 20; 
  const COLS = Math.ceil(960 / CELL);
  const ROWS = Math.ceil(540 / CELL);
  const grid = Array(ROWS).fill(0).map(() => Array(COLS).fill(0));
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
  const dirs = [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]];

  while (queue.length > 0) {
    const curr = queue.shift();
    if (curr.r === end.r && curr.c === end.c) return true;
    for (const [dr, dc] of dirs) {
      const nr = curr.r + dr, nc = curr.c + dc;
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