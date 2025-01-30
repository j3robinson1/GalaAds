import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext'; // Adjust path as necessary

const BurnGala = () => {
  const [burnAmount, setBurnAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { walletAddress, metamaskClient } = useWallet();

  const isValidAmount = () => {
    return burnAmount > 0;
  };

  const burnTokens = async () => {
    if (!isValidAmount() || !walletAddress) return;

    setError('');
    setSuccess('');
    setIsProcessing(true);

    try {
      const burnTokensDto = {
        owner: walletAddress,
        tokenInstances: [{
          quantity: burnAmount.toString(),
          tokenInstanceKey: {
            collection: "GALA",
            category: "Unit",
            type: "none",
            additionalKey: "none",
            instance: "0"
          }
        }],
        uniqueKey: `january-2025-event-${process.env.NEXT_PUBLIC_PROJECT_ID}-${Date.now()}`
      };

      const signedBurnDto = await metamaskClient.sign("BurnTokens", burnTokensDto);

      const response = await fetch(`${process.env.NEXT_PUBLIC_BURN_GATEWAY_API}/BurnTokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signedBurnDto)
      });

      if (!response.ok) {
        throw new Error('Failed to burn tokens');
      }

      setSuccess(`Successfully burned ${burnAmount} GALA`);
      setBurnAmount('');
    } catch (err) {
      console.error(`Error burning tokens: ${err}`, err);
      setError(err instanceof Error ? err.message : 'Failed to burn tokens');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="burn-container">
      <h2>Burn GALA</h2>
      
      <div className="burn-form">
        <div className="input-group">
          <input 
            type="number" 
            value={burnAmount}
            onChange={(e) => setBurnAmount(e.target.value)}
            min="0"
            step="1"
            placeholder="Amount to burn"
            disabled={isProcessing}
          />
          <span className="currency">GALA</span>
        </div>
        <small className="fee-notice">Network fee: 1 GALA</small>

        <button 
          onClick={burnTokens} 
          disabled={!isValidAmount() || isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Burn Tokens'}
        </button>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
      </div>
    </div>
  );
};

export default BurnGala;
