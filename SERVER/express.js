

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
    playerOneGuess: null,
    playerTwoGuess: null,
    coinFlip: null,
    isPlayerOne: [false, ""],
    isPlayerTwo: [false, ""],
    winCondition: null,
    winner: null
};

// const gameSavePath = path.join(__dirname, '../data/db.json');
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the 'public' directory


app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
})

// Verifiy that the server is running by sending a GET request to the root URL
app.get("/", (request, response) => {
    console.log("new Browser connected.");
    response.send("Browser Connected... at " + PORT);
    if (gameState.isPlayerOne[0] && gameState.isPlayerTwo[0]) {
        resetGameSave(); // Reset the game state if both players are connected
        console.log("Both players are connected.");
    }
});

 // Request to server from client for some data 
 // app.get("URL",(req,res)=>{})
app.get("/State", (request, response) => {
    // const jData = fs.readFileSync(gameSavePath); // Read the gameState.json file
    // const stateData = JSON.parse(jData); // Parse the JSON data to js object 
    // response.json(stateData);
    // console.log("GET Request Successfull!");
    
    // console.log("GET Request Successfull!");
    response.json(gameState); // Send the game state as a JSON response
	
})

app.post("/State", (request, response) => {
    // fs.writeFileSync(gameSavePath, JSON.stringify(request.body, null, 2)); // Write the request body to state.json
    // console.log(`PINGED from ${request.body.user};`);
	// response.send(`PINGED from ${request.body.user};`);

    gameState = request.body; // Update the game state with the request body
    response.send("Game State has been saved."); // Send a response indicating the game state has been saved
})

// Initialize the game state player id with the request body
app.post("/InitState", (request, response) => {
    // fs.writeFileSync(gameSavePath, JSON.stringify(request.body, null, 2)); // Write the request body to state.json
	// console.log("PlayerOne: " + request.body.isPlayerOne[0] + " - PlayerTwo: " + request.body.isPlayerTwo[0]);
	// response.send(`init loaded new player`);

    gameState = request.body; // Update the game state with the request body
    console.log("PlayerOne: " + request.body.isPlayerOne[0] + " - PlayerTwo: " + request.body.isPlayerTwo[0]);
    response.send(`init loaded new player, Game State has been saved.`);
    
})


// Function to reset the game state to its initial values
function resetGameSave() {
    // const nullState = {
    //     board: Array(16).fill(""),
    //     currentPlayer: "",
    //     playerOneGuess: null,
    //     playerTwoGuess: null,
    //     coinFlip: null,
    //     isPlayerOne: [false, ""],
    //     isPlayerTwo: [false, ""],
    //     winCondition: null,
    //     winner: null
    // };
    // fs.writeFileSync(gameSavePath, JSON.stringify(nullState, null, 2));
    // console.log('data.json has been reset.');

    gameState = {
        board: Array(16).fill(""),
        currentPlayer: "",
        playerOneGuess: null,
        playerTwoGuess: null,
        coinFlip: null,
        isPlayerOne: [false, ""],
        isPlayerTwo: [false, ""],
        winCondition: null,
        winner: null
    };
    console.log("Game state has been reset from null state.");
}

process.on('SIGINT', () => {
    resetGameSave();
    process.exit();
});