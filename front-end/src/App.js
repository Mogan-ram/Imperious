import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Layout Components
import Header from './components/layout/Header/Header';

// Auth Components
import Signin from './components/auth/Signin/Signin';
import Signup from './components/auth/Signup/Signup';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Feature Components
import Profile from './components/profile/Profile';
import FeedList from './components/feed/FeedList/FeedList';
import NewsList from './components/news-events/NewsList/NewsList';
import EventList from './components/news-events/EventList/EventList';
import NewsEventForm from './components/news-events/NewsEventForm/NewsEventForm';
import ProjectDashboard from './components/projects/ProjectDashboard/ProjectDashboard';
import ProjectForm from './components/projects/ProjectForm/ProjectForm';
import MyProjects from './components/projects/MyProjects/MyProjects';
import MentorshipRequest from './components/mentorship/MentorshipRequest/MentorshipRequest';
import Collaborations from './components/collaborations/Collaborations';

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
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/feeds" element={<ProtectedRoute><FeedList /></ProtectedRoute>} />
            <Route path="/news" element={<ProtectedRoute><NewsList /></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute><EventList /></ProtectedRoute>} />
            <Route path="/news-events/create" element={<ProtectedRoute><NewsEventForm /></ProtectedRoute>} />

            {/* Project Routes */}
            <Route path="/projects/my-projects" element={<ProtectedRoute><MyProjects /></ProtectedRoute>} />
            <Route path="/projects/create" element={<ProtectedRoute><ProjectForm /></ProtectedRoute>} />
            <Route path="/projects/:id/edit" element={<ProtectedRoute><ProjectForm /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><MyProjects /></ProtectedRoute>} />
            <Route path="/projects/mentorship" element={<ProtectedRoute><MentorshipRequest /></ProtectedRoute>} />
            <Route path="/projects/collaborations" element={<ProtectedRoute><Collaborations /></ProtectedRoute>} />

            {/* Default route */}
            <Route path="/" element={<ProtectedRoute><FeedList /></ProtectedRoute>} />
          </Routes>
        </main>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          closeOnClick
          pauseOnHover
        />
      </div>
    </AuthProvider>
  );
}

export default App;