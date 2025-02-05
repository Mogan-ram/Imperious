import React, { useState, useEffect } from 'react';
import { Card, Pagination } from 'react-bootstrap';
import { newsEventsService } from '../../../services/api/news-events';

const NewsEventList = ({ type, renderItem }) => {
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const response = await newsEventsService.getAll(page, type);
            setItems(response.data.items);
            setTotalPages(response.data.pages);
        } catch (error) {
            console.error('Error fetching news/events:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [page, type]);

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    if (loading) {
        return <div className="text-center p-5">Loading...</div>;
    }

    return (
        <div className="container py-4">
            {items.length === 0 ? (
                <div className="text-center">No items found</div>
            ) : (
                <>
                    <div className="row g-4">
                        {items.map((item) => (
                            <div key={item._id} className="col-12">
                                {renderItem(item)}
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="d-flex justify-content-center mt-4">
                            <Pagination>
                                {[...Array(totalPages)].map((_, idx) => (
                                    <Pagination.Item
                                        key={idx + 1}
                                        active={idx + 1 === page}
                                        onClick={() => handlePageChange(idx + 1)}
                                    >
                                        {idx + 1}
                                    </Pagination.Item>
                                ))}
                            </Pagination>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default NewsEventList;