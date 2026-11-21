import { createApp } from './app';

const app = createApp();
const PORT = process.env.PORT || 4005;

app.listen(PORT, () => {
  console.log(`Carewell Hospital Management System backend listening on port ${PORT}`);
});
