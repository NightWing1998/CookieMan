import { config } from "dotenv";
import fs from "fs";

if (fs.existsSync(__dirname + "/./../../.env")) {
	config({ path: __dirname + "/./../../.env" });
} else {
	config();
}

const configSetter = (envVar: string): any => process.env.NODE_ENV?.toUpperCase() === "PRODUCTION" ? process.env[envVar] : process.env[`${envVar}_${process.env.NODE_ENV}`]

// NEED A TOKEN SECRET KEY TO RUN SERVER, HENCE THROW ERROR IF NONE GIVEN
if (configSetter("JWT_KEY") === undefined || configSetter("SALT_ROUNDS") === undefined) {
	throw new Error(`JWT_KEY && SALT_ROUNDS should be defined. Got : ${configSetter("JWT_KEY")} and ${configSetter("SALT_ROUNDS")}`)
}

// NEED A BING MAPS KEY TO RUN SERVER, HENCE THROW ERROR IF NONE GIVEN
if (configSetter("BING_MAPS_KEY") === undefined) {
	throw new Error(`BING_MAPS_KEY expected. Found - ${configSetter("BING_MAPS_KEY")}`);
}

export default {
	PORT: configSetter("PORT") || 8080,
	MONGODB_URI: configSetter("MONGODB_URI") || "mongodb://mongo:27017/cookies",
	GRAPHQL_ROUTE: configSetter("GRAPHQL_ROUTE") || "/graphql",
	JWT_KEY: configSetter("JWT_KEY"),
	SALT_ROUNDS: parseInt(configSetter("SALT_ROUNDS")),
	SECTIONS: parseInt(configSetter("SECTIONS")) || 12,	// DIVIDE THE 360 DEGREE PLAN IN THIS NO. OF SECTIONS
	BING_MAPS_KEY: configSetter("BING_MAPS_KEY")
}