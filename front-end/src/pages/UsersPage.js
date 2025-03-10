import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import UserList from '../components/users/UserList';
import Header from '../components/layout/Header/Header';

const UsersPage = () => {
    return (
        <div className="app">
            <Header />
            <main>
                <Container className="py-4">
                    <Row>
                        <Col>
                            <Card className="mb-4 bg-light shadow-sm">
                                <Card.Body>
                                    <h2 className="mb-0">Connect with Others</h2>
                                    <p className="text-muted">
                                        Find and connect with other students, alumni, and staff members.
                                    </p>
                                </Card.Body>
                            </Card>

                            <UserList />
                        </Col>
                    </Row>
                </Container>
            </main>
        </div>
    );
};

export default UsersPage;