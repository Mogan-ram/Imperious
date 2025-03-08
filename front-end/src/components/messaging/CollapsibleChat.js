// src/components/messaging/CollapsibleChat.js
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Collapse, InputGroup, Form } from 'react-bootstrap';
import { FaChevronDown, FaChevronUp, FaPaperPlane, FaExpand, FaPaperclip, FaSmile } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import messagingService from '../../services/api/messaging';
import socketService from '../../services/socketService';
import './CollapsibleChat.css';

// import './CollapsibleChat.css';

const CollapsibleChat = () => {
    const [expanded, setExpanded] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const { user } = useAuth();

    // Connect to Socket.IO when component mounts
    useEffect(() => {
        if (user?.email) {
            socketService.connect(user.email);

            // Set up event listeners
            socketService.onNewMessage(handleNewMessage);
            socketService.onMessagesRead(handleMessagesRead);

            // Cleanup when component unmounts
            return () => {
                socketService.offNewMessage();
                socketService.offMessagesRead();
            };
        }
    }, [user]);

    // Fetch conversations when user changes
    useEffect(() => {
        if (user?.email && expanded) {
            fetchConversations();
        }
    }, [user, expanded]);

    // Join active conversation when it changes
    useEffect(() => {
        if (activeConversation && user?.email) {
            // Leave previous conversation if any
            if (activeConversation) {
                socketService.leaveConversation(activeConversation._id);
            }

            // Join new conversation
            socketService.joinConversation(activeConversation._id, user.email);

            // Fetch messages
            fetchMessages(activeConversation._id);
        }

        return () => {
            if (activeConversation) {
                socketService.leaveConversation(activeConversation._id);
            }
        };
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

    const fetchMessages = async (conversationId) => {
        setLoading(true);
        try {
            const data = await messagingService.getMessages(conversationId);
            setMessages(data.messages);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNewMessage = (message) => {
        // Check if the message belongs to the active conversation
        if (activeConversation && message.conversation_id === activeConversation._id) {
            setMessages(prev => [...prev, message]);
        }

        // Update unread count in conversations
        setConversations(prevConversations => {
            return prevConversations.map(conv => {
                if (conv._id === message.conversation_id) {
                    // If this conversation is not active, increment unread count
                    const unreadCount = conv._id === activeConversation?._id ? 0 : (conv.unread_count || 0) + 1;

                    return {
                        ...conv,
                        last_message: message,
                        unread_count: unreadCount
                    };
                }
                return conv;
            });
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

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversation || !user?.email) return;

        // Send message via Socket.IO
        socketService.sendMessage(activeConversation._id, user.email, newMessage);

        // Clear input
        setNewMessage('');
    };

    return (
        <div className="collapsible-chat">
            <Button
                onClick={() => setExpanded(!expanded)}
                className="chat-toggle-btn"
                variant="primary"
            >
                <div className="d-flex justify-content-between align-items-center">
                    <span>Messaging</span>
                    {expanded ? <FaChevronDown /> : <FaChevronUp />}
                </div>
            </Button>

            <Collapse in={expanded}>
                <Card>
                    <div className="chat-header">
                        <span>
                            {activeConversation ?
                                activeConversation.other_participants?.[0]?.name || 'Chat'
                                : 'Chat'}
                        </span>
                        <div>
                            <Link to="/messages" className="icon-button" title="Open full messaging">
                                <FaExpand />
                            </Link>
                        </div>
                    </div>

                    <div className="chat-body">
                        {messages.map((message, index) => (
                            <div
                                key={message._id || index}
                                className={`message ${message.sender === user?._id ? 'message-sent' : 'message-received'}`}
                            >
                                {message.sender !== user?._id && (
                                    <img
                                        src={message.sender_details?.avatar || "https://via.placeholder.com/30"}
                                        alt="avatar"
                                        className="message-avatar"
                                    />
                                )}

                                <div className="message-bubble">
                                    <div>{message.text}</div>
                                    <div className="message-time">
                                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>

                                {message.sender === user?._id && (
                                    <img
                                        src={user.avatar || "https://via.placeholder.com/30"}
                                        alt="avatar"
                                        className="message-avatar"
                                    />
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-footer">
                        <Form onSubmit={handleSendMessage}>
                            <InputGroup>
                                <Form.Control
                                    type="text"
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    className="message-input"
                                />
                                <Button variant="primary" type="submit" className="send-button">
                                    <FaPaperPlane />
                                </Button>
                            </InputGroup>
                        </Form>
                    </div>
                </Card>
            </Collapse>
        </div>
    );
};

export default CollapsibleChat;