// aiService.js
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();
const apiKey = process.env.OPENAI_API_KEY || 'test-api-key';

// Instantiate the OpenAI client once for efficiency
const openai = new OpenAI({ apiKey });

/**
 * Ask a question to the OpenAI API and return the answer.
 * @param {string} question - The question to ask.
 * @returns {Promise<string>} The AI-generated answer.
 */
export async function askQuestion(question) {
  try {
    // Use chat.completions.create for modern models
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Replace 'text-davinci-003' with a supported model
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: question },
      ],
      max_tokens: 150,
      temperature: 0.7, // Optional: controls randomness (0.0 - 1.0)
    });

    // Extract and trim the response text
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error in askQuestion:', error.message);
    throw error; // Re-throw to handle in the calling context (e.g., server.js)
  }
}