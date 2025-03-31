// scripts/fixGameState.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixGameStates() {
    const games = await prisma["Game"].findMany();
    for (const game of games) {
        try {
            JSON.parse(game.state || "{}");
        } catch (error) {
            console.log(`Fixing invalid state for game ${game.id}: ${game.state}`);
            const fixedState = {
                pieces: { A: null, B: null, C: null, D: null, E: null, F: null, G: null, H: null, I: null },
                currentPlayer: "X",
                placedPieces: { X: 0, O: 0 },
            };
            await prisma.game.update({
                where: { id: game.id },
                data: { state: JSON.stringify(fixedState) },
            });
            console.log(`Fixed state for game ${game.id}`);
        }
    }
    console.log("All game states checked and fixed.");
    await prisma.$disconnect();
}

fixGameStates().catch(console.error);