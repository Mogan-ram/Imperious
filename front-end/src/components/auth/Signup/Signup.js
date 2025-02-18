import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Signup.css";
import { Form } from 'react-bootstrap';
import { useAuth } from '../../../contexts/AuthContext';
import { FaUserGraduate, FaUserTie, FaChalkboardTeacher } from 'react-icons/fa';

const Signup = () => {
    const navigate = useNavigate();
    const { signup } = useAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState('student');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        dept: '',
        regno: '',
        batch: '',
        staffId: ''
    });

    const [interests, setInterests] = useState({
        volunteering: false,
        mentorship: false
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = () => {
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }

        if (role === 'staff') {
            if (!formData.staffId.trim()) {
                setError('Staff ID is required');
                return false;
            }

            // Check staff ID format (e.g., CSE01)
            const staffIdPattern = new RegExp(`^${formData.dept}\\d{2}$`);
            if (!staffIdPattern.test(formData.staffId)) {
                setError(`Staff ID should be in format: ${formData.dept}01`);
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            setError('');
            setLoading(true);

            const signupData = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                password: formData.password,
                dept: formData.dept.trim(),
                role: role.toLowerCase(),
                ...(role === 'staff'
                    ? { staff_id: formData.staffId.trim() }
                    : {
                        regno: formData.regno.trim().toUpperCase(),
                        batch: parseInt(formData.batch),
                        ...(role === 'alumni' && {
                            volunteering: interests.volunteering,
                            mentorship: interests.mentorship
                        })
                    }
                )
            };

            console.log('Submitting signup data:', signupData);
            await signup(signupData);
            navigate('/signin');

        } catch (err) {
            console.error('Signup error:', err);
            setError(
                err.response?.data?.message ||
                'Failed to create an account'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signup-container">
            <div className="floating-elements"></div>
            <div className="decoration-1"></div>
            <div className="decoration-2"></div>
            <div className="signup-card">
                <h2 className="signup-title">What type of user are you?</h2>

                <div className="user-type-buttons">
                    <button
                        className={`type-btn ${role === 'student' ? 'active' : ''}`}
                        onClick={() => setRole('student')}
                    >
                        <FaUserGraduate />
                        Student
                    </button>
                    <button
                        className={`type-btn ${role === 'alumni' ? 'active' : ''}`}
                        onClick={() => setRole('alumni')}
                    >
                        <FaUserTie />
                        Alumni
                    </button>
                    <button
                        className={`type-btn ${role === 'staff' ? 'active' : ''}`}
                        onClick={() => setRole('staff')}
                    >
                        <FaChalkboardTeacher />
                        Staff
                    </button>
                </div>

                <Form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-field">
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Full name"
                                required
                            />
                        </div>

                        <div className="form-field">
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Email"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-field">
                            <select
                                name="dept"
                                value={formData.dept}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Department</option>
                                <option value="CSE">Computer Science and Engineering</option>
                                <option value="ECE">Electronics and Communication Engineering</option>
                                <option value="MECH">Mechanical Engineering</option>
                                <option value="CIVIL">Civil Engineering</option>
                                <option value="EEE">Electrical and Electronics Engineering</option>
                                <option value="BME">Biomedical Engineering</option>
                                <option value="AERO">Aerospace Engineering</option>
                                <option value="MBA">Master of Business Administration</option>
                                <option value="MCA">Master of Computer Applications</option>
                            </select>
                        </div>

                        {role !== 'staff' ? (
                            <div className="form-field">
                                <input
                                    type="text"
                                    name="regno"
                                    value={formData.regno}
                                    onChange={handleChange}
                                    placeholder="Register Number"
                                    required
                                />
                            </div>
                        ) : (
                            <div className="form-field">
                                <input
                                    type="text"
                                    name="staffId"
                                    value={formData.staffId}
                                    onChange={handleChange}
                                    placeholder="Enter Staff ID "
                                    required
                                />
                            </div>
                        )}
                    </div>

                    <div className="form-row">
                        {(role === 'student' || role === 'alumni') && (
                            <div className="form-field">
                                <input
                                    type="number"
                                    name="batch"
                                    value={formData.batch}
                                    onChange={handleChange}
                                    placeholder="Batch Year"
                                    required
                                />
                            </div>
                        )}

                        <div className="form-field">
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Password"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-field">
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm Password"
                                required
                            />
                        </div>
                    </div>

                    {role === 'alumni' && (
                        <div className="form-field">
                            <label>Willing to</label>
                            <div className="checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={interests.volunteering}
                                        onChange={(e) => setInterests(prev => ({
                                            ...prev,
                                            volunteering: e.target.checked
                                        }))}
                                    />
                                    Volunteering
                                </label>
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={interests.mentorship}
                                        onChange={(e) => setInterests(prev => ({
                                            ...prev,
                                            mentorship: e.target.checked
                                        }))}
                                    />
                                    Mentorship
                                </label>
                            </div>
                        </div>
                    )}

                    {error && <div className="error-message">{error}</div>}

                    <button
                        type="submit"
                        className="signup-button"
                        disabled={loading}
                    >
                        Create account
                    </button>

                    <div className="login-link">
                        Already have an account? <Link to="/signin">Log in</Link>
                    </div>
                </Form>
            </div>
        </div>
    );
};

export default Signup;

