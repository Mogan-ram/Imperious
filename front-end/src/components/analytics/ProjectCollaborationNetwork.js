// src/components/analytics/ProjectCollaborationNetwork.js
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card, Form, Row, Col, Button, Alert, Badge, Spinner } from 'react-bootstrap';
import * as d3 from 'd3';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaFilter, FaDownload, FaInfoCircle, FaLock } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { analyticsService } from '../../services/api/analytics';

const ProjectCollaborationNetwork = () => {
    const svgRef = useRef(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [techFilter, setTechFilter] = useState('all');
    const [networkData, setNetworkData] = useState({ nodes: [], links: [] });
    const [activeNode, setActiveNode] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [technologies, setTechnologies] = useState([]);
    const [isAuthorized, setIsAuthorized] = useState(true);

    const navigate = useNavigate();
    const { user } = useAuth();

    // Check if user has permission to access analytics
    useEffect(() => {
        if (user) {
            const hasAccess = user.role && ['staff', 'admin'].includes(user.role.toLowerCase());
            setIsAuthorized(hasAccess);
        }
    }, [user]);

    // Fetch project data for analytics
    const fetchProjects = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Check authorization
            if (!isAuthorized) {
                setError("You don't have permission to access this data");
                setLoading(false);
                return;
            }

            // Use the analytics service to get all projects
            const allProjects = await analyticsService.getAllProjects();
            console.log('Fetched projects for network:', allProjects?.length || 0);

            if (Array.isArray(allProjects) && allProjects.length > 0) {
                setProjects(allProjects);

                // Extract unique departments and technologies
                const depts = new Set();
                const techs = new Set();

                allProjects.forEach(project => {
                    // Collect departments from various possible sources
                    if (project.department) depts.add(project.department);
                    if (project.student?.dept) depts.add(project.student.dept);
                    if (project.created_by_dept) depts.add(project.created_by_dept);
                    if (project.creator?.dept) depts.add(project.creator.dept);

                    // Collect technologies from the project
                    const techStack = project.techStack || project.tech_stack || [];
                    if (Array.isArray(techStack)) {
                        techStack.forEach(tech => techs.add(tech));
                    }
                });

                setDepartments(Array.from(depts));
                setTechnologies(Array.from(techs));
            } else {
                setProjects([]);
                if (allProjects?.length === 0) {
                    setError("No projects found in the system. Please create some projects first.");
                } else {
                    setError("Failed to load project data. Please try again later.");
                }
            }
        } catch (error) {
            console.error("Error fetching projects:", error);

            // Provide more specific error message based on the status code
            if (error.response?.status === 403) {
                setError("You don't have permission to access this data.");
            } else {
                setError("Failed to load project data. Please try again later.");
            }
        } finally {
            setLoading(false);
        }
    }, [isAuthorized]);

    // Generate network data based on projects and filters
    const generateNetworkData = useCallback(() => {
        if (!projects || projects.length === 0) {
            setNetworkData({ nodes: [], links: [] });
            return;
        }

        console.log('Generating network data from projects:', projects.length);

        // Apply filters
        let filteredProjects = [...projects];

        if (departmentFilter !== 'all') {
            filteredProjects = filteredProjects.filter(project => {
                const projectDept = project.department ||
                    project.student?.dept ||
                    project.created_by_dept ||
                    project.creator?.dept;
                return projectDept === departmentFilter;
            });
        }

        if (techFilter !== 'all') {
            filteredProjects = filteredProjects.filter(project => {
                const techStack = project.techStack || project.tech_stack || [];
                return techStack.includes(techFilter);
            });
        }

        // Create nodes and links for the network
        const nodes = [];
        const links = [];
        const nodeMap = new Map(); // Map to track nodes and avoid duplicates

        // Add project nodes
        filteredProjects.forEach(project => {
            if (!project._id) return;

            const projectNodeId = `project-${project._id}`;

            // Add project node if it doesn't exist
            if (!nodeMap.has(projectNodeId)) {
                const projectNode = {
                    id: projectNodeId,
                    name: project.title || 'Untitled Project',
                    type: 'project',
                    techStack: project.techStack || project.tech_stack || [],
                    department: project.department || project.creator?.dept || 'Unknown',
                    progress: project.progress || 0,
                    _id: project._id
                };

                nodes.push(projectNode);
                nodeMap.set(projectNodeId, projectNode);
            }

            // Handle project creator
            const creatorId = project.created_by ||
                (project.creator?._id || project.creator?.id);

            if (creatorId) {
                const creatorNodeId = `student-${creatorId}`;
                const creatorName = project.creator?.name || 'Project Creator';
                const creatorDept = project.creator?.dept || project.department || 'Unknown';

                if (!nodeMap.has(creatorNodeId)) {
                    const creatorNode = {
                        id: creatorNodeId,
                        name: creatorName,
                        type: 'student',
                        department: creatorDept,
                        email: project.creator?.email || '',
                        _id: creatorId
                    };

                    nodes.push(creatorNode);
                    nodeMap.set(creatorNodeId, creatorNode);
                }

                // Create link between creator and project
                links.push({
                    source: creatorNodeId,
                    target: projectNodeId,
                    type: 'owner'
                });
            }

            // Add collaborators and create links
            if (project.collaborators && Array.isArray(project.collaborators)) {
                project.collaborators.forEach(collaborator => {
                    // Extract collaborator data (handle different formats)
                    let collabId = null;
                    let collabName = 'Collaborator';
                    let collabDept = 'Unknown';

                    // Handle both object-style and ID-style collaborators
                    if (typeof collaborator === 'object') {
                        collabId = collaborator.id || collaborator._id || collaborator.user_id;
                        collabName = collaborator.name || 'Collaborator';
                        collabDept = collaborator.dept || project.department || 'Unknown';
                    } else if (typeof collaborator === 'string') {
                        collabId = collaborator;
                    }

                    if (!collabId) return;

                    const collaboratorNodeId = `student-${collabId}`;

                    if (!nodeMap.has(collaboratorNodeId)) {
                        const collaboratorNode = {
                            id: collaboratorNodeId,
                            name: collabName,
                            type: 'student',
                            department: collabDept,
                            _id: collabId
                        };

                        nodes.push(collaboratorNode);
                        nodeMap.set(collaboratorNodeId, collaboratorNode);
                    }

                    // Create link between collaborator and project
                    links.push({
                        source: collaboratorNodeId,
                        target: projectNodeId,
                        type: 'collaborator'
                    });
                });
            }

            // Add mentor link if exists
            const mentor = project.mentor || {};
            if (mentor.name || mentor._id || mentor.id) {
                const mentorId = mentor._id || mentor.id || `mentor-${project._id}`;
                const mentorNodeId = `alumni-${mentorId}`;

                if (!nodeMap.has(mentorNodeId)) {
                    const mentorNode = {
                        id: mentorNodeId,
                        name: mentor.name || 'Mentor',
                        type: 'alumni',
                        department: mentor.dept || project.department || 'Unknown',
                        email: mentor.email || '',
                        _id: mentorId
                    };

                    nodes.push(mentorNode);
                    nodeMap.set(mentorNodeId, mentorNode);
                }

                // Create link between mentor and project
                links.push({
                    source: mentorNodeId,
                    target: projectNodeId,
                    type: 'mentor'
                });
            }
        });

        // Create interdepartmental links (for students in same project but different departments)
        const projectCollaborators = new Map();

        // Group collaborators by project
        links.forEach(link => {
            if (link.type === 'owner' || link.type === 'collaborator') {
                const projectId = link.target;
                const studentId = link.source;

                if (!projectCollaborators.has(projectId)) {
                    projectCollaborators.set(projectId, []);
                }

                projectCollaborators.get(projectId).push(studentId);
            }
        });

        // Create links between collaborators in the same project
        projectCollaborators.forEach((collaborators, projectId) => {
            if (collaborators.length > 1) {
                for (let i = 0; i < collaborators.length; i++) {
                    for (let j = i + 1; j < collaborators.length; j++) {
                        const student1 = nodeMap.get(collaborators[i]);
                        const student2 = nodeMap.get(collaborators[j]);

                        // Only create interdepartmental links if students are from different departments
                        if (student1 && student2 && student1.department !== student2.department) {
                            links.push({
                                source: collaborators[i],
                                target: collaborators[j],
                                type: 'interdepartmental'
                            });
                        }
                    }
                }
            }
        });

        console.log(`Network data generated: ${nodes.length} nodes, ${links.length} links`);
        setNetworkData({ nodes, links });
    }, [projects, departmentFilter, techFilter]);

    // Initialize data
    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    // Generate network data when projects or filters change
    useEffect(() => {
        generateNetworkData();
    }, [generateNetworkData, projects, departmentFilter, techFilter]);

    // Create visualization when network data changes
    useEffect(() => {
        if (!svgRef.current || !networkData.nodes.length) return;

        // Clear any existing visualizations
        d3.select(svgRef.current).selectAll("*").remove();

        const width = svgRef.current.clientWidth || 800;
        const height = 600;

        // Create SVG
        const svg = d3.select(svgRef.current)
            .attr("width", width)
            .attr("height", height);

        // Add zoom and pan functionality
        const zoom = d3.zoom()
            .scaleExtent([0.1, 3])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svg.call(zoom);

        // Create a g element that will contain all the elements
        const g = svg.append("g");

        // Create tooltip
        const tooltip = d3.select("body").append("div")
            .attr("class", "d3-tooltip")
            .style("position", "absolute")
            .style("background-color", "white")
            .style("padding", "10px")
            .style("border-radius", "5px")
            .style("box-shadow", "0 0 10px rgba(0,0,0,0.2)")
            .style("pointer-events", "none")
            .style("opacity", 0)
            .style("z-index", 1000);

        // Create force simulation
        const simulation = d3.forceSimulation(networkData.nodes)
            .force("link", d3.forceLink(networkData.links)
                .id(d => d.id)
                .distance(d => {
                    switch (d.type) {
                        case 'owner': return 70;
                        case 'collaborator': return 100;
                        case 'mentor': return 150;
                        case 'interdepartmental': return 200;
                        default: return 100;
                    }
                })
            )
            .force("charge", d3.forceManyBody().strength(-500))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(d => {
                switch (d.type) {
                    case 'project': return 25;
                    case 'student': return 15;
                    case 'alumni': return 20;
                    default: return 15;
                }
            }));

        // Define color scales
        const nodeColorScale = d3.scaleOrdinal()
            .domain(['project', 'student', 'alumni'])
            .range(['#4CAF50', '#2196F3', '#FFC107']);

        const departmentColorScale = d3.scaleOrdinal()
            .domain(departments.length ? departments : ['Unknown'])
            .range(d3.schemeCategory10);

        const linkColorScale = d3.scaleOrdinal()
            .domain(['owner', 'collaborator', 'mentor', 'interdepartmental'])
            .range(['#4CAF50', '#2196F3', '#FFC107', '#9C27B0']);

        // Create links
        const link = g.append("g")
            .selectAll("line")
            .data(networkData.links)
            .join("line")
            .attr("stroke", d => linkColorScale(d.type))
            .attr("stroke-opacity", 0.6)
            .attr("stroke-width", d => {
                switch (d.type) {
                    case 'owner': return 3;
                    case 'collaborator': return 2;
                    case 'mentor': return 2;
                    case 'interdepartmental': return 1;
                    default: return 1;
                }
            })
            .attr("stroke-dasharray", d => d.type === 'interdepartmental' ? "5,5" : "none");

        // Create node groups
        const node = g.append("g")
            .selectAll("g")
            .data(networkData.nodes)
            .join("g")
            .attr("class", "node")
            .call(d3.drag()
                .on("start", dragStarted)
                .on("drag", dragged)
                .on("end", dragEnded)
            )
            .on("mouseover", (event, d) => {
                // Show tooltip
                let tooltipContent = `
                    <div>
                        <strong>${d.name}</strong><br>
                        <span>Type: ${d.type.charAt(0).toUpperCase() + d.type.slice(1)}</span><br>
                        <span>Department: ${d.department}</span>
                `;

                if (d.type === 'project') {
                    tooltipContent += `<br><span>Tech: ${(d.techStack || []).join(', ')}</span>`;
                    tooltipContent += `<br><span>Progress: ${d.progress}%</span>`;
                }

                tooltipContent += `</div>`;

                tooltip
                    .html(tooltipContent)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px")
                    .style("opacity", 1);

                // Highlight connected nodes and links
                const connectedNodeIds = new Set();
                networkData.links.forEach(link => {
                    if (link.source.id === d.id || link.target.id === d.id) {
                        connectedNodeIds.add(link.source.id);
                        connectedNodeIds.add(link.target.id);
                    }
                });

                node.style("opacity", n =>
                    n.id === d.id || connectedNodeIds.has(n.id) ? 1 : 0.2
                );

                link.style("opacity", l =>
                    l.source.id === d.id || l.target.id === d.id ? 1 : 0.1
                );
            })
            .on("mouseout", () => {
                // Hide tooltip
                tooltip.style("opacity", 0);

                // Reset highlight
                node.style("opacity", 1);
                link.style("opacity", 0.6);
            })
            .on("click", (event, d) => {
                // Set active node for details panel
                setActiveNode(d);
                setShowDetails(true);

                // Prevent event propagation
                event.stopPropagation();
            });

        // Add circles to nodes
        node.append("circle")
            .attr("r", d => {
                switch (d.type) {
                    case 'project': return 25;
                    case 'student': return 15;
                    case 'alumni': return 20;
                    default: return 15;
                }
            })
            .attr("fill", d => nodeColorScale(d.type))
            .attr("stroke", d => departmentColorScale(d.department))
            .attr("stroke-width", 3);

        // Add icon text
        node.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .attr("fill", "white")
            .attr("font-size", d => d.type === 'project' ? 12 : 10)
            .text(d => {
                switch (d.type) {
                    case 'project': return 'P';
                    case 'student': return 'S';
                    case 'alumni': return 'A';
                    default: return '';
                }
            });

        // Add labels
        node.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", d => {
                switch (d.type) {
                    case 'project': return 40;
                    case 'student': return 30;
                    case 'alumni': return 35;
                    default: return 30;
                }
            })
            .attr("fill", "#333")
            .attr("font-size", 12)
            .text(d => d.name.length > 20 ? d.name.substring(0, 17) + '...' : d.name);

        // Handle click on background to hide details
        svg.on("click", () => {
            setShowDetails(false);
            setActiveNode(null);
        });

        // Update positions on simulation tick
        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node.attr("transform", d => `translate(${d.x},${d.y})`);
        });

        // Drag functions
        function dragStarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragEnded(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        // Cleanup function
        return () => {
            tooltip.remove();
        };
    }, [networkData, departments]);

    // Handle view project
    const viewProject = (projectId) => {
        navigate(`/projects/${projectId}`);
    };

    // Handle view profile
    const viewProfile = (userId) => {
        navigate(`/profile/${userId}`);
    };

    // Export network as PNG image
    const exportNetwork = () => {
        if (!svgRef.current) return;

        try {
            // Create a new canvas
            const canvas = document.createElement('canvas');
            const svg = svgRef.current;
            const width = svg.clientWidth;
            const height = svg.clientHeight;

            canvas.width = width;
            canvas.height = height;

            const context = canvas.getContext('2d');
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, width, height);

            // Convert SVG to data URL
            const svgData = new XMLSerializer().serializeToString(svg);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);

            // Create image and draw to canvas
            const img = new Image();
            img.onload = () => {
                context.drawImage(img, 0, 0);
                URL.revokeObjectURL(url);

                // Convert canvas to PNG and download
                const pngUrl = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                a.href = pngUrl;
                a.download = 'collaboration-network.png';
                a.click();
            };
            img.src = url;

            toast.success('Network exported as PNG');
        } catch (error) {
            console.error('Error exporting network:', error);
            toast.error('Failed to export network');
        }
    };

    // If the user is not authorized, show access denied message
    if (!isAuthorized) {
        return (
            <Alert variant="warning" className="d-flex align-items-center">
                <FaLock className="me-3" size={24} />
                <div>
                    <h4 className="mb-2">Access Restricted</h4>
                    <p className="mb-0">You don't have permission to access the collaboration network. This feature is available only for staff and admin users.</p>
                </div>
            </Alert>
        );
    }

    if (loading) {
        return (
            <Card>
                <Card.Body className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3">Loading collaboration network...</p>
                </Card.Body>
            </Card>
        );
    }

    if (error) {
        return (
            <Alert variant="danger" className="d-flex align-items-center">
                <FaInfoCircle className="me-2" size={24} />
                <div>
                    <p className="mb-2">{error}</p>
                    <Button variant="outline-danger" onClick={fetchProjects}>
                        Try Again
                    </Button>
                </div>
            </Alert>
        );
    }

    return (
        <Card>
            <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <Card.Title className="mb-0">Project Collaboration Network</Card.Title>
                        <p className="text-muted">Visualize collaborations across departments and technologies</p>
                    </div>
                    <Button variant="outline-primary" onClick={exportNetwork}>
                        <FaDownload className="me-2" /> Export
                    </Button>
                </div>

                <Row className="mb-4">
                    <Col md={5}>
                        <Form.Group>
                            <Form.Label>Filter by Department</Form.Label>
                            <Form.Select
                                value={departmentFilter}
                                onChange={(e) => setDepartmentFilter(e.target.value)}
                            >
                                <option value="all">All Departments</option>
                                {departments.map((dept, index) => (
                                    <option key={index} value={dept}>{dept}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={5}>
                        <Form.Group>
                            <Form.Label>Filter by Technology</Form.Label>
                            <Form.Select
                                value={techFilter}
                                onChange={(e) => setTechFilter(e.target.value)}
                            >
                                <option value="all">All Technologies</option>
                                {technologies.map((tech, index) => (
                                    <option key={index} value={tech}>{tech}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={2} className="d-flex align-items-end">
                        <Button
                            variant="outline-secondary"
                            className="w-100"
                            onClick={() => {
                                setDepartmentFilter('all');
                                setTechFilter('all');
                            }}
                        >
                            <FaFilter className="me-1" /> Reset
                        </Button>
                    </Col>
                </Row>

                <Row>
                    <Col md={showDetails ? 8 : 12}>
                        <div className="network-container position-relative" style={{ border: '1px solid #e0e0e0', borderRadius: '5px', overflow: 'hidden' }}>
                            <svg ref={svgRef} width="100%" height="600"></svg>

                            <div className="legend position-absolute p-2" style={{ bottom: 10, left: 10, backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '5px' }}>
                                <div className="d-flex mb-2">
                                    <strong className="me-2">Nodes:</strong>
                                    <div className="d-flex align-items-center me-3">
                                        <div style={{ width: 15, height: 15, borderRadius: '50%', backgroundColor: '#4CAF50', marginRight: 5 }}></div>
                                        <span>Project (P)</span>
                                    </div>
                                    <div className="d-flex align-items-center me-3">
                                        <div style={{ width: 15, height: 15, borderRadius: '50%', backgroundColor: '#2196F3', marginRight: 5 }}></div>
                                        <span>Student (S)</span>
                                    </div>
                                    <div className="d-flex align-items-center">
                                        <div style={{ width: 15, height: 15, borderRadius: '50%', backgroundColor: '#FFC107', marginRight: 5 }}></div>
                                        <span>Alumni (A)</span>
                                    </div>
                                </div>
                                <div className="d-flex">
                                    <strong className="me-2">Links:</strong>
                                    <div className="d-flex align-items-center me-3">
                                        <div style={{ width: 20, height: 3, backgroundColor: '#4CAF50', marginRight: 5 }}></div>
                                        <span>Owner</span>
                                    </div>
                                    <div className="d-flex align-items-center me-3">
                                        <div style={{ width: 20, height: 3, backgroundColor: '#2196F3', marginRight: 5 }}></div>
                                        <span>Collaborator</span>
                                    </div>
                                    <div className="d-flex align-items-center me-3">
                                        <div style={{ width: 20, height: 3, backgroundColor: '#FFC107', marginRight: 5 }}></div>
                                        <span>Mentor</span>
                                    </div>
                                    <div className="d-flex align-items-center">
                                        <div style={{ width: 20, height: 3, backgroundColor: '#9C27B0', marginRight: 5, borderBottom: '1px dashed #9C27B0' }}></div>
                                        <span>Interdepartmental</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Col>

                    {showDetails && activeNode && (
                        <Col md={4}>
                            <Card>
                                <Card.Header className="d-flex justify-content-between align-items-center">
                                    <div>Node Details</div>
                                    <Badge bg={
                                        activeNode.type === 'project' ? 'success' :
                                            activeNode.type === 'student' ? 'primary' :
                                                'warning'
                                    }>
                                        {activeNode.type.charAt(0).toUpperCase() + activeNode.type.slice(1)}
                                    </Badge>
                                </Card.Header>
                                <Card.Body>
                                    <h5>{activeNode.name}</h5>
                                    <p className="text-muted">Department: {activeNode.department}</p>

                                    {activeNode.type === 'project' && (
                                        <>
                                            <p className="mb-2">Progress: {activeNode.progress}%</p>
                                            <div className="progress mb-3">
                                                <div
                                                    className="progress-bar bg-success"
                                                    role="progressbar"
                                                    style={{ width: `${activeNode.progress}%` }}
                                                    aria-valuenow={activeNode.progress}
                                                    aria-valuemin="0"
                                                    aria-valuemax="100"
                                                ></div>
                                            </div>

                                            <h6>Technologies:</h6>
                                            <div className="mb-3">
                                                {(activeNode.techStack || []).map((tech, index) => (
                                                    <Badge bg="info" className="me-1 mb-1" key={index}>
                                                        {tech}
                                                    </Badge>
                                                ))}
                                            </div>

                                            <Button
                                                variant="primary"
                                                className="w-100 mb-2"
                                                onClick={() => viewProject(activeNode._id)}
                                            >
                                                View Project Details
                                            </Button>
                                        </>
                                    )}

                                    {(activeNode.type === 'student' || activeNode.type === 'alumni') && (
                                        <>
                                            {activeNode.email && (
                                                <p className="text-muted mb-3">Email: {activeNode.email}</p>
                                            )}

                                            <Button
                                                variant="primary"
                                                className="w-100 mb-2"
                                                onClick={() => viewProfile(activeNode._id)}
                                            >
                                                View Profile
                                            </Button>
                                        </>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    )}
                </Row>

                <div className="mt-3">
                    <Alert variant="info" className="d-flex align-items-center">
                        <FaInfoCircle className="me-2" />
                        <div>
                            <strong>Tip:</strong> Click on nodes to view details. Drag nodes to rearrange. Hover for more information. Use mouse wheel to zoom in/out.
                        </div>
                    </Alert>
                </div>
            </Card.Body>
        </Card>
    );
};

export default ProjectCollaborationNetwork;