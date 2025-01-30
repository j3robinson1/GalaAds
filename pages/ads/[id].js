import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useWallet } from '../../context/WalletContext';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const AdDetail = () => {
  const { walletAddress, metamaskClient } = useWallet();
  const [ad, setAd] = useState(null);
  const [boostAmount, setBoostAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activityData, setActivityData] = useState({});
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    const fetchAd = async () => {
      const res = await fetch(`/api/ads/${id}`);
      const data = await res.json();
      setAd(data.ad);
    };

    const fetchActivities = async () => {
      if (id) {
        const response = await fetch(`/api/adActivity/${id}`);
        const data = await response.json();
        setActivityData(data);
      }
    };

    if (id) {
      fetchAd();
      fetchActivities();
    }
  }, [id]);

  const chartData = {
    labels: activityData.data?.map(entry => entry.date),
    datasets: [
      {
        label: 'Views',
        data: activityData.data?.map(entry => entry.views),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        yAxisID: 'yViews', 
      },
      {
        label: 'Clicks',
        data: activityData.data?.map(entry => entry.clicks),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        yAxisID: 'yClicks', 
      },
    ],
  };

  const calculateMaxYAxis = (clicksData) => {
    const safeClicksData = clicksData || [];
    const maxClicks = Math.max(...safeClicksData, 1);
    const maxY = Math.max(5, Math.ceil(maxClicks / 5) * 5);
    return maxY;
  };

  const chartOptions = {
    scales: {
      x: {
        ticks: {
          color: 'white'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      yViews: { 
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        ticks: {
          color: 'rgb(75, 192, 192)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      yClicks: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        suggestedMin: 0,
        max: calculateMaxYAxis(activityData.data?.map(entry => entry.clicks)),
        ticks: {
          stepSize: 1, 
          color: 'rgb(255, 99, 132)', 
        },
        grid: {
          drawOnChartArea: false,
        }
      },
    },
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'white'
        },
        position: 'top',
      },
      title: {
        display: true,
        text: 'Ad Activity Over Time',
        color: 'white'
      },
    },
  };

  const handleBoost = async () => {
    if (!boostAmount || boostAmount <= 0 || !walletAddress) {
      setMessage("Please enter a valid boost amount and make sure your wallet is connected.");
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const recipientAddress = 'eth|82CE0eD698Ecea715Ccf51E308c74d875CCaD215';
      const transferTokensDto = {
        from: walletAddress,
        to: recipientAddress,
        quantity: boostAmount.toString(),
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

      if (!response.ok) throw new Error('Failed to boost ad');

      await fetch(`/api/ads/${id}/boost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, boostAmount })
      });

      setAd({...ad, boost_level: parseFloat(ad.boost_level) + parseFloat(boostAmount)}); 
      setMessage('Ad successfully boosted!');
      setBoostAmount('');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {ad ? (
        <>
          <div className="ad-detail-container">
            <div className="ad-detail">
              <div className="ad-image">
                <img src={ad.content} alt={`Ad titled: ${ad.title}`} style={{ width: '100%', maxWidth: '300px', objectFit: 'cover' }} />
              </div>
              <div className="ad-info">
                <h1>{ad.title}</h1>
                <div className="stat">
                  <svg width="25px" height="25px" viewBox="-0.5 0 25 25" fill="none">
                    <path d="M12.8702 16.97V18.0701C12.8702 18.2478 12.7995 18.4181 12.6739 18.5437C12.5482 18.6694 12.3778 18.74 12.2001 18.74C12.0224 18.74 11.852 18.6694 11.7264 18.5437C11.6007 18.4181 11.5302 18.2478 11.5302 18.0701V16.9399C11.0867 16.8668 10.6625 16.7051 10.2828 16.4646C9.90316 16.2241 9.57575 15.9097 9.32013 15.54C9.21763 15.428 9.16061 15.2817 9.16016 15.1299C9.16006 15.0433 9.17753 14.9576 9.21155 14.8779C9.24557 14.7983 9.29545 14.7263 9.35809 14.6665C9.42074 14.6067 9.49484 14.5601 9.57599 14.5298C9.65713 14.4994 9.7436 14.4859 9.83014 14.49C9.91602 14.4895 10.0009 14.5081 10.0787 14.5444C10.1566 14.5807 10.2254 14.6338 10.2802 14.7C10.6 15.1178 11.0342 15.4338 11.5302 15.6099V13.0701C10.2002 12.5401 9.53015 11.77 9.53015 10.76C9.55019 10.2193 9.7627 9.70353 10.1294 9.30566C10.4961 8.9078 10.9929 8.65407 11.5302 8.59009V7.47998C11.5302 7.30229 11.6007 7.13175 11.7264 7.0061C11.852 6.88045 12.0224 6.81006 12.2001 6.81006C12.3778 6.81006 12.5482 6.88045 12.6739 7.0061C12.7995 7.13175 12.8702 7.30229 12.8702 7.47998V8.58008C13.2439 8.63767 13.6021 8.76992 13.9234 8.96924C14.2447 9.16856 14.5226 9.43077 14.7402 9.73999C14.8284 9.85568 14.8805 9.99471 14.8901 10.1399C14.8928 10.2256 14.8783 10.3111 14.8473 10.3911C14.8163 10.4711 14.7696 10.5439 14.7099 10.6055C14.6502 10.667 14.5787 10.7161 14.4998 10.7495C14.4208 10.7829 14.3359 10.8001 14.2501 10.8C14.1607 10.7989 14.0725 10.7787 13.9915 10.7407C13.9104 10.7028 13.8384 10.648 13.7802 10.5801C13.5417 10.2822 13.2274 10.054 12.8702 9.91992V12.1699L13.1202 12.27C14.3902 12.76 15.1802 13.4799 15.1802 14.6299C15.163 15.2399 14.9149 15.8208 14.4862 16.2551C14.0575 16.6894 13.4799 16.9449 12.8702 16.97ZM11.5302 11.5901V9.96997C11.3688 10.0285 11.2298 10.1363 11.1329 10.2781C11.0361 10.4198 10.9862 10.5884 10.9902 10.76C10.9984 10.93 11.053 11.0945 11.1483 11.2356C11.2435 11.3767 11.3756 11.4889 11.5302 11.5601V11.5901ZM13.7302 14.6599C13.7302 14.1699 13.3902 13.8799 12.8702 13.6599V15.6599C13.1157 15.6254 13.3396 15.5009 13.4985 15.3105C13.6574 15.1202 13.74 14.8776 13.7302 14.6299V14.6599Z" fill="#fff"/>
                    <path d="M12.58 3.96997H6C4.93913 3.96997 3.92178 4.39146 3.17163 5.1416C2.42149 5.89175 2 6.9091 2 7.96997V17.97C2 19.0308 2.42149 20.0482 3.17163 20.7983C3.92178 21.5485 4.93913 21.97 6 21.97H18C19.0609 21.97 20.0783 21.5485 20.8284 20.7983C21.5786 20.0482 22 19.0308 22 17.97V11.8999" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M21.9998 2.91992L16.3398 8.57992" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M20.8698 8.5798H16.3398V4.0498" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span>{ad.boost_level.toFixed(3)} GALA</span>
                </div>
                <div className="stat">
                  <svg width="25px" height="25px" viewBox="-0.5 0 25 25" fill="none">
                    <path d="M12.8702 16.97V18.0701C12.8702 18.2478 12.7995 18.4181 12.6739 18.5437C12.5482 18.6694 12.3778 18.74 12.2001 18.74C12.0224 18.74 11.852 18.6694 11.7264 18.5437C11.6007 18.4181 11.5302 18.2478 11.5302 18.0701V16.9399C11.0867 16.8668 10.6625 16.7051 10.2828 16.4646C9.90316 16.2241 9.57575 15.9097 9.32013 15.54C9.21763 15.428 9.16061 15.2817 9.16016 15.1299C9.16006 15.0433 9.17753 14.9576 9.21155 14.8779C9.24557 14.7983 9.29545 14.7263 9.35809 14.6665C9.42074 14.6067 9.49484 14.5601 9.57599 14.5298C9.65713 14.4994 9.7436 14.4859 9.83014 14.49C9.91602 14.4895 10.0009 14.5081 10.0787 14.5444C10.1566 14.5807 10.2254 14.6338 10.2802 14.7C10.6 15.1178 11.0342 15.4338 11.5302 15.6099V13.0701C10.2002 12.5401 9.53015 11.77 9.53015 10.76C9.55019 10.2193 9.7627 9.70353 10.1294 9.30566C10.4961 8.9078 10.9929 8.65407 11.5302 8.59009V7.47998C11.5302 7.30229 11.6007 7.13175 11.7264 7.0061C11.852 6.88045 12.0224 6.81006 12.2001 6.81006C12.3778 6.81006 12.5482 6.88045 12.6739 7.0061C12.7995 7.13175 12.8702 7.30229 12.8702 7.47998V8.58008C13.2439 8.63767 13.6021 8.76992 13.9234 8.96924C14.2447 9.16856 14.5226 9.43077 14.7402 9.73999C14.8284 9.85568 14.8805 9.99471 14.8901 10.1399C14.8928 10.2256 14.8783 10.3111 14.8473 10.3911C14.8163 10.4711 14.7696 10.5439 14.7099 10.6055C14.6502 10.667 14.5787 10.7161 14.4998 10.7495C14.4208 10.7829 14.3359 10.8001 14.2501 10.8C14.1607 10.7989 14.0725 10.7787 13.9915 10.7407C13.9104 10.7028 13.8384 10.648 13.7802 10.5801C13.5417 10.2822 13.2274 10.054 12.8702 9.91992V12.1699L13.1202 12.27C14.3902 12.76 15.1802 13.4799 15.1802 14.6299C15.163 15.2399 14.9149 15.8208 14.4862 16.2551C14.0575 16.6894 13.4799 16.9449 12.8702 16.97ZM11.5302 11.5901V9.96997C11.3688 10.0285 11.2298 10.1363 11.1329 10.2781C11.0361 10.4198 10.9862 10.5884 10.9902 10.76C10.9984 10.93 11.053 11.0945 11.1483 11.2356C11.2435 11.3767 11.3756 11.4889 11.5302 11.5601V11.5901ZM13.7302 14.6599C13.7302 14.1699 13.3902 13.8799 12.8702 13.6599V15.6599C13.1157 15.6254 13.3396 15.5009 13.4985 15.3105C13.6574 15.1202 13.74 14.8776 13.7302 14.6299V14.6599Z" fill="#fff"/>
                    <path d="M12.58 3.96997H6C4.93913 3.96997 3.92178 4.39146 3.17163 5.1416C2.42149 5.89175 2 6.9091 2 7.96997V17.97C2 19.0308 2.42149 20.0482 3.17163 20.7983C3.92178 21.5485 4.93913 21.97 6 21.97H18C19.0609 21.97 20.0783 21.5485 20.8284 20.7983C21.5786 20.0482 22 19.0308 22 17.97V11.8999" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M16.3398 8.57992L21.9998 2.91992" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M17.4805 2.91992H22.0005V7.44992" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span>{(ad.views_count * 0.005 + ad.clicks_count * 0.02).toFixed(3)} GALA</span>
                </div>
                <div className="stat">
                  <svg width="25px" height="25px" viewBox="0 0 24 24" fill="none">
                    <path d="M15.0007 12C15.0007 13.6569 13.6576 15 12.0007 15C10.3439 15 9.00073 13.6569 9.00073 12C9.00073 10.3431 10.3439 9 12.0007 9C13.6576 9 15.0007 10.3431 15.0007 12Z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12.0012 5C7.52354 5 3.73326 7.94288 2.45898 12C3.73324 16.0571 7.52354 19 12.0012 19C16.4788 19 20.2691 16.0571 21.5434 12C20.2691 7.94291 16.4788 5 12.0012 5Z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>{ad.views_count}</span>
                </div>
                <div className="stat">
                  <svg width="25px" height="25px" viewBox="0 0 24 24" fill="none">
                    <path d="M12.5266 12.5324L20 20M19.0117 9.81874L12.8083 12.3731C12.6945 12.4199 12.6377 12.4434 12.5895 12.4783C12.5468 12.5093 12.5093 12.5468 12.4783 12.5895C12.4434 12.6377 12.4199 12.6945 12.3731 12.8083L9.81874 19.0117C9.56565 19.6264 9.43911 19.9337 9.2675 20.0169C9.11884 20.0889 8.94417 20.0829 8.80082 20.0008C8.63535 19.906 8.53025 19.5907 8.32005 18.9601L3.50599 4.51792C3.34314 4.02937 3.26172 3.7851 3.31964 3.62265C3.37005 3.48129 3.48129 3.37005 3.62265 3.31964C3.7851 3.26172 4.02937 3.34314 4.51792 3.50599L18.9601 8.32005C19.5907 8.53025 19.906 8.63535 20.0008 8.80082C20.0829 8.94417 20.0889 9.11884 20.0169 9.2675C19.9337 9.43911 19.6264 9.56565 19.0117 9.81874Z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>{ad.clicks_count}</span>
                </div>
                <div className="stat">
                  <span>Status: {ad.published ? 'Published' : 'Under Review'}</span>
                </div>
                <a href={ad.url} target="_blank" rel="noopener noreferrer">Ad Link</a>
                {message && <p>{message}</p>}
              </div>
              <div className="boost-section">
                <input type="number" value={boostAmount} onChange={(e) => setBoostAmount(e.target.value)} placeholder="Boost Amount" disabled={loading} />
                <button onClick={handleBoost} disabled={loading || !boostAmount}>Boost Ad</button>
                <p>Gas Fee: 1 GALA</p>
              </div>
            </div>
          </div>
          <div className="chart-container">
            <Line data={chartData} options={chartOptions} />
          </div>
          <div className="info">
            <h3>What is a view?</h3>
            <p>A view is submitted after 30 seconds of your ad being visible for a user</p>
            <h3>What is a click?</h3>
            <p>A click is a non-bot user click</p>
            <h3>How much does a view cost?</h3>
            <p>A view costs .005 GALA taken from your ad pool and given to the ad displayer</p>
            <h3>How much does a click cost?</h3>
            <p>A click costs .02 GALA taken from your ad pool and given to the ad displayer</p>
          </div>
        </>
      ) : (
        <p>Loading...</p>
      )}
      <style jsx>{`
        .ad-detail-container {
          display: flex;
          justify-content: center;
          padding: 20px;
          max-width: 1200px;
          margin: auto;
        }

        .info {
          max-width: 1200px;
          margin: auto;
        }

        .ad-detail {
          display: flex;
          gap: 20px;
          width: 100%;
          background: linear-gradient(55deg, #353535, #353535 50%, #555555 80%, #353535);
          padding: 10px;
          border-radius: 10px;
        }

        .ad-image {
          flex: 1;
        }

        .ad-image img {
          border-radius: 5px;
          overflow: hidden;
        }

        .ad-info {
          flex: 2;
          display: flex;
          flex-direction: column;
        }

        .ad-info a {
          color: white;
          font-size: 14px;
          margin-top: 10px;
        }

        .ad-info h1 {
          margin: 0px;
        }

        .boost-section {
          margin-top: 0px;
        }

        input[type="number"] {
          margin-right: 10px;
          padding: 8px;
        }

        button {
          padding: 8px;
          background-color: #535353;
          color: white;
          border: none;
          cursor: pointer;
        }

        button:disabled {
          background-color: #ccc;
        }
        .chart-container {
          max-width: 1160px;
          height: 400px;
          border-radius: 10px;
          margin: auto;
          padding: 20px;
          margin-bottom: 20px;
          background: linear-gradient(55deg, #353535, #353535 50%, #555555 80%, #353535);
        }
      `}</style>
    </>
  );
};

export default AdDetail;
