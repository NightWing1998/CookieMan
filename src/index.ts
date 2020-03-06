import http from "http";
import app from "./app";
import config from "./utils/config";

http.createServer(app).listen(config.PORT, (): void => {
	console.log(`Server started at ${config.PORT}`);
});