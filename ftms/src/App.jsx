import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import BackButton from './components/layout/BackButton';
import LegacyMatchesRedirect from './components/layout/LegacyMatchesRedirect';
import Dashboard from './pages/Dashboard';
import Players from './pages/Players';
import PlayerProfile from './pages/PlayerProfile';
import Matches from './pages/Matches';
import MatchDetails from './pages/MatchDetails';
import Statistics from './pages/Statistics';
import Backup from './pages/Backup';
import TeamGenerator from './pages/TeamGenerator';
import './App.css';

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div className="app-layout">
        {/* Persistent Desktop Sidebar */}
        <Sidebar />

        {/* Compact Mobile / Tablet Header */}
        <Header />

        {/* Main Content Area */}
        <main className="main-viewport">
          <div className="main-content-wrapper">
            <BackButton />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/players" element={<Players />} />
              <Route path="/players/:id" element={<PlayerProfile />} />
              <Route path="/sessions" element={<Matches />} />
              <Route path="/sessions/:id" element={<MatchDetails />} />
              <Route path="/matches" element={<LegacyMatchesRedirect />} />
              <Route path="/matches/:id" element={<LegacyMatchesRedirect />} />
              <Route path="/teams" element={<TeamGenerator />} />
              <Route path="/team-generator" element={<TeamGenerator />} />
              <Route path="/stats" element={<Statistics />} />
              <Route path="/backup" element={<Backup />} />
              {/* Fallback to Dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}