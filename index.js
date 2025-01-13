#!/usr/bin/env -S node --no-warnings

import { Command } from "commander";
import MainMenu from "./src/menus/main_menu.js";
import wrap_async from "./src/utils/wrap_async.js";
import StorageManager from './src/managers/StorageManager.js';

// Sadece uygulama açıkken tutulacak bir veri.
/*
  { address: "0xBsdBd...", wallet_key: "cokozelsifrem" }
*/
export const wallet_passwords = [];

// ConsoleDex Uygulamasını Başlatacak Komutlar...
const program = new Command();

// Migrate old storage to new location
StorageManager.migrateFromOldStorage('./storage');

program
  .name("console-dex")
  .description("A console-based DEX application")
  .version("1.0.0");

program
  .command("start")
  .description("Start the console-dex application")
  .action(async () => {
    try {
      const [data, err] = await wrap_async(MainMenu());
      if (err) {
        console.error("An error occurred:", err);
      }
    } catch (error) {
      console.error("Fatal error:", error);
    }
  });

program.parse(process.argv);
