// src/services/avatarService.js

/**
 * Service for handling avatar selection and management
 */
const avatarService = {
    /**
     * Get the avatar URL based on the selected avatar ID
     * @param {string} avatarId - The ID of the selected avatar
     * @param {string} userRole - The user's role (student, alumni, staff, admin)
     * @param {string} userGender - The user's gender (male, female)
     * @returns {string} The URL of the avatar image
     */
    getAvatarUrl: (avatarId, userRole, userGender = 'male') => {
        // If no specific avatar is selected, return default
        if (!avatarId || avatarId === 'default') {
            return '/img/default.png';
        }

        return `/img/${avatarId}.jpg`;
    },

    /**
     * Save the user's avatar selection to localStorage
     * @param {string} email - User's email (used as key)
     * @param {string} avatarId - Selected avatar ID
     */
    saveAvatarSelection: (email, avatarId) => {
        if (email && avatarId) {
            localStorage.setItem(`avatar_${email}`, avatarId);
        }
    },

    /**
     * Get the user's saved avatar selection from localStorage
     * @param {string} email - User's email
     * @returns {string|null} The saved avatar ID or null if not found
     */
    getSavedAvatarSelection: (email) => {
        if (email) {
            return localStorage.getItem(`avatar_${email}`);
        }
        return null;
    },

    /**
     * Update the user's avatar in the profile context
     * This is a client-side only change - no server update needed
     * @param {string} avatarId - Selected avatar ID
     * @param {string} userRole - User's role
     * @param {string} userGender - User's gender
     * @param {Function} updateProfileCallback - Callback to update profile state
     */
    updateUserAvatar: (avatarId, userRole, userGender, updateProfileCallback) => {
        const avatarUrl = avatarService.getAvatarUrl(avatarId, userRole, userGender);

        // Call the callback function to update the profile with the new avatar URL
        if (typeof updateProfileCallback === 'function') {
            updateProfileCallback(avatarUrl);
        }

        return avatarUrl;
    }
};

export default avatarService;