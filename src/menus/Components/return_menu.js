import inquirer from "inquirer";
import MainMenu from "../main_menu.js";

export default async function ReturnMenu(q = "") {
  if (q !== "") q = `${q}\n`;

  const { main_menu } = await inquirer.prompt([
    {
      type: "select",
      name: "main_menu",
      message: `${q}Return to Main Menu`,
      choices: ["Return Back"],
    },
  ]);
}
