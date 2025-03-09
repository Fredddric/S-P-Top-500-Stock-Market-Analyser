// This file contains the deep learning model implementation using TensorFlow.js

// Import TensorFlow.js
import * as tf from '@tensorflow/tfjs';

// Class for stock price prediction model
export class StockPredictionModel {
  constructor() {
    this.model = null;
    this.isTraining = false;
    this.trainingProgress = 0;
  }

  // Initialize and build the model
  async buildModel(timeSteps, features) {
    // Create a sequential model
    this.model = tf.sequential();
    
    // Add LSTM layer
    this.model.add(tf.layers.lstm({
      units: 50,
      returnSequences: true,
      inputShape: [timeSteps, features]
    }));
    
    // Add dropout to prevent overfitting
    this.model.add(tf.layers.dropout({ rate: 0.2 }));
    
    // Add another LSTM layer
    this.model.add(tf.layers.lstm({
      units: 50,
      returnSequences: false
    }));
    
    // Add dropout
    this.model.add(tf.layers.dropout({ rate: 0.2 }));
    
    // Add dense layer
    this.model.add(tf.layers.dense({ units: 25, activation: 'relu' }));
    
    // Output layer
    this.model.add(tf.layers.dense({ units: 1 }));
    
    // Compile the model
    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mse']
    });
    
    console.log('Model built successfully');
    return this.model;
  }

  // Preprocess data for the model
  preprocessData(data, timeSteps = 20) {
    // This is a simplified version for demonstration
    // In a real application, you would normalize the data and create proper sequences
    
    const X = [];
    const y = [];
    
    // Create sequences of timeSteps length
    for (let i = 0; i < data.length - timeSteps; i++) {
      X.push(data.slice(i, i + timeSteps));
      y.push(data[i + timeSteps]);
    }
    
    // Convert to tensors
    const inputTensor = tf.tensor3d(X, [X.length, timeSteps, 1]);
    const outputTensor = tf.tensor2d(y, [y.length, 1]);
    
    return { inputTensor, outputTensor };
  }

  // Train the model
  async trainModel(inputTensor, outputTensor, epochs = 50, batchSize = 32) {
    if (!this.model) {
      throw new Error('Model not built yet. Call buildModel first.');
    }
    
    this.isTraining = true;
    this.trainingProgress = 0;
    
    // Train the model
    return await this.model.fit(inputTensor, outputTensor, {
      epochs,
      batchSize,
      shuffle: true,
      validationSplit: 0.1,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          this.trainingProgress = (epoch + 1) / epochs;
          console.log(`Epoch ${epoch + 1}/${epochs}, Loss: ${logs.loss.toFixed(4)}`);
        },
        onTrainEnd: () => {
          this.isTraining = false;
          this.trainingProgress = 1;
          console.log('Training completed');
        }
      }
    });
  }

  // Make predictions
  async predict(inputData) {
    if (!this.model) {
      throw new Error('Model not built yet. Call buildModel first.');
    }
    
    // Convert input data to tensor
    const inputTensor = tf.tensor3d(inputData, [inputData.length, inputData[0].length, 1]);
    
    // Make prediction
    const prediction = this.model.predict(inputTensor);
    
    // Convert prediction to array
    const predictionArray = await prediction.array();
    
    // Clean up tensors
    inputTensor.dispose();
    prediction.dispose();
    
    return predictionArray;
  }

  // Generate mock training data for demonstration
  generateMockTrainingData(length = 500, timeSteps = 20) {
    // Generate a sine wave with some noise as mock stock price data
    const data = [];
    for (let i = 0; i < length; i++) {
      const value = Math.sin(i * 0.05) * 10 + 50 + (Math.random() - 0.5) * 5;
      data.push([value]);
    }
    
    return this.preprocessData(data, timeSteps);
  }

  // Save model
  async saveModel(path = 'localstorage://stock-prediction-model') {
    if (!this.model) {
      throw new Error('No model to save');
    }
    
    await this.model.save(path);
    console.log('Model saved successfully');
  }

  // Load model
  async loadModel(path = 'localstorage://stock-prediction-model') {
    try {
      this.model = await tf.loadLayersModel(path);
      console.log('Model loaded successfully');
      return true;
    } catch (error) {
      console.error('Error loading model:', error);
      return false;
    }
  }
}

// Class for portfolio optimization using deep reinforcement learning
export class PortfolioOptimizer {
  constructor() {
    this.model = null;
  }

  // Initialize the model
  async buildModel(numStocks) {
    // Create a sequential model
    this.model = tf.sequential();
    
    // Input layer
    this.model.add(tf.layers.dense({
      units: 64,
      activation: 'relu',
      inputShape: [numStocks * 5] // 5 features per stock
    }));
    
    // Hidden layers
    this.model.add(tf.layers.dense({
      units: 32,
      activation: 'relu'
    }));
    
    // Output layer (portfolio weights)
    this.model.add(tf.layers.dense({
      units: numStocks,
      activation: 'softmax' // Ensures weights sum to 1
    }));
    
    // Compile the model
    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError'
    });
    
    console.log('Portfolio optimizer model built successfully');
    return this.model;
  }

  // Generate mock optimal weights for demonstration
  generateMockOptimalWeights(stocks, riskLevel) {
    // This is just a placeholder for demonstration
    // In a real application, you would use the trained model to predict weights
    
    const weights = [];
    let totalWeight = 0;
    
    // Assign random weights
    for (let i = 0; i < stocks.length; i++) {
      const weight = Math.random();
      weights.push(weight);
      totalWeight += weight;
    }
    
    // Normalize weights to sum to 1
    const normalizedWeights = weights.map(w => w / totalWeight);
    
    return normalizedWeights;
  }
}
