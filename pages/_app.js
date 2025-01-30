import React from 'react';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import { WalletProvider } from '../context/WalletContext'; // Adjust path as necessary
import '../styles/styles.css';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const isAdFramePage = router.pathname === '/adFrame';

  return (
    <WalletProvider>
      <div className="container">
        {!isAdFramePage && <Header />}
        <Component {...pageProps} />
      </div>
    </WalletProvider>
  );
}

export default MyApp;
