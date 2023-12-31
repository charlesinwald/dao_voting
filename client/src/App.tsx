import React, { ChangeEvent, useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { useSDK } from '@metamask/sdk-react';
import { BACKEND_URL } from './const';

interface Proposal {
  svg: string;
  yesVotes: number;
  noVotes: number;
  isExecuted: boolean;
}

function App() {
  const [account, setAccount] = useState<string>();
  const [joined, setJoined] = useState<boolean>(false);
  const [svgData, setSvgData] = useState<string>("");
  const [invalidSvg, setInvalidSvg] = useState<boolean>(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [fileName, setFileName] = useState("");


  const { sdk, connected, connecting, provider, chainId } = useSDK();

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "image/svg+xml") {
      const reader = new FileReader();
      reader.onload = function(event) {
        setSvgData(event.target?.result as string);
      };
      reader.readAsText(file);
      setFileName(file.name);
    }
  };

  const validateAndSetSvg = (data: string) => {
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

  const castVote = async (proposalIndex: number, vote: boolean) => {
    try {
      const res = await fetch(`${BACKEND_URL}/vote`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ proposalId: proposalIndex, vote, voterAddress: account })
      });
      const data = await res.json();
      console.log("Transaction Hash:", data.transactionHash);
      if (data.transactionHash) {
        getAllProposals();
      }
    } catch (error) {
      console.error("Error:", error);
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
        getAllProposals();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const getAllProposals = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/getAllProposals`, {
        method: 'GET',
        headers: {'Content-Type': 'application/json'}
      });
      const data = await res.json();
      console.log("Proposals:", data);
      if (data && data.proposals) {
        setProposals(data.proposals);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }

  useEffect(() => {
    if (account) {
      try {
        getAllProposals();
      }
      catch (err) {
        console.error("Error:", err);
      }
    }
  }, [account, joined])

  useEffect(() => {
    connect();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <div className="App-link">
          <h3>LogoDAO</h3>
          {!account ?
            <button className="connect-button" onClick={connect} disabled={connecting}>Connect with MetaMask</button> :
            <p className="connected-account">{`Connected Account: ${account}`}</p>
          }
          {!account && <p >Make sure you are signed into MetaMask before trying to connect!</p>}
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
          {invalidSvg && <p className="invalid-svg">Invalid SVG!</p>}
          <p>OR</p>
          <div className="file-upload">
          <label htmlFor="file-upload" className="file-upload-label upload-button">
            <i className="upload-icon">📤</i> Upload SVG
          </label>
          <input
            id="file-upload"
            type="file"
            className="file-input-hidden"
            accept="image/svg+xml"
            onChange={handleFileUpload}
          />
          <span className="file-name">
            {fileName ? fileName : "No file chosen"}
          </span>
        </div>
          {svgData && <div className="preview-section">
            {!invalidSvg && <p>SVG Preview</p>}
            {!invalidSvg && <div dangerouslySetInnerHTML={{ __html: svgData }} />}
          </div>}
          <button className="submit-button proposal-button" onClick={createProposal} disabled={!svgData || invalidSvg}>
            {svgData && invalidSvg && <i className="proposal-icon">✅</i>} Submit Proposal
          </button>
        {proposals && <div className="proposal-gallery">
        <h3>Proposal Gallery</h3>
        <div className="gallery-grid">
          {proposals?.sort((a, b) => {
            const aRatio = a.yesVotes - a.noVotes;
            const bRatio = b.yesVotes - b.noVotes;
            return bRatio - aRatio;
          }).map((proposal, index) => (
            <div key={index} className="proposal-card">

              <div className="scalable-svg" dangerouslySetInnerHTML={{ __html: proposal.svg }} />
              <div className="proposal-meta">
              <button className="vote-button" onClick={() => castVote(index, false)}>👎</button>
              <div className="vote-count">
                <p>Yes Votes: {proposal.yesVotes}</p>
                <p>No Votes: {proposal.noVotes}</p>
                <p>Is Executed: {proposal.isExecuted ? 'Yes' : 'No'}</p>
              </div>
              {/* <div className="vote-buttons"> */}
                <button className="vote-button" onClick={() => castVote(index, true)}>👍</button>
              {/* </div> */}
            </div>
            </div>
          ))}
        </div>
      </div>}
        </div>}
      </header>
    </div>
  );
}

export default App;
