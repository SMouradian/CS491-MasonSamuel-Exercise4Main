/** Mason Haines - Samuel Mouradian 7/17/2025 */

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
 * @param {boolean} running - the current state of the game, whether it is running or not 
 * @param {number[][]} winConditions - 2d array of possible win conditions with in the gam e
 * @param {html} cells - query all cells on the tic tac toe board
 * @param {html} universalButton - query select the button with id universalButton
 * @param {html} statusText - query select the button with id statusText
 * 
 * @param {HTMLElement} playerDiceRollGuessInput - The container for dice input elements (#diceInputContainer).
 * @param {HTMLElement} rollDiceButton - The button used to submit a dice roll guess (#RollDice).
 */

const cells = document.querySelectorAll(".cell"); // query all cells on the tic tac toe board
const statusText = document.querySelector("#statusText");  // query select the h3 header with id statusText
const universalButton = document.querySelector("#universalButton"); // query select the button with id universalButton---------------------- change dom object name later 

const playerDiceRollGuessInput = document.querySelector("#diceInputContainer"); // query select the input for the dice roll guess
const rollDiceButton = document.querySelector("#RollDice"); // query select the button for rolling the dice

let currentGameState = {
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
let isWriting = false;

const winConditions = [
    // horizontal
    [0,1,2,3], // 3
    [4,5,6,7], // 12
    [8,9,10,11], // 21
    [12,13,14,15], // 30
    // vertical
    [0,4,8,12], // 9
    [1,5,9,13], // 12
    [2,6,10,14], // 15
    [3,7,11,15], // 18
    // diagonal
    [0,5,10,15], // 12
    [3,6,9,12]  // 12

];

/**
 * @type {boolean} firstGame - used to determine if the game is being played for the first time
 * @type {boolean} running - used to determine if the game is running or not
 * @type {boolean} playerOne - used to determine if the player is player one or two
 * @type {boolean} playerTwo - used to determine if the player is player one or tw
 * @type {boolean} bothPlayersHaveGuessed - used to determine if both players have guessed
 * @type {boolean} playerHasMoved - used to determine which player can move
 */
let firstGame = true;
let running = false; // used to determine if the game is running or not
let playerOne = false; // used to determine if the player is player one or two
let playerTwo = false; // used to determine if the player is player one or two
let playerHasMoved = false; // used to determine which player can move 
let syncSave, coinSync; 



/*************************************************************************************************************************************************** */

// reset the server game state to its initial values so you dont have to restart the server
document.addEventListener("keydown", (event) => {
    if(event.key === "r"){
        initGameState_Fetch();
    }
});



// Initialize the game and show connection screen
// test connection to the server, then fetch the current game state that has been saved on the server. Should be null
// assign player one or two depending on the order of connection to the server
(async () => {
    try{
        // Show the connection screen and hide the game UI 
        document.querySelector(".gameContainer").style.display = "none";
        document.querySelector(".button-row-container").style.display = "none";
        document.getElementById("ConnectionScreen").style.display = "flex";

        displayStartMessage(); // tell Player to flip coin

        // try fetch game state from the server 
        // await sleep(1000);
        await initGameState_Fetch(); // test the connection to the server
        await getFetch_GameState(); // fetch the game state from the server to init currentGameState
        // await assignPlayerID(); // assign player one or two, calls register player // DO ONCE
        await getPlayerIdFetch();
        await initGameUI(); // initialize the game UI
        
        // hide the connection screen and show the game UI
        document.getElementById("ConnectionScreen").remove();
        document.querySelector(".gameContainer").style.display = "flex";
        document.querySelector(".button-row-container").style.display = "flex";
    }
    catch(error){
        console.error("Connection failed:", error);
        document.getElementById("ConnectionScreen").innerHTML = `<h1>Connection Failed. Refresh the page</h1>`;
    }
})();

universalButton.addEventListener("click", universalButtonToggle); // should not be null


/**
 * This function is used to display the player information in the status text
 * it is called from the reinitialzed game async function
 * it is also called from with the function ChooseStartingPlayerByRollingDice
 */
function displayPlayerInformation(){
    // display the current player information in the status text
    if((currentGameState.isPlayerOne[1] !== "" && playerOne) && (currentGameState.isPlayerOne[1] === currentGameState.currentPlayer)){
        statusText.textContent = `Player One you are ${currentGameState.isPlayerOne[1]} your turn to move!`;
    }
    else if((currentGameState.isPlayerTwo[1] !== "" && playerTwo) && (currentGameState.isPlayerTwo[1] === currentGameState.currentPlayer)){
        statusText.textContent = `Player Two you are ${currentGameState.isPlayerTwo[1]} your turn to move!`;
    }
    else{
        statusText.textContent = `waiting for opponent's turn...`;
    }
}

 /**
 * displays a message in the status text indicating that both players are waiting for their guesses
 */
function displayAwaitCoinFlip(){
    statusText.textContent = `Waiting for both players to flip their coins...`;
}
/**
 * Polls the server for game state updates during the game
 * calling GET to get the current game state
 * updates the local game state with the server game state
 * update the board from the current game state
 */
async function pollSaveDuringGame(){
    // Interval loop to fetch game state
    console.log("Polling for game state updates... and updating the board");
    syncSave = setInterval(async () => {
        displayPlayerInformation();
        if(isWriting){
            return; // skip if we’re currently writing
        }
        else if (currentGameState.forfeit){
            restartGame(); // restart the game if a player has forfeited
            setUniversalButtonContent("Start");
            // await pollSaveDuringGame(); // restart the polling
            return;
        }
        await getFetch_GameState();
        updateBoardFromGameState();
    }, 50); // poll every 50ms
}

/**
 * makes game playable setting running to now true
 * gives functionality to start a game and removes the event listener from the start button
 * and creates and event listener for the clear button which calls restart game on click
 */
async function initGameUI(){

    if(!running){
        running = true;
        currentGameState.currentPlayer = "O"; // O goes first
        await safeSaveGameState(currentGameState);
        changeBoardVisibility(); // show the game board
    }

    // if a game has already been played
    if(currentGameState.isPlayerOne[1] !== "" && currentGameState.isPlayerTwo[1] !== ""){
        // initGameState_Fetch(); // fetch the game state from the server to init currentGameState
        currentGameState.winner = null; // reset the winner
        await safeSaveGameState(currentGameState); 
    } 
}


/**
 * reinitializes the cells with the event listener for cellClicked
 */
function toggleCellsListener() {
    // cells.forEach(cell => cell.replaceWith(cell.cloneNode(true)));  // Clears old listeners
    // cells.forEach(cell => cell.addEventListener("click", cellClicked));
    if (!running) {
        cells.forEach(cell => cell.removeEventListener("click", cellClicked)); // remove the event listener for cellClicked to prevent multiple clicks
        return;
    } 
    console.log("Reinitializing cells with event listeners for cellClicked");
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
async function cellClicked(event){
    const cellIndex = event.target.getAttribute("cellIndex"); // this refers to what ever cell is clicked on screen by user
    console.log("Cell clicked at index: " + cellIndex);

    if(currentGameState.board[cellIndex] != "" || !running){
        return;
    }

    if ((currentGameState.currentPlayer === currentGameState.isPlayerOne[1]) && playerOne) {
        await updateUsersChoiceMoveToScreen(event.target, cellIndex);
        await checkWinner(); // this function calls change player and checks for a winner 

    } else if ((currentGameState.currentPlayer === currentGameState.isPlayerTwo[1]) && playerTwo) {
        await updateUsersChoiceMoveToScreen(event.target, cellIndex); 
        await checkWinner(); // this function calls change player and checks for a winner 
    }
}


/**
 * updates game state and UI for the selected cell that was passed by cellClicked
 * @param {number} index - The index of the cell in the currentGameState.board array
 * @param {html} cell - the cell element that was clicked during the event that was stored from cellClicked
 */
async function updateUsersChoiceMoveToScreen(cellClicked, index){
    currentGameState.board[index] = currentGameState.currentPlayer; // update the board with the current player's X or O
    cells[index].textContent = currentGameState.currentPlayer; // update the cell with the current player's choice
    console.log("save from inside of the updateUsersChoiceMoveToScreen: ", currentGameState);
    await safeSaveGameState(currentGameState);
}


function updateBoardFromGameState(){
    for(let i = 0; i < cells.length; i++){
        cells[i].textContent = currentGameState.board[i];
    }

    if(currentGameState.winCondition !== null){
        changeWinnerColors(currentGameState.winCondition); // change the text color of the winning cells
        clearInterval(syncSave); 
        statusText.textContent = `${currentGameState.currentPlayer} wins! Press Clear to restart game`;

        running = false; // set running to false so that the game is not running anymore
    }
    else if(!currentGameState.board.includes("")){
        clearInterval(syncSave); // clear the interval to stop updating the local status
        statusText.textContent = `Draw! Press Clear to restart game`;

        running = false;
    }
}

/**
 * updates status text based on the current game state
 */
function displayDrawMessage(){
    statusText.textContent = `Draw! Press Clear to restart game`;
}

function displayWinnerMessage(){
    statusText.textContent = `${currentGameState.currentPlayer} wins! Press Clear to restart game`;
}


/**
 * displays a message to the user to press start to play the game
 * this is called when the game is first started or when a new game is created
 */
function displayStartMessage(){
    if(firstGame){
        // document.querySelector(".tooltiptext").style.visibility = "visible";
        statusText.textContent = `Please press FlipCoin to play!`;
    }
}

/**
 * display the current player whos turn it is to move 
 * current player will display within the html element with statustext id 
 */
function displayLastWinnerMessage(){
    statusText.textContent = `${currentGameState.currentPlayer} won the last game! Press start to play again!`;
}

/**
 * gets specific elements that were verified for win and then changes the text content color of those cells
 * @param {number[]} condition - array of win elements that were the condition for winning 
 */
function changeWinnerColors(condition){    
    cells[condition[0]].style.color = "red";
    cells[condition[1]].style.color = "red";
    cells[condition[2]].style.color = "red";
    cells[condition[3]].style.color = "red"; // added for 4 in a row
    console.log(currentGameState);
}

function setUniversalButtonContent(content){
    universalButton.textContent = content;
}


/**
 * changes the visibility of the game board based on the running state
 * if running is true, the game board is visible, otherwise it is hidden    
 */
function changeBoardVisibility(){
    if(running){
        document.getElementById("cellContainer").style.visibility = "visible"; // show the game board
    }
    else{
        document.getElementById("cellContainer").style.visibility = "hidden"; // hide the game board
    }
}


/**
 * clears the cells and resets the status text to indicate no winner if there is no winner
 * also sets the winner to "O" so that the game can continue with O as the first player
 */
function restartStatusAndCells(){
    cells.forEach(cell => cell.textContent = "");

    if(currentGameState.winner === null){
        // currentGameState.winner = "O";
        statusText.textContent = `No winner! Press Start to play again!`;
        currentGameState.forfeit = true;
    }
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
async function universalButtonToggle(){
    if(universalButton.textContent === "Flip Coin"){
        universalButton.removeEventListener("click", universalButtonToggle); 
        FlipCoin(); // start the game by flipping a coin
    } 
    else if(universalButton.textContent === "Start"){
        currentGameState.forfeit = false; // reset forfeit state
        await safeSaveGameState(currentGameState); // save the game state to the server
        initGameUI(); 
        toggleCellsListener();
        await pollSaveDuringGame(); 
        setUniversalButtonContent("Clear");

    } 
    else if (universalButton.textContent === "Clear") {
        console.log("game state before restart: ", currentGameState);
        await restartGame(); // clears board and stops game
        setUniversalButtonContent("Start");
        // await pollSaveDuringGame(); 
    }
    console.log("hello from universalButtonToggle");
}



/**
 * Handles the dice roll guessing phase to determine which player goes first.
 * Updates game state with guesses, rolls the dice, assigns "O" and "X", and prepares the game start.
 */
async function FlipCoin(){
    
    await getFetch_GameState(); // fetch the game state because there is no active server polling at this point
    let localCoinFlipResult = Math.random(); // Generate a random value between 0 and 1

    if(localCoinFlipResult <.5){
        localCoinFlipResult = "Heads";  // Assign "Heads" if the random value is less than 0.5
    }
    else{
        localCoinFlipResult = "Tails";  // not heads so tails
    }

    // set game state coin flip to the local coin flip result
    if (playerOne === true){
        currentGameState.playerOneFlip = localCoinFlipResult;
        await safeSaveGameState(currentGameState)
    }
    else if (playerTwo === true){
        currentGameState.playerTwoFlip = localCoinFlipResult;
        await safeSaveGameState(currentGameState);
    }
    compareCoinFlip(); // compare the coin flip results of both players
}

async function compareCoinFlip(){
    // only one of these should be true at this point if any at all. 
    if(currentGameState.playerOneFlip === null || currentGameState.playerTwoFlip === null){
        pollCoinFlipResult(); // poll the server for the coin flip results
        displayAwaitCoinFlip();
        return;
    }
    // Both players flipped — check for a tie - if tie set player one to winner and player two to loser
    if(currentGameState.playerOneFlip === currentGameState.playerTwoFlip){
        currentGameState.playerOneFlip = currentGameState.coinFlip; // set player one flip to the coin flip
        currentGameState.playerTwoFlip = "tied"; // set player two flip to tied which is not a valid flip
    }

    console.log("Coin toss is over. Player One Flip: " + currentGameState.playerOneFlip + " - Player Two Flip: " + currentGameState.playerTwoFlip);

    if(currentGameState.playerOneFlip === currentGameState.coinFlip){
        // currentGameState.currentPlayer = "O"; // O goes first
        currentGameState.isPlayerOne[1] = "O"; // set player one to O
        currentGameState.isPlayerTwo[1] = "X"; // set player two to X
    } 
    else if(currentGameState.playerTwoFlip === currentGameState.coinFlip){
        // currentGameState.currentPlayer = "O"; // O goes first
        currentGameState.isPlayerTwo[1] = "X"; // set player two to X
        currentGameState.isPlayerOne[1] = "O"; // set player one to O
    }
    
    currentGameState.coinTossOver = true; // set coin toss over to true so that the game can continue
    setUniversalButtonContent("Clear");
    await safeSaveGameState(currentGameState); // save the game state to the server
    await pollSaveDuringGame();
    toggleCellsListener();
    universalButton.addEventListener("click", universalButtonToggle); // should not be null
}

async function pollCoinFlipResult(){
    coinSync = setInterval(async () => {
        const response = await fetch ("http://127.0.0.1:8080/State") // listen on the server not the browser port
        const jData = await response.json();
        currentGameState = jData; // copy the server token to the local token

        if(currentGameState.coinTossOver){
            // Both players have flipped, no need to flip again
            clearInterval(coinSync);
            setUniversalButtonContent("Clear");
            await pollSaveDuringGame(); 
            toggleCellsListener();
            universalButton.addEventListener("click", universalButtonToggle); // should not be null
        }
    }, 50);

    console.log("Polling for coin flip results...");
}

/**
 * checks if a win condition is met by compring all combinations in winConditions
 * if a win is found, highlights the winning cells and returns true to checkwinner ends the game
 * @param {number[]} tempOptions
 * @returns {number|boolean} - returns a best option vaie for machine move or returns true for a win condition
 * if no win condition returnvalue is init to zero so binary false 
 * @sideEffects - If isComputer is false and a win is found, modifies cell text color to red.
 */
async function checkForFourInARow(thisOptions){
    let returnValue = 0;

    for(let i = 0; i < winConditions.length/*15*/; i++){

        // so if condition is winConditions at index [0] it would be [0,1,2]
        // lets just say the options are all still empty " "
        // that would mean the new 3 element array, conditions, is empty at all indexes
        // that would mean that cellA cellb and cellC are empty as well because they are initialized to the value of the option array at ....
        // the value of the 3 element condition array and in this examplew would be [0,1,2] but could be [0,4,8] etc

        const condition = winConditions[i];
        const cellA = thisOptions[condition[0]];
        const cellB = thisOptions[condition[1]];
        const cellC = thisOptions[condition[2]];
        const cellD = thisOptions[condition[3]]; // added for 4 in a row

        if(cellA == cellB && cellB == cellC && cellC == cellD && cellA !== ""){
            if(cellA == "" || cellB == "" || cellC == "" || cellD == ""){
                continue;  // double final check
            }
            changeWinnerColors(condition); // change the color of the winning cells to red
            currentGameState.winCondition = condition; // set the win condition to the current condition
            currentGameState.winner = currentGameState.currentPlayer; // set the winner in the current game state
            console.log("Save from checkForFourInARow: ", currentGameState);
            await safeSaveGameState(currentGameState); 
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
async function checkWinner(){
    let roundWon = false;
    roundWon = await checkForFourInARow(currentGameState.board);

    if(roundWon){
        running = false;

        // Assign "O" to winner and "X" to loser
        if(playerOne && (currentGameState.winner !== "O")){
            currentGameState.isPlayerOne[1] = "O";
            currentGameState.isPlayerTwo[1] = "X";
        }
        else if (playerTwo && (currentGameState.winner !== "O")){
            currentGameState.isPlayerTwo[1] = "O";
            currentGameState.isPlayerOne[1] = "X";
        }
        await safeSaveGameState(currentGameState); // save the game state to the server
    }
    else if(!currentGameState.board.includes("")){
        displayDrawMessage(); // call the displayDrawMessage function to display the draw message
        running = false;
        console.log("save from check winner, draw: ", currentGameState);
        await safeSaveGameState(currentGameState); // save the game state to the server
    }
    else if((playerOne && currentGameState.isPlayerOne[1] === currentGameState.currentPlayer) || (playerTwo && currentGameState.isPlayerTwo[1] === currentGameState.currentPlayer)){
        await changePlayer();
    }
}


/**
 * is called after a move is made by a player and toggles the current player between "x" and "O"
 * @sideEffects - updates global game state (currentPlayer)
 */
async function changePlayer(){

    currentGameState.currentPlayer = currentGameState.currentPlayer === "O" ? "X" : "O";
    await safeSaveGameState(currentGameState); // save the game state to the server
}


/**
 * clears intervals and resets the game state to allow for a new game
 * also resets the cells and status text
 * as well as updating the file game state with the file picker and changing running to false 
 */
async function restartGame(){
    running = false; // set running to false so that the game is not running anymore
    setUniversalButtonContent("Start"); 
    // this is here just in case some one end the game early 
    clearInterval(syncSave); // clear the interval to stop and to stop status context updates
   
    restartStatusAndCells(); // This calls the message to display no winner AND OR clears the cells
    if (!currentGameState.forfeit) {
        displayLastWinnerMessage();
    }
    toggleCellsListener(); // make cells unclickable

    //reinitialize the game state to the file system
    currentGameState.board = Array(16).fill("");
    currentGameState.winCondition = null;
    await safeSaveGameState(currentGameState);
    console.log("game state after restart: ", currentGameState);
}

/**
 * tests connection to the server by fetching the servers root URL
 */
async function initGameState_Fetch(){
    await fetch("http://127.0.0.1:8080")
    .then(response => response.text())
    .then(data => {
        console.log("Server message:", data); 
    })
    .catch(error => {
        console.error("Fetch failed:", error);  
    });
}

/**
 * handles posting the game state to the server safely by using a client-side lock, similar to a mutex
 * 
 * This prevents race conditions where a periodic GET request.... running on an interval
 * could overlap with a POST request and fetch incomplete or stale data.
 * The function toggles isWriting to true, delays briefly to allow any active GET
 * loops to skip, performs the POST, and then unlocks by setting isWriting to false
 * @param {Object} state - The game state object to be sent to the server
 * @returns {void} Resolves once the POST is completed and the lock is cleared
 */
async function safeSaveGameState(state){

    console.log("Saving game state for the player:")
    isWriting = true;                           // lock
    // await sleep(200);                           // give the GET interval a chance to skip
    await post_GameState(state);                // POST
    isWriting = false;                          // unlock
}

/**
 * UPDATED ON 07.19.2025
 * RegisterPlayer did not exist as a function; using safeSaveGameState, which -->
 * --> looks like it should do the same exact thing.
 * ORIGINAL FUNCTION: Assign players depending on the order of connection to the server
 */
//  async function assignPlayerID(){
//     if(firstGame){
//         // Ensure Player One is initialized properly and doesn't crash the program
//         if(!Array.isArray(currentGameState.isPlayerOne)){
//             currentGameState.isPlayerOne = [false, ""];
//         }
//         // Ensure Player Two is initialized properly and doesn't crash the program
//         if(!Array.isArray(currentGameState.isPlayerTwo)){
//             currentGameState.isPlayerTwo = [false, ""];
//         }

//         if(!currentGameState.isPlayerOne[0]){
//             currentGameState.isPlayerOne[0] = true;  // Initializes Player One
//             playerOne = true;
//             console.log("Player One has been set to: " + currentGameState.isPlayerOne[0]);
//         }
//         else if(!currentGameState.isPlayerTwo[0]){
//             currentGameState.isPlayerTwo[0] = true;
//             playerTwo = true;
//             console.log("Player Two has been set to: " + currentGameState.isPlayerTwo[0]);
//         }
//         else{
//             alert("Both players have already been assigned. Please start a new game to make a new player assignment.");
//             return;
//         }
//         await safeSaveGameState(currentGameState);
//         firstGame = false;
//     }
//  }

/**
 * assign Player One and Player Two depending on the order of connection to the server
 */
async function getPlayerIdFetch(){
    const response = await fetch("http://127.0.0.1:8080/register", {
        method: "POST"
    });
    const data = await response.json();
    if (data.error === 'wait') {
        console.log("Waiting for player assignment...");
        sleep(1000);
        window.location.reload(); // reload the page to wait for player assignment
    }
    else if (data.player === 'one') {
        playerOne = true;
        currentGameState.isPlayerOne[0] = true; // set player one to true
    }
    else if (data.player === 'two') {
        playerTwo = true;
        currentGameState.isPlayerTwo[0] = true; // set player two to true
    }
    else {
        alert("Both players already assigned.");
    }
    firstGame = false; // set first game to false so that the game can continue
}

/**
 * Updates the state of the game using POST request to the server.
 * This function sends the current game state to the server, allowing it to be saved or processed.
 * @param {Object} state - The game state object to be sent to the server.
 * @returns {void} Resolves once the POST is completed and the lock is cleared.
 */
async function post_GameState(state){ 
    fetch("http://127.0.0.1:8080/State", { // listen on the server not the browser port
        method : "POST", 
        headers:{
            'content-type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(state, null, 2) // extra params to format the JSON data
    })
    .then(response => response.text())
    .then(data => {
        console.log("Server message:", data); 
    })
    .catch(error => {
        console.error("Fetch failed:", error);  
    });
}

/**
 * Fetches the current game state from the server.
 * This function retrieves the game state from the server and updates the local game state.
 * can be called periodically within an inteval to update local game state
 */
async function getFetch_GameState(){
    // console.log("fetching game state from server");
    const response = await fetch ("http://127.0.0.1:8080/State") // listen on the server not the browser port
    const jData = await response.json();
    currentGameState = jData; // copy the server token to the local token
}


/**
 * Fetches the current game state from the server.
 * the server response will also reset the server game state for starting a new game and return this state
 */
async function getFetch_NewGame(){
    // console.log("fetching game state from server");
    const response = await fetch ("http://127.0.0.1:8080/NewGame") // listen on the server not the browser port
    const jData = await response.json();
    currentGameState = jData; // copy the server token to the local token
}

/**
 * creates a delay used to pause logic for a set amount of milli seconds
 * @param {number} ms - the number of milli seconds to delay
 * @returns {Promise} 
 */
function sleep(ms){
    return new Promise(resolve =>setTimeout(resolve, ms)); // https://youtu.be/pw_abLxr4PI?si=Tlfw1HBU92o0wX3B
}
