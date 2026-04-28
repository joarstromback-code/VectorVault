import { Game } from './game.js';

// Wait for the HTML to be fully loaded before looking for elements
window.addEventListener('DOMContentLoaded', () => {
    const menu = document.getElementById('menuOverlay');
    const startBtn = document.getElementById('startBtn');
    const canvas = document.getElementById('game');

    let gameInstance = null;

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            // Hide the menu
            menu.style.display = 'none';

            // Initialize the game if it's the first time clicking Start
            if (!gameInstance) {
                gameInstance = new Game(canvas);
                // Level 0 is the first level
                gameInstance.loadLevel(0); 
                gameInstance.tick();
            } else {
                // If returning from a pause menu later, just unpause
                gameInstance.paused = false;
            }
        });
    }
});