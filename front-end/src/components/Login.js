import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./style_login.css";

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
        <div className="login-background">
            <video autoPlay loop muted>
                <source src="/loopy_bg.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video>
            <div className="container d-flex align-items-center justify-content-center vh-100">
                <div className="card p-4 login-container" style={{ maxWidth: "400px", width: "100%" }}>
                    <h2 className="text-center">Login</h2>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            className="form-control"
                            id="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            className="form-control"
                            id="password"
                            placeholder="Enter Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button className="btn btn-primary btn-block mt-3" onClick={handleLogin}>Login</button>
                </div>
            </div>
        </div>
    );
};

export default Login;
