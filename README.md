LogoDAO
Vote on your favorite logo

Requirements
Node.js and npm: [Download and Install](https://nodejs.org/en/download/)

Git: [Download and Install](https://git-scm.com/downloads)

Truffle: Install via npm by running

```npm install -g truffle```

Ganache: [Download and Install](https://www.trufflesuite.com/ganache)

Installation Steps

First, clone the repository to your local machine. Open your terminal and run:

```git clone https://github.com/charlesinwald/dao_voting.git```

Navigate into your project directory:

```cd dao_voting```

Install all necessary npm packages:

```npm install```

Run Ganache to start your local Ethereum blockchain. You can either use the Ganache GUI or run it via the command line:

  ```npx ganache-cli```

 Compile and Migrate Smart Contracts

In a new terminal window, navigate to your project directory and compile your smart contracts:

```npx truffle develop```

Now, enter the server directory and start the backend

```cd server; npm start```
The backend should be running on http://localhost:3000

# Frontend
In a new terminal, navigate to the client folder:

```cd client```

Install the React client dependencies:

```npm install```
Now, start the React client:

```npm start```

It should warn that port 3000 is already in use, hit yes.
The React client should now be running on http://localhost:3001. Open your web browser and navigate to the URL to interact with your application.

Troubleshooting
If you encounter issues with contract migration, try resetting your local blockchain and redeploying the contracts. In the "truffle develop" tab enter

```migrate --reset```

Make sure Ganache is running and set to the correct port (default is 8545).

If you've changed the smart contracts, remember to compile and migrate again.

