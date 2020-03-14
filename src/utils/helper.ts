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

export const extractDestinationLatLong = (orders: Order[]): string => {
	let destLatLong = "";

	for (let i = 0; i < orders.length - 1; i++) {
		let tempOrder = orders[i];
		destLatLong += `${tempOrder.lat},${tempOrder.long};`
	};
	let temp = orders[orders.length - 1];
	destLatLong += `${temp.lat},${temp.long}`;

	return destLatLong;
}

export const euclideanDistance = (x1: number, y1: number, x2: number, y2: number): number => {
	return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

export const findAngle = (x: number, y: number): number => {
	return (Math.floor(Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
}