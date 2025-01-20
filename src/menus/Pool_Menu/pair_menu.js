import inquirer from "inquirer";
import chalk from "chalk";
import Header from "../Components/Header.js";
import AuthManager from "../../managers/AuthManager.js";
import AddLiquidityMenu from "./add_liquidity_menu.js";
import tokenService from "../../services/token_service.js";
import PoolService from "../../services/pool_service.js";
import SwapMenu from "./swap_menu.js";

const formatNumber = (num) => {
  if (num === 0) return "0";
  if (num < 0.0001) return num.toExponential(4);
  if (num < 1) return num.toFixed(4);
  if (num < 1000) return num.toFixed(2);
  if (num < 1000000) return (num / 1000).toFixed(2) + "K";
  if (num < 1000000000) return (num / 1000000).toFixed(2) + "M";
  return (num / 1000000000).toFixed(2) + "B";
};

export async function displayPoolInfo(pool) {
  if (!pool) {
    console.log(chalk.red("\nError: Pool information not available"));
    return;
  }

  const userAddress = AuthManager.isLoggedIn()
    ? await AuthManager.getAddress()
    : null;

  // Get user balances
  let balance0 = 0;
  let balance1 = 0;

  if (userAddress) {
    try {
      const [b0, b1] = await Promise.all([
        tokenService.getTokenBalance(pool.token0.address, userAddress),
        tokenService.getTokenBalance(pool.token1.address, userAddress),
      ]);

      balance0 = b0;
      balance1 = b1;
    } catch (err) {
      console.error("Error fetching balances:", err);
    }
  }

  // Get formatted reserves
  const token0Amount =
    Number(pool.token0.reserve) / Math.pow(10, pool.token0.decimals || 18);
  const token1Amount =
    Number(pool.token1.reserve) / Math.pow(10, pool.token1.decimals || 18);

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
    chalk.green(formatNumber(token0Amount)),
    chalk.gray(
      pool.token0.symbol !== "???"
        ? `(${pool.token0.address})`
        : "(Unable to fetch token info)"
    )
  );
  console.log(
    chalk.blue(`${pool.token1.symbol}:`),
    chalk.green(formatNumber(token1Amount)),
    chalk.gray(
      pool.token1.symbol !== "???"
        ? `(${pool.token1.address})`
        : "(Unable to fetch token info)"
    )
  );
  console.log();

  // Price information
  console.log(chalk.yellow.bold("💱 Pool Metrics"));
  if (token0Amount > 0 && token1Amount > 0) {
    console.log(
      chalk.blue(`Price ${pool.token0.symbol}:`),
      chalk.green(formatNumber(price0)),
      chalk.white(`${pool.token1.symbol}`)
    );
    console.log(
      chalk.blue(`Price ${pool.token1.symbol}:`),
      chalk.green(formatNumber(price1)),
      chalk.white(`${pool.token0.symbol}`)
    );
  } else {
    console.log(chalk.gray("Price information not available (empty pool)"));
  }

  if (userAddress) {
    console.log();
    console.log(chalk.yellow.bold("💼 Your Balance"));
    console.log(
      chalk.blue(`${pool.token0.symbol}:`),
      chalk.green(formatNumber(balance0))
    );
    console.log(
      chalk.blue(`${pool.token1.symbol}:`),
      chalk.green(formatNumber(balance1))
    );
  }

  console.log(chalk.gray("\n" + "─".repeat(50)));
}

async function PoolMenu(pool_name, cached_data = null) {
  // Always get fresh pool data
  const factory_contract = await PoolService.getFactoryContract();
  const pool = await PoolService.getPoolByName(pool_name);
  cached_data = { factory_contract, pool };

  console.clear();
  Header();

  await displayPoolInfo(cached_data.pool);

  const choices = [
    {
      name: chalk.blueBright("Swap Tokens"),
      value: 0,
      disabled: !AuthManager.isLoggedIn()
        ? chalk.dim("Connect wallet to swap tokens")
        : false,
    },
    {
      name: chalk.green("Add Liquidity"),
      value: 1,
      disabled: !AuthManager.isLoggedIn()
        ? chalk.dim("Connect wallet to add liquidity")
        : false,
    },
    {
      name: `${chalk.red("Return Back")}`,
      value: 100,
    },
  ];

  const { choice } = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: chalk.green.bold("Select an action:"),
      choices: choices,
    },
  ]);

  switch (choice) {
    case 0:
      await SwapMenu(pool_name);
      return PoolMenu(pool_name);
    case 1:
      try {
        await AddLiquidityMenu(pool_name);

        return PoolMenu(pool_name, null);
      } catch (err) {
        console.error("Error in add liquidity:", err);
        return PoolMenu(pool_name, null);
      }
    case 100:
      return;
  }
}

export default PoolMenu;
