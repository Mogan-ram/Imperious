import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Signup.css";
import { Form, Button } from 'react-bootstrap';
import { useAuth } from '../../../contexts/AuthContext';
import { Dropdown } from 'react-bootstrap';
import { FaUserGraduate, FaUserTie, FaChalkboardTeacher, FaEye, FaEyeSlash } from 'react-icons/fa';

const Signup = () => {
    const navigate = useNavigate();
    const { signup } = useAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState('student');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    const [willingness, setWillingness] = useState([]); // Array for selected options

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };


    const handleWillingnessChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value)
        setWillingness(selectedOptions)
    }

    const handleCheckboxChange = (e) => {
        const { value, checked } = e.target;
        setWillingness(prev =>
            checked ? [...prev, value] : prev.filter(item => item !== value)
        );
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
            // const staffIdPattern = new RegExp(`^${formData.dept}\\d{2}$`);
            // if (!staffIdPattern.test(formData.staffId)) {
            //     setError(`Staff ID should be in format: ${formData.dept}01`);
            //     return false;
            // }
        }

        // Reg number validation for students and alumni
        if (role !== 'staff' && !formData.regno.trim()) {
            setError('Register Number is required');
            return false;
        }

        // Batch validation for students and alumni
        if ((role === 'student' || role === 'alumni') && (!formData.batch || isNaN(parseInt(formData.batch)))) {
            setError('Valid Batch Year is required');
            return false;
        }

        if (!formData.dept) {
            setError('Please select a department');
            return false;
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
                        batch: parseInt(formData.batch), // Ensure batch is an integer
                        ...(role === 'alumni' && { willingness: willingness })

                    }
                )
            };

            console.log('Submitting signup data:', signupData);  // Debug log
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
    // Added a function to handle the visibility
    const toggleShowPassword = () => {
        setShowPassword(!showPassword); // Toggle the state
    };
    const toggleShowConfirmPassword = () => {
        setShowConfirmPassword(!showConfirmPassword)
    }


    // Define willingnessOptions here, inside the component but *outside* any function
    const willingnessOptions = [
        { id: 'volunteering', label: 'Volunteering' },
        { id: 'mentorship', label: 'Mentorship' },
        { id: 'guest_lecture', label: 'Guest Lecture' },
        { id: 'placement_training', label: 'Placement Training' },
        { id: 'networking', label: 'Networking Events' },
        { id: 'fundraising', label: 'Fundraising' },
        { id: 'research', label: 'Research Collaboration' }
    ];


    return (
        <div className="signup-container">
            <div className="floating-elements"></div>
            <div className="decoration-1"></div>
            <div className="decoration-2"></div>
            <div className="signup-card">
                <h2 className="signup-title">What type of user are you?</h2>

                <div className="user-type-buttons">
                    <button
                        type="button"
                        className={`type-btn ${role === 'student' ? 'active' : ''}`}
                        onClick={() => setRole('student')}
                    >
                        <FaUserGraduate />
                        Student
                    </button>
                    <button
                        type="button"
                        className={`type-btn ${role === 'alumni' ? 'active' : ''}`}
                        onClick={() => setRole('alumni')}
                    >
                        <FaUserTie />
                        Alumni
                    </button>
                    <button
                        type="button"
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
                            <Form.Label>Full Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Full name"
                                required
                            />
                        </div>

                        <div className="form-field">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
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
                            <Form.Label>Department</Form.Label>
                            <Form.Select
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
                            </Form.Select>
                        </div>

                        {role !== 'staff' ? (
                            <div className="form-field">
                                <Form.Label>Register Number</Form.Label>
                                <Form.Control
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
                                <Form.Label>Staff ID</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="staffId"
                                    value={formData.staffId}
                                    onChange={handleChange}
                                    placeholder="Enter Staff ID "
                                    required
                                />
                                {/* {formData.dept && (
                                    <Form.Text className="text-muted">
                                        Format: {formData.dept}XX (e.g., {formData.dept}01)
                                    </Form.Text>
                                )} */}
                            </div>
                        )}
                    </div>

                    <div className="form-row">
                        {(role === 'student' || role === 'alumni') && (
                            <div className="form-field">
                                <Form.Label>
                                    Batch Year
                                </Form.Label>
                                <Form.Control
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
                            <Form.Label>Password</Form.Label>
                            <div className="password-input-container">
                                <Form.Control
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Password"
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="link"
                                    onClick={toggleShowPassword}
                                    className="password-toggle-btn"
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-field">
                            <Form.Label>Confirm Password</Form.Label>
                            <div className="password-input-container">
                                <Form.Control
                                    type={showConfirmPassword ? "text" : "password"} // Toggle input type
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm Password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={toggleShowConfirmPassword}
                                >
                                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Willingness Multi-select (for Alumni only) */}
                    {role === 'alumni' && (
                        <Form.Group className="mb-3">
                            <Form.Label>Willing to:</Form.Label>
                            <Dropdown autoClose="outside">
                                <Dropdown.Toggle as="div" className="custom-dropdown-toggle">
                                    {willingness.length > 0 ? (
                                        willingness.map(value => {
                                            const option = willingnessOptions.find(opt => opt.id === value);
                                            return (
                                                <span className="badge bg-primary me-1" key={value}>
                                                    {option ? option.label : value}
                                                </span>
                                            );
                                        })
                                    ) : 'Select options'}
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="w-100">
                                    {willingnessOptions.map(option => (
                                        <Dropdown.Item as="label" key={option.id} className="d-flex align-items-center">
                                            <input
                                                type="checkbox"
                                                value={option.id}
                                                checked={willingness.includes(option.id)}
                                                onChange={handleCheckboxChange}
                                                className="form-check-input me-2"
                                            />
                                            {option.label}
                                        </Dropdown.Item>
                                    ))}
                                </Dropdown.Menu>
                            </Dropdown>
                        </Form.Group>
                    )}


                    {error && <div className="error-message alert alert-danger">{error}</div>}

                    <Button
                        type="submit"
                        className="signup-button"
                        disabled={loading}
                    >
                        Create account
                    </Button>

                    <div className="login-link">
                        Already have an account? <Link to="/signin">Log in</Link>
                    </div>
                </Form>
            </div>
        </div>
    );
};

export default Signup;
