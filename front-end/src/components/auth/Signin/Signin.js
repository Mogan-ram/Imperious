import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link, useLocation } from "react-router-dom";
import "./style_login.css";
import { useAuth } from '../../../contexts/AuthContext';

const Signin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const handleSignin = async () => {
        try {
            const response = await axios.post('http://localhost:5000/login', {
                email,
                password
            });
            console.log('Login response:', response.data);
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                login(response.data.user);

                // Send them back to the page they tried to visit when they were
                // redirected to the login page. Use a default of '/' if no prior
                // location was saved.
                const from = location.state?.from?.pathname || '/';
                navigate(from);
            } else {
                alert('Invalid response from server');
            }
        } catch (error) {
            console.error('Login error:', error.response?.data || error);
            alert(error.response?.data?.message || 'Invalid Credentials');
        }
    };

    return (
        <div className="login-background">
            {/* <video autoPlay loop muted>
                <source src="/loopy_bg.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video> */}
            <div className="container">
                <div className="row min-vh-100 align-items-center justify-content-center">
                    <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">
                        <div className="login-container">
                            <h2 className="text-center">Login</h2>
                            <form>
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

                                <button
                                    type="button"
                                    className="btn btn-primary w-100 mt-4"
                                    onClick={handleSignin}
                                >
                                    Login
                                </button>
                            </form>
                            <div className="text-center mt-3">
                                <span>Don't have an account? </span>
                                <Link to="/signup">Sign up</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signin;
