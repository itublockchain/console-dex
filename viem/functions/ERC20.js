import Contract from "./Contract_Base.js";

class ERC20 extends Contract {
  constructor(address) {
    super();
    this.contract_name = "ERC20";
    this.address = address;
  }

  async getProperties({ account, walletClient, test } = {}) {
    try {
      // Initialize contract first
      await this.getContract({ walletClient, account });

      // Read token properties
      const [name, symbol, decimals] = await Promise.all([
        this.read("name", [], { account, walletClient, test }).catch(
          () => "Unknown Token"
        ),
        this.read("symbol", [], { account, walletClient, test }).catch(
          () => "???"
        ),
        this.read("decimals", [], { account, walletClient, test }).catch(
          () => 18
        ),
      ]);

      return {
        name,
        symbol,
        decimals: Number(decimals),
        address: this.address,
      };
    } catch (error) {
      if (debug_mode()) console.error("Error getting token properties:", error);
      return {
        name: "Unknown Token",
        symbol: "???",
        decimals: 18,
        address: this.address,
      };
    }
  }

  async balanceOf(address, { account, walletClient } = {}) {
    try {
      const args = [address];
      return await this.contract.read.balanceOf(args, {
        account,
        walletClient,
      });
    } catch (error) {
      return 0n;
    }
  }

  async getBalance(
    address,
    { account, walletClient, test } = {
      walletClient: this.publicClient,
      test: false,
    }
  ) {
    try {
      const [balance, decimals] = await Promise.all([
        this.balanceOf(address, {
          account,
          walletClient,
          test,
        }),
        this.contract.read.decimals([], {
          account,
          walletClient,
        }),
      ]);

      return Number(balance) / 10 ** Number(decimals);
    } catch (error) {
      return 0;
    }
  }

  async approve(spender, amount, { account, walletClient, gas } = {}) {
    try {
      // Check current allowance first
      const currentAllowance = await this.allowance(account.address, spender, {
        account,
        walletClient,
      });

      // If current allowance is greater than or equal to amount, no need to approve
      if (currentAllowance >= amount) {
        return true;
      }

      // If there's an existing non-zero allowance, reset it first
      if (currentAllowance > 0n) {
        const resetTx = await this.contract.write.approve([spender, 0n], {
          account,
          gas,
        });
        await this.waitForTransaction(resetTx);
      }

      // Approve new amount
      const tx = await this.contract.write.approve([spender, amount], {
        account,
        gas,
      });

      const receipt = await this.waitForTransaction(tx);
      return receipt !== null;
    } catch (error) {
      console.error("Approve error:", error);
      return false;
    }
  }

  async allowance(owner, spender, { account, walletClient } = {}) {
    return await this.read("allowance", [owner, spender], {
      account,
      walletClient,
    });
  }

  async hasEnoughBalance(address, amount, { account, walletClient } = {}) {
    try {
      const balance = await this.balanceOf(address, { account, walletClient });
      return balance >= amount;
    } catch (error) {
      return false;
    }
  }
}

export default ERC20;
