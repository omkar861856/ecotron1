import Fastify from 'fastify';
import cors from '@fastify/cors';
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

// --- IMAGE GENERATION (Core Logic) ---
const performGeneration = async () => {
  const { rows } = await pool.query('SELECT id, content FROM prompts WHERE is_generated = FALSE ORDER BY RANDOM() LIMIT 1');
  if (rows.length === 0) return { status: 'no_prompts' };

  const promptId = rows[0].id;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([`Create a high-fidelity preview image for this AI prompt: ${rows[0].content}`]);
    const part = result.response.candidates![0].content.parts.find(p => p.inlineData);
    
    if (part?.inlineData) {
      const fileName = `gen_${promptId}_${Date.now()}.png`;
      const buffer = Buffer.from(part.inlineData.data, 'base64');
      await minioClient.putObject(BUCKET_NAME, fileName, buffer, buffer.length, { 'Content-Type': 'image/png' });
      const publicUrl = `https://api.ecotron.co.in/cdn/${fileName}`;
      await pool.query('UPDATE prompts SET image_url = $1, is_generated = TRUE WHERE id = $2', [publicUrl, promptId]);
      await pool.query('INSERT INTO generations (prompt_id, status) VALUES ($1, $2)', [promptId, 'success']);
      return { status: 'success', url: publicUrl };
    }
    return { status: 'failed_no_image' };
  } catch (err: any) {
    await pool.query('INSERT INTO generations (prompt_id, status, error_msg) VALUES ($1, $2, $3)', [promptId, 'error', err.message]);
    return { status: 'error', error: err.message };
  }
};

// --- SLOW-BURN CRON ---
cron.schedule('0 */2 * * *', async () => {
  console.log('Running scheduled generation...');
  await performGeneration();
});

// --- ROUTES ---

// Manual Trigger (Admin)
fastify.post('/api/admin/trigger-gen', async () => {
  return await performGeneration();
});

// Seed Elite (Admin)
fastify.post('/api/admin/seed-elite', async () => {
  const elitePrompts = [
    ['Cinematic Japanese Romance', '15-second cinematic Japanese drama pure love ambiguous short film...', 'Video', '阳家豪', 'https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/7f63ad253175a9ad1dac53de490efac8/thumbnails/thumbnail.jpg', true],
    ['Haute Couture Fantasy', 'Hollywood Haute Couture Fantasy blockbuster...', 'Video', 'John', 'https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/e066fab457509bc6809ea212ae5d6a51/thumbnails/thumbnail.jpg', true],
    ['Modern Rural Aesthetics', 'Modern Rural Aesthetics, Cinematic Commercial quality...', 'Video', 'John', 'https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/ce508b28e505ffce07247e2ab036d6f1/thumbnails/thumbnail.jpg', true],
    ['Cyberpunk Neon Samurai', 'A cyberpunk neon-lit street with a cybernetic samurai standing in the rain...', 'Art', 'Ecotron AI', null, false]
  ];

  for (const p of elitePrompts) {
    await pool.query(
      'INSERT INTO prompts (title, content, category, author, image_url, is_generated) VALUES ($1, $2, $3, $4, $5, $6)',
      p
    );
  }
  return { status: 'success', added: elitePrompts.length };
});

fastify.get('/api/categories', async () => {
  const { rows } = await pool.query('SELECT DISTINCT category FROM prompts WHERE category IS NOT NULL ORDER BY category ASC');
  return rows.map(r => r.category);
});

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

fastify.get('/api/prompts', async (request) => {
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

fastify.get('/cdn/:filename', async (request, reply) => {
  const { filename } = request.params as { filename: string };
  try {
    const stream = await minioClient.getObject(BUCKET_NAME, filename);
    reply.type('image/png').send(stream);
  } catch (err) { reply.status(404).send('Not Found'); }
});

const start = async () => {
  try {
    await initDB();
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
  } catch (err) { process.exit(1); }
};
start();
