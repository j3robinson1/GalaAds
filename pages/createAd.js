import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';

const CreateAd = () => {
  const { walletAddress, metamaskClient } = useWallet();
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [url, setUrl] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
      if (imageUrl) {
          handleImageLoad();
      }
  }, [imageUrl]);

  const handleImageLoad = () => {
      const img = new Image();
      img.onload = () => {
          setImageSize({ width: img.width, height: img.height });
          if (img.width !== 300 || img.height !== 170) {
              setMessage("Image must be exactly 300x170 pixels.");
          } else {
              setMessage("");
          }
      };
      img.onerror = () => {
          setMessage("Failed to load image. Check the URL and try again.");
      };
      img.src = imageUrl;
  };

  const isValidTransfer = () => {
    return transferAmount > 0;
  };

  const transferTokens = async () => {
    if (!isValidTransfer() || !walletAddress) {
      setMessage("Invalid transfer amount or wallet not connected.");
      return { success: false };
    }

    setLoading(true);
    setMessage('');

    try {
      const recipientAddress = 'eth|82CE0eD698Ecea715Ccf51E308c74d875CCaD215';
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

      if (!response.ok) throw new Error('Failed to transfer tokens');
      
      return { success: true, transferAmount };
    } catch (error) {
      setMessage(error.message);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (imageSize.width !== 300 || imageSize.height !== 170) {
      setMessage("Cannot submit: Image must be exactly 300x170 pixels.");
      return;
    }

    const transferResult = await transferTokens();
    if (!transferResult.success) return;

    try {
      const response = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content: imageUrl,
          user_wallet: walletAddress,
          url,
          boost_level: transferResult.transferAmount
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(`Ad created successfully with boost level: ${transferResult.transferAmount}`);
        setTitle('');
        setImageUrl('');
        setUrl('');
        setTransferAmount('');
      } else {
        setMessage(data.message || 'Failed to create ad');
      }
    } catch (error) {
      setMessage('Failed to create ad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="create-ad">
        <div className="ad-form-container">
          <div className="ad-form">
            <h1>Create an Ad</h1>
            <form onSubmit={handleSubmit}>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ad Title" required />
              <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL" required />
              <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Destination URL" required />
              <input type="number" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} placeholder="Amount to Transfer for Boost" required />
              <button type="submit" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Ad'}
              </button>
              <span style={{marginLeft: '10px'}}>Gas Fee: 1 GALA</span>
            </form>
            {message && <p>{message}</p>}
          </div>
          <div className="ad-preview">
            <div className="ad-preview-content">
              {imageUrl ? <img src={imageUrl} alt="Ad Preview" /> : <p>No image to display</p>}
            </div>
            <p>Clicks to: {url || 'Destination URL'}</p>
          </div>
        </div>
        <div className="ad-creation-instructions">
          <h2>How to Create and Boost Your Ad</h2>
          <p>Follow these steps to create and boost your ad:</p>
          <ol>
            <li><strong>Ad Title:</strong> Choose a concise and catchy title for your ad that clearly conveys the message of your campaign.</li>
            <li><strong>Image URL:</strong> Provide a URL to an image with recommended dimensions of 300x170 pixels to ensure it displays correctly on all devices.</li>
            <li><strong>Destination URL:</strong> Enter the URL where users should be redirected upon clicking your ad. Make sure this link is active and relevant to your ad content.</li>
            <li><strong>Boost Amount:</strong> Enter the amount of GALA you wish to transfer for boosting your ad. Note: A minimum boost amount is required to activate your ad. Boosting increases the visibility of your ad.</li>
          </ol>
          <p>Note: You need at least 1 GALA to cover the network fees associated with token transfers for ad boosting.</p>
        </div>
      </div>
      <style jsx>{`

        .create-ad {
          padding: 20px;
          max-width: 1200px;
          margin: 20px auto;
        }

        .ad-form-container {
          display: flex;
          justify-content: space-between;
          margin: 0px auto 40px auto;
        }

        .ad-form {
          flex: 1;
          margin-right: 20px;
        }

        .ad-form h1 {
          margin-left: .5%;
          margin-right: .5%;
          margin-top: 0px;
          margin-bottom: 1%;
        }

        .ad-form input {
          width: 47%;
          padding: 1%;
          margin: .5%;
          font-size: 16px;
          border-radius: 5px;
          border: none;
        }

        .ad-form button {
          cursor: pointer;
          margin: 0px;
          padding: 8.5px 15px;
          background: #535353;
          border-radius: 5px;
          border:  none;
          color:  white;
          margin-top: 1%;
          margin-left: .5%;
          margin-right: .5%;
        }

        .ad-preview {
          flex: 1;
          padding: 10px;
          background: linear-gradient(55deg, #353535, #353535 50%, #444444 80%, #353535);
          border-radius: 10px;
          max-width: 300px;
        }

        .ad-preview-content {
          max-height: 170px;
          max-width: 300px;
          overflow: hidden;
        }

        .ad-preview img {
          width: 100%;
          height: auto;
          border-radius: 5px;
        }

        .ad-preview p {
          margin-top: 7px;
          margin-bottom: 0px;
        }

        .ad-creation-instructions {
          background: linear-gradient(55deg, #353535, #353535 50%, #444444 80%, #353535);
          padding: 20px;
          border-radius: 8px;
          color: white;
        }

        .ad-creation-instructions ol {
          padding-left: 20px;
        }

      `}</style>
    </>
  );
};

export default CreateAd;
