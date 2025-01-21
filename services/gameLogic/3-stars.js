class ThreeStars {
    constructor() {
        this.board = [
            ["", "", ""],
            ["", "", ""],
            ["", "", ""]
        ]

        this.players = {
            player1: {pieces: 3, name: "player 1"},
            player2: {pieces: 3, name: "player 2"}
        }

        this.currentTurn = "player1"
        this.gameState = "waiting" //can be waiting, inProgress, gameOver
    }


    // method to start the game 
    start() {
        if (this.gameState === "waiting") {
            this.gameState = "inProgress";
            console.log('game has started')
        }
    }

    // method to switch turn 
    switchTurn() {
        if (this.currentTurn === "player1") {
            this.currentTurn = "player2"
        } else {
            this.currentTurn = "player1"
        }
    }

      // Method to handle player move
    placePiece(player, x, y) {
        if (this.gameState !== "inProgress") {
        console.log("Game is not in progress.");
        return;
        }

        if (this.currentTurn !== player) {
        console.log(`${player} is not allowed to move right now.`);
        return;
        }

        if (this.board[x][y] !== "") {
        console.log("That position is already occupied.");
        return;
        }

        this.board[x][y] = player;
        console.log(`${player} placed a piece at (${x}, ${y})`);

        this.checkForMill(player);

        this.switchTurn();

        this.checkVictory();
    }

    checkForMill(player) {
        for (let i = 0; i < 3; i++) {
          // Check horizontal rows
          if (this.board[i][0] === player && this.board[i][1] === player && this.board[i][2] === player) {
            this.handleMill(player);
          }
          // Check vertical columns
          if (this.board[0][i] === player && this.board[1][i] === player && this.board[2][i] === player) {
            this.handleMill(player);
          }
        }

        //Checks diagonals
        if (this.board[0][0] === player && this.board[1][1] === player && this.board[2][2] === player) {
          this.handleMill(player);
        }
        if (this.board[0][2] === player && this.board[1][1] === player && this.board[2][0] === player) {
          this.handleMill(player);
        }
    }

    // Handle the logic after a mill is formed (player removes all opponent's pieces)
    handleMill(player) {
        console.log(`${player} formed a mill! All opponent's pieces will be removed.`);
    
        const opponent = player === "player1" ? "player2" : "player1";
    
        // Remove all opponent's pieces from the board
        for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (this.board[i][j] === opponent) {
            this.board[i][j] = ""; 
            }
        }
        }
    
        // Set the opponent's remaining pieces to 0
        this.players[opponent].pieces = 0;
    
        console.log(`All of ${opponent}'s pieces have been removed!`);
    }

    checkVictory() {
        if (this.players.player1.pieces < 3) {
          this.gameState = "gameOver";
          console.log("Player 2 wins!");
        } else if (this.players.player2.pieces < 3) {
          this.gameState = "gameOver";
          console.log("Player 1 wins!");
        }
      }
      printBoard() {
        console.log(
          this.board
            .map(row =>
              row
                .map(cell => {
                  if (cell === "player1") return "*"; // Represent player1's pieces with '*'
                  if (cell === "player2") return "#"; // Represent player2's pieces with '#'
                  return " "; // Empty space for unoccupied cells
                })
                .join(" | ")
            )
            .join("\n")
        );
      }
      
      
}

const game = new ThreeStars()

game.start()

game.placePiece("player1", 0, 0)

game.placePiece("player2", 1, 1)

game.placePiece("player1", 1,0)

game.placePiece("player2", 2, 2)

game.placePiece("player1", 1, 2)




game.printBoard()