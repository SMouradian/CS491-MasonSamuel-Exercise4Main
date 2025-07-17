/* Mason Haines 6/26/2025 */

/**
 * anonymous immediately invoked function that will execute immediately after being called
 * https://www.youtube.com/watch?v=SMUHorBkVsY
 */


/*****************************************************************************************
* *****************************************************************************************
* *****************************************************************************************
*                                    UI and DOM               
* *****************************************************************************************
* *****************************************************************************************                           
*****************************************************************************************/



/**
 * @param {string} currentPlayer - the current players character will be X or O
 * @param {boolean} running - the current state of the game, whether it is running or not 
 * @param {number[][]} winConditions - 2d array of possible win conditions with in the gam e
 * @param {html} cells - query all cells on the tic tac toe board
 * @param {html} clearButton - query select the h3 header with id statusText
 * @param {html} startClearButton - query select the button with id clearButton
 * @param {html} statusText - query select the button with id startClearButton
 * @param {HTMLElement} startClearButton - The button used to toggle between Start and Clear (#startClearButton).
 * @param {HTMLElement} playerDiceRollGuessInput - The container for dice input elements (#diceInputContainer).
 * @param {HTMLElement} rollDiceButton - The button used to submit a dice roll guess (#RollDice).
 */

const cells = document.querySelectorAll(".cell"); // query all cells on the tic tac toe board
const statusText = document.querySelector("#statusText");  // query select the h3 header with id statusText
const clearButton = document.querySelector("#clearButton"); // query select the button with id clearButton
const startClearButton = document.querySelector("#startClearButton"); // query select the button with id startClearButton
const playerDiceRollGuessInput = document.querySelector("#diceInputContainer"); // query select the input for the dice roll guess
const rollDiceButton = document.querySelector("#RollDice"); // query select the button for rolling the dice

/**
 * @type {Object} emptyGameState - used to store the initial game state
 */

let emptyGameState = {
    board: ["", "", "", "", "", "", "", "", "" ],
    currentPlayer: "",
    playerOneGuess: null, // Player 1's guess (1–6)
    playerTwoGuess: null, // Player 2's guess (1–6)
    diceRoll: null,        // Final die roll (1–6)
    isPlayerOne: [false, ""], // used to determine if the player is player one or two
    isPlayerTwo: [false, ""], // used to determine if the player is player one or two
    winCondition: null, // used to determine if the player has won the game
    winner: null // used to determine the winner of the game
}

/**
 * @type {Object} currentGameState - used to store the current game state
 */

let currentGameState = {
    board: ["", "", "", "", "", "", "", "", "" ],
    currentPlayer: "", 
    playerOneGuess: null,   // Player 1's guess (1–6)
    playerTwoGuess: null,   // Player 2's guess (1–6)
    diceRoll: null,         // Final die roll (1–6)
    isPlayerOne: [false, ""],  // used to determine if the player is player one or two
    isPlayerTwo: [false, ""],  // used to determine if the player is player one or two
    winCondition: null, // used to determine if the player has won the game
    winner: null // used to determine the winner of the game
}

const winConditions = [

    [0,1,2], 
    [3,4,5],
    [6,7,8],
    [0,3,6],
    [1,4,7],
    [2,5,8],
    [0,4,8],
    [2,4,6]

];

/**
 * @type {boolean} firstGame - used to determine if the game is being played for the first time
 * @type {boolean} running - used to determine if the game is running or not
 * @type {boolean} playerOne - used to determine if the player is player one or two
 * @type {boolean} playerTwo - used to determine if the player is player one or tw
 * @type {boolean} bothPlayersHaveGuessed - used to determine if both players have guessed
 * @type {boolean} playerHasMoved - used to determine which player can move
 */
let running = false; // used to determine if the game is running or not
let firstGame = true; // used to determine if the game is being played for the first time
let playerOne = false; // used to determine if the player is player one or two
let playerTwo = false; // used to determine if the player is player one or two
let bothPlayersHaveGuessed = false; // used to determine if both players have guessed
let playerHasMoved = false; // used to determine which player can move 

/**
 * @type {number} syncInterval - used to update the status text on an interval
 * @type {number} toFileInterval - used to update the file game state on an interval
 * @type {number} fromFileInterval - used to update the local game state on an interval
 * @type {FileSystemFileHandle} fileHandle - used to handle the file system file handle
 * @type {string} contents - used to store the contents of the file
 */
let syncInterval; // global
let toFileInterval; // global
let fromFileInterval; // global
let fileHandle, contents; // global variables for file handling

/*************************************************************************************************************************************************** */

displayStartMessage(); // display the player message to enter a number and roll dice
startClearButton.addEventListener("click", startClearToggle); // should not be null


/**
 * this creates and event listener for the roll dice input box
 */

diceInputValue.addEventListener("keydown", async (event) => {
    
    if (event.key === "Enter") {
        await ChooseStartingPlayerByRollingDice();
    }
});


/**
 * This function is used to display the player information in the status text
 * it is called from the reinitialzed game async function
 * it is also called from with the function ChooseStartingPlayerByRollingDice
 */
function displayPlayerInformation() {

    if ((currentGameState.playerOneGuess !== null && currentGameState.playerTwoGuess !== null) && !running) {
        running = true;
        changeBoardVisibility(); // show the game board
    }

    // display the current player information in the status text
    if ((currentGameState.isPlayerOne[1] === currentGameState.currentPlayer) && playerOne) {
        statusText.textContent = `Player One you are ${currentGameState.isPlayerOne[1]} your turn to move!`;
    } else if ((currentGameState.isPlayerTwo[1] === currentGameState.currentPlayer) && playerTwo) {
        statusText.textContent = `Player Two you are ${currentGameState.isPlayerTwo[1]} your turn to move!`;
    } else {
        statusText.textContent = `waiting for opponent's turn...`;
    }
}

/**
 * Gets the player's input from the dice input value.
 * @returns {number} The player's input as a number.
 */

async function getPlayerUserInputFromDiceInputValue() {
    const diceInputValue = document.getElementById("diceInputValue").value;
    return parseInt(diceInputValue);
}


 /**
 * displays a message in the status text indicating that both players are waiting for their guesses
 */

function waitingForOtherPlayerGuessMessage() {
    statusText.textContent = `Waiting for both players to enter their guesses...`;
}


/**
 * updates the status box on an interval to display the player information does this  every .25 seconds
 */

function updateStatusBoxOnInterval() {
    syncInterval = setInterval(() => {

        displayPlayerInformation(); // display the player information in the status text --------------------- NO LOCAL OR FILE UPDATE
    }, 250);
}


/**
 * removes the player guessing box if both players have guessed
 */

function removePlayerGuessingBox() {
    // remove the player guessing box if both players have guessed
    if (bothPlayersHaveGuessed) {
        document.getElementById("diceInputSection").style.display = "none";
    }
}


/**
 * makes game playable setting running to now true
 * gives functionality to start a game and removes the event listener from the start button
 * and creates and event listener for the clear button which calls restart game on click
 */

async function initGameUI() {

    await updateLocalGameStateWithFilePicker(); // update the local game state with the file picker

    if (!running) {
        running = true;
        changeBoardVisibility(); // show the game board
    }

    
    statusText.textContent = `Please enter your guess!`;
    if (playerOne) {
        statusText.textContent = `You are player 1 - Please enter your guess!`;
    } else if (playerTwo) {
        statusText.textContent = `You are player 2 - Please enter your guess!`;
    }

    if (currentGameState.isPlayerOne[1] !== "" && currentGameState.isPlayerTwo[1] !== "") {
        initGameStateAfterPlaying(); // reinitialize the game state after playing
        currentGameState.winner = null; // reset the winner

        await updateFileGameStateWithFilePicker(); // update the file game state with the file picker
        // alert("Game state reinitialized. You can now play again!"); // alert the user that the game state has been reinitialized
    } else{
        document.getElementById("diceInputSection").style.display = "block"; // show the input box
    }
}


/**
 * reinitializes the cells with the event listener for cellClicked
 */

function initalizeCellsUI() {
    cells.forEach(cell => cell.removeEventListener("click", cellClicked)); // remove the event listener for cellClicked to prevent multiple clicks
    cells.forEach(cell => cell.addEventListener("click", cellClicked)); // addEventListener(type, listener) 
    cells.forEach(color => color.style.color = "black"); // reset color for all cell text content
}


/**
 * event handler for when a cell is clicked during gameplay
 * gets the clicked cell index, prevents moves if cell is taken or game is not running
 * updates the cell with user's choice and checks for a win condition
 * @param {MouseEvent} event - web browser provided object that gives us feedback when mouse action is provided
 * for this instance we are looking for a cellindex to be clicked
 */

async function cellClicked(event) {

    const cellIndex = event.target.getAttribute("cellIndex"); // this refers to what ever cell is clicked on screen by user

    if (currentGameState.board[cellIndex] != "" || !running ) {
        return;
    }

    await updateUsersChoiceCell(event.target, cellIndex); // ---------------- *HAS* ------------- LOCAL AND/OR FILE UPDATE
    await updateFileGameStateWithFilePicker(); // update the file game state with the file picker
    await checkWinner(); // this function calls change player and checks for a winner ---------------- *HAS* ------------- LOCAL AND/OR FILE UPDATE
}


/**
 * updates game state and UI for the selected cell that was passed by cellClicked
 * @param {number} index - The index of the cell in the currentGameState.board array
 * @param {html} cell - the cell element that was clicked during the event that was stored from cellClicked
 */

async function updateUsersChoiceCell (cellClicked, index) {

    currentGameState.board[index] = currentGameState.currentPlayer;
    cells[index].textContent = currentGameState.currentPlayer; // update the cell with the current player's choice
}


function updateBoardFromGameState() {
    for (let i = 0; i < cells.length; i++) {
        cells[i].textContent = currentGameState.board[i];
    }

    if (currentGameState.winCondition !== null) {
        changeWinnerColors(currentGameState.winCondition); // change the text color of the winning cells
        clearInterval(syncInterval); // clear the interval to stop updating the local status
        clearInterval(fromFileInterval); 
        clearInterval(toFileInterval); 
        statusText.textContent = `${currentGameState.currentPlayer} wins! Press Clear to restart game`;

        running = false; // set running to false so that the game is not running anymore
    }
    else if (!currentGameState.board.includes("")) {

        clearInterval(syncInterval); // clear the interval to stop updating the local status
        clearInterval(fromFileInterval); 
        clearInterval(toFileInterval); 
        statusText.textContent = `Draw! Press Clear to restart game`;

        running = false;
    }
}


/**
 * updates status text based on the current game state
 */

function DrawMessage() {
    statusText.textContent = `Draw! Press Clear to restart game`;
}

function winnerMessage() {
    statusText.textContent = `${currentGameState.currentPlayer} wins! Press Clear to restart game`;
}


/**
 * displays a message to the user to press start to play the game
 * this is called when the game is first started or when a new game is created
 */

function displayStartMessage() {
    if (firstGame) {
        document.querySelector(".tooltiptext").style.visibility = "visible";
        statusText.textContent = `Please press start to play!`;
    }
}

/**
 * display the current player whos turn it is to move 
 * current player will display within the html element with statustext id 
 */

function displayCurrentPlayerForStatusText() {

    statusText.textContent = `${currentGameState.currentPlayer} won the last game! Press start to play again!`;
    document.querySelector(".tooltiptext").style.visibility = "hidden";
    if (syncInterval) {
        clearInterval(syncInterval); // clear the interval to stop updating the local game state
    }
}

/**
 * gets specific elements that were verified for win and then changes the text content color of those cells
 * @param {number[]} condition - array of win elements that were the condition for winning 
 */

function changeWinnerColors(condition) {
            
    cells[condition[0]].style.color = "red";
    cells[condition[1]].style.color = "red";
    cells[condition[2]].style.color = "red";
}


/**
 * changes the visibility of the game board based on the running state
 * if running is true, the game board is visible, otherwise it is hidden    
 */

function changeBoardVisibility() {
    if (running) {
        document.getElementById("cellContainer").style.visibility = "visible"; // show the game board
    } else {
        document.getElementById("cellContainer").style.visibility = "hidden"; // hide the game board
    }
}


/**
 * clears the cells and resets the status text to indicate no winner if there is no winner
 * also sets the winner to "O" so that the game can continue with O as the first player
 */

function restartStatusAndCells() {
    cells.forEach(cell => cell.textContent = "");
    ButtonTextStart();

    if (currentGameState.winner === null) {
        currentGameState.winner = "O";
        statusText.textContent = `No winner! Press Start to play again!`;
    }
}

function ButtonTextClear() {
    startClearButton.textContent = "Clear";
}

function ButtonTextStart() {
    startClearButton.textContent = "Start";
}

/*****************************************************************************************
* *****************************************************************************************
* *****************************************************************************************
*                                         LOGIC           
* *****************************************************************************************
* *****************************************************************************************                          
*****************************************************************************************/


/**
 * this function is to pick which way the board is initialized
 * it will either start the game with a dice roll or not or it will clear the board
 */

async function startClearToggle() {
    if (!running && firstGame && currentGameState.winner === null) {
        await startingGameInitialization(); // first-time setup
        ButtonTextClear();
        startClearButton.removeEventListener("click", startClearToggle); // remove the event listener for the start button
    } 
    else if (startClearButton.textContent === "Start") {
        await rematchGameInitialization(); // reinitialize the game state
        ButtonTextClear();
    } 
    else {
        await restartGame(); // clears board and stops game
        ButtonTextStart();
    }
}

/**
 * This function initializes the game state when the game is first started.
 */

async function startingGameInitialization() {
    // this will initialize the game state to the file system
    await createGameStateWithinFilePicker(); // this will create the game state within the file picker
    await updateLocalGameStateWithFilePicker(); // this will update the local game state with the file picker
    await reinitGameState(); // this will reinitialize the game state with the file picker ---- *HAS* --- LOCAL AND/OR FILE UPDATE
    await assignPlayerIdFromFile(); // this will assign the player if they are from a file ---- *HAS* --- LOCAL AND/OR FILE UPDATE
    await initGameUI(); // proceed only after file selected                                  ---- *HAS* --- LOCAL AND/OR FILE UPDATE
    // alert("Game initialized. Please enter your guess!"); // alert the user that the game has been initialized
}
// startClearButton.addEventListener("click", startingGameInitialization); // add event listener to the start button for starting the game


/**
 * This function initializes the game state when the game is rematched.
 */

async function rematchGameInitialization() {
    // this will reinitialize the game state to the file system
    ButtonTextClear();

    await updateLocalGameStateWithFilePicker(); 
    await initGameUI(); 
    await prepareGameTurnLogicTick(); // reinitialize the cells with the event listener for cellClicked
    updateStatusBoxOnInterval(); // update the status box on interval
}



/**
* Ensures the game state is properly initialized on first load.
 * Initializes or reinitializes the game state file if needed.
 * @returns {void}
 */

async function reinitGameState() {

    await updateLocalGameStateWithFilePicker(); // this will update the local game state with the file picker

    if (firstGame && (currentGameState.isPlayerOne[0] === false && currentGameState.isPlayerTwo[0] === false)) {
        await initGameStateToFile(); // initialize the game state to the file system
        await updateLocalGameStateWithFilePicker(); // update the local game state with the file picker
        return;
    }

    if (firstGame && (currentGameState.isPlayerOne[0] && currentGameState.isPlayerTwo[0])) {
        await initGameStateToFile(); 
        await updateLocalGameStateWithFilePicker(); 
        return;
    }
}        


/**
 * Handles the dice roll guessing phase to determine which player goes first.
 * Updates game state with guesses, rolls the dice, assigns "O" and "X", and prepares the game start.
 */

async function ChooseStartingPlayerByRollingDice() {

    await updateLocalGameStateWithFilePicker(); // update the local game state with the file picker
    const guess = await getPlayerUserInputFromDiceInputValue(); // get the player input from the dice input value

    if (isNaN(guess) || guess < 1 || guess > 6) {
        // alert("Please enter a valid number between 1 and 6.");
        return;
    }

    // this player one and player two was made on order of loading the game state from the file picker
    if (playerOne === true) {
        currentGameState.playerOneGuess = guess;
        await updateFileGameStateWithFilePicker();
    } else if (playerTwo === true) {
        currentGameState.playerTwoGuess = guess;
        await updateFileGameStateWithFilePicker();
    }

    if (
        currentGameState.playerOneGuess === null || currentGameState.playerTwoGuess === null) {
        waitingForOtherPlayerGuessMessage(); // display that both players are waiting for their guesses
        return;
    }
    bothPlayersHaveGuessed = true; // set both players have guessed to true
    if (currentGameState.diceRoll === null) {
        currentGameState.diceRoll = Math.floor(Math.random() * 6) + 1;
    }

    const diff1 = Math.abs(currentGameState.diceRoll - currentGameState.playerOneGuess);
    const diff2 = Math.abs(currentGameState.diceRoll - currentGameState.playerTwoGuess);

    if (bothPlayersHaveGuessed && (diff1 < diff2)) {
        currentGameState.currentPlayer = "O";
        currentGameState.isPlayerOne[1] = "O"; // set player one to O
        currentGameState.isPlayerTwo[1] = "X"; // set player two to X

    } else if (diff1 === diff2) {
        currentGameState.diceRoll = "null";
        await updateFileGameStateWithFilePicker();
        return;

    } else {
        currentGameState.currentPlayer = "O";
        currentGameState.isPlayerTwo[1] = "O"; // set player two to O
        currentGameState.isPlayerOne[1] = "X"; // set player one to X

    }

    if (bothPlayersHaveGuessed) {       
        clearInterval(syncInterval); // clear the interval to stop updating the local game state
    }
    await updateFileGameStateWithFilePicker();
    await updateLocalGameStateWithFilePicker(); 

    // if both players have guessed, we will display the player information on a interval
    if (bothPlayersHaveGuessed) {
        updateStatusBoxOnInterval();
    }

    removePlayerGuessingBox(); // remove the player guessing box if both players have guessed --------------------- NO LOCAL OR FILE UPDATE
    if (bothPlayersHaveGuessed) {
        prepareGameTurnLogicTick(); // ---------------- *HAS* ------------- LOCAL AND/OR FILE UPDATE
        startClearButton.addEventListener("click", startClearToggle); // should not be null
    }
}


/**
 * checks if a win condition is met by compring all combinations in winConditions
 * if a win is found, highlights the winning cells and returns true to checkwinner ends the game
 * @param {boolean} isComputer 
 * @param {number[]} tempOptions
 * @returns {number|boolean} - returns a best option vaie for machine move or returns true for a win condition
 * if no win condition returnvalue is init to zero so binary false 
 * @sideEffects - If isComputer is false and a win is found, modifies cell text color to red.
 */

async function checkForThreeInARow(thisOptions) {

    let returnValue = 0;

    for(let i = 0; i < winConditions.length/*8*/; i++) {

        // so if condition is winConditions at index [0] it would be [0,1,2]
        // lets just say the options are all still empty " "
        // that would mean the new 3 element array, conditions, is empty at all indexes
        // that would mean that cellA cellb and cellC are empty as well because they are initialized to the value of the option array at ....
        // the value of the 3 element condition array and in this examplew would be [0,1,2] but could be [0,4,8] etc

        const condition = winConditions[i];
        const cellA = thisOptions[condition[0]];
        const cellB = thisOptions[condition[1]];
        const cellC = thisOptions[condition[2]];

        if (cellA == cellB && cellB == cellC ) {

            if (cellA == "" || cellB == "" || cellC == "") { continue; } // double final check
            changeWinnerColors(condition); // change the color of the winning cells to red
            currentGameState.winCondition = condition; // set the win condition to the current condition
            currentGameState.winner = currentGameState.currentPlayer; // set the winner in the current game state
            // await updateFileGameStateWithFilePicker(); // update the file game state with the file picker

            returnValue = 1;
        } 
    }

    return returnValue;
}


/**
 * Checks for winner by calling function to check for three in a row
 * return from three in a row is set to boolean for round won
 * if the round is won, it clears the intervals to stop updating the local status
 * and then chnages the ID of the winner to "O" and the loser to "X"
 * if no win but the board is full, declares a draw
 * otherwise calls changePlayer to continue the game
 */

async function checkWinner () {
    let roundWon = false;
    roundWon = await checkForThreeInARow(currentGameState.board);

    if (roundWon) {

        clearInterval(syncInterval); // clear the interval to stop updating the local status
        clearInterval(fromFileInterval); 
        clearInterval(toFileInterval); 
        winnerMessage(); // call the winner message function to display the winner message
        running = false;

        // Assign "O" to winner and "X" to loser
        if (playerOne && (currentGameState.winner !== "O")) {
            currentGameState.isPlayerOne[1] = "O";
            currentGameState.isPlayerTwo[1] = "X";
            currentGameState.winner = "O"; // set the winner to O
        } else if (playerTwo && (currentGameState.winner !== "O")) {
            currentGameState.isPlayerTwo[1] = "O";
            currentGameState.isPlayerOne[1] = "X";
            currentGameState.winner = "O"; // set the winner to O
        }

        await updateFileGameStateWithFilePicker(); // update the file game state with the file picker
    }
    else if (!currentGameState.board.includes("")) {

        clearInterval(syncInterval); // clear the interval to stop updating the local status
        clearInterval(fromFileInterval); 
        clearInterval(toFileInterval); 
        DrawMessage(); // call the Draw function to display the draw message

        running = false;
        await updateFileGameStateWithFilePicker(); // update the file game state with the file picker

    }
    else if ((playerOne && currentGameState.isPlayerOne[1] === currentGameState.currentPlayer) ||
        (playerTwo && currentGameState.isPlayerTwo[1] === currentGameState.currentPlayer)) {
        await changePlayer();
    }
}


/**
 * when this is called if the gamne is running and the handicap has not been use yet...
 * it will call the init cells again and that player will get a secoind move 
 * is called after a move is made by a player and toggles the current player between "x" and "O"
 * if the current player is "O", the function calls the computer selection function
 * at the end it updates the current player to the statusText tect content
 * @sideEffects - updates global game state (currentPlayer), calls UI update functions,
 * and may trigger the computer's move.
 */

async function changePlayer() {

    playerHasMoved = false; // reset playerHasMoved to false so that the player can move again
    if (currentGameState.currentPlayer === "O") {
        currentGameState.currentPlayer = "X";
    } else {
        currentGameState.currentPlayer = "O";
    }
  
    clearInterval(fromFileInterval); 
    clearInterval(toFileInterval); 

    await updateFileGameStateWithFilePicker(); // update the file game state with the file picker
    playerHasMoved = false; 
    await prepareGameTurnLogicTick();
}


/**
 * If the player has not moved yet, this function will prepare the game turn logic tick that updates the file
 * The additonal player logic is to update the local game state with the file picker and update the board from the current game state 
 */

async function prepareGameTurnLogicTick() {

    // 
    if (!playerHasMoved &&
        ((playerOne && currentGameState.isPlayerOne[1] === currentGameState.currentPlayer) ||
        (playerTwo && currentGameState.isPlayerTwo[1] === currentGameState.currentPlayer))) {

        clearInterval(fromFileInterval); // clear the interval to stop updating the local game state
        clearInterval(toFileInterval); // clear the interval to stop updating the local game state

        await updateLocalGameStateWithFilePicker();
        updateBoardFromGameState(); // update the board from the current game state --------------------- NO LOCAL OR FILE UPDATE

        // toFileInterval = setInterval(async () => {
        //     await updateFileGameStateWithFilePicker();
        // }, 1000);

        playerHasMoved = true;

    } else if (playerHasMoved === false) { // if the player has not moved yet, we will update the local game state with the file picker, so they are not updating the game state while the player is making a move
        clearInterval(fromFileInterval);
        clearInterval(toFileInterval);

        fromFileInterval = setInterval(async () => {
            await updateLocalGameStateWithFilePicker();
            updateBoardFromGameState();
        }, 250);
    }

    initalizeCellsUI(); // reinitialize the cells with the event listener for cellClicked --------------------- NO LOCAL OR FILE UPDATE
}


/**
 * clears intervals and resets the game state to allow for a new game
 * also resets the cells and status text
 * as well as updating the file game state with the file picker and changing running to false 
 */

async function restartGame () {
    running = false; // set running to false so that the game is not running anymore

    // this is here just in case some one end the game early 
    clearInterval(syncInterval);
    clearInterval(toFileInterval);
    clearInterval(fromFileInterval);
    displayCurrentPlayerForStatusText();
    restartStatusAndCells();

    initGameStateAfterPlaying(); // reinitialize the game state after playing
    await updateFileGameStateWithFilePicker(); 
}


/**
 * initializes the game state after playing a game
 * resets the board, current player, win condition, winner, player guesses, and dice roll
 * does not reset the winner or the players
 */
function initGameStateAfterPlaying() {
        currentGameState.board = ["", "", "", "", "", "", "", "", "" ]; // reset the board for a new game
        if (currentGameState.winner !== null) {
            currentGameState.currentPlayer = currentGameState.winner; // reset the current player to the winner
        }
        currentGameState.winCondition = null; // reset the win condition
        // currentGameState.winner = null; // reset the winner
        currentGameState.playerOneGuess = null; // reset the player one guess
        currentGameState.playerTwoGuess = null; // reset the player two guess
        currentGameState.diceRoll = null; // reset the dice roll
}


/**
 * creates a delay used to pause logic for a set amount of milli seconds
 * @param {number} ms - the number of milli seconds to delay
 * @returns {Promise} 
 */

function sleep(ms) {
    return new Promise(resolve =>setTimeout(resolve, ms)); // https://youtu.be/pw_abLxr4PI?si=Tlfw1HBU92o0wX3B
}


/**
 * Creates a new game state within the file picker.
 * @returns {void} - this will return void if the player ID is already set to 1 or 2
 */

async function createGameStateWithinFilePicker() {
    // https://developer.mozilla.org/en-US/docs/Web/API/Window/showOpenFilePicker?utm_source=chatgpt.com
    // Here we set the options object for passing into the method. We'll allow a selection of image file types, 
    // with no option to allow for all files types, or multiple file selection.
    const pickerOptions = {
        types: [{       
            description: 'JSON Files',
            accept : {'application/json': ['.json']} // this will accept only json files
        }],
        excludeAcceptAllOption: true,
    };

    [fileHandle] = await window.showOpenFilePicker(pickerOptions); // this will open the file picker dialog to select a file

    const errorBool = await catchErrorWithFilePicker(fileHandle); // this will catch any errors with the file picker
    if (errorBool !== false) {
        let fileData = await fileHandle.getFile(); // this will get the file data from the file handle, 
    }
    else {
        alert("No file selected or an error occurred. Please refresh the page and try again.");
        return; // if there was an error with the file picker, we will return and not proceed
    }
}

/**
 * Updates the local game state with the file picker.
 * If the current game state has player one or player two assigned, it will set the respective player to true.
 * If both players are already assigned, it will alert the user and close the window.
 * @returns  {void} - this will return void if the player ID is already set to 1 or 2
 */
async function assignPlayerIdFromFile() {
    // update the local game state with the file picker
    if (firstGame) {
        await updateLocalGameStateWithFilePicker(); 

        // check if the current game state has player one or player two assigned
        if (!currentGameState.isPlayerOne[0]) {
            currentGameState.isPlayerOne[0] = true;
            playerOne = true; 
            await updateFileGameStateWithFilePicker(); 

        } else if (!currentGameState.isPlayerTwo[0]) {
            currentGameState.isPlayerTwo[0] = true;
            playerTwo = true; 
            await updateFileGameStateWithFilePicker(); 

        } else {
            alert("Both players are already assigned. Please refresh the page to start a new game.");
            window.location.reload(); // close the window if both players are already assigned
            return;
        }

        // update the current game state with the file picker
        firstGame = false; 
        await sleep(500); 
        await updateFileGameStateWithFilePicker(); 
    }
}


/**
 * Initializes the selected file with the initial game state.
 * Overwrites the contents of the chosen gameState.json file with an empty board and starting player.
 * this is called when the game is first started or when a new game is created.
 */

async function initGameStateToFile() {
    // this is to initialize the game state to the file system
    const gameStateFile = await fileHandle.createWritable();    
    contents = JSON.stringify(emptyGameState); // this is just a placeholder for the game state, it will be replaced with the actual game state
    await gameStateFile.write(contents);
    await gameStateFile.close();
    // alert("Game state initialized to file system.");
}


/**
 * in a nut shell this function will update the local game state with the file picker
 * it is reading the file via the text method and then parsing the contents as JSON
 */

async function updateLocalGameStateWithFilePicker() {
    // this is to update the game state with the file picker
    const currentFile = await fileHandle.getFile(); // this will read the file data as text
    contents = await currentFile.text();
    currentGameState = JSON.parse(contents); // Converts a JavaScript Object Notation (JSON) string into an object. function definition
}


/**
 * Updates the game state in the file picker.
 * @returns {void} - this will return void if the permission for read/write is not granted
 */

async function updateFileGameStateWithFilePicker() {
    // this is to update the game state with the file picker
    const permission = await fileHandle.requestPermission({ mode: 'readwrite' });
    if (permission !== 'granted') {
        alert("Write permission denied.");
        return;
    }
    const currentFile = await fileHandle.createWritable(); // this will create a writable stream to the file
    console.log("Current board before write:", currentGameState.board);

    contents = JSON.stringify(currentGameState); // this will convert the current game state to a JSON string
    await currentFile.write(contents); // this will write the contents to the file
    await currentFile.close(); // this will close the file handle
}


/** * 
 * Catches any errors with the file picker and alerts the user if no file is selected or if the wrong file is selected.
 * If the file is not selected or an error occurs, it will prompt the user to select a file again.
 * @param {FileSystemFileHandle} fileHandle - The file handle of the selected file.
 * @returns {File} - Returns the file data if the file is valid, otherwise returns false.
 */

async function catchErrorWithFilePicker(fileHandle) {
    // this is to catch any errors with the file picker
    if (!fileHandle) {
        alert("No file selected or an error occurred.");
        let leave = (event) => {
            if (event.keyCode === 27) {
                return;
            }
        };
        document.addEventListener("keydown", leave);
        createGameStateWithinFilePicker(); // recursively call the function to prompt the user again
        return false;
    }

    const fileData = await fileHandle.getFile();
    if (fileData.name !== "gameState.json") {
        alert("Wrong file selected. Please choose gameState.json.");
                    alert("Please select a file named gamestate.json to save the game state.");
        let leave = (event) => {
            if (event.keyCode === 27) {
                return;
            }
        };
        document.addEventListener("keydown", leave);
        createGameStateWithinFilePicker(); // recursively call the function to prompt the user again
        return false;
    }

    return fileData;
}