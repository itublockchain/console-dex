import inquirer from "inquirer";
import poolService from "../services/pool_service.js";
import PoolMenu from "./pool_menu.js";

async function PoolsMenu() {
    const pools = await poolService.getPools();

    if (pools.length === 0) {
        console.log("No pools available.");
        return;
    }

    const poolsChoices = pools.map((pool) => ({
        name: `${pool.token_1} / ${pool.token_2}`, // Format token_1 / token_2
        value: pool.id, // Pool ID as the choice value
    }));

    const { choice } = await inquirer.prompt([
        {
            type: "list",
            name: "choice",
            message: "Pools Menu",
            choices: [...poolsChoices, "Return Back"],
        },
    ]);

    if (pools.some((pool) => pool.id === choice)) {
        await PoolMenu(choice);
        await PoolsMenu();
    } else if (choice === "Return Back") {
        console.log("Returning to the previous menu...");
    }
}

export default PoolsMenu;
