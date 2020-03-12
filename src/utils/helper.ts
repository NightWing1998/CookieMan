import { Order } from "./interfaces";

export const comparator = (a: Order, b: Order): number => {
	if (Math.abs(a.arrivalTime - b.arrivalTime) < 600000) {
		return a.distance - b.distance;
	} else {
		return a.arrivalTime - b.arrivalTime;
	}
}