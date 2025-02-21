import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext'; // Import useAuth
import 'react-toastify/dist/ReactToastify.css';
import Header from './components/layout/Header/Header';
import Signin from './components/auth/Signin/Signin';
import Signup from './components/auth/Signup/Signup';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Profile from './components/profile/Profile';
import FeedList from './components/feed/FeedList/FeedList';
import NewsList from './components/news-events/NewsList/NewsList';
import EventList from './components/news-events/EventList/EventList';
import NewsEventForm from './components/news-events/NewsEventForm/NewsEventForm';
import ProjectForm from './components/projects/ProjectForm/ProjectForm';
import MyProjects from './components/projects/MyProjects/MyProjects';
import MentorshipRequest from './components/mentorship/MentorshipRequest';
import Collaborations from './components/collaborations/Collaborations';
import JobList from './components/jobs/JobList';
import JobForm from './components/jobs/JobForm';
import JobDetails from './components/jobs/JobDetails';
import AlumniMentorship from './components/mentorship/AlumniMentorship';
import MyMentees from './components/mentorship/MyMentees';
import AnalyticsDashboard from './components/analytics/AnalyticsDashboard';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Styles
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/global.css';

function App() {
  const location = useLocation();
  const showHeader = !['/signin', '/signup'].includes(location.pathname);
  const { user } = useAuth(); // Get the user from AuthContext

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
            {/* Wrap MentorshipRequest route with Protected and Role-based check */}
            <Route path="/projects/mentorship" element={
              <ProtectedRoute>
                {user?.role === 'student' && <MentorshipRequest />}
              </ProtectedRoute>
            } />
            <Route path="/projects/collaborations" element={<ProtectedRoute><Collaborations /></ProtectedRoute>} />

            {/* Alumni Mentorship Route - Conditionally Render based on Role */}
            <Route path="/alumni/mentorship" element={
              <ProtectedRoute>
                {user?.role === 'alumni' ? <AlumniMentorship /> : <div>Unauthorized</div>}
              </ProtectedRoute>
            } />
            <Route path="/alumni/mentees" element={
              <ProtectedRoute>
                {user?.role === 'alumni' ? <MyMentees /> : <div>Unauthorized</div>}
              </ProtectedRoute>
            } />


            <Route path="/jobs" element={<JobList />} />
            <Route path="/jobs/create" element={<ProtectedRoute><JobForm /></ProtectedRoute>} />
            <Route path="/jobs/:id/edit" element={<ProtectedRoute><JobForm /></ProtectedRoute>} />
            <Route path="/jobs/:id" element={<ProtectedRoute><JobDetails /></ProtectedRoute>} />


            <Route path="/analytics" element={<ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>} />

            {/* Default route */}
            <Route path="/" element={<ProtectedRoute><FeedList /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </AuthProvider>

  );
}

export default App;