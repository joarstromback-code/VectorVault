import { Game } from './game.js';

window.addEventListener('DOMContentLoaded', () => {
  // Main Menu Elements
  const menuOverlay = document.getElementById('menuOverlay');
  const campaignBtn = document.getElementById('campaignBtn');
  const infiniteBtn = document.getElementById('infiniteBtn');
  
  // System/Pause Menu Elements
  const systemMenu = document.getElementById('systemMenu');
  const resumeBtn = document.getElementById('resumeBtn');
  const quitBtn = document.getElementById('quitBtn');
  
  const canvas = document.getElementById('game');
  let gameInstance = null;

  /**
   * Starts or resumes the game logic
   */
  const startGame = (isInfinite = false) => {
    // Hide the main menu
    menuOverlay.style.display = 'none';

    if (!gameInstance) {
      // Initialize a new game engine instance
      gameInstance = new Game(canvas);
      gameInstance.isInfiniteMode = isInfinite; 
      
      if (isInfinite) {
        const randomLevel = generateInfiniteLevel(); 
        // Note: gameInstance.loadGeneratedLevel must be added to game.js
        if (gameInstance.loadGeneratedLevel) {
            gameInstance.loadGeneratedLevel(randomLevel);
        } else {
            console.error("Game.loadGeneratedLevel not yet implemented in game.js");
        }
      } else {
        gameInstance.loadLevel(0);
      }
      
      // Start the game loop
      gameInstance.tick();
    } else {
      // If an instance exists, simply ensure it's unpaused
      gameInstance.isInfiniteMode = isInfinite;
      gameInstance.paused = false;
    }
  };

  // --- Main Menu Listeners ---
  campaignBtn.addEventListener('click', () => startGame(false));
  infiniteBtn.addEventListener('click', () => startGame(true));

  // --- System Menu Listeners (The "E" Menu) ---
  
  // Resume the game
  resumeBtn.addEventListener('click', () => {
    if (gameInstance) {
      gameInstance.toggleSystemMenu(); // This hides the menu and unpauses
    }
  });

  // Quit to Main Menu
  quitBtn.addEventListener('click', () => {
    if (gameInstance) {
      // 1. Stop the current game
      gameInstance.destroy(); 
      gameInstance = null;

      // 2. Clear the canvas (optional)
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 3. UI Switch
      systemMenu.style.display = 'none';
      menuOverlay.style.display = 'flex';
    }
  });
});

/**
 * Placeholder for Procedural Level Generation
 */
function generateInfiniteLevel() {
    console.log("Generating Infinite Protocol...");
    // Logic for path validation and seed generation will go here
    return null; 
}