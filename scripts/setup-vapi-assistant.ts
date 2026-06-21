#!/usr/bin/env npx tsx
/**
 * VAPI Assistant Setup Script
 *
 * Creates two VAPI Assistants (Dutch + English) for Haven's real-time voice
 * conversations. Run once to set up, then store the returned assistant IDs
 * as environment variables.
 *
 * Usage:
 *   VAPI_API_KEY=vapi_xxx \
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   ELEVENLABS_VOICE_ID_NL=xxx \
 *   ELEVENLABS_VOICE_ID_EN=xxx \
 *   npx tsx scripts/setup-vapi-assistant.ts
 *
 * Output:
 *   VAPI_ASSISTANT_ID_NL=<uuid>
 *   VAPI_ASSISTANT_ID_EN=<uuid>
 *
 * Add these to your .env files and Supabase secrets.
 */

const VAPI_API_KEY = process.env.VAPI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const ELEVENLABS_VOICE_ID_NL = process.env.ELEVENLABS_VOICE_ID_NL;
const ELEVENLABS_VOICE_ID_EN = process.env.ELEVENLABS_VOICE_ID_EN;

if (!VAPI_API_KEY) {
  console.error('ERROR: VAPI_API_KEY is required. Get it from https://dashboard.vapi.ai/api-keys');
  process.exit(1);
}

if (!SUPABASE_URL) {
  console.error('ERROR: SUPABASE_URL is required.');
  process.exit(1);
}

interface AssistantConfig {
  name: string;
  model: {
    provider: string;
    model: string;
    temperature: number;
    messages: Array<{ role: string; content: string }>;
    tools: Array<{
      type: string;
      function: {
        name: string;
        description: string;
        parameters: Record<string, unknown>;
      };
    }>;
  };
  voice: {
    provider: string;
    voiceId: string;
    model: string;
    stability: number;
    similarityBoost: number;
  };
  transcriber: {
    provider: string;
    model: string;
    language: string;
  };
  firstMessage: string;
  serverUrl: string;
  endCallFunctionEnabled: boolean;
  silenceTimeoutSeconds: number;
  maxDurationSeconds: number;
}

function buildTools(isNl: boolean) {
  return [
    {
      type: 'function' as const,
      function: {
        name: 'confirm_medication',
        description: isNl ? 'Bevestig dat de oudere medicijnen heeft ingenomen' : 'Confirm that the elder took their medication',
        parameters: {
          type: 'object',
          properties: {
            elder_id: { type: 'string', description: 'Elder profile ID (passed via metadata)' },
            transcript: { type: 'string', description: 'What the elder said about medication' },
            locale: { type: 'string', enum: ['nl-NL', 'en-GB'] },
          },
          required: ['elder_id', 'transcript', 'locale'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'escalate_crisis',
        description: isNl ? 'Escaleer een noodsituatie — oudere is gevallen, heeft pijn, of voelt zich niet goed' : 'Escalate a crisis — elder has fallen, is in pain, or feels unwell',
        parameters: {
          type: 'object',
          properties: {
            elder_id: { type: 'string', description: 'Elder profile ID' },
            transcript: { type: 'string', description: 'What the elder said' },
            locale: { type: 'string', enum: ['nl-NL', 'en-GB'] },
          },
          required: ['elder_id', 'transcript', 'locale'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'send_family_message',
        description: isNl ? 'Stuur een bericht naar de familie' : 'Send a message to the family',
        parameters: {
          type: 'object',
          properties: {
            elder_id: { type: 'string', description: 'Elder profile ID' },
            message: { type: 'string', description: 'Message to send' },
            message_type: { type: 'string', enum: ['check_in', 'heart', 'story'] },
            locale: { type: 'string', enum: ['nl-NL', 'en-GB'] },
          },
          required: ['elder_id', 'locale'],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'get_medication_schedule',
        description: isNl ? 'Haal het medicijnschema op' : 'Get the medication schedule',
        parameters: {
          type: 'object',
          properties: {
            elder_id: { type: 'string', description: 'Elder profile ID' },
            locale: { type: 'string', enum: ['nl-NL', 'en-GB'] },
          },
          required: ['elder_id', 'locale'],
        },
      },
    },
  ];
}

function buildAssistant(locale: 'nl-NL' | 'en-GB'): AssistantConfig {
  const isNl = locale === 'nl-NL';
  const voiceId = isNl
    ? (ELEVENLABS_VOICE_ID_NL ?? 'pNInz6obpgDQGcFmaJgB') // Default: Adam
    : (ELEVENLABS_VOICE_ID_EN ?? 'pNInz6obpgDQGcFmaJgB');

  return {
    name: `HAVEN Companion (${isNl ? 'Nederlands' : 'English'})`,
    model: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: isNl
            ? `Je bent HAVEN, een vriendelijke digitale hulp voor een oudere in Nederland.

Regels:
- Spreek met "u" en "uw" (formeel Nederlands).
- Maximaal twee korte zinnen per antwoord.
- Je bent geen arts en geen mens; wees eerlijk hierover als gevraagd.
- Als iemand zegt dat ze gevallen zijn, pijn hebben, of zich niet goed voelen: gebruik ALTIJD de escalate_crisis functie.
- Als iemand zegt dat ze hun medicijnen hebben ingenomen: gebruik de confirm_medication functie.
- Als iemand een bericht wil sturen naar familie: gebruik send_family_message.
- Als iemand vraagt over medicijnschema: gebruik get_medication_schedule.
- Wees warm, rustig en geduldig. De gebruiker is een oudere die misschien moeite heeft met technologie.`
            : `You are HAVEN, a warm digital helper for an older adult.

Rules:
- Use respectful, calm language. Maximum two short sentences per reply.
- You are not a doctor and not a human; be honest about this if asked.
- If someone says they've fallen, are in pain, or feel unwell: ALWAYS use the escalate_crisis function.
- If someone says they took their medication: use the confirm_medication function.
- If someone wants to send a message to family: use send_family_message.
- If someone asks about medication schedule: use get_medication_schedule.
- Be warm, calm and patient. The user is an older adult who may have difficulty with technology.`,
        },
      ],
      tools: buildTools(isNl),
    },
    voice: {
      provider: '11labs',
      voiceId,
      model: 'eleven_multilingual_v2',
      stability: 0.72,
      similarityBoost: 0.8,
    },
    transcriber: {
      provider: 'openai',
      model: 'gpt-4o-mini-transcribe',
      language: isNl ? 'nl' : 'en',
    },
    firstMessage: isNl
      ? 'Hallo, ik ben er voor u. Wat kan ik voor u doen?'
      : 'Hello, I am here for you. What can I help you with?',
    serverUrl: `${SUPABASE_URL}/functions/v1/fn-vapi-webhook`,
    endCallFunctionEnabled: true,
    silenceTimeoutSeconds: 30,
    maxDurationSeconds: 300,
  };
}

async function createAssistant(config: AssistantConfig): Promise<string> {
  const response = await fetch('https://api.vapi.ai/assistant', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`VAPI API error (${response.status}): ${text}`);
  }

  const data = await response.json() as { id: string };
  return data.id;
}

async function main() {
  console.log('Creating VAPI Assistants for Haven...\n');

  console.log('1. Creating Dutch (nl-NL) assistant...');
  const nlConfig = buildAssistant('nl-NL');
  const nlId = await createAssistant(nlConfig);
  console.log(`   VAPI_ASSISTANT_ID_NL=${nlId}`);

  console.log('2. Creating English (en-GB) assistant...');
  const enConfig = buildAssistant('en-GB');
  const enId = await createAssistant(enConfig);
  console.log(`   VAPI_ASSISTANT_ID_EN=${enId}`);

  console.log('\n--- Add these to your environment ---');
  console.log(`EXPO_PUBLIC_VAPI_API_KEY=${VAPI_API_KEY}`);
  console.log(`EXPO_PUBLIC_VAPI_ASSISTANT_ID_NL=${nlId}`);
  console.log(`EXPO_PUBLIC_VAPI_ASSISTANT_ID_EN=${enId}`);
  console.log(`EXPO_PUBLIC_VAPI_ASSISTANT_ID=${nlId}`);
  console.log('\n--- Add to Supabase secrets ---');
  console.log(`supabase secrets set VAPI_API_KEY=${VAPI_API_KEY}`);
  console.log(`supabase secrets set VAPI_ASSISTANT_ID_NL=${nlId}`);
  console.log(`supabase secrets set VAPI_ASSISTANT_ID_EN=${enId}`);
}

main().catch((err) => {
  console.error('Failed to create VAPI assistants:', err);
  process.exit(1);
});
