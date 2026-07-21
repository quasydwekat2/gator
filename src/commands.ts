import { setUser } from "./config.js";

// 1. Define types
export type CommandHandler = (cmdName: string, ...args: string[]) => void;

export type CommandsRegistry = Record<string, CommandHandler>;

// 2. Login Handler
export function handlerLogin(cmdName: string, ...args: string[]): void {
  if (args.length === 0) {
    throw new Error("a username is required for login");
  }

  const username = args[0];
  setUser(username);
  console.log(`User set to ${username}`);
}

// 3. Register a new command
export function registerCommand(
  registry: CommandsRegistry,
  cmdName: string,
  handler: CommandHandler
): void {
  registry[cmdName] = handler;
}

// 4. Execute a registered command
export function runCommand(
  registry: CommandsRegistry,
  cmdName: string,
  ...args: string[]
): void {
  const handler = registry[cmdName];
  if (!handler) {
    throw new Error(`Unknown command: ${cmdName}`);
  }

  handler(cmdName, ...args);
}