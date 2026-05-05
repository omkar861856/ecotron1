import Fastify from 'fastify';
import cors from '@fastify/cors';
import redis from '@fastify/redis';
import { z } from 'zod';
import { Pool } from 'pg';
import { GoogleGenerativeAI } from '@google/generative-ai';
import cron from 'node-cron';
import * as Minio from 'minio';

const fastify = Fastify({ logger: true });

// Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Ollama Config (Internal)
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://ollama:11434';

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

      CREATE TABLE IF NOT EXISTS generations (
        id SERIAL PRIMARY KEY,
        prompt_id INTEGER,
        status TEXT,
        error_msg TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS api_stats (
        route TEXT PRIMARY KEY,
        hits INTEGER DEFAULT 0,
        last_call TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE prompts ADD COLUMN IF NOT EXISTS is_generated BOOLEAN DEFAULT FALSE;
      ALTER TABLE prompts ADD COLUMN IF NOT EXISTS image_url TEXT;
    `);
  } finally {
    client.release();
  }
};

// --- TELEMETRY HELPER ---
const trackHit = async (route: string) => {
  try {
    await pool.query('INSERT INTO api_stats (route, hits, last_call) VALUES ($1, 1, NOW()) ON CONFLICT (route) DO UPDATE SET hits = api_stats.hits + 1, last_call = NOW()', [route]);
  } catch (err) { console.error(err); }
};

// --- IMAGE GENERATION (Every 2 Hours) ---
cron.schedule('0 */2 * * *', async () => {
  console.log('Running 2-hour slow-burn generation...');
  const { rows } = await pool.query('SELECT id, content FROM prompts WHERE is_generated = FALSE ORDER BY RANDOM() LIMIT 1');
  if (rows.length > 0) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-image-preview" });
      const result = await model.generateContent([`Create a high-fidelity preview image for: ${rows[0].content}`]);
      const part = result.response.candidates![0].content.parts.find(p => p.inlineData);
      if (part?.inlineData) {
        const fileName = `prompt_${rows[0].id}.png`;
        const buffer = Buffer.from(part.inlineData.data, 'base64');
        await minioClient.putObject(BUCKET_NAME, fileName, buffer, buffer.length, { 'Content-Type': 'image/png' });
        const url = `https://api.ecotron.co.in/cdn/${fileName}`;
        await pool.query('UPDATE prompts SET image_url = $1, is_generated = TRUE WHERE id = $2', [url, rows[0].id]);
        await pool.query('INSERT INTO generations (prompt_id, status) VALUES ($1, $2)', [rows[0].id, 'success']);
      }
    } catch (err) { 
      await pool.query('INSERT INTO generations (prompt_id, status, error_msg) VALUES ($1, $2, $3)', [rows[0].id, 'error', err.message]);
    }
  }
});

// --- ROUTES ---

fastify.post('/api/search', async (request) => {
  await trackHit('search');
  const { query } = z.object({ query: z.string() }).parse(request.body);
  const { rows } = await pool.query('SELECT * FROM prompts WHERE title ILIKE $1 OR content ILIKE $1 LIMIT 50', [`%${query}%`]);
  return rows;
});

fastify.post('/api/recommendations', async (request) => {
  await trackHit('recommendations');
  const { rows } = await pool.query('SELECT * FROM prompts WHERE is_generated = TRUE ORDER BY RANDOM() LIMIT 12');
  return rows;
});

fastify.get('/api/prompts', async (request) => {
  await trackHit('prompts_list');
  const { page = 1, limit = 24, category = 'all' } = request.query as any;
  const offset = (page - 1) * limit;
  let sql = 'SELECT * FROM prompts';
  let params = [];
  if (category !== 'all') {
    sql += ' WHERE category ILIKE $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    params.push(category, limit, offset);
  } else {
    sql += ' ORDER BY created_at DESC LIMIT $1 OFFSET $2';
    params.push(limit, offset);
  }
  const { rows } = await pool.query(sql, params);
  return { data: rows, page: parseInt(page) };
});

// Admin Stats
fastify.get('/api/admin/stats', async () => {
  const statsRes = await pool.query('SELECT * FROM api_stats ORDER BY hits DESC');
  const gensRes = await pool.query('SELECT g.*, p.title FROM generations g LEFT JOIN prompts p ON g.prompt_id = p.id ORDER BY g.created_at DESC LIMIT 50');
  const totalPrompts = await pool.query('SELECT COUNT(*) FROM prompts');
  const totalGens = await pool.query('SELECT COUNT(*) FROM prompts WHERE is_generated = TRUE');
  
  return {
    apiHits: statsRes.rows,
    recentGens: gensRes.rows,
    overview: {
      totalPrompts: totalPrompts.rows[0].count,
      totalGens: totalGens.rows[0].count
    }
  };
});

fastify.get('/cdn/:filename', async (request, reply) => {
  const { filename } = request.params as { filename: string };
  try {
    const stream = await minioClient.getObject(BUCKET_NAME, filename);
    reply.type('image/png').send(stream);
  } catch (err) { reply.status(404).send('Not Found'); }
});

fastify.get('/health', async () => ({ status: 'ok' }));

const start = async () => {
  try {
    await initDB();
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
  } catch (err) { process.exit(1); }
};
start();
