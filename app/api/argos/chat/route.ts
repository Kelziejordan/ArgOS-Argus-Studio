// filepath: app/api/argos/chat/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from '@google/generative-ai'
import { ARGOS_SYSTEM_PROMPT } from '@/utils/prompts/argos'

// Define the tool for Gemini to use when it's time to code
const triggerArgusTool: FunctionDeclaration = {
  name: "trigger_argus_pipeline",
  description: "Use this tool ONLY when the user approves a feature and it is time to generate code. This hands control to the ARGUS V10 engineer.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      feature_spec: { 
        type: SchemaType.STRING, 
        description: "The exact, detailed requirements for ARGUS to build." 
      },
      tier: { 
        type: SchemaType.NUMBER, 
        description: "1 for Full App, 2 for Feature, 3 for Component." 
      }
    },
    required: ["feature_spec", "tier"]
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json()
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      console.error('[ArgOS] Missing GEMINI_API_KEY')
      return NextResponse.json({ error: 'Server is missing the Gemini API Key.' }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: ARGOS_SYSTEM_PROMPT,
      tools: [{ functionDeclarations: [triggerArgusTool] }],
    })

    // Map our chat history to the format Gemini expects
    const geminiHistory = history.map((msg: { role: string, content: string }) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content || '' }]
    }))

    const chat = model.startChat({ history: geminiHistory })
    const result = await chat.sendMessage(message)
    const response = result.response

    // Check if Gemini decided to call our tool
    const functionCalls = response.functionCalls()
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0]
      if (call.name === 'trigger_argus_pipeline') {
        const args = call.args as { feature_spec: string, tier: number }
        // If it did, send the special 'handoff' response to the frontend
        return NextResponse.json({
          type: 'handoff',
          action: 'trigger_argus_pipeline',
          payload: { feature_spec: args.feature_spec, tier: args.tier }
        })
      }
    }

    // If no tool was called, just send back the text response
    return NextResponse.json({ type: 'message', content: response.text() })

  } catch (err) {
    console.error('[ArgOS API Error]', err)
    return NextResponse.json({ error: 'An error occurred in the ArgOS API.' }, { status: 500 })
  }
}
