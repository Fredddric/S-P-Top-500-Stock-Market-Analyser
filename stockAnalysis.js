import { formatCurrency, formatPercent, formatMarketCap, getRandomColors, showError, initializeAutocomplete } from './main.js';

export const initStockAnalysis = () => {
  const searchBtn = document.getElementById('search-btn');
  const searchInput = document.getElementById('stock-search');
  
  // Initialize autocomplete
  initializeAutocomplete(searchInput, (selectedStock) => {
    loadStockDetails(selectedStock.symbol);
  });
  
  searchBtn.addEventListener('click', () => {
    const symbol = searchInput.value.trim().toUpperCase();
    if (symbol) {
      loadStockDetails(symbol);
    }
  });
  
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const symbol = searchInput.value.trim().toUpperCase();
      if (symbol) {
        loadStockDetails(symbol);
      }
    }
  });
};

const loadStockDetails = async (symbol) => {
  try {
    // Show loading state
    document.getElementById('stock-details').classList.remove('hidden');
    document.getElementById('price-info').innerHTML = '<div class="loading"></div>';
    document.getElementById('financial-ratios').innerHTML = '<div class="loading"></div>';
    
    // Fetch stock data
    const response = await fetch(`/api/stocks/${symbol}`);
    
    if (!response.ok) {
      throw new Error('Stock not found');
    }
    
    const stock = await response.json();
    
    // Update stock header
    document.getElementById('stock-name').textContent = `${stock.Name} (${stock.Symbol})`;
    document.getElementById('stock-sector').textContent = stock.Sector;
    
    // Update price information
    document.getElementById('price-info').innerHTML = `
      <table>
        <tr>
          <td>Current Price</td>
          <td>${formatCurrency(parseFloat(stock.Price))}</td>
        </tr>
        <tr>
          <td>52 Week Range</td>
          <td>${formatCurrency(parseFloat(stock['52 Week Low']))} - ${formatCurrency(parseFloat(stock['52 Week High']))}</td>
        </tr>
        <tr>
          <td>Market Cap</td>
          <td>${formatMarketCap(parseFloat(stock['Market Cap']))}</td>
        </tr>
        <tr>
          <td>EBITDA</td>
          <td>${formatMarketCap(parseFloat(stock.EBITDA))}</td>
        </tr>
      </table>
    `;
    
    // Update financial ratios
    document.getElementById('financial-ratios').innerHTML = `
      <table>
        <tr>
          <td>P/E Ratio</td>
          <td>${formatNumber(parseFloat(stock['Price/Earnings']))}</td>
        </tr>
        <tr>
          <td>Earnings Per Share</td>
          <td>${formatCurrency(parseFloat(stock['Earnings/Share']))}</td>
        </tr>
        <tr>
          <td>Dividend Yield</td>
          <td>${formatPercent(parseFloat(stock['Dividend Yield']))}</td>
        </tr>
        <tr>
          <td>Price/Sales</td>
          <td>${formatNumber(parseFloat(stock['Price/Sales']))}</td>
        </tr>
        <tr>
          <td>Price/Book</td>
          <td>${formatNumber(parseFloat(stock['Price/Book']))}</td>
        </tr>
      </table>
    `;
    
    // Create mock historical data for demonstration
    createMockHistoricalChart(symbol, stock.Price);
    
    // Create mock comparative analysis
    createMockComparativeChart(symbol, stock.Sector);
    
  } catch (error) {
    showError(`Failed to load stock details: ${error.message}`);
    document.getElementById('stock-details').classList.remove('hidden');
    document.getElementById('price-info').innerHTML = '<p>Error loading stock data. Please check the symbol and try again.</p>';
    document.getElementById('financial-ratios').innerHTML = '';
    document.getElementById('stock-name').textContent = 'Stock Not Found';
    document.getElementById('stock-sector').textContent = '';
  }
};

const createMockHistoricalChart = (symbol, currentPrice) => {
  const ctx = document.getElementById('stock-history-chart').getContext('2d');
  
  // Clear previous chart if it exists
  if (window.historyChart) {
    window.historyChart.destroy();
  }
  
  // Generate mock historical data (last 12 months)
  const labels = [];
  const data = [];
  const currentDate = new Date();
  const basePrice = parseFloat(currentPrice);
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(currentDate);
    date.setMonth(currentDate.getMonth() - i);
    labels.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    
    // Generate a somewhat realistic price movement
    const volatility = 0.05; // 5% monthly volatility
    const randomChange = (Math.random() - 0.5) * 2 * volatility;
    const monthlyReturn = -0.1 + i * 0.02 + randomChange; // Trending upward over time
    
    if (i === 11) {
      // For the current month, use the actual price
      data.push(basePrice);
    } else {
      // For previous months, calculate based on the next month's price
      data.unshift(data[0] / (1 + monthlyReturn));
    }
  }
  
  // Create chart
  window.historyChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: `${symbol} Price History`,
        data: data,
        borderColor: 'rgba(52, 152, 219, 1)',
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
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
              return `Price: ${formatCurrency(context.raw)}`;
            }
          }
        }
      }
    }
  });
};

const createMockComparativeChart = async (symbol, sector) => {
  try {
    const ctx = document.getElementById('comparative-chart').getContext('2d');
    
    // Clear previous chart if it exists
    if (window.comparativeChart) {
      window.comparativeChart.destroy();
    }
    
    // Fetch sector data to find comparable companies
    const response = await fetch('/api/sectors');
    const sectors = await response.json();
    
    if (!sectors[sector] || !sectors[sector].stocks) {
      throw new Error('Sector data not available');
    }
    
    // Get up to 4 other companies in the same sector
    const sectorStocks = sectors[sector].stocks
      .filter(stock => stock.Symbol !== symbol)
      .slice(0, 4);
    
    // Add the current stock
    const currentStock = sectors[sector].stocks.find(stock => stock.Symbol === symbol);
    if (currentStock) {
      sectorStocks.unshift(currentStock);
    }
    
    // Generate mock performance data (relative to sector average)
    const labels = ['1M', '3M', '6M', 'YTD', '1Y'];
    const datasets = sectorStocks.map((stock, index) => {
      // Generate random performance data
      const data = labels.map((period, i) => {
        const baseReturn = (i + 1) * 2; // Base return increases with time period
        const stockSpecificFactor = (index === 0) ? 1.2 : 0.8 + Math.random() * 0.8; // Current stock slightly outperforms
        return baseReturn * stockSpecificFactor;
      });
      
      return {
        label: stock.Symbol,
        data: data,
        borderColor: getRandomColors(1)[0].replace('0.7', '1'),
        backgroundColor: getRandomColors(1)[0],
        borderWidth: index === 0 ? 3 : 2 // Make current stock line thicker
      };
    });
    
    // Add sector average
    datasets.push({
      label: 'Sector Avg',
      data: labels.map((period, i) => (i + 1) * 2),
      borderColor: 'rgba(0, 0, 0, 0.7)',
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      borderWidth: 2,
      borderDash: [5, 5]
    });
    
    // Create chart
    window.comparativeChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Return (%)'
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.raw.toFixed(2)}%`;
              }
            }
          }
        }
      }
    });
  } catch (error) {
    showError('Failed to load comparative analysis');
    document.getElementById('comparative-chart').parentElement.innerHTML = '<p>Error loading comparative data</p>';
  }
};

// Helper function for formatting numbers
const formatNumber = (value, decimals = 2) => {
  if (!value || isNaN(value)) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};
