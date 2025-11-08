export default class Game {
  constructor() {
    this.board = new Array(9).fill(null);
    this.turn = "X";
  }

  nextTurn() {
    this.turn = this.turn === "X" ? "O" : "X";
  }

  makeMove(i) {
    // invalid move
    if (this.endOfGame() || this.board[i]) {
      return;
    }

    this.board[i] = this.turn;

    // if game is still going
    if (!this.findWinningCombinations()) {
      this.nextTurn();
    }
  }

  findWinningCombinations() {
    const winningCombos = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (const combo of winningCombos) {
      const [a, b, c] = combo;
      if (
        this.board[a] &&
        this.board[a] === this.board[b] &&
        this.board[a] === this.board[c]
      ) {
        return combo;
      }
    }

    return null;
  }

  endOfGame() {
    return (
      this.findWinningCombinations() !== null ||
      this.board.every((cell) => cell !== null)
    );
  }
}
