import {
  CommandsRegistry,
  handlerAddFeed,
  handlerAgg,
  handlerBrowse,
  handlerFollow,
  handlerFeeds,
  handlerLogin,
  handlerRegister,
  handlerReset,
  handlerFollowing,
  handlerUnfollow,
  handlerUsers,
  middlewareLoggedIn,
  registerCommand,
  runCommand,
} from "./commands.js";

async function main(): Promise<void> {
  const registry: CommandsRegistry = {};

  // Register commands
  registerCommand(registry, "login", handlerLogin);

  registerCommand(registry, "register", handlerRegister);

  registerCommand(registry, "reset", handlerReset);

  registerCommand(registry, "users", handlerUsers);

  registerCommand(registry, "feeds", handlerFeeds);

  registerCommand(registry, "follow", middlewareLoggedIn(handlerFollow));

  registerCommand(
    registry,
    "following",
    middlewareLoggedIn(handlerFollowing),
  );

  registerCommand(
    registry,
    "unfollow",
    middlewareLoggedIn(handlerUnfollow),
  );

  registerCommand(registry, "agg", handlerAgg);

  registerCommand(registry, "addfeed", middlewareLoggedIn(handlerAddFeed));

  registerCommand(registry, "browse", middlewareLoggedIn(handlerBrowse));


  const userArgs = process.argv.slice(2);

  if (userArgs.length < 1) {
    console.error("Error: command is required");

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
      console.error("Unknown error");
    }

    process.exit(1);
  }

  process.exit(0);
}

main();
