import React, { useState } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import './style_login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            const response = await axios.post('http://localhost:5000/login', { email, password });
            localStorage.setItem('token', response.data.token);
            navigate('/profile');
        } catch (error) {
            alert('Invalid Credentials');
        }
    };

    return (
        <div className="login-container">
            <h2 className="login-title">Login</h2>
            <input
                type="email"
                className="login-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                type="password"
                className="login-input"
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button className="login-button" onClick={handleLogin}>Login</button>
        </div>
    );
};

export default Login;
