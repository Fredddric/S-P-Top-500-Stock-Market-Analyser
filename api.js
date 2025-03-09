// This file contains functions for fetching external stock data from Alpha Vantage API

// Server proxy endpoint for Alpha Vantage
const API_PROXY_URL = '/api/alpha-vantage';

// Function to fetch historical stock data
export const fetchHistoricalData = async (symbol, period = '1y') => {
  try {
    console.log(`Fetching historical data for ${symbol} over ${period}`);
    
    // Determine the function and interval based on period
    let timeSeriesFunction;
    let interval = '';
    
    switch (period) {
      case '1d':
        timeSeriesFunction = 'TIME_SERIES_INTRADAY';
        interval = '5min';
        break;
      case '1w':
        timeSeriesFunction = 'TIME_SERIES_DAILY';
        break;
      case '1m':
      case '3m':
      case '6m':
      case '1y':
        timeSeriesFunction = 'TIME_SERIES_DAILY';
        break;
      case '5y':
        timeSeriesFunction = 'TIME_SERIES_WEEKLY';
        break;
      default:
        timeSeriesFunction = 'TIME_SERIES_DAILY';
    }
    
    // Construct API URL using our proxy
    let url = `${API_PROXY_URL}?function=${timeSeriesFunction}&symbol=${symbol}`;
    if (interval) {
      url += `&interval=${interval}`;
    }
    url += '&outputsize=full';
    
    // Make API request
    const response = await fetch(url);
    const data = await response.json();
    
    // Parse response data
    const formattedData = parseHistoricalData(data, timeSeriesFunction);
    
    // Return formatted data
    return formattedData;
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return generateMockHistoricalData(symbol, period);
  }
};

// Helper function to parse historical data from Alpha Vantage
const parseHistoricalData = (data, timeSeriesFunction) => {
  const formattedData = [];
  
  // Get the correct time series key based on function
  let timeSeriesKey;
  switch (timeSeriesFunction) {
    case 'TIME_SERIES_INTRADAY':
      timeSeriesKey = 'Time Series (5min)';
      break;
    case 'TIME_SERIES_DAILY':
      timeSeriesKey = 'Time Series (Daily)';
      break;
    case 'TIME_SERIES_WEEKLY':
      timeSeriesKey = 'Weekly Time Series';
      break;
    default:
      timeSeriesKey = 'Time Series (Daily)';
  }
  
  // Check if we have data
  if (!data[timeSeriesKey]) {
    console.warn('No time series data found in API response');
    return formattedData;
  }
  
  // Parse each data point
  Object.entries(data[timeSeriesKey]).forEach(([date, values]) => {
    formattedData.push({
      date: date,
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume'], 10)
    });
  });
  
  // Sort by date (oldest to newest)
  formattedData.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  return formattedData;
};

// Function to generate mock historical data (used as fallback)
const generateMockHistoricalData = (symbol, period) => {
  const data = [];
  const today = new Date();
  let days;
  
  // Determine number of days based on period
  switch (period) {
    case '1m': days = 30; break;
    case '3m': days = 90; break;
    case '6m': days = 180; break;
    case '1y': days = 365; break;
    case '5y': days = 365 * 5; break;
    default: days = 365;
  }
  
  // Generate starting price (somewhat based on symbol to make it consistent)
  const symbolSum = symbol.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  let price = 50 + (symbolSum % 200); // Price between $50 and $250
  
  // Generate daily data
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    // Add some randomness to price movement
    const change = (Math.random() - 0.48) * 2; // Slightly biased upward
    price = Math.max(1, price * (1 + change / 100));
    
    // Calculate volume (random)
    const volume = Math.floor(Math.random() * 10000000) + 1000000;
    
    // Add data point
    data.push({
      date: date.toISOString().split('T')[0],
      open: price * (1 - Math.random() * 0.01),
      high: price * (1 + Math.random() * 0.02),
      low: price * (1 - Math.random() * 0.02),
      close: price,
      volume: volume
    });
  }
  
  return data;
};

// Function to fetch company profile (using OVERVIEW endpoint)
export const fetchCompanyProfile = async (symbol) => {
  try {
    console.log(`Fetching company profile for ${symbol}`);
    
    // Construct API URL for OVERVIEW endpoint using our proxy
    const url = `${API_PROXY_URL}?function=OVERVIEW&symbol=${symbol}`;
    
    // Make API request
    const response = await fetch(url);
    const data = await response.json();
    
    // Check if we have valid data
    if (!data || Object.keys(data).length === 0) {
      throw new Error('No company profile data returned');
    }
    
    // Return formatted profile
    return {
      symbol: data.Symbol,
      description: data.Description || `No description available for ${symbol}`,
      employees: parseInt(data.FullTimeEmployees || '0', 10),
      industry: data.Industry || 'Unknown',
      sector: data.Sector || 'Unknown',
      website: data.Website || `https://www.${symbol.toLowerCase()}.com`,
      ceo: data.CEO || 'Unknown',
      marketCap: parseFloat(data.MarketCapitalization || '0'),
      peRatio: parseFloat(data.PERatio || '0'),
      dividendYield: parseFloat(data.DividendYield || '0') * 100, // Convert to percentage
      eps: parseFloat(data.EPS || '0'),
      beta: parseFloat(data.Beta || '0'),
      fiftyTwoWeekHigh: parseFloat(data['52WeekHigh'] || '0'),
      fiftyTwoWeekLow: parseFloat(data['52WeekLow'] || '0')
    };
  } catch (error) {
    console.error('Error fetching company profile:', error);
    
    // Return mock profile as fallback
    return generateMockCompanyProfile(symbol);
  }
};

// Function to generate mock company profile (used as fallback)
const generateMockCompanyProfile = (symbol) => {
  // This would be replaced with real API data
  return {
    symbol: symbol,
    description: `${symbol} is a leading company in its industry, focused on innovation and growth. The company has a strong market position and continues to expand its product offerings.`,
    employees: Math.floor(Math.random() * 100000) + 1000,
    industry: 'Technology',
    sector: 'Information Technology',
    website: `https://www.${symbol.toLowerCase()}.com`,
    ceo: 'John Smith',
    marketCap: Math.floor(Math.random() * 1000000000000) + 1000000000,
    peRatio: (Math.random() * 30) + 5,
    dividendYield: (Math.random() * 5),
    eps: (Math.random() * 10) + 1,
    beta: (Math.random() * 2) + 0.5,
    fiftyTwoWeekHigh: 100 + Math.random() * 200,
    fiftyTwoWeekLow: 50 + Math.random() * 100
  };
};

// Function to fetch news for a stock using Alpha Vantage NEWS endpoint
export const fetchStockNews = async (symbol) => {
  try {
    console.log(`Fetching news for ${symbol}`);
    
    // Construct API URL for NEWS_SENTIMENT endpoint using our proxy
    const url = `${API_PROXY_URL}?function=NEWS_SENTIMENT&tickers=${symbol}`;
    
    // Make API request
    const response = await fetch(url);
    const data = await response.json();
    
    // Check if we have valid data
    if (!data || !data.feed || !Array.isArray(data.feed)) {
      throw new Error('No news data returned');
    }
    
    // Format news data
    const formattedNews = data.feed.map(item => ({
      headline: item.title,
      date: item.time_published.slice(0, 10), // Extract YYYY-MM-DD
      source: item.source,
      url: item.url,
      summary: item.summary,
      sentiment: item.overall_sentiment_label
    }));
    
    return formattedNews;
  } catch (error) {
    console.error('Error fetching stock news:', error);
    
    // Return mock news as fallback
    return generateMockNews(symbol);
  }
};

// Function to generate mock news (used as fallback)
const generateMockNews = (symbol) => {
  const headlines = [
    `${symbol} Reports Strong Quarterly Earnings`,
    `${symbol} Announces New Product Line`,
    `${symbol} CEO Discusses Future Growth Strategy`,
    `Analysts Upgrade ${symbol} Stock Rating`,
    `${symbol} Expands into New Markets`
  ];
  
  const news = [];
  const today = new Date();
  
  for (let i = 0; i < headlines.length; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i * 2);
    
    news.push({
      headline: headlines[i],
      date: date.toISOString().split('T')[0],
      source: ['Bloomberg', 'Reuters', 'CNBC', 'Wall Street Journal', 'Financial Times'][i],
      url: `https://example.com/news/${symbol.toLowerCase()}/${i}`,
      summary: `This is a mock summary for ${headlines[i]}. In a real application, this would contain actual news content.`,
      sentiment: ['Bullish', 'Somewhat-Bullish', 'Neutral', 'Somewhat-Bearish', 'Bearish'][Math.floor(Math.random() * 5)]
    });
  }
  
  return news;
};

// Function to fetch market summary data
export const fetchMarketSummary = async () => {
  try {
    console.log('Fetching market summary from Alpha Vantage');
    
    // Fetch S&P 500 Index data (using ^GSPC as the symbol)
    let spxData, gainerLosersData, sectorData;
    
    try {
      const spxResponse = await fetch(`${API_PROXY_URL}?function=GLOBAL_QUOTE&symbol=^GSPC`);
      spxData = await spxResponse.json();
      console.log('S&P 500 data response:', spxData);
    } catch (error) {
      console.error('Error fetching S&P 500 data:', error);
      spxData = null;
    }
    
    // Validate S&P 500 data
    let validSpxData = false;
    let spxQuote = {};
    
    if (spxData && spxData['Global Quote'] && Object.keys(spxData['Global Quote']).length > 0) {
      validSpxData = true;
      spxQuote = spxData['Global Quote'];
    } else {
      console.warn('Using mock S&P 500 data due to invalid API response');
      
      // Use mock data for S&P 500
      const mockData = generateMockMarketSummary();
      spxQuote = {
        '01. symbol': '^GSPC',
        '02. open': mockData.spxIndex.price.toString(),
        '03. high': mockData.spxIndex.high.toString(),
        '04. low': mockData.spxIndex.low.toString(),
        '05. price': mockData.spxIndex.price.toString(),
        '06. volume': (Math.random() * 5000000000).toFixed(0),
        '07. latest trading day': new Date().toISOString().split('T')[0],
        '08. previous close': (mockData.spxIndex.price * 0.995).toFixed(2),
        '09. change': (mockData.spxIndex.price * 0.005).toFixed(2),
        '10. change percent': '0.5%'
      };
    }
    
    // Fetch top gainers/losers for market breadth
    try {
      const gainerLosersResponse = await fetch(`${API_PROXY_URL}?function=TOP_GAINERS_LOSERS`);
      gainerLosersData = await gainerLosersResponse.json();
      console.log('Gainers/Losers data response:', gainerLosersData);
    } catch (error) {
      console.error('Error fetching gainers/losers data:', error);
      gainerLosersData = null;
    }
    
    // Validate gainers/losers data
    let validGainersLosersData = false;
    let marketBreadth = { advances: 0, declines: 0 };
    
    if (gainerLosersData && gainerLosersData.top_gainers && gainerLosersData.top_losers) {
      validGainersLosersData = true;
      marketBreadth = {
        advances: gainerLosersData.top_gainers.length || 0,
        declines: gainerLosersData.top_losers.length || 0
      };
    } else {
      console.warn('Using mock market breadth data due to invalid API response');
      
      // Use mock data for market breadth
      const mockData = generateMockMarketSummary();
      marketBreadth = mockData.marketBreadth;
    }
    
    // Fetch sector performance data
    try {
      const sectorResponse = await fetch(`${API_PROXY_URL}?function=SECTOR`);
      sectorData = await sectorResponse.json();
      console.log('Sector performance data response:', sectorData);
    } catch (error) {
      console.error('Error fetching sector data:', error);
      sectorData = null;
    }
    
    // Validate sector data
    let validSectorData = false;
    let sectorPerformance = [];
    
    if (sectorData && sectorData['Rank A: Real-Time Performance']) {
      validSectorData = true;
      const sectorRealTime = sectorData['Rank A: Real-Time Performance'];
      
      sectorPerformance = Object.entries(sectorRealTime)
        .filter(([key]) => key !== 'Information Technology')  // This is a duplicate in the API
        .map(([sector, change]) => ({
          sector: sector.replace('GICS ', ''), // Remove 'GICS ' prefix
          change: parseFloat(change.replace('%', ''))
        }))
        .sort((a, b) => b.change - a.change);
    } else {
      console.warn('Using mock sector performance data due to invalid API response');
      
      // Use mock data for sector performance
      const mockData = generateMockMarketSummary();
      sectorPerformance = mockData.sectorPerformance;
    }
    
    // Prepare the market summary data
    const marketSummary = {
      spxIndex: {
        symbol: spxQuote['01. symbol'] || '^GSPC',
        price: parseFloat(spxQuote['05. price']) || 4500.25,
        change: parseFloat(spxQuote['09. change']) || 15.75,
        changePercent: parseFloat(spxQuote['10. change percent']?.replace('%', '')) || 0.35,
        open: parseFloat(spxQuote['02. open']) || 4485.50,
        high: parseFloat(spxQuote['03. high']) || 4510.75,
        low: parseFloat(spxQuote['04. low']) || 4475.25,
        previousClose: parseFloat(spxQuote['08. previous close']) || 4484.50,
        volume: parseFloat(spxQuote['06. volume']) || 2500000000
      },
      marketBreadth,
      sectorPerformance,
      timestamp: new Date().toISOString(),
      dataSource: {
        spx: validSpxData ? 'Alpha Vantage' : 'Mock Data',
        breadth: validGainersLosersData ? 'Alpha Vantage' : 'Mock Data',
        sectors: validSectorData ? 'Alpha Vantage' : 'Mock Data'
      }
    };
    
    return marketSummary;
  } catch (error) {
    console.error('Error fetching market summary data:', error);
    
    // Return mock data as fallback
    return generateMockMarketSummary();
  }
};

// Function to generate mock market summary data for fallback
const generateMockMarketSummary = () => {
  console.log('Generating mock market summary data');
  
  // Generate mock SPX data
  const spxIndex = {
    symbol: '^GSPC',
    price: 4500 + Math.random() * 200,
    change: 15 + Math.random() * 20 - 10,
    changePercent: 0.3 + Math.random() * 0.8 - 0.4,
    open: 4480 + Math.random() * 50,
    high: 4520 + Math.random() * 50,
    low: 4470 + Math.random() * 40,
    previousClose: 4485 + Math.random() * 40,
    volume: 2500000000 + Math.random() * 500000000
  };
  
  // Adjust high and low to be consistent
  spxIndex.high = Math.max(spxIndex.high, spxIndex.price);
  spxIndex.low = Math.min(spxIndex.low, spxIndex.price);
  
  // Mock market breadth data
  const marketBreadth = {
    advances: 285,
    declines: 215
  };
  
  // Mock sector performance data
  const sectorPerformance = [
    { sector: 'Energy', change: 2.5 },
    { sector: 'Technology', change: 1.8 },
    { sector: 'Healthcare', change: 1.2 },
    { sector: 'Consumer Discretionary', change: 0.7 },
    { sector: 'Financials', change: 0.3 },
    { sector: 'Consumer Staples', change: -0.2 },
    { sector: 'Industrials', change: -0.5 },
    { sector: 'Utilities', change: -0.9 },
    { sector: 'Real Estate', change: -1.3 },
    { sector: 'Materials', change: -1.8 }
  ];
  
  // Calculate market sentiment
  const gainersCount = marketBreadth.advances;
  const losersCount = marketBreadth.declines;
  const advanceDeclineRatio = gainersCount / (losersCount || 1);
  
  let sentiment;
  if (advanceDeclineRatio > 1.5) {
    sentiment = { label: 'Bullish', cssClass: 'bullish' };
  } else if (advanceDeclineRatio > 1.1) {
    sentiment = { label: 'Slightly Bullish', cssClass: 'slightly-bullish' };
  } else if (advanceDeclineRatio > 0.9) {
    sentiment = { label: 'Neutral', cssClass: 'neutral' };
  } else if (advanceDeclineRatio > 0.5) {
    sentiment = { label: 'Slightly Bearish', cssClass: 'slightly-bearish' };
  } else {
    sentiment = { label: 'Bearish', cssClass: 'bearish' };
  }
  
  return {
    spxIndex,
    marketBreadth,
    sectorPerformance,
    sentiment,
    timestamp: new Date().toISOString(),
    dataSource: {
      spx: 'Mock Data',
      breadth: 'Mock Data',
      sectors: 'Mock Data'
    }
  };
};

// Function to fetch top performers data using Alpha Vantage TOP_GAINERS_LOSERS and LISTING_STATUS endpoints
export const fetchTopPerformers = async () => {
  try {
    console.log('Fetching top performers data from Alpha Vantage');
    
    // Fetch top gainers, losers, and most active stocks
    const gainerLosersResponse = await fetch(`${API_PROXY_URL}?function=TOP_GAINERS_LOSERS`);
    const gainerLosersData = await gainerLosersResponse.json();
    
    if (!gainerLosersData || 
        !gainerLosersData.top_gainers || 
        !gainerLosersData.top_losers || 
        !gainerLosersData.most_actively_traded) {
      throw new Error('Invalid response from Alpha Vantage TOP_GAINERS_LOSERS endpoint');
    }
    
    // Get the top stocks from each category
    const topGainers = gainerLosersData.top_gainers.slice(0, 10);
    const topLosers = gainerLosersData.top_losers.slice(0, 10);
    const mostActive = gainerLosersData.most_actively_traded.slice(0, 10);
    
    // Format the data
    const formatAlphaVantageStock = (stock) => ({
      Symbol: stock.ticker,
      Name: stock.name,
      Price: parseFloat(stock.price),
      Change: parseFloat(stock.change_amount),
      ChangePercent: parseFloat(stock.change_percentage.replace('%', '')),
      Volume: parseInt(stock.volume)
    });
    
    // Return the top performers data
    return {
      topGainers: topGainers.map(formatAlphaVantageStock),
      topLosers: topLosers.map(formatAlphaVantageStock),
      mostActive: mostActive.map(formatAlphaVantageStock)
    };
  } catch (error) {
    console.error('Error fetching top performers data:', error);
    // Fallback to mock data
    return generateMockTopPerformers();
  }
};

// Function to generate mock top performers data
export const generateMockTopPerformers = () => {
  console.log('Generating mock top performers data');
  
  // Helper function to generate a mock stock
  const generateMockStock = (symbol, name, priceBase, changeBase, volumeBase) => {
    const price = priceBase + (Math.random() * priceBase * 0.2);
    const change = changeBase * (Math.random() * 0.5 + 0.5) * (Math.random() > 0.5 ? 1 : -1);
    const changePercent = (change / price) * 100;
    
    return {
      Symbol: symbol,
      Name: name,
      Price: price,
      Change: change,
      ChangePercent: changePercent,
      Volume: Math.floor(volumeBase * (Math.random() * 2 + 0.5))
    };
  };
  
  // Generate mock gainers
  const topGainers = [
    generateMockStock('AAPL', 'Apple Inc.', 180, 5, 10000000),
    generateMockStock('MSFT', 'Microsoft Corporation', 350, 8, 8000000),
    generateMockStock('AMZN', 'Amazon.com Inc.', 150, 4, 9000000),
    generateMockStock('GOOGL', 'Alphabet Inc.', 130, 3, 7000000),
    generateMockStock('META', 'Meta Platforms Inc.', 300, 7, 6000000),
    generateMockStock('TSLA', 'Tesla Inc.', 200, 6, 12000000),
    generateMockStock('NVDA', 'NVIDIA Corporation', 500, 15, 15000000),
    generateMockStock('V', 'Visa Inc.', 250, 5, 5000000),
    generateMockStock('JPM', 'JPMorgan Chase & Co.', 160, 4, 6000000),
    generateMockStock('JNJ', 'Johnson & Johnson', 150, 3, 4000000)
  ].map(stock => {
    // Ensure positive changes for gainers
    return {
      ...stock,
      Change: Math.abs(stock.Change),
      ChangePercent: Math.abs(stock.ChangePercent)
    };
  });
  
  // Generate mock losers
  const topLosers = [
    generateMockStock('IBM', 'International Business Machines', 140, 3, 5000000),
    generateMockStock('T', 'AT&T Inc.', 18, 0.5, 7000000),
    generateMockStock('GE', 'General Electric Company', 120, 2, 6000000),
    generateMockStock('F', 'Ford Motor Company', 12, 0.3, 8000000),
    generateMockStock('GM', 'General Motors Company', 40, 1, 6000000),
    generateMockStock('INTC', 'Intel Corporation', 35, 1, 9000000),
    generateMockStock('VZ', 'Verizon Communications Inc.', 40, 1, 5000000),
    generateMockStock('PFE', 'Pfizer Inc.', 30, 0.8, 7000000),
    generateMockStock('KO', 'The Coca-Cola Company', 60, 1, 4000000),
    generateMockStock('DIS', 'The Walt Disney Company', 100, 2, 6000000)
  ].map(stock => {
    // Ensure negative changes for losers
    return {
      ...stock,
      Change: -Math.abs(stock.Change),
      ChangePercent: -Math.abs(stock.ChangePercent)
    };
  });
  
  // Most active stocks (a mix of gainers and losers)
  const mostActive = [
    ...topGainers.slice(0, 5),
    ...topLosers.slice(0, 5)
  ].sort((a, b) => b.Volume - a.Volume);
  
  return {
    topGainers,
    topLosers,
    mostActive
  };
};

// Function to fetch market cap distribution data
export const fetchMarketCapDistribution = async () => {
  try {
    console.log('Fetching market cap distribution data');
    
    // First fetch local financials data which has market cap information
    const financialsResponse = await fetch('/api/financials');
    const financialsData = await financialsResponse.json();
    
    // Get active stocks from Alpha Vantage for the latest market data
    const gainerLosersResponse = await fetch(`${API_PROXY_URL}?function=TOP_GAINERS_LOSERS`);
    const gainerLosersData = await gainerLosersResponse.json();
    
    // Get all active stocks
    const activeStocks = [
      ...(gainerLosersData.top_gainers || []),
      ...(gainerLosersData.top_losers || []),
      ...(gainerLosersData.most_actively_traded || [])
    ];
    
    // Build a map of symbol to latest price
    const latestPrices = {};
    activeStocks.forEach(stock => {
      latestPrices[stock.ticker] = parseFloat(stock.price) || 0;
    });
    
    // Define market cap categories
    const categories = {
      'Mega Cap (>$200B)': 0,
      'Large Cap ($10B-$200B)': 0,
      'Mid Cap ($2B-$10B)': 0,
      'Small Cap ($300M-$2B)': 0,
      'Micro Cap (<$300M)': 0
    };
    
    // Count stocks in each category
    financialsData.forEach(stock => {
      // Use latest price from Alpha Vantage if available, otherwise use stored price
      const currentPrice = latestPrices[stock.Symbol] || parseFloat(stock.Price) || 0;
      
      // Calculate shares outstanding (Market Cap / Price)
      const storedMarketCap = parseFloat(stock['Market Cap']) || 0;
      const sharesOutstanding = storedMarketCap / (parseFloat(stock.Price) || 1);
      
      // Calculate updated market cap using latest price
      const marketCap = currentPrice * sharesOutstanding;
      
      // Categorize by market cap
      if (marketCap >= 200000000000) {
        categories['Mega Cap (>$200B)']++;
      } else if (marketCap >= 10000000000) {
        categories['Large Cap ($10B-$200B)']++;
      } else if (marketCap >= 2000000000) {
        categories['Mid Cap ($2B-$10B)']++;
      } else if (marketCap >= 300000000) {
        categories['Small Cap ($300M-$2B)']++;
      } else if (marketCap > 0) {
        categories['Micro Cap (<$300M)']++;
      }
    });
    
    return {
      categories,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching market cap distribution:', error);
    return generateMockMarketCapDistribution();
  }
};

// Generate mock market cap distribution data
export const generateMockMarketCapDistribution = () => {
  console.log('Generating mock market cap distribution data');
  
  return {
    categories: {
      'Mega Cap (>$200B)': 42,
      'Large Cap ($10B-$200B)': 178,
      'Mid Cap ($2B-$10B)': 185,
      'Small Cap ($300M-$2B)': 83,
      'Micro Cap (<$300M)': 12
    },
    timestamp: new Date().toISOString()
  };
};

// Cache for stock symbols and names
let stockSymbolsCache = null;

// Function to fetch stock symbols and names for autocomplete
export const fetchStockSymbols = async () => {
  try {
    // Return cached data if available
    if (stockSymbolsCache) {
      return stockSymbolsCache;
    }
    
    console.log('Fetching stock symbols for autocomplete');
    
    // Fetch from local API endpoint that provides all stock symbols and names
    const response = await fetch('/api/stocks/autocomplete');
    const stocks = await response.json();
    
    // Format the data for autocomplete
    const formattedStocks = stocks.map(stock => ({
      symbol: stock.Symbol,
      name: stock.Name,
      sector: stock.Sector || ''
    }));
    
    // Cache the results
    stockSymbolsCache = formattedStocks;
    
    return formattedStocks;
  } catch (error) {
    console.error('Error fetching stock symbols:', error);
    // Return empty array if there's an error
    return [];
  }
};

// Function to clear the stock symbols cache
export const clearStockSymbolsCache = () => {
  stockSymbolsCache = null;
};
