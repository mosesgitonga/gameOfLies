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
    


}