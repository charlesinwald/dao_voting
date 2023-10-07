import React, { ChangeEvent, useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { useSDK } from '@metamask/sdk-react';
import { BACKEND_URL } from './const';

function App() {
  const [account, setAccount] = useState<string>();
  const [joined, setJoined] = useState<boolean>(false);
  const [svgData, setSvgData] = useState<string>("");
  const [invalidSvg, setInvalidSvg] = useState<boolean>(false);

  const { sdk, connected, connecting, provider, chainId } = useSDK();

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "image/svg+xml") {
      const reader = new FileReader();
      reader.onload = function(event) {
        setSvgData(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const validateAndSetSvg = (data: string) => {
    // Here you can put logic to validate the SVG data
    // For now, let's just check if it starts with '<svg'
    if (data.trim().startsWith('<svg')) {
      setInvalidSvg(false);
      setSvgData(data);
    } else {
      setInvalidSvg(true);
    }
  };

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
      if (data.transactionHash) {
        setSvgData("");
      }
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
        <div className="App-link">
          {!account ?
            <button className="connect-button" onClick={connect} disabled={connecting}>Connect with MetaMask</button> :
            <p className="connected-account">{`Connected Account: ${account}`}</p>
          }
          {account && !joined && <button className="join-button" onClick={joinDAO}>Join DAO</button>}
          {joined && <p className="joined-message">Joined DAO!</p>}
        </div>
        {joined && <div className="proposal-section">
          <h3>Create a Proposal</h3>
          <textarea
            className="svg-textarea"
            placeholder="Paste your SVG here"
            value={svgData}
            onChange={(e) => validateAndSetSvg(e.target.value)}
          />
          {svgData && <button className="clear-button" onClick={() => setSvgData("")}>Clear</button>}
          <button className="submit-button" onClick={createProposal}>Submit Proposal</button>
          {invalidSvg && <p className="invalid-svg">Invalid SVG!</p>}
          <input type="file" className="file-input" accept="image/svg+xml" onChange={handleFileUpload} />
          {svgData && <div className="preview-section">
            {!invalidSvg && <p>SVG Preview</p>}
            {!invalidSvg && <div dangerouslySetInnerHTML={{ __html: svgData }} />}
          </div>}
        </div>}
      </header>
    </div>
  );
}

export default App;
