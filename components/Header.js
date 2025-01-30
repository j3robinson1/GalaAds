import React from 'react';
import Link from 'next/link';
import WalletConnect from './WalletConnect'; // Adjust path as necessary

function Header() {
  return (
    <header>
      <nav>
        <ul style={{ display: 'flex', listStyle: 'none', margin: 0, padding: '10px', alignItems: 'center' }}>
          <li style={{ flexGrow: 1 }}>
            <Link href="/">All Ads</Link>
            <Link href="/createAd">Create Ad</Link>
            <Link href="/myAds">My Ads</Link>
            <Link href="/earn">Earn</Link>
          </li>
          <li>
            <WalletConnect onConnect={(address, isConnected, client) => {
              console.log('Wallet connected:', address, 'Is connected:', isConnected);
            }} />
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
