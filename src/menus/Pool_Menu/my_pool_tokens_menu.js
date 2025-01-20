import inquirer from "inquirer";
import chalk from "chalk";
import PoolService from "../../services/pool_service.js";
import AuthManager from "../../managers/AuthManager.js";
import ReturnMenu from "../Components/return_menu.js";
import Header from "../Components/Header.js";
import Pool from "../../../viem/functions/pool.js";

async function MyPoolTokensMenu() {
  console.clear();
  await Header();

  const userAddress = await AuthManager.getAddress();
  if (!userAddress) {
    return await ReturnMenu(chalk.red("Please connect your wallet first"));
  }

  // Get all pools
  const pools = await PoolService.getPools();
  if (!pools) {
    return await ReturnMenu(chalk.red("No pools found"));
  }

  console.log(chalk.yellow.bold("\n My LP Tokens\n"));
  console.log(chalk.gray("─".repeat(50)));

  // Check LP tokens for each pool
  let hasAnyLPTokens = false;
  for (const pool of pools) {
    try {
      // Get pool contract
      const poolContract = new Pool(pool.address);
      await poolContract.getContract();

      // Get LP token balance
      const lpBalance = await poolContract.contract.read.balanceOf([
        userAddress,
      ]);

      if (lpBalance && Number(lpBalance) > 0) {
        hasAnyLPTokens = true;

        // Get total supply and reserves
        const totalSupply = await poolContract.contract.read.totalSupply();
        const reserves = await poolContract.contract.read.getReserves();

        // Calculate share percentage
        const sharePercentage = (Number(lpBalance) / Number(totalSupply)) * 100;

        // Calculate token amounts based on share
        const token0Share = (Number(reserves[0]) * sharePercentage) / 100;
        const token1Share = (Number(reserves[1]) * sharePercentage) / 100;

        // Display LP token info
        console.log(chalk.cyan(`\n🏊 Pool: ${chalk.white.bold(pool.name)}`));
        console.log(
          chalk.blue("💎 LP Balance:"),
          chalk.green(`${(Number(lpBalance) / 10 ** 18).toFixed(4)} LP`)
        );
        console.log(
          chalk.blue("📊 Pool Share:"),
          chalk.green(`${sharePercentage.toFixed(2)}%`)
        );
        console.log(
          chalk.blue(`💰 ${pool.token0.symbol}:`),
          chalk.green(
            `${(token0Share / 10 ** pool.token0.decimals).toFixed(4)}`
          )
        );
        console.log(
          chalk.blue(`💰 ${pool.token1.symbol}:`),
          chalk.green(
            `${(token1Share / 10 ** pool.token1.decimals).toFixed(4)}`
          )
        );
        console.log(chalk.gray("─".repeat(50)));
      }
    } catch (error) {
      console.error(`Error getting LP tokens for pool ${pool.name}:`, error);
    }
  }

  if (!hasAnyLPTokens) {
    console.log(chalk.yellow("\nYou don't have any LP tokens yet."));
    console.log(chalk.gray("Add liquidity to pools to receive LP tokens."));
  }

  console.log(); // Extra space
  await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: chalk.green.bold("Select an action:"),
      choices: [
        {
          name: chalk.red("Return Back"),
          value: "back",
        },
      ],
    },
  ]);

  return;
}

export default MyPoolTokensMenu;
