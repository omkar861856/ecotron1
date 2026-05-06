import { Pool } from 'pg';
import { Memory } from 'mem0ai';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const memory = new Memory({
  config: {
    llm: {
      provider: "google",
      config: {
        model: "gemini-1.5-flash-latest",
        api_key: process.env.GEMINI_API_KEY
      }
    },
    embedder: {
      provider: "google",
      config: {
        model: "models/embedding-001",
        api_key: process.env.GEMINI_API_KEY
      }
    }
  }
});

async function populate() {
  console.log('--- STARTING MEMORY POPULATION ---');
  const { rows: prompts } = await pool.query('SELECT * FROM prompts WHERE author != \'Anonymous\'');
  const { rows: users } = await pool.query('SELECT id, email FROM users');

  for (const p of prompts) {
    const user = users.find(u => u.email === p.author);
    if (user) {
      console.log(`Ingesting memory for user ${user.email}...`);
      await memory.add(p.content, { user_id: user.id.toString(), metadata: { source: 'legacy_import' } });
    }
  }
  console.log('--- POPULATION COMPLETE ---');
  process.exit(0);
}

populate().catch(err => {
  console.error(err);
  process.exit(1);
});
