import { Order } from "./interfaces";

import config from "./config";

import User from "../models/user";
import { hashSync, genSaltSync } from "bcrypt";

export const comparator = (a: Order, b: Order): number => {
	if (Math.abs(a.arrivalTime - b.arrivalTime) < 600000) {
		return a.distance - b.distance;
	} else {
		return a.arrivalTime - b.arrivalTime;
	}
}

export const createAdmin = (): void => {
	User.findOne({
		category: "admin"
	})
		.then((result) => {
			if (result === null) {
				User.create({
					email: "mary.admin@cook.io",
					name: "Mary",
					password: hashSync("passwordMary", genSaltSync(config.SALT_ROUNDS)),
					number: "9999999999",
					category: "admin"
				}).then((res) => {
					console.log(`Admin user created!! ${JSON.stringify(res.toJSON())}`);
				}).catch((err) => {
					console.error(`Failed to create admin : ${err}`);
				});
			} else {
				console.log(`Admin user found: ${JSON.stringify(result.toJSON())}`)
			}
		}).catch((err) => {
			console.error(`Error on fetching admin user details: ${err}`);
		});
}