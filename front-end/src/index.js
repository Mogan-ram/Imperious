import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ConnectionsProvider } from './contexts/ConnectionsContext';
import 'bootstrap/dist/css/bootstrap.min.css';

// Import our standalone pages
import ProfilePage from './pages/ProfilePage';
import UsersPage from './pages/UsersPage';



const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ConnectionsProvider>
          <Routes>
            {/* Profile routes - Allow viewing profiles by ID */}
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Users route for finding and connecting with others */}
            <Route path="/users" element={<UsersPage />} />


            {/* Main app routes */}
            <Route path="/*" element={<App />} />
          </Routes>
        </ConnectionsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);