import { setUser } from "./config.js";
import { createUser, getUser } from "./lib/db/queries/users.js";

// 1. Define types
export type CommandHandler = (...args: string[]) => Promise<void>;
export type CommandsRegistry = Record<string, CommandHandler>;

// 2. Login Handler
export async function handlerLogin(...args: string[]): Promise<void> {
  if (args.length === 0) {
    throw new Error("A username is required for login");
  }

  const username = args[0];
  const user = await getUser(username);

  if (!user) {
    throw new Error(`User '${username}' does not exist. Please register first.`);
  }

  setUser(username);
  console.log(`User set to ${username}`);
}

// 3. Register Handler
export async function handlerRegister(...args: string[]): Promise<void> {
  if (args.length === 0) {
    throw new Error("A name is required to register");
  }

  const name = args[0];

  // Check if user already exists to fail the test correctly
  const existingUser = await getUser(name);
  if (existingUser) {
    throw new Error(`User '${name}' already exists.`);
  }

  // Create user
  const user = await createUser(name);

  // Save current user
  setUser(user.name);

  console.log(`User ${user.name} created successfully!`);
  console.dir(user);
}

// 4. Register command
export function registerCommand(
  registry: CommandsRegistry,
  cmdName: string,
  handler: CommandHandler
): void {
  registry[cmdName] = handler;
}

// 5. Execute command
export async function runCommand(
  registry: CommandsRegistry,
  cmdName: string,
  ...args: string[]
): Promise<void> {
  const handler = registry[cmdName];

  if (!handler) {
    throw new Error(`Unknown command: ${cmdName}`);
  }

  await handler(...args);
}