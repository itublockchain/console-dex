export const dirname = import.meta.dirname;
export const resolve = import.meta.resolve;

import fs from "fs";

const address_file_data = () =>
  fs.readFileSync(resolve("./").slice(7) + "backend/addresses.json", "utf-8");
export const addresses = () => JSON.parse(address_file_data());
