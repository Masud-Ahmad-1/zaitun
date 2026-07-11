const { createClient } = require('@libsql/client');
const { PrismaClient } = require('@prisma/client');

const TURSO_URL = process.argv[2];
const TURSO_TOKEN = process.argv[3];

async function main() {
  const local = new PrismaClient();
  const turso = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

  console.log('=== Transferring data to Turso ===\n');

  // 1. Users
  const users = await local.user.findMany();
  console.log(`Users: ${users.length}`);
  if (users.length > 0) {
    for (const u of users) {
      await turso.execute({
        sql: `INSERT INTO "User" (id, email, name, password, image, role, locale, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [u.id, u.email, u.name, u.password, u.image, u.role, u.locale, u.createdAt.toISOString(), u.updatedAt.toISOString()]
      });
    }
  }

  // 2. FamilyTrees
  const trees = await local.familyTree.findMany();
  console.log(`FamilyTrees: ${trees.length}`);
  for (const t of trees) {
    await turso.execute({
      sql: `INSERT INTO "FamilyTree" (id, name, description, isPrivate, inviteCode, createdBy, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [t.id, t.name, t.description, t.isPrivate ? 1 : 0, t.inviteCode, t.createdBy, t.createdAt.toISOString(), t.updatedAt.toISOString()]
    });
  }

  // 3. FamilyTreeMembers
  const members = await local.familyTreeMember.findMany();
  console.log(`FamilyTreeMembers: ${members.length}`);
  for (const m of members) {
    await turso.execute({
      sql: `INSERT INTO "FamilyTreeMember" (id, treeId, userId, role, joinedAt) VALUES (?, ?, ?, ?, ?)`,
      args: [m.id, m.treeId, m.userId, m.role, m.joinedAt.toISOString()]
    });
  }

  // 4. Persons
  const persons = await local.person.findMany();
  console.log(`Persons: ${persons.length}`);
  for (const p of persons) {
    await turso.execute({
      sql: `INSERT INTO "Person" (id, treeId, firstName, lastName, gender, birthDate, deathDate, photo, bio, occupation, isDeceased, sortOrder, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [p.id, p.treeId, p.firstName, p.lastName, p.gender, p.birthDate, p.deathDate, p.photo, p.bio, p.occupation, p.isDeceased ? 1 : 0, p.sortOrder, p.createdAt.toISOString(), p.updatedAt.toISOString()]
    });
  }

  // 5. Relationships
  const rels = await local.relationship.findMany();
  console.log(`Relationships: ${rels.length}`);
  for (const r of rels) {
    await turso.execute({
      sql: `INSERT INTO "Relationship" (id, treeId, person1Id, person2Id, type, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [r.id, r.treeId, r.person1Id, r.person2Id, r.type, r.createdAt.toISOString()]
    });
  }

  // 6. DiaryEntries
  let diaryCount = 0;
  let batch = [];
  const BATCH_SIZE = 50;
  const allDiaries = await local.diaryEntry.findMany({ orderBy: { createdAt: 'asc' } });
  console.log(`DiaryEntries: ${allDiaries.length} (batch inserting...)`);

  for (const d of allDiaries) {
    batch.push([
      d.id, d.treeId, d.personId, d.date, d.title, d.content,
      d.privacy, d.tags, d.createdAt.toISOString(), d.updatedAt.toISOString()
    ]);
    if (batch.length >= BATCH_SIZE) {
      await insertDiaryBatch(turso, batch);
      diaryCount += batch.length;
      process.stdout.write(`  ${diaryCount}/${allDiaries.length}\r`);
      batch = [];
    }
  }
  if (batch.length > 0) {
    await insertDiaryBatch(turso, batch);
    diaryCount += batch.length;
  }
  console.log(`  DiaryEntries done: ${diaryCount}`);

  // Verify
  const result = await turso.execute("SELECT COUNT(*) as c FROM DiaryEntry WHERE privacy='public'");
  console.log(`\n=== Turso Verification ===`);
  console.log(`Public diaries in Turso: ${result.rows[0].c}`);

  await local.$disconnect();
}

async function insertDiaryBatch(turso, batch) {
  const values = batch.map(() => '(?,?,?,?,?,?,?,?,?,?)').join(',');
  const sql = `INSERT INTO "DiaryEntry" (id, treeId, personId, date, title, content, privacy, tags, createdAt, updatedAt) VALUES ${values}`;
  await turso.execute({ sql, args: batch.flat() });
}

main().catch(e => { console.error(e); process.exit(1); });