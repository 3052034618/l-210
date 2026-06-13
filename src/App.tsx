import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { EquipmentPage } from './pages/Equipment/EquipmentPage';
import { BorrowPage } from './pages/Borrow/BorrowPage';
import { ReturnPage } from './pages/Return/ReturnPage';
import { StatisticsPage } from './pages/Statistics/StatisticsPage';
import { DamagePage } from './pages/Damage/DamagePage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { ToastContainer } from './components/Toast/ToastContainer';
import { useToastStore } from './store/toastStore';
import { useEffect } from 'react';
import { useBorrowStore } from './store/borrowStore';

function App() {
  const { toasts, removeToast } = useToastStore();
  const { refreshOverdueStatus } = useBorrowStore();

  useEffect(() => {
    refreshOverdueStatus();
  }, [refreshOverdueStatus]);

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/equipment" replace />} />
          <Route path="/equipment" element={<EquipmentPage />} />
          <Route path="/borrow" element={<BorrowPage />} />
          <Route path="/return" element={<ReturnPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="/damage" element={<DamagePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Layout>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </BrowserRouter>
  );
}

export default App;
