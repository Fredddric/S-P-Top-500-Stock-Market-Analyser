// Import required utilities
import { formatCurrency, formatPercent, formatMarketCap, formatNumber, getRandomColors, showError } from './main.js';
import { fetchMarketSummary, fetchTopPerformers, fetchMarketCapDistribution } from './api.js';

// Initialize dashboard components
export const initDashboard = () => {
  loadMarketSummary();
  loadTopPerformers();
  loadSectorPerformance();
  loadMarketCapDistribution();
};

// Function to load market summary data
const loadMarketSummary = async () => {
  try {
    // Show loading state
    const marketSummaryElement = document.getElementById('market-summary');
    if (!marketSummaryElement) {
      throw new Error('Market summary element not found');
    }
    
    marketSummaryElement.innerHTML = `
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p>Loading market data...</p>
      </div>
    `;
    
    // Fetch market summary data from Alpha Vantage API
    const marketData = await fetchMarketSummary();
    
    // Format the market summary display
    const advanceDeclineRatio = (marketData.marketBreadth.advances / (marketData.marketBreadth.declines || 1)).toFixed(2);
    
    // Update market summary content with actual data from Alpha Vantage
    marketSummaryElement.innerHTML = `
      <div class="market-stats">
        <div class="stat-item">
          <span class="stat-label">S&P 500 Index:</span>
          <span class="stat-value ${marketData.spxIndex.change >= 0 ? 'positive-change' : 'negative-change'}">
            ${formatNumber(marketData.spxIndex.price)}
            <span class="change-indicator">
              ${marketData.spxIndex.change >= 0 ? '▲' : '▼'} 
              ${formatNumber(Math.abs(marketData.spxIndex.change))} 
              (${formatPercent(Math.abs(marketData.spxIndex.changePercent) / 100)})
            </span>
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Trading Volume:</span>
          <span class="stat-value">${formatNumber(marketData.spxIndex.volume)}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Range:</span>
          <span class="stat-value">${formatNumber(marketData.spxIndex.low)} - ${formatNumber(marketData.spxIndex.high)}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Prev Close:</span>
          <span class="stat-value">${formatNumber(marketData.spxIndex.previousClose)}</span>
        </div>
      </div>
      <div class="market-breadth">
        <h4>Market Breadth</h4>
        <div class="breadth-stats">
          <div class="stat-item">
            <span class="stat-label">Advancing Stocks:</span>
            <span class="stat-value positive-change">${marketData.marketBreadth.advances}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Declining Stocks:</span>
            <span class="stat-value negative-change">${marketData.marketBreadth.declines}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Advance/Decline Ratio:</span>
            <span class="stat-value">${advanceDeclineRatio}</span>
          </div>
        </div>
      </div>
      ${marketData.dataSource ? `
      <div class="data-source">
        <small>Data source: ${Object.values(marketData.dataSource).join(', ')}</small>
      </div>
      ` : ''}
      <div class="last-update">
        <small>Last updated: ${new Date(marketData.timestamp).toLocaleString()}</small>
      </div>
    `;
  } catch (error) {
    console.error('Error loading market summary:', error);
    document.getElementById('market-summary').innerHTML = `
      <div class="error-message">
        <p>Failed to load market data. Please try again later.</p>
        <p class="error-details">${error.message}</p>
      </div>
    `;
  }
};

const loadTopPerformers = async () => {
  try {
    // Show loading indicator
    const performersElement = document.getElementById('top-performers');
    if (!performersElement) {
      throw new Error('Top performers element not found');
    }
    
    performersElement.innerHTML = `
      <div class="loading-indicator">
        <div class="spinner"></div>
        <p>Loading top performers data...</p>
      </div>
    `;
    
    // Get real-time top performers data from Alpha Vantage
    const performersData = await fetchTopPerformers();
    const { topGainers, topLosers, mostActive } = performersData;
    
    // Create tabs HTML
    performersElement.innerHTML = `
      <div class="tabs">
        <button class="tab-btn active" data-tab="gainers">Top Gainers</button>
        <button class="tab-btn" data-tab="losers">Top Losers</button>
        <button class="tab-btn" data-tab="active">Most Active</button>
      </div>
      
      <div class="tab-content-container">
        <div class="tab-content active" id="gainers">
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th>Price</th>
                <th>Change</th>
                <th>% Change</th>
              </tr>
            </thead>
            <tbody>
              ${topGainers.map(stock => `
                <tr>
                  <td>${stock.Symbol}</td>
                  <td>${stock.Name}</td>
                  <td>${formatCurrency(stock.Price)}</td>
                  <td class="positive-change">+${formatCurrency(stock.Change)}</td>
                  <td class="positive-change">+${formatPercent(stock.ChangePercent)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="tab-content" id="losers">
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th>Price</th>
                <th>Change</th>
                <th>% Change</th>
              </tr>
            </thead>
            <tbody>
              ${topLosers.map(stock => `
                <tr>
                  <td>${stock.Symbol}</td>
                  <td>${stock.Name}</td>
                  <td>${formatCurrency(stock.Price)}</td>
                  <td class="negative-change">${formatCurrency(stock.Change)}</td>
                  <td class="negative-change">${formatPercent(stock.ChangePercent)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="tab-content" id="active">
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th>Price</th>
                <th>Change</th>
                <th>Volume</th>
              </tr>
            </thead>
            <tbody>
              ${mostActive.map(stock => `
                <tr>
                  <td>${stock.Symbol}</td>
                  <td>${stock.Name}</td>
                  <td>${formatCurrency(stock.Price)}</td>
                  <td class="${stock.Change >= 0 ? 'positive-change' : 'negative-change'}">
                    ${stock.Change >= 0 ? '+' : ''}${formatCurrency(stock.Change)}
                  </td>
                  <td>${formatNumber(stock.Volume)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="last-update">
        <small>Last updated: ${new Date().toLocaleString()}</small>
      </div>
    `;
    
    // Add tab switching functionality
    const tabBtns = performersElement.querySelectorAll('.tab-btn');
    const tabContents = performersElement.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove active class from all buttons and contents
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked button
        btn.classList.add('active');
        
        // Show corresponding content
        const tabId = btn.getAttribute('data-tab');
        const tabContent = document.getElementById(tabId);
        if (tabContent) {
          tabContent.classList.add('active');
        }
      });
    });
  } catch (error) {
    console.error('Failed to load top performers:', error);
    showError('Failed to load top performers');
    document.getElementById('top-performers').innerHTML = '<p>Error loading top performers. Please try again later.</p>';
  }
};

const loadSectorPerformance = async () => {
  try {
    // Show loading indicator
    const sectorPerformanceElement = document.getElementById('sector-performance');
    if (sectorPerformanceElement) {
      sectorPerformanceElement.innerHTML = `
        <div class="loading-indicator">
          <div class="spinner"></div>
          <p>Loading sector performance data...</p>
        </div>
      `;
    }
    
    // Fetch market summary data which includes sector performance
    const marketData = await fetchMarketSummary();
    const { sectorPerformance } = marketData;
    
    // Sort sectors by performance (descending)
    const sortedSectors = [...sectorPerformance].sort((a, b) => b.change - a.change);
    
    // Prepare data for chart
    const sectorNames = sortedSectors.map(item => item.sector);
    const performances = sortedSectors.map(item => item.change);
    
    // Generate colors based on performance (green for positive, red for negative)
    const backgroundColors = performances.map(perf => 
      perf >= 0 ? 'rgba(76, 175, 80, 0.8)' : 'rgba(244, 67, 54, 0.8)'
    );
    
    const ctx = document.getElementById('sector-performance-chart')?.getContext('2d');
    if (!ctx) {
      throw new Error('Sector performance chart canvas not found');
    }
    
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sectorNames,
        datasets: [{
          label: 'Performance (%)',
          data: performances,
          backgroundColor: backgroundColors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',  // Horizontal bar chart
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Performance (%)'
            },
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw;
                return `Performance: ${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
              }
            }
          }
        }
      }
    });
    
    // Add timestamp and data source
    if (sectorPerformanceElement) {
      const infoDiv = document.createElement('div');
      infoDiv.className = 'chart-info';
      
      if (marketData.dataSource && marketData.dataSource.sectors) {
        infoDiv.innerHTML = `
          <div class="data-source">
            <small>Data source: ${marketData.dataSource.sectors}</small>
          </div>
          <div class="last-update">
            <small>Last updated: ${new Date(marketData.timestamp).toLocaleString()}</small>
          </div>
        `;
      } else {
        infoDiv.innerHTML = `
          <div class="last-update">
            <small>Last updated: ${new Date().toLocaleString()}</small>
          </div>
        `;
      }
      
      sectorPerformanceElement.appendChild(infoDiv);
    }
  } catch (error) {
    console.error('Failed to load sector performance:', error);
    document.getElementById('sector-performance').innerHTML = `
      <div class="error-message">
        <p>Failed to load sector performance data. Please try again later.</p>
        <p class="error-details">${error.message}</p>
      </div>
    `;
  }
};

const loadMarketCapDistribution = async () => {
  try {
    // Show loading indicator
    const marketCapElement = document.getElementById('market-cap-distribution');
    if (marketCapElement) {
      marketCapElement.innerHTML = `
        <div class="loading-indicator">
          <div class="spinner"></div>
          <p>Loading market cap distribution data...</p>
        </div>
      `;
    }
    
    // Fetch market cap distribution data
    const { categories, timestamp } = await fetchMarketCapDistribution();
    
    const ctx = document.getElementById('market-cap-chart')?.getContext('2d');
    if (!ctx) {
      throw new Error('Market cap chart canvas not found');
    }
    
    // Prepare chart data
    const labels = Object.keys(categories);
    const data = Object.values(categories);
    
    // Define colors for each category
    const colors = [
      'rgba(76, 175, 80, 0.8)',   // Mega Cap (green)
      'rgba(33, 150, 243, 0.8)',  // Large Cap (blue)
      'rgba(255, 193, 7, 0.8)',   // Mid Cap (yellow)
      'rgba(255, 152, 0, 0.8)',   // Small Cap (orange)
      'rgba(244, 67, 54, 0.8)'    // Micro Cap (red)
    ];
    
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: {
                size: 11
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${value} companies (${percentage}%)`;
              }
            }
          }
        }
      }
    });
    
    // Add timestamp
    if (marketCapElement) {
      const timestampDiv = document.createElement('div');
      timestampDiv.className = 'last-update';
      timestampDiv.innerHTML = `<small>Last updated: ${new Date(timestamp).toLocaleString()}</small>`;
      marketCapElement.appendChild(timestampDiv);
    }
  } catch (error) {
    console.error('Failed to load market cap distribution:', error);
    showError('Failed to load market cap distribution');
    document.getElementById('market-cap-distribution').innerHTML = '<p>Error loading market cap distribution. Please try again later.</p>';
  }
};
