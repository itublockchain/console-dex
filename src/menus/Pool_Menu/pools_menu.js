import inquirer from "inquirer";
import chalk from "chalk";

import PoolService from "../../services/pool_service.js";
import PairMenu from "./pair_menu.js";
import ReturnMenu from "../Components/return_menu.js";
import AuthManager from "../../managers/AuthManager.js";

import CreatePairMenu from "./create_pair_menu.js";

async function PoolsMenu() {
  const factory_contract = await PoolService.getFactoryContract();

  const pools = await PoolService.getPools();
  if (factory_contract == null || pools === false)
    return await ReturnMenu(chalk.red("Factory contract not found..."));

  const poolsChoices = pools.map(({ name }) => ({
    name: chalk.yellow(name), // tokenA / tokenB formatında
    value: name, // Seçim değeri olarak pool id'si
  }));

  const { choice } = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: "Pools Menu",
      choices: [
        {
          name: chalk.green("Create Pair"),
          value: "Create Pair",
          disabled: !AuthManager.isLoggedIn(),
        },
        { name: chalk.red("Return Back"), value: "Return Back" },
        ...poolsChoices,
      ],
    },
  ]);

  if (pools.some(({ name }) => name === choice)) return await PairMenu(choice);

  if (choice === "Create Pair") return await CreatePairMenu();

  return;
}

export default PoolsMenu;
