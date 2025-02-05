import React from 'react';
import { FaRegComment, FaRetweet, FaRegHeart, FaShare } from 'react-icons/fa';

const FeedItem = ({ feed }) => {
    return (
        <div className="p-3 border-bottom">
            <div className="d-flex gap-3">
                <div className="rounded-circle bg-secondary" style={{ width: '40px', height: '40px' }}></div>
                <div>
                    <div className="fw-bold">{feed.author.name}</div>
                    <div className="text-muted">@{feed.author.email}</div>
                    <p className="mt-2">{feed.content}</p>
                    <div className="d-flex gap-4 text-muted">
                        <button className="btn btn-sm">
                            <FaRegComment className="me-2" />
                            0
                        </button>
                        <button className="btn btn-sm">
                            <FaRetweet className="me-2" />
                            0
                        </button>
                        <button className="btn btn-sm">
                            <FaRegHeart className="me-2" />
                            0
                        </button>
                        <button className="btn btn-sm">
                            <FaShare />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeedItem; 