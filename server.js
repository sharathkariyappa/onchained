// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import axios from "axios";
const app = express();
const PORT = process.env.PORT || 30008;

app.use(cors()); // Optional if your frontend is hosted elsewhere
app.use(express.json());

// Proxy endpoint
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


// app.post("/api/quote", async (req, res) => {
//   const { amount, address, Buyaddress} = req.body;

//   if (!amount || !address || isNaN(Number(amount))) {
//     return res.status(400).json({ error: "Missing or invalid parameters." });
//   }

//   try {
//     const usdcAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606EB48";
//     const buyToken = Buyaddress;
//     const chainId = 8453

//     if (!buyToken) {
//       return res.status(400).json({ error: "Unsupported token" });
//     }

//     const parsedAmount = parseInt(amount.toString(), 6); // USDC has 6 decimals

//     const { data } = await axios.get("https://api.0x.org/gasless/quote", {
//       params: {
//         chainId,
//         sellToken: usdcAddress,
//         buyToken,
//         sellAmount: parsedAmount,
//         taker: address,
//       },
//       headers: {
//         "0x-api-key": "e4f5a5a7-d746-41c6-a1ca-a9bc46ec3c31",
//         "0x-version": "v2",
//       },
//     });

//     res.json(data);
//   } catch (error) {
//     console.error("Error fetching 0x quote:", error?.response?.data || error.message);
//     res.status(500).json({ error: "Failed to fetch 0x quote", details: error?.message });
//   }
// });

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
