// aiService.js
import dotenv from 'dotenv';
import { Configuration, OpenAIApi } from 'openai';

dotenv.config();
const apiKey = process.env.OPENAI_API_KEY || 'test-api-key';

export async function askQuestion(question) {
  const configuration = new Configuration({ apiKey });
  const openai = new OpenAIApi(configuration);
  const response = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt: question,
    max_tokens: 150,
  });
  return response.data.choices[0].text.trim();
}