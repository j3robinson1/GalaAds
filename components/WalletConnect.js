import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserConnectClient } from '@gala-chain/connect';
import { useWallet } from '../context/WalletContext'; // Adjust path as necessary

const WalletConnect = ({ onConnect }) => {
  const [isRegistered, setIsRegistered] = useState(false);
  const { walletAddress, setWalletAddress, metamaskClient, setMetamaskClient } = useWallet();

  useEffect(() => {
    const client = new BrowserConnectClient();
    setMetamaskClient(client);
  }, []);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await metamaskClient.connect();
        let address = await metamaskClient.ethereumAddress;
        if (address.startsWith('0x')) {
          address = `eth|${address.slice(2)}`;
        }
        setWalletAddress(address);
        onConnect(address, true, metamaskClient);
        await checkRegistration(address);
      } catch (err) {
        console.error('Error connecting wallet:', err);
        onConnect('', false, null);
      }
    }
  };

  const checkRegistration = async (address) => {
    if (!address) return;
    try {
      const response = await getAlias(address);
      if (response.data.Data && response.data.Data.alias) {
        setIsRegistered(true);
        setWalletAddress(response.data.Data.alias); // Use the alias if available
        onConnect(response.data.Data.alias, true, metamaskClient); // Update the onConnect call with the alias
      } else {
        setIsRegistered(false);
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.log('Object not found, trying again...');
        await checkRegistration(address); // Retry logic
      } else {
        console.error('Check registration error:', err);
        setIsRegistered(false);
      }
    }
  };

  const getAlias = async (address) => {
    return await axios.post(`${process.env.NEXT_PUBLIC_BURN_GATEWAY_PUBLIC_KEY_API}/GetObjectByKey`, {
      objectId: `\u0000GCUP\u0000${address.replace('0x', '').replace('eth|', '')}\u0000`,
    });
  };

  const registerUser = async () => {
    if (!walletAddress) return;
    try {
      const publicKey = await metamaskClient.getPublicKey();
      const response = await axios.post(`${process.env.NEXT_PUBLIC_GALASWAP_API}/CreateHeadlessWallet`, {
        publicKey: publicKey.publicKey
      });
      setIsRegistered(true);
    } catch (err) {
      console.error('Error registering user:', err);
      setIsRegistered(false);
    }
  };

  return (
    <div className="wallet-connect">
      {!walletAddress ? (
        <button onClick={connectWallet} className="button">Connect Wallet</button>
      ) : (
        <div>
          <p className="wallet-address">Connected: {walletAddress}</p>
          {!isRegistered && <button onClick={registerUser} className="button">Register</button>}
        </div>
      )}
    </div>
  );
};

export default WalletConnect;
