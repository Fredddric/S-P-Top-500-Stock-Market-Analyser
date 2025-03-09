# S&P Stock Market Analyzer

A comprehensive web application for analyzing S&P 500 stocks, sectors, and market trends with deep learning-based price prediction capabilities.

![S&P Stock Market Analyzer](https://via.placeholder.com/800x400?text=S%26P+Stock+Market+Analyzer)

## Features

- **Market Dashboard**: Real-time market summary, top performers, sector performance, and market cap distribution
- **Stock Analysis**: Detailed stock information, financial ratios, historical performance, and comparative analysis
- **Sector Analysis**: Sector overview, top companies, sector metrics, and comparison with S&P 500
- **Price Prediction**: Deep learning-based stock price prediction with confidence intervals and technical indicators
- **Portfolio Optimizer**: Build and optimize investment portfolios based on risk tolerance

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript, Chart.js
- **Backend**: Node.js, Express.js
- **Data Processing**: Papa Parse for CSV parsing
- **API Integration**: Alpha Vantage API for real-time market data
- **Machine Learning**: TensorFlow.js for price prediction models

## Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher)
- npm (v8.0.0 or higher)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/sp-stock-market-analyzer.git
   cd sp-stock-market-analyzer
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

## Project Structure

```
├── data/                  # Stock data CSV files
├── public/                # Static assets
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript modules
│   └── index.html         # Main HTML file
├── server.js              # Express server
├── package.json           # Project dependencies
└── README.md              # Project documentation
```

## Usage

### Dashboard

The dashboard provides an overview of the current market status, including:
- S&P 500 Index performance
- Market breadth (advancing vs declining stocks)
- Sector performance
- Market capitalization distribution

### Stock Analysis

Enter a stock symbol to view detailed information:
- Current price and 52-week range
- Financial ratios (P/E, EPS, dividend yield)
- Historical price chart
- Comparison with sector peers

### Sector Analysis

Select a sector to analyze:
- Number of companies and total market cap
- Average P/E ratio and dividend yield
- Top companies by market cap
- Sector performance metrics

### Price Prediction

Predict future stock prices using deep learning:
- Select a stock and prediction timeframe
- View price prediction with confidence intervals
- Analyze prediction metrics and model confidence
- Review technical indicators

### Portfolio Optimizer

Build and optimize investment portfolios:
- Add stocks to your portfolio
- Select risk tolerance level
- View optimal allocation and expected performance
- Analyze risk metrics and portfolio characteristics

## API Integration

The application uses the Alpha Vantage API for real-time market data. The server proxies requests to avoid CORS issues and implements caching to reduce API calls.

## Data Sources

- S&P 500 constituent data
- Financial metrics for S&P 500 companies
- Real-time market data from Alpha Vantage API

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Alpha Vantage for providing financial market data
- TensorFlow.js for machine learning capabilities
- Chart.js for data visualization

## Future Enhancements

- User authentication and saved portfolios
- More advanced prediction models
- Backtesting capabilities for trading strategies
- Integration with additional data sources
- Mobile application version
