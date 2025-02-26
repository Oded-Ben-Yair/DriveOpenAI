// aiService.js
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { listFiles, getFileContent } from './driveService.js';

dotenv.config();

// Create an OpenAI client instance using the new v4 library.
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Ask a question to OpenAI using context from your Drive files.
 * It retrieves up to 5 files, gets a text snippet from each, and builds a prompt.
 * @param {string} question - The user's question.
 * @returns {Promise<string>} - The AI-generated answer.
 */
export async function askQuestion(question) {
  try {
    // Retrieve up to 5 files from your Drive
    const { files } = await listFiles({ limit: 5, offset: null });
    let contextText = '';
    for (const file of files) {
      try {
        const content = await getFileContent(file.id);
        // Take only the first 300 characters and replace newlines with spaces
        const snippet = content.slice(0, 300).replace(/\n/g, ' ');
        contextText += `File: ${file.name}\nSnippet: ${snippet}\n\n`;
      } catch (error) {
        console.error(`Error retrieving content for file ${file.id}:`, error.message);
      }
    }

    // Build the prompt using the context from file snippets and the user question.
    const prompt = `Based on the following summaries of your Google Drive files:\n\n${contextText}\nAnswer this question:\n${question}`;

    // Call the OpenAI Chat API with a system prompt for context.
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-16k', // Use a model with a larger context window if available
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that answers questions using the provided file summaries from a Google Drive account. Provide clear and concise answers.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 512, // Limit output to a safe size
    });
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error in askQuestion:', error);
    throw error;
  }
}
