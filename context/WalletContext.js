import React, { createContext, useState, useContext } from 'react';

const WalletContext = createContext(null);

export const useWallet = () => useContext(WalletContext);

export const WalletProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState('');
  const [metamaskClient, setMetamaskClient] = useState(null);

  const value = {
    walletAddress,
    setWalletAddress,
    metamaskClient,
    setMetamaskClient,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
