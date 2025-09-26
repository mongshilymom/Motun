// scripts/seed.js
import 'dotenv/config';
import pkg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

const { Client } = pkg;
const client = new Client({ connectionString: process.env.DATABASE_URL }); // Neon은 SSL 필수
await client.connect(); // sslmode=require 미설정이면 거부됨
const db = drizzle(client);

// TODO: 실제 스키마 import 후 insert 문 채우기
console.log('✔ seed stub done');
await client.end();
