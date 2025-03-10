import React from "react";
import { Card, Row, Col, Button, Badge, ListGroup, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEnvelope,
    faCheckCircle,
    faTimesCircle,
    faBell
} from '@fortawesome/free-solid-svg-icons';

// Connection Request Item Component
const ConnectionRequestItem = ({ request, onResponseClick }) => (
    <ListGroup.Item className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
            <div className="connection-avatar me-3">
                <img
                    src={request.from_user.photo_url || "https://via.placeholder.com/50"}
                    alt={request.from_user.name}
                    className="rounded-circle"
                    width="50"
                    height="50"
                />
            </div>
            <div>
                <h6 className="mb-0">{request.from_user.name}</h6>
                <p className="mb-0 text-muted">
                    {request.from_user.role} • {request.from_user.dept}
                    {request.from_user.batch && ` • Batch ${request.from_user.batch}`}
                </p>
                <small className="text-muted">
                    Requested on {new Date(request.created_at).toLocaleDateString()}
                </small>
            </div>
        </div>
        <div>
            <Button
                variant="success"
                size="sm"
                className="me-2"
                onClick={() => onResponseClick(request._id, 'accepted')}
            >
                <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                Accept
            </Button>
            <Button
                variant="danger"
                size="sm"
                onClick={() => onResponseClick(request._id, 'rejected')}
            >
                <FontAwesomeIcon icon={faTimesCircle} className="me-1" />
                Decline
            </Button>
        </div>
    </ListGroup.Item>
);

// Connection Item Component
const ConnectionItem = ({ connection }) => (
    <Col md={6} xl={4} className="mb-3">
        <Card className="h-100 connection-card">
            <Card.Body>
                <div className="d-flex">
                    <div className="connection-avatar me-3">
                        <img
                            src={connection.user.photo_url || "https://via.placeholder.com/60"}
                            alt={connection.user.name}
                            className="rounded-circle"
                            width="60"
                            height="60"
                        />
                    </div>
                    <div>
                        <h6 className="mb-1">{connection.user.name}</h6>
                        <p className="mb-1 text-muted">
                            {connection.user.role.charAt(0).toUpperCase() + connection.user.role.slice(1)} • {connection.user.dept}
                        </p>
                        {connection.user.batch && (
                            <p className="mb-1 text-muted">Batch {connection.user.batch}</p>
                        )}
                        <small className="text-muted">
                            Connected on {new Date(connection.connected_at).toLocaleDateString()}
                        </small>
                    </div>
                </div>
            </Card.Body>
            <Card.Footer className="bg-white">
                <Button
                    variant="outline-primary"
                    size="sm"
                    className="w-100"
                    href={`/messages?to=${connection.user.email}`}
                >
                    <FontAwesomeIcon icon={faEnvelope} className="me-1" />
                    Message
                </Button>
            </Card.Footer>
        </Card>
    </Col>
);

// Main Connections Component
const ProfileConnections = ({
    userConnections,
    connectionRequests,
    isOwnProfile,
    onConnectionResponse
}) => {
    return (
        <Row>
            <Col>
                <Card className="mb-4">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Connections</h5>
                        {isOwnProfile && connectionRequests.length > 0 && (
                            <Badge bg="primary" pill>
                                <FontAwesomeIcon icon={faBell} className="me-1" />
                                {connectionRequests.length} Pending
                            </Badge>
                        )}
                    </Card.Header>
                    <Card.Body>
                        {isOwnProfile && connectionRequests.length > 0 && (
                            <div className="mb-4">
                                <h6 className="mb-3">Pending Connection Requests</h6>
                                <ListGroup className="mb-4">
                                    {connectionRequests.map((request, index) => (
                                        <ConnectionRequestItem
                                            key={index}
                                            request={request}
                                            onResponseClick={onConnectionResponse}
                                        />
                                    ))}
                                </ListGroup>
                            </div>
                        )}

                        <h6 className="mb-3">{isOwnProfile ? 'My Connections' : 'Connections'}</h6>
                        {userConnections.length > 0 ? (
                            <Row>
                                {userConnections.map((connection, index) => (
                                    <ConnectionItem key={index} connection={connection} />
                                ))}
                            </Row>
                        ) : (
                            <Alert variant="info">
                                {isOwnProfile
                                    ? "You don't have any connections yet. Connect with other users to build your network."
                                    : "This user doesn't have any public connections yet."}
                            </Alert>
                        )}
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    );
};

export default ProfileConnections;