// filepath: src/types/conversation.ts

/**
 * Shared type for the conversation history format
 * passed between ArgusSessionProvider and the Route Handler.
 */
export interface ConversationMessage {
  readonly role:    'user' | 'assistant'
  readonly content: string
}
