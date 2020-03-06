import express, { Request, Response, NextFunction } from "express";

const app = express();

app.get("/api", (req: Request, res: Response, next: NextFunction) => {
	res.status(200).json({ "hello": "world" });
});

export default app;