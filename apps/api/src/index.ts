import Fastify from 'fastify';
import cors from '@fastify/cors';
import redis from '@fastify/redis';
import axios from 'axios';
import { z } from 'zod';
import { Pool } from 'pg';
import { GoogleGenerativeAI } from '@google/generative-ai';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';

const fastify = Fastify({ logger: true });

// Configuration
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://ollama:11434/api/generate';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Ensure storage directory exists
const STORAGE_DIR = '/root/ecotron/public/generated';
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

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
    // prompts table with image_url and refinement status
    await client.query(`
      CREATE TABLE IF NOT EXISTS prompts (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT DEFAULT 'general',
        author TEXT DEFAULT 'Community',
        image_url TEXT,
        is_generated BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // generations log for admin panel
    await client.query(`
      CREATE TABLE IF NOT EXISTS generations (
        id SERIAL PRIMARY KEY,
        prompt_id INTEGER REFERENCES prompts(id),
        status TEXT,
        error_msg TEXT,
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

// --- IMAGE GENERATION (NANO BANANA) ---

const generateImage = async (promptId: number, promptText: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-image-preview" });
    const result = await model.generateContent([`Create a high-fidelity preview image for this AI prompt: ${promptText}. Style: Professional, clean, and representative.`]);
    const response = await result.response;
    
    // Extract image data (assuming standard base64/buffer response from SDK)
    const part = response.candidates![0].content.parts.find(p => p.inlineData);
    if (part && part.inlineData) {
      const fileName = `prompt_${promptId}_${Date.now()}.png`;
      const filePath = path.join(STORAGE_DIR, fileName);
      fs.writeFileSync(filePath, Buffer.from(part.inlineData.data, 'base64'));
      
      const publicUrl = `https://api.ecotron.co.in/generated/${fileName}`;
      await pool.query('UPDATE prompts SET image_url = $1, is_generated = TRUE WHERE id = $2', [publicUrl, promptId]);
      await pool.query('INSERT INTO generations (prompt_id, status) VALUES ($1, $2)', [promptId, 'success']);
      return publicUrl;
    }
  } catch (error: any) {
    console.error('Image Gen Error:', error);
    await pool.query('INSERT INTO generations (prompt_id, status, error_msg) VALUES ($1, $2, $3)', [promptId, 'error', error.message]);
  }
};

// --- CRON JOB (Every 4 Hours) ---
cron.schedule('0 */4 * * *', async () => {
  console.log('Running 4-hour Image Generation Cron...');
  const { rows } = await pool.query('SELECT id, content FROM prompts WHERE is_generated = FALSE ORDER BY RANDOM() LIMIT 1');
  if (rows.length > 0) {
    await generateImage(rows[0].id, rows[0].content);
  }
});

// --- ROUTES ---

fastify.get('/api/prompts', async () => {
  const { rows } = await pool.query('SELECT * FROM prompts ORDER BY created_at DESC');
  return rows;
});

// Refine Prompt with Guardrails
fastify.post('/api/refine', async (request, reply) => {
  const { prompt } = GenerateSchema.parse(request.body);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const systemPrompt = `You are a Prompt Engineering Expert for the Nano Banana model. 
  Refine the user's raw prompt into a highly detailed, professional prompt.
  GUARDRAILS: 
  - No NSFW, toxic, or harmful content.
  - No generation of real people without permission.
  - Focus on artistic quality and clarity.
  Original: ${prompt}`;
  
  const result = await model.generateContent(systemPrompt);
  return { result: result.response.text() };
});

// Admin generations check
fastify.get('/api/admin/generations', async (request, reply) => {
  // Simple auth check could be added here
  const { rows } = await pool.query('SELECT g.*, p.title FROM generations g JOIN prompts p ON g.prompt_id = p.id ORDER BY g.created_at DESC');
  return rows;
});

// Serve generated images
fastify.get('/generated/:filename', async (request, reply) => {
  const { filename } = request.params as { filename: string };
  const filePath = path.join(STORAGE_DIR, filename);
  if (fs.existsSync(filePath)) {
    const stream = fs.createReadStream(filePath);
    reply.type('image/png').send(stream);
  } else {
    reply.status(404).send('Not Found');
  }
});

// Standard AI Routes (existing)
fastify.post('/api/resume', async (request, reply) => {
  const { prompt } = GenerateSchema.parse(request.body);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(`Expert Resume Builder: ${prompt}`);
  return { result: result.response.text() };
});

fastify.post('/api/rewrite', async (request, reply) => {
  const { prompt } = GenerateSchema.parse(request.body);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(`Professional Rewrite: ${prompt}`);
  return { result: result.response.text() };
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
