import { onAuthChange, getUserProfile, logoutUser } from './auth-service.js';

document.addEventListener("header:loaded", () => {
    const userInfo = document.getElementById('user-info');
    const authControls = document.getElementById('auth-controls');
    const avatar = document.getElementById('user-avatar-placeholder');
    const userNameDisplay = document.getElementById('display-user-name');
    const userRoleDisplay = document.getElementById('display-user-role');
    const profileTrigger = document.getElementById('profile-trigger');
    const dropdown = document.getElementById('user-dropdown');

    // 1. Handle Authentication State
    onAuthChange(async (user) => {
        if (user) {
            const profile = await getUserProfile(user.uid);
            const name = profile?.username || user.email.split('@')[0];
            
            // Goal D: Set Initial
            avatar.textContent = name.charAt(0);
            userNameDisplay.textContent = name;
            userRoleDisplay.textContent = profile?.role || 'Member';

            userInfo.classList.remove('hidden');
            authControls.classList.add('hidden');
        } else {
            userInfo.classList.add('hidden');
            authControls.classList.remove('hidden');
        }
    });

    // Goal C: Toggle Dropdown
    profileTrigger?.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('hidden');
    });

    // Close dropdown when clicking outside
    window.addEventListener('click', () => {
        dropdown?.classList.add('hidden');
    });

    // Logout
    document.getElementById('logout-btn-dropdown')?.addEventListener('click', () => {
        logoutUser();
    });
});