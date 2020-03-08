import { Schema, model, MongooseDocument } from "mongoose";

const Order: Schema = new Schema({
	customerName: {
		type: String,
		required: true
	},
	customerAddress: {
		type: String,
		required: true
	},
	customerNumber: {
		type: String,
		maxlength: 10,
		minlength: 10,
	},
	deliveryPersonel: {
		type: Schema.Types.ObjectId,
		ref: "DeliveryPersonel"
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