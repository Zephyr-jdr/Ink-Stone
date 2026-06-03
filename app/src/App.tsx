import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './i18n';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import CharacterSheetPage from './pages/CharacterSheetPage';
import GraphViewPage from './pages/GraphViewPage';
import ChroniclesPage from './pages/ChroniclesPage';

export default function App() {
  return (
    <LanguageProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/character/:id" element={<CharacterSheetPage />} />
          <Route path="/graph" element={<GraphViewPage />} />
          <Route path="/chronicles" element={<ChroniclesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </LanguageProvider>
  );
}
