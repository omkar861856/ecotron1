import Fastify from 'fastify';
import cors from '@fastify/cors';
import redis from '@fastify/redis';
import axios from 'axios';
import { z } from 'zod';
import { Pool } from 'pg';

const fastify = Fastify({ logger: true });

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://ollama:11434/api/generate';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Register CORS
fastify.register(cors, { origin: '*' });

// Register Redis
if (process.env.REDIS_URL) {
  fastify.register(redis, { url: process.env.REDIS_URL });
}

// Database Initialization
const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS prompts (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT DEFAULT 'general',
        author TEXT DEFAULT 'Community',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } finally {
    client.release();
  }
};

const GenerateSchema = z.object({
  prompt: z.string(),
  task: z.string().optional(),
});

const PromptSchema = z.object({
  title: z.string(),
  content: z.string(),
  category: z.string().optional(),
  author: z.string().optional(),
});

async function callOllama(prompt: string, model: string = 'llama3.1:8b') {
  try {
    const response = await axios.post(OLLAMA_URL, {
      model,
      prompt,
      stream: false,
      options: {
        num_predict: 500,
        temperature: 0.7,
      }
    });
    return response.data.response;
  } catch (error: any) {
    fastify.log.error(error);
    throw new Error('AI Engine unavailable');
  }
}

// --- AI ROUTES ---

fastify.post('/api/resume', async (request, reply) => {
  const { prompt } = GenerateSchema.parse(request.body);
  const result = await callOllama(`Expert Resume Builder: ${prompt}`, 'llama3.1:8b');
  return { result };
});

fastify.post('/api/rewrite', async (request, reply) => {
  const { prompt } = GenerateSchema.parse(request.body);
  const result = await callOllama(`Professional Rewrite: ${prompt}`, 'qwen2.5:7b');
  return { result };
});

fastify.post('/api/summarize', async (request, reply) => {
  const { prompt } = GenerateSchema.parse(request.body);
  const result = await callOllama(`Concise Summary (3 bullets): ${prompt}`, 'qwen2.5:7b');
  return { result };
});

// --- PROMPT LIBRARY ROUTES ---

fastify.get('/api/prompts', async () => {
  const { rows } = await pool.query('SELECT * FROM prompts ORDER BY created_at DESC');
  return rows;
});

fastify.post('/api/prompts', async (request, reply) => {
  const { title, content, category, author } = PromptSchema.parse(request.body);
  const { rows } = await pool.query(
    'INSERT INTO prompts (title, content, category, author) VALUES ($1, $2, $3, $4) RETURNING *',
    [title, content, category || 'general', author || 'Community']
  );
  return rows[0];
});

// Health check
fastify.get('/health', async () => ({ status: 'ok' }));

const start = async () => {
  try {
    await initDB();
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Server started on port 3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
