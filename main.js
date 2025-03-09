import { initDashboard } from './dashboard.js';
import { initStockAnalysis } from './stockAnalysis.js';
import { initSectorAnalysis } from './sectorAnalysis.js';
import { initPrediction } from './prediction.js';
import { initPortfolio } from './portfolio.js';
import { fetchStockSymbols } from './api.js';

// Navigation functionality
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all modules
  initDashboard();
  initStockAnalysis();
  initSectorAnalysis();
  initPrediction();
  initPortfolio();

  // Navigation handling
  const navLinks = document.querySelectorAll('nav a');
  const sections = document.querySelectorAll('main section');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Remove active class from all links and sections
      navLinks.forEach(link => link.classList.remove('active'));
      sections.forEach(section => section.classList.remove('active'));
      
      // Add active class to clicked link
      link.classList.add('active');
      
      // Show corresponding section
      const sectionId = link.getAttribute('data-section');
      document.getElementById(sectionId).classList.add('active');
    });
  });
});

// Utility functions
export const formatCurrency = (value) => {
  if (!value || isNaN(value)) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const formatNumber = (value, decimals = 2) => {
  if (!value || isNaN(value)) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

export const formatPercent = (value) => {
  if (!value || isNaN(value)) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const formatMarketCap = (value) => {
  if (!value || isNaN(value)) return 'N/A';
  
  const billion = 1000000000;
  const million = 1000000;
  
  if (value >= billion) {
    return `$${(value / billion).toFixed(2)}B`;
  } else if (value >= million) {
    return `$${(value / million).toFixed(2)}M`;
  } else {
    return `$${value.toFixed(2)}`;
  }
};

export const getRandomColors = (count) => {
  const colors = [
    'rgba(52, 152, 219, 0.7)', // Blue
    'rgba(46, 204, 113, 0.7)', // Green
    'rgba(231, 76, 60, 0.7)',  // Red
    'rgba(241, 196, 15, 0.7)', // Yellow
    'rgba(155, 89, 182, 0.7)', // Purple
    'rgba(52, 73, 94, 0.7)',   // Dark Blue
    'rgba(230, 126, 34, 0.7)', // Orange
    'rgba(26, 188, 156, 0.7)', // Turquoise
    'rgba(236, 240, 241, 0.7)', // Light Gray
    'rgba(149, 165, 166, 0.7)'  // Gray
  ];
  
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }
  
  return result;
};

// Autocomplete functionality
export const initializeAutocomplete = async (inputElement, onSelectCallback) => {
  if (!inputElement) return;
  
  // Create autocomplete container
  const autocompleteContainer = document.createElement('div');
  autocompleteContainer.className = 'autocomplete-items';
  autocompleteContainer.style.display = 'none';
  inputElement.parentNode.style.position = 'relative';
  inputElement.parentNode.appendChild(autocompleteContainer);
  
  // Fetch all stock symbols once
  const stockData = await fetchStockSymbols();
  
  // Function to filter and display matching stocks
  const showMatches = (inputValue) => {
    // Clear previous results
    autocompleteContainer.innerHTML = '';
    autocompleteContainer.style.display = 'none';
    
    if (!inputValue) return;
    
    const inputLower = inputValue.toLowerCase();
    const matches = stockData.filter(stock => 
      stock.symbol.toLowerCase().includes(inputLower) || 
      stock.name.toLowerCase().includes(inputLower)
    ).slice(0, 10); // Limit to 10 results
    
    if (matches.length === 0) return;
    
    // Show the container
    autocompleteContainer.style.display = 'block';
    
    // Add matching items
    matches.forEach(stock => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      
      // Bold the matching text
      const symbolMatch = stock.symbol.toLowerCase().includes(inputLower);
      const nameMatch = stock.name.toLowerCase().includes(inputLower);
      
      let html = `<span class="symbol">${stock.symbol}</span>`;
      if (nameMatch) {
        html += ` - <span class="name">${highlightMatch(stock.name, inputLower)}</span>`;
      } else {
        html += ` - <span class="name">${stock.name}</span>`;
      }
      
      if (stock.sector) {
        html += ` <span class="sector">(${stock.sector})</span>`;
      }
      
      item.innerHTML = html;
      
      // Add click event
      item.addEventListener('click', () => {
        inputElement.value = stock.symbol;
        autocompleteContainer.style.display = 'none';
        
        if (typeof onSelectCallback === 'function') {
          onSelectCallback(stock);
        }
      });
      
      autocompleteContainer.appendChild(item);
    });
  };
  
  // Function to highlight matching text
  const highlightMatch = (text, match) => {
    const regex = new RegExp(`(${match})`, 'gi');
    return text.replace(regex, '<strong>$1</strong>');
  };
  
  // Input event listeners
  inputElement.addEventListener('input', () => {
    showMatches(inputElement.value);
  });
  
  inputElement.addEventListener('focus', () => {
    if (inputElement.value.length > 0) {
      showMatches(inputElement.value);
    }
  });
  
  // Close autocomplete when clicking outside
  document.addEventListener('click', (e) => {
    if (e.target !== inputElement && e.target !== autocompleteContainer) {
      autocompleteContainer.style.display = 'none';
    }
  });
  
  // Handle keyboard navigation
  inputElement.addEventListener('keydown', (e) => {
    const items = autocompleteContainer.querySelectorAll('.autocomplete-item');
    if (!items.length) return;
    
    const active = autocompleteContainer.querySelector('.autocomplete-active');
    
    // Down arrow
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!active) {
        items[0].classList.add('autocomplete-active');
      } else {
        const next = [...items].indexOf(active) + 1;
        if (next < items.length) {
          active.classList.remove('autocomplete-active');
          items[next].classList.add('autocomplete-active');
        }
      }
    } 
    // Up arrow
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (active) {
        const prev = [...items].indexOf(active) - 1;
        if (prev >= 0) {
          active.classList.remove('autocomplete-active');
          items[prev].classList.add('autocomplete-active');
        }
      }
    } 
    // Enter key
    else if (e.key === 'Enter') {
      if (active) {
        e.preventDefault();
        active.click();
      }
    }
  });
};

// Error handling
export const showError = (message) => {
  console.error(message);
  // You could implement a UI toast/notification system here
};
