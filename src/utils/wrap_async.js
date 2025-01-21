import chalk from "chalk";
export default async function wrap(callback) {
  try {
    const data = await callback;
    return [data, undefined];
  } catch (err) {
    return [undefined, err];
  }
}
