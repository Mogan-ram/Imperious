// Keep these imports
import React, { Suspense, useEffect } from 'react'; // Add Suspense import
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import 'react-toastify/dist/ReactToastify.css';
import Header from './components/layout/Header/Header';
import Signin from './components/auth/Signin/Signin';
import Signup from './components/auth/Signup/Signup';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner'; // Make sure this is imported
import { ToastContainer } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/global.css';
import CollapsibleChat from './components/messaging/CollapsibleChat';
import MessagingPage from './components/messaging/MessagingPage';
import socketService from './services/socketService';


// Replace direct imports with lazy imports for larger components
const Profile = React.lazy(() => import('./components/profile/Profile'));
const FeedList = React.lazy(() => import('./components/feed/FeedList/FeedList'));
const NewsList = React.lazy(() => import('./components/news-events/NewsList/NewsList'));
const EventList = React.lazy(() => import('./components/news-events/EventList/EventList'));
const NewsEventForm = React.lazy(() => import('./components/news-events/NewsEventForm/NewsEventForm'));
const ProjectForm = React.lazy(() => import('./components/projects/ProjectForm/ProjectForm'));
const MyProjects = React.lazy(() => import('./components/projects/MyProjects/MyProjects'));
const MentorshipRequest = React.lazy(() => import('./components/mentorship/MentorshipRequest'));
const Collaborations = React.lazy(() => import('./components/collaborations/Collaborations'));
const JobList = React.lazy(() => import('./components/jobs/JobList'));
const JobForm = React.lazy(() => import('./components/jobs/JobForm'));
const JobDetails = React.lazy(() => import('./components/jobs/JobDetails'));
const AlumniMentorship = React.lazy(() => import('./components/mentorship/AlumniMentorship'));
const MyMentees = React.lazy(() => import('./components/mentorship/MyMentees'));
const AnalyticsDashboard = React.lazy(() => import('./components/analytics/AnalyticsDashboard'));
const ProjectDetail = React.lazy(() => import('./components/projects/ProjectDetail/ProjectDetail'));

function App() {
  const location = useLocation();
  const showHeader = !['/signin', '/signup'].includes(location.pathname);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.email) {
      socketService.connect(user.email);
    } else {
      socketService.disconnect();
    }

    return () => {
      socketService.disconnect();
    };
  }, [user]);

  // Show chat only on routes where user is authenticated and not on the messaging page
  const showChat = user && location.pathname !== '/messages';


  return (
    <AuthProvider>
      <div className="app">
        {showHeader && <Header />}
        <main>
          <Routes>
            {/* Public Routes - keep these without Suspense */}
            <Route path="/signin" element={<Signin />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Routes - wrap with Suspense */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <Profile />
                </Suspense>
              </ProtectedRoute>
            } />

            <Route path="/feeds" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <FeedList />
                </Suspense>
              </ProtectedRoute>
            } />

            <Route path="/news" element={
              <Suspense fallback={<LoadingSpinner />}>

                <NewsList />
              </Suspense>

            } />

            <Route path="/events" element={

              <Suspense fallback={<LoadingSpinner />}>
                <EventList />
              </Suspense>

            } />

            <Route path="/news-events/create" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <NewsEventForm />
                </Suspense>
              </ProtectedRoute>
            } />

            {/* Project Routes */}
            <Route path="/projects/my-projects" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <MyProjects />
                </Suspense>
              </ProtectedRoute>
            } />

            <Route path="/projects/create" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <ProjectForm />
                </Suspense>
              </ProtectedRoute>
            } />

            <Route path="/projects/:id/edit" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <ProjectForm />
                </Suspense>
              </ProtectedRoute>
            } />

            <Route path="/projects" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <MyProjects />
                </Suspense>
              </ProtectedRoute>
            } />

            <Route path="/projects/:id" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <ProjectDetail />
                </Suspense>
              </ProtectedRoute>
            } />

            {/* Mentorship Routes */}
            <Route path="/projects/mentorship" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  {user?.role === 'student' && <MentorshipRequest />}
                </Suspense>
              </ProtectedRoute>
            } />

            <Route path="/projects/collaborations" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <Collaborations />
                </Suspense>
              </ProtectedRoute>
            } />

            {/* Alumni Routes */}
            <Route path="/alumni/mentorship" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  {user?.role === 'alumni' ? <AlumniMentorship /> : <div>Unauthorized</div>}
                </Suspense>
              </ProtectedRoute>
            } />

            <Route path="/alumni/mentees" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  {user?.role === 'alumni' ? <MyMentees /> : <div>Unauthorized</div>}
                </Suspense>
              </ProtectedRoute>
            } />

            {/* Job Routes */}
            <Route path="/jobs" element={
              <Suspense fallback={<LoadingSpinner />}>
                <JobList />
              </Suspense>
            } />

            <Route path="/jobs/create" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <JobForm />
                </Suspense>
              </ProtectedRoute>
            } />

            <Route path="/jobs/:id/edit" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <JobForm />
                </Suspense>
              </ProtectedRoute>
            } />

            <Route path="/jobs/:id" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <JobDetails />
                </Suspense>
              </ProtectedRoute>
            } />

            {/* Analytics Route */}
            <Route path="/analytics" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <AnalyticsDashboard />
                </Suspense>
              </ProtectedRoute>
            } />

            <Route path="/messages" element={
              <ProtectedRoute>
                <MessagingPage />
              </ProtectedRoute>
            } />


            {/* Default route */}
            <Route path="/" element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingSpinner />}>
                  <FeedList />
                </Suspense>
              </ProtectedRoute>
            } />
          </Routes>
        </main>
        {showChat && <CollapsibleChat />}
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </AuthProvider>
  );
}


export default App;
