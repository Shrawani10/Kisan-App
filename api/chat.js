import { createClient } from '@supabase/supabase-js';

const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
const PROJECT_CONNECTION_STRING = process.env.PROJECT_CONNECTION_STRING;
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const AZURE_FOUNDRY_AGENT_ID = process.env.AZURE_FOUNDRY_AGENT_ID;
const AZURE_API_VERSION = process.env.AZURE_API_VERSION || '2024-10-21';

const requiredEnv = [
  ['AZURE_OPENAI_ENDPOINT', AZURE_OPENAI_ENDPOINT],
  ['AZURE_OPENAI_KEY', AZURE_OPENAI_KEY],
  ['PROJECT_CONNECTION_STRING', PROJECT_CONNECTION_STRING],
  ['SUPABASE_JWT_SECRET', SUPABASE_JWT_SECRET],
  ['SUPABASE_URL', SUPABASE_URL],
  ['SUPABASE_ANON_KEY', SUPABASE_ANON_KEY],
  ['AZURE_FOUNDRY_AGENT_ID', AZURE_FOUNDRY_AGENT_ID],
];

const missingEnv = requiredEnv.filter(([, value]) => !value).map(([name]) => name);

const supabase = missingEnv.length
  ? null
  : createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getBearerToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing Authorization bearer token');
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    throw new Error('Empty bearer token');
  }
  return token;
}

async function verifySupabaseToken(req) {
  if (!supabase) {
    throw new Error(`Server misconfigured. Missing env: ${missingEnv.join(', ')}`);
  }

  const token = getBearerToken(req);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user?.id) {
    throw new Error('Unauthorized');
  }

  return data.user.id;
}

async function azureRequest(path, options = {}) {
  const endpoint = AZURE_OPENAI_ENDPOINT.replace(/\/$/, '');
  const url = `${endpoint}${path}${path.includes('?') ? '&' : '?'}api-version=${AZURE_API_VERSION}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'api-key': AZURE_OPENAI_KEY,
      ...options.headers,
    },
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body?.error?.message || body?.message || 'Azure request failed';
    throw new Error(message);
  }
  return body;
}

async function runFoundryAgent(userMessage, userId) {
  const run = await azureRequest('/openai/threads/runs', {
    method: 'POST',
    body: JSON.stringify({
      assistant_id: AZURE_FOUNDRY_AGENT_ID,
      thread: {
        messages: [{ role: 'user', content: userMessage }],
      },
      metadata: {
        user_id: userId,
      },
    }),
  });

  let runStatus = run?.status;
  const runId = run?.id;
  const threadId = run?.thread_id;

  if (!runId || !threadId) {
    throw new Error('Azure Agent did not return run identifiers');
  }

  const processingStatuses = new Set(['queued', 'in_progress', 'requires_action', 'cancelling']);
  let attempts = 0;
  while (processingStatuses.has(runStatus) && attempts < 40) {
    await sleep(1000);
    attempts += 1;

    const next = await azureRequest(`/openai/threads/${threadId}/runs/${runId}`, {
      method: 'GET',
    });
    runStatus = next?.status;
  }

  if (runStatus !== 'completed') {
    throw new Error(`Azure Agent run did not complete. Status: ${runStatus || 'unknown'}`);
  }

  const messages = await azureRequest(`/openai/threads/${threadId}/messages?order=desc&limit=20`, {
    method: 'GET',
  });

  const assistant = (messages?.data || []).find((item) => item.role === 'assistant');
  const textParts = (assistant?.content || [])
    .filter((item) => item?.type === 'text')
    .map((item) => item?.text?.value || '')
    .join('\n')
    .trim();

  if (!textParts) {
    throw new Error('Azure Agent returned empty assistant content');
  }

  return textParts;
}

function parseAgentJson(rawOutput) {
  const trimmed = String(rawOutput || '').trim();
  if (!trimmed) {
    throw new Error('Agent output is empty');
  }

  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (!match) {
      throw new Error('Agent response is not valid JSON');
    }
    parsed = JSON.parse(match[1]);
  }

  if (typeof parsed.message !== 'string') {
    throw new Error('Agent JSON missing string "message"');
  }

  const products = Array.isArray(parsed.products) ? parsed.products : [];

  return {
    message: parsed.message,
    products: products.map((item) => ({
      id: String(item?.id ?? ''),
      name: String(item?.name ?? ''),
      description: String(item?.description ?? ''),
      category: String(item?.category ?? ''),
      price: Number(item?.price ?? 0),
      image_url: item?.image_url ? `/api/image?url=${encodeURIComponent(String(item.image_url))}` : '',
      buy_link: String(item?.buy_link ?? ''),
      unit: String(item?.unit ?? ''),
      type: String(item?.type ?? item?.category ?? ''),
      technical_name: String(item?.technical_name ?? ''),
      features: String(item?.features ?? ''),
      diseases: Array.isArray(item?.diseases) ? item.diseases : [],
      crops: Array.isArray(item?.crops) ? item.crops : [],
      crop_usage: Array.isArray(item?.crop_usage) ? item.crop_usage : [],
      keywords: Array.isArray(item?.keywords) ? item.keywords : [],
    })),
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (missingEnv.length > 0) {
      return res.status(500).json({
        error: `Missing required environment variables: ${missingEnv.join(', ')}`,
      });
    }

    const userId = await verifySupabaseToken(req);

    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (!message) {
      return res.status(400).json({ error: 'Missing or invalid "message"' });
    }

    const rawAgentOutput = await runFoundryAgent(message, userId);
    const parsed = parseAgentJson(rawAgentOutput);

    return res.status(200).json(parsed);
  } catch (error) {
    const errorText = error instanceof Error ? error.message : 'Unknown error';
    const statusCode = errorText.includes('Unauthorized') ? 401 : 500;
    return res.status(statusCode).json({ error: errorText });
  }
}
