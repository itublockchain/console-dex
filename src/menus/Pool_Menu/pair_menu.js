import inquirer from "inquirer";
import PoolService from "../../services/pool_service.js";
import SwapMenu from "./swap_menu.js";
import AuthManager from "../../managers/AuthManager.js";
import chalk from "chalk";
import AddLiquidityMenu from "./add_liquidity_menu.js";
import tokenService from "../../services/token_service.js";

async function displayPoolInfo(pool) {
  const userAddress = await AuthManager.getCurrentWallet();

  // Get user balances
  const balance0 = userAddress
    ? await tokenService.getTokenBalance(pool.token0.address, userAddress)
    : 0;
  const balance1 = userAddress
    ? await tokenService.getTokenBalance(pool.token1.address, userAddress)
    : 0;

  // Calculate total value in pool
  const token0Amount = Number(pool.token0.balance) / 10 ** pool.token0.decimals;
  const token1Amount = Number(pool.token1.balance) / 10 ** pool.token1.decimals;

  console.log(chalk.gray("═".repeat(80)));
  console.log(chalk.blue.bold("\n🏊 Pool Information"));
  console.log(chalk.gray("─".repeat(50)));

  // Pool name and address
  console.log(chalk.cyan("Name:"), chalk.white.bold(pool.name));
  console.log(chalk.cyan("Address:"), chalk.white(pool.address));
  console.log();

  // Pool liquidity
  console.log(chalk.yellow.bold("📊 Pool Liquidity"));
  console.log(
    chalk.blue(`${pool.token0.symbol}:`),
    chalk.green(`${token0Amount.toFixed(2)}$`),
    chalk.gray(`(${pool.token0.address})`)
  );
  console.log(
    chalk.blue(`${pool.token1.symbol}:`),
    chalk.green(`${token1Amount.toFixed(2)}$`),
    chalk.gray(`(${pool.token1.address})`)
  );
  console.log();

  // User balances
  if (userAddress) {
    console.log(chalk.yellow.bold("💰 Your Balances"));
    console.log(
      chalk.blue(`${pool.token0.symbol}:`),
      chalk.green(`${balance0.toFixed(2)}$`),
      chalk.gray(`(${((balance0 / token0Amount) * 100).toFixed(2)}% of pool)`)
    );
    console.log(
      chalk.blue(`${pool.token1.symbol}:`),
      chalk.green(`${balance1.toFixed(2)}$`),
      chalk.gray(`(${((balance1 / token1Amount) * 100).toFixed(2)}% of pool)`)
    );
    console.log();
  }

  // Pool metrics
  console.log(chalk.yellow.bold("📈 Pool Metrics"));
  const price0 = token1Amount / token0Amount;
  const price1 = token0Amount / token1Amount;
  console.log(
    chalk.blue(`Price (${pool.token0.symbol}/${pool.token1.symbol}):`),
    chalk.green(price0.toFixed(6)) + "$"
  );
  console.log(
    chalk.blue(`Price (${pool.token1.symbol}/${pool.token0.symbol}):`),
    chalk.green(price1.toFixed(6)) + "$"
  );

  console.log(chalk.gray("\n" + "═".repeat(80)));
}

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
      message: chalk.green.bold("Select an action:\n"),
      choices: [
        {
          name: chalk.blueBright("Swap Tokens"),
          value: 0,
          disabled: !AuthManager.isLoggedIn(),
        },
        {
          name: chalk.green("Add Liquidity"),
          value: 1,
          disabled: !AuthManager.isLoggedIn(),
        },
        {
          name: chalk.yellow("View Pool Info"),
          value: 2,
        },
        {
          name: chalk.red("Return Back"),
          value: 100,
        },
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
      return await PoolMenu(pool_name, () => displayPoolInfo(pool));
    case 100:
      return;
  }

  return await PoolMenu(pool_name);
}

export default PoolMenu;
