import { formatCurrency, formatPercent, formatMarketCap, getRandomColors, showError } from './main.js';

export const initSectorAnalysis = () => {
  loadSectors();
  
  // Add event listener to sector select dropdown
  const sectorSelect = document.getElementById('sector-select');
  sectorSelect.addEventListener('change', () => {
    const selectedSector = sectorSelect.value;
    if (selectedSector) {
      loadSectorDetails(selectedSector);
    }
  });
};

const loadSectors = async () => {
  try {
    const response = await fetch('/api/sectors');
    const sectors = await response.json();
    
    // Populate sector dropdown
    const sectorSelect = document.getElementById('sector-select');
    sectorSelect.innerHTML = '<option value="">Select a sector</option>';
    
    Object.keys(sectors).sort().forEach(sector => {
      const option = document.createElement('option');
      option.value = sector;
      option.textContent = `${sector} (${sectors[sector].count} companies)`;
      sectorSelect.appendChild(option);
    });
  } catch (error) {
    showError('Failed to load sectors');
    document.getElementById('sector-select').innerHTML = '<option value="">Error loading sectors</option>';
  }
};

const loadSectorDetails = async (sectorName) => {
  try {
    const response = await fetch('/api/sectors');
    const sectors = await response.json();
    
    const sectorData = sectors[sectorName];
    if (!sectorData) {
      throw new Error('Sector data not found');
    }
    
    // Update sector overview
    document.getElementById('sector-overview').innerHTML = `
      <table>
        <tr>
          <td>Number of Companies</td>
          <td>${sectorData.count}</td>
        </tr>
        <tr>
          <td>Total Market Cap</td>
          <td>${formatMarketCap(sectorData.totalMarketCap)}</td>
        </tr>
        <tr>
          <td>Average P/E Ratio</td>
          <td>${formatNumber(sectorData.avgPE)}</td>
        </tr>
        <tr>
          <td>Average Dividend Yield</td>
          <td>${formatPercent(sectorData.avgDividendYield)}</td>
        </tr>
      </table>
    `;
    
    // Update top companies
    const topCompanies = sectorData.stocks.slice(0, 10); // Get top 10 by market cap
    document.getElementById('sector-top-companies').innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Name</th>
            <th>Price</th>
            <th>Market Cap</th>
          </tr>
        </thead>
        <tbody>
          ${topCompanies.map(company => `
            <tr>
              <td>${company.Symbol}</td>
              <td>${company.Name}</td>
              <td>${formatCurrency(company.Price)}</td>
              <td>${formatMarketCap(company.MarketCap)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    
    // Create sector metrics chart
    createSectorMetricsChart(sectorData);
    
    // Create sector comparison chart
    createSectorComparisonChart(sectorName, sectors);
    
  } catch (error) {
    showError(`Failed to load sector details: ${error.message}`);
    document.getElementById('sector-overview').innerHTML = '<p>Error loading sector data</p>';
    document.getElementById('sector-top-companies').innerHTML = '<p>Error loading sector data</p>';
  }
};

const createSectorMetricsChart = (sectorData) => {
  const ctx = document.getElementById('sector-metrics-chart').getContext('2d');
  
  // Clear previous chart if it exists
  if (window.sectorMetricsChart) {
    window.sectorMetricsChart.destroy();
  }
  
  // Get top 10 companies by market cap
  const topCompanies = sectorData.stocks.slice(0, 10);
  
  // Create chart
  window.sectorMetricsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: topCompanies.map(company => company.Symbol),
      datasets: [{
        label: 'Market Cap (in billions)',
        data: topCompanies.map(company => company.MarketCap / 1000000000), // Convert to billions
        backgroundColor: getRandomColors(topCompanies.length),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Market Cap ($ Billions)'
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
              return `Market Cap: $${context.raw.toFixed(2)}B`;
            }
          }
        }
      }
    }
  });
};

const createSectorComparisonChart = (sectorName, allSectors) => {
  const ctx = document.getElementById('sector-comparison-chart').getContext('2d');
  
  // Clear previous chart if it exists
  if (window.sectorComparisonChart) {
    window.sectorComparisonChart.destroy();
  }
  
  // Calculate average metrics for all sectors
  const sectorMetrics = [];
  const labels = ['Avg P/E Ratio', 'Avg Dividend Yield (%)', 'Avg Market Cap ($B)'];
  
  // Get current sector data
  const currentSector = allSectors[sectorName];
  const currentSectorData = [
    currentSector.avgPE,
    currentSector.avgDividendYield * 100, // Convert to percentage
    currentSector.totalMarketCap / currentSector.count / 1000000000 // Average market cap in billions
  ];
  
  // Calculate average for all sectors
  let totalPE = 0;
  let totalDividendYield = 0;
  let totalAvgMarketCap = 0;
  let sectorCount = 0;
  
  Object.values(allSectors).forEach(sector => {
    totalPE += sector.avgPE;
    totalDividendYield += sector.avgDividendYield;
    totalAvgMarketCap += sector.totalMarketCap / sector.count;
    sectorCount++;
  });
  
  const allSectorsData = [
    totalPE / sectorCount,
    (totalDividendYield / sectorCount) * 100, // Convert to percentage
    totalAvgMarketCap / sectorCount / 1000000000 // Average market cap in billions
  ];
  
  // Create chart
  window.sectorComparisonChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: labels,
      datasets: [
        {
          label: sectorName,
          data: currentSectorData,
          backgroundColor: 'rgba(52, 152, 219, 0.2)',
          borderColor: 'rgba(52, 152, 219, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(52, 152, 219, 1)'
        },
        {
          label: 'All Sectors Average',
          data: allSectorsData,
          backgroundColor: 'rgba(231, 76, 60, 0.2)',
          borderColor: 'rgba(231, 76, 60, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(231, 76, 60, 1)'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          angleLines: {
            display: true
          },
          suggestedMin: 0
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.raw || 0;
              const index = context.dataIndex;
              
              if (index === 0) {
                return `${label}: ${value.toFixed(2)} P/E`;
              } else if (index === 1) {
                return `${label}: ${value.toFixed(2)}%`;
              } else {
                return `${label}: $${value.toFixed(2)}B`;
              }
            }
          }
        }
      }
    }
  });
};

// Helper function for formatting numbers
const formatNumber = (value, decimals = 2) => {
  if (!value || isNaN(value)) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};
