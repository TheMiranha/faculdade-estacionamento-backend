import { PrismaClient } from "@prisma/client";
import express, { type Request } from "express";
import { userService } from "./services/user.service";
import { plateService } from "./services/plate.service";
import { parkService } from "./services/park.service";
const app = express();

export const prisma = new PrismaClient();
app.use(express.json());

app.post("/create-account", async (req, res) => {
  const { name, email, password } = req.body;
  const user = await userService.createAccount({ name, email, password });
  res.json(user);
});

app.post("/authenticate", async (req, res) => {
  const { email, password } = req.body;

  const user = await userService.authenticate({ email, password });
  res.json(user);
});

app.get("/user", async (req, res) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  const user = await userService.getAccountByJWT(token || "");
  res.json(user);
});

app.use("/plate", async (req, res, next) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  const user = await userService.getAccountByJWT(token || "");

  if (user.user && user.success) {
    // @ts-expect-error
    req.user = user.user;
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
});

app.post("/plate/create-plate", async (req, res) => {
  const { plate } = req.body;
  // @ts-expect-error
  const userId = req.user.id;
  const createdPlate = await plateService.createPlate({ plate, userId });
  res.json(createdPlate);
});

app.use("/parks", async (req, res, next) => {
  const token = req.headers.authorization?.split("Bearer ")[1];

  if (token == process.env.ADMIN_TOKEN) {
    next();
    return
  }

  const user = await userService.getAccountByJWT(token || "");

  if (user.user && user.success) {
    // @ts-expect-error
    req.user = user.user;
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
});

app.get("/parks", async (_, res) => {
  const parks = await parkService.getAllParks();

  res.json(parks);
});

app.use("/parkings", async (req, res, next) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  const user = await userService.getAccountByJWT(token || "");
  if (token == process.env.ADMIN_TOKEN) {
    next();
    return
  }

  if (user.user && user.success) {
    // @ts-expect-error
    req.user = user.user;
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
});

app.get("/parkings", async (_, res) => {
  const parkings = await parkService.getAllParkings();

  res.json(parkings);
});

app.use("/parking/buy", async (req, res, next) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  const user = await userService.getAccountByJWT(token || "");

  if (user.user && user.success) {
    // @ts-expect-error
    req.user = user.user;
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
});

app.post("/parking/buy", async (req, res) => {
  const { parkId, timeInSeconds, plateId } = req.body;
  const response = await parkService.buyPark({
    parkId,
    timeInSeconds,
    plateId,
  });

  res.json(response);
});

app.listen(25565, () => {
  console.log("Servidor aberto na porta 25565");
});
