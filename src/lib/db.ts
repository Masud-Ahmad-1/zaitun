/* eslint-disable @typescript-eslint/no-explicit-any */

const { createClient } = require("@libsql/client");

// ============================================================
// Model Schema Definitions
// Maps each Prisma model to its SQLite table and field metadata.
// ============================================================

interface RelationDef {
  fkField: string;
  targetModel: string;
  targetField?: string;
}

interface ModelDef {
  table: string;
  fields: string[];
  booleanFields: string[];
  jsonFields: string[];
  autoId: boolean;
  autoTimestamps: boolean;
  relations: Record<string, RelationDef>;
}

const MODELS: Record<string, ModelDef> = {
  user: {
    table: "User",
    fields: [
      "id", "email", "name", "password", "image", "role", "locale",
      "createdAt", "updatedAt",
    ],
    booleanFields: [],
    jsonFields: [],
    autoId: true,
    autoTimestamps: true,
    relations: {},
  },

  familyTree: {
    table: "FamilyTree",
    fields: [
      "id", "name", "description", "isPrivate", "inviteCode", "createdBy",
      "createdAt", "updatedAt",
    ],
    booleanFields: ["isPrivate"],
    jsonFields: [],
    autoId: true,
    autoTimestamps: true,
    relations: {},
  },

  familyTreeMember: {
    table: "FamilyTreeMember",
    fields: ["id", "treeId", "userId", "role", "joinedAt"],
    booleanFields: [],
    jsonFields: [],
    autoId: true,
    autoTimestamps: false,
    relations: {
      tree: { fkField: "treeId", targetModel: "familyTree" },
      user: { fkField: "userId", targetModel: "user" },
    },
  },

  person: {
    table: "Person",
    fields: [
      "id", "treeId", "firstName", "lastName", "gender", "birthDate",
      "deathDate", "photo", "bio", "occupation", "isDeceased", "sortOrder",
      "createdAt", "updatedAt",
    ],
    booleanFields: ["isDeceased"],
    jsonFields: [],
    autoId: true,
    autoTimestamps: true,
    relations: {
      tree: { fkField: "treeId", targetModel: "familyTree" },
    },
  },

  relationship: {
    table: "Relationship",
    fields: ["id", "treeId", "person1Id", "person2Id", "type", "createdAt"],
    booleanFields: [],
    jsonFields: [],
    autoId: true,
    autoTimestamps: false,
    relations: {
      tree: { fkField: "treeId", targetModel: "familyTree" },
    },
  },

  diaryEntry: {
    table: "DiaryEntry",
    fields: [
      "id", "treeId", "personId", "date", "title", "content", "privacy",
      "tags", "createdAt", "updatedAt",
    ],
    booleanFields: [],
    jsonFields: ["tags"],
    autoId: true,
    autoTimestamps: true,
    relations: {
      person: { fkField: "personId", targetModel: "person" },
      tree: { fkField: "treeId", targetModel: "familyTree" },
    },
  },

  lifeEvent: {
    table: "LifeEvent",
    fields: [
      "id", "personId", "type", "date", "description", "createdAt", "updatedAt",
    ],
    booleanFields: [],
    jsonFields: [],
    autoId: true,
    autoTimestamps: true,
    relations: {
      person: { fkField: "personId", targetModel: "person" },
    },
  },

  objection: {
    table: "Objection",
    fields: [
      "id", "personId", "field", "oldValue", "newValue", "reason", "rebuttal",
      "status", "raisedBy", "resolvedBy", "createdAt", "updatedAt",
    ],
    booleanFields: [],
    jsonFields: [],
    autoId: true,
    autoTimestamps: true,
    relations: {},
  },

  profileClaim: {
    table: "ProfileClaim",
    fields: [
      "id", "treeId", "personId", "status", "userId", "createdAt", "updatedAt",
    ],
    booleanFields: [],
    jsonFields: [],
    autoId: true,
    autoTimestamps: true,
    relations: {
      tree: { fkField: "treeId", targetModel: "familyTree" },
      person: { fkField: "personId", targetModel: "person" },
      user: { fkField: "userId", targetModel: "user" },
    },
  },

  profileClaimWitness: {
    table: "ProfileClaimWitness",
    fields: ["id", "claimId", "userId", "role", "createdAt"],
    booleanFields: [],
    jsonFields: [],
    autoId: true,
    autoTimestamps: false,
    relations: {
      claim: { fkField: "claimId", targetModel: "profileClaim" },
      user: { fkField: "userId", targetModel: "user" },
    },
  },
};

// ============================================================
// SQL Query Builders
// ============================================================

/**
 * Builds a WHERE clause from a Prisma-style where object.
 * Supports: equality, `in`, `notIn`, `contains`, `startsWith`, `endsWith`,
 * `gte`, `gt`, `lte`, `lt`, `not`, `equals`, `OR`, `AND`.
 * All values are pushed into the `params` array for parameterized queries.
 */
function buildWhere(
  where: Record<string, any> | undefined,
  params: any[]
): string {
  if (!where) return "";
  const entries = Object.entries(where).filter(
    (entry) => entry[1] !== undefined
  );
  if (entries.length === 0) return "";

  const conds: string[] = [];

  for (const [key, val] of entries) {
    const upper = key.toUpperCase();

    // --- OR / AND combinators ---
    if (upper === "OR" || upper === "AND") {
      const joiner = upper === "OR" ? " OR " : " AND ";
      const items = Array.isArray(val) ? val : [val];
      const parts = items.map((sub: any) => {
        const subParams: any[] = [];
        const clause = buildWhere(sub, subParams);
        params.push(...subParams);
        return clause.replace(/^WHERE\s+/i, "");
      });
      conds.push(`(${parts.join(joiner)})`);
      continue;
    }

    // --- Operator objects { in: [...], contains: "...", gte: "...", etc. } ---
    if (val !== null && typeof val === "object" && !(val instanceof Date)) {
      if ("in" in val && Array.isArray(val.in)) {
        conds.push(`${key} IN (${val.in.map(() => "?").join(",")})`);
        params.push(...val.in);
      } else if ("notIn" in val && Array.isArray(val.notIn)) {
        conds.push(
          `${key} NOT IN (${val.notIn.map(() => "?").join(",")})`
        );
        params.push(...val.notIn);
      } else if ("contains" in val) {
        conds.push(`${key} LIKE ?`);
        params.push(`%${val.contains}%`);
      } else if ("startsWith" in val) {
        conds.push(`${key} LIKE ?`);
        params.push(`${val.startsWith}%`);
      } else if ("endsWith" in val) {
        conds.push(`${key} LIKE ?`);
        params.push(`%${val.endsWith}`);
      } else if ("gte" in val) {
        conds.push(`${key} >= ?`);
        params.push(val.gte);
      } else if ("gt" in val) {
        conds.push(`${key} > ?`);
        params.push(val.gt);
      } else if ("lte" in val) {
        conds.push(`${key} <= ?`);
        params.push(val.lte);
      } else if ("lt" in val) {
        conds.push(`${key} < ?`);
        params.push(val.lt);
      } else if ("not" in val) {
        if (
          typeof val.not === "object" &&
          val.not !== null &&
          "in" in val.not
        ) {
          conds.push(
            `${key} NOT IN (${val.not.in.map(() => "?").join(",")})`
          );
          params.push(...val.not.in);
        } else {
          conds.push(`${key} != ?`);
          params.push(val.not);
        }
      } else if ("equals" in val) {
        conds.push(`${key} = ?`);
        params.push(val.equals);
      }
      continue;
    }

    // --- Simple equality (including null checks) ---
    conds.push(`${key} = ?`);
    params.push(val);
  }

  return conds.length > 0 ? `WHERE ${conds.join(" AND ")}` : "";
}

/**
 * Builds a SELECT column list from a Prisma-style select object.
 * `{ name: true, email: true }` → `"name, email"`
 * If no select or empty, returns `"*"`.
 */
function buildSelect(sel: Record<string, any> | undefined): string {
  if (!sel) return "*";
  const cols = Object.entries(sel)
    .filter(([, v]) => v === true)
    .map(([k]) => k);
  return cols.length > 0 ? cols.join(", ") : "*";
}

/**
 * Builds an ORDER BY clause from a Prisma-style orderBy value.
 * Supports single object `{ field: "asc" }` and array format `[{ a: "desc" }, { b: "asc" }]`.
 */
function buildOrderBy(ob: any): string {
  if (!ob) return "";
  const items = Array.isArray(ob) ? ob : [ob];
  const parts: string[] = [];
  for (const item of items) {
    for (const [field, dir] of Object.entries(item)) {
      parts.push(`${field} ${dir === "desc" ? "DESC" : "ASC"}`);
    }
  }
  return parts.length > 0 ? `ORDER BY ${parts.join(", ")}` : "";
}

// ============================================================
// Value Serialization / Deserialization
// ============================================================

/**
 * Convert a JavaScript value to its SQLite storage format.
 * - Booleans → 0 / 1
 * - Objects/Arrays on JSON fields → JSON string
 * - Date instances → ISO string
 */
function toDb(val: any, field: string, schema: ModelDef): any {
  if (val === undefined || val === null) return val;
  if (schema.booleanFields.includes(field)) return val ? 1 : 0;
  if (schema.jsonFields.includes(field))
    return typeof val === "string" ? val : JSON.stringify(val);
  if (val instanceof Date) return val.toISOString();
  return val;
}

/**
 * Convert a raw SQLite row to JavaScript types.
 * - 0 / 1 on boolean fields → false / true
 * - JSON strings on jsonFields → parsed objects
 */
function fromDb(row: Record<string, any>, schema: ModelDef): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(row)) {
    if (schema.booleanFields.includes(k)) {
      out[k] = Boolean(v);
    } else if (
      schema.jsonFields.includes(k) &&
      typeof v === "string" &&
      v.length > 0
    ) {
      try {
        out[k] = JSON.parse(v);
      } catch {
        out[k] = v;
      }
    } else {
      out[k] = v;
    }
  }
  return out;
}

/**
 * Pick only the fields set to `true` from a select object.
 */
function pick(
  obj: Record<string, any>,
  sel: Record<string, any>
): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(sel)) {
    if (v === true && k in obj) out[k] = obj[k];
  }
  return out;
}

// ============================================================
// Include Resolution
// ============================================================

/**
 * Resolves Prisma-style `include` by fetching related records in bulk
 * and attaching them as nested objects on each source row.
 *
 * Example: `include: { tree: { select: { name: true } } }`
 *   → fetches FamilyTree rows for all treeIds found in the source rows
 *   → attaches each as `row.tree = { name: "..." }`
 */
async function resolveIncludes(
  rows: Record<string, any>[],
  includes: Record<string, any>,
  client: any,
  modelKey: string
): Promise<void> {
  if (!includes || rows.length === 0) return;

  const srcSchema = MODELS[modelKey];

  for (const [relKey, relOpts] of Object.entries(includes)) {
    const rel = srcSchema.relations[relKey];
    if (!rel) continue;

    const tgtSchema = MODELS[rel.targetModel];
    if (!tgtSchema) continue;

    // Collect unique foreign-key values across all rows
    const fkField = rel.fkField;
    const joinField = rel.targetField || "id";
    const fkVals = Array.from(new Set(rows.map((r) => r[fkField]).filter(Boolean)));

    if (fkVals.length === 0) {
      for (const r of rows) r[relKey] = null;
      continue;
    }

    // Fetch all related records in one query
    const ph = fkVals.map(() => "?").join(",");
    const sql = `SELECT * FROM ${tgtSchema.table} WHERE ${joinField} IN (${ph})`;
    const res = await client.execute({ sql, args: fkVals });

    // Determine whether the include has a nested select
    const hasSel =
      relOpts && typeof relOpts === "object" && "select" in relOpts;

    // Build lookup map: targetField value → deserialized (and optionally picked) row
    const map = new Map<string, any>();
    for (const raw of res.rows) {
      const transformed = fromDb(raw as Record<string, any>, tgtSchema);
      const key = String(raw[joinField]);
      map.set(key, hasSel ? pick(transformed, relOpts.select) : transformed);
    }

    // Attach related data to each source row
    for (const r of rows) {
      r[relKey] = map.get(String(r[fkField])) ?? null;
    }
  }
}

// ============================================================
// Model Method Factory
// ============================================================

function createModel(client: any, key: string, schema: ModelDef) {
  // Use a self-reference for methods that call findUnique internally (create, update)
  const model: Record<string, any> = {};

  model.findMany = async (args?: any) => {
    const params: any[] = [];
    const w = buildWhere(args?.where, params);
    const s = buildSelect(args?.select);
    const o = buildOrderBy(args?.orderBy);

    let sql = `SELECT ${s} FROM ${schema.table} ${w}`;
    if (o) sql += ` ${o}`;
    if (args?.take != null) sql += ` LIMIT ${Number(args.take)}`;
    if (args?.skip != null && Number(args.skip) > 0)
      sql += ` OFFSET ${Number(args.skip)}`;

    const res = await client.execute({ sql, args: params });
    let rows = res.rows.map((r: any) =>
      fromDb(r as Record<string, any>, schema)
    );
    if (args?.select) rows = rows.map((r) => pick(r, args.select));
    if (args?.include)
      await resolveIncludes(rows, args.include, client, key);
    return rows;
  };

  model.findFirst = async (args?: any) => {
    const params: any[] = [];
    const w = buildWhere(args?.where, params);
    const s = buildSelect(args?.select);
    const o = buildOrderBy(args?.orderBy);

    let sql = `SELECT ${s} FROM ${schema.table} ${w}`;
    if (o) sql += ` ${o}`;
    sql += " LIMIT 1";

    const res = await client.execute({ sql, args: params });
    if (res.rows.length === 0) return null;

    let row = fromDb(res.rows[0] as Record<string, any>, schema);
    if (args?.select) row = pick(row, args.select);
    if (args?.include)
      await resolveIncludes([row], args.include, client, key);
    return row;
  };

  model.findUnique = async (args: any) => {
    const params: any[] = [];
    const w = buildWhere(args.where, params);
    const s = buildSelect(args?.select);

    const sql = `SELECT ${s} FROM ${schema.table} ${w} LIMIT 1`;
    const res = await client.execute({ sql, args: params });
    if (res.rows.length === 0) return null;

    let row = fromDb(res.rows[0] as Record<string, any>, schema);
    if (args?.select) row = pick(row, args.select);
    if (args?.include)
      await resolveIncludes([row], args.include, client, key);
    return row;
  };

  model.create = async (args: any) => {
    const data: Record<string, any> = { ...args.data };

    // Auto-generate id
    if (schema.autoId && !data.id) {
      data.id = crypto.randomUUID();
    }

    // Auto-set timestamps
    if (schema.autoTimestamps) {
      const now = new Date().toISOString();
      if (!data.createdAt) data.createdAt = now;
      if (!data.updatedAt) data.updatedAt = now;
    }

    // Build INSERT columns and values
    const fields: string[] = [];
    const values: any[] = [];
    for (const f of schema.fields) {
      if (f in data && data[f] !== undefined) {
        fields.push(f);
        values.push(toDb(data[f], f, schema));
      }
    }

    const sql = `INSERT INTO ${schema.table} (${fields.join(
      ","
    )}) VALUES (${fields.map(() => "?").join(",")})`;
    await client.execute({ sql, args: values });

    // Return the full created record (re-fetch for consistency)
    return model.findUnique({
      where: { id: data.id },
      select: args?.select,
      include: args?.include,
    });
  };

  model.update = async (args: any) => {
    const data: Record<string, any> = { ...args.data };

    // Auto-set updatedAt
    if (schema.autoTimestamps && !data.updatedAt) {
      data.updatedAt = new Date().toISOString();
    }

    const params: any[] = [];
    const sets: string[] = [];

    for (const f of schema.fields) {
      // Never allow overwriting id or createdAt via update
      if (f === "id" || f === "createdAt") continue;
      if (f in data && data[f] !== undefined) {
        sets.push(`${f} = ?`);
        params.push(toDb(data[f], f, schema));
      }
    }

    if (sets.length === 0) {
      // Nothing to update — just return current record
      return model.findUnique({
        where: args.where,
        select: args?.select,
        include: args?.include,
      });
    }

    const w = buildWhere(args.where, params);
    const sql = `UPDATE ${schema.table} SET ${sets.join(",")} ${w}`;
    await client.execute({ sql, args: params });

    // Return the updated record
    return model.findUnique({
      where: args.where,
      select: args?.select,
      include: args?.include,
    });
  };

  model.delete = async (args: any) => {
    const params: any[] = [];
    const w = buildWhere(args.where, params);

    // Fetch the record before deleting (Prisma returns the deleted record)
    const fetchSql = `SELECT * FROM ${schema.table} ${w} LIMIT 1`;
    const fetchRes = await client.execute({ sql: fetchSql, args: params });
    const deleted =
      fetchRes.rows.length > 0
        ? fromDb(fetchRes.rows[0] as Record<string, any>, schema)
        : null;

    // Perform the delete
    const deleteParams: any[] = [];
    buildWhere(args.where, deleteParams);
    const deleteSql = `DELETE FROM ${schema.table} ${w}`;
    await client.execute({ sql: deleteSql, args: deleteParams });

    return deleted;
  };

  model.deleteMany = async (args?: any) => {
    const params: any[] = [];
    const w = buildWhere(args?.where, params);

    const sql = `DELETE FROM ${schema.table} ${w}`;
    const res = await client.execute({ sql, args: params });
    return { count: Number(res.rowsAffected) };
  };

  model.count = async (args?: any) => {
    const params: any[] = [];
    const w = buildWhere(args?.where, params);

    const sql = `SELECT COUNT(*) as _count FROM ${schema.table} ${w}`;
    const res = await client.execute({ sql, args: params });
    return Number(res.rows[0]._count);
  };

  return model;
}

// ============================================================
// Turso DB Factory
// ============================================================

function createTursoDb() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const proxy: Record<string, any> = {};

  // Lazily create model accessors using getters
  for (const key of Object.keys(MODELS)) {
    Object.defineProperty(proxy, key, {
      get() {
        const methods = createModel(client, key, MODELS[key]);
        // Replace the getter with the concrete value after first access
        Object.defineProperty(proxy, key, {
          value: methods,
          writable: false,
          configurable: false,
        });
        return methods;
      },
      enumerable: true,
      configurable: true,
    });
  }

  // No-op transaction support for compatibility
  proxy.$transaction = async (fn: any) => fn(proxy);
  proxy.$connect = async () => {};
  proxy.$disconnect = async () => {};

  return proxy;
}

// ============================================================
// Export
// Falls back to real PrismaClient when TURSO_DATABASE_URL is not set
// (local development without Turso).
// ============================================================

const globalForDb = globalThis as unknown as { db: any };

const db: any =
  globalForDb.db ??
  (process.env.TURSO_DATABASE_URL
    ? createTursoDb()
    : new (require("@prisma/client").PrismaClient)());

if (process.env.NODE_ENV !== "production") globalForDb.db = db;

export { db };