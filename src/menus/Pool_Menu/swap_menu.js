import inquirer from "inquirer";
import chalk from "chalk";
import poolService from "../../services/pool_service.js";
import tokenService from "../../services/token_service.js";
import AuthManager from "../../managers/AuthManager.js";
import ErrorHandler from "../../managers/ErrorHandler.js";
import { debug_mode } from "../../config.js";

async function SwapMenu(pool_name) {
  console.clear();
  console.log(chalk.blue.bold("\n🔄 Swap Tokens"));
  console.log(chalk.gray("─".repeat(50)));

  // Get pool details
  const pool = await poolService.getPoolByName(pool_name);
  if (!pool) {
    console.log(chalk.red("\n❌ Pool not found!"));
    return false;
  }

  // Get prices for both tokens
  const price0 = await poolService.getTokenPrice(
    pool.address,
    pool.token0.address
  );
  const price1 = await poolService.getTokenPrice(
    pool.address,
    pool.token1.address
  );

  // Get token balances
  const userAddress = await AuthManager.getAddress();
  const balance0 = await tokenService.getTokenBalance(
    pool.token0.address,
    userAddress
  );
  const balance1 = await tokenService.getTokenBalance(
    pool.token1.address,
    userAddress
  );

  console.log(chalk.yellow("📊 Current Prices:"));
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

  console.log(chalk.yellow("\n💰 Your Balances:"));
  console.log(chalk.cyan(`${pool.token0.symbol}: ${balance0.toFixed(6)}`));
  console.log(chalk.cyan(`${pool.token1.symbol}: ${balance1.toFixed(6)}`));
  console.log(chalk.gray("─".repeat(50)));

  const { choice } = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: chalk.green("Select token to swap:"),
      choices: [
        {
          name: `${pool.token0.symbol} → ${pool.token1.symbol}`,
          value: 0,
        },
        {
          name: `${pool.token1.symbol} → ${pool.token0.symbol}`,
          value: 1,
        },
        {
          name: chalk.red("Return Back"),
          value: 2,
        },
      ],
    },
  ]);

  if (choice === 2) return true;

  const selectedToken = choice === 0 ? pool.token0 : pool.token1;
  const targetToken = choice === 0 ? pool.token1 : pool.token0;
  const maxBalance = choice === 0 ? balance0 : balance1;

  console.log(
    chalk.yellow(
      `\n💱 Swapping ${selectedToken.symbol} to ${targetToken.symbol}`
    )
  );
  console.log(
    chalk.gray(
      `Maximum amount available: ${maxBalance.toFixed(6)} ${
        selectedToken.symbol
      }`
    )
  );

  const { amount } = await inquirer.prompt([
    {
      type: "input",
      name: "amount",
      message: chalk.green(`Enter amount of ${selectedToken.symbol} to swap:`),
      validate: (value) => {
        if (isNaN(value)) return "Please enter a valid number";
        if (value <= 0) return "Amount must be greater than 0";
        if (parseFloat(value) > maxBalance)
          return `Amount exceeds your balance of ${maxBalance.toFixed(6)} ${
            selectedToken.symbol
          }`;
        return true;
      },
    },
  ]);

  // Calculate and show price impact
  const priceImpactData = await poolService.calculatePriceImpact(
    pool.address,
    selectedToken.address,
    amount
  );

  if (priceImpactData) {
    console.log(chalk.yellow("\n📊 Swap Details:"));
    console.log(
      chalk.cyan(
        `Amount Out: ${priceImpactData.amountOut.toFixed(6)} ${
          targetToken.symbol
        }`
      )
    );
    console.log(
      chalk.cyan(
        `Price Impact: ${Math.abs(priceImpactData.priceImpact).toFixed(2)}%`
      )
    );

    // Warning for high price impact
    if (Math.abs(priceImpactData.priceImpact) > 5) {
      console.log(
        chalk.red(
          "\n⚠️  Warning: High price impact! This trade will significantly affect the price."
        )
      );
    }

    // Show price change
    console.log(chalk.yellow("\n💹 Price Change:"));
    console.log(
      chalk.cyan(
        `Before: 1 ${
          selectedToken.symbol
        } = ${priceImpactData.currentPrice.toFixed(6)} ${targetToken.symbol}`
      )
    );
    console.log(
      chalk.cyan(
        `After:  1 ${selectedToken.symbol} = ${priceImpactData.newPrice.toFixed(
          6
        )} ${targetToken.symbol}`
      )
    );
  }

  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message: chalk.yellow("\nDo you want to proceed with this swap?"),
      default: false,
    },
  ]);

  if (!confirm) {
    console.log(chalk.gray("\nSwap cancelled."));
    console.log(chalk.gray("\nPress any key to continue..."));
    await inquirer.prompt([{ type: "input", name: "continue", message: "" }]);
    return false;
  }

  console.log(chalk.gray("\nProcessing swap..."));

  try {
    const success = await poolService.swap(
      pool_name,
      choice === 0 ? pool.token0.address : pool.token1.address,
      amount
    );

    if (success) {
      console.clear();
      console.log(chalk.green("\n✅ Swap successful!"));

      // Show updated prices
      const updatedPrice = await poolService.getTokenPrice(
        pool.address,
        choice === 0 ? pool.token0.address : pool.token1.address
      );

      if (updatedPrice) {
        console.log(chalk.yellow("\n📊 Updated Price:"));
        console.log(
          chalk.cyan(
            `1 ${updatedPrice.token} = ${updatedPrice.price.toFixed(6)} ${
              updatedPrice.baseToken
            }`
          )
        );
      }

      // Show updated balances
      const newBalance0 = await tokenService.getTokenBalance(
        pool.token0.address,
        userAddress
      );
      const newBalance1 = await tokenService.getTokenBalance(
        pool.token1.address,
        userAddress
      );
      console.log(chalk.yellow("\n💰 Updated Balances:"));
      console.log(
        chalk.cyan(`${pool.token0.symbol}: ${newBalance0.toFixed(6)}`)
      );
      console.log(
        chalk.cyan(`${pool.token1.symbol}: ${newBalance1.toFixed(6)}`)
      );
    } else {
      console.log(chalk.red("\n❌ Swap failed!"));
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

  return false;
}

export default SwapMenu;
