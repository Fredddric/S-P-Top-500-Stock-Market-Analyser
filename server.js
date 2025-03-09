const express = require('express');
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const axios = require('axios');

const app = express();
const PORT = 3000;

// Alpha Vantage API key
const ALPHA_VANTAGE_API_KEY = '745U1UG168YMOD58';

// Serve static files
app.use(express.static('public'));
app.use(express.json());

// Endpoint to get all stock symbols for autocomplete
app.get('/api/stocks/autocomplete', async (req, res) => {
  try {
    // Read the local data file containing stock information
    const financialsData = await fs.promises.readFile('./data/financials.csv', 'utf8');
    const parsedData = Papa.parse(financialsData, {
      header: true,
      skipEmptyLines: true
    }).data;
    
    // Extract only the necessary fields for autocomplete
    const autocompleteData = parsedData.map(stock => ({
      Symbol: stock.Symbol,
      Name: stock.Name,
      Sector: stock.Sector
    }));
    
    res.json(autocompleteData);
  } catch (error) {
    console.error('Error serving stock symbols:', error);
    res.status(500).json({ error: 'Failed to retrieve stock symbols' });
  }
});

// API endpoint to get all stock symbols and names
app.get('/api/stocks', (req, res) => {
  try {
    const constituentsData = fs.readFileSync(path.join(__dirname, 'constituents.csv'), 'utf8');
    const parsed = Papa.parse(constituentsData, { header: true });
    res.json(parsed.data);
  } catch (error) {
    console.error('Error reading constituents file:', error);
    res.status(500).json({ error: 'Failed to load stock data' });
  }
});

// API endpoint to get detailed financial data for a specific stock
app.get('/api/stocks/:symbol', (req, res) => {
  try {
    const symbol = req.params.symbol;
    const financialsData = fs.readFileSync(path.join(__dirname, 'constituents-financials.csv'), 'utf8');
    const parsed = Papa.parse(financialsData, { header: true });
    
    const stockData = parsed.data.find(stock => stock.Symbol === symbol);
    
    if (stockData) {
      res.json(stockData);
    } else {
      res.status(404).json({ error: 'Stock not found' });
    }
  } catch (error) {
    console.error('Error reading financials file:', error);
    res.status(500).json({ error: 'Failed to load stock data' });
  }
});

// API endpoint to get all financial data
app.get('/api/financials', (req, res) => {
  try {
    const financialsData = fs.readFileSync(path.join(__dirname, 'constituents-financials.csv'), 'utf8');
    const parsed = Papa.parse(financialsData, { header: true });
    res.json(parsed.data);
  } catch (error) {
    console.error('Error reading financials file:', error);
    res.status(500).json({ error: 'Failed to load financial data' });
  }
});

// API endpoint to get sector-based analysis
app.get('/api/sectors', (req, res) => {
  try {
    const financialsData = fs.readFileSync(path.join(__dirname, 'constituents-financials.csv'), 'utf8');
    const parsed = Papa.parse(financialsData, { header: true });
    
    // Group by sector
    const sectors = {};
    parsed.data.forEach(stock => {
      if (!stock.Sector) return;
      
      if (!sectors[stock.Sector]) {
        sectors[stock.Sector] = {
          count: 0,
          totalMarketCap: 0,
          avgPE: 0,
          avgDividendYield: 0,
          stocks: []
        };
      }
      
      const marketCap = parseFloat(stock['Market Cap']) || 0;
      const pe = parseFloat(stock['Price/Earnings']) || 0;
      const dividendYield = parseFloat(stock['Dividend Yield']) || 0;
      
      sectors[stock.Sector].count++;
      sectors[stock.Sector].totalMarketCap += marketCap;
      sectors[stock.Sector].avgPE += pe;
      sectors[stock.Sector].avgDividendYield += dividendYield;
      sectors[stock.Sector].stocks.push({
        Symbol: stock.Symbol,
        Name: stock.Name,
        Price: parseFloat(stock.Price) || 0,
        MarketCap: marketCap
      });
    });
    
    // Calculate averages
    Object.keys(sectors).forEach(sector => {
      if (sectors[sector].count > 0) {
        sectors[sector].avgPE = sectors[sector].avgPE / sectors[sector].count;
        sectors[sector].avgDividendYield = sectors[sector].avgDividendYield / sectors[sector].count;
      }
      // Sort stocks by market cap
      sectors[sector].stocks.sort((a, b) => b.MarketCap - a.MarketCap);
    });
    
    res.json(sectors);
  } catch (error) {
    console.error('Error analyzing sectors:', error);
    res.status(500).json({ error: 'Failed to analyze sector data' });
  }
});

// In-memory cache for Alpha Vantage responses
const alphaVantageCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

// Proxy endpoint for Alpha Vantage API
app.get('/api/alpha-vantage', async (req, res) => {
  try {
    const { function: func, symbol, interval, outputsize, tickers } = req.query;
    
    if (!func) {
      return res.status(400).json({ error: 'Function parameter is required' });
    }
    
    // Create a cache key based on the request parameters
    const cacheKey = JSON.stringify(req.query);
    
    // Check if we have a cached response
    const cachedResponse = alphaVantageCache.get(cacheKey);
    if (cachedResponse && (Date.now() - cachedResponse.timestamp < CACHE_DURATION)) {
      console.log(`Serving cached Alpha Vantage data for: ${func} ${symbol || ''}`);
      return res.json(cachedResponse.data);
    }
    
    // Build Alpha Vantage URL with all query parameters
    let url = `https://www.alphavantage.co/query?function=${func}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    
    // Add additional parameters if they exist
    if (symbol) url += `&symbol=${symbol}`;
    if (interval) url += `&interval=${interval}`;
    if (outputsize) url += `&outputsize=${outputsize}`;
    if (tickers) url += `&tickers=${tickers}`;
    
    console.log(`Requesting Alpha Vantage data for: ${func} ${symbol || ''}`);
    
    // Make request to Alpha Vantage
    const response = await axios.get(url, { 
      timeout: 10000,  // 10-second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    // Check if the response contains an error message from Alpha Vantage
    if (response.data && typeof response.data === 'object') {
      if (response.data['Error Message']) {
        throw new Error(response.data['Error Message']);
      }
      if (response.data['Information'] && response.data['Information'].includes('API call frequency')) {
        throw new Error('Alpha Vantage API call frequency exceeded. Please try again later.');
      }
      // For sector data, validate structure
      if (func === 'SECTOR' && !response.data['Rank A: Real-Time Performance']) {
        throw new Error('Invalid sector data structure received from Alpha Vantage');
      }
    }
    
    // Cache the successful response
    alphaVantageCache.set(cacheKey, {
      timestamp: Date.now(),
      data: response.data
    });
    
    // Forward the response to the client
    res.json(response.data);
  } catch (error) {
    console.error('Error proxying Alpha Vantage request:', error.message);
    
    // If it's a timeout error, provide a more specific message
    const errorMessage = error.code === 'ECONNABORTED' 
      ? 'Request to Alpha Vantage timed out. Please try again later.'
      : error.message;
    
    res.status(500).json({
      error: 'Failed to fetch data from Alpha Vantage',
      message: errorMessage
    });
  }
});

// Serve the main app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
