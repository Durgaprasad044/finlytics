
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { FinanceProvider } from './contexts/FinanceContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ProfileProvider } from './contexts/ProfileContext';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Expenses from './pages/Expenses';
import Budget from './pages/Budget';
import Goals from './pages/Goals';
import Receipts from './pages/Receipts';
import Settings from './pages/Settings';
import Landing from './pages/Landing';
import Login from './pages/Login';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import ConnectionTest from './components/ConnectionTest';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <ProfileProvider>
            <FinanceProvider>
              <NotificationProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/app" element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Dashboard />} />
                  <Route path="chat" element={<Chat />} />
                  <Route path="expenses" element={<Expenses />} />
                  <Route path="budget" element={<Budget />} />
                  <Route path="goals" element={<Goals />} />
                  <Route path="receipts" element={<Receipts />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Routes>
              <ConnectionTest />
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  className: 'dark:bg-gray-800 dark:text-white',
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                }}
              />
            </div>
              </NotificationProvider>
            </FinanceProvider>
          </ProfileProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;