import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { DropdownButton } from "./bootstrap_comp";
import "./style_login.css"; // Apply the same styles as login

const Signup = () => {
    const [name, setName] = useState('');
    const [dept, setDept] = useState('');
    const [role, setRole] = useState('');
    const [regno, setRegno] = useState('');
    const [batch, setBatch] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const roleValues = ['Student', 'Alumni', 'Staff'];
    const deptValues = ['CSE', 'EEE', 'IT', 'ECE'];
    const batchYear = ['2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021'];

    const navigate = useNavigate();

    const handleSignup = async () => {
        try {
            await axios.post('http://localhost:5000/signup', { name, dept, role, regno, batch, email, password });
            navigate('/login');
        } catch (error) {
            alert('Error creating the user');
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
                    <h2 className="text-center">Signup</h2>
                    <div className="form-group">
                        <label>Name</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Enter your Name"
                            value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Department</label>
                        <DropdownButton title="Choose Department" items={deptValues} value={dept} onChange={setDept} required />
                    </div>
                    <div className="form-group">
                        <label>Role</label>
                        <DropdownButton title="User Type" items={roleValues} value={role} onChange={setRole} required />
                    </div>
                    {role === 'Student' && (
                        <div className="form-group">
                            <label>Reg No</label>
                            <input type="number" className="form-control" placeholder="Enter your Regno" value={regno} onChange={(e) => setRegno(e.target.value)} required />
                        </div>
                    )}
                    {role === 'Alumni' && (
                        <div className="form-group">
                            <label>Batch</label>
                            <DropdownButton title="Choose Year" items={batchYear} value={batch} onChange={setBatch} required />
                        </div>
                    )}
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" className="form-control" placeholder="Enter your mail id" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" className="form-control" placeholder="Enter Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <button className="btn btn-primary btn-block mt-3" onClick={handleSignup}>Signup</button>
                </div>
            </div>
        </div>
    );
};

export default Signup;

