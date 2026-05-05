import Fastify from 'fastify';
import cors from '@fastify/cors';
import redis from '@fastify/redis';
import axios from 'axios';
import { z } from 'zod';

const fastify = Fastify({ logger: true });

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://ollama:11434/api/generate';

// Register CORS
fastify.register(cors, { origin: '*' });

// Register Redis (optional but recommended for production)
if (process.env.REDIS_URL) {
  fastify.register(redis, { url: process.env.REDIS_URL });
}

const GenerateSchema = z.object({
  prompt: z.string(),
  task: z.enum(['general', 'resume', 'summarize', 'rewrite']).default('general'),
  context: z.any().optional(),
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

// Routes
fastify.post('/api/generate', async (request, reply) => {
  const { prompt, task } = GenerateSchema.parse(request.body);
  
  // Dynamic Routing
  let model = 'llama3.1:8b';
  if (task === 'rewrite' || task === 'summarize') {
    model = 'qwen2.5:7b'; // Better for structured/multilingual tasks
  }

  const result = await callOllama(prompt, model);
  return { result, model };
});

fastify.post('/api/resume', async (request, reply) => {
  const { prompt } = GenerateSchema.parse(request.body);
  const systemPrompt = "You are an expert resume builder. Format the output in clean markdown. Keep it professional and concise.";
  const fullPrompt = `${systemPrompt}\n\nUser Data: ${prompt}`;
  
  const result = await callOllama(fullPrompt, 'llama3.1:8b');
  return { result };
});

fastify.post('/api/summarize', async (request, reply) => {
  const { prompt } = GenerateSchema.parse(request.body);
  const systemPrompt = "Summarize the following text in exactly 3 bullet points. Be extremely concise.";
  const fullPrompt = `${systemPrompt}\n\nText: ${prompt}`;
  
  const result = await callOllama(fullPrompt, 'qwen2.5:7b');
  return { result };
});

// Health check
fastify.get('/health', async () => ({ status: 'ok' }));

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Server started on port 3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
