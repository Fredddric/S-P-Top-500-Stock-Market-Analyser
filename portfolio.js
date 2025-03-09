import { formatCurrency, formatPercent, formatMarketCap, formatNumber, getRandomColors, showError, initializeAutocomplete } from './main.js';

export const initPortfolio = () => {
  // Initialize portfolio stocks array
  window.portfolioStocks = [];
  
  // Add event listeners
  const addStockBtn = document.getElementById('add-stock-btn');
  const portfolioStock = document.getElementById('portfolio-stock');
  const optimizeBtn = document.getElementById('optimize-btn');
  
  // Initialize autocomplete for portfolio stock input
  initializeAutocomplete(portfolioStock, (selectedStock) => {
    addStockToPortfolio(selectedStock.symbol);
    portfolioStock.value = '';
  });
  
  addStockBtn.addEventListener('click', () => {
    const symbol = portfolioStock.value.trim().toUpperCase();
    if (symbol) {
      addStockToPortfolio(symbol);
      portfolioStock.value = '';
    }
  });
  
  portfolioStock.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const symbol = portfolioStock.value.trim().toUpperCase();
      if (symbol) {
        addStockToPortfolio(symbol);
        portfolioStock.value = '';
      }
    }
  });
  
  optimizeBtn.addEventListener('click', () => {
    if (window.portfolioStocks.length > 0) {
      optimizePortfolio();
    } else {
      showError('Please add at least one stock to your portfolio');
    }
  });
};

const addStockToPortfolio = async (symbol) => {
  try {
    // Check if stock already exists in portfolio
    if (window.portfolioStocks.some(stock => stock.Symbol === symbol)) {
      showError('This stock is already in your portfolio');
      return;
    }
    
    // Fetch stock data
    const response = await fetch(`/api/stocks/${symbol}`);
    
    if (!response.ok) {
      throw new Error('Stock not found');
    }
    
    const stock = await response.json();
    
    // Add stock to portfolio
    window.portfolioStocks.push({
      Symbol: stock.Symbol,
      Name: stock.Name,
      Price: parseFloat(stock.Price) || 0,
      Sector: stock.Sector,
      MarketCap: parseFloat(stock['Market Cap']) || 0,
      PE: parseFloat(stock['Price/Earnings']) || 0,
      DividendYield: parseFloat(stock['Dividend Yield']) || 0
    });
    
    // Update the portfolio display
    updatePortfolioDisplay();
    
  } catch (error) {
    showError(`Failed to add stock: ${error.message}`);
  }
};

const updatePortfolioDisplay = () => {
  const selectedStocksList = document.getElementById('selected-stocks');
  
  if (window.portfolioStocks.length === 0) {
    selectedStocksList.innerHTML = '<li class="empty-portfolio">No stocks added yet. Use the form above to add stocks.</li>';
    return;
  }
  
  selectedStocksList.innerHTML = window.portfolioStocks.map((stock, index) => `
    <li>
      <div class="stock-info">
        <strong>${stock.Symbol}</strong> - ${stock.Name}
        <div class="stock-details">
          <span>Price: ${formatCurrency(stock.Price)}</span>
          <span>Sector: ${stock.Sector}</span>
        </div>
      </div>
      <button class="remove-stock" data-index="${index}">Remove</button>
    </li>
  `).join('');
  
  // Add event listeners to remove buttons
  const removeButtons = document.querySelectorAll('.remove-stock');
  removeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const index = parseInt(button.getAttribute('data-index'));
      window.portfolioStocks.splice(index, 1);
      updatePortfolioDisplay();
    });
  });
};

const optimizePortfolio = () => {
  try {
    // Show optimization results
    document.getElementById('optimization-results').classList.remove('hidden');
    
    // Get risk level
    const riskLevel = document.getElementById('risk-level').value;
    
    // Generate optimized allocation
    const allocation = generateOptimalAllocation(window.portfolioStocks, riskLevel);
    
    // Create allocation chart
    createAllocationChart(allocation);
    
    // Create performance chart
    createPerformanceChart(allocation, riskLevel);
    
    // Update risk analysis
    updateRiskAnalysis(allocation, riskLevel);
    
    // Update portfolio metrics
    updatePortfolioMetrics(allocation);
    
  } catch (error) {
    showError(`Failed to optimize portfolio: ${error.message}`);
    document.getElementById('optimization-results').classList.remove('hidden');
    document.getElementById('risk-analysis').innerHTML = '<p>Error optimizing portfolio</p>';
    document.getElementById('portfolio-metrics').innerHTML = '';
  }
};

const generateOptimalAllocation = (stocks, riskLevel) => {
  // This is a simplified mock optimization algorithm
  // In a real application, you would use more sophisticated methods like Modern Portfolio Theory
  
  const allocation = [];
  let totalWeight = 0;
  
  // Assign initial weights based on risk level and stock characteristics
  stocks.forEach(stock => {
    let weight = 0;
    
    // Base weight on market cap (larger companies get more weight)
    const marketCapFactor = Math.log10(stock.MarketCap) / 12; // Normalize to roughly 0-1 range
    
    // Adjust based on P/E ratio (lower P/E gets more weight)
    const peFactor = stock.PE > 0 ? (1 / stock.PE) * 20 : 0; // Normalize
    
    // Adjust based on dividend yield (higher yield gets more weight)
    const dividendFactor = stock.DividendYield * 10; // Normalize
    
    // Combine factors based on risk level
    if (riskLevel === 'low') {
      // Low risk: favor large caps and dividend stocks
      weight = (marketCapFactor * 0.5) + (peFactor * 0.2) + (dividendFactor * 0.3);
    } else if (riskLevel === 'medium') {
      // Medium risk: balanced approach
      weight = (marketCapFactor * 0.3) + (peFactor * 0.4) + (dividendFactor * 0.3);
    } else {
      // High risk: favor growth potential
      weight = (marketCapFactor * 0.2) + (peFactor * 0.6) + (dividendFactor * 0.2);
    }
    
    // Ensure minimum weight
    weight = Math.max(0.05, weight);
    
    allocation.push({
      ...stock,
      weight: weight
    });
    
    totalWeight += weight;
  });
  
  // Normalize weights to sum to 1
  allocation.forEach(stock => {
    stock.weight = stock.weight / totalWeight;
  });
  
  // Sort by weight (descending)
  allocation.sort((a, b) => b.weight - a.weight);
  
  return allocation;
};

const createAllocationChart = (allocation) => {
  const ctx = document.getElementById('allocation-chart').getContext('2d');
  
  // Clear previous chart if it exists
  if (window.allocationChart) {
    window.allocationChart.destroy();
  }
  
  // Create chart
  window.allocationChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: allocation.map(stock => stock.Symbol),
      datasets: [{
        data: allocation.map(stock => (stock.weight * 100).toFixed(1)),
        backgroundColor: getRandomColors(allocation.length),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              return `${label}: ${value}%`;
            }
          }
        }
      }
    }
  });
};

const createPerformanceChart = (allocation, riskLevel) => {
  const ctx = document.getElementById('performance-chart').getContext('2d');
  
  // Clear previous chart if it exists
  if (window.performanceChart) {
    window.performanceChart.destroy();
  }
  
  // Generate mock performance data
  const labels = [];
  const optimizedData = [];
  const benchmarkData = [];
  
  // Start with $10,000 investment
  let optimizedValue = 10000;
  let benchmarkValue = 10000;
  
  // Set growth rates based on risk level
  let avgAnnualReturn;
  let avgVolatility;
  
  if (riskLevel === 'low') {
    avgAnnualReturn = 0.06; // 6% annual return
    avgVolatility = 0.08;   // 8% annual volatility
  } else if (riskLevel === 'medium') {
    avgAnnualReturn = 0.09; // 9% annual return
    avgVolatility = 0.12;   // 12% annual volatility
  } else {
    avgAnnualReturn = 0.12; // 12% annual return
    avgVolatility = 0.18;   // 18% annual volatility
  }
  
  // Generate 5 years of annual data
  for (let year = 0; year <= 5; year++) {
    labels.push(`Year ${year}`);
    
    if (year === 0) {
      // Initial investment
      optimizedData.push(optimizedValue);
      benchmarkData.push(benchmarkValue);
    } else {
      // Generate random return for optimized portfolio
      const annualVolatility = avgVolatility * Math.sqrt(1); // 1 year
      const randomReturn = avgAnnualReturn + (Math.random() - 0.5) * annualVolatility * 2;
      optimizedValue = optimizedValue * (1 + randomReturn);
      optimizedData.push(optimizedValue);
      
      // Generate random return for benchmark (S&P 500)
      const benchmarkReturn = 0.08 + (Math.random() - 0.5) * 0.1 * 2; // 8% avg return with 10% volatility
      benchmarkValue = benchmarkValue * (1 + benchmarkReturn);
      benchmarkData.push(benchmarkValue);
    }
  }
  
  // Create chart
  window.performanceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Optimized Portfolio',
          data: optimizedData,
          borderColor: 'rgba(46, 204, 113, 1)',
          backgroundColor: 'rgba(46, 204, 113, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        },
        {
          label: 'S&P 500 Benchmark',
          data: benchmarkData,
          borderColor: 'rgba(52, 152, 219, 1)',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: 'Portfolio Value ($)'
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
            }
          }
        }
      }
    }
  });
};

const updateRiskAnalysis = (allocation, riskLevel) => {
  try {
    // Calculate mock risk metrics
    let expectedReturn;
    let volatility;
    let sharpeRatio;
    let maxDrawdown;
    
    if (riskLevel === 'low') {
      expectedReturn = 0.06; // 6% annual return
      volatility = 0.08;     // 8% annual volatility
      sharpeRatio = 0.75;    // (6% - 0% risk-free) / 8%
      maxDrawdown = 0.15;    // 15% max drawdown
    } else if (riskLevel === 'medium') {
      expectedReturn = 0.09; // 9% annual return
      volatility = 0.12;     // 12% annual volatility
      sharpeRatio = 0.75;    // (9% - 0% risk-free) / 12%
      maxDrawdown = 0.25;    // 25% max drawdown
    } else {
      expectedReturn = 0.12; // 12% annual return
      volatility = 0.18;     // 18% annual volatility
      sharpeRatio = 0.67;    // (12% - 0% risk-free) / 18%
      maxDrawdown = 0.35;    // 35% max drawdown
    }
    
    // Calculate sector diversification
    const sectorAllocation = {};
    allocation.forEach(stock => {
      const sector = stock.Sector || 'Unknown';
      if (!sectorAllocation[sector]) {
        sectorAllocation[sector] = 0;
      }
      sectorAllocation[sector] += stock.weight;
    });
    
    // Calculate concentration risk (Herfindahl-Hirschman Index)
    const hhi = allocation.reduce((sum, stock) => sum + Math.pow(stock.weight, 2), 0);
    const concentrationRisk = hhi * 10000; // Scale to 0-10000
    
    // Update risk analysis display
    document.getElementById('risk-analysis').innerHTML = `
      <table>
        <tr>
          <td>Expected Annual Return</td>
          <td>${formatPercent(expectedReturn)}</td>
        </tr>
        <tr>
          <td>Annual Volatility</td>
          <td>${formatPercent(volatility)}</td>
        </tr>
        <tr>
          <td>Sharpe Ratio</td>
          <td>${sharpeRatio.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Maximum Drawdown</td>
          <td>${formatPercent(maxDrawdown)}</td>
        </tr>
        <tr>
          <td>Concentration Risk</td>
          <td>
            <div class="risk-meter">
              <div class="risk-bar" style="width: ${Math.min(concentrationRisk / 100, 100)}%"></div>
              <span>${concentrationRisk.toFixed(0)} / 10000</span>
            </div>
          </td>
        </tr>
      </table>
      
      <h5 style="margin-top: 15px;">Sector Allocation</h5>
      <div class="sector-allocation">
        ${Object.entries(sectorAllocation).map(([sector, weight]) => `
          <div class="sector-bar">
            <div class="sector-name">${sector}</div>
            <div class="sector-weight-bar">
              <div class="sector-weight" style="width: ${(weight * 100).toFixed(1)}%"></div>
            </div>
            <div class="sector-weight-value">${(weight * 100).toFixed(1)}%</div>
          </div>
        `).join('')}
      </div>
      
      <style>
        .risk-meter {
          width: 100%;
          height: 20px;
          background-color: #eee;
          border-radius: 10px;
          overflow: hidden;
          position: relative;
          margin-top: 5px;
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
          font-size: 0.8rem;
        }
        .sector-allocation {
          margin-top: 10px;
        }
        .sector-bar {
          display: flex;
          align-items: center;
          margin-bottom: 5px;
        }
        .sector-name {
          width: 30%;
          font-size: 0.8rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sector-weight-bar {
          flex-grow: 1;
          height: 15px;
          background-color: #eee;
          border-radius: 5px;
          overflow: hidden;
          margin: 0 10px;
        }
        .sector-weight {
          height: 100%;
          background-color: #3498db;
        }
        .sector-weight-value {
          width: 50px;
          text-align: right;
          font-size: 0.8rem;
        }
      </style>
    `;
  } catch (error) {
    console.error('Error in risk analysis:', error);
    document.getElementById('risk-analysis').innerHTML = `
      <div class="error-message">
        <p>Unable to generate risk analysis. Please try a different portfolio combination.</p>
        <p class="error-details">Error details: ${error.message}</p>
      </div>
    `;
  }
};

const updatePortfolioMetrics = (allocation) => {
  // Calculate portfolio metrics
  const totalStocks = allocation.length;
  
  // Calculate weighted average metrics
  const weightedPE = allocation.reduce((sum, stock) => {
    return sum + (stock.PE > 0 ? stock.PE * stock.weight : 0);
  }, 0);
  
  const weightedDividendYield = allocation.reduce((sum, stock) => {
    return sum + (stock.DividendYield * stock.weight);
  }, 0);
  
  // Calculate total market cap
  const totalMarketCap = allocation.reduce((sum, stock) => {
    return sum + stock.MarketCap;
  }, 0);
  
  // Calculate beta (mock value based on risk level)
  const riskLevel = document.getElementById('risk-level').value;
  let portfolioBeta;
  
  if (riskLevel === 'low') {
    portfolioBeta = 0.8 + (Math.random() * 0.2);
  } else if (riskLevel === 'medium') {
    portfolioBeta = 1.0 + (Math.random() * 0.2 - 0.1);
  } else {
    portfolioBeta = 1.2 + (Math.random() * 0.3);
  }
  
  // Update portfolio metrics display
  document.getElementById('portfolio-metrics').innerHTML = `
    <table>
      <tr>
        <td>Number of Stocks</td>
        <td>${totalStocks}</td>
      </tr>
      <tr>
        <td>Weighted P/E Ratio</td>
        <td>${formatNumber(weightedPE)}</td>
      </tr>
      <tr>
        <td>Weighted Dividend Yield</td>
        <td>${formatPercent(weightedDividendYield)}</td>
      </tr>
      <tr>
        <td>Total Market Cap</td>
        <td>${formatMarketCap(totalMarketCap)}</td>
      </tr>
      <tr>
        <td>Portfolio Beta</td>
        <td>${portfolioBeta.toFixed(2)}</td>
      </tr>
    </table>
    
    <div class="portfolio-summary">
      <h5>Investment Summary</h5>
      <p>This ${riskLevel}-risk portfolio consists of ${totalStocks} stocks with a weighted average P/E ratio of ${formatNumber(weightedPE)} and dividend yield of ${formatPercent(weightedDividendYield)}.</p>
      <p>The portfolio has a beta of ${portfolioBeta.toFixed(2)}, indicating it is ${portfolioBeta < 0.9 ? 'less volatile' : (portfolioBeta > 1.1 ? 'more volatile' : 'similarly volatile')} compared to the overall market.</p>
    </div>
  `;
};