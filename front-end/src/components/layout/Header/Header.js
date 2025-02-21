import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
// Import all necessary icons
import { FaUserCircle, FaFolder, FaPlus, FaProjectDiagram, FaBriefcase, FaHandshake, FaHome, FaNewspaper, FaCalendarAlt, FaChartLine, FaUserTie, FaUserGraduate, FaUserPlus, FaChalkboardTeacher } from 'react-icons/fa';
import { useAuth } from '../../../contexts/AuthContext';
import './Header.css';

const Header = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/signin');
        } catch (error) {
            console.error('Failed to log out:', error);
        }
    };

    const renderRoleSpecificMenus = () => {
        if (!user) return null;

        const role = user.role.toLowerCase();

        if (role === 'student') {
            return (
                <>
                    <NavDropdown title={<><FaProjectDiagram className="me-1" />Projects</>} id="projects-dropdown">
                        <NavDropdown.Item as={Link} to="/projects/my-projects" className="d-flex align-items-center">
                            <FaFolder className="me-2" />My Projects
                        </NavDropdown.Item>
                        <NavDropdown.Item as={Link} to="/projects/create" className="d-flex align-items-center">
                            <FaPlus className="me-2" />Create Project
                        </NavDropdown.Item>
                        <NavDropdown.Item as={Link} to="/projects/mentorship">
                            <FaHandshake className="me-2" />Seek Mentorship</NavDropdown.Item>
                        <NavDropdown.Item as={Link} to="/projects/collaborations">
                            <FaUserPlus className="me-2" />Collaborations {/*Added user plus icon*/}
                        </NavDropdown.Item>
                    </NavDropdown>
                    <Nav.Link as={Link} to="/jobs"> <FaBriefcase className="me-1" />Jobs</Nav.Link>
                </>
            );
        }

        if (role === 'alumni') {
            return (
                <>
                    <NavDropdown title={<><FaHandshake className="me-1" />Mentorship</>} id="mentorship-dropdown">
                        <NavDropdown.Item as={Link} to="/alumni/mentorship">
                            <FaHandshake className="me-2" />Mentorship Requests</NavDropdown.Item>
                        <NavDropdown.Item as={Link} to="/alumni/mentees">
                            <FaUserGraduate className="me-2" />My Mentees</NavDropdown.Item>
                    </NavDropdown>

                    <NavDropdown title={<><FaBriefcase className="me-1" />Jobs</>} id="jobs-dropdown">
                        <NavDropdown.Item as={Link} to="/jobs">
                            <FaBriefcase className="me-2" />View Jobs
                        </NavDropdown.Item>
                        <NavDropdown.Item as={Link} to="/jobs/create">
                            <FaPlus className="me-2" /> Post Job
                        </NavDropdown.Item>
                    </NavDropdown>
                </>
            );
        }


        if (role === 'staff') {
            return (
                <>

                    <Nav.Link as={Link} to="/analytics"><FaChartLine className="me-1" />Analytics</Nav.Link>

                </>
            );
        }
    };


    return (
        <Navbar bg="white" expand="lg" className="shadow-sm">
            <Container>
                <Navbar.Brand as={Link} to="/">Imperious</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link as={Link} to="/"><FaHome className="me-1" />Home</Nav.Link>
                        <Nav.Link as={Link} to="/news"><FaNewspaper className="me-1" />News</Nav.Link>
                        <Nav.Link as={Link} to="/events"><FaCalendarAlt className="me-1" />Events</Nav.Link>
                        {renderRoleSpecificMenus()}
                    </Nav>

                    <Nav>
                        {user ? (
                            <NavDropdown title={<><FaUserCircle size={24} /> {user.name}</>} align="end">
                                <NavDropdown.Item as={Link} to="/profile">Profile</NavDropdown.Item>
                                <NavDropdown.Divider />
                                <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
                            </NavDropdown>
                        ) : (
                            <Nav.Link as={Link} to="/signin">Sign In</Nav.Link>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default Header;