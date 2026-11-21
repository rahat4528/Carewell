import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.controller';
import patientRoutes from './modules/patients/patients.controller';
import inpatientRoutes from './modules/inpatient/inpatient.controller';
import clinicalRoutes from './modules/clinical/clinical.controller';
import laboratoryRoutes from './modules/laboratory/laboratory.controller';
import accessRoutes from './modules/access/access.controller';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Clinical safety and non-diagnostic legal disclaimer header
  app.use((req, res, next) => {
    res.setHeader(
      'X-Carewell-Clinical-Notice',
      'Carewell Hospital Management System is an operational and documentation platform. All medical diagnoses and clinical treatments require authorized licensed healthcare professionals.'
    );
    next();
  });

  // Health probe
  app.get('/health', (req, res) => {
    res.json({
      status: 'UP',
      service: 'Carewell Hospital Management System',
      timestamp: new Date().toISOString()
    });
  });

  // API Routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/patients', patientRoutes);
  app.use('/api/v1/inpatient', inpatientRoutes);
  app.use('/api/v1/clinical', clinicalRoutes);
  app.use('/api/v1/laboratory', laboratoryRoutes);
  app.use('/api/v1/access', accessRoutes);

  return app;
}
