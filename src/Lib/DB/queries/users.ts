import { db } from "../index.js";
import { users } from "../schema.js";
import { eq } from "drizzle-orm";


// Create user
export async function createUser(name: string) {
  const [result] = await db
      .insert(users)
      .values({ name })
      .returning();

  return result;
}


// Get user by name
export async function getUser(name: string) {
  const [result] = await db
      .select()
      .from(users)
      .where(eq(users.name, name));

  return result;
}


// Delete all users
export async function resetUsers() {
  await db.delete(users);
}


// Get all users
export async function getAllUsers() {
  return await db
      .select()
      .from(users);
}