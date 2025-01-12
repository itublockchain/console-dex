import fs from "fs";

import { privateKeyToAccount } from "../../viem/utils/utils.js";
import { AES256_encrypt, AES256_decrypt } from "../utils/encryption_utils.js";
import chalk from "chalk";

import { wallet_passwords } from "../../index.js";
import getERC20Properties from "../../viem/functions/getERC20Properties.js";
import AuthManager from "../managers/AuthManager.js";

const wallet_file_address = import.meta.resolve("../wallets.json").slice(7);
const tokens_file_address = import.meta.resolve("../tokens.json").slice(7);

function getWallets() {
  try {
    const data = fs.readFileSync(wallet_file_address, "utf-8");

    const wallets = JSON.parse(data) || [];
    return wallets;
  } catch (e) {
    return [];
  }
}

async function getWalletByPublicKey(public_key) {
  const wallets = getWallets();

  const wallet = wallets.find((wallet) => wallet.public_key === public_key);
  return wallet !== null ? wallet : false;
}

async function getWalletByAddress(address) {
  const wallets = getWallets();

  const wallet = wallets.find((wallet) => wallet.address === address);
  return wallet !== null ? wallet : false;
}

async function getPrivateKey(public_key, wallet_password) {
  const wallet = await getWalletByPublicKey(public_key);

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

async function updateWallet(wallet) {
  const wallets = getWallets();
  const index = wallets.findIndex((w) => w.public_key === wallet.public_key);

  // Wallet bulunamadıysa hata döndür.
  if (index === -1)
    return console.log(
      chalk.red("No matching wallet found for the given public_key.")
    );

  wallets[index] = wallet;

  fs.writeFileSync(wallet_file_address, JSON.stringify(wallets));

  return true;
}

async function createWallet(private_key, wallet_key) {
  const account = privateKeyToAccount(private_key);

  const address = account.address;
  const public_key = account.publicKey;

  const encrypted_private_key = AES256_encrypt(private_key, wallet_key);

  const new_wallet = {
    address,
    public_key,
    encrypted_private_key,
  };

  wallet_passwords.push({ address, wallet_key });

  const wallets = getWallets();
  wallets.push(new_wallet);

  fs.writeFileSync(wallet_file_address, JSON.stringify(wallets));

  return new_wallet;
}

async function getERC20TokenBalance(token_address) {
  const token = await getERC20Properties(token_address);
  const token_properties = token.__token_properties;
  if (!token_properties)
    return {
      name: "Unknown Token",
      state: false,
    };

  const balance = await token.balanceOf(AuthManager.current_wallet);
  return { ...token_properties, balance, state: true };
}

async function getTokenAddresses() {
  try {
    const data = fs.readFileSync(tokens_file_address, "utf-8");

    const tokens = JSON.parse(data) || [];
    return tokens;
  } catch (e) {
    fs.writeFileSync(tokens_file_address, JSON.stringify([]), "utf-8");
    return [];
  }
}

async function addTokenAddress(token_address) {
  try {
    const tokens = await getTokenAddresses();

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

    fs.writeFileSync(tokens_file_address, JSON.stringify(tokens), "utf-8");
    return { ...token_properties, state: true };
  } catch (e) {
    return { state: false };
  }
}

export default {
  getWallets,
  getWalletByPublicKey,
  getWalletByAddress,
  getPrivateKey,
  updateWallet,
  createWallet,
  getERC20TokenBalance,
  getTokenAddresses,
  addTokenAddress,
};
