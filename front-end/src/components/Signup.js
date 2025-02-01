import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');
    const navigate = useNavigate();

    const handleSingup = async () => {
        try {
            await axios.post('http://localhost:5000/signup', { email, password, role });
            navigate('/login');
        }
        catch (error) {
            alert('Error creating the user');
        }
    };

    return (
        <div>
            <h2>Singup</h2>
            <input type="email" placeholder="Enter your mail id" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Enter Password" value={password} onChange={(e) => setPassword(e.target.value)} />

            <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="student">Student</option>
                <option value="alumni">Alumni</option>
                <option value="staff">Staff</option>
            </select>
            <button onClick={handleSingup}>Signup</button>
        </div>
    );
};

export default Signup;
