// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import axios from "axios";
const app = express();
const PORT = process.env.PORT || 30008;

app.use(cors()); // Optional if your frontend is hosted elsewhere
app.use(express.json());

// Proxy endpoint for latest prices
app.get("/api/prices", async (req, res) => {
  try {
    const response = await fetch("https://www.universal.xyz/api/v1/prices/latest");
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Error fetching prices:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// New endpoint for historical price data
app.get("/api/prices/historical", async (req, res) => {
  try {
    // Get query parameters with defaults
    const { symbol, range} = req.query;
    
    // Validate range parameter
    if (!['1d', '1w'].includes(range)) {
      return res.status(400).json({ 
        error: 'Invalid range parameter. Use "1d" for 1 day or "1w" for 1 week.' 
      });
    }

    // Validate symbols parameter (optional validation)
    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ error: 'Invalid symbols parameter.' });
    }

    const endpoint = `https://www.universal.xyz/api/v1/prices/historical?symbols=${symbol}&range=${range}`;
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Error fetching historical prices:", err);
    res.status(500).json({ 
      error: "Failed to fetch historical price data", 
      details: err?.message 
    });
  }
});

app.post("/api/quote", async (req, res) => {
  const { tradeType, symbol, amount, address, slippage } = req.body;

  if (!tradeType || !["BUY", "SELL"].includes(tradeType)) {
    return res.status(400).json({ error: "Invalid or missing 'type'. Use 'BUY' or 'SELL'." });
  }

  if (!symbol || !amount || !address) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const payload = {
    type: tradeType,
    token: symbol,
    pair_token: "USDC",
    blockchain: "BASE",
    slippage_bips: slippage,
    user_address: address,
    pair_token_amount: amount
  };
  console.log(payload)
  try {
    const response = await fetch("https://www.universal.xyz/api/v1/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Error fetching quote:", err);
    res.status(500).json({ error: "Failed to fetch quote", details: err?.message });
  }
});

app.post("/api/order", async (req, res) => {
  const {signature, quote } = req.body;

  if (!quote || !signature) {
    return res.status(400).json({ error: 'quote and signature are required' });
  }

  try {
    const response = await axios.post(`https://www.universal.xyz/api/v1/order`, {
      signature,
      ...quote
    });

    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Order submission error", error?.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to submit order' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});