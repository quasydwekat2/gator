// import { defineConfig } from "drizzle-kit";
// import { readConfig } from "./src/config.js";

// const config = readConfig();

// export default defineConfig({
//   schema: "./src/DB/schema.ts",
//   out: "./src/DB/migrations",
//   dialect: "postgresql",
//   dbCredentials: {
//     url: config.dbUrl, // Make sure this matches the property returned by readConfig()
//   },
// });


import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/DB/schema.ts",
  out: "./src/DB/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});