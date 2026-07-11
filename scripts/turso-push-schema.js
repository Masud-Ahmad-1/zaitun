const { createClient } = require('@libsql/client');

const url = process.argv[2];
const token = process.argv[3];
const sqlFile = process.argv[4];

const fs = require('fs');
const sql = fs.readFileSync(sqlFile, 'utf-8');

async function main() {
  const client = createClient({
    url: url,
    authToken: token,
  });

  // Split by semicolons and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && s.toUpperCase().startsWith('CREATE'));

  console.log(`Executing ${statements.length} statements...`);

  for (const stmt of statements) {
    try {
      await client.execute(stmt);
      console.log(`  ✓ ${stmt.split('\n')[0].substring(0, 60)}...`);
    } catch (e) {
      console.error(`  ✗ ${e.message.substring(0, 100)}`);
    }
  }

  // Verify
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log(`\nTables created: ${tables.rows.map(r => r.name).join(', ')}`);
}

main().catch(console.error);