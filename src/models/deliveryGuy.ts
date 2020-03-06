import { Schema, model, MongooseDocument } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";

const DeliveryGuy: Schema = new Schema({
	name: {
		type: String,
		required: true
	},
	number: {
		type: String,
		minlength: 10,
		maxlength: 10,
		required: true,
		unique: true
	},
	history: [{
		type: Schema.Types.ObjectId,
		ref: "Order",
	}]
}).plugin(uniqueValidator).set("toJSON", {
	transform: (doc: MongooseDocument, returnedDocument: MongooseDocument): void => {
		returnedDocument.id = doc._id.toString();
		delete returnedDocument._id;
	}
});

export default model("delivery__personel", DeliveryGuy);