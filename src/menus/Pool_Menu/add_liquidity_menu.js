import inquirer from "inquirer";
import poolService from "../../services/pool_service.js";
import transactionManager from "../../managers/transaction_manager.js";

async function AddLiquidityMenu(pool_name) {
  const pool = await poolService.getPoolByName(pool_name);

  const { choice } = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: "Add Liquidity Menu",
      choices: [
        { name: pool.token0.symbol, value: 0 },
        { name: pool.token1.symbol, value: 1 },
        "Return Back",
      ],
    },
  ]);

  switch (choice) {
    case 0:
      const { amount_0 } = await inquirer.prompt([
        {
          type: "input",
          name: "amount_0",
          message: "Enter your " + pool.token0.symbol + " amount:",
        },
      ]);

      await transactionManager.addLiquidity(
        pool_name,
        pool.token0.address,
        parseFloat(amount_0)
      );
      break;
    case 1:
      const { amount_1 } = await inquirer.prompt([
        {
          type: "input",
          name: "amount_1",
          message: "Enter your " + pool.token1.symbol + " amount:",
        },
      ]);

      await transactionManager.addLiquidity(
        pool_name,
        pool.token1.address,
        parseFloat(amount_1)
      );
      break;
    case "Return Back":
      return;
  }

  return await AddLiquidityMenu(pool_name);
}

export default AddLiquidityMenu;
