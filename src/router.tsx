import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import PracticeOverview from './pages/PracticeOverview';
import PatientChart from './pages/PatientChart';
import Patients from './pages/Patients';
import Schedule from './pages/Schedule';
import SOAPEditor from './pages/SOAPEditor';
import Encounters from './pages/Encounters';
import LabResults from './pages/LabResults';
import Prescriptions from './pages/Prescriptions';
import Referrals from './pages/Referrals';
import BillingOverview from './pages/BillingOverview';
import Education from './pages/Education';
import Agents from './pages/Agents';
import Settings from './pages/Settings';
import Reports from './pages/Reports';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/practice" replace /> },
  { path: '/dashboard', element: <Navigate to="/practice" replace /> },
  {
    element: <AppLayout />,
    children: [
      { path: '/practice', element: <PracticeOverview /> },
      { path: '/patients', element: <Patients /> },
      { path: '/patients/:id', element: <PatientChart /> },
      { path: '/schedule', element: <Schedule /> },
      { path: '/encounters', element: <Encounters /> },
      { path: '/encounters/:id/soap', element: <SOAPEditor /> },
      { path: '/labs', element: <LabResults /> },
      { path: '/prescriptions', element: <Prescriptions /> },
      { path: '/referrals', element: <Referrals /> },
      { path: '/billing', element: <BillingOverview /> },
      { path: '/education', element: <Education /> },
      { path: '/agents', element: <Agents /> },
      { path: '/agents/:agentId', element: <Agents /> },
      { path: '/settings', element: <Settings /> },
      { path: '/reports', element: <Reports /> },
    ],
  },
]);
