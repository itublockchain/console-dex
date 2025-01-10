import inquirer from "inquirer";
import poolService from "../../services/pool_service.js";
import transactionManager from "../../managers/transaction_manager.js";

async function SwapMenu(pool_name, cb = () => {}) {
  const pool = await poolService.getPoolByName(pool_name);
  cb();

  const { choice } = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: "Swap Menu",
      choices: [
        { name: pool.token0.symbol + "->" + pool.token1.symbol, value: 0 },
        { name: pool.token1.symbol + "->" + pool.token0.symbol, value: 1 },
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
          message: `Enter your ${pool.token0.symbol} amount:`,
        },
      ]);

      const success_0 = await transactionManager.swap(
        pool_name,
        pool.token0.address,
        parseFloat(amount_0)
      );

      return await SwapMenu(pool_name, () => {
        console.log(success_0);
      });
    case 1:
      const { amount_1 } = await inquirer.prompt([
        {
          type: "input",
          name: "amount_1",
          message: `Enter your ${pool.token1.symbol} amount:`,
        },
      ]);

      const success_1 = await transactionManager.swap(
        pool_name,
        pool.token1.address,
        parseFloat(amount_1)
      );

      return await SwapMenu(pool_name, () => {
        console.log(success_1);
      });
    case "Return Back":
      return;
  }
}

export default SwapMenu;
