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
    // 1. Create tables
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
        prompt_id INTEGER REFERENCES prompts(id),
        status TEXT,
        error_msg TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. ALTER existing table to ensure columns exist
    await client.query(`
      ALTER TABLE prompts ADD COLUMN IF NOT EXISTS is_generated BOOLEAN DEFAULT FALSE;
      ALTER TABLE prompts ADD COLUMN IF NOT EXISTS image_url TEXT;
    `);

    // 3. MinIO Bucket
    const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
    if (!bucketExists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      const policy = {
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
        }],
      };
      await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
    }
  } finally {
    client.release();
  }
};

// --- IMAGE GENERATION (NANO BANANA) ---
const generateImage = async (promptId: number, promptText: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-image-preview" });
    const result = await model.generateContent([`Create a high-fidelity preview image for this AI prompt: ${promptText}.`]);
    const response = await result.response;
    const part = response.candidates![0].content.parts.find(p => p.inlineData);
    
    if (part && part.inlineData) {
      const fileName = `prompt_${promptId}_${Date.now()}.png`;
      const buffer = Buffer.from(part.inlineData.data, 'base64');
      await minioClient.putObject(BUCKET_NAME, fileName, buffer, buffer.length, { 'Content-Type': 'image/png' });
      const publicUrl = `https://api.ecotron.co.in/cdn/${fileName}`;
      await pool.query('UPDATE prompts SET image_url = $1, is_generated = TRUE WHERE id = $2', [publicUrl, promptId]);
      await pool.query('INSERT INTO generations (prompt_id, status) VALUES ($1, $2)', [promptId, 'success']);
      return publicUrl;
    }
  } catch (error: any) {
    console.error('Image Gen Error:', error);
    await pool.query('INSERT INTO generations (prompt_id, status, error_msg) VALUES ($1, $2, $3)', [promptId, 'error', error.message]);
  }
};

// --- SLOW-BURN CRON (Every 2 Hours) ---
cron.schedule('0 */2 * * *', async () => {
  console.log('Running 2-hour single image generation...');
  const { rows } = await pool.query('SELECT id, content FROM prompts WHERE is_generated = FALSE ORDER BY RANDOM() LIMIT 1');
  if (rows.length > 0) {
    await generateImage(rows[0].id, rows[0].content);
  }
});

// --- AI QUOTE (Every 12 Hours) ---
const generateQuote = async () => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Write a short, inspiring quote about AI and human creativity (max 15 words).");
    const quote = result.response.text().trim();
    await pool.query('INSERT INTO site_data (key, value, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()', ['quote_of_day', quote]);
  } catch (err) { console.error(err); }
};
cron.schedule('0 */12 * * *', generateQuote);

// --- ROUTES ---
fastify.get('/api/quote', async () => {
  const { rows } = await pool.query('SELECT value FROM site_data WHERE key = $1', ['quote_of_day']);
  return { quote: rows[0]?.value || "Creativity is the bridge between AI and humanity." };
});

fastify.post('/api/search', async (request) => {
  const { query } = z.object({ query: z.string() }).parse(request.body);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const aiAnalysis = await model.generateContent(`Keywords for: "${query}". Return only 3 keywords.`);
  const keywords = aiAnalysis.response.text().split(',').map(k => `%${k.trim()}%`);
  const { rows } = await pool.query('SELECT * FROM prompts WHERE title ILIKE ANY($1) OR content ILIKE ANY($1) LIMIT 30', [keywords]);
  return rows;
});

fastify.post('/api/recommendations', async (request) => {
  const { history } = z.object({ history: z.array(z.string()) }).parse(request.body);
  if (history.length === 0) return [];
  const { rows } = await pool.query('SELECT * FROM prompts WHERE is_generated = TRUE ORDER BY RANDOM() LIMIT 12');
  return rows;
});

fastify.get('/api/prompts', async (request) => {
  const { page = 1, limit = 24, category = 'all' } = request.query as any;
  const offset = (page - 1) * limit;
  let sql = 'SELECT * FROM prompts';
  let params = [];
  if (category !== 'all') {
    sql += ' WHERE category = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    params.push(category, limit, offset);
  } else {
    sql += ' ORDER BY created_at DESC LIMIT $1 OFFSET $2';
    params.push(limit, offset);
  }
  const { rows } = await pool.query(sql, params);
  return { data: rows, page: parseInt(page) };
});

fastify.get('/api/admin/generations', async () => {
  const { rows } = await pool.query('SELECT g.*, p.title FROM generations g JOIN prompts p ON g.prompt_id = p.id ORDER BY g.created_at DESC');
  return rows;
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
    generateQuote();
  } catch (err) { process.exit(1); }
};
start();
