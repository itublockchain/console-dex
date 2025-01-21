import inquirer from "inquirer";
import chalk from "chalk";

import PoolService from "../../services/pool_service.js";
import PairMenu from "./pair_menu.js";
import ReturnMenu from "../Components/return_menu.js";
import AuthManager from "../../managers/AuthManager.js";
import Header from "../Components/Header.js";

import CreatePairMenu from "./create_pair_menu.js";
import MyPoolTokensMenu from "./my_pool_tokens_menu.js";

const MENU_ICONS = {
  BACK: "←",
};

async function PoolsMenu() {
  console.clear();
  Header();

  // Get fresh contract and pools data
  const factory_contract = await PoolService.getFactoryContract();
  if (factory_contract == null) {
    return await ReturnMenu(chalk.red("Factory contract not found..."));
  }

  const pools = await PoolService.getPools();
  if (pools == false) return;

  if (!pools || pools.length === 0)
    console.log(
      chalk.yellow("No pools found yet. Create a new pair to get started!")
    );

  // Create pool choices with icons
  const poolChoices = (pools || []).map(({ name, address }) => ({
    name: `  ${chalk.cyan(name)} ${chalk.dim(`(${address})`)}`,
    value: name,
    short: name,
  }));

  // Add management options at the top
  const choices = [
    new inquirer.Separator(chalk.dim("=== Management ===")),
    {
      name: `  ${chalk.greenBright("Create New Pair")}`,
      value: "Create Pair",
      disabled: !AuthManager.isLoggedIn()
        ? chalk.dim("Connect wallet to create pair")
        : false,
    },
    {
      name: chalk.yellow("  My Pool Tokens"),
      value: "My Pool Tokens",
      disabled: !AuthManager.isLoggedIn()
        ? chalk.dim("Connect wallet to view tokens")
        : false,
    },
  ];

  // Add pools section if there are any pools
  if (poolChoices.length > 0) {
    choices.push(
      new inquirer.Separator(chalk.dim("=== Available Pools ===")),
      ...poolChoices
    );
  }

  // Add return option at the bottom
  choices.push(new inquirer.Separator(""), {
    name: chalk.red(`${MENU_ICONS.BACK} Return Back`),
    value: "Return Back",
  });

  const { choice } = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: chalk.blue("\nSelect a liquidity pool:"),
      pageSize: 10,
      choices: choices,
    },
  ]);

  if (pools.some(({ name }) => name === choice)) {
    return await PairMenu(choice, {
      factory_contract,
      pool: pools.find(({ name }) => name === choice),
    });
  }

  if (choice === "Create Pair") {
    return await CreatePairMenu();
  }

  if (choice == "My Pool Tokens") {
    return await MyPoolTokensMenu();
  }

  return;
}

export default PoolsMenu;
