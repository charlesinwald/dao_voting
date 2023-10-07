import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { useSDK } from '@metamask/sdk-react';
import { BACKEND_URL } from './const';

function App() {
  const [account, setAccount] = useState<string>();
  const [joined, setJoined] = useState<boolean>(false);
  const [svgData, setSvgData] = useState<string>("");
  const { sdk, connected, connecting, provider, chainId } = useSDK();

  const connect = async () => {
    try {
      const accounts = await sdk?.connect();
      console.log(`connected accounts:`, accounts);
      // @ts-ignore
      setAccount(accounts?.[0]);
    } catch(err) {
      console.warn(`failed to connect..`, err);
    }
  };

  const joinDAO = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/addVoter`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ voterAddress: account })
      });
      const data = await res.json();
      console.log("Transaction Hash:", data.transactionHash);
      if (data.transactionHash) {
        setJoined(true);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const createProposal = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/createProposal`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ svg: svgData })
      });
      const data = await res.json();
      console.log("Transaction Hash:", data.transactionHash);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    connect();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <div
          className="App-link"
        >
          {!account ?
            <button onClick={connect} disabled={connecting}>Connect with MetaMask</button> :
            <h3>{`Connected Account: ${account}`}</h3>
          }
          {account && !joined && <button onClick={joinDAO}>Join DAO</button>}
          {joined && <p>Joined DAO!</p>}
        </div>
        {joined && <div>
          <h3>Create a Proposal</h3>
          <textarea
            placeholder="Enter your SVG here"
            value={svgData}
            onChange={(e) => setSvgData(e.target.value)}
          />
          <button onClick={createProposal}>Submit Proposal</button>
        </div>}
      </header>
    </div>
  );
}

export default App;
