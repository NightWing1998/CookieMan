import { config } from "dotenv";
import fs from "fs";

if (fs.existsSync(__dirname + "/./../../.env")) {
	config({ path: __dirname + "/./../../.env" });
} else {
	config();
}

const configSetter = (envVar: string): any => process.env.NODE_ENV?.toUpperCase() === "PRODUCTION" ? process.env[envVar] : process.env[`${envVar}_${process.env.NODE_ENV}`]

if (configSetter("JWT_KEY") === undefined || configSetter("SALT_ROUNDS") === undefined) {
	throw new Error(`JWT_KEY && SALT_ROUNDS should be defined. Got : ${configSetter("JWT_KEY")} and ${configSetter("SALT_ROUNDS")}`)
}

export default {
	PORT: configSetter("PORT") || 8080,
	MONGODB_URI: configSetter("MONGODB_URI") || "mongodb://mongo:27017/cookies",
	GRAPHQL_ROUTE: configSetter("GRAPHQL_ROUTE") || "/graphql",
	JWT_KEY: configSetter("JWT_KEY"),
	SALT_ROUNDS: parseInt(configSetter("SALT_ROUNDS"))
}