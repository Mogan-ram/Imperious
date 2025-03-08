// src/components/messaging/MessagingPage.js
import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, InputGroup, Form, Button, Badge, Modal, Spinner } from 'react-bootstrap';
import { FaSearch, FaPaperPlane, FaPlus, FaPaperclip, FaSmile } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import messagingService from '../../services/api/messaging';
import socketService from '../../services/socketService';
import './MessagingPage.css';

const MessagingPage = () => {
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [showNewConversationModal, setShowNewConversationModal] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [userStatuses, setUserStatuses] = useState({});

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const { user } = useAuth();

    // Connect to Socket.IO when component mounts
    useEffect(() => {
        if (user?.email) {
            socketService.connect(user.email);

            // Set up event listeners
            socketService.onNewMessage(handleNewMessage);
            socketService.onMessagesRead(handleMessagesRead);
            socketService.onUserStatus(handleUserStatus);

            // Fetch conversations
            fetchConversations();

            // Cleanup when component unmounts
            return () => {
                socketService.offNewMessage();
                socketService.offMessagesRead();
                socketService.offUserStatus();

                if (activeConversation) {
                    socketService.leaveConversation(activeConversation._id);
                }
            };
        }
    }, [user]);

    // Join active conversation when it changes
    useEffect(() => {
        if (activeConversation && user?.email) {
            // Reset messages and pagination
            setMessages([]);
            setPage(1);
            setHasMore(true);

            // Leave previous conversation if any
            socketService.leaveConversation(activeConversation._id);

            // Join new conversation
            socketService.joinConversation(activeConversation._id, user.email);

            // Fetch messages
            fetchMessages(activeConversation._id, 1);

            // Mark conversation as read in UI
            setConversations(prevConversations => {
                return prevConversations.map(conv => {
                    if (conv._id === activeConversation._id) {
                        return { ...conv, unread_count: 0 };
                    }
                    return conv;
                });
            });
        }
    }, [activeConversation, user]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchConversations = async () => {
        setLoading(true);
        try {
            const data = await messagingService.getConversations();
            setConversations(data);

            // Set first conversation as active if no active conversation
            if (data.length > 0 && !activeConversation) {
                setActiveConversation(data[0]);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (conversationId, pageNum = page) => {
        setLoading(true);
        try {
            const data = await messagingService.getMessages(conversationId, pageNum);

            if (pageNum === 1) {
                // Replace all messages for first page
                setMessages(data.messages);
            } else {
                // Prepend new messages for pagination
                setMessages(prev => [...data.messages, ...prev]);
            }

            // Update pagination state
            setHasMore(pageNum < data.pages);
            setPage(pageNum);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleScroll = () => {
        const container = messagesContainerRef.current;
        if (container && container.scrollTop === 0 && hasMore && !loading) {
            // User has scrolled to the top, load more messages
            fetchMessages(activeConversation._id, page + 1);
        }
    };

    // In MessagingPage.js - handleNewMessage function
    const handleNewMessage = (message) => {
        console.log("Processing new message:", message);
        console.log("Active conversation:", activeConversation?._id);
        console.log("Current user:", user);

        // Check if the message belongs to the active conversation
        if (activeConversation && message.conversation_id === activeConversation._id) {
            console.log("Adding message to current conversation");

            // Remove any temporary messages and add the real message
            setMessages(prev => {
                // Filter out any temporary messages that match this one
                const filtered = prev.filter(m =>
                    !(m.is_temp && m.text === message.text &&
                        m.sender_details?.email === message.sender_details?.email)
                );
                return [...filtered, message];
            });
        } else {
            console.log("Message not added to current view - conversation mismatch");
        }


        // Update conversations list
        setConversations(prevConversations => {
            const updated = [...prevConversations];
            const index = updated.findIndex(conv => conv._id === message.conversation_id);

            if (index !== -1) {
                // Compare by email or ID string instead of direct ID comparison
                const isCurrentUser = message.sender_details?.email === user?.email;

                updated[index] = {
                    ...updated[index],
                    last_message: message,
                    unread_count: isCurrentUser || (activeConversation && activeConversation._id === message.conversation_id)
                        ? 0
                        : (updated[index].unread_count || 0) + 1
                };

                // Move this conversation to the top
                const conversation = updated.splice(index, 1)[0];
                updated.unshift(conversation);
            }

            return updated;
        });
    };

    const handleMessagesRead = (data) => {
        // Update messages to show as read
        if (activeConversation && data.conversation_id === activeConversation._id) {
            setMessages(prev =>
                prev.map(msg => ({
                    ...msg,
                    read_by: [...(msg.read_by || []), data.user_id]
                }))
            );
        }
    };

    const handleUserStatus = (data) => {
        setUserStatuses(prev => ({
            ...prev,
            [data.email]: data.status
        }));
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversation || !user?.email) return;

        const tempMessage = socketService.sendMessage(activeConversation._id, user.email, newMessage);

        // Immediately add the temporary message to the UI
        if (tempMessage) {
            setMessages(prev => [...prev, tempMessage]);
        }

        // Clear input
        setNewMessage('');
    };

    const handleSearchUsers = async () => {
        if (!userSearchQuery.trim()) return;

        setSearching(true);
        try {
            const results = await messagingService.searchUsers(userSearchQuery);
            setSearchResults(results);
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setSearching(false);
        }
    };

    const handleStartConversation = async (selectedUser) => {
        try {
            // Create a new conversation
            const newConversation = await messagingService.createConversation([selectedUser.email]);

            // Add to conversations list
            setConversations(prev => [newConversation, ...prev]);

            // Set as active conversation
            setActiveConversation(newConversation);

            // Close modal
            setShowNewConversationModal(false);
            setUserSearchQuery('');
            setSearchResults([]);
        } catch (error) {
            console.error('Error starting conversation:', error);
        }
    };

    const filteredConversations = conversations.filter(conv => {
        const otherParticipant = conv.other_participants?.[0];
        if (!otherParticipant) return false;

        const nameMatches = otherParticipant.name.toLowerCase().includes(searchQuery.toLowerCase());
        const emailMatches = otherParticipant.email.toLowerCase().includes(searchQuery.toLowerCase());

        return nameMatches || emailMatches;
    });

    return (
        <Container fluid className="messaging-container py-3">
            <Row className="h-100">
                <Col md={4} className="conversation-list-container">
                    <div className="d-flex justify-content-between align-items-center mb-3 px-3">
                        <h5 className="mb-0">Messages</h5>
                        <Button
                            variant="primary"
                            className="new-conversation-btn"
                            onClick={() => setShowNewConversationModal(true)}
                        >
                            <FaPlus />
                        </Button>
                    </div>

                    <InputGroup className="mb-3 px-3">
                        <Form.Control
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                        <Button variant="outline-secondary">
                            <FaSearch />
                        </Button>
                    </InputGroup>

                    <div className="conversation-list">
                        {filteredConversations.map(conversation => {
                            const otherParticipant = conversation.other_participants?.[0];
                            if (!otherParticipant) return null;

                            const isActive = activeConversation?._id === conversation._id;
                            const lastMessage = conversation.last_message;
                            const unreadCount = conversation.unread_count || 0;
                            const status = userStatuses[otherParticipant.email] || 'offline';

                            return (
                                <div
                                    key={conversation._id}
                                    className={`conversation-item ${isActive ? 'active' : ''}`}
                                    onClick={() => setActiveConversation(conversation)}
                                >
                                    <div className="position-relative">
                                        <img
                                            src={otherParticipant.avatar || "https://via.placeholder.com/50"}
                                            alt={otherParticipant.name}
                                            className="conversation-avatar"
                                        />
                                        <div className={`user-status status-${status}`}></div>
                                    </div>

                                    <div className="conversation-info">
                                        <div className="conversation-name">{otherParticipant.name}</div>
                                        <div className="conversation-preview">
                                            {lastMessage ? lastMessage.text : 'Start a conversation'}
                                        </div>
                                    </div>

                                    <div className="conversation-meta">
                                        <div className="conversation-time">
                                            {lastMessage ?
                                                new Date(lastMessage.created_at).toLocaleDateString() : ''}
                                        </div>
                                        {unreadCount > 0 && (
                                            <Badge bg="danger" pill className="unread-badge">
                                                {unreadCount}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {filteredConversations.length === 0 && (
                            <div className="text-center py-4 text-muted">
                                {searchQuery ? 'No conversations found' : 'No conversations yet'}
                            </div>
                        )}
                    </div>
                </Col>

                <Col md={8} className="messages-container">
                    {activeConversation ? (
                        <>
                            <div className="messages-header">
                                <img
                                    src={activeConversation.other_participants?.[0]?.avatar || "https://via.placeholder.com/40"}
                                    alt={activeConversation.other_participants?.[0]?.name}
                                    className="conversation-avatar"
                                    style={{ width: 40, height: 40 }}
                                />
                                <div className="ms-3">
                                    <h5 className="mb-0">{activeConversation.other_participants?.[0]?.name}</h5>
                                    <div className="text-muted small">
                                        {userStatuses[activeConversation.other_participants?.[0]?.email] === 'online' ?
                                            'Online' : 'Offline'}
                                    </div>
                                </div>
                            </div>

                            <div
                                className="messages-body"
                                ref={messagesContainerRef}
                                onScroll={handleScroll}
                            >
                                {loading && page > 1 && (
                                    <div className="text-center py-2">
                                        <Spinner animation="border" size="sm" />
                                    </div>
                                )}

                                {messages.map((message, index) => {
                                    // Check if it's a temporary message or a real message
                                    const isTemp = message.is_temp === true;

                                    // Check multiple ways to determine if current user is sender
                                    const isCurrentUser = isTemp ||
                                        message.sender === user?._id ||
                                        message.sender_details?.email === user?.email;

                                    return (
                                        <div
                                            key={message._id || index}
                                            className={`message ${isCurrentUser ? 'message-sent' : 'message-received'}`}
                                        >
                                            {!isCurrentUser && (
                                                <img
                                                    src={message.sender_details?.avatar || "https://via.placeholder.com/36"}
                                                    alt="avatar"
                                                    className="message-avatar"
                                                />
                                            )}

                                            <div className="message-bubble">
                                                <div>{message.text}</div>
                                                <div className="message-time">
                                                    {isTemp ? 'Sending...' : new Date(message.created_at).toLocaleString()}
                                                </div>
                                                {isCurrentUser && !isTemp && (
                                                    <div className="message-read-status">
                                                        {message.read_by?.includes(activeConversation.other_participants?.[0]?._id) ?
                                                            'Read' : 'Delivered'}
                                                    </div>
                                                )}
                                            </div>

                                            {isCurrentUser && (
                                                <img
                                                    src={user.avatar || "https://via.placeholder.com/36"}
                                                    alt="avatar"
                                                    className="message-avatar"
                                                />
                                            )}
                                        </div>
                                    );
                                })}

                                <div ref={messagesEndRef} />
                            </div>

                            <div className="messages-footer">
                                <Form onSubmit={handleSendMessage}>
                                    <InputGroup>
                                        <Button variant="outline-secondary" className="icon-button">
                                            <FaPaperclip />
                                        </Button>
                                        <Form.Control
                                            type="text"
                                            placeholder="Type a message..."
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            className="message-input"
                                        />
                                        <Button variant="outline-secondary" className="icon-button">
                                            <FaSmile />
                                        </Button>
                                        <Button variant="primary" type="submit">
                                            <FaPaperPlane />
                                        </Button>
                                    </InputGroup>
                                </Form>
                            </div>
                        </>
                    ) : (
                        <div className="no-messages">
                            <div className="text-center">
                                <p>Select a conversation to start messaging</p>
                                <Button
                                    variant="primary"
                                    onClick={() => setShowNewConversationModal(true)}
                                >
                                    Start a new conversation
                                </Button>
                            </div>
                        </div>
                    )}
                </Col>
            </Row>

            {/* New Conversation Modal */}
            <Modal
                show={showNewConversationModal}
                onHide={() => setShowNewConversationModal(false)}
            >
                <Modal.Header closeButton>
                    <Modal.Title>New Conversation</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <InputGroup className="mb-3">
                        <Form.Control
                            placeholder="Search for users..."
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearchUsers()}
                        />
                        <Button
                            variant="outline-secondary"
                            onClick={handleSearchUsers}
                            disabled={searching}
                        >
                            {searching ? <Spinner animation="border" size="sm" /> : <FaSearch />}
                        </Button>
                    </InputGroup>

                    <div className="user-search-results">
                        {searchResults.length > 0 ? (
                            searchResults.map(searchUser => (
                                <div
                                    key={searchUser._id}
                                    className="user-search-item"
                                    onClick={() => handleStartConversation(searchUser)}
                                >
                                    <img
                                        src={searchUser.avatar || "https://via.placeholder.com/40"}
                                        alt={searchUser.name}
                                        className="user-search-avatar"
                                    />
                                    <div className="user-search-info">
                                        <div className="user-search-name">{searchUser.name}</div>
                                        <div className="user-search-details">
                                            {searchUser.email} · {searchUser.role} · {searchUser.dept}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-3 text-muted">
                                {userSearchQuery ?
                                    (searching ? 'Searching...' : 'No users found') :
                                    'Type to search for users'}
                            </div>
                        )}
                    </div>
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default MessagingPage;