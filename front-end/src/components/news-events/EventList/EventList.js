import React from 'react';
import { Card } from 'react-bootstrap';
import NewsEventList from '../NewsEventList/NewsEventList';

const EventList = () => {
    return (
        <NewsEventList
            type="event"
            renderItem={(item) => (
                <Card>
                    <Card.Body>
                        <Card.Title>{item.title}</Card.Title>
                        <Card.Subtitle className="mb-2 text-muted">Event</Card.Subtitle>
                        <Card.Text>{item.description}</Card.Text>
                        <div className="event-details">
                            <p>Date: {new Date(item.event_date).toLocaleDateString()}</p>
                            <p>Location: {item.location}</p>
                        </div>
                    </Card.Body>
                </Card>
            )}
        />
    );
};

export default EventList;