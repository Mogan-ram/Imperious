import React, { useState, useEffect } from "react";
import axios from "axios";

const Feed = () => {
    const [feeds, setFeeds] = useState([]);
    const [newFeed, setNewFeed] = useState("");

    useEffect(() => {
        fetchFeeds();
    }, []);

    const fetchFeeds = async () => {
        try {
            const response = await axios.get("http://127.0.0.1:5000/api/feeds");
            setFeeds(response.data);
        } catch (error) {
            console.error("Error fetching feeds", error);
        }
    };

    const handlePostFeed = async () => {
        if (!newFeed.trim()) return;
        try {
            const response = await axios.post("http://127.0.0.1:5000/api/feeds", {
                content: newFeed,
            });
            setFeeds([response.data, ...feeds]);
            setNewFeed("");
        } catch (error) {
            console.error("Error posting feed", error);
        }
    };

    return (
        <div className="max-w-xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Feeds</h1>
            <div className="mb-4">
                <textarea
                    className="w-full p-2 border rounded"
                    rows="3"
                    placeholder="What's happening?"
                    value={newFeed}
                    onChange={(e) => setNewFeed(e.target.value)}
                ></textarea>
                <button
                    className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
                    onClick={handlePostFeed}
                >
                    Post
                </button>
            </div>
            <div>
                {feeds.map((feed) => (
                    <div key={feed._id} className="p-4 border rounded mb-2">
                        <p>{feed.content}</p>
                        <small className="text-gray-500">{new Date(feed.timestamp).toLocaleString()}</small>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Feed;
