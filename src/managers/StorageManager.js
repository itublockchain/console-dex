import fs from "fs";
import path from "path";
import os from "os";
import chalk from "chalk";

class StorageManager {
  constructor() {
    // ~/.config/console-dex dizinini oluştur
    this.configDir = path.join(os.homedir(), ".config", "console-dex");
    this.walletsPath = path.join(this.configDir, "wallets.json");
    this.tokensPath = path.join(this.configDir, "tokens.json");

    this.initializeStorage();
  }

  initializeStorage() {
    // Ana dizini oluştur
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }

    // Dosyaları oluştur veya kopyala
    this.initializeFile(this.walletsPath, []);
    this.initializeFile(this.tokensPath, []);
  }

  initializeFile(filePath, defaultContent) {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2));
    }
  }

  // Wallets
  saveWallets(wallets) {
    fs.writeFileSync(this.walletsPath, JSON.stringify(wallets, null, 2));
  }

  getWallets() {
    try {
      const data = fs.readFileSync(this.walletsPath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error reading wallets:", error);
      return [];
    }
  }

  // Tokens
  saveTokens(tokens) {
    fs.writeFileSync(this.tokensPath, JSON.stringify(tokens, null, 2));
  }

  getTokens() {
    try {
      const data = fs.readFileSync(this.tokensPath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error reading tokens:", error);
      return [];
    }
  }

  // Migration from old storage
  migrateFromOldStorage(oldStoragePath) {
    try {
      // Eski dosyaları kontrol et ve kopyala
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
        chalk.green("✅ Successfully migrated storage to ~/.config/console-dex")
      );
    } catch (error) {
      console.error("Error migrating old storage:", error);
    }
  }
}

// Singleton instance
export default new StorageManager();
