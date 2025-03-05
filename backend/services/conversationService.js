// backend/services/conversationService.js
import logger from '../logger.js';

// In-memory conversation store
const conversations = new Map();

// Create a new conversation
export function createConversation(userId) {
  const conversationId = `${userId}-${Date.now()}`;
  
  conversations.set(conversationId, {
    id: conversationId,
    userId,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  logger.info(`Created new conversation: ${conversationId} for user: ${userId}`);
  return conversationId;
}

// Add a message to a conversation
export function addMessage(conversationId, message) {
  const conversation = conversations.get(conversationId);
  
  if (!conversation) {
    throw new Error(`Conversation ${conversationId} not found`);
  }
  
  conversation.messages.push({
    ...message,
    timestamp: new Date().toISOString()
  });
  
  conversation.updatedAt = new Date().toISOString();
  
  return conversation;
}

// Get a conversation by ID
export function getConversation(conversationId) {
  return conversations.get(conversationId);
}

// Get all conversations for a user
export function getUserConversations(userId) {
  const userConversations = [];
  
  for (const conversation of conversations.values()) {
    if (conversation.userId === userId) {
      userConversations.push(conversation);
    }
  }
  
  return userConversations;
}

// Delete a conversation
export function deleteConversation(conversationId) {
  return conversations.delete(conversationId);
}