import fs from 'fs';
import os from 'os';
import path from 'path';

// TypeScript representation
// Uses camelCase
export type Config = {
  dbUrl: string;
  currentUserName?: string;
};

// JSON file representation
// Uses snake_case
type RawConfig = {
  db_url?: string;
  current_user_name?: string;
};

// Set current user and save config
export function setUser(userName: string): void {
  const config = readConfig();

  config.currentUserName = userName;

  writeConfig(config);
}

function getConfigFilePath(): string {
  return path.join(os.homedir(), '.gatorconfig.json');
}

// Write Config object to JSON file
function writeConfig(cfg: Config): void {
  const filePath = getConfigFilePath();

  const rawConfig: RawConfig = {
    db_url: cfg.dbUrl,
    current_user_name: cfg.currentUserName,
  };

  fs.writeFileSync(filePath, JSON.stringify(rawConfig, null, 2), 'utf-8');
}

// Validate JSON data and convert it to Config
function validateConfig(rawConfig: any): Config {
  if (typeof rawConfig !== 'object' || rawConfig === null) {
    throw new Error('Invalid config format: expected an object');
  }

  if (typeof rawConfig.db_url !== 'string') {
    throw new Error('Invalid config format: db_url must be a string');
  }

  return {
    dbUrl: rawConfig.db_url,
    currentUserName:
      typeof rawConfig.current_user_name === 'string'
        ? rawConfig.current_user_name
        : undefined,
  };
}

// Read config file and return Config object
export function readConfig(): Config {
  const filePath = getConfigFilePath();

  const fileContent = fs.readFileSync(filePath, 'utf-8');

  const parsedConfig = JSON.parse(fileContent);

  return validateConfig(parsedConfig);
}