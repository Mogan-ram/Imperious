import React, { useEffect, useState, useCallback } from "react";
import {
    MDBCol,
    MDBContainer,
    MDBRow,
    MDBCard,
    MDBCardText,
    MDBCardBody,
    MDBCardImage,
    MDBBtn,
    MDBTypography,
    MDBModal,
    MDBModalDialog,
    MDBModalContent,
    MDBModalHeader,
    MDBModalTitle,
    MDBModalBody,
    MDBInput
} from 'mdb-react-ui-kit';
import { useAuth } from '../../contexts/AuthContext';
import { profileService } from '../../services/api/profile';
import './Profile.css';

const Profile = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const { user } = useAuth();
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        name: user?.name || '',
        dept: user?.dept || '',
        regno: user?.regno || '',
        batch: user?.batch || ''
    });
    const [connections, setConnections] = useState({
        students: 0,
        alumni: 0
    });

    const fetchConnections = useCallback(async () => {
        try {
            const response = await profileService.getConnections(user._id);
            setConnections(response.data);
        } catch (error) {
            console.error('Error fetching connections:', error);
        }
    }, [user]);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const data = await profileService.getProfile();
                setProfileData(data);
                fetchConnections();
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user, fetchConnections]);

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await profileService.updateProfile(editForm);
            setShowEditModal(false);
            // Refresh profile data
            const updatedData = await profileService.getProfile();
            setProfileData(updatedData);
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    const renderConnectionStats = () => {
        const role = user?.role?.toLowerCase();

        if (role === 'student') {
            return (
                <MDBRow className="g-2">
                    <MDBCol md="6">
                        <MDBCard className="text-center">
                            <MDBCardBody>
                                <MDBCardText className="mb-1 h5">{connections.students}</MDBCardText>
                                <MDBCardText className="small text-muted mb-0">Student Connections</MDBCardText>
                            </MDBCardBody>
                        </MDBCard>
                    </MDBCol>
                    <MDBCol md="6">
                        <MDBCard className="text-center">
                            <MDBCardBody>
                                <MDBCardText className="mb-1 h5">{connections.alumni}</MDBCardText>
                                <MDBCardText className="small text-muted mb-0">Alumni Connections</MDBCardText>
                            </MDBCardBody>
                        </MDBCard>
                    </MDBCol>
                </MDBRow>
            );
        }

        if (role === 'alumni') {
            return (
                <MDBRow className="g-2">
                    <MDBCol md="6">
                        <MDBCard className="text-center">
                            <MDBCardBody>
                                <MDBCardText className="mb-1 h5">{connections.total}</MDBCardText>
                                <MDBCardText className="small text-muted mb-0">Connections</MDBCardText>
                            </MDBCardBody>
                        </MDBCard>
                    </MDBCol>
                    <MDBCol md="6">
                        <MDBCard className="text-center">
                            <MDBCardBody>
                                <MDBCardText className="mb-1 h5">{connections.students}</MDBCardText>
                                <MDBCardText className="small text-muted mb-0">Student Connections</MDBCardText>
                            </MDBCardBody>
                        </MDBCard>
                    </MDBCol>
                </MDBRow>
            );
        }

        if (role === 'staff') {
            return (
                <MDBRow className="g-2">
                    <MDBCol md="6">
                        <MDBCard className="text-center">
                            <MDBCardBody>
                                <MDBCardText className="mb-1 h5">{connections.departmentStudents}</MDBCardText>
                                <MDBCardText className="small text-muted mb-0">Students</MDBCardText>
                            </MDBCardBody>
                        </MDBCard>
                    </MDBCol>
                    <MDBCol md="6">
                        <MDBCard className="text-center">
                            <MDBCardBody>
                                <MDBCardText className="mb-1 h5">{connections.departmentAlumni}</MDBCardText>
                                <MDBCardText className="small text-muted mb-0">Alumni</MDBCardText>
                            </MDBCardBody>
                        </MDBCard>
                    </MDBCol>
                </MDBRow>
            );
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;
    if (!user || !profileData) return <div>No profile data found</div>;

    const displayData = { ...user, ...profileData };

    return (
        <div className="gradient-custom-2" style={{ backgroundColor: '#9de2ff' }}>
            <MDBContainer className="py-5 h-100">
                <MDBRow className="justify-content-center align-items-center h-100">
                    <MDBCol lg="9" xl="7">
                        <MDBCard>
                            <div className="rounded-top text-white d-flex flex-row" style={{ backgroundColor: '#000', height: '200px' }}>
                                <div className="ms-4 mt-5 d-flex flex-column" style={{ width: '150px' }}>
                                    <MDBCardImage src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-profiles/avatar-1.webp"
                                        alt="Generic placeholder image" className="mt-4 mb-2 img-thumbnail" fluid style={{ width: '150px', zIndex: '1' }} />
                                    <MDBBtn outline color="dark" style={{ height: '36px', overflow: 'visible' }} onClick={() => setShowEditModal(true)}>
                                        Edit profile
                                    </MDBBtn>
                                </div>
                                <div className="ms-3" style={{ marginTop: '130px' }}>
                                    <MDBTypography tag="h5">{displayData.name}</MDBTypography>
                                    <MDBCardText>{displayData.role}</MDBCardText>
                                </div>
                            </div>
                            <div className="p-4 text-black" style={{ backgroundColor: '#f8f9fa' }}>
                                <div className="d-flex justify-content-end text-center py-1">
                                    {renderConnectionStats()}
                                </div>
                            </div>
                            <MDBCardBody className="text-black p-4">
                                <div className="mb-5">
                                    <p className="lead fw-normal mb-1">About</p>
                                    <div className="p-4" style={{ backgroundColor: '#f8f9fa' }}>
                                        <MDBCardText className="font-italic mb-1">Department: {displayData.dept}</MDBCardText>
                                        <MDBCardText className="font-italic mb-1">Register Number: {displayData.regno}</MDBCardText>
                                        <MDBCardText className="font-italic mb-0">Batch: {displayData.batch}</MDBCardText>
                                    </div>
                                </div>
                            </MDBCardBody>
                        </MDBCard>
                    </MDBCol>
                </MDBRow>
            </MDBContainer>

            {/* Edit Profile Modal */}
            <MDBModal show={showEditModal} setShow={setShowEditModal} tabIndex='-1'>
                <MDBModalDialog>
                    <MDBModalContent>
                        <MDBModalHeader>
                            <MDBModalTitle>Edit Profile</MDBModalTitle>
                            <MDBBtn className='btn-close' color='none' onClick={() => setShowEditModal(false)}></MDBBtn>
                        </MDBModalHeader>
                        <MDBModalBody>
                            <form onSubmit={handleEditSubmit}>
                                <div className="mb-3">
                                    <MDBInput
                                        label='Name'
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    />
                                </div>
                                <div className="mb-3">
                                    <MDBInput
                                        label='Department'
                                        value={editForm.dept}
                                        onChange={(e) => setEditForm({ ...editForm, dept: e.target.value })}
                                    />
                                </div>
                                <div className="mb-3">
                                    <MDBInput
                                        label='Register Number'
                                        value={editForm.regno}
                                        onChange={(e) => setEditForm({ ...editForm, regno: e.target.value })}
                                    />
                                </div>
                                <div className="mb-3">
                                    <MDBInput
                                        label='Batch'
                                        value={editForm.batch}
                                        onChange={(e) => setEditForm({ ...editForm, batch: e.target.value })}
                                    />
                                </div>
                                <div className="d-flex justify-content-end">
                                    <MDBBtn color='secondary' className='mx-2' onClick={() => setShowEditModal(false)}>
                                        Cancel
                                    </MDBBtn>
                                    <MDBBtn type='submit'>Save changes</MDBBtn>
                                </div>
                            </form>
                        </MDBModalBody>
                    </MDBModalContent>
                </MDBModalDialog>
            </MDBModal>
        </div>
    );
};

export default Profile;

