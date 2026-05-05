import Fastify from 'fastify';
import cors from '@fastify/cors';
import redis from '@fastify/redis';
import { z } from 'zod';
import { Pool } from 'pg';
import { GoogleGenerativeAI } from '@google/generative-ai';
import cron from 'node-cron';
import * as Minio from 'minio';
import path from 'path';

const fastify = Fastify({ logger: true });

// Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// MinIO Client
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

const BUCKET_NAME = 'prompts-media';

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
        image_url TEXT,
        is_generated BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS site_data (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } finally {
    client.release();
  }
};

// --- AI QUOTE (Every 12 Hours) ---
const generateQuote = async () => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Write a short, inspiring quote about AI and human creativity (max 15 words).");
    const quote = result.response.text().trim();
    await pool.query('INSERT INTO site_data (key, value, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()', ['quote_of_day', quote]);
    console.log('Quote updated:', quote);
  } catch (err) {
    console.error('Quote Gen Error:', err);
  }
};

cron.schedule('0 */12 * * *', generateQuote);

// --- ROUTES ---

// Get Quote
fastify.get('/api/quote', async () => {
  const { rows } = await pool.query('SELECT value FROM site_data WHERE key = $1', ['quote_of_day']);
  return { quote: rows[0]?.value || "Creativity is the bridge between AI and humanity." };
});

// AI Search
fastify.post('/api/search', async (request) => {
  const { query } = z.object({ query: z.string() }).parse(request.body);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  // 1. Ask AI for relevant categories and keywords
  const aiAnalysis = await model.generateContent(`Analyze this search query: "${query}". Return only 3-5 keywords or categories that best match it from an AI prompt library. Format: keyword1, keyword2...`);
  const keywords = aiAnalysis.response.text().split(',').map(k => k.trim());
  
  // 2. Search DB using AI keywords + original query
  let sql = 'SELECT * FROM prompts WHERE ';
  const conditions = keywords.map((_, i) => `title ILIKE $${i + 1} OR category ILIKE $${i + 1}`).join(' OR ');
  sql += conditions + ` OR title ILIKE $${keywords.length + 1} LIMIT 30`;
  
  const { rows } = await pool.query(sql, [...keywords, `%${query}%`]);
  return rows;
});

// AI Recommendations (based on recent history)
fastify.post('/api/recommendations', async (request) => {
  const { history } = z.object({ history: z.array(z.string()) }).parse(request.body);
  if (history.length === 0) return [];
  
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `Based on these recently viewed AI prompt titles: ${history.join(', ')}. What are the 3 most relevant prompt categories or topics this user would like? Return only the category names separated by commas.`;
  
  const aiRec = await model.generateContent(prompt);
  const categories = aiRec.response.text().split(',').map(c => c.trim());
  
  const { rows } = await pool.query('SELECT * FROM prompts WHERE category = ANY($1) LIMIT 12', [categories]);
  return rows;
});

// Paginated Prompts
fastify.get('/api/prompts', async (request) => {
  const { page = 1, limit = 24, category = 'all' } = request.query as any;
  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM prompts';
  let params = [];
  if (category !== 'all') {
    query += ' WHERE category = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    params.push(category, limit, offset);
  } else {
    query += ' ORDER BY created_at DESC LIMIT $1 OFFSET $2';
    params.push(limit, offset);
  }
  const { rows } = await pool.query(query, params);
  return { data: rows, page: parseInt(page) };
});

// Admin generations check
fastify.get('/api/admin/generations', async (request, reply) => {
  const { rows } = await pool.query('SELECT g.*, p.title FROM generations g JOIN prompts p ON g.prompt_id = p.id ORDER BY g.created_at DESC');
  return rows;
});

fastify.get('/cdn/:filename', async (request, reply) => {
  const { filename } = request.params as { filename: string };
  try {
    const stream = await minioClient.getObject(BUCKET_NAME, filename);
    reply.type('image/png').send(stream);
  } catch (err) {
    reply.status(404).send('Not Found');
  }
});

fastify.get('/health', async () => ({ status: 'ok' }));

const start = async () => {
  try {
    await initDB();
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Server started on port 3001');
    // Initial quote
    generateQuote();
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
