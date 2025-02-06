import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./style_login.css";
import { useAuth } from '../../../contexts/AuthContext';

const Signin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await login({ email, password });
            navigate('/feeds');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to sign in');
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
                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            )}
                            <form onSubmit={handleSubmit}>
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
                                    type="submit"
                                    className="btn btn-primary w-100 mt-4"
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
