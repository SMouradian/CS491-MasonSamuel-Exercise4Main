/** Mason Haines - Samuel Mouradian 7/17/2025 */

const express = require('express');
const fs = require('fs');
const cors = require('cors'); // import CORS for cross-origin requests
const path = require('path');


const app = express();
app.use(express.json());
app.use(cors()); // enable CORS for all routes
const PORT = process.env.PORT || 8080;


/**
 * Represents the current state of the game.
 * @typedef {Object} GameState
 * @property {string[]} board - Array of 16 elements representing the 4x4 game board. Each entry is "X", "O", or "".
 * @property {string} currentPlayer - The ID of the current player ("X" or "O").
 * @property {number} playerOneFlip - Result of Player One's coin flip heads or tails or null if not yet flipped.
 * @property {number} playerTwoFlip - Result of Player Two's coin flip heads or tails or null if not yet flipped.
 * @property {string} coinFlip - Final coin flip outcome, default "Tails".
 * @property {[boolean, string]} isPlayerOne - Player One connection state: [connected, "X"|"O" or "" if unassigned].
 * @property {[boolean, string]} isPlayerTwo - Player Two connection state: [connected, "X"|"O" or "" if unassigned].
 * @property {number[]} winCondition - Winning indices (array of 4 board positions) or null if no winner.
 * @property {string} winner - The winner ("X" or "O"), or null if no winner yet.
 * @property {boolean} coinTossOver - Indicates if the coin toss phase has completed.
 * @property {boolean} forfeit - Indicates if the game was forfeited.
 * @property {boolean} bWriteLock - Lock flag to prevent overlapping state writes.
 */
let gameState = {
    board: Array(16).fill(""),
    currentPlayer: "",
    playerOneFlip: null,
    playerTwoFlip: null,
    coinFlip: "Tails", // Default coin flip value
    isPlayerOne: [false, ""], // [connected, "X" or "O"]
    isPlayerTwo: [false, ""], // [connected, "X" or "O"]
    winCondition: null,
    winner: null, 
    coinTossOver: false,
    forfeit: false, // Reset forfeit state
    bWriteLock: false
};

let forceReload = false;



// const gameSavePath = path.join(__dirname, '../data/db.json');
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the 'public' directory

/**
 * Starts the server and listens on the specified port.
 */
app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
    console.log(gameState);

})

// Verifiy that the server is running by sending a GET request to the root URL
// If no player ID has been set, reset the game state and set coinFlip value
app.get("/", (request, response) => {
    console.log("new Browser connected.");
    response.send("Browser Connected... at " + PORT);
    if (!gameState.isPlayerOne[0] && !gameState.isPlayerTwo[0]) {
        resetGameSave(); // Reset the game state if both players are connected
        coinFlip(); // coinFlip for computer compared value
        console.log("Current Computer coinFlip: " + gameState.coinFlip);
    }
});

/**
 * Endpoint to force reload the server state.
 */
app.get("/reload", (request, response) => {
    // console.log("Force restarting server state");
    response.json({ forceReload });
    forceReload = false; // Set forceReload to false to notify clients
});

/**
 * Endpoint to reset the game state and notify clients to reload.
 */
app.post("/forceReload", (request, response) => {
    resetGameSave();
    forceReload = true; //tell the other client to reset
    response.send("Game state has been reset and clients notified to reload.");
});

/**
 * Endpoint to get the current game state.
 *  Request to server from client for some data 
 *  app.get("URL",(req,res)=>{})
 */

app.get("/State", (request, response) => {

    response.json(gameState); // Send the game state as a JSON response
})

/**
 * Updates the game state on the server.
 */
app.post("/State", (request, response) => {

    if (!gameState.bWriteLock) {
        gameState.bWriteLock = true; // Lock the game state to prevent concurrent writes
        console.log("Game state write lock is now ON.");
    }else if (gameState.bWriteLock) {
        console.log("Game state write lock is already ON, skipping registration.");
        response.json({error: 'wait'});
        return;
    } 

    gameState = request.body; // Update the game state with the request body
    gameState.bWriteLock = false; // Unlock the game state after updating
    console.log("Game state write lock is now OFF.");
    response.send("Game State has been saved."); // Send a response indicating the game state has been saved
    console.log("current game state from client that has been updated to server");
    console.log(request.body);
})


/**
 * server endpoint to register players
 */
app.post("/register", (request, response) => {
    if (!gameState.bWriteLock) {
        gameState.bWriteLock = true; // Lock the game state to prevent concurrent writes
        console.log("Game state write lock is now ON.");
    }else if (gameState.bWriteLock) {
        console.log("Game state write lock is already ON, skipping registration.");
        response.json({error: 'wait'});
        return;
    } 

    if (!gameState.isPlayerOne[0]) {
        gameState.isPlayerOne[0] = true; // Set player one as connected
        gameState.bWriteLock = false;
        console.log("Game state write lock is now OFF.");
        console.log("Player One registered : " + gameState.isPlayerOne[0]);
        return response.json({ player: 'one' });

    } else if (!gameState.isPlayerTwo[0]) {
        gameState.isPlayerTwo[0] = true; // Set player two as connected
        gameState.bWriteLock = false;
        console.log("Game state write lock is now OFF.");
        console.log("Player Two registered : " + gameState.isPlayerTwo[0]);
        return response.json({ player: 'two' });

    }

    console.log("Player One: " + gameState.isPlayerOne[0] + " - Player Two: " + gameState.isPlayerTwo[0]);
    gameState.bWriteLock = false; 
    console.log("Game state write lock is now OFF.");
    console.log("both players already registered on client end.")
})


/**
 * Function to reset the game state to its initial values
 */
function resetGameSave() {

    gameState = {
        board: Array(16).fill(""),
        currentPlayer: "",
        playerOneFlip: null,
        playerTwoFlip: null,
        coinFlip: "Tails", // Default coin flip value
        isPlayerOne: [false, ""], // [connected, "X" or "O"]
        isPlayerTwo: [false, ""], // [connected, "X" or "O"]
        winCondition: null,
        winner: null, 
        coinTossOver: false,
        forfeit: false, // Reset forfeit state
        bWriteLock: false
    };

    console.log("Game state has been reset from null state.");
}

/**
 * function used to handle server shutdown
 */
process.on('SIGINT', () => {
    resetGameSave();
    process.exit();
});

/**
 * Function to simulate a coin flip and update the game state
 * The coin flip is determined by generating a random value between 0 and 1.
 */
function coinFlip() {
    const randomValue = Math.random(); // Generate a random value between 0 and 1
    if (randomValue <.5) {gameState.coinFlip = "Heads";} // Assign "Heads" if the random value is less than 0.5
    else {gameState.coinFlip = "Tails";} // 
}

