import { z } from 'zod'

export const streamChunkSchema = z.object({
  type:  z.enum(['delta', 'done', 'error']),
  text:  z.string().optional(),
  error: z.string().optional(),
})

export const conversationMessageSchema = z.object({
  role:    z.enum(['user', 'assistant']),
  content: z.string().min(1).max(32000),
})

export const conversationHistorySchema = z.array(conversationMessageSchema).max(20)

export const argosRequestSchema = z.object({
  message:             z.string().min(1).max(12000),
  conversationHistory: z.string().default('[]'),
  projectContext:      z.string().max(4000).optional(),
})

export const argusRequestSchema = z.object({
  prompt:              z.string().min(5).max(8000),
  conversationHistory: z.string().default('[]'),
})

export type StreamChunk        = z.infer<typeof streamChunkSchema>
export type ConversationMessage = z.infer<typeof conversationMessageSchema>
export type ArgosRequest        = z.infer<typeof argosRequestSchema>
export type ArgusRequest        = z.infer<typeof argusRequestSchema>
