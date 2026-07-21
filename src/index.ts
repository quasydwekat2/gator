import {
  CommandsRegistry,
  registerCommand,
  runCommand,
  handlerLogin,
} from "./commands.js";

function main(): void {
  const registry: CommandsRegistry = {};

  // Register available commands
  registerCommand(registry, "login", handlerLogin);

  // Parse command-line arguments
  const userArgs = process.argv.slice(2);

  if (userArgs.length < 1) {
    console.error("Error: Not enough arguments provided.");
    process.exit(1);
  }

  const cmdName = userArgs[0];
  const cmdArgs = userArgs.slice(1);

  try {
    runCommand(registry, cmdName, ...cmdArgs);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error("An unknown error occurred.");
    }
    process.exit(1);
  }
}

main();