#!/usr/bin/env node
import { Command } from "commander";
import MainMenu from "./src/menus/main_menu.js";
import wrap_async from "./src/utils/wrap_async.js";

// Sadece uygulama açıkken tutulacak bir veri.
/*
  { address: "0xBsdBd...", wallet_key: "cokozelsifrem" }
*/
export let wallet_passwords = [];

// ConsoleDex Uygulamasını Başlatacak Komutlar...
const ConsoleDex = new Command();

ConsoleDex.name("console-dex").version("1.0.0");
ConsoleDex.command("start").action(async () => {
  // Uygulamayı başlat
  const [data, err] = await wrap_async(MainMenu());

  if (!err) return;

  console.error("An error occurred:", err);
});

ConsoleDex.parse(process.argv);
