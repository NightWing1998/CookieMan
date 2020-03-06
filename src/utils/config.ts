import { config } from "dotenv";

config();

const configSetter = (envVar: string): any => process.env.NODE_ENV?.toUpperCase() === "PRODUCTION" ? process.env[envVar] : process.env[`${envVar}_${process.env.NODE_ENV}`]

export default {
	PORT: configSetter("PORT") || 8080,
	MONGODB_URI: configSetter("MONGODB_URI") || "mongodb://mongo:27017/cookies"
}