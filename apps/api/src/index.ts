import Fastify from 'fastify';
import cors from '@fastify/cors';
import redis from '@fastify/redis';
import axios from 'axios';
import { z } from 'zod';
import { Pool } from 'pg';
import { GoogleGenerativeAI } from '@google/generative-ai';
import cron from 'node-cron';
import * as Minio from 'minio';
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
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS generations (
        id SERIAL PRIMARY KEY,
        prompt_id INTEGER REFERENCES prompts(id),
        status TEXT,
        error_msg TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure MinIO bucket exists
    const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
    if (!bucketExists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      // Set bucket to public read
      const policy = {
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetBucketLocation", "s3:ListBucket"],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}`],
        }, {
          Effect: "Allow",
          Principal: { AWS: ["*"] },
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
        }],
      };
      await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
    }
  } catch (err) {
    console.error('DB/Minio Init Error:', err);
  } finally {
    client.release();
  }
};

// --- IMAGE GENERATION (NANO BANANA) ---

const generateImage = async (promptId: number, promptText: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-image-preview" });
    const result = await model.generateContent([`Create a high-fidelity preview image for this AI prompt: ${promptText}. Style: Professional, clean.`]);
    const response = await result.response;
    
    const part = response.candidates![0].content.parts.find(p => p.inlineData);
    if (part && part.inlineData) {
      const fileName = `prompt_${promptId}_${Date.now()}.png`;
      const buffer = Buffer.from(part.inlineData.data, 'base64');
      
      // Upload to MinIO
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

// --- CRON JOB (Every 4 Hours) ---
cron.schedule('0 */4 * * *', async () => {
  console.log('Running 4-hour Image Generation Cron...');
  const { rows } = await pool.query('SELECT id, content FROM prompts WHERE is_generated = FALSE ORDER BY RANDOM() LIMIT 1');
  if (rows.length > 0) {
    await generateImage(rows[0].id, rows[0].content);
  }
});

// --- ROUTES ---

// Paginated Prompts
fastify.get('/api/prompts', async (request) => {
  const { page = 1, limit = 24, category = 'all' } = request.query as any;
  const offset = (page - 1) * limit;
  
  let query = 'SELECT * FROM prompts';
  let params = [];
  
  if (category !== 'all') {
    query += ' WHERE category = $1';
    params.push(category);
    query += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
    params.push(limit, offset);
  } else {
    query += ` ORDER BY created_at DESC LIMIT $1 OFFSET $2`;
    params.push(limit, offset);
  }

  const { rows } = await pool.query(query, params);
  const { rows: countRows } = await pool.query('SELECT COUNT(*) FROM prompts' + (category !== 'all' ? ' WHERE category = $1' : ''), category !== 'all' ? [category] : []);
  
  return {
    data: rows,
    total: parseInt(countRows[0].count),
    page: parseInt(page),
    totalPages: Math.ceil(parseInt(countRows[0].count) / limit)
  };
});

// Refine Prompt with Guardrails
fastify.post('/api/refine', async (request, reply) => {
  const { prompt } = z.object({ prompt: z.string() }).parse(request.body);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const systemPrompt = `Refine the user's raw prompt into a highly detailed, professional prompt for Nano Banana. Original: ${prompt}`;
  const result = await model.generateContent(systemPrompt);
  return { result: result.response.text() };
});

// Serve images via MinIO Proxy
fastify.get('/cdn/:filename', async (request, reply) => {
  const { filename } = request.params as { filename: string };
  try {
    const stream = await minioClient.getObject(BUCKET_NAME, filename);
    reply.type('image/png').send(stream);
  } catch (err) {
    reply.status(404).send('Not Found');
  }
});

// Admin generations check
fastify.get('/api/admin/generations', async (request, reply) => {
  const { rows } = await pool.query('SELECT g.*, p.title FROM generations g JOIN prompts p ON g.prompt_id = p.id ORDER BY g.created_at DESC');
  return rows;
});

// Standard AI Routes
fastify.post('/api/rewrite', async (request, reply) => {
  const { prompt } = z.object({ prompt: z.string() }).parse(request.body);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(`Professional Rewrite: ${prompt}`);
  return { result: result.response.text() };
});

fastify.post('/api/summarize', async (request, reply) => {
  const { prompt } = z.object({ prompt: z.string() }).parse(request.body);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(`Summarize: ${prompt}`);
  return { result: result.response.text() };
});

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
