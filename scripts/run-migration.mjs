#!/usr/bin/env node

/**
 * CMS v3 Database Migration Script
 *
 * Runs the migration using Supabase Management API.
 * Since we don't have a direct DB password, we'll use
 * the Supabase service_role key to call an RPC function
 * that we create first, or use the management API.
 *
 * Alternative: Uses pg package with the Supabase connection pooler.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SB_URL = 'https://tomxtegnwnuwojvcmhur.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvbXh0ZWdud251d29qdmNtaHVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDgwOTgxNCwiZXhwIjoyMDg2Mzg1ODE0fQ.xGjyWhvb34pgbMYqwHPDBdFaIWFvbFz0bQGADNLCuCY';

// Read migration SQL
const migrationSQL = readFileSync(
  join(__dirname, '..', 'supabase', 'cms_v3_upgrade.sql'),
  'utf8'
);

console.log('📋 CMS v3 Migration');
console.log('==================');
console.log(`SQL file: ${migrationSQL.length} characters`);

// Try using the Supabase HTTP query API (available on newer Supabase versions)
// POST /pg with the service role token
async function tryDirectSQL() {
  // Method 1: Supabase v2 pg endpoint (newer projects)
  const endpoints = [
    { url: `${SB_URL}/pg`, method: 'POST' },
  ];

  for (const ep of endpoints) {
    try {
      const resp = await fetch(ep.url, {
        method: ep.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SB_KEY}`,
        },
        body: JSON.stringify({ query: 'SELECT 1 as test' }),
      });

      if (resp.ok) {
        console.log(`✅ Found working SQL endpoint: ${ep.url}`);
        return ep.url;
      }
    } catch (e) {
      // continue
    }
  }

  return null;
}

async function runViaPg() {
  // The Supabase connection pooler uses transaction mode on port 6543
  // and session mode on port 5432
  // Connection string: postgresql://postgres.PROJECT_REF:PASSWORD@REGION.pooler.supabase.com:6543/postgres
  // We need the DB password which we don't have.
  // However, Supabase exposes the password in the dashboard settings.

  // Alternative: Use the service role JWT to authenticate to the PostgREST
  // and manually create tables via SQL functions

  console.log('\n⚠️  Cannot connect directly to Postgres (no DB password in env).');
  console.log('');
  console.log('To run the migration, please do ONE of the following:');
  console.log('');
  console.log('Option 1 (Recommended): Run in Supabase Dashboard SQL Editor');
  console.log('  1. Go to: https://supabase.com/dashboard/project/tomxtegnwnuwojvcmhur/sql');
  console.log('  2. Paste the contents of: supabase/cms_v3_upgrade.sql');
  console.log('  3. Click "Run"');
  console.log('');
  console.log('Option 2: Add DB password to .env.local and re-run this script');
  console.log('  1. Go to: https://supabase.com/dashboard/project/tomxtegnwnuwojvcmhur/settings/database');
  console.log('  2. Copy your database password');
  console.log('  3. Add to .env.local: DATABASE_URL=postgresql://postgres.tomxtegnwnuwojvcmhur:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres');
  console.log('  4. Re-run: node scripts/run-migration.mjs');
  console.log('');
  console.log('Option 3: Use Supabase CLI');
  console.log('  1. Run: npx supabase login');
  console.log('  2. Run: npx supabase link --project-ref tomxtegnwnuwojvcmhur');
  console.log('  3. Run: npx supabase db push');

  // Check if DATABASE_URL is in env
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    console.log('\n🔗 Found DATABASE_URL, attempting direct connection...');
    const pg = await import('pg');
    const client = new pg.default.Client({ connectionString: dbUrl });

    try {
      await client.connect();
      console.log('✅ Connected to database');

      // Split migration into individual statements and run them
      // (pg client can handle multi-statement but let's be safe)
      console.log('🚀 Running migration...\n');
      await client.query(migrationSQL);
      console.log('✅ Migration completed successfully!');
    } catch (err) {
      console.error('❌ Migration failed:', err.message);
      if (err.message.includes('already exists')) {
        console.log('   (This may be OK if the migration was partially run before)');
      }
    } finally {
      await client.end();
    }
    return true;
  }

  return false;
}

async function main() {
  const sqlEndpoint = await tryDirectSQL();

  if (sqlEndpoint) {
    console.log('🚀 Running migration via SQL endpoint...\n');
    const resp = await fetch(sqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SB_KEY}`,
      },
      body: JSON.stringify({ query: migrationSQL }),
    });

    if (resp.ok) {
      console.log('✅ Migration completed successfully!');
    } else {
      const text = await resp.text();
      console.error('❌ Migration failed:', text);
    }
  } else {
    await runViaPg();
  }
}

main().catch(console.error);
