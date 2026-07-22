import { setUser, readConfig } from "./config.js";

import {
  createUser,
  getUser,
  resetUsers,
  getAllUsers,
} from "./lib/db/queries/users.js";


// Types
export type CommandHandler = (...args: string[]) => Promise<void>;

export type CommandsRegistry = Record<string, CommandHandler>;


// Login command
export async function handlerLogin(...args: string[]): Promise<void> {

  if (args.length === 0) {
    throw new Error("A username is required for login");
  }


  const username = args[0];

  const user = await getUser(username);


  if (!user) {
    throw new Error(`User '${username}' does not exist`);
  }


  setUser(username);

  console.log(`Logged in as ${username}`);
}



// Register command
export async function handlerRegister(...args: string[]): Promise<void> {

  if (args.length === 0) {
    throw new Error("A name is required to register");
  }


  const name = args[0];


  const existingUser = await getUser(name);


  if (existingUser) {
    throw new Error(`User '${name}' already exists`);
  }


  const user = await createUser(name);


  setUser(user.name);


  console.log(`User '${user.name}' created successfully`);

  console.dir(user);
}



// Reset command
export async function handlerReset(): Promise<void> {

  await resetUsers();

  console.log("Database reset successfully");
}



// Users command
export async function handlerUsers(): Promise<void> {

  const usersList = await getAllUsers();

  const config = readConfig();


  for (const user of usersList) {

    if (user.name === config.currentUserName) {
      console.log(`* ${user.name} (current)`);
    }
    else {
      console.log(`* ${user.name}`);
    }

  }
}



// Register command
export function registerCommand(
    registry: CommandsRegistry,
    cmdName: string,
    handler: CommandHandler
): void {

  registry[cmdName] = handler;

}



// Run command
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