import { Schema, model, MongooseDocument } from "mongoose";

const Order: Schema = new Schema({
	userId: {
		type: Schema.Types.ObjectId,
		required: true,
		ref: "User"
	},
	customerAddress: {
		type: String,
		required: true
	},
	deliveryPersonel: {
		type: Schema.Types.ObjectId,
		ref: "User"
	},
	barcodePath: {
		type: String,
		required: true
	},
	quantity: {
		type: Number,
		required: true
	},
	price: {
		type: Number,
		required: true
	},
	distance: {
		type: Number,
		required: true
	},
	arrivalTime: {
		type: Date,
		default: Date.now
	},
	status: {
		type: String,
		required: true,
		default: "ordered"
	}
}).set("toJSON", {
	transform: (doc: any, returnedDocument: MongooseDocument): void => {
		returnedDocument.id = returnedDocument._id.toString();
		delete returnedDocument._id;
	}
});

export default model("Order", Order);