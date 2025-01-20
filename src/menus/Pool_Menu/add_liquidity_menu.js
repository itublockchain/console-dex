import inquirer from "inquirer";
import chalk from "chalk";
import PoolService from "../../services/pool_service.js";
import tokenService from "../../services/token_service.js";
import AuthManager from "../../managers/AuthManager.js";

async function AddLiquidityMenu(pool_name) {
  console.clear();
  console.log(chalk.blue.bold("\n🏦 Add Liquidity"));
  console.log(chalk.gray("─".repeat(50)));

  // Get pool details
  const pool = await PoolService.getPoolByName(pool_name);
  if (!pool) {
    console.log(chalk.red("\n❌ Pool not found!"));
    return false;
  }

  // Get current reserves and prices
  const reserves = await PoolService.getPoolReserves(pool.address);
  const price0 = await PoolService.getTokenPrice(
    pool.address,
    pool.token0.address
  );
  const price1 = await PoolService.getTokenPrice(
    pool.address,
    pool.token1.address
  );

  // Get user balances
  const userAddress = await AuthManager.getAddress();
  const balance0 = await tokenService.getTokenBalance(
    pool.token0.address,
    userAddress
  );
  const balance1 = await tokenService.getTokenBalance(
    pool.token1.address,
    userAddress
  );

  // Display pool information
  console.log(chalk.yellow("\n📊 Pool Information:"));
  console.log(
    chalk.cyan(`Pool: ${pool.token0.symbol} / ${pool.token1.symbol}`)
  );
  if (reserves) {
    console.log(
      chalk.cyan(`${pool.token0.symbol} Reserve: ${reserves[0].toFixed(6)}`)
    );
    console.log(
      chalk.cyan(`${pool.token1.symbol} Reserve: ${reserves[1].toFixed(6)}`)
    );
  }

  // Display current prices
  console.log(chalk.yellow("\n💱 Current Prices:"));
  if (price0) {
    console.log(
      chalk.cyan(
        `1 ${price0.token} = ${price0.price.toFixed(6)} ${price0.baseToken}`
      )
    );
  }
  if (price1) {
    console.log(
      chalk.cyan(
        `1 ${price1.token} = ${price1.price.toFixed(6)} ${price1.baseToken}`
      )
    );
  }

  // Display user balances
  console.log(chalk.yellow("\n💰 Your Balances:"));
  console.log(chalk.cyan(`${pool.token0.symbol}: ${balance0.toFixed(6)}`));
  console.log(chalk.cyan(`${pool.token1.symbol}: ${balance1.toFixed(6)}`));
  console.log(chalk.gray("─".repeat(50)));

  // Get amount for first token
  const { amount_0 } = await inquirer.prompt([
    {
      type: "input",
      name: "amount_0",
      message: chalk.green(`Enter amount of ${pool.token0.symbol}:`),
      validate: (value) => {
        if (isNaN(value)) return "Please enter a valid number";
        if (value <= 0) return "Amount must be greater than 0";
        if (parseFloat(value) > balance0)
          return `Amount exceeds your balance of ${balance0.toFixed(6)} ${
            pool.token0.symbol
          }`;
        return true;
      },
    },
  ]);

  // Calculate required amount of other token
  const amount0 = parseFloat(amount_0);
  let amount1 = 0;

  if (reserves && reserves[0] > 0 && reserves[1] > 0) {
    // For existing pools, calculate based on current ratio
    amount1 = (amount0 * reserves[1]) / reserves[0];
    
    console.log(chalk.yellow("\n📊 Required Amount:"));
    console.log(chalk.cyan(`${amount1.toFixed(6)} ${pool.token1.symbol}`));

    if (amount1 > balance1) {
      console.log(
        chalk.red(`\n⚠️  Warning: You don't have enough ${pool.token1.symbol}!`)
      );
      console.log(chalk.red(`Required: ${amount1.toFixed(6)}`));
      console.log(chalk.red(`Balance: ${balance1.toFixed(6)}`));
      console.log(chalk.gray("\nPress any key to continue..."));
      await inquirer.prompt([{ type: "input", name: "continue", message: "" }]);
      return false;
    }
  } else {
    // For first liquidity provision, use 1:1 ratio since prices are equal
    amount1 = amount0;
    console.log(chalk.yellow("\n📝 First Liquidity Provision:"));
    console.log(
      chalk.cyan(`You're setting the initial price ratio for this pool.`)
    );
    console.log(chalk.cyan(`Required amount: ${amount1.toFixed(6)} ${pool.token1.symbol}`));
  }

  // Confirm transaction
  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: chalk.yellow("\nDo you want to proceed with adding liquidity?"),
      default: false,
    },
  ]);

  if (!confirm) {
    console.log(chalk.gray("\nTransaction cancelled."));
    console.log(chalk.gray("\nPress any key to continue..."));
    await inquirer.prompt([{ type: "input", name: "continue", message: "" }]);
    return false;
  }

  console.log(chalk.gray("\nProcessing transaction..."));

  try {
    const success = await PoolService.addLiquidity(
      pool_name,
      pool.token0.address,
      amount0
    );

    if (success) {
      console.log(chalk.green("\n✅ Liquidity added successfully!"));

      // Show updated reserves
      const newReserves = await PoolService.getPoolReserves(pool.address);
      if (newReserves) {
        console.log(chalk.yellow("\n📊 Updated Pool Reserves:"));
        console.log(
          chalk.cyan(`${pool.token0.symbol}: ${newReserves[0].toFixed(6)}`)
        );
        console.log(
          chalk.cyan(`${pool.token1.symbol}: ${newReserves[1].toFixed(6)}`)
        );
      }
    } else {
      console.log(chalk.red("\n❌ Failed to add liquidity!"));
    }
  } catch (error) {
    if (debug_mode()) console.error(error);
    return ErrorHandler.setError(error);
  }

  await inquirer.prompt([
    {
      type: "input",
      name: "continue",
      message: chalk.gray("Press any key to continue..."),
    },
  ]);

  return true;
}

export default AddLiquidityMenu;
