import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Layout Components
import Header from './components/layout/Header/Header';

// Auth Components
import Signin from './components/auth/Signin/Signin';
import Signup from './components/auth/Signup/Signup';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Feature Components
import Profile from './components/profile/Profile/Profile';
import FeedList from './components/feed/FeedList/FeedList';
import NewsList from './components/news-events/NewsList/NewsList';
import EventList from './components/news-events/EventList/EventList';

// Styles
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/global.css';

function App() {
  const location = useLocation();
  const showHeader = !['/signin', '/signup'].includes(location.pathname);

  return (
    <AuthProvider>
      <div className="app">
        {showHeader && <Header />}
        <main>
          <Routes>
            {/* Public Routes */}
            <Route path="/signin" element={<Signin />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Routes */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/feeds"
              element={
                <ProtectedRoute>
                  <FeedList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/news"
              element={
                <ProtectedRoute>
                  <NewsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events"
              element={
                <ProtectedRoute>
                  <EventList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <FeedList />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;