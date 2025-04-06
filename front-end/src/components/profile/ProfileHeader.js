import React from "react";
import { Badge, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEdit,
    faEnvelope,
    faUserGraduate,
    faGraduationCap,
    faChalkboardTeacher,
    faBuilding,
    faHandshake,
    faCheck,
    faClock,
    faUserCircle
} from '@fortawesome/free-solid-svg-icons';

const ProfileHeader = ({
    profileData,
    isOwnProfile,
    connectionStatus,
    userRole,
    onEditClick,
    onPhotoClick,
    onSendConnectionRequest
}) => {
    // Helper to render the appropriate connection button
    const renderConnectionButton = () => {
        // Admin only sees message button
        if (userRole === 'staff' || userRole === 'admin') {
            return (
                <Button
                    variant="outline-primary"
                    size="sm"
                    href={`/messages?to=${profileData.email}`}
                >
                    <FontAwesomeIcon icon={faEnvelope} /> Message
                </Button>
            );
        }

        // Handle different connection states
        switch (connectionStatus?.status) {
            case 'connected':
                return (
                    <>
                        <Button
                            variant="outline-primary"
                            size="sm"
                            href={`/messages?to=${profileData.email}`}
                            className="me-2"
                        >
                            <FontAwesomeIcon icon={faEnvelope} /> Message
                        </Button>
                        <Button
                            variant="success"
                            size="sm"
                            disabled
                        >
                            <FontAwesomeIcon icon={faCheck} /> Connected
                        </Button>
                    </>
                );
            case 'pending_sent':
                return (
                    <Button
                        variant="warning"
                        size="sm"
                        disabled
                    >
                        <FontAwesomeIcon icon={faClock} /> Request Sent
                    </Button>
                );
            case 'pending_received':
                return (
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onSendConnectionRequest(profileData._id, 'accept')}
                    >
                        <FontAwesomeIcon icon={faHandshake} /> Accept Request
                    </Button>
                );
            default:
                return (
                    <>
                        <Button
                            variant="primary"
                            size="sm"
                            className="me-2"
                            onClick={() => onSendConnectionRequest(profileData._id)}
                        >
                            <FontAwesomeIcon icon={faHandshake} /> Connect
                        </Button>
                        <Button
                            variant="outline-primary"
                            size="sm"
                            href={`/messages?to=${profileData.email}`}
                        >
                            <FontAwesomeIcon icon={faEnvelope} /> Message
                        </Button>
                    </>
                );
        }
    };

    // Define a default avatar based on role
    const getDefaultAvatar = () => {
        // If photo_url is defined and not empty, use it
        if (profileData.photo_url) {
            return profileData.photo_url;
        }

        // Otherwise return the default avatar image
        return "/img/default.png";
    };

    return (
        <div className="profile-header">
            <div className="profile-cover-img"></div>
            <div className="profile-user-info">
                <div className="profile-avatar-container">
                    <img
                        src={getDefaultAvatar()}
                        alt={profileData.name}
                        className="profile-avatar"
                    />
                    {isOwnProfile && (
                        <button
                            className="photo-edit-button"
                            onClick={onPhotoClick}
                            title="Change avatar"
                        >
                            <FontAwesomeIcon icon={faEdit} />
                        </button>
                    )}
                </div>
                <div className="profile-user-details">
                    <h2>{profileData.name}</h2>
                    <p className="profile-role">
                        <Badge bg="primary" className="role-badge">
                            {profileData.role === 'student' && <FontAwesomeIcon icon={faUserGraduate} />}
                            {profileData.role === 'alumni' && <FontAwesomeIcon icon={faGraduationCap} />}
                            {(profileData.role === 'staff' || profileData.role === 'admin') && <FontAwesomeIcon icon={faChalkboardTeacher} />}
                            {' ' + profileData.role.charAt(0).toUpperCase() + profileData.role.slice(1)}
                        </Badge>
                        <Badge bg="secondary" className="ms-2 dept-badge">
                            <FontAwesomeIcon icon={faBuilding} /> {profileData.dept}
                        </Badge>
                    </p>
                    <div className="mt-3">
                        {isOwnProfile ? (
                            <Button
                                variant="outline-primary"
                                size="sm"
                                className="me-2"
                                onClick={onEditClick}
                            >
                                <FontAwesomeIcon icon={faEdit} /> Edit Profile
                            </Button>
                        ) : (
                            renderConnectionButton()
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileHeader;