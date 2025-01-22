class ThreeStars {
    constructor() {
        this.board = [
            ["", "", ""],
            ["", "", ""],
            ["", "", ""]
        ];

        this.players = {
            player1: {
                name: "Player 1",
                pieces: [
                    { id: "P1_1", position: null },
                    { id: "P1_2", position: null },
                    { id: "P1_3", position: null }
                ]
            },
            player2: {
                name: "Player 2",
                pieces: [
                    { id: "P2_1", position: null },
                    { id: "P2_2", position: null },
                    { id: "P2_3", position: null }
                ]
            }
        };

        this.placementPhase = true;
        this.currentTurn = "player1";
        this.gameState = "waiting"; // can be waiting, inProgress, gameOver
        this.previousMoves = {
            player1: [],
            player2: []
        };
    }

    async start() {
        if (this.gameState === "waiting") {
            this.gameState = "inProgress";
            console.log('Game has started');
        }
    }

    async switchTurn() {
        this.currentTurn = this.currentTurn === "player1" ? "player2" : "player1";
        console.log(`It's now ${this.currentTurn}'s turn.`);
        await this.delay(500); // Simulating time between turns
    }

    async validateMove(currentPosition, targetPosition) {
        const [currentX, currentY] = currentPosition;
        const [targetX, targetY] = targetPosition;

        const isAdjacent =
            (Math.abs(currentX - targetX) === 1 && currentY === targetY) ||
            (Math.abs(currentY - targetY) === 1 && currentX === targetX);

        if (!isAdjacent) {
            console.log("Illegal move: You can only move to an adjacent cell.");
            return false;
        }

        if (this.board[targetX][targetY] !== "") {
            console.log("Illegal move: The target cell is occupied.");
            return false;
        }

        return true;
    }

    async placePiece(player, pieceId, x, y) {
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

        const playerData = this.players[player];
        const piece = playerData.pieces.find(p => p.id === pieceId);

        if (!piece) {
            console.log("Invalid piece ID for this player.");
            return;
        }

        if (piece.position) {
            // Movement phase
            if (!(await this.validateMove(piece.position, [x, y]))) {
                return;
            }
        } else {
            // Placement phase
            piece.position = [x, y];
        }

        this.board[x][y] = pieceId;
        console.log(`${player} placed/moved ${pieceId} at (${x}, ${y})`);

        // Check if all pieces are placed
        if (this.placementPhase && playerData.pieces.every(p => p.position)) {
            this.placementPhase = false;
            console.log("All pieces have been placed. Movement phase begins.");
        }

        await this.switchTurn();
        await this.checkVictory();
    }

    async checkVictory() {
        if (this.players.player1.pieces.length < 3) {
            this.gameState = "gameOver";
            console.log("Player 2 wins!");
        } else if (this.players.player2.pieces.length < 3) {
            this.gameState = "gameOver";
            console.log("Player 1 wins!");
        }
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async printBoard() {
        console.log(
            this.board
                .map(row =>
                    row
                        .map(cell => {
                            if (cell.startsWith("P1")) return "*"; // Represent player1's pieces with '*'
                            if (cell.startsWith("P2")) return "#"; // Represent player2's pieces with '#'
                            return " ";
                        })
                        .join(" | ")
                )
                .join("\n")
        );
        await this.delay(300);
    }
}


const game = new ThreeStars()

game.start()

game.placePiece("player1", "P1_1",0, 0)

game.placePiece("player2", "P2_1",1, 1)

game.placePiece("player1", "P1_2", 1,0)

game.placePiece("player2", "P2_2", 2, 2)

game.placePiece("player1", "P1_3", 2, 1)

game.placePiece("player2", "P2_3", 1, 2)




game.printBoard()