export type RemoteData<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string; metadata: ErrorMetadata }

export interface ErrorMetadata {
  action:        string
  timestamp:     string
  correlationId: string
  context?:      Record<string, unknown>
}

export interface StreamChunk {
  type:  'delta' | 'done' | 'error'
  text?: string
  error?: string
}

export interface ConversationMessage {
  role:    'user' | 'assistant'
  content: string
}

export interface OpportunityRecord {
  id:            string
  title:         string
  domain:        string
  effort:        'low' | 'medium' | 'high'
  confidence:    'speculative' | 'likely' | 'strong'
  revenueModel:  string
  description:   string
  detectedAt:    string
  sessionId:     string
}

export interface PipelineStage {
  id:          number
  code:        string
  label:       string
  description: string
  phase:       1 | 2
}

export type PipelineStatus =
  | 'idle'
  | 'running'
  | 'awaiting_clearance'
  | 'approved'
  | 'complete'
  | 'error'
