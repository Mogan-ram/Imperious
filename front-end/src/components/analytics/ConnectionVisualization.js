// src/components/analytics/ConnectionVisualization.js
import React, { useEffect, useRef, useState } from 'react';
import { Card, Form, Row, Col } from 'react-bootstrap';
import * as d3 from 'd3';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import messagingService from '../../services/api/messaging';
import { useAuth } from '../../contexts/AuthContext';

const ConnectionVisualization = ({ alumniData, menteesData }) => {
    const svgRef = useRef(null);
    const [highlightConnections, setHighlightConnections] = useState(false);
    const [showLabels, setShowLabels] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuth();

    // Helper function to process data for visualization
    const processData = (data) => {
        // When no data is available
        if (!data) return { nodes: [], links: [] };

        const nodes = [];
        const links = [];
        const nodesMap = new Map();

        // Add mentor node if available
        if (data.mentor && data.mentor._id) {
            const mentorNode = {
                id: data.mentor._id,
                name: data.mentor.name || "Unknown",
                department: data.mentor.dept || "",
                email: data.mentor.email || "",
                type: 'alumni',
                menteeCount: data.mentees?.length || 0
            };

            nodes.push(mentorNode);
            nodesMap.set(data.mentor._id, mentorNode);
        }

        // Add mentee nodes and links
        if (data.mentees && Array.isArray(data.mentees)) {
            data.mentees.forEach(mentee => {
                if (!mentee._id) {
                    console.log("Mentee missing ID:", mentee);
                    return;
                }

                // Only add each mentee once
                if (!nodesMap.has(mentee._id)) {
                    const menteeNode = {
                        id: mentee._id,
                        name: mentee.name || "Unknown Student",
                        department: mentee.dept,
                        batch: mentee.batch,
                        email: mentee.email,
                        type: 'mentee',
                        project: mentee.project?.title || ""
                    };

                    nodes.push(menteeNode);
                    nodesMap.set(mentee._id, menteeNode);
                }

                // Create link from mentor to mentee
                if (data.mentor && data.mentor._id) {
                    links.push({
                        source: data.mentor._id,
                        target: mentee._id,
                        value: 1
                    });
                }
            });
        }

        // Handle project_groups format
        if (data.project_groups && Array.isArray(data.project_groups)) {
            data.project_groups.forEach(project => {
                if (project.students && Array.isArray(project.students)) {
                    project.students.forEach(student => {
                        // Only add student once
                        if (!student.id || nodesMap.has(student.id)) return;

                        const studentNode = {
                            id: student.id,
                            name: student.name || "Unknown Student",
                            department: student.dept,
                            batch: student.batch,
                            email: student.email,
                            type: 'mentee',
                            project: project.title || ""
                        };

                        nodes.push(studentNode);
                        nodesMap.set(student.id, studentNode);

                        // Create link from mentor to student
                        if (data.mentor && data.mentor._id) {
                            links.push({
                                source: data.mentor._id,
                                target: student.id,
                                value: 1
                            });
                        }
                    });
                }
            });
        }

        return { nodes, links };
    };

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
        if (!svgRef.current) return;

        // Clear previous visualization
        d3.select(svgRef.current).selectAll("*").remove();

        // Handle different data formats
        let processedData = { nodes: [], links: [] };

        // If we have a direct menteesData object with mentor and mentees properties
        if (menteesData && (menteesData.mentees || menteesData.project_groups)) {
            processedData = processData(menteesData);
        }
        // If we have an array of alumni data (older format)
        else if (Array.isArray(alumniData) && alumniData.length > 0) {
            // Build up nodes and links from each alumnus
            const nodes = [];
            const links = [];
            const nodesMap = new Map();

            alumniData.forEach(alumnus => {
                if (!alumnus._id && !alumnus.alumnusId) return;

                // Add alumnus node
                const alumnusId = alumnus._id || alumnus.alumnusId;
                const alumnusNode = {
                    id: alumnusId,
                    name: alumnus.name || alumnus.alumnusName || "Unknown",
                    department: alumnus.dept || alumnus.department || "",
                    email: alumnus.email || "",
                    type: 'alumni',
                    menteeCount: alumnus.mentees?.length || 0
                };

                if (!nodesMap.has(alumnusId)) {
                    nodes.push(alumnusNode);
                    nodesMap.set(alumnusId, alumnusNode);
                }

                // Add mentees and links
                const mentees = alumnus.mentees || [];
                mentees.forEach(mentee => {
                    if (!mentee._id && !mentee.id) return;

                    const menteeId = mentee._id || mentee.id;

                    // Add mentee node if not already added
                    if (!nodesMap.has(menteeId)) {
                        const menteeNode = {
                            id: menteeId,
                            name: mentee.name || "Unknown Student",
                            department: mentee.dept,
                            batch: mentee.batch,
                            email: mentee.email,
                            type: 'mentee',
                            project: mentee.project?.title || ""
                        };

                        nodes.push(menteeNode);
                        nodesMap.set(menteeId, menteeNode);
                    }

                    // Create link
                    links.push({
                        source: alumnusId,
                        target: menteeId,
                        value: 1
                    });
                });
            });

            processedData = { nodes, links };
        }

        const { nodes, links } = processedData;

        console.log(`Visualization data prepared: ${nodes.length} nodes, ${links.length} links`);

        if (nodes.length === 0) {
            d3.select(svgRef.current)
                .append("text")
                .attr("x", svgRef.current.clientWidth / 2)
                .attr("y", 300)
                .attr("text-anchor", "middle")
                .text("No mentor-mentee relationships to display")
                .style("font-size", "20px")
                .style("fill", "#666");
            return;
        }

        // Set up D3 visualization
        const width = svgRef.current.clientWidth || 800;
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
            .force("link", d3.forceLink(links).id(d => d.id).distance(150))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(d =>
                d.type === 'alumni' ? 35 : 20
            ));

        // Draw links
        const link = svg.append("g")
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke", highlightConnections ? "#4a90e2" : "#999")
            .attr("stroke-opacity", highlightConnections ? 0.8 : 0.6)
            .attr("stroke-width", d => highlightConnections ? 3 : 2);

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
            .attr("r", d => d.type === 'alumni' ? 25 : 15)
            .attr("fill", d => departmentColors(d.department))
            .attr("stroke", "#fff")
            .attr("stroke-width", 2);

        // Add text labels
        if (showLabels) {
            node.append("text")
                .attr("text-anchor", "middle")
                .attr("dy", d => d.type === 'alumni' ? -30 : -20)
                .text(d => d.name)
                .attr("font-size", d => d.type === 'alumni' ? "12px" : "10px")
                .attr("fill", "#333")
                .style("font-weight", "bold")
                .style("text-shadow", "0 0 3px white, 0 0 3px white, 0 0 3px white, 0 0 3px white");
        }

        // Add type indicator
        node.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .text(d => d.type === 'alumni' ? 'A' : 'S')
            .attr("font-size", d => d.type === 'alumni' ? "14px" : "10px")
            .attr("fill", "white")
            .style("font-weight", "bold");

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
    }, [alumniData, menteesData, highlightConnections, showLabels, navigate, user.email]);

    return (
        <Card className="mb-4">
            <Card.Body>
                <Card.Title>Alumni-Student Connection Network</Card.Title>
                <p className="text-muted">Visualization of mentoring relationships between alumni and students</p>

                <Row className="mb-3">
                    <Col md={6} className="d-flex justify-content-center">
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
                    <Col md={6} className="d-flex justify-content-center">
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
                        <div className="me-4">
                            <strong>Legend:</strong>
                        </div>
                        <div className="d-flex align-items-center me-4">
                            <div style={{ width: '25px', height: '25px', borderRadius: '50%', backgroundColor: '#4a90e2', display: 'inline-block', marginRight: '5px', textAlign: 'center', color: 'white', fontWeight: 'bold', lineHeight: '25px' }}>A</div>
                            <span>Alumni</span>
                        </div>
                        <div className="d-flex align-items-center">
                            <div style={{ width: '15px', height: '15px', borderRadius: '50%', backgroundColor: '#5cb85c', display: 'inline-block', marginRight: '5px', textAlign: 'center', color: 'white', fontWeight: 'bold', lineHeight: '15px', fontSize: '10px' }}>S</div>
                            <span>Student</span>
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