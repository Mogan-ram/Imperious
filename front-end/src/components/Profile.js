import React, { useEffect, useState } from "react";
import axios from "axios";

const Profile = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/profile', { headers: { Authorization: `Bearer ${token}` } });
            setUser(response.data);
        };
        fetchProfile();
    }, []);

    if (!user) return <div>Loading...</div>;

    return (
        <div>
            <h2>Profile</h2>
            <p>Email: {user.email}</p>
            <p>Role: {user.role}</p>
        </div>
    );
};

export default Profile;
