import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import routes from "./routes";
import { env } from "./config/env";
import { errorHandler, notFound } from "./middleware/error";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigin === "*" ? true : env.corsOrigin,
    credentials: true
  })
);
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
