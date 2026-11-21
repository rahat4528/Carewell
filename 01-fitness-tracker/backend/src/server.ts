import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app";

const app = createApp();
const PORT = process.env.PORT || 4001;

app.listen(PORT, () => {
  console.log(`🚀 Carewell Fitness Tracker API listening on http://localhost:${PORT}`);
  console.log(`⚡ Healthcheck available at http://localhost:${PORT}/health`);
});
