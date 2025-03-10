import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Profile from '../components/profile/Profile';
import Header from '../components/layout/Header/Header';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage = () => {
    const { userId } = useParams();
    const { user } = useAuth();

    useEffect(() => {
        // Set page title
        document.title = userId ? 'User Profile' : 'My Profile';
    }, [userId]);

    return (
        <div className="app">
            <Header />
            <main>
                <Profile userId={userId} />
            </main>
        </div>
    );
};

export default ProfilePage;