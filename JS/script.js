// Debug-friendly, robust controller for the TicTacToe UI
import Game from "./Game.js";
import GameView from "./GameView.js";

// 🎵 --- SOUND SYSTEM (Updated for .mp3 files) ---
const sounds = {
  click: new Audio("./Assets/sounds/UI Click.mp3"),
  win: new Audio("./Assets/sounds/Success.mp3"),
  lose: new Audio("./Assets/sounds/Game Over.mp3"),
  draw: new Audio("./Assets/sounds/Notification.mp3"),
};

// Set global volume (0.0 to 1.0)
Object.values(sounds).forEach((s) => (s.volume = 0.6));

function playSound(type) {
  const sound = sounds[type];
  if (sound) {
    sound.pause(); // stop current play if any
    sound.currentTime = 0; // rewind
    sound.play().catch((err) => {
      console.warn("Audio playback blocked or failed:", err);
    });
  }
}

// -----------------------------------------------------

let game, gameView;
let gameMode = "multi";
let playerSymbol = "X";
let computerSymbol = "O";
let scores = { X: 0, O: 0, Comp: 0 };
let timerInterval = null;
let timeLeft = 3;
let gameStarted = false;

function $id(id) { return document.getElementById(id); }
function log(msg, ...rest) { console.log("[T3]", msg, ...rest); }

window.addEventListener("DOMContentLoaded", () => {
  const startScreen = $id("startScreen");
  const chooseScreen = $id("chooseScreen");
  const gameContainer = $id("gameContainer");
  const singleBtn = $id("singlePlayer");
  const multiBtn = $id("multiPlayer");
  const chooseX = $id("chooseX");
  const chooseO = $id("chooseO");
  const startGameBtn = $id("startGame");
  const startBtn = $id("startBtn");
  const darkBtn = $id("btn");

  if (!startScreen || !gameContainer || !startBtn) {
    console.error("[T3] Missing required DOM elements.");
    return;
  }

  // 🌙 Dark Mode
  if (darkBtn && darkBtn.checked) document.body.classList.add("dark");
  if (darkBtn)
    darkBtn.addEventListener("change", () =>
      document.body.classList.toggle("dark", darkBtn.checked)
    );

  // 🎮 Single Player
  if (singleBtn)
    singleBtn.addEventListener("click", () => {
      gameMode = "single";
      startScreen.style.display = "none";
      chooseScreen.style.display = "flex";
      log("Selected single-player mode");
    });

  // 👬 Multiplayer
  if (multiBtn)
    multiBtn.addEventListener("click", () => {
      gameMode = "multi";
      startScreen.style.display = "none";
      chooseScreen.style.display = "none";
      gameContainer.style.display = "flex";
      prepareBoard();
      log("Selected multiplayer mode");
    });

  // ❌⭕ Choose Symbol
  if (chooseX) chooseX.addEventListener("click", () => setSymbol("X"));
  if (chooseO) chooseO.addEventListener("click", () => setSymbol("O"));

  // Optional "Start" on choose screen
  if (startGameBtn)
    startGameBtn.addEventListener("click", () => {
      chooseScreen.style.display = "none";
      gameContainer.style.display = "flex";
      prepareBoard();
    });

  // Main Start button
  startBtn.addEventListener("click", startNewGame);
});

// --------------------- GAME LOGIC ---------------------

function setSymbol(symbol) {
  playerSymbol = symbol;
  computerSymbol = symbol === "X" ? "O" : "X";
  $id("chooseScreen").style.display = "none";
  $id("gameContainer").style.display = "flex";
  prepareBoard();

  // Enable start button after choosing
  const startBtn = $id("startBtn");
  if (startBtn) startBtn.disabled = false;
}

function prepareBoard() {
  clearInterval(timerInterval);
  timerInterval = null;
  gameStarted = false;
  timeLeft = 3;

  game = new Game();
  gameView = new GameView();
  gameView.updateBoard(game);

  document.querySelectorAll(".board-tile").forEach((tile) => {
    tile.textContent = "";
    tile.classList.remove("winner");
    tile.onclick = () => onTileClick(parseInt(tile.dataset.index, 10));
  });

  const timerEl = $id("turnTimer");
  if (timerEl) timerEl.textContent = "3";

  updateTurnDisplay();
  updateScores();

  const startBtn = $id("startBtn");
  if (startBtn) startBtn.disabled = false;
}

function startNewGame() {
  game = new Game();
  gameView.updateBoard(game);
  gameStarted = true;

  const startBtn = $id("startBtn");
  if (startBtn) startBtn.disabled = true;

  timeLeft = 3;
  const timerEl = $id("turnTimer");
  if (timerEl) timerEl.textContent = timeLeft;

  updateTurnDisplay();

  if (gameMode === "single") {
    if (game.turn === playerSymbol) startTimer();
    else setTimeout(computerMove, 600);
  } else if (gameMode === "multi") {
    startTimer();
  }
}

// ---------------- TIMER ----------------

function startTimer() {
  clearInterval(timerInterval);
  timeLeft = 3;
  const timerEl = $id("turnTimer");
  if (timerEl) timerEl.textContent = timeLeft;

  timerInterval = setInterval(() => {
    timeLeft--;
    if (timerEl) timerEl.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      playSound("lose");
      if (gameMode === "single" && game.turn === playerSymbol) {
        showPopup("😢", "Time’s up! You Lost!", true);
      } else if (gameMode === "multi") {
        showPopup("😢", `Player ${game.turn} ran out of time!`);
      }
    }
  }, 1000);
}

// ---------------- TILE CLICK ----------------

function onTileClick(i) {
  if (!gameStarted || game.endOfGame()) return;
  if (gameMode === "single" && game.turn !== playerSymbol) return;

  playSound("click");
  game.makeMove(i);
  gameView.updateBoard(game);

  if (timerInterval) clearInterval(timerInterval);

  handleResultAfterMove();

  if (!game.endOfGame()) {
    updateTurnDisplay();

    if (gameMode === "single") {
      if (game.turn === computerSymbol) setTimeout(computerMove, 600);
      else startTimer();
    } else if (gameMode === "multi") {
      startTimer();
    }
  }
}

// ---------------- COMPUTER MOVE ----------------

function computerMove() {
  if (!game || game.endOfGame()) return;
  const empty = game.board
    .map((v, idx) => (v === null ? idx : null))
    .filter((v) => v !== null);
  if (!empty.length) return;

  const choice = empty[Math.floor(Math.random() * empty.length)];
  game.makeMove(choice);
  gameView.updateBoard(game);

  handleResultAfterMove();

  if (!game.endOfGame()) {
    updateTurnDisplay();
    if (game.turn === playerSymbol) startTimer();
  }
}

// ---------------- RESULT HANDLER ----------------

function handleResultAfterMove() {
  const win = game.findWinningCombinations();
  if (win) {
    const winner = game.board[win[0]];

    if (winner === "X") scores.X++;
    else if (winner === "O") {
      if (gameMode === "single") scores.Comp++;
      else scores.O++;
    }
    updateScores();

    clearInterval(timerInterval);

    setTimeout(() => {
      if (gameMode === "single") {
        if (winner === playerSymbol) {
          playSound("win");
          showPopup("🎉", "You Win!");
        } else {
          playSound("lose");
          showPopup("😢", "You Lost!");
        }
      } else {
        playSound("win");
        showPopup("🎉", `Player "${winner}" Wins!`);
      }
    }, 300);
    return;
  }

  if (!game.board.includes(null)) {
    clearInterval(timerInterval);
    playSound("draw");
    setTimeout(() => showPopup("😐", "It’s a Draw!"), 200);
  }
}

// ---------------- UI HELPERS ----------------

function updateScores() {
  const sx = $id("scoreX"), so = $id("scoreO"), sc = $id("scoreComp");
  if (sx) sx.textContent = scores.X;
  if (so) so.textContent = scores.O;
  if (sc) sc.textContent = scores.Comp;
}

function updateTurnDisplay() {
  const turnDisplay = $id("turnDisplay");
  if (!turnDisplay || !game) return;

  if (gameMode === "multi") {
    turnDisplay.textContent = `Player ${game.turn}’s Turn`;
  } else {
    turnDisplay.textContent =
      game.turn === playerSymbol ? "Your Turn" : "Computer’s Turn";
  }
}

// ---------------- POPUP ----------------

function showPopup(emoji, message) {
  clearInterval(timerInterval);
  timerInterval = null;

  const overlay = $id("popupOverlay");
  const popupEmoji = $id("popupEmoji");
  const popupMessage = $id("popupMessage");
  const popupButton = $id("popupButton");

  if (!overlay || !popupEmoji || !popupMessage || !popupButton) return;

  popupEmoji.textContent = emoji;
  popupMessage.textContent = message;
  overlay.style.display = "flex";

  popupButton.onclick = () => {
    overlay.style.display = "none";
    const chooseScreen = $id("chooseScreen");
    const gameContainer = $id("gameContainer");

    if (gameMode === "single") {
      gameContainer.style.display = "none";
      chooseScreen.style.display = "flex";
    } else {
      prepareBoard();
    }
  };
}
