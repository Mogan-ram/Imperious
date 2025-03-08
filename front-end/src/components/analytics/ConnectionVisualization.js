// src/components/analytics/ConnectionVisualization.js
import React, { useEffect, useRef, useState } from 'react';
import { Card, Form, Button, Row, Col, Badge } from 'react-bootstrap';
import * as d3 from 'd3';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import messagingService from '../../services/api/messaging';
import { useAuth } from '../../contexts/AuthContext';

const ConnectionVisualization = ({ alumniData, menteesData }) => {
    const svgRef = useRef(null);
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [selectedWillingness, setSelectedWillingness] = useState('all');
    const [highlightConnections, setHighlightConnections] = useState(false);
    const [showLabels, setShowLabels] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuth();

    // Start conversation with a user
    const startConversation = async (targetEmail) => {
        try {
            // Search for the user
            const searchResult = await messagingService.searchUsers(targetEmail);

            if (searchResult && searchResult.length > 0) {
                const targetUser = searchResult.find(u => u.email === targetEmail);

                if (targetUser) {
                    // Create a conversation
                    await messagingService.createConversation([targetEmail, user.email]);
                    toast.success(`Conversation started with ${targetUser.name}`);

                    // Navigate to messages page
                    navigate('/messages');
                }
            } else {
                toast.error("Could not find user details");
            }
        } catch (error) {
            console.error("Error starting conversation:", error);
            toast.error("Failed to start conversation");
        }
    };

    // Navigate to profile page
    const viewProfile = (userId) => {
        navigate(`/profile/${userId}`);
    };

    // Prepare and create the visualization when data or filters change
    useEffect(() => {
        if (!alumniData || !menteesData || !svgRef.current) return;

        // Clear previous visualization
        d3.select(svgRef.current).selectAll("*").remove();

        // Filter data based on selected department and willingness
        let filteredAlumni = [...alumniData];
        let filteredMentees = [...menteesData];

        if (selectedDepartment !== 'all') {
            filteredAlumni = filteredAlumni.filter(a => a.department === selectedDepartment);
            filteredMentees = filteredMentees.filter(m => m.department === selectedDepartment);
        }

        if (selectedWillingness !== 'all') {
            filteredAlumni = filteredAlumni.filter(a =>
                a.willingness && a.willingness.includes(selectedWillingness)
            );
        }

        // Create nodes for network graph
        const nodes = [];
        const links = [];

        // Add alumni nodes
        filteredAlumni.forEach(alumnus => {
            nodes.push({
                id: alumnus.alumnusId,
                name: alumnus.alumnusName,
                department: alumnus.department,
                batch: alumnus.batch,
                email: alumnus.email || '', // Add email for messaging
                type: 'alumni',
                menteeCount: alumnus.mentees ? alumnus.mentees.length : 0
            });
        });

        // Add mentee nodes and connections
        filteredMentees.forEach(menteeData => {
            const alumnus = nodes.find(n => n.id === menteeData.alumnusId);

            if (alumnus && menteeData.mentees && menteeData.mentees.length > 0) {
                menteeData.mentees.forEach(mentee => {
                    // Check if mentee already exists
                    let menteeNode = nodes.find(n => n.email === mentee.email);

                    if (!menteeNode) {
                        menteeNode = {
                            id: mentee._id || `mentee-${nodes.length}`,
                            name: mentee.name,
                            department: mentee.dept,
                            batch: mentee.batch,
                            email: mentee.email,
                            type: 'mentee',
                            project: mentee.project ? mentee.project.title : null
                        };
                        nodes.push(menteeNode);
                    }

                    // Create a link
                    links.push({
                        source: alumnus.id,
                        target: menteeNode.id,
                        value: 1
                    });
                });
            }
        });

        // Set up D3 visualization
        const width = svgRef.current.clientWidth;
        const height = 600; // Fixed height

        // Create SVG
        const svg = d3.select(svgRef.current)
            .attr("width", width)
            .attr("height", height);

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

        // Create simulation
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-400))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(d =>
                d.type === 'alumni' ? 40 : 20
            ));

        // Draw links
        const link = svg.append("g")
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke", highlightConnections ? "#4a90e2" : "#999")
            .attr("stroke-opacity", highlightConnections ? 0.8 : 0.3)
            .attr("stroke-width", d => highlightConnections ? 2 : 1);

        // Define color scale for departments
        const departmentColors = d3.scaleOrdinal()
            .domain([...new Set(nodes.map(n => n.department))])
            .range(d3.schemeCategory10);

        // Draw nodes
        const node = svg.append("g")
            .selectAll("g")
            .data(nodes)
            .join("g")
            .on("mouseover", (event, d) => {
                // Show tooltip on mouseover
                const content = `
                    <div>
                        <strong>${d.name}</strong> (${d.type === 'alumni' ? 'Alumni' : 'Student'})
                        <br>
                        <span>Department: ${d.department}</span>
                        <br>
                        <span>Batch: ${d.batch}</span>
                        ${d.menteeCount ? `<br><span>Mentees: ${d.menteeCount}</span>` : ''}
                        ${d.project ? `<br><span>Project: ${d.project}</span>` : ''}
                    </div>
                `;

                tooltip
                    .html(content)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px")
                    .style("opacity", 1);

                // Highlight connected nodes
                if (highlightConnections) {
                    const connectedNodeIds = new Set();
                    links.forEach(link => {
                        if (link.source.id === d.id) connectedNodeIds.add(link.target.id);
                        if (link.target.id === d.id) connectedNodeIds.add(link.source.id);
                    });

                    node.style("opacity", n =>
                        n.id === d.id || connectedNodeIds.has(n.id) ? 1 : 0.3
                    );

                    link.style("stroke-opacity", l =>
                        l.source.id === d.id || l.target.id === d.id ? 0.8 : 0.1
                    );
                }
            })
            .on("mouseout", () => {
                // Hide tooltip on mouseout
                tooltip.style("opacity", 0);

                // Restore original opacity
                if (highlightConnections) {
                    node.style("opacity", 1);
                    link.style("stroke-opacity", 0.6);
                }
            })
            .on("click", (event, d) => {
                // Show action menu (chat, view profile)
                const actionMenu = d3.select("body").append("div")
                    .attr("class", "d3-action-menu")
                    .style("position", "absolute")
                    .style("background-color", "white")
                    .style("padding", "10px")
                    .style("border-radius", "5px")
                    .style("box-shadow", "0 0 10px rgba(0,0,0,0.5)")
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px")
                    .style("z-index", 1500);

                // Add buttons
                actionMenu.append("div")
                    .attr("class", "action-button")
                    .style("padding", "5px 10px")
                    .style("margin-bottom", "5px")
                    .style("border-radius", "3px")
                    .style("background-color", "#4a90e2")
                    .style("color", "white")
                    .style("cursor", "pointer")
                    .text("Message")
                    .on("click", () => {
                        actionMenu.remove();
                        if (d.email) startConversation(d.email);
                    });

                actionMenu.append("div")
                    .attr("class", "action-button")
                    .style("padding", "5px 10px")
                    .style("border-radius", "3px")
                    .style("background-color", "#5cb85c")
                    .style("color", "white")
                    .style("cursor", "pointer")
                    .text("View Profile")
                    .on("click", () => {
                        actionMenu.remove();
                        viewProfile(d.id);
                    });

                // Add close button
                actionMenu.append("div")
                    .attr("class", "action-button")
                    .style("padding", "5px 10px")
                    .style("margin-top", "5px")
                    .style("border-radius", "3px")
                    .style("background-color", "#f0f0f0")
                    .style("color", "#333")
                    .style("cursor", "pointer")
                    .text("Close")
                    .on("click", () => {
                        actionMenu.remove();
                    });

                // Close when clicking outside
                d3.select("body").on("click.actionMenu", function (event) {
                    if (event.target !== actionMenu.node() && !actionMenu.node().contains(event.target)) {
                        actionMenu.remove();
                        d3.select("body").on("click.actionMenu", null);
                    }
                });
            })
            .call(d3.drag()
                .on("start", dragStarted)
                .on("drag", dragged)
                .on("end", dragEnded));

        // Add circles to nodes
        node.append("circle")
            .attr("r", d => d.type === 'alumni' ? 20 : 10)
            .attr("fill", d => departmentColors(d.department))
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5);

        // Add text labels
        if (showLabels) {
            node.append("text")
                .attr("text-anchor", "middle")
                .attr("dy", d => d.type === 'alumni' ? -25 : -15)
                .text(d => d.name)
                .attr("font-size", d => d.type === 'alumni' ? "12px" : "10px")
                .attr("fill", "#333");
        }

        // Add type indicator
        node.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .text(d => d.type === 'alumni' ? 'A' : 'S')
            .attr("font-size", "10px")
            .attr("fill", "white");

        // Update positions on simulation tick
        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node
                .attr("transform", d => `translate(${d.x},${d.y})`);
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

    }, [alumniData, menteesData, selectedDepartment, selectedWillingness, highlightConnections, showLabels, navigate, user.email]);

    // Get unique departments for filter
    const departments = Array.from(new Set(alumniData.map(a => a.department).filter(Boolean)));

    // Get unique willingness options
    const willingnessOptions = Array.from(new Set(
        alumniData.flatMap(a => a.willingness || [])
    ));

    return (
        <Card className="mb-4">
            <Card.Body>
                <Card.Title>Alumni-Student Connection Network</Card.Title>

                <Row className="mb-3">
                    <Col md={3}>
                        <Form.Group>
                            <Form.Label>Filter by Department</Form.Label>
                            <Form.Select
                                value={selectedDepartment}
                                onChange={(e) => setSelectedDepartment(e.target.value)}
                            >
                                <option value="all">All Departments</option>
                                {departments.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group>
                            <Form.Label>Filter by Willingness</Form.Label>
                            <Form.Select
                                value={selectedWillingness}
                                onChange={(e) => setSelectedWillingness(e.target.value)}
                            >
                                <option value="all">All Types</option>
                                {willingnessOptions.map(willing => (
                                    <option key={willing} value={willing}>
                                        {willing.charAt(0).toUpperCase() + willing.slice(1)}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group className="mt-4">
                            <Form.Check
                                type="switch"
                                id="highlight-connections"
                                label="Highlight Connections"
                                checked={highlightConnections}
                                onChange={() => setHighlightConnections(!highlightConnections)}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={3}>
                        <Form.Group className="mt-4">
                            <Form.Check
                                type="switch"
                                id="show-labels"
                                label="Show Name Labels"
                                checked={showLabels}
                                onChange={() => setShowLabels(!showLabels)}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                <div className="network-visualization-container" style={{ height: '600px', width: '100%', overflow: 'hidden' }}>
                    <svg ref={svgRef} width="100%" height="600"></svg>
                </div>

                <div className="mt-3">
                    <div className="d-flex align-items-center mb-2">
                        <Badge bg="primary" className="me-2">Legend:</Badge>
                        <div className="d-flex align-items-center me-3">
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#4a90e2', display: 'inline-block', marginRight: '5px' }}></div>
                            <span>Alumni (A)</span>
                        </div>
                        <div className="d-flex align-items-center">
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#5cb85c', display: 'inline-block', marginRight: '5px' }}></div>
                            <span>Student (S)</span>
                        </div>
                    </div>
                    <p className="text-muted small">
                        <strong>Tip:</strong> Click on any node to view actions. Drag nodes to rearrange. Hover over nodes for details.
                    </p>
                </div>
            </Card.Body>
        </Card>
    );
};

export default ConnectionVisualization;