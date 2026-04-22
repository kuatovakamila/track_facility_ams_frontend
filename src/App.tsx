import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { DataProvider } from './contexts/DataContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './Dashboard';
import Incidents from './Incidents';
import Cameras from './Cameras';
import Users from './Users';
import Files from './Files';
import Events from './Events';
import Roles from './Roles';
import Permissions from './Permissions';
import Login from './Login';
import Register from './Register';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <DataProvider>
            <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/incidents" 
              element={
                <ProtectedRoute>
                  <Incidents />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/events" 
              element={
                <ProtectedRoute>
                  <Events />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/cameras" 
              element={
                <ProtectedRoute>
                  <Cameras />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/users" 
              element={
                <ProtectedRoute>
                  <Users />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/files" 
              element={
                <ProtectedRoute>
                  <Files />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/roles" 
              element={
                <ProtectedRoute>
                  <Roles />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/permissions" 
              element={
                <ProtectedRoute>
                  <Permissions />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Router>
          </DataProvider>
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
