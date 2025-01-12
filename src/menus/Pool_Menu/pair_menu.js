import inquirer from "inquirer";
import PoolService from "../../services/pool_service.js";
import SwapMenu from "./swap_menu.js";
import AuthManager from "../../managers/AuthManager.js";
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
      message: "Pair Menu",
      choices: [
        {
          name: chalk.blueBright("Swap"),
          value: 0,
          disabled: !AuthManager.isLoggedIn(),
        },
        {
          name: chalk.green("Add Liquidity"),
          value: 1,
          disabled: !AuthManager.isLoggedIn(),
        },
        { name: "Pair Info", value: 2 },
        { name: chalk.red("Return Back"), value: 100 },
      ],
    },
  ]);

  switch (choice) {
    case 0:
      await SwapMenu(pool_name);
      break;
    case 1:
      await AddLiquidityMenu(pool_name);
      break;
    case 2:
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
            (Number(pool.token0.balance) / 10 ** pool.token0.decimals).toFixed(
              2
            ) + "$",
          ])}`
        );
        console.log(
          `${chalk.blue.bold([pool.token1.symbol])}: ${chalk.yellow.bold([
            (Number(pool.token1.balance) / 10 ** pool.token1.decimals).toFixed(
              2
            ) + "$",
          ])}`
        );
        console.log(`${chalk.blue.bold("k")}: ${chalk.yellow.bold([pool.k])}`);
        console.log(
          chalk.gray(
            "----------------------------------------------------------------------------------------"
          )
        );
      });

    case 100:
      return;
  }

  return await PoolMenu(pool_name);
}

export default PoolMenu;
