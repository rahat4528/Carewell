import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app";

const app = createApp();
const PORT = process.env.PORT || 4002;

app.listen(PORT, () => {
  console.log(`🚀 Carewell Meal Planner App API listening on http://localhost:${PORT}`);
  console.log(`⚡ Healthcheck available at http://localhost:${PORT}/health`);
});
