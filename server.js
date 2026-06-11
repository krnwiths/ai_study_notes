const express = require("express");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

const app = express();

// Middleware to parse JSON bodies and serve frontend files from the "public" folder
app.use(express.json());
app.use(express.static("public"));

// Quick check to ensure your API key is loaded
console.log("Groq API Key Loaded:", process.env.GROQ_API_KEY ? "YES" : "NO");

app.post("/generate", async (req, res) => {
    try {
        // Extract both the topic and difficulty level sent from script.js
        const { topic, difficulty } = req.body;

        if (!topic || topic.trim() === "") {
            return res.status(400).json({
                content: "Please enter a valid topic."
            });
        }

        console.log(`Generating [${difficulty}] material for: ${topic} via Groq...`);

        // The AI Prompt: dynamically adjusts based on user's difficulty selection
        const prompt = `
        Generate complete study material on the topic of "${topic}".
        CRITICAL: Tailor the explanation and complexity so it is easily understood by a ${difficulty}.

        Please format the output in beautiful Markdown and include:
        1. Introduction
        2. Detailed Notes
        3. 10 Important Questions
        4. 10 MCQs with Answers
        5. Conclusion
        `;

        // Calling Groq's API
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile", // Free, ultra-fast Meta model
                messages: [{ role: "user", content: prompt }]
            })
        });

        const data = await response.json();

        // Handle errors gracefully (like hitting a rate limit)
        if (!response.ok) {
            if (response.status === 429) {
                return res.status(429).json({
                     content: "### ⏳ Rate Limit Reached\n\nPlease wait a moment and try again."
                });
            }
            throw new Error(data.error?.message || "Groq API error");
        }

        // Send the AI's generated markdown back to the frontend
        res.json({
            content: data.choices[0].message.content
        });

    } catch (error) {
        console.error("API Error:", error.message);
        res.status(500).json({
            content: "Failed to generate study material. Please try again later."
        });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});