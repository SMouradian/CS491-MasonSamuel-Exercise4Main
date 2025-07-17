// Mason Haines & Samuel Mouradian 7/9/2025

const express = require('express');
const fs = require('fs');
const cors = require('cors'); // import CORS for cross-origin requests
const path = require('path');


const app = express();
app.use(express.json());
app.use(cors()); // enable CORS for all routes
const PORT = process.env.PORT || 8080;

const gameSavePath = path.join(__dirname, 'gameState.json');
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the 'public' directory


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
})

 // Request to server from client for some data 
 // app.get("URL",(req,res)=>{})
app.get("/State", (request, response) => {
    const jData = fs.readFileSync(gameSavePath); // Read the gameState.json file
    const stateData = JSON.parse(jData); // Parse the JSON data to js object 

    // console.log("GET Request Successfull!");
    response.json(stateData);
	
})

app.post("/State", (request, response) => {
    fs.writeFileSync(gameSavePath, JSON.stringify(request.body, null, 2)); // Write the request body to state.json

	// console.log("state POST REQUEST SUCCESSFUL" + request.body);
    console.log(`PINGED from ${request.body.user};`);
	response.send(`PINGED from ${request.body.user};`);
})

app.post("/InitState", (request, response) => {
    fs.writeFileSync(gameSavePath, JSON.stringify(request.body, null, 2)); // Write the request body to state.json

	// console.log("TEMPstate POST REQUEST SUCCESSFUL" + request.body);
	// response.send(`temp loaded to state ${request.body.user};`);
})

app.get("/", (request, response) => {
    console.log("new Browser connected.");
    response.send("Browser Connected... at " + PORT);
});

function resetJSON() {
    const nullState = { user: null, browser: null, canPing: null };
    fs.writeFileSync(gameSavePath, JSON.stringify(nullState, null, 2));
    console.log('data.json has been reset.');
}

process.on('SIGINT', () => {
    resetJSON();
    process.exit();
});