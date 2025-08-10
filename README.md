
#Please Read Me

When hosting the server inside a Codespace, you must update all `fetch()` calls in `gameClient.js` to use **your Codespace URL**.

Example:
```javascript
fetch("http://musical-spoon-pvq96jv57473694j-8080.app.github.dev/State");
```

This URL points to a previously used Codespace. You must replace everything between "http://" and "/State" with your own Codespace address after starting the Express server inside your Codespace.

# Setup Instructions

## Running the Code in Codespaces

- PRESS 'r' TO RESET SERVER
- Open the terminal (`Ctrl + \``)
- Start the server with:
  ```
  node SERVER/express.js
  ```
- Set the port visibility to **public** (option is to the right of the terminal tab)
- Codespaces will prompt you to open a new browser tab for the server
- Compare the active server URL to the fetch URL in your code:

## Install Node.js Dependencies

Run the following commands in your terminal:

```
npm init -y
npm install express
npm install cors
```

This installs Express and creates the `package.json` file.  
Note: `npm i express` and `npm install express` do the same thing — you only need one.

---




[Github io web page](https://masonhaines.github.io/CS491-MasonSamuel-Exercise4Main/)
