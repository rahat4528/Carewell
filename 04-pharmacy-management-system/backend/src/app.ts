import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.controller';
import medicationRoutes from './modules/medications/medications.controller';
import dispenseRoutes from './modules/dispense/dispense.controller';
import posRoutes from './modules/pos/pos.controller';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Non-diagnostic clinical disclaimer header
  app.use((req, res, next) => {
    res.setHeader(
      'X-Carewell-Clinical-Notice',
      'Carewell Pharmacy facilitates administrative inventory and POS operations only. All dispensings require licensed human pharmacist verification.'
    );
    next();
  });

  // Health probe
  app.get('/health', (req, res) => {
    res.json({
      status: 'UP',
      service: 'Carewell Pharmacy Management System',
      timestamp: new Date().toISOString()
    });
  });

  // REST API Modules
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/medications', medicationRoutes);
  app.use('/api/v1/dispense', dispenseRoutes);
  app.use('/api/v1/pos', posRoutes);

  return app;
}
