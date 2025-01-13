import inquirer from "inquirer";
import PoolService from "../../services/pool_service.js";
import transactionManager from "../../managers/TransactionManager.js";
import chalk from "chalk";

async function AddLiquidityMenu(pool_name) {
  const pool = await PoolService.getPoolByName(pool_name);

  const { amount_0 } = await inquirer.prompt([
    {
      type: "input",
      name: "amount_0",
      message: "Enter your token amount:",
    },
  ]);

  const { choice } = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: "Do you confirm?",
      choices: [
        { name: chalk.green("Confirm"), value: 0 },
        { name: chalk.red("Return Back"), value: 100 },
      ],
    },
  ]);

  switch (choice) {
    case 0:
      await transactionManager.addLiquidity(
        pool_name,
        pool.token0.address,
        parseFloat(amount_0)
      );
      break;
    case 100:
      return;
  }
}

export default AddLiquidityMenu;
