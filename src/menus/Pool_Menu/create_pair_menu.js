import inquirer from "inquirer";
import chalk from "chalk";
import AuthManager from "../../managers/AuthManager.js";
import { ViemPool } from "../../../viem/functions/factory.js";
import Router from "../../../viem/functions/router.js";
import ERC20 from "../../../viem/functions/ERC20.js";
import PoolsMenu from "./pools_menu.js";
import PoolService from "../../services/pool_service.js";
import { debug_mode } from "../../config.js";
import Header from "../Components/Header.js";
import ErrorHandler from "../../managers/ErrorHandler.js";

async function CreatePairMenu() {
  // Check if wallet is connected
  if (!AuthManager.logged_in || !AuthManager.current_wallet) {
    console.log(chalk.red("Please connect your wallet first!"));
    return;
  }

  console.clear();

  Header();

  console.log(
    chalk.blue(
      "Now, you need to enter the addresses of the tokens you want to create a pool for."
    )
  );

  // Get Token A first
  const { tokenA } = await inquirer.prompt([
    {
      type: "input",
      name: "tokenA",
      message: "Token A Address",
      validate: (input) => {
        if (!/^0x[a-fA-F0-9]{40}$/.test(input)) {
          return "Please enter a valid Ethereum address";
        }
        return true;
      },
    },
  ]);

  // Then get Token B with access to tokenA
  const { tokenB } = await inquirer.prompt([
    {
      type: "input",
      name: "tokenB",
      message: "Token B Address",
      validate: (input) => {
        if (!/^0x[a-fA-F0-9]{40}$/.test(input)) {
          return "Please enter a valid Ethereum address";
        }
        if (input.toLowerCase() === tokenA.toLowerCase()) {
          return "Token B must be different from Token A";
        }
        return true;
      },
    },
  ]);

  try {
    // Create pair first
    console.log(chalk.blue("Creating pair..."));
    const private_key = await AuthManager.getPrivateKey();
    const createPairResult = await Router.createPair(
      tokenA,
      tokenB,
      private_key
    );

    console.log(chalk.green("Pair created successfully!"));
    console.log(chalk.blue("Pair address:", createPairResult.pairAddress));

    // Get token information
    console.log(chalk.blue("Getting token information..."));
    const tokenAContract = new ERC20(tokenA);
    const tokenBContract = new ERC20(tokenB);

    // Initialize contracts with wallet client
    const { client: walletClient, account } = await Router.createWalletClient(
      private_key
    );
    await tokenAContract.getContract({ walletClient, account });
    await tokenBContract.getContract({ walletClient, account });

    // Get token properties
    const [tokenAProps, tokenBProps] = await Promise.all([
      tokenAContract.getProperties({ account, walletClient }),
      tokenBContract.getProperties({ account, walletClient }),
    ]);

    const tokenASymbol = tokenAProps.symbol;
    const tokenBSymbol = tokenBProps.symbol;

    console.log(chalk.blue(`Token A: ${tokenASymbol} (${tokenA})`));
    console.log(chalk.blue(`Token B: ${tokenBSymbol} (${tokenB})`));

    // Get token amounts
    const { amountA } = await inquirer.prompt([
      {
        type: "input",
        name: "amountA",
        message: `Enter amount of ${tokenASymbol}:`,
        validate: (input) => {
          if (isNaN(input) || input <= 0) {
            return "Please enter a valid positive number";
          }
          return true;
        },
      },
    ]);

    const { amountB } = await inquirer.prompt([
      {
        type: "input",
        name: "amountB",
        message: `Enter amount of ${tokenBSymbol}:`,
        validate: (input) => {
          if (isNaN(input) || input <= 0) {
            return "Please enter a valid positive number";
          }
          return true;
        },
      },
    ]);

    const { sure } = await inquirer.prompt([
      {
        type: "confirm",
        name: "sure",
        message: chalk.yellow(
          `Are you sure you want to create a pool with:\n` +
            `${amountA} ${tokenASymbol} and ${amountB} ${tokenBSymbol}?`
        ),
      },
    ]);

    if (!sure) {
      console.log(chalk.red("Operation cancelled."));
      return;
    }

    // Add initial liquidity
    console.log(chalk.blue("Adding initial liquidity..."));

    //  Add liquidity
    await Router.addLiquidity(
      createPairResult.pairAddress,
      tokenA,
      amountA,
      private_key
    );

    console.log(chalk.green("Pool created successfully!"));
    console.log(
      chalk.blue(
        "You can now use this pool for swapping between",
        tokenASymbol,
        "and",
        tokenBSymbol
      )
    );

    // Wait a bit for blockchain to update and refresh pools list
    console.log(chalk.blue("Refreshing pools list..."));
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await PoolService.getPools(); // Force refresh pools list

    return PoolsMenu();
  } catch (error) {
    if (debug_mode()) {
      console.error(chalk.red("Error creating pair:"), error.message);
      await new Promise(() => setTimeout(() => {}, 5000));
    }

    ErrorHandler.setError(error);
    return await PoolsMenu();
  }
}

export default CreatePairMenu;
