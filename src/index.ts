import {
  CommandsRegistry,
  registerCommand,
  runCommand,
  handlerLogin,
  handlerRegister,
  handlerReset,
  handlerUsers,
} from "./commands.js";


async function main(): Promise<void> {

  const registry: CommandsRegistry = {};


  // Register commands
  registerCommand(
      registry,
      "login",
      handlerLogin
  );


  registerCommand(
      registry,
      "register",
      handlerRegister
  );


  registerCommand(
      registry,
      "reset",
      handlerReset
  );


  registerCommand(
      registry,
      "users",
      handlerUsers
  );



  const userArgs = process.argv.slice(2);



  if (userArgs.length < 1) {

    console.error("Error: command is required");

    process.exit(1);
  }



  const cmdName = userArgs[0];

  const cmdArgs = userArgs.slice(1);



  try {

    await runCommand(
        registry,
        cmdName,
        ...cmdArgs
    );

  } catch (error) {

    if (error instanceof Error) {

      console.error(`Error: ${error.message}`);

    } else {

      console.error("Unknown error");

    }


    process.exit(1);
  }



  process.exit(0);
}



main();