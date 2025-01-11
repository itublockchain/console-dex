import fs from "fs";

import { privateKeyToAccount } from "../../viem/utils/utils.js";
import { AES256_encrypt, AES256_decrypt } from "../utils/encryption_utils.js";
import chalk from "chalk";

import { wallet_passwords } from "../../index.js";

const wallet_file_address = import.meta.resolve("../wallets.json").slice(7);

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

export default {
  getWallets,
  getWalletByPublicKey,
  getWalletByAddress,
  getPrivateKey,
  updateWallet,
  createWallet,
};
