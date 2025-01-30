import React, { useState } from 'react';

const TransferGala = ({ walletAddress, metamaskClient }) => {
  const [recipientAddress, setRecipientAddress] = useState('');
  const [transferAmount, setTransferAmount] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isValidTransfer = () => {
    return recipientAddress &&
           (recipientAddress.startsWith('client|') || recipientAddress.startsWith('eth|')) &&
           transferAmount !== null &&
           transferAmount > 0 &&
           recipientAddress.toLowerCase() !== walletAddress.toLowerCase();
  };

  const transferTokens = async () => {
    if (!isValidTransfer() || !walletAddress) return;

    setError('');
    setSuccess('');
    setIsProcessing(true);

    try {
      const transferTokensDto = {
        from: walletAddress,
        to: recipientAddress,
        quantity: transferAmount.toString(),
        tokenInstance: {
          collection: "GALA",
          category: "Unit",
          type: "none",
          additionalKey: "none",
          instance: "0"
        },
        uniqueKey: `january-2025-event-${process.env.NEXT_PUBLIC_PROJECT_ID}-${Date.now()}`
      };

      const signedTransferDto = await metamaskClient.sign("TransferTokens", transferTokensDto);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BURN_GATEWAY_API}/TransferToken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signedTransferDto)
      });

      if (!response.ok) {
        throw new Error('Failed to transfer tokens');
      }

      setSuccess(`Successfully transferred ${transferAmount} GALA to ${recipientAddress}`);
      setTransferAmount(null);
      setRecipientAddress('');
    } catch (err) {
      console.error(`Error transferring tokens: ${err}`, err);
      setError(err instanceof Error ? err.message : 'Failed to transfer tokens');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="transfer-gala-container">
      <h2>Transfer GALA</h2>
      <div className="transfer-form">
        <div className="input-group">
          <input
            type="text"
            value={recipientAddress}
            onChange={e => setRecipientAddress(e.target.value)}
            placeholder="Recipient Address (client|... or eth|...)"
            disabled={isProcessing}
          />
        </div>
        <div className="input-group">
          <input
            type="number"
            value={transferAmount || ''}
            onChange={e => setTransferAmount(Number(e.target.value))}
            min="0"
            step="1"
            placeholder="Amount to transfer"
            disabled={isProcessing}
          />
          <span className="currency">GALA</span>
        </div>
        <small className="fee-notice">Network fee: 1 GALA</small>
        <button 
          onClick={transferTokens} 
          disabled={!isValidTransfer() || isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Transfer Tokens'}
        </button>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
      </div>
    </div>
  );
};

export default TransferGala;
