import React, { useState, useEffect } from 'react';

const Balance = ({ walletAddress }) => {
  const [availableBalance, setAvailableBalance] = useState(0);
  const [lockedBalance, setLockedBalance] = useState(0);

  const fetchBalance = async () => {
    if (!walletAddress) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BURN_GATEWAY_API}/FetchBalances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: walletAddress,
          collection: "GALA",
          category: "Unit",
          type: "none",
          additionalKey: "none",
          instance: "0"
        })
      });
      
      const data = await response.json();
      if (data.Data.length > 0) {
        const total = parseFloat(data.Data[0].quantity);
        const locked = data.Data[0].lockedHolds.reduce((acc, hold) => acc + parseFloat(hold.quantity), 0);
        setLockedBalance(locked);
        setAvailableBalance(total - locked);
      }
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  const formatBalance = (balance) => {
    return balance.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  useEffect(() => {
    fetchBalance();
  }, [walletAddress]);

  return (
    <div className="balance-container">
      <h2>GALA Balance</h2>
      <div className="balance-info">
        <p>Available: {formatBalance(availableBalance)} GALA</p>
        {lockedBalance > 0 && <p>Locked: {formatBalance(lockedBalance)} GALA</p>}
      </div>
      <button onClick={fetchBalance}>Refresh</button>
    </div>
  );
};

export default Balance;
