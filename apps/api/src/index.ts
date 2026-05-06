import Fastify from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';

const fastify = Fastify({ logger: true });

// Global Error Handlers
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
});

// Lazy-loaded dependencies
let pool: any;
let genAI: any;
let memory: any;
let minioClient: any;
let cron: any;

const OLLAMA_BASE_URL = process.env.OLLAMA_URL ? new URL(process.env.OLLAMA_URL).origin : 'http://ollama:11434';
const BUCKET_NAME = 'prompts-media';

// Register CORS
fastify.register(cors, { origin: '*' });

// Database Initialization with Retry
const initDB = async (retries = 5) => {
  while (retries > 0) {
    try {
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

          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS user_memories (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            fact TEXT NOT NULL,
            category TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS user_identities (
            user_id INTEGER PRIMARY KEY REFERENCES users(id),
            persona_title TEXT,
            persona_desc TEXT,
            signature_hash TEXT,
            style_dna JSONB,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
          ['Japanese Romance Short Film', '15-second cinematic Japanese drama pure love ambiguous short film...', 'Video', 'John', 'https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/7f63ad253175a9ad1dac53de490efac8/thumbnails/thumbnail.jpg', true],
          ['Hollywood Haute Couture', 'Hollywood Haute Couture Fantasy blockbuster, 8K ultra-clear...', 'Video', 'John', 'https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/e066fab457509bc6809ea212ae5d6a51/thumbnails/thumbnail.jpg', true],
          ['Modern Rural Aesthetics', 'Modern Rural Aesthetics, Cinematic Commercial quality...', 'Video', 'John', 'https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/ce508b28e505ffce07247e2ab036d6f1/thumbnails/thumbnail.jpg', true],
          ['Anime Adaptation Duel', 'Live-Action Anime Adaptation Breathing Technique Decisive Battle...', 'Video', 'John', 'https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/870c9907c5740c3d98ed2d62328ca83b/thumbnails/thumbnail.jpg', true],
          ['80-Year-Old Rapper MV', '16:9 horizontal screen, street rap MV style, neon purple and blue...', 'Video', 'John', 'https://customer-qs6wnyfuv0gcybzj.cloudflarestream.com/e011d2666b5ee19d5b9f8b9837b974c2/thumbnails/thumbnail.jpg', true],
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
        console.log('Database initialized successfully');
        return;
      } finally {
        client.release();
      }
    } catch (err) {
      retries--;
      console.error(`Database connection failed. Retries left: ${retries}`, err);
      if (retries === 0) throw err;
      await new Promise(res => setTimeout(res, 5000));
    }
  }
};

// --- GENERATION ENGINE ---
const performGeneration = async () => {
  const { rows } = await pool.query('SELECT id, content, title FROM prompts WHERE is_generated = FALSE ORDER BY RANDOM() LIMIT 1');
  if (rows.length === 0) return { status: 'no_prompts' };

  const promptId = rows[0].id;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const generationPrompt = `Create a high-quality visual representation for the following prompt: "${rows[0].content}". Style: Cinematic, high-fidelity, matching the theme of "${rows[0].title}".`;
    
    const result = await model.generateContent([generationPrompt]);
    const response = await result.response;
    
    await pool.query('UPDATE prompts SET is_generated = TRUE WHERE id = $1', [promptId]);
    await pool.query('INSERT INTO generations (prompt_id, status, error_msg) VALUES ($1, $2, $3)', 
      [promptId, 'success', 'Gemini processing complete.']);
    
    return { status: 'success', note: 'Gemini processed the prompt' };
  } catch (err: any) {
    await pool.query('INSERT INTO generations (prompt_id, status, error_msg) VALUES ($1, $2, $3)', [promptId, 'error', err.message]);
    return { status: 'error', error: err.message };
  }
};

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
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (res.ok) {
      const data = await res.json() as any;
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

fastify.post('/api/auth/signup', async (request, reply) => {
  const { email, password } = request.body as any;
  try {
    const { rows } = await pool.query('INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email', [email, password]);
    return { status: 'success', user: rows[0] };
  } catch (err) { return reply.status(400).send({ status: 'error', message: 'Email already exists' }); }
});

fastify.post('/api/auth/login', async (request, reply) => {
  const { email, password } = request.body as any;
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
  if (rows.length > 0) return { status: 'success', user: { id: rows[0].id, email: rows[0].email, role: rows[0].role } };
  return reply.status(401).send({ status: 'error', message: 'Invalid credentials' });
});

fastify.post('/api/prompts/create', async (request) => {
  const { title, content, category, author, userId } = request.body as any;
  const { rows } = await pool.query(
    'INSERT INTO prompts (title, content, category, author) VALUES ($1, $2, $3, $4) ON CONFLICT (content) DO NOTHING RETURNING *',
    [title, content, category || 'User', author || 'Anonymous']
  );
  
  if (userId && rows.length > 0) {
    extractMemory(userId, content).catch(console.error);
  }
  
  return { status: 'success', prompt: rows[0] };
});

fastify.get('/api/admin/users', async () => {
  const { rows } = await pool.query('SELECT id, email, role, created_at FROM users ORDER BY created_at DESC');
  return rows;
});

fastify.get('/api/user/identity/:userId', async (request, reply) => {
  const { userId } = request.params as { userId: string };
  const { rows } = await pool.query('SELECT * FROM user_identities WHERE user_id = $1', [userId]);
  if (rows.length > 0) return rows[0];
  return await updateIdentity(parseInt(userId));
});

const extractMemory = async (userId: number, content: string) => {
  try {
    await memory.add(content, { user_id: userId.toString(), metadata: { source: 'prompt_creation' } });
    await updateIdentity(userId);
  } catch (err) { console.error('Mem0 Extraction Failed:', err); }
};

const updateIdentity = async (userId: number) => {
  try {
    const relevantMemories = await memory.search("", { user_id: userId.toString(), limit: 10 });
    const results = (relevantMemories as any).results || [];
    
    if (results.length === 0) {
      return { persona_title: 'Novice Creator', persona_desc: 'Just starting the journey...' };
    }

    const facts = results.map((m: any) => m.memory).join(', ');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Based on these user style facts: "${facts}", create a 2-word Persona Title and a 1-sentence Persona Description. Return as JSON: {"title": "...", "desc": "..."}`;
    
    const result = await model.generateContent([prompt]);
    const persona = JSON.parse(result.response.text().replace(/```json|```/g, ''));
    const signature = Buffer.from(`${userId}-${facts}`).toString('base64').slice(0, 12).toUpperCase();
    
    const { rows: updated } = await pool.query(`
      INSERT INTO user_identities (user_id, persona_title, persona_desc, signature_hash, style_dna)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id) DO UPDATE SET
        persona_title = EXCLUDED.persona_title,
        persona_desc = EXCLUDED.persona_desc,
        signature_hash = EXCLUDED.signature_hash,
        style_dna = EXCLUDED.style_dna,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [userId, persona.title, persona.desc, signature, JSON.stringify({ facts: results.map((m: any) => m.memory) })]);
    
    return updated[0];
  } catch (err) { 
    console.error('Identity Update Failed:', err);
    return { persona_title: 'Identity Fragment', persona_desc: 'Reconstructing persona...' };
  }
};

const start = async () => {
  try {
    console.log('--- STARTING ECOTRON API (LAZY LOAD) ---');
    
    // Lazy load heavy dependencies
    console.log('Loading dependencies...');
    const { Pool: PGPool } = await import('pg');
    const { GoogleGenerativeAI: GAI } = await import('@google/generative-ai');
    const { Client: MinioClient } = await import('minio');
    const cronMod = await import('node-cron');
    const { Memory } = await import('mem0ai/oss');

    pool = new PGPool({ connectionString: process.env.DATABASE_URL });
    genAI = new GAI(process.env.GEMINI_API_KEY || '');
    minioClient = new MinioClient({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: 9000,
      useSSL: false,
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    });
    cron = cronMod.default;

    console.log('Initializing Mem0...');
    memory = new Memory({
      config: {
        llm: { provider: "ollama", config: { model: "llama3.1:8b", url: OLLAMA_BASE_URL } },
        embedder: { provider: "ollama", config: { model: "nomic-embed-text", url: OLLAMA_BASE_URL } }
      }
    });

    await initDB();
    
    // Schedule CRON
    cron.schedule('0 */2 * * *', performGeneration);
    
    const address = await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log(`API Listening on ${address}`);
  } catch (err) {
    console.error('CRITICAL STARTUP ERROR:', err);
    process.exit(1);
  }
};

start();
