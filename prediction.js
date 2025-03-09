import { formatCurrency, formatNumber, formatPercent, getRandomColors, showError, initializeAutocomplete } from './main.js';

// Initialize prediction module
export const initPrediction = () => {
  setupPredictionControls();
};

const setupPredictionControls = () => {
  const predictionStock = document.getElementById('prediction-stock');
  const predictionDays = document.getElementById('prediction-days');
  const predictBtn = document.getElementById('predict-btn');
  const predictionResults = document.getElementById('prediction-results');

  // Initialize autocomplete for prediction stock input
  initializeAutocomplete(predictionStock, (selectedStock) => {
    // Optional: You could automatically trigger prediction here if desired
    // predictBtn.click();
  });

  predictBtn.addEventListener('click', async () => {
    const symbol = predictionStock.value.trim().toUpperCase();
    if (!symbol) {
      showError('Please enter a stock symbol');
      return;
    }

    try {
      // Get stock data
      const response = await fetch(`/api/stocks/${symbol}`);
      const stock = await response.json();
      
      if (!stock || stock.error) {
        showError('Stock not found');
        return;
      }

      // Show results section
      predictionResults.classList.remove('hidden');

      // Generate predictions
      const days = parseInt(predictionDays.value);
      createPredictionChart(stock, days);
      createConfidenceChart(days);
      updatePredictionMetrics(stock, days);
      updateTechnicalIndicators(stock);
    } catch (error) {
      showError('Failed to generate prediction');
      console.error('Prediction error:', error);
    }
  });
};

const createPredictionChart = (stock, days) => {
  const ctx = document.getElementById('prediction-chart').getContext('2d');
  
  // Clear previous chart if it exists
  if (window.predictionChart) {
    window.predictionChart.destroy();
  }
  
  // Generate dates for x-axis
  const dates = [];
  const currentDate = new Date();
  
  // Add dates for historical data (past 30 days)
  for (let i = -30; i <= 0; i++) {
    const date = new Date(currentDate);
    date.setDate(currentDate.getDate() + i);
    dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }
  
  // Generate historical price data (with some randomness)
  const historicalData = [];
  let price = stock.Price * 0.85; // Start 15% lower than current price
  
  for (let i = 0; i < 30; i++) {
    // Add some random daily fluctuation
    const dailyChange = (Math.random() - 0.45) * 0.02; // Slightly biased upward
    price = price * (1 + dailyChange);
    historicalData.push(price);
  }
  
  // Add current price
  historicalData.push(stock.Price);
  
  // Generate prediction data
  const predictionData = [];
  const lowerBoundData = [];
  const upperBoundData = [];
  
  // Start with current price
  price = stock.Price;
  
  // Generate future prices with increasing uncertainty
  for (let i = 1; i <= days; i++) {
    // Model a slight upward trend with increasing volatility over time
    const trend = 0.0005; // Small daily upward trend
    const volatility = 0.01 + (i / days) * 0.02; // Increasing volatility
    
    const dailyChange = trend + (Math.random() - 0.5) * volatility;
    price = price * (1 + dailyChange);
    
    predictionData.push(price);
    
    // Calculate confidence interval (widens with time)
    const confidenceWidth = 0.02 + (i / days) * 0.08; // Starts at 2%, increases to 10%
    lowerBoundData.push(price * (1 - confidenceWidth));
    upperBoundData.push(price * (1 + confidenceWidth));
  }
  
  // Create chart
  window.predictionChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [
        {
          label: 'Historical Price',
          data: [...historicalData, null, ...Array(days).fill(null)],
          borderColor: 'rgba(52, 152, 219, 1)',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          borderWidth: 2,
          pointRadius: 0,
          fill: false
        },
        {
          label: 'Predicted Price',
          data: [...Array(31).fill(null), ...predictionData],
          borderColor: 'rgba(46, 204, 113, 1)',
          backgroundColor: 'rgba(46, 204, 113, 0.1)',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false
        },
        {
          label: 'Upper Bound',
          data: [...Array(31).fill(null), ...upperBoundData],
          borderColor: 'rgba(46, 204, 113, 0.3)',
          backgroundColor: 'rgba(46, 204, 113, 0)',
          borderWidth: 1,
          pointRadius: 0,
          fill: '+1'
        },
        {
          label: 'Lower Bound',
          data: [...Array(31).fill(null), ...lowerBoundData],
          borderColor: 'rgba(46, 204, 113, 0.3)',
          backgroundColor: 'rgba(46, 204, 113, 0.2)',
          borderWidth: 1,
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: 'Price ($)'
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              if (context.dataset.label === 'Historical Price' || context.dataset.label === 'Predicted Price') {
                return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
              }
              return '';
            }
          }
        },
        annotation: {
          annotations: {
            line1: {
              type: 'line',
              xMin: 30,
              xMax: 30,
              borderColor: 'rgba(0, 0, 0, 0.5)',
              borderWidth: 2,
              borderDash: [5, 5],
              label: {
                content: 'Today',
                enabled: true,
                position: 'top'
              }
            }
          }
        }
      }
    }
  });
};

const createConfidenceChart = (days) => {
  const ctx = document.getElementById('confidence-chart').getContext('2d');
  
  // Clear previous chart if it exists
  if (window.confidenceChart) {
    window.confidenceChart.destroy();
  }
  
  // Generate confidence data
  const labels = [];
  const confidenceData = [];
  
  // Generate dates for prediction period
  const currentDate = new Date();
  for (let i = 1; i <= days; i++) {
    const date = new Date(currentDate);
    date.setDate(currentDate.getDate() + i);
    labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    
    // Confidence decreases over time
    const confidence = 95 - (i / days) * 30;
    confidenceData.push(confidence);
  }
  
  // Create chart
  window.confidenceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Model Confidence (%)',
        data: confidenceData,
        borderColor: 'rgba(155, 89, 182, 1)',
        backgroundColor: 'rgba(155, 89, 182, 0.2)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
          min: 50,
          max: 100,
          title: {
            display: true,
            text: 'Confidence (%)'
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Confidence: ${context.raw.toFixed(1)}%`;
            }
          }
        }
      }
    }
  });
};

const updatePredictionMetrics = (stock, days) => {
  // Calculate some mock prediction metrics
  const currentPrice = parseFloat(stock.Price);
  const predictedEndPrice = currentPrice * (1 + (Math.random() * 0.2 - 0.05)); // -5% to +15%
  const priceChange = predictedEndPrice - currentPrice;
  const percentChange = priceChange / currentPrice;
  
  // Calculate volatility based on 52-week range
  const weekLow = parseFloat(stock['52 Week Low']);
  const weekHigh = parseFloat(stock['52 Week High']);
  const volatility = (weekHigh - weekLow) / ((weekHigh + weekLow) / 2);
  
  // Calculate risk score (1-10)
  const peRatio = parseFloat(stock['Price/Earnings']) || 0;
  const marketCap = parseFloat(stock['Market Cap']) || 0;
  
  let riskScore = 5; // Default medium risk
  
  // Adjust risk based on various factors
  if (volatility > 0.5) riskScore += 2;
  if (volatility < 0.2) riskScore -= 1;
  if (peRatio > 30) riskScore += 1;
  if (peRatio < 10 && peRatio > 0) riskScore -= 1;
  if (marketCap > 100000000000) riskScore -= 1; // Large cap less risky
  if (marketCap < 10000000000) riskScore += 1; // Small cap more risky
  
  // Ensure risk score is between 1-10
  riskScore = Math.max(1, Math.min(10, riskScore));
  
  // Update the metrics display
  document.getElementById('prediction-metrics').innerHTML = `
    <table>
      <tr>
        <td>Current Price</td>
        <td>${formatCurrency(currentPrice)}</td>
      </tr>
      <tr>
        <td>Predicted Price (${days} days)</td>
        <td>${formatCurrency(predictedEndPrice)}</td>
      </tr>
      <tr>
        <td>Predicted Change</td>
        <td class="${priceChange >= 0 ? 'text-success' : 'text-danger'}">
          ${formatCurrency(priceChange)} (${formatPercent(percentChange)})
        </td>
      </tr>
      <tr>
        <td>Prediction Confidence</td>
        <td>${formatPercent(0.95 - (days / 365))}</td>
      </tr>
      <tr>
        <td>Volatility</td>
        <td>${formatPercent(volatility)}</td>
      </tr>
      <tr>
        <td>Risk Score</td>
        <td>
          <div class="risk-meter">
            <div class="risk-bar" style="width: ${riskScore * 10}%"></div>
            <span>${riskScore}/10</span>
          </div>
        </td>
      </tr>
    </table>
    
    <style>
      .risk-meter {
        width: 100%;
        height: 20px;
        background-color: #eee;
        border-radius: 10px;
        overflow: hidden;
        position: relative;
      }
      .risk-bar {
        height: 100%;
        background: linear-gradient(to right, #2ecc71, #f39c12, #e74c3c);
      }
      .risk-meter span {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        text-align: center;
        line-height: 20px;
        color: #333;
        font-weight: bold;
      }
    </style>
  `;
};

const updateTechnicalIndicators = (stock) => {
  // Generate mock technical indicators
  const currentPrice = parseFloat(stock.Price);
  const weekLow = parseFloat(stock['52 Week Low']);
  const weekHigh = parseFloat(stock['52 Week High']);
  
  // Calculate mock moving averages
  const ma50 = currentPrice * (1 + (Math.random() * 0.1 - 0.05)); // ±5% from current price
  const ma200 = currentPrice * (1 + (Math.random() * 0.15 - 0.1)); // ±10% from current price
  
  // Calculate mock RSI (Relative Strength Index)
  const rsi = Math.floor(Math.random() * 40) + 30; // 30-70 range
  
  // Calculate mock MACD (Moving Average Convergence Divergence)
  const macd = (Math.random() * 2 - 1).toFixed(2); // -1 to 1 range
  
  // Calculate mock Bollinger Bands
  const bollingerUpper = currentPrice * 1.05;
  const bollingerLower = currentPrice * 0.95;
  
  // Determine signals
  const ma50Signal = ma50 > currentPrice ? 'Bearish' : 'Bullish';
  const ma200Signal = ma200 > currentPrice ? 'Bearish' : 'Bullish';
  const rsiSignal = rsi > 70 ? 'Overbought' : (rsi < 30 ? 'Oversold' : 'Neutral');
  const macdSignal = parseFloat(macd) > 0 ? 'Bullish' : 'Bearish';
  const bollingerSignal = currentPrice > bollingerUpper ? 'Overbought' : 
                         (currentPrice < bollingerLower ? 'Oversold' : 'Neutral');
  
  // Overall signal
  let bullishCount = 0;
  let bearishCount = 0;
  
  if (ma50Signal === 'Bullish') bullishCount++;
  if (ma50Signal === 'Bearish') bearishCount++;
  if (ma200Signal === 'Bullish') bullishCount++;
  if (ma200Signal === 'Bearish') bearishCount++;
  if (rsiSignal === 'Oversold') bullishCount++;
  if (rsiSignal === 'Overbought') bearishCount++;
  if (macdSignal === 'Bullish') bullishCount++;
  if (macdSignal === 'Bearish') bearishCount++;
  if (bollingerSignal === 'Oversold') bullishCount++;
  if (bollingerSignal === 'Overbought') bearishCount++;
  
  let overallSignal = 'Neutral';
  if (bullishCount > bearishCount + 1) overallSignal = 'Bullish';
  if (bearishCount > bullishCount + 1) overallSignal = 'Bearish';
  
  // Update the technical indicators display
  document.getElementById('technical-indicators').innerHTML = `
    <table>
      <tr>
        <td>50-Day Moving Average</td>
        <td>${formatCurrency(ma50)}</td>
        <td class="${ma50Signal === 'Bullish' ? 'text-success' : 'text-danger'}">${ma50Signal}</td>
      </tr>
      <tr>
        <td>200-Day Moving Average</td>
        <td>${formatCurrency(ma200)}</td>
        <td class="${ma200Signal === 'Bullish' ? 'text-success' : 'text-danger'}">${ma200Signal}</td>
      </tr>
      <tr>
        <td>RSI (14-Day)</td>
        <td>${rsi}</td>
        <td class="${rsiSignal === 'Oversold' ? 'text-success' : (rsiSignal === 'Overbought' ? 'text-danger' : '')}">${rsiSignal}</td>
      </tr>
      <tr>
        <td>MACD</td>
        <td>${macd}</td>
        <td class="${macdSignal === 'Bullish' ? 'text-success' : 'text-danger'}">${macdSignal}</td>
      </tr>
      <tr>
        <td>Bollinger Bands</td>
        <td>${formatCurrency(bollingerLower)} - ${formatCurrency(bollingerUpper)}</td>
        <td class="${bollingerSignal === 'Oversold' ? 'text-success' : (bollingerSignal === 'Overbought' ? 'text-danger' : '')}">${bollingerSignal}</td>
      </tr>
      <tr>
        <td colspan="2"><strong>Overall Signal</strong></td>
        <td class="${overallSignal === 'Bullish' ? 'text-success' : (overallSignal === 'Bearish' ? 'text-danger' : '')}"><strong>${overallSignal}</strong></td>
      </tr>
    </table>
  `;
};
