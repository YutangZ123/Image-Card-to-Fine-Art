import express from "express";
import cors from "cors";
import cardRoutes from "./routes/cardRoutes.js"

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/cards", cardRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Backend running"
  });
});

export default app;