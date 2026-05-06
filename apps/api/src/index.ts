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
        content TEXT UNIQUE NOT NULL,
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

      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prompts_content_key') THEN
          ALTER TABLE prompts ADD CONSTRAINT prompts_content_key UNIQUE (content);
        END IF;
      END $$;
    `);

    const elitePrompts = [
      ['Japanese Romance Short Film', '15-second cinematic Japanese drama pure love ambiguous short film...', 'Video', '阳家豪', 'https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/7f63ad253175a9ad1dac53de490efac8/thumbnails/thumbnail.jpg', true],
      ['Hollywood Haute Couture', 'Hollywood Haute Couture Fantasy blockbuster, 8K ultra-clear...', 'Video', 'John', 'https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/e066fab457509bc6809ea212ae5d6a51/thumbnails/thumbnail.jpg', true],
      ['Modern Rural Aesthetics', 'Modern Rural Aesthetics, Cinematic Commercial quality...', 'Video', 'John', 'https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/ce508b28e505ffce07247e2ab036d6f1/thumbnails/thumbnail.jpg', true],
      ['Anime Adaptation Duel', 'Live-Action Anime Adaptation · Breathing Technique Decisive Battle...', 'Video', 'John', 'https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/870c9907c5740c3d98ed2d62328ca83b/thumbnails/thumbnail.jpg', true],
      ['80-Year-Old Rapper MV', '16:9 horizontal screen, street rap MV style, neon purple and blue...', 'Video', '松果先森', 'https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/e011d2666b5ee19d5b9f8b9837b974c2/thumbnails/thumbnail.jpg', true],
      ['Street Racing Sequence', 'Cinematic street racing sequence at night, high-performance car...', 'Video', 'Pierrick Chevallier', 'https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/3a7fb0a6d706b9f568479bb720ce1ad4/thumbnails/thumbnail.jpg', true],
      ['Cinematic Espresso', 'Highly technical cinematography prompt for espresso preparation...', 'Video', '1LittleCoder', 'https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/9243165f7b6836e17db18b63fb0e5d4e/thumbnails/thumbnail.jpg', true],
      ['Garage CCTV Horror', '15-second cinematic horror sequence involving a strange being...', 'Video', 'ReAiLity Labs', 'https://cms-assets.youmind.com/media/1777963520650_8373ya_HHft4wUW0AAUpNd.jpg', true],
      ['Animated Dancing Bear', 'A cute animated bear dancing confidently in a forest clearing...', 'Video', 'Aegon', 'https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/19617759819dd0d20afcaad65e874507/thumbnails/thumbnail.jpg', true],
      ['Shanghai Skyline Stunt', 'A stunt rider accelerations a superbike along a construction crane...', 'Video', 'LudovicCreator', 'https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/b5a00d2fa5d0d44cc33ca8d183f947c9/thumbnails/thumbnail.jpg', true],
      ['Epic Samurai Battle', 'A rogue samurai, emotionless and deadly, wearing blood-stained armor...', 'Video', 'Pierrick Chevallier', 'https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/202bce9460c677e2e8f1e7626eb3d303/thumbnails/thumbnail.jpg', true],
      ['Gritty Wrestling Arena', '15-second ultra-realistic cinematic vertical wrestling sequence...', 'Video', 'Ali', 'https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/ce044d2261bc46b8a8ae609a4b948cf9/thumbnails/thumbnail.jpg', true],
      ['Streetwear Dance', 'A confident young woman performs a smooth, expressive dance...', 'Video', 'WasifAI', 'https://cms-assets.youmind.com/media/1777963511924_9ot4to_HHezn1MaoAAPhGb.jpg', true],
      ['Times Square Walk', 'Cinematic 15-second short film walking through Times Square...', 'Video', 'TechieSA', 'https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/fa9db1d577ad48b8755d40426b20597a/thumbnails/thumbnail.jpg', true],
      ['Cybernetic Forest', 'A lush bioluminescent forest with glowing trees and cybernetic animals...', 'Art', 'Ecotron AI', null, false],
      ['Mars Colony 2088', 'Hyper-realistic view of a bustling Mars colony with glass domes and rovers...', 'Architecture', 'Ecotron AI', null, false],
      ['Oceanic Underwater City', 'A vast underwater city with glowing currents and submarine traffic...', 'Sci-Fi', 'Ecotron AI', null, false],
      ['Vintage 1950s Future', 'A retro-futuristic 1950s kitchen with a robot chef and flying cars...', 'Steampunk', 'Ecotron AI', null, false],
      ['Ethereal Glass Sculptures', 'Macro photography of intricate glass sculptures melting under sunset...', 'Photography', 'Ecotron AI', null, false],
      ['Nordic Noir Landscape', 'Moody, atmospheric Nordic landscape with fog rolling over dark cliffs...', 'Cinema', 'Ecotron AI', null, false]
    ];

    for (const p of elitePrompts) {
      await client.query(
        'INSERT INTO prompts (title, content, category, author, image_url, is_generated) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (content) DO NOTHING',
        p
      );
    }
  } finally {
    client.release();
  }
};

// --- GENERATION ENGINE ---
const performGeneration = async () => {
  const { rows } = await pool.query('SELECT id, content FROM prompts WHERE is_generated = FALSE ORDER BY RANDOM() LIMIT 1');
  if (rows.length === 0) return { status: 'no_prompts' };

  const promptId = rows[0].id;
  try {
    // Nano Banana 2/Imagen-3 - Using flash-latest for maximum compatibility
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const result = await model.generateContent([`Generate a visual description for: ${rows[0].content}`]);
    const text = result.response.text();
    
    await pool.query('INSERT INTO generations (prompt_id, status, error_msg) VALUES ($1, $2, $3)', [promptId, 'success', 'Generation simulation successful. Model responded.']);
    return { status: 'success', response: text };
  } catch (err: any) {
    await pool.query('INSERT INTO generations (prompt_id, status, error_msg) VALUES ($1, $2, $3)', [promptId, 'error', err.message]);
    return { status: 'error', error: err.message };
  }
};

// --- CRON ---
cron.schedule('0 */2 * * *', performGeneration);

// --- ROUTES ---

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

fastify.get('/api/quote', async () => {
  const quotes = ["Innovation distinguishes between a leader and a follower.", "Design is how it works.", "The best way to predict the future is to create it."];
  return { quote: quotes[Math.floor(Math.random() * quotes.length)] };
});

fastify.get('/api/categories', async () => {
  const { rows } = await pool.query('SELECT DISTINCT category FROM prompts WHERE category IS NOT NULL');
  return rows.map(r => r.category);
});

fastify.post('/api/search', async (request) => {
  const { query } = request.body as { query: string };
  const { rows } = await pool.query('SELECT * FROM prompts WHERE title ILIKE $1 OR content ILIKE $1 LIMIT 50', [`%${query}%`]);
  return rows;
});

fastify.get('/api/admin/stats', async () => {
  const statsRes = await pool.query('SELECT * FROM api_stats');
  const gensRes = await pool.query('SELECT g.*, p.title FROM generations g LEFT JOIN prompts p ON g.prompt_id = p.id ORDER BY g.created_at DESC LIMIT 50');
  const overview = await pool.query('SELECT (SELECT COUNT(*) FROM prompts) as total, (SELECT COUNT(*) FROM prompts WHERE is_generated = TRUE) as gens');
  return { apiHits: statsRes.rows, recentGens: gensRes.rows, overview: { totalPrompts: overview.rows[0].total, totalGens: overview.rows[0].gens } };
});

fastify.get('/api/admin/ollama-status', async () => {
  try {
    const res = await fetch('http://localhost:11434/api/tags');
    if (res.ok) {
      const data = await res.json();
      return { status: 'online', models: data.models?.length || 0 };
    }
    return { status: 'error' };
  } catch (err) { return { status: 'offline' }; }
});

fastify.post('/api/admin/trigger-gen', async () => {
  return await performGeneration();
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
