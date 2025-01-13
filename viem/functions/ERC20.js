import Contract from "./Contract_Base.js";

class ERC20 extends Contract {
  constructor(address) {
    super();
    this.contract_name = "ERC20";
    this.address = address;
  }

  async getProperties({ account, walletClient } = {}) {
    try {
      let name = "Unknown Token";
      let symbol = "???";
      let decimals = 18;

      try {
        name = await this.read("name", [], { account, walletClient });
      } catch (error) {
        // Token does not support name()
      }

      try {
        symbol = await this.read("symbol", [], { account, walletClient });
      } catch (error) {
        // Token does not support symbol()
      }

      try {
        decimals = await this.read("decimals", [], { account, walletClient });
      } catch (error) {
        // Token does not support decimals(), using default: 18
      }

      return {
        name,
        symbol,
        decimals,
        address: this.address,
      };
    } catch (error) {
      return null;
    }
  }

  async balanceOf(address, { account, walletClient } = {}) {
    return await this.read("balanceOf", [address], { account, walletClient });
  }

  async getBalance(address, { account, walletClient } = {}) {
    try {
      const balance = await this.balanceOf(address, { account, walletClient });
      const decimals = await this.read("decimals", [], {
        account,
        walletClient,
      });
      return Number(balance) / 10 ** decimals;
    } catch (error) {
      return 0;
    }
  }

  async approve(spender, amount, { account, walletClient } = {}) {
    try {
      if (!account) {
        throw new Error("Account is required for approve operation");
      }

      console.log(`Approving ${amount} tokens for spender: ${spender}`);

      const tx = await this.write("approve", [spender, amount], {
        account,
        walletClient,
      });

      console.log("Approval transaction hash:", tx);
      return await this.waitForTransaction(tx);
    } catch (error) {
      console.error("Error approving tokens:", error);
      throw error;
    }
  }

  async allowance(owner, spender, { account, walletClient } = {}) {
    return await this.read("allowance", [owner, spender], {
      account,
      walletClient,
    });
  }
}

export default ERC20;
