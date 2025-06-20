import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout/Layout';
import { Login } from '@/pages/Login';
import { Signup } from '@/pages/Signup';
import { Dashboard } from '@/pages/Dashboard';
import { Sales } from '@/pages/Sales';
import { Customers } from '@/pages/Customers';
import { Inventory } from '@/pages/Inventory';
import { Accounting } from '@/pages/Accounting';
import { Users } from '@/pages/Users';
import { Reports } from '@/pages/Reports';
import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout>
                    <Navigate to="/dashboard" replace />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/sales" element={
                <ProtectedRoute>
                  <Layout>
                    <Sales />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/customers" element={
                <ProtectedRoute>
                  <Layout>
                    <Customers />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/inventory" element={
                <ProtectedRoute>
                  <Layout>
                    <Inventory />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/accounting" element={
                <ProtectedRoute>
                  <Layout>
                    <Accounting />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/users" element={
                <ProtectedRoute>
                  <Layout>
                    <Users />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/reports" element={
                <ProtectedRoute>
                  <Layout>
                    <Reports />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            
            {/* Global Toast Notifications */}
            <Toaster />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
