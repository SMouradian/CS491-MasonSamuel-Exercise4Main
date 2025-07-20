/** Mason Haines - Samuel Mouradian 7/17/2025 */

const express = require('express');
const fs = require('fs');
const cors = require('cors'); // import CORS for cross-origin requests
const path = require('path');


const app = express();
app.use(express.json());
app.use(cors()); // enable CORS for all routes
const PORT = process.env.PORT || 8080;

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
        startNewGame: false,
        bWriteLock: false
    };

// const gameSavePath = path.join(__dirname, '../data/db.json');
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the 'public' directory


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

 // Request to server from client for some data 
 // app.get("URL",(req,res)=>{})
app.get("/State", (request, response) => {

    response.json(gameState); // Send the game state as a JSON response
})

app.get("/NewGame", (request, response) => {
    ReNewGameSave(); // Reset the game state to its initial values
    response.json(gameState); // Send the new game state as a JSON response
});

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


// Function to reset the game state to its initial values
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
        startNewGame: false,
        bWriteLock: false
    };

    console.log("Game state has been reset from null state.");
}

function ReNewGameSave() {
    // Reset the game state to its initial values
    gameState.board = Array(16).fill(""); // Reset the board to empty
    console.log("Game BOARD has been emptied.");
}

process.on('SIGINT', () => {
    resetGameSave();
    process.exit();
});

function coinFlip() {
    const randomValue = Math.random(); // Generate a random value between 0 and 1
    if (randomValue <.5) {gameState.coinFlip = "Heads";} // Assign "Heads" if the random value is less than 0.5
    else {gameState.coinFlip = "Tails";} // 
}

