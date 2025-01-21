import fs from "fs";
import { privateKeyToAccount } from "viem/accounts";
import { AES256_encrypt, AES256_decrypt } from "../utils/encryption_utils.js";
import chalk from "chalk";

import { wallet_passwords } from "../../index.js";
import getERC20Properties from "../../viem/functions/getERC20Properties.js";
import AuthManager from "../managers/AuthManager.js";
import StorageManager from "../managers/StorageManager.js";

const wallet_file_address = import.meta
  .resolve("../../storage/wallets.json")
  .slice(7);

class WalletService {
  static async getWallets() {
    try {
      return await StorageManager.getWallets();
    } catch (error) {
      if (debug_mode()) console.error(error);
      return [];
    }
  }

  static async getWalletByPublicKey(public_key) {
    const wallets = await WalletService.getWallets();

    const wallet = wallets.find((wallet) => wallet.public_key === public_key);
    return wallet !== null ? wallet : false;
  }

  static async getWalletByAddress(address) {
    const wallets = await WalletService.getWallets();

    const wallet = wallets.find((wallet) => wallet.address === address);
    return wallet !== null ? wallet : false;
  }

  static async getPrivateKey(public_key, wallet_password) {
    const wallet = await WalletService.getWalletByPublicKey(public_key);

    if (!wallet)
      return console.log(
        chalk.red("No matching wallet found for the given public_key.")
      );

    const private_key = AES256_decrypt(
      wallet.encrypted_private_key,
      wallet_password
    );

    return private_key;
  }

  static async updateWallet(wallet) {
    const wallets = await WalletService.getWallets();
    const index = wallets.findIndex((w) => w.public_key === wallet.public_key);

    // Wallet bulunamadıysa hata döndür.
    if (index === -1)
      return console.log(
        chalk.red("No matching wallet found for the given public_key.")
      );

    wallets[index] = wallet;

    WalletService.saveWallets(wallets);

    return true;
  }

  static async createWallet(private_key, wallet_key) {
    const account = privateKeyToAccount(private_key);

    const address = account.address;
    const public_key = account.publicKey;

    // Check if wallet already exists
    const wallets = await WalletService.getWallets();
    const existingWallet = wallets.find((w) => w.address === address);
    if (existingWallet) {
      throw new Error("Wallet with this address already exists");
    }

    const encrypted_private_key = AES256_encrypt(private_key, wallet_key);

    const new_wallet = {
      address,
      public_key,
      encrypted_private_key,
    };

    wallet_passwords.push({ address, wallet_key });
    wallets.push(new_wallet);

    WalletService.saveWallets(wallets);

    return new_wallet;
  }

  static async removeWallet(wallet_address) {
    try {
      let wallets = await WalletService.getWallets();
      const index = wallets.findIndex((w) => w.address === wallet_address);

      if (index === -1) return false;

      wallets = wallets.filter((w) => w.address !== wallet_address);

      WalletService.saveWallets(wallets);
      return true;
    } catch (e) {
      return false;
    }
  }

  static async getERC20TokenBalance(token_address) {
    try {
      if (!AuthManager.current_wallet) {
        return {
          name: "No Wallet Selected",
          state: false,
        };
      }

      const token = await getERC20Properties(token_address, { test: true });
      const token_properties = token.__token_properties;
      if (!token_properties) {
        return {
          name: "Unknown Token",
          state: false,
        };
      }

      try {
        const balance = await token.getBalance(AuthManager.current_wallet);
        return { ...token_properties, balance, state: true };
      } catch (error) {
        return { ...token_properties, balance: 0, state: false };
      }
    } catch (error) {
      return {
        name: "Error Loading Token",
        state: false,
      };
    }
  }

  static async getTokenAddresses() {
    try {
      return await StorageManager.getTokens();
    } catch (e) {
      if (debug_mode()) console.error("Error getting tokens:", e);
      return [];
    }
  }

  static async addTokenAddress(token_address) {
    try {
      const tokens = await StorageManager.getTokens();

      const index = tokens.findIndex((t) => t === token_address);
      if (index !== -1) return "Token already exists.";

      const token = await getERC20Properties(token_address);
      const token_properties = token.__token_properties;
      if (!token_properties)
        return {
          name: "Unknown Token",
          state: false,
        };

      tokens.push(token_address);
      StorageManager.saveTokens(tokens);

      return { ...token_properties, state: true };
    } catch (e) {
      return { state: false };
    }
  }

  static saveWallets(wallets) {
    StorageManager.saveWallets(wallets);
  }
}

export default WalletService;
