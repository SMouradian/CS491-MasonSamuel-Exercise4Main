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
const startClearButton = document.querySelector("#universalButton"); // query select the button with id universalButton---------------------- change dom object name later 

const playerDiceRollGuessInput = document.querySelector("#diceInputContainer"); // query select the input for the dice roll guess
const rollDiceButton = document.querySelector("#RollDice"); // query select the button for rolling the dice

let serverGameState = {};
let localGameState = {}; 
let isWriting = false;
let DoOnce = true;

/**
 * @type {boolean} firstGame - used to determine if the game is being played for the first time
 * @type {boolean} running - used to determine if the game is running or not
 * @type {boolean} playerOne - used to determine if the player is player one or two
 * @type {boolean} playerTwo - used to determine if the player is player one or tw
 * @type {boolean} bothPlayersHaveGuessed - used to determine if both players have guessed
 * @type {boolean} playerHasMoved - used to determine which player can move
 */
let running = false; // used to determine if the game is running or not
let playerOne = false; // used to determine if the player is player one or two
let playerTwo = false; // used to determine if the player is player one or two
let bothPlayersHaveGuessed = false; // used to determine if both players have guessed
let playerHasMoved = false; // used to determine which player can move 

/*************************************************************************************************************************************************** */

displayStartMessage();

// Initialize the game and show connection screen
// test connection to the server, then fetch the current game state that has been saved on the server. Should be null
// assign player one or two depending on the order of connection to the server
(async () => {
    try {
        // Show the connection screen and hide the game UI 
        document.querySelector(".gameContainer").style.display = "none";
        document.querySelector(".button-row-container").style.display = "none";
        document.getElementById("ConnectionScreen").style.display = "flex";

        // try fetch game state from the server 
        await sleep(2000);
        await getFetch_GameState(); // fetch the game state from the server to init serverGameState
        await assignPlayerID(); // assign player one or two, calls register player // DO ONCE
        await testConnectionToServer(); // test the connection to the server

        // hide the connection screen and show the game UI
        document.getElementById("ConnectionScreen").remove();
        document.querySelector(".gameContainer").style.display = "flex";
        document.querySelector(".button-row-container").style.display = "flex";

    } catch (error) {

        await sleep(1000);

        console.error("Connection failed:", error);
        document.getElementById("ConnectionScreen").innerHTML = `<h1>Connection Failed. Refresh the page</h1>`;
    }

    // Interval loop to fetch game state
    setInterval(async () => {
        if (isWriting) return; // skip if we’re currently writing
        await getFetch_GameState();
    }, 500); // poll every second

})();

/**
 * tests connection to the server by fetching the servers root URL
 */
async function testConnectionToServer() 
{
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
async function safeSaveGameState(state) {
    isWriting = true;                           // lock
    await sleep(550);                           // give the GET interval a chance to skip
    await post_GameState(state);                // do your POST
    isWriting = false;                          // unlock
}

/**
 * assign Player One and Player Two depending on the order of connection to the server
 * @returns {void} - displays a start message to the user
 */
async function assignPlayerID() {
    if (DoOnce) {
        // check if the current game state has player one or player two assigned
        if (!serverGameState.isPlayerOne[0]) {
            serverGameState.isPlayerOne[0] = true;
            playerOne = true; 
            // await RegisterPlayer(serverGameState); // post the game state to the server
            console.log("playerOne set to " + serverGameState.isPlayerOne[0]);

        } else if (!serverGameState.isPlayerTwo[0]) {
            serverGameState.isPlayerTwo[0] = true;
            playerTwo = true; 
            // await RegisterPlayer(serverGameState); // post the game state to the server/
            console.log("playerTwo set to " + serverGameState.isPlayerTwo[0]);

        } else {
            alert("Both players are already assigned. Please refresh the page to start a new game.");
            // window.location.reload(); // close the window if both players are already assigned
            return;
        }

        await RegisterPlayer(serverGameState); // post the game state to the server

        DoOnce = false;
    }
}

/**
 * Updates the state of the game using POST request to the server.
 * This function sends the current game state to the server, allowing it to be saved or processed.
 * @param {Object} state - The game state object to be sent to the server.
 * @returns {void} Resolves once the POST is completed and the lock is cleared.
 */
async function post_GameState(state) 
{
    
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
 * Registers a player with the server by sending the initial game state.
 * init the server with information about the player as they are connected to the server!
 * @param {Object} state - The game state object to be sent to the server.
 * @returns {void} Resolves once the POST is completed and the lock is cleared.
 */
async function RegisterPlayer(state) 
{
    fetch("http://127.0.0.1:8080/InitState", { // listen on the server not the browser port
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
async function getFetch_GameState()
{
    console.log("fetching game state from server");

    const response = await fetch ("http://127.0.0.1:8080/State") // listen on the server not the browser port
    const jData = await response.json();
    serverGameState = jData; // copy the server token to the local token
}

/**
 * creates a delay used to pause logic for a set amount of milli seconds
 * @param {number} ms - the number of milli seconds to delay
 * @returns {Promise} 
 */
function sleep(ms) {
    return new Promise(resolve =>setTimeout(resolve, ms)); // https://youtu.be/pw_abLxr4PI?si=Tlfw1HBU92o0wX3B
}
