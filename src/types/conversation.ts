export interface ConversationTurn {
  id:        string
  role:      'user' | 'assistant'
  content:   string
  timestamp: string
  agentId:   'argos' | 'argus'
}

export interface SessionAnchor {
  projectState:   string
  whatChanged:    string
  currentObjective: string
  nextBestAction: string
  updatedAt:      string
}

export interface ArgosSession {
  id:        string
  turns:     ConversationTurn[]
  anchor:    SessionAnchor | null
  createdAt: string
  updatedAt: string
}

export interface ArgusSession {
  id:          string
  prompt:      string
  tier:        1 | 2 | 3
  currentStage: number
  turns:       ConversationTurn[]
  createdAt:   string
  updatedAt:   string
}
