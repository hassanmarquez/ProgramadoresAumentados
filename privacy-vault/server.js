const dotenv = require('dotenv');
dotenv.config();  // Debe estar ANTES de usar process.env

const express = require('express');
const mongoose = require('mongoose');
const Token = require('./models/Token');
const crypto = require('crypto');
const GeminiService = require('./GeminiService');

// Initialize express
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Connect to MongoDB Atlas with retry logic
//AQUI MODIFICO HASSAN LA INFO QUE ESTABA ANTES ERA --> process.env.MONGODB_URI,
mongoose.connect(process.env.MONGODB_URI, {
    retryWrites: true,
    w: 'majority',
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    socketTimeoutMS: 45000, // Close sockets after 45s
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => {
    console.error('MongoDB Atlas connection error:', err);
    process.exit(1);
});

// Add error handlers for the MongoDB connection
mongoose.connection.on('error', err => {
    console.error('MongoDB Atlas error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB Atlas disconnected. Attempting to reconnect...');
});

/**
 * Generates a consistent token for a given input string with type prefix
 */
async function generateToken(input, type) {
    const hash = crypto.createHash('sha256');
    hash.update(input);
    const token = `${type}_${hash.digest('hex').substring(0, 12)}`;
    
    try {
        // Store or update the token in MongoDB Atlas
        await Token.findOneAndUpdate(
            { token },
            { token, originalValue: input },
            { upsert: true, new: true }
        );
        return token;
    } catch (error) {
        console.error('Error storing token:', error);
        throw error;
    }
}

/**
 * Anonymizes PII data in a message
 * @param {string} message - The message containing PII
 * @returns {string} - Anonymized message
 */
async function anonymizeMessage(message) {
    // Regular expressions for matching PII
    const patterns = {
        name: {
            pattern: /[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}/g,
            prefix: 'NAME'
        },
        email: {
            pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
            prefix: 'EMAIL'
        },
        phone: {
            pattern: /\b\d{10}\b/g,
            prefix: 'PHONE'
        }
    };

    let anonymizedMessage = message;

    // Replace each type of PII with tokens
    for (const [type, { pattern, prefix }] of Object.entries(patterns)) {
        const matches = message.match(pattern) || [];
        for (const match of matches) {
            const token = await generateToken(match, prefix);
            anonymizedMessage = anonymizedMessage.replace(match, token);
        }
    }

    return anonymizedMessage;
}

/**
 * Deanonymizes a message by replacing tokens with original values
 */
async function deanonymizeMessage(anonymizedMessage) {
    const tokenPattern = /(NAME|EMAIL|PHONE)_[a-f0-9]{12}/g;
    const tokens = anonymizedMessage.match(tokenPattern) || [];
    let deanonymizedMessage = anonymizedMessage;

    for (const token of tokens) {
        const tokenDoc = await Token.findOne({ token });
        if (!tokenDoc) {
            throw new Error(`Token not found: ${token}`);
        }
        deanonymizedMessage = deanonymizedMessage.replace(token, tokenDoc.originalValue);
    }

    return deanonymizedMessage;
}

// Update endpoints to be async
app.post('/anonymize', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        const anonymizedMessage = await anonymizeMessage(message);
        res.json({ anonymizedMessage });
    } catch (error) {
        console.error('Anonymization error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/deanonymize', async (req, res) => {
    try {
        const { anonymizedMessage } = req.body;
        if (!anonymizedMessage) {
            return res.status(400).json({ error: 'Anonymized message is required' });
        }
        const message = await deanonymizeMessage(anonymizedMessage);
        res.json({ message });
    } catch (error) {
        console.error('Deanonymization error:', error);
        res.status(500).json({ 
            error: error.message || 'Internal server error' 
        });
    }
});

const geminiService = new GeminiService();

// Añade este nuevo endpoint
app.post('/complete', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const completion = await geminiService.generateCompletion(prompt);
        res.json({ completion });
    } catch (error) {
        console.error('Completion error:', error);
        res.status(500).json({ error: 'Error generating completion' });
    }
});

/**
 * Endpoint para chat seguro que anonimiza datos sensibles antes de enviarlos a Gemini
 */
app.post('/secureChatGemini', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        // 1. Primero anonimizamos el prompt
        const anonymizedPrompt = await anonymizeMessage(prompt);

        // 2. Enviamos el prompt anonimizado a Gemini
        const completion = await geminiService.generateCompletion(anonymizedPrompt);

        // 3. Des-anonimizamos la respuesta
        const deanonymizedResponse = await deanonymizeMessage(completion);

        res.json({ 
            originalPrompt: prompt,
            anonymizedPrompt: anonymizedPrompt,
            completion: deanonymizedResponse
        });

    } catch (error) {
        console.error('Secure Chat error:', error);
        res.status(500).json({ error: 'Error in secure chat processing' });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 