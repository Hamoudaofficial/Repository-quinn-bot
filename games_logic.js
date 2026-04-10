import { db } from './firebase_config.js';

export function initGames() {
    const sijaBoard = document.getElementById('sija-board');
    if (sijaBoard) {
        sijaBoard.innerHTML = '';
        for (let i = 0; i < 25; i++) {
            const cell = document.createElement('div');
            cell.className = 'sija-cell h-full w-full';
            

            if (i < 5) cell.innerHTML = '<div class="piece-p1"></div>';
            if (i > 19) cell.innerHTML = '<div class="piece-p2"></div>';
            
            sijaBoard.appendChild(cell);
        }
    }
}


export function startMines() {


}
