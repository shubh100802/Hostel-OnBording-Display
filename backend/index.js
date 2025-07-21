import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import authRouter from "./auth.js";
import { SHEET_ID, GOOGLE_CREDENTIALS_PATH } from "./config.js";
import * as queueManager from "./queueManager.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Serve frontend statically
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, "../frontend")));

app.use(cors());
app.use(express.json());

// Auth routes
app.use("/api", authRouter);

// Helper to emit updates
function emitUpdates() {
  io.emit("update", {
    queue: queueManager.getQueue(),
    counters: queueManager.getCounters(),
  });
}

// Poll Google Sheets every 5 seconds for live sync
async function pollAndUpdate() {
  await queueManager.pollAndSync();
  emitUpdates();
}
setInterval(pollAndUpdate, 5000);
// Initial poll
pollAndUpdate();

// API endpoints
app.get("/api/queue", (req, res) => {
  res.json(queueManager.getQueue());
});

app.get("/api/counters", (req, res) => {
  res.json(queueManager.getCounters());
});

app.post("/api/done", async (req, res) => {
  const { counterId } = req.body;
  await queueManager.markDone(counterId);
  // Sheet will be polled and updated in next interval
  res.json({ success: true });
});

app.post("/api/set-counters", (req, res) => {
  const { count } = req.body;
  queueManager.setCounterCount(count);
  // Sheet will be polled and updated in next interval
  res.json({ success: true });
});

app.post("/api/skip", async (req, res) => {
  const { counterId } = req.body;
  await queueManager.skipStudent(counterId);
  res.json({ success: true });
});

// Socket.IO connection
io.on("connection", (socket) => {
  socket.emit("update", {
    queue: queueManager.getQueue(),
    counters: queueManager.getCounters(),
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
}); 