import inquirer from "inquirer";
import chalk from "chalk";

import PoolService from "../../services/pool_service.js";
import PairMenu from "./pair_menu.js";
import ReturnMenu from "../Components/return_menu.js";
import AuthManager from "../../managers/AuthManager.js";
import Header from "../Components/Header.js";

import CreatePairMenu from "./create_pair_menu.js";

const MENU_ICONS = {
  BACK: "←",
};

async function PoolsMenu() {
  console.clear();
  Header();

  const factory_contract = await PoolService.getFactoryContract();

  const pools = await PoolService.getPools();
  if (factory_contract == null)
    return await ReturnMenu(chalk.red("Factory contract not found..."));

  if (pools == false) return await ReturnMenu(chalk.red("Pools not found..."));

  // Create pool choices with icons
  const poolChoices = pools.map(({ name }) => ({
    name: `  ${chalk.cyan(name)}`,
    value: name,
    short: name,
  }));

  // Add management options
  const managementChoices = [
    {
      name: `  ${chalk.greenBright("Create New Pair")}`,
      value: "Create Pair",
      disabled: !AuthManager.isLoggedIn()
        ? chalk.dim("Connect wallet to create pair")
        : false,
    },
    {
      name: `${MENU_ICONS.BACK} ${chalk.red("Return Back")}`,
      value: "Return Back",
    },
  ];

  const { choice } = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: chalk.blue("\nSelect a liquidity pool:"),
      pageSize: 10,
      choices: [
        new inquirer.Separator(chalk.dim("\n═══ Available Pools ═══")),
        ...poolChoices,
        new inquirer.Separator(chalk.dim("\n═══ Management ═══")),
        ...managementChoices,
      ],
    },
  ]);

  if (pools.some(({ name }) => name === choice)) {
    return await PairMenu(choice);
  }

  if (choice === "Create Pair") {
    return await CreatePairMenu();
  }

  return;
}

export default PoolsMenu;
