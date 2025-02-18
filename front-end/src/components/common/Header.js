import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { NavDropdown } from 'react-bootstrap';

const Header = () => {
    const [projectsDropdownOpen, setProjectsDropdownOpen] = useState(false);

    const handleProjectsDropdownToggle = () => {
        setProjectsDropdownOpen(!projectsDropdownOpen);
    };

    return (
        <div>
            {/* In your Projects dropdown menu */}
            <NavDropdown title="Projects" id="projects-dropdown" show={projectsDropdownOpen} onToggle={handleProjectsDropdownToggle}>
                <NavDropdown.Item as={Link} to="/projects">
                    My Projects
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/projects/mentorship">
                    Seek Mentorship
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/projects/collaborations">
                    Collaborations
                </NavDropdown.Item>
            </NavDropdown>
        </div>
    );
};

export default Header; 