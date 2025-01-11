import inquirer from "inquirer";
import chalk from "chalk";

async function CreatePairMenu() {
  console.log(
    "Now, you need to enter the addresses of the tokens you want to create a pool for."
  );
  const { tokenA, tokenB } = await inquirer.prompt([
    {
      type: "input",
      name: "tokenA",
      message: "Token A Address",
    },
    {
      type: "input",
      name: "tokenB",
      message: "Token B Address",
    },
  ]);

  const { sure } = await inquirer.prompt([
    {
      type: "confirm",
      name: "sure",
      message: "Are you sure you want to create a pool?",
    },
  ]);

  if (!sure) return;

  // to be implemented..
}

export default CreatePairMenu;
