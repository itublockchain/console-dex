#!/usr/bin/env -S node --no-warnings

import { Command } from "commander";
import MainMenu from "./src/menus/main_menu.js";
import wrap_async from "./src/utils/wrap_async.js";
import StorageManager from "./src/managers/StorageManager.js";
import chalk from "chalk"; // Import chalk for colored console output

import dotenv from "dotenv";
import { debug_mode } from "./src/config.js";
dotenv.config();

// Sadece uygulama açıkken tutulacak bir veri.
/*
  { address: "0xBsdBd...", wallet_key: "cokozelsifrem" }
*/
export const wallet_passwords = [];

// ConsoleDex Uygulamasını Başlatacak Komutlar...
const program = new Command();

// Migrate old storage to new location
StorageManager.migrateFromOldStorage("./storage");

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
        if (err.name === "ExitPromptError") exitApp();

        console.error("An error occurred:", err);
      }
    } catch (error) {
      if (debug_mode()) console.error("Fatal error:", error);
    }
  });

program.parse(process.argv);

process.on("SIGINT", () => {
  exitApp();
});

function exitApp() {
  let console_dex = chalk.blue(`Console-Dex`);
  console.clear();
  console.log(`\nExited from ${console_dex}.`, chalk.yellow("Bye Bye! 👋 \n"));
  process.exit(); // Uygulamayı düzgün kapat
}
