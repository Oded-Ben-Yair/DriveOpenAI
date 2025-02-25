import dotenv from 'dotenv';
import OpenAI from 'openai';
import { google } from 'googleapis';
import { oauth2Client } from './auth.js';

dotenv.config();
const apiKey = process.env.OPENAI_API_KEY || 'test-api-key';
const openai = new OpenAI({ apiKey });
const drive = google.drive({ version: 'v3', auth: oauth2Client });

export async function askQuestion(question) {
  try {
    if (question.toLowerCase().includes('files')) {
      const response = await drive.files.list({
        pageSize: 100,
        fields: 'files(id, name, owners, modifiedTime, size)',
      });
      const files = response.data.files;
      const prompt = `${question}\n\nFiles: ${JSON.stringify(files, null, 2)}`;
      const aiResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
      });
      return aiResponse.choices[0].message.content.trim();
    } else {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: question }],
        max_tokens: 150,
      });
      return response.choices[0].message.content.trim();
    }
  } catch (error) {
    console.error('Error in askQuestion:', error.message);
    throw error;
  }
}