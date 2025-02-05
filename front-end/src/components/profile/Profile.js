import React, { useEffect, useState } from "react";
import {
    MDBCol,
    MDBContainer,
    MDBRow,
    MDBCard,
    MDBCardText,
    MDBCardBody,
    MDBCardImage,
    MDBBtn,
    MDBTypography
} from 'mdb-react-ui-kit';
import { useAuth } from '../../../contexts/AuthContext';
import { profileService } from '../../../services/api/profile';
import './Profile.css';

const Profile = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                console.log('Fetching profile with token:', localStorage.getItem('token')); // Debug log
                const data = await profileService.getProfile();
                console.log('Profile data received:', data); // Debug log
                setProfileData(data);
            } catch (err) {
                console.error('Profile fetch error:', err);
                setError(err.response?.data?.message || 'Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;
    if (!user || !profileData) return <div>No profile data found</div>;

    // Combine user data with profile data
    const displayData = { ...user, ...profileData };

    return (
        <div className="gradient-custom-2">
            <MDBContainer className="py-5 h-100">
                <MDBRow className="justify-content-center align-items-center h-100">
                    <MDBCol lg="9" xl="7">
                        <MDBCard>
                            <div className="rounded-top text-white d-flex flex-row" style={{ backgroundColor: '#000', height: '200px' }}>
                                <div className="ms-4 mt-5 d-flex flex-column" style={{ width: '150px' }}>
                                    <MDBCardImage
                                        src={displayData.profile?.avatar || "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-profiles/avatar-1.webp"}
                                        alt="Profile"
                                        className="mt-4 mb-2 img-thumbnail"
                                        fluid
                                        style={{ width: '150px', zIndex: '1' }}
                                    />
                                    <MDBBtn outline color="dark" style={{ height: '36px', overflow: 'visible' }}>
                                        Edit profile
                                    </MDBBtn>
                                </div>
                                <div className="ms-3" style={{ marginTop: '130px' }}>
                                    <MDBTypography tag="h5">{displayData.name}</MDBTypography>
                                    <MDBCardText>{displayData.email}</MDBCardText>
                                </div>
                            </div>
                            <div className="p-4 text-black" style={{ backgroundColor: '#f8f9fa' }}>
                                <div className="d-flex justify-content-end text-center py-1">
                                    <div>
                                        <MDBCardText className="mb-1 h5">253</MDBCardText>
                                        <MDBCardText className="small text-muted mb-0">Posts</MDBCardText>
                                    </div>
                                    <div className="px-3">
                                        <MDBCardText className="mb-1 h5">1026</MDBCardText>
                                        <MDBCardText className="small text-muted mb-0">Followers</MDBCardText>
                                    </div>
                                    <div>
                                        <MDBCardText className="mb-1 h5">478</MDBCardText>
                                        <MDBCardText className="small text-muted mb-0">Following</MDBCardText>
                                    </div>
                                </div>
                            </div>
                            <MDBCardBody className="text-black p-4">
                                <div className="mb-5">
                                    <p className="lead fw-normal mb-1">About</p>
                                    <div className="p-4" style={{ backgroundColor: '#f8f9fa' }}>
                                        <MDBCardText className="font-italic mb-1">Role: {displayData.role}</MDBCardText>
                                        <MDBCardText className="font-italic mb-1">Department: {displayData.dept}</MDBCardText>
                                        {displayData.role === 'Student' && (
                                            <MDBCardText className="font-italic mb-1">Registration Number: {displayData.regno}</MDBCardText>
                                        )}
                                        {displayData.role === 'Alumni' && (
                                            <MDBCardText className="font-italic mb-0">Batch: {displayData.batch}</MDBCardText>
                                        )}
                                    </div>
                                </div>
                            </MDBCardBody>
                        </MDBCard>
                    </MDBCol>
                </MDBRow>
            </MDBContainer>
        </div>
    );
};

export default Profile; 