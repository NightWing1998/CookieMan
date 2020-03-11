import { Schema, model, MongooseDocument } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";

const userCategories = [
	"admin",
	"deliverypersonel",
	"customer"
]

const UserSchema = new Schema({
	email: {
		type: String,
		required: true,
		unique: true
	},
	password: {
		type: String,
		required: true
	},
	name: {
		type: String,
		required: true
	},
	number: {
		type: String,
		required: true,
		unique: true
	},
	defaultAddress: String,
	category: {
		type: String,
		required: true,
		enum: userCategories
	}
}).plugin(uniqueValidator).set("toJSON", {
	transform: (doc: MongooseDocument, returnDocument: any): void => {
		returnDocument.id = doc._id.toString();
		delete returnDocument._id;
		delete returnDocument.password;
		delete returnDocument.category;
	}
});

export default model("User", UserSchema);