// aiService.js - Enhanced with better context handling
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { google } from 'googleapis';
import { oauth2Client } from './auth.js';
import { listFiles } from './driveService.js';

dotenv.config();
const apiKey = process.env.OPENAI_API_KEY || 'test-api-key';
const openai = new OpenAI({ apiKey });
const drive = google.drive({ version: 'v3', auth: oauth2Client });

export async function askQuestion(question) {
  try {
    // Common file-related questions and their SQL-like queries
    const fileRelatedQueries = {
      'who owns the most files': async () => {
        const files = await fetchAllFiles();
        const ownerCounts = {};
        
        files.forEach(file => {
          file.owners?.forEach(owner => {
            const email = owner.emailAddress || 'unknown';
            ownerCounts[email] = (ownerCounts[email] || 0) + 1;
          });
        });
        
        let maxCount = 0;
        let topOwner = 'No one';
        
        for (const [owner, count] of Object.entries(ownerCounts)) {
          if (count > maxCount) {
            maxCount = count;
            topOwner = owner;
          }
        }
        
        return `The user ${topOwner} owns the most files (${maxCount} files).`;
      },
      
      'which file was modified most recently': async () => {
        const files = await fetchAllFiles();
        if (files.length === 0) return 'No files found.';
        
        let mostRecentFile = files[0];
        
        files.forEach(file => {
          const fileDate = new Date(file.modifiedTime);
          const currentMostRecentDate = new Date(mostRecentFile.modifiedTime);
          
          if (fileDate > currentMostRecentDate) {
            mostRecentFile = file;
          }
        });
        
        return `The most recently modified file is "${mostRecentFile.name}" (last modified: ${new Date(mostRecentFile.modifiedTime).toLocaleString()}).`;
      },
      
      'average number of files per owner': async () => {
        const files = await fetchAllFiles();
        const owners = new Set();
        
        files.forEach(file => {
          file.owners?.forEach(owner => {
            owners.add(owner.emailAddress || 'unknown');
          });
        });
        
        const numOwners = owners.size || 1; // Avoid division by zero
        const average = files.length / numOwners;
        
        return `There are ${files.length} files shared among ${numOwners} owners, averaging ${average.toFixed(2)} files per owner.`;
      },
      
      'which file is the largest': async () => {
        const files = await fetchAllFiles();
        if (files.length === 0) return 'No files found.';
        
        let largestFile = files[0];
        
        files.forEach(file => {
          const fileSize = parseInt(file.size || 0);
          const currentLargestSize = parseInt(largestFile.size || 0);
          
          if (fileSize > currentLargestSize) {
            largestFile = file;
          }
        });
        
        // Convert bytes to readable format
        const sizeInMB = (parseInt(largestFile.size || 0) / (1024 * 1024)).toFixed(2);
        
        return `The largest file is "${largestFile.name}" with a size of ${sizeInMB} MB.`;
      },
      
      'distribution of files by modified date': async () => {
        const files = await fetchAllFiles();
        const dateDistribution = {};
        
        files.forEach(file => {
          const date = new Date(file.modifiedTime);
          const month = date.toLocaleString('default', { month: 'long' });
          const year = date.getFullYear();
          const key = `${month} ${year}`;
          
          dateDistribution[key] = (dateDistribution[key] || 0) + 1;
        });
        
        let distribution = 'File distribution by modified date:\n';
        
        for (const [date, count] of Object.entries(dateDistribution)) {
          distribution += `- ${date}: ${count} files\n`;
        }
        
        return distribution;
      }
    };
    
    // Check if the question matches any of our predefined queries
    const lowerQuestion = question.toLowerCase();
    
    for (const [queryPattern, handler] of Object.entries(fileRelatedQueries)) {
      if (lowerQuestion.includes(queryPattern)) {
        return await handler();
      }
    }
    
    // For other file-related questions, fetch files and pass to AI
    if (lowerQuestion.includes('file') || 
        lowerQuestion.includes('drive') || 
        lowerQuestion.includes('document')) {
      
      const files = await fetchAllFiles(50); // Limit to 50 files for context
      
      const systemPrompt = `
        You are an AI assistant that answers questions about Google Drive files.
        Use the file data provided to answer user questions accurately and concisely.
        If you cannot answer based on the data provided, say so politely.
      `;
      
      const userPrompt = `
        ${question}
        
        File data (showing up to 50 files):
        ${JSON.stringify(files, null, 2)}
      `;
      
      const aiResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500, // Increased token limit for more comprehensive answers
      });
      
      return aiResponse.choices[0].message.content.trim();
    } 
    
    // For general questions, use standard AI response
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: question }],
      max_tokens: 300,
    });
    
    return aiResponse.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error in askQuestion:', error);
    throw error;
  }
}

// Helper function to fetch all files (with pagination)
async function fetchAllFiles(limit = 1000) {
  let allFiles = [];
  let nextPageToken = null;
  
  try {
    do {
      const response = await drive.files.list({
        pageSize: 100,
        pageToken: nextPageToken || undefined,
        fields: 'nextPageToken, files(id, name, owners, modifiedTime, size)',
      });
      
      const files = response.data.files || [];
      allFiles = [...allFiles, ...files];
      nextPageToken = response.data.nextPageToken;
      
      // Stop if we hit the limit
      if (allFiles.length >= limit) {
        allFiles = allFiles.slice(0, limit);
        break;
      }
    } while (nextPageToken);
    
    return allFiles;
  } catch (error) {
    console.error('Error fetching all files:', error);
    return [];
  }
}