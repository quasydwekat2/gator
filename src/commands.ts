import { setUser } from "./config.js";
import { createUser, getUser } from "./lib/db/queries/users.js";

// 1. Define types
export type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;

export type CommandsRegistry = Record<string, CommandHandler>;

// 2. Login Handler
export async function handlerLogin(cmdName: string, ...args: string[]): Promise<void> {
  if (args.length === 0) {
    throw new Error("a username is required for login");
  }

  const username = args[0];
  
  // Check if the user exists in the database
  const user = await getUser(username);
  if (!user) {
    throw new Error(`User '${username}' does not exist. Please register first.`);
  }

  setUser(username);
  console.log(`User set to ${username}`);
}

// 3. Register Handler
export async function handlerRegister(cmdName: string, ...args: string[]): Promise<void> {
  if (args.length === 0) {
    throw new Error("a name is required to register");
  }

  const name = args[0];

  try {
    const user = await createUser(name);
    setUser(user.name);
    console.log(`User ${user.name} created successfully!`);
    console.dir(user);
  } catch (error: any) {
    // Postgres unique constraint violation code
    if (error.code === '23505' || error.message.includes('unique')) {
      throw new Error(`User with name '${name}' already exists.`);
    }
    throw error;
  }
}

// 4. Register a new command
export function registerCommand(
  registry: CommandsRegistry,
  cmdName: string,
  handler: CommandHandler
): void {
  registry[cmdName] = handler;
}

// 5. Execute a registered command
export async function runCommand(
  registry: CommandsRegistry,
  cmdName: string,
  ...args: string[]
): Promise<void> {
  const handler = registry[cmdName];
  if (!handler) {
    throw new Error(`Unknown command: ${cmdName}`);
  }

  await handler(cmdName, ...args);
}