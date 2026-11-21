import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app";

const app = createApp();
const PORT = process.env.PORT || 4003;

app.listen(PORT, () => {
  console.log(`🚀 Carewell Doctor Appointment System API listening on http://localhost:${PORT}`);
  console.log(`⚡ Healthcheck available at http://localhost:${PORT}/health`);
});
