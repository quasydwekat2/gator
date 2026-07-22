import {
  CommandsRegistry,
  registerCommand,
  runCommand,
  handlerLogin,
  handlerRegister
} from "./commands.js";

async function main(): Promise<void> {
  const registry: CommandsRegistry = {};

  // Register available commands
  registerCommand(registry, "login", handlerLogin);
  registerCommand(registry, "register", handlerRegister);

  // Parse command-line arguments
  const userArgs = process.argv.slice(2);

  if (userArgs.length < 1) {
    console.error("Error: Not enough arguments provided.");
    process.exit(1);
  }

  const cmdName = userArgs[0];
  const cmdArgs = userArgs.slice(1);

  try {
    await runCommand(registry, cmdName, ...cmdArgs);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error("An unknown error occurred.");
    }
    // Exiting with code 1 here is what makes the boot.dev negative tests pass
    process.exit(1); 
  }

  // Ensure the program exits properly after DB queries
  process.exit(0);
}

main();