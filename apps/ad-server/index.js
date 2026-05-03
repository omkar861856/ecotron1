const fastify = require('fastify')({ logger: true });
const { MongoClient } = require('mongodb');
const Redis = require('ioredis');
const Minio = require('minio');

// Environment Configurations
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongodb:27017/ecotron';
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
const MINIO_CONFIG = {
  endPoint: process.env.MINIO_ENDPOINT || 'minio',
  port: 9000,
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'admin',
  secretKey: process.env.MINIO_SECRET_KEY || 'ecotron_secure_minio'
};

// Clients
let db, redis, minio;
let isReady = false;

// Initialization
const init = async () => {
  try {
    // Mongo
    const client = await MongoClient.connect(MONGO_URI);
    db = client.db('ecotron');
    
    // Redis
    redis = new Redis(REDIS_URL);
    
    // MinIO
    minio = new Minio.Client(MINIO_CONFIG);
    const bucketExists = await minio.bucketExists('creatives');
    if (!bucketExists) {
      await minio.makeBucket('creatives', 'us-east-1');
    }
    
    isReady = true;
    console.log('[SYSTEM] Ad Server Core Ready');
  } catch (err) {
    console.error('[SYSTEM] Init Failed, Retrying...', err.message);
    setTimeout(init, 5000);
  }
};

init();

fastify.register(require('fastify-cors'), { origin: "*" });

// Readiness Middleware
fastify.addHook('onRequest', async (request, reply) => {
  if (!isReady && request.url !== '/health') {
    return reply.code(503).send({ error: 'Service Initializing' });
  }
});

// Health Check
fastify.get('/health', async () => ({ status: 'ok', ready: isReady }));

// API: Register Campaign
fastify.post('/api/campaigns', async (request, reply) => {
  const { name, creative_url, target_url, advertiser_id } = request.body;

  const campaign = {
    name,
    creative_url,
    target_url,
    advertiser_id: advertiser_id || 'guest',
    status: 'active',
    created_at: new Date()
  };

  try {
    const result = await db.collection('campaigns').insertOne(campaign);
    // Cache in Redis for fast serving
    await redis.set(`campaign:${result.insertedId}`, JSON.stringify(campaign), 'EX', 3600);
    
    return { status: 'success', id: result.insertedId };
  } catch (err) {
    return reply.code(500).send({ error: err.message });
  }
});

// API: Serve Ad
fastify.get('/serve', async (request, reply) => {
  try {
    // Basic Random Selector (Scalable to Bid-based)
    const campaigns = await db.collection('campaigns').find({ status: 'active' }).limit(10).toArray();
    if (campaigns.length === 0) return { status: 'no_fill' };

    const winner = campaigns[Math.floor(Math.random() * campaigns.length)];

    return {
      id: winner._id,
      creative: winner.creative_url,
      link: `https://ads.ecotron.co.in/click?cid=${winner._id}&url=${encodeURIComponent(winner.target_url)}`,
      pixel: `https://ads.ecotron.co.in/track?cid=${winner._id}`
    };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
});

// API: Track Impression
fastify.get('/track', async (request, reply) => {
  const { cid } = request.query;
  await db.collection('analytics').insertOne({ campaign_id: cid, event: 'impression', ts: new Date() });
  reply.code(204).send();
});

// API: Click Redirect
fastify.get('/click', async (request, reply) => {
  const { cid, url } = request.query;
  await db.collection('analytics').insertOne({ campaign_id: cid, event: 'click', ts: new Date() });
  reply.redirect(url);
});

const start = async () => {
  try {
    await fastify.listen({ port: 8080, host: '0.0.0.0' });
  } catch (err) {
    process.exit(1);
  }
};

start();
