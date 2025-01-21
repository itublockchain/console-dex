import fs from "fs";
import path from "path";
import os from "os";
import chalk from "chalk";
import { debug_mode } from "../config.js";

class StorageManager {
  constructor() {
    // Her platform için uygun config dizini
    const isWindows = process.platform.startsWith("win");
    const isMac = process.platform === "darwin";

    let configBasePath;
    if (isWindows) {
      configBasePath = process.env.APPDATA; // Windows: AppData/Roaming
    } else if (isMac) {
      configBasePath = path.join(os.homedir(), "Library/Application Support"); // macOS: ~/Library/Application Support
    } else {
      configBasePath = path.join(os.homedir(), ".config"); // Linux: ~/.config
    }

    // Dizin yollarını platform bağımsız oluştur
    this.configDir = path.join(configBasePath, "console-dex");
    this.walletsPath = path.join(this.configDir, "wallets.json");
    this.tokensPath = path.join(this.configDir, "tokens.json");

    this.initializeStorage();
  }

  initializeStorage() {
    try {
      // Ana dizini oluştur
      if (!fs.existsSync(this.configDir)) {
        fs.mkdirSync(this.configDir, { recursive: true });
      }

      // Dosyaları oluştur veya kopyala
      this.initializeFile(this.walletsPath, []);
      this.initializeFile(this.tokensPath, []);
    } catch (error) {
      if (debug_mode())
        console.error(chalk.red("Error initializing storage:"), error);
    }
  }

  initializeFile(filePath, defaultContent) {
    try {
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2));
      }
    } catch (error) {
      if (debug_mode())
        console.error(chalk.red(`Error initializing file ${filePath}:`), error);
    }
  }

  // Wallets
  saveWallets(wallets) {
    try {
      fs.writeFileSync(this.walletsPath, JSON.stringify(wallets, null, 2));
    } catch (error) {
      if (debug_mode())
        console.error(chalk.red("Error saving wallets:"), error);
      throw error;
    }
  }

  getWallets() {
    try {
      if (!fs.existsSync(this.walletsPath)) {
        return [];
      }
      const data = fs.readFileSync(this.walletsPath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      if (debug_mode())
        console.error(chalk.red("Error reading wallets:"), error);
      return [];
    }
  }

  // Tokens
  saveTokens(tokens) {
    try {
      fs.writeFileSync(this.tokensPath, JSON.stringify(tokens, null, 2));
    } catch (error) {
      if (debug_mode()) console.error(chalk.red("Error saving tokens:"), error);
      throw error;
    }
  }

  getTokens() {
    try {
      if (!fs.existsSync(this.tokensPath)) {
        return [];
      }
      const data = fs.readFileSync(this.tokensPath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      if (debug_mode) console.error(chalk.red("Error reading tokens:"), error);
      return [];
    }
  }

  // Migration from old storage
  migrateFromOldStorage(oldStoragePath) {
    try {
      // Platform bağımsız yollar oluştur
      const oldWalletsPath = path.join(oldStoragePath, "wallets.json");
      const oldTokensPath = path.join(oldStoragePath, "tokens.json");

      if (fs.existsSync(oldWalletsPath)) {
        const wallets = JSON.parse(fs.readFileSync(oldWalletsPath, "utf8"));
        this.saveWallets(wallets);
      }

      if (fs.existsSync(oldTokensPath)) {
        const tokens = JSON.parse(fs.readFileSync(oldTokensPath, "utf8"));
        this.saveTokens(tokens);
      }

      console.log(
        chalk.green("✅ Successfully migrated storage to config directory")
      );
    } catch (error) {
      if (debug_mode())
        console.error(chalk.red("Error migrating old storage:"), error);
    }
  }
}

// Singleton instance
export default new StorageManager();
