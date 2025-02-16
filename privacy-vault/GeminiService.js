const { GoogleGenerativeAI } = require("@google/generative-ai");

class GeminiService {
    constructor() {
        // Obtén tu API key de https://makersuite.google.com/app/apikey
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    }

    /**
     * Genera una completion usando Gemini
     * @param {string} prompt - El texto de entrada
     * @returns {Promise<string>} - El texto generado
     */
    async generateCompletion(prompt) {
        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Error en Gemini completion:', error);
            throw new Error('Error generando completion con Gemini');
        }
    }
}

module.exports = GeminiService; 