#!/usr/bin/env node
import { Command } from "commander";
import MainMenu from "./src/menus/main_menu.js";
import wrap_async from "./src/utils/wrap_async.js";

// ConsoleDex Uygulamasını Başlatacak Komutlar...
const ConsoleDex = new Command();

ConsoleDex.name("console-dex").version("1.0.0");
ConsoleDex.command("start").action(async () => {
  console.log("Console-Dex başlatılıyor...");
  // Uygulamayı başlat
  const [data, err] = await wrap_async(MainMenu());

  if (!err) return console.log(data);

  console.error("An error occurred:", err);
  process.exit(1);
});

ConsoleDex.parse(process.argv);
