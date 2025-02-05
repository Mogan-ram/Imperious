import React from 'react';
import { Card } from 'react-bootstrap';
import NewsEventList from '../NewsEventList/NewsEventList';

const NewsList = () => {
    return (
        <NewsEventList
            type="news"
            renderItem={(item) => (
                <Card>
                    <Card.Body>
                        <Card.Title>{item.title}</Card.Title>
                        <Card.Subtitle className="mb-2 text-muted">News</Card.Subtitle>
                        <Card.Text>{item.description}</Card.Text>
                    </Card.Body>
                </Card>
            )}
        />
    );
};

export default NewsList; 