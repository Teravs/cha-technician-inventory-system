import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import InventoryList from './pages/InventoryList';
import ItemDetail from './pages/ItemDetail';
import RequestList from './pages/RequestList';
import CreateRequest from './pages/CreateRequest';
import RequestDetail from './pages/RequestDetail';
import StockHistory from './pages/StockHistory';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import CategoryManagement from './pages/CategoryManagement';
import UnitManagement from './pages/UnitManagement';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Authenticated Application Shell */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/inventory" element={<InventoryList />} />
              <Route path="/inventory/:id" element={<ItemDetail />} />

              {/* Request Subsystem */}
              <Route path="/requests" element={<RequestList />} />
              <Route path="/requests/create" element={<CreateRequest />} />
              <Route path="/requests/:id" element={<RequestDetail />} />

              {/* Protected for SUPER_ADMIN & KEPALA */}
              <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'KEPALA']} />}>
                <Route path="/stock-history" element={<StockHistory />} />
                <Route path="/reports" element={<Reports />} />
              </Route>

              {/* Master Data: SUPER_ADMIN Only */}
              <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
                <Route path="/users" element={<UserManagement />} />
                <Route path="/categories" element={<CategoryManagement />} />
                <Route path="/units" element={<UnitManagement />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}