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
	deliveryGuy: {
		type: Schema.Types.ObjectId,
		ref: "delivery__personel"
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
	}
}).set("toJSON", {
	transform: (doc: any, returnedDocument: MongooseDocument): void => {
		returnedDocument.id = returnedDocument._id.toString();
		delete doc.barcode;
	}
});

export default model("Order", Order);