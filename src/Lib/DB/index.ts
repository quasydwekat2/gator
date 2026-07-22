import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { readConfig } from "../../config.js";
import * as schema from "./schema.js";

const config = readConfig();
const pool = new Pool({ connectionString: config.dbUrl });
export const db = drizzle(pool, { schema });
