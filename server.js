require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const { GoogleGenerativeAI } = require("@google/generative-ai");
const app = express();
app.use(cors());
app.use(express.json());

const EMAIL = "arshiya1542@chitkara.edu.in";

//Gemini Key Initialization
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper Functions
function fibonacci(n) {
  if (!Number.isInteger(n) || n < 0) return null;
  const result = [];
  let a = 0, b = 1;
  for (let i = 0; i < n; i++) {
    result.push(a);
    [a, b] = [b, a + b];
  }
  return result;
}

function isPrime(num) {
  if (!Number.isInteger(num) || num < 2) return false;
  for (let i = 2; i * i <= num; i++) {
    if (num % i === 0) return false;
  }
  return true;
}

function gcd(a, b) {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

async function askAI(question) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
    const prompt = `Answer in ONE WORD only. Question: ${question}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) return "Unknown";
    return text.trim().split(/\s+/)[0].replace(/[^a-zA-Z]/g, "");

  } catch (error) {
    console.error("SDK Error:", error.message);
    throw new Error("AI service temporarily unavailable");
  }
}

// /health
app.get("/health", (req, res) => {
  res.status(200).json({
    is_success: true,
    official_email: EMAIL
  });
});

// /bfhl
app.post("/bfhl", async (req, res) => {
  try {
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({
        is_success: false,
        official_email: EMAIL,
        error: "Invalid request body"
      });
    }

    const keys = Object.keys(req.body);

    if (keys.length !== 1) {
      return res.status(400).json({
        is_success: false,
        official_email: EMAIL,
        error: "Request must contain exactly one key"
      });
    }

    const key = keys[0];
    const value = req.body[key];

    let data;

    switch (key) {
      case "fibonacci":
        data = fibonacci(value);
        if (data === null) throw new Error("Invalid fibonacci input");
        break;

      case "prime":
        if (!Array.isArray(value)) throw new Error("Prime expects array");
        data = value.filter(isPrime);
        break;

      case "hcf":
        if (!Array.isArray(value) || value.length === 0)
          throw new Error("HCF expects non-empty array");
        data = value.reduce(gcd);
        break;

      case "lcm":
        if (!Array.isArray(value) || value.length === 0)
          throw new Error("LCM expects non-empty array");
        data = value.reduce(lcm);
        break;

      case "AI":
        if (typeof value !== "string")
          throw new Error("AI expects string");
        data = await askAI(value);
        break;

      default:
        return res.status(400).json({
          is_success: false,
          official_email: EMAIL,
          error: "Invalid key"
        });
    }

    return res.status(200).json({
      is_success: true,
      official_email: EMAIL,
      data
    });

  } catch (err) {
    return res.status(500).json({
      is_success: false,
      official_email: EMAIL,
      error: err.message || "Internal server error"
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});