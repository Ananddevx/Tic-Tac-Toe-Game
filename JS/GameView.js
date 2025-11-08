export default class GameView {
  constructor() {}

  updateBoard(game) {
    const winningCombo = game.findWinningCombinations();
    const tiles = document.querySelectorAll(".board-tile");

    tiles.forEach((tile, index) => {
      tile.textContent = game.board[index];
      tile.classList.remove("winner");

      if (winningCombo && winningCombo.includes(index)) {
        tile.classList.add("winner");
      }
    });
  }
}
