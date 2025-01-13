import inquirer from "inquirer";
import PoolService from "../../services/pool_service.js";
import SwapMenu from "./swap_menu.js";
import AuthManager from "../../managers/AuthManager.js";
import chalk from "chalk";
import AddLiquidityMenu from "./add_liquidity_menu.js";
import tokenService from "../../services/token_service.js";

async function displayPoolInfo(pool) {
  const userAddress = await AuthManager.getAddress();

  // Get user balances
  const balance0 = userAddress
    ? await tokenService.getTokenBalance(pool.token0.address, userAddress)
    : 0;
  const balance1 = userAddress
    ? await tokenService.getTokenBalance(pool.token1.address, userAddress)
    : 0;

  // Calculate total value in pool
  const token0Amount = Number(pool.token0.reserve) / 10 ** pool.token0.decimals;
  const token1Amount = Number(pool.token1.reserve) / 10 ** pool.token1.decimals;

  // Calculate prices
  const price0 = token1Amount / token0Amount;
  const price1 = token0Amount / token1Amount;

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
    chalk.green(`${token0Amount.toFixed(4)}`),
    chalk.gray(`(${pool.token0.address})`)
  );
  console.log(
    chalk.blue(`${pool.token1.symbol}:`),
    chalk.green(`${token1Amount.toFixed(4)}`),
    chalk.gray(`(${pool.token1.address})`)
  );
  console.log();

  // Price information
  console.log(chalk.yellow.bold("💱 Pool Metrics"));
  console.log(
    chalk.blue(`Price (${pool.token0.symbol}/${pool.token1.symbol}):`),
    chalk.green(price0 ? price0.toFixed(6) : "N/A")
  );
  console.log(
    chalk.blue(`Price (${pool.token1.symbol}/${pool.token0.symbol}):`),
    chalk.green(price1 ? price1.toFixed(6) : "N/A")
  );
  console.log();

  // User balances
  if (userAddress) {
    console.log(chalk.yellow.bold("💰 Your Balances"));
    console.log(
      chalk.blue(`${pool.token0.symbol}:`),
      chalk.green(`${(Number(balance0) / 10 ** pool.token0.decimals).toFixed(4)}`)
    );
    console.log(
      chalk.blue(`${pool.token1.symbol}:`),
      chalk.green(`${(Number(balance1) / 10 ** pool.token1.decimals).toFixed(4)}`)
    );
    console.log();
  }
  
  console.log(chalk.gray("─".repeat(50)));
}
console.log(chalk.gray("─".repeat(50)));

async function PoolMenu(pool_name, cached_data = null) {
  // Eğer cache'lenmiş data yoksa bir kere çek
  if (!cached_data) {
    const factory_contract = await PoolService.getFactoryContract();
    const pool = await PoolService.getPoolByName(pool_name);

    if (factory_contract == null || pool === false)
      return await ReturnMenu(chalk.red("Factory contract not found..."));

    cached_data = { factory_contract, pool };
  }

  while (true) {
    console.clear();

    // Pool bilgilerini göster
    await displayPoolInfo(cached_data.pool);

    // Menüyü göster
    const { choice } = await inquirer.prompt([
      {
        type: "list",
        name: "choice",
        message: chalk.green.bold("Select an action:"),
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
      case 100:
        return;
    }
  }
}

export default PoolMenu;
