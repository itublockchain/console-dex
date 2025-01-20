import dotenv from "dotenv";

dotenv.config();

export const debug_mode = () => !(process.env.DEBUG !== "true");
export const test_mode = () => !(process.env.TEST !== "true");
