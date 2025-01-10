import inquirer from "inquirer";
import PoolService from "../../services/pool_service.js";
import SwapMenu from "./swap_menu.js";
import AuthManager from "../../managers/auth_manager.js";
import chalk from "chalk";
import AddLiquidityMenu from "./add_liquidity_menu.js";

async function PoolMenu(pool_name, cb = () => {}) {
  console.clear();
  cb();

  const factory_contract = await PoolService.getFactoryContract();

  const pool = await PoolService.getPoolByName(pool_name);

  if (factory_contract == null || pool === false)
    return await ReturnMenu(chalk.red("Factory contract not found..."));

  const { choice } = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: "Pool Menu",
      choices: [
        { name: "Swap", disabled: !AuthManager.isLoggedIn() },
        { name: "Add Liquidity", disabled: !AuthManager.isLoggedIn() },
        "Pool Info",
        "Return Back",
      ],
    },
  ]);

  switch (choice) {
    case "Swap":
      await SwapMenu(pool_name);
      break;
    case "Add Liquidity":
      await AddLiquidityMenu(pool_name);
      break;
    case "Pool Info":
      return await PoolMenu(pool_name, () => {
        console.log(
          chalk.gray(
            "----------------------------------------------------------------------------------------"
          )
        );

        console.log(
          chalk.blue.bold("Pool Name: "),
          chalk.white.bold(pool.name),
          "\n"
        );

        console.log(
          `${chalk.blue.bold([pool.token0.symbol])}: ${chalk.yellow.bold([
            pool.token0.balance,
          ])}`
        );
        console.log(
          `${chalk.blue.bold([pool.token1.symbol])}: ${chalk.yellow.bold([
            pool.token1.balance,
          ])}`
        );
        console.log(`${chalk.blue.bold("k")}: ${chalk.yellow.bold([pool.k])}`);
        console.log(
          chalk.gray(
            "----------------------------------------------------------------------------------------"
          )
        );
      });

    case "Return Back":
      return;
  }

  return await PoolMenu(pool_name);
}

export default PoolMenu;
