import React, { useEffect, useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Earn = () => {
  const { walletAddress } = useWallet();
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [activityData, setActivityData] = useState({ dates: [], views: [], clicks: [] });
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [claimMessage, setClaimMessage] = useState('');

  useEffect(() => {
    if (!walletAddress) return;

    const fetchAdActivities = async () => {
      try {
        const response = await fetch(`/api/adActivity?walletAddress=${walletAddress}`);
        if (!response.ok) throw new Error('Failed to fetch ad activities');
        
        const data = await response.json();
        console.log('Fetched Data:', data); // Debug: Log out the fetched data
        
        const earnings = data.earnings;
        const activities = await Promise.all(
          Object.keys(earnings).map(async (adId) => {
            const res = await fetch(`/api/adActivity/${adId}?walletAddress=${walletAddress}`);
            const adData = await res.json();
            return adData.data;
          })
        );

        const total = Object.values(earnings).reduce((sum, current) => sum + current, 0);
        setTotalEarnings(total);

        const aggregatedData = activities.flat().reduce((acc, entry) => {
          const dateIndex = acc.dates.indexOf(entry.date);
          if (dateIndex === -1) {
            acc.dates.push(entry.date);
            acc.views.push(entry.views || 0);
            acc.clicks.push(entry.clicks || 0);
          } else {
            acc.views[dateIndex] += entry.views || 0;
            acc.clicks[dateIndex] += entry.clicks || 0;
          }
          return acc;
        }, { dates: [], views: [], clicks: [] });

        console.log('Aggregated Data:', aggregatedData); // Debug: Verify aggregated data
        
        setActivityData(aggregatedData);
        setChartData({
          labels: aggregatedData.dates.sort(),
          datasets: [
            {
              label: 'Total Views',
              data: aggregatedData.views,
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
              yAxisID: 'yViews',
            },
            {
              label: 'Total Clicks',
              data: aggregatedData.clicks,
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.5)',
              yAxisID: 'yClicks',
            },
          ],
        });
      } catch (error) {
        console.error('Error fetching ad activities:', error);
      }
    };

    fetchAdActivities();
  }, [walletAddress]);


  const calculateMaxYAxis = (clicksData) => {
    const maxClicks = Math.max(...clicksData, 1); // Include 1 to avoid zero division error
    return Math.max(5, Math.ceil(maxClicks / 5) * 5); // Ensure minimum of 5, and round to nearest multiple of 5
  };

  const maxYClicks = calculateMaxYAxis(activityData.clicks);

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
      yViews: { // Y-axis for views
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        ticks: {
          color: 'rgb(75, 192, 192)', // Match the line color
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      yClicks: { // Y-axis for clicks
        type: 'linear',
        display: true,
        position: 'right', // Position on the right
        beginAtZero: true,
        min: 0, // Ensure it starts from zero
        max: maxYClicks, // Dynamic max based on clicks data
        ticks: {
          stepSize: 1, // This can be adjusted based on data density
          color: 'rgb(255, 99, 132)', // Match the line color
        },
        grid: {
          drawOnChartArea: false, // Only draw grid lines for this axis on the chart area
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

  const handleClaim = () => {
    setClaimMessage('Claim functionality coming soon!');
  };

  return (
    <>
      <div className="earn-container">
        {!walletAddress ? (
          <p>Please connect your wallet to view earnings.</p>
        ) : (
          <>
            <div className="earnings-header">
              <h1>Earnings for {walletAddress}</h1>
              <p>Total Earnings: {totalEarnings.toFixed(3)} GALA</p>
              <button onClick={handleClaim} disabled={totalEarnings < 10} style={{ marginTop: '10px' }}>
                Claim Earnings
              </button>
              {totalEarnings < 10 && (
                <p style={{ color: 'red' }}>Minimum 10 GALA required to claim.</p>
              )}
              {claimMessage && <p>{claimMessage}</p>}
            </div>
            <div className="chart-container">
              {chartData ? (
                <Line data={chartData} options={chartOptions} />
              ) : (
                <p>No ad activity to display.</p>
              )}
            </div>
            <div className="iframe-instructions">
              <h2>How to Earn by Embedding Ads</h2>
              <p>Embed the following iframe into your website to start earning GALA through ad views and clicks:</p>
              <pre>
                <code>
{`<iframe id="ad-iframe" 
  src="https://ads.fuzzleprime.com/adFrame?walletAddress=${walletAddress || 'client|address'}" 
  width="300" 
  height="170" 
  frameborder="0">
</iframe>`}
                </code>
              </pre>
              <ul>
                <li>Copy and paste the above HTML code into your website where you want the ads to appear.</li>
                <li>Ensure your wallet address is included in the URL to correctly attribute earnings.</li>
                <li>Ads will automatically display based on the space provided and start generating revenue based on views and clicks.</li>
              </ul>
              <p>Remember, your earnings from these ads will accumulate in your dashboard, and you can claim them once they exceed the minimum threshold.</p>
            </div>
          </>
        )}
      </div>
      <style jsx>{`
        .earn-container {
          padding: 20px;
          max-width: 1200px;
          margin: auto;
        }
        .earnings-header {
          margin-bottom: 20px;
        }
        .chart-container {
          margin-bottom: 20px;
          height: 400px;
        }
        .iframe-instructions {
          background: linear-gradient(55deg, #353535, #353535 50%, #444444 80%, #353535);
          padding: 20px;
          border-radius: 8px;
          color: white;
          margin-top: 20px;
        }
        .iframe-instructions code {
          background: #535353;
          padding: 10px;
          display: block;
          margin-top: 10px;
        }
        .iframe-instructions ul {
          padding-left: 20px;
        }
        button {
          padding: 8px 16px;
          background-color: #4CAF50;
          color: white;
          border: none;
          cursor: pointer;
        }
        button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
};

export default Earn;
