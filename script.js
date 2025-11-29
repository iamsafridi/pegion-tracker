// Race and entry data structure
let races = [];
let currentRaceId = null;
let editingId = null;
let editingRaceId = null;

// Firebase integration flags
let isFirebaseEnabled = false;
let racesListener = null;

// Authentication
let isAuthenticated = false;
let currentUser = null;

// Simple password-based authentication
const authorizedUsers = {
    'abdussamad332211@gmail.com': {
        password: 'samad415189',
        name: 'Abdus Samad',
        role: 'admin'
    },
    'selimreza9t3@gmail.com': {
        password: 'samad415189',
        name: 'Selim Reza',
        role: 'admin'
    }
};

// Pagination variables
let currentPage = 1;
let entriesPerPage = 10;
let totalPages = 1;
let filteredEntries = [];
let loftColors = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

async function initializeApp() {
    console.log('🚀 Initializing Pigeon Racing Tracker...');

    setupEventListeners();

    // Check for stored authentication
    checkStoredAuth();

    // Ensure UI permissions are set correctly on load
    updateUIPermissions();

    try {
        // Try to initialize Firebase
        console.log('🔥 Attempting Firebase initialization...');
        await initializeFirebase();
        console.log('✅ Firebase initialization successful');
    } catch (error) {
        console.warn('❌ Firebase initialization failed, using local storage:', error);
        // Fallback to local storage
        loadFromLocalStorage();
        populateRaceSelector();
        if (races.length > 0) {
            currentRaceId = races[0].id;
            document.getElementById('raceSelect').value = currentRaceId;
            switchRace();
        }
        console.log('📱 Local storage fallback activated');
    }

    console.log('🏁 App initialization complete. Races loaded:', races.length);

    // Auto-recovery check
    checkAndRecoverData();
}

async function initializeFirebase() {
    if (!window.firebaseService) {
        throw new Error('Firebase service not available');
    }

    try {
        // Test Firebase connection by trying to get races
        console.log('📡 Fetching races from Firebase...');
        races = await window.firebaseService.getAllRaces();
        console.log('📊 Races fetched from Firebase:', races.length);

        // Log race details for debugging
        races.forEach((race, index) => {
            console.log(`  Race ${index + 1}: ${race.name} (${race.entries ? race.entries.length : 0} entries)`);
        });

        isFirebaseEnabled = true;

        // Set up real-time listener
        racesListener = window.firebaseService.onRacesSnapshot((updatedRaces) => {
            races = updatedRaces;
            populateRaceSelector();

            // Update current race if it's still selected
            if (currentRaceId) {
                const currentRace = races.find(r => r.id === currentRaceId);
                if (currentRace) {
                    // Update the dropdown selection
                    document.getElementById('raceSelect').value = currentRaceId;
                    switchRace();
                } else {
                    // Current race was deleted, select first available
                    if (races.length > 0) {
                        currentRaceId = races[0].id;
                        document.getElementById('raceSelect').value = currentRaceId;
                        switchRace();
                    } else {
                        currentRaceId = null;
                        switchRace();
                    }
                }
            } else if (races.length > 0 && !currentRaceId) {
                // No race selected but races available, select the first one
                currentRaceId = races[0].id;
                document.getElementById('raceSelect').value = currentRaceId;
                switchRace();
            }
        });

        populateRaceSelector();
        if (races.length > 0) {
            currentRaceId = races[0].id;
            document.getElementById('raceSelect').value = currentRaceId;
            switchRace();
            console.log('🎯 Auto-selected race:', races[0].name);
        } else {
            console.log('⚠️ No races found in Firebase');
        }

        console.log('Firebase initialized successfully');
        showNotification('Connected to Firebase database', 'success');

    } catch (error) {
        console.error('Firebase connection failed:', error);
        isFirebaseEnabled = false;
        throw error;
    }
}

// Authentication functions
function signInWithPassword() {
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    const authStatus = document.getElementById('authStatus');
    const loginBtn = document.getElementById('loginBtn');

    // Clear previous status
    authStatus.textContent = '';
    authStatus.className = 'auth-status';

    // Validate inputs
    if (!email || !password) {
        authStatus.textContent = 'Please enter both email and password';
        authStatus.className = 'auth-status error';
        return;
    }

    // Show loading state
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';

    // Simulate a small delay for better UX
    setTimeout(() => {
        // Check credentials
        if (authorizedUsers[email] && authorizedUsers[email].password === password) {
            // Successful login
            isAuthenticated = true;
            currentUser = {
                email: email,
                name: authorizedUsers[email].name,
                role: authorizedUsers[email].role
            };

            // Store session (simple localStorage for this demo)
            localStorage.setItem('pigeonTrackerAuth', JSON.stringify({
                email: email,
                name: authorizedUsers[email].name,
                loginTime: Date.now()
            }));

            authStatus.textContent = 'Sign in successful!';
            authStatus.className = 'auth-status success';

            // Update UI
            updateAuthUI();
            updateUIPermissions();

        } else {
            // Failed login
            authStatus.textContent = 'Invalid email or password';
            authStatus.className = 'auth-status error';

            // Reset button
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
        }
    }, 500);
}

function signOut() {
    // Clear authentication state
    isAuthenticated = false;
    currentUser = null;

    // Clear stored session
    localStorage.removeItem('pigeonTrackerAuth');

    // Update UI
    updateAuthUI();
    updateUIPermissions();

    // Clear form
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';

    showNotification('Signed out successfully', 'success');
}

function updateAuthUI() {
    const signInSection = document.getElementById('signInSection');
    const signedInSection = document.getElementById('signedInSection');
    const authStatus = document.getElementById('authStatus');
    const authStatusSignedIn = document.getElementById('authStatusSignedIn');
    const loginBtn = document.getElementById('loginBtn');

    if (isAuthenticated && currentUser) {
        // Show signed-in state
        signInSection.style.display = 'none';
        signedInSection.style.display = 'flex';

        // Update user info
        document.getElementById('userName').textContent = currentUser.name;
        document.getElementById('userEmail').textContent = currentUser.email;

        authStatusSignedIn.textContent = 'Authenticated - You can edit races';
        authStatusSignedIn.className = 'auth-status success';

    } else {
        // Show sign-in state
        signInSection.style.display = 'flex';
        signedInSection.style.display = 'none';

        // Reset login button
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';

        authStatus.textContent = '';
        authStatus.className = 'auth-status';
    }
}

function checkStoredAuth() {
    const stored = localStorage.getItem('pigeonTrackerAuth');
    if (stored) {
        try {
            const authData = JSON.parse(stored);
            const loginTime = authData.loginTime;
            const now = Date.now();

            // Check if session is less than 24 hours old
            if (now - loginTime < 24 * 60 * 60 * 1000) {
                // Restore session
                if (authorizedUsers[authData.email]) {
                    isAuthenticated = true;
                    currentUser = {
                        email: authData.email,
                        name: authData.name,
                        role: authorizedUsers[authData.email].role
                    };

                    updateAuthUI();
                    updateUIPermissions();
                    return true;
                }
            } else {
                // Session expired
                localStorage.removeItem('pigeonTrackerAuth');
            }
        } catch (error) {
            console.error('Error parsing stored auth:', error);
            localStorage.removeItem('pigeonTrackerAuth');
        }
    }
    return false;
}

function updateUIPermissions() {
    const editButtons = document.querySelectorAll('#editRaceBtn, #copyRaceBtn, #addEntryBtn');
    const raceBtn = document.querySelector('.race-btn');
    const actionsHeader = document.querySelector('.actions-header');
    
    // Delete button is always hidden - only admin can delete from database
    const deleteBtn = document.getElementById('deleteRaceBtn');
    if (deleteBtn) deleteBtn.style.display = 'none';

    console.log('Updating UI permissions. isAuthenticated:', isAuthenticated);

    if (isAuthenticated) {
        editButtons.forEach(btn => btn.style.display = 'inline-block');
        if (raceBtn) raceBtn.style.display = 'inline-block';
        if (actionsHeader) actionsHeader.style.display = 'table-cell';
    } else {
        editButtons.forEach(btn => btn.style.display = 'none');
        if (raceBtn) raceBtn.style.display = 'none';
        if (actionsHeader) actionsHeader.style.display = 'none';
    }

    // Re-render the table to update action column visibility
    if (currentRaceId) {
        renderTable(getPaginatedEntries());
    }
}

function setupEventListeners() {
    // Search functionality
    document.getElementById('searchInput').addEventListener('input', filterTable);

    // Filter functionality
    document.getElementById('cultureFilter').addEventListener('change', filterTable);
    document.getElementById('clubFilter').addEventListener('change', filterTable);

    // Form submissions
    document.getElementById('entryForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('raceForm').addEventListener('submit', handleRaceFormSubmit);
    document.getElementById('copyRaceForm').addEventListener('submit', handleCopyRaceFormSubmit);

    // No additional initialization needed for HTML5 time input

    // Modal close on outside click
    document.getElementById('entryModal').addEventListener('click', function (e) {
        if (e.target === this) {
            closeModal();
        }
    });

    document.getElementById('raceModal').addEventListener('click', function (e) {
        if (e.target === this) {
            closeRaceModal();
        }
    });

    document.getElementById('copyRaceModal').addEventListener('click', function (e) {
        if (e.target === this) {
            closeCopyRaceModal();
        }
    });

    // Add Enter key support for login form
    document.getElementById('loginEmail').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            document.getElementById('loginPassword').focus();
        }
    });

    document.getElementById('loginPassword').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            signInWithPassword();
        }
    });
}

// HTML5 time input with seconds support handles everything automatically

function getCurrentRace() {
    return races.find(race => race.id === currentRaceId);
}

function getCurrentRaceEntries() {
    const race = getCurrentRace();
    return race ? race.entries : [];
}

function loadData() {
    const entries = getCurrentRaceEntries();
    filteredEntries = entries;
    assignLoftColors(entries);
    updatePagination();
    renderTable(getPaginatedEntries());
}

function assignLoftColors(entries) {
    const uniqueLofts = [...new Set(entries.map(entry => entry.loftName))];
    loftColors = {};

    uniqueLofts.forEach((loftName, index) => {
        loftColors[loftName] = `loft-color-${(index % 10) + 1}`;
    });
}

function getPaginatedEntries() {
    if (entriesPerPage === 'all') {
        return filteredEntries;
    }

    const startIndex = (currentPage - 1) * entriesPerPage;
    const endIndex = startIndex + entriesPerPage;
    return filteredEntries.slice(startIndex, endIndex);
}

function renderTable(data) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    const race = getCurrentRace();

    data.forEach(entry => {
        const row = document.createElement('tr');
        const entryDistance = entry.distance || (race ? race.distance : 'N/A');
        const loftColorClass = loftColors[entry.loftName] || 'loft-color-1';

        // Determine return status display
        const returnStatus = entry.returnStatus || 'registered';
        let statusBadge = '';
        let rowStyle = '';
        
        if (returnStatus === 'returned') {
            statusBadge = '<span style="color: #48bb78; font-weight: bold;">✓ Returned</span>';
        } else if (returnStatus === 'not_returned') {
            statusBadge = '<span style="color: #f56565; font-weight: bold;">✗ Missing</span>';
            rowStyle = 'background-color: #fff5f5;'; // Light red background for missing pigeons
        } else {
            statusBadge = '<span style="color: #a0aec0; font-style: italic;">Registered</span>';
        }

        // Build the row HTML conditionally based on authentication
        let rowHTML = `
            <td class="position-cell" style="background: #4a5568; color: white; text-align: center; font-weight: bold;">${entry.position}</td>
            <td style="text-align: center; font-weight: bold; color: #667eea;">${entry.position}</td>
            <td style="text-align: left; padding-left: 12px;">
                <span class="loft-name ${loftColorClass}">${entry.loftName}</span>
            </td>
            <td style="text-align: center;"><strong>${entry.ringNumber}</strong></td>
            <td style="text-align: center;"><span class="culture-badge culture-${entry.culture}">${entry.culture}</span></td>
            <td style="text-align: center;">${entryDistance}</td>
            <td style="text-align: center;">${race ? race.releaseTime : 'N/A'}</td>
            <td style="text-align: center;">
                ${entry.trappingTime || '<span style="color: #a0aec0; font-style: italic;">--:--:--</span>'}
                <br><small>${statusBadge}</small>
            </td>
            <td style="text-align: center;"><strong>${entry.totalTime || '--:--:--'}</strong></td>
            <td style="text-align: center;">${entry.second || 0}</td>
            <td style="text-align: center;">${entry.minute || 0}</td>
            <td style="text-align: center;">${entry.velocity ? entry.velocity.toFixed(4) : '<span style="color: #a0aec0;">--</span>'}</td>
            <td style="text-align: center;"><span class="club-badge">${entry.club}</span></td>
        `;
        
        // Apply row style for missing pigeons
        if (rowStyle) {
            row.style.cssText = rowStyle;
        }

        // Only add actions column if user is authenticated
        if (isAuthenticated) {
            rowHTML += `
                <td style="text-align: center;">
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="editEntry(${entry.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-delete" onclick="deleteEntry(${entry.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
        }

        row.innerHTML = rowHTML;
        tbody.appendChild(row);
    });
}

function updateStats() {
    const entries = getCurrentRaceEntries();
    const totalPigeons = entries.length; // Total registered pigeons
    const returnedPigeons = entries.filter(entry => entry.returnStatus === 'returned').length; // Pigeons marked as returned
    const notReturnedPigeons = entries.filter(entry => entry.returnStatus === 'not_returned').length; // Missing pigeons

    // Count unique participants (loft names)
    const uniqueParticipants = [...new Set(entries.map(entry => entry.loftName))].length;

    // Calculate average time (only for returned pigeons)
    let avgTime = '--:--';
    if (returnedPigeons > 0) {
        const totalSeconds = entries
            .filter(entry => entry.returnStatus === 'returned' && entry.second)
            .reduce((sum, entry) => sum + entry.second, 0);
        const avgSeconds = Math.floor(totalSeconds / returnedPigeons);
        const minutes = Math.floor(avgSeconds / 60);
        const seconds = avgSeconds % 60;
        avgTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    document.getElementById('totalParticipants').textContent = uniqueParticipants;
    document.getElementById('totalPigeons').textContent = totalPigeons; // Registered
    document.getElementById('completedRaces').textContent = `${returnedPigeons} / ${totalPigeons}`; // Returned / Total
    document.getElementById('avgTime').textContent = avgTime;
}

function populateFilters() {
    const entries = getCurrentRaceEntries();
    const cultures = [...new Set(entries.map(entry => entry.culture))];
    const clubs = [...new Set(entries.map(entry => entry.club))];

    const cultureFilter = document.getElementById('cultureFilter');
    const clubFilter = document.getElementById('clubFilter');

    // Clear existing options (except "All")
    cultureFilter.innerHTML = '<option value="">All Cultures</option>';
    clubFilter.innerHTML = '<option value="">All Clubs</option>';

    cultures.forEach(culture => {
        const option = document.createElement('option');
        option.value = culture;
        option.textContent = culture.toUpperCase();
        cultureFilter.appendChild(option);
    });

    clubs.forEach(club => {
        const option = document.createElement('option');
        option.value = club;
        option.textContent = club;
        clubFilter.appendChild(option);
    });
}

function populateRaceSelector() {
    const raceSelect = document.getElementById('raceSelect');
    raceSelect.innerHTML = '<option value="">Choose a race...</option>';

    races.forEach(race => {
        const option = document.createElement('option');
        option.value = race.id;
        option.textContent = `${race.name} - ${formatDate(race.date)} - ${race.location}`;
        raceSelect.appendChild(option);
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function switchRace() {
    const raceSelect = document.getElementById('raceSelect');
    const selectedRaceId = raceSelect.value;



    if (selectedRaceId) {
        currentRaceId = selectedRaceId;
        const race = getCurrentRace();
        const entries = getCurrentRaceEntries();
        const uniqueParticipants = [...new Set(entries.map(entry => entry.loftName))].length;

        console.log('Switching to race:', selectedRaceId, 'Entries found:', entries.length);

        // Update header info
        document.getElementById('currentRaceInfo').textContent =
            `${race.name} - ${formatDate(race.date)} - ${race.location} (${race.visibility})`;

        // Show and update professional header
        document.getElementById('raceHeaderSection').style.display = 'block';
        updateProfessionalHeader(race, entries, uniqueParticipants);

        // Enable buttons based on authentication
        document.getElementById('downloadBtn').disabled = false;

        if (isAuthenticated) {
            document.getElementById('addEntryBtn').disabled = false;
            document.getElementById('editRaceBtn').disabled = false;
            document.getElementById('copyRaceBtn').disabled = false;
            // Delete button always hidden - only admin can delete from database
        } else {
            document.getElementById('addEntryBtn').disabled = true;
            document.getElementById('editRaceBtn').disabled = true;
            document.getElementById('copyRaceBtn').disabled = true;
        }

        // Load race data
        loadData();
        updateStats();
        populateFilters();

        // Show culture legend
        document.getElementById('cultureLegend').style.display = 'block';
    } else {
        currentRaceId = null;
        document.getElementById('currentRaceInfo').textContent = 'Select a race to view';
        document.getElementById('raceHeaderSection').style.display = 'none';
        document.getElementById('addEntryBtn').disabled = true;
        document.getElementById('editRaceBtn').disabled = true;
        document.getElementById('copyRaceBtn').disabled = true;
        document.getElementById('downloadBtn').disabled = true;

        // Clear table
        document.getElementById('tableBody').innerHTML = '';
        updateStats();

        // Hide culture legend
        document.getElementById('cultureLegend').style.display = 'none';
    }
}

function updateProfessionalHeader(race, entries, uniqueParticipants) {
    // Format release time to AM/PM
    const releaseTime = race.releaseTime;
    const [hours, minutes] = releaseTime.split(':');
    const hour12 = hours % 12 || 12;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedTime = `${releaseTime}:00 ${ampm}`;

    // Format date
    const date = new Date(race.date);
    const formattedDate = date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).toUpperCase().replace(/(\d+)/, '$1TH');

    // Calculate returned pigeons (those marked as returned)
    const returnedPigeons = entries.filter(entry => entry.returnStatus === 'returned').length;

    // Update header elements
    document.getElementById('headerReleaseTime').textContent = formattedTime;
    document.getElementById('headerReturnedPigeons').textContent = returnedPigeons;
    document.getElementById('headerParticipantCount').textContent = uniqueParticipants;
    document.getElementById('headerRaceName').textContent = race.name;
    document.getElementById('headerRaceSeason').textContent = race.season || '2024-2025';
    document.getElementById('headerDate').textContent = formattedDate;
    document.getElementById('headerVisibility').textContent = race.visibility;
    document.getElementById('headerRegisteredPigeons').textContent = entries.length;
}

function filterTable() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const cultureFilter = document.getElementById('cultureFilter').value;
    const clubFilter = document.getElementById('clubFilter').value;

    const entries = getCurrentRaceEntries();
    filteredEntries = entries.filter(entry => {
        const matchesSearch =
            entry.loftName.toLowerCase().includes(searchTerm) ||
            entry.ringNumber.toLowerCase().includes(searchTerm) ||
            entry.culture.toLowerCase().includes(searchTerm);

        const matchesCulture = !cultureFilter || entry.culture === cultureFilter;
        const matchesClub = !clubFilter || entry.club === clubFilter;

        return matchesSearch && matchesCulture && matchesClub;
    });

    currentPage = 1; // Reset to first page when filtering
    updatePagination();
    renderTable(getPaginatedEntries());
}

function openRaceModal() {
    if (!isAuthenticated) {
        alert('You need to be authenticated to create races');
        return;
    }

    editingRaceId = null;
    document.getElementById('raceModalTitle').textContent = 'Create New Race';
    document.getElementById('raceForm').reset();
    document.getElementById('raceModal').style.display = 'block';
}

function editCurrentRace() {
    if (!currentRaceId || !isAuthenticated) return;

    const race = getCurrentRace();
    editingRaceId = currentRaceId;

    document.getElementById('raceModalTitle').textContent = 'Edit Race';
    document.getElementById('raceName').value = race.name;
    document.getElementById('raceDate').value = race.date;
    document.getElementById('raceLocation').value = race.location;
    document.getElementById('raceDistance').value = race.distance;
    document.getElementById('raceReleaseTime').value = race.releaseTime;
    document.getElementById('raceVisibility').value = race.visibility;
    document.getElementById('raceSeason').value = race.season || '2024-2025';

    document.getElementById('raceModal').style.display = 'block';
}

async function deleteCurrentRace() {
    if (!currentRaceId || !isAuthenticated) return;

    const race = getCurrentRace();
    if (confirm(`Are you sure you want to delete the race "${race.name}"? This will also delete all entries for this race.`)) {
        try {
            if (isFirebaseEnabled) {
                await window.firebaseService.deleteRace(currentRaceId);
                showNotification('Race deleted successfully', 'success');
            } else {
                races = races.filter(r => r.id !== currentRaceId);
                saveToLocalStorage();
                populateRaceSelector();
                document.getElementById('raceSelect').value = '';
                switchRace();
            }

            currentRaceId = null;

        } catch (error) {
            console.error('Error deleting race:', error);
            showNotification('Error deleting race: ' + error.message, 'error');
        }
    }
}

function closeRaceModal() {
    document.getElementById('raceModal').style.display = 'none';
    editingRaceId = null;
}

function copyCurrentRace() {
    if (!currentRaceId || !isAuthenticated) {
        alert('Please select a race and authenticate first');
        return;
    }

    const race = getCurrentRace();
    if (!race) {
        alert('Could not find the selected race');
        return;
    }

    console.log('Opening copy race modal for:', race.name, 'with', race.entries.length, 'entries');

    // Pre-fill the form with current race data
    document.getElementById('copyRaceName').value = race.name + ' (Copy)';
    document.getElementById('copyRaceDate').value = race.date;
    document.getElementById('copyRaceLocation').value = race.location;
    document.getElementById('copyRaceDistance').value = race.distance;
    document.getElementById('copyRaceReleaseTime').value = race.releaseTime;
    document.getElementById('copyRaceVisibility').value = race.visibility;
    document.getElementById('copyRaceSeason').value = race.season || '2024-2025';

    document.getElementById('copyRaceModal').style.display = 'block';
}

function closeCopyRaceModal() {
    document.getElementById('copyRaceModal').style.display = 'none';
}

async function handleCopyRaceFormSubmit(e) {
    e.preventDefault();

    if (!isAuthenticated) {
        alert('You need to be authenticated to copy races');
        return;
    }

    const originalRace = getCurrentRace();
    if (!originalRace) {
        alert('Please select a race to copy');
        return;
    }

    console.log('Copying race:', originalRace.name, 'with', originalRace.entries.length, 'entries');

    const newRaceData = {
        name: document.getElementById('copyRaceName').value,
        date: document.getElementById('copyRaceDate').value,
        location: document.getElementById('copyRaceLocation').value,
        distance: parseFloat(document.getElementById('copyRaceDistance').value),
        releaseTime: document.getElementById('copyRaceReleaseTime').value,
        visibility: document.getElementById('copyRaceVisibility').value,
        season: document.getElementById('copyRaceSeason').value,
        entries: []
    };

    try {
        let newRaceId;

        if (!isFirebaseEnabled) {
            // For local storage, create race immediately with entries
            newRaceId = Date.now().toString();
        } else {
            // For Firebase, we'll create the complete race after processing entries
            newRaceId = Date.now().toString(); // Temporary ID for processing
            console.log('Preparing new race for Firebase with ID:', newRaceId);
        }

        // Copy all entries from original race
        const copiedEntries = originalRace.entries.map((entry, index) => ({
            ...entry,
            id: Date.now() + index, // Generate new unique ID
            // Recalculate times and velocity based on new race parameters
        }));

        console.log('Copied', copiedEntries.length, 'entries from original race');

        // Recalculate all entries for the new race parameters
        copiedEntries.forEach(entry => {
            // Only recalculate if entry has trapping time
            if (entry.trappingTime) {
                try {
                    const releaseTime = new Date(`${newRaceData.date} ${newRaceData.releaseTime}:00`);
                    const trappingTime = new Date(`${newRaceData.date} ${entry.trappingTime}`);
                    const timeDiff = trappingTime - releaseTime;

                    if (timeDiff > 0) {
                        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
                        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
                        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

                        entry.totalTime = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                        entry.second = Math.floor(timeDiff / 1000);
                        entry.minute = Math.floor(timeDiff / (1000 * 60));

                        // Use entry-specific distance or race distance
                        const distanceToUse = entry.distance || newRaceData.distance;
                        const timeInHours = timeDiff / (1000 * 60 * 60);
                        const velocityKmH = distanceToUse / timeInHours;
                        entry.velocity = velocityKmH * 18.2269; // Convert to YPM
                    } else {
                        // Invalid time difference, reset to defaults
                        entry.totalTime = '--:--:--';
                        entry.second = 0;
                        entry.minute = 0;
                        entry.velocity = 0;
                    }
                } catch (error) {
                    console.warn('Error recalculating entry times for:', entry.ringNumber, error);
                    // Keep original values if calculation fails
                }
            }
        });

        console.log('Recalculated times for entries with trapping time');

        // Sort by velocity and update positions
        copiedEntries.sort((a, b) => {
            // Entries without trapping time go to the end
            if (!a.trappingTime && b.trappingTime) return 1;
            if (a.trappingTime && !b.trappingTime) return -1;
            if (!a.trappingTime && !b.trappingTime) return a.id - b.id;

            if (b.velocity !== a.velocity) {
                return b.velocity - a.velocity;
            }
            return a.second - b.second;
        });

        copiedEntries.forEach((entry, index) => {
            entry.position = index + 1;
        });

        // Save the complete race with entries
        console.log('Saving race with', copiedEntries.length, 'entries...');

        if (isFirebaseEnabled) {
            // Create complete race data with entries
            const completeRaceData = {
                ...newRaceData,
                entries: copiedEntries,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            console.log('Creating complete race in Firebase...');
            console.log('Race data structure:', {
                name: completeRaceData.name,
                entriesCount: completeRaceData.entries.length,
                hasEntries: Array.isArray(completeRaceData.entries)
            });

            // Add the complete race directly to Firebase
            newRaceId = await window.firebaseService.addRace(completeRaceData);
            console.log('✅ Complete race saved to Firebase with ID:', newRaceId);

            // Verify the race was saved correctly
            console.log('🔍 Verifying saved race...');
            try {
                const savedRace = await window.firebaseService.getRace(newRaceId);
                console.log('📊 Verification - Saved race entries:', savedRace.entries ? savedRace.entries.length : 0);

                if (!savedRace.entries || savedRace.entries.length !== copiedEntries.length) {
                    console.error('⚠️ Entry count mismatch! Expected:', copiedEntries.length, 'Got:', savedRace.entries ? savedRace.entries.length : 0);
                    throw new Error('Race entries were not saved correctly');
                } else {
                    console.log('✅ Race verification successful');
                }
            } catch (verifyError) {
                console.error('❌ Race verification failed:', verifyError);
                throw new Error('Failed to verify copied race: ' + verifyError.message);
            }

        } else {
            // For local storage
            const newRace = {
                id: newRaceId,
                ...newRaceData,
                entries: copiedEntries
            };
            races.push(newRace);
            console.log('Race created in local storage');
            saveToLocalStorage();
            populateRaceSelector();
        }

        // Switch to the new race
        currentRaceId = newRaceId;

        closeCopyRaceModal();
        showNotification(`Race copied successfully with ${copiedEntries.length} entries`, 'success');

        if (isFirebaseEnabled) {
            // For Firebase, wait for real-time listener to update, then refresh manually if needed
            setTimeout(async () => {
                console.log('Checking if dropdown needs manual refresh...');

                // Check if the new race appears in dropdown
                const raceSelect = document.getElementById('raceSelect');
                const newRaceOption = Array.from(raceSelect.options).find(option => option.value === newRaceId);

                if (!newRaceOption) {
                    console.log('New race not in dropdown, manually refreshing...');
                    // Manually fetch races and update dropdown
                    try {
                        races = await window.firebaseService.getAllRaces();
                        populateRaceSelector();
                    } catch (error) {
                        console.error('Error refreshing races:', error);
                    }
                }

                // Select the new race
                document.getElementById('raceSelect').value = currentRaceId;
                switchRace();
            }, 1000);
        } else {
            // For local storage, immediately select the new race
            setTimeout(() => {
                document.getElementById('raceSelect').value = currentRaceId;
                switchRace();
            }, 100);
        }

    } catch (error) {
        console.error('Error copying race:', error);
        showNotification('Error copying race: ' + error.message, 'error');
    }
}

function openAddModal() {
    if (!currentRaceId) {
        alert('Please select a race first');
        return;
    }

    if (!isAuthenticated) {
        alert('You need to be authenticated to add entries');
        return;
    }

    editingId = null;
    document.getElementById('modalTitle').textContent = 'Add New Entry';
    document.getElementById('entryForm').reset();
    document.getElementById('entryModal').style.display = 'block';
}

function editEntry(id) {
    if (!isAuthenticated) {
        alert('You need to be authenticated to edit entries');
        return;
    }

    const entries = getCurrentRaceEntries();
    const entry = entries.find(e => e.id === id);
    if (!entry) return;

    editingId = id;
    document.getElementById('modalTitle').textContent = 'Edit Entry';

    // Populate form fields
    document.getElementById('loftName').value = entry.loftName;
    document.getElementById('ringNumber').value = entry.ringNumber;
    document.getElementById('culture').value = entry.culture;
    document.getElementById('entryDistance').value = entry.distance || '';
    document.getElementById('trappingTime').value = entry.trappingTime || '';
    document.getElementById('club').value = entry.club;
    document.getElementById('returnStatus').value = entry.returnStatus || 'registered';

    document.getElementById('entryModal').style.display = 'block';
}

async function deleteEntry(id) {
    if (!isAuthenticated) {
        alert('You need to be authenticated to delete entries');
        return;
    }

    if (confirm('Are you sure you want to delete this entry?')) {
        const race = getCurrentRace();
        race.entries = race.entries.filter(entry => entry.id !== id);

        // Re-sort by velocity and recalculate positions
        race.entries.sort((a, b) => {
            // Entries without trapping time go to the end
            if (!a.trappingTime && b.trappingTime) return 1;
            if (a.trappingTime && !b.trappingTime) return -1;
            if (!a.trappingTime && !b.trappingTime) return a.id - b.id;

            if (b.velocity !== a.velocity) {
                return b.velocity - a.velocity;
            }
            return a.second - b.second;
        });

        race.entries.forEach((entry, index) => {
            entry.position = index + 1;
        });

        loadData();
        updateStats();
        populateFilters();
        await saveRaceData(race);
    }
}

function closeModal() {
    document.getElementById('entryModal').style.display = 'none';
    editingId = null;
}

async function handleRaceFormSubmit(e) {
    e.preventDefault();

    if (!isAuthenticated) {
        alert('You need to be authenticated to create or edit races');
        return;
    }

    const formData = {
        name: document.getElementById('raceName').value,
        date: document.getElementById('raceDate').value,
        location: document.getElementById('raceLocation').value,
        distance: parseFloat(document.getElementById('raceDistance').value),
        releaseTime: document.getElementById('raceReleaseTime').value,
        visibility: document.getElementById('raceVisibility').value,
        season: document.getElementById('raceSeason').value
    };

    // For new races, initialize empty entries array
    if (!editingRaceId) {
        formData.entries = [];
    }

    try {
        if (editingRaceId) {
            // Update existing race - preserve entries
            await safeDataOperation('editRace', async () => {
                const currentRace = getCurrentRace();
                const existingEntries = currentRace ? currentRace.entries || [] : [];

                console.log('Editing race:', editingRaceId, 'Existing entries count:', existingEntries.length);

                if (isFirebaseEnabled) {
                    // Only update race metadata, not entries
                    const updateData = { ...formData };
                    delete updateData.entries; // Ensure we don't overwrite entries
                    await window.firebaseService.updateRace(editingRaceId, updateData);
                    showNotification('Race updated successfully', 'success');
                } else {
                    const raceIndex = races.findIndex(r => r.id === editingRaceId);
                    if (raceIndex !== -1) {
                        console.log('Updating local race, preserving', existingEntries.length, 'entries');
                        const originalEntries = races[raceIndex].entries; // Backup original
                        races[raceIndex] = {
                            ...races[raceIndex],
                            ...formData,
                            entries: originalEntries // Use original entries, not currentRace
                        };
                    }
                    saveToLocalStorage();
                    populateRaceSelector();
                }
            });
        } else {
            // Add new race
            if (isFirebaseEnabled) {
                const newRaceId = await window.firebaseService.addRace(formData);
                currentRaceId = newRaceId;
                showNotification('Race created successfully', 'success');

                // Wait a moment for the real-time listener to update, then select the new race
                setTimeout(() => {
                    document.getElementById('raceSelect').value = currentRaceId;
                    switchRace();
                }, 500);

            } else {
                const newRace = {
                    id: Date.now().toString(),
                    ...formData
                };
                races.push(newRace);
                currentRaceId = newRace.id;
                saveToLocalStorage();
                populateRaceSelector();
                document.getElementById('raceSelect').value = currentRaceId;
                switchRace();
            }
        }

        closeRaceModal();

        // Refresh the current race view if we were editing
        if (editingRaceId && currentRaceId === editingRaceId) {
            console.log('Refreshing race view after edit');
            switchRace();
        }

    } catch (error) {
        console.error('Error saving race:', error);
        showNotification('Error saving race: ' + error.message, 'error');
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();

    if (!isAuthenticated) {
        alert('You need to be authenticated to add entries');
        return;
    }

    const race = getCurrentRace();
    if (!race) {
        alert('Please select a race first');
        return;
    }

    console.log('Adding entry to race:', race.name);

    const entryDistanceValue = document.getElementById('entryDistance').value;
    const trappingTimeStr = document.getElementById('trappingTime').value;
    const returnStatus = document.getElementById('returnStatus').value;

    // Validate: if status is "returned", trapping time is required
    if (returnStatus === 'returned' && !trappingTimeStr) {
        alert('Trapping time is required when marking pigeon as "Returned"');
        return;
    }

    const formData = {
        loftName: document.getElementById('loftName').value,
        ringNumber: document.getElementById('ringNumber').value,
        culture: document.getElementById('culture').value,
        distance: entryDistanceValue ? parseFloat(entryDistanceValue) : null,
        trappingTime: trappingTimeStr || null,
        club: document.getElementById('club').value,
        returnStatus: returnStatus
    };

    // Initialize default values for entries without trapping time
    let totalTime = '--:--:--';
    let totalSeconds = 0;
    let totalMinutes = 0;
    let velocity = 0;

    // Only calculate times if trapping time is provided
    if (trappingTimeStr) {
        // Use entry-specific distance or fall back to race distance
        const distanceToUse = formData.distance || race.distance;

        // Calculate total time and velocity using race data with seconds precision
        const releaseTime = new Date(`${race.date} ${race.releaseTime}:00`);
        const trappingTime = new Date(`${race.date} ${trappingTimeStr}`);
        const timeDiff = trappingTime - releaseTime;

        if (timeDiff <= 0) {
            alert('Trapping time must be after release time');
            return;
        }

        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

        totalTime = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        totalSeconds = Math.floor(timeDiff / 1000);
        totalMinutes = Math.floor(timeDiff / (1000 * 60));

        // Calculate velocity with precise timing (distance in km / time in hours)
        // Convert to YPM (Yards Per Minute) - 1 km = 1093.61 yards
        const timeInHours = timeDiff / (1000 * 60 * 60);
        const velocityKmH = distanceToUse / timeInHours;
        velocity = velocityKmH * 18.2269; // Convert km/h to YPM (1 km/h = 18.2269 YPM)
    }



    if (editingId) {
        // Update existing entry
        const entryIndex = race.entries.findIndex(e => e.id === editingId);
        if (entryIndex !== -1) {
            race.entries[entryIndex] = {
                ...race.entries[entryIndex],
                ...formData,
                totalTime,
                second: totalSeconds,
                minute: totalMinutes,
                velocity
            };
        }
    } else {
        // Add new entry
        const newEntry = {
            id: Date.now(),
            position: race.entries.length + 1,
            ...formData,
            totalTime,
            second: totalSeconds,
            minute: totalMinutes,
            velocity
        };
        console.log('Creating new entry:', newEntry);
        race.entries.push(newEntry);
        console.log('Entry added. Total entries now:', race.entries.length);
    }

    // Sort by velocity (highest velocity = fastest = position 1) and recalculate positions
    race.entries.sort((a, b) => {
        // Entries without trapping time go to the end
        if (!a.trappingTime && b.trappingTime) return 1;
        if (a.trappingTime && !b.trappingTime) return -1;
        if (!a.trappingTime && !b.trappingTime) {
            // Sort by registration order (ID) for entries without times
            return a.id - b.id;
        }

        // Primary sort: by velocity (descending - highest velocity first)
        if (b.velocity !== a.velocity) {
            return b.velocity - a.velocity;
        }
        // Secondary sort: by total seconds (ascending - shortest time first) for ties
        return a.second - b.second;
    });

    // Recalculate positions based on sorted order
    race.entries.forEach((entry, index) => {
        entry.position = index + 1;
    });

    try {
        closeModal();
        loadData();
        updateStats();
        populateFilters();
        await saveRaceData(race);
        console.log('Entry added successfully!');
        showNotification('Entry added successfully', 'success');
    } catch (error) {
        console.error('Error adding entry:', error);
        showNotification('Error adding entry: ' + error.message, 'error');
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeModal();
    }
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        openAddModal();
    }
});

// Pagination functions
function updatePagination() {
    const totalEntries = filteredEntries.length;

    if (entriesPerPage === 'all') {
        document.getElementById('paginationContainer').style.display = 'none';
        return;
    }

    totalPages = Math.ceil(totalEntries / entriesPerPage);

    if (totalPages <= 1) {
        document.getElementById('paginationContainer').style.display = 'none';
        return;
    }

    document.getElementById('paginationContainer').style.display = 'flex';

    // Update pagination info
    const startEntry = (currentPage - 1) * entriesPerPage + 1;
    const endEntry = Math.min(currentPage * entriesPerPage, totalEntries);
    document.getElementById('paginationInfo').textContent =
        `Showing ${startEntry}-${endEntry} of ${totalEntries} entries`;

    // Update pagination buttons
    document.getElementById('firstPageBtn').disabled = currentPage === 1;
    document.getElementById('prevPageBtn').disabled = currentPage === 1;
    document.getElementById('nextPageBtn').disabled = currentPage === totalPages;
    document.getElementById('lastPageBtn').disabled = currentPage === totalPages;

    // Update page numbers
    updatePageNumbers();
}

function updatePageNumbers() {
    const pageNumbersContainer = document.getElementById('pageNumbers');
    pageNumbersContainer.innerHTML = '';

    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-number ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.onclick = () => goToPage(i);
        pageNumbersContainer.appendChild(pageBtn);
    }
}

function goToPage(page) {
    if (page < 1 || page > totalPages) return;

    currentPage = page;
    updatePagination();
    renderTable(getPaginatedEntries());
}

function changeEntriesPerPage() {
    const select = document.getElementById('entriesPerPage');
    entriesPerPage = select.value === 'all' ? 'all' : parseInt(select.value);
    currentPage = 1;
    updatePagination();
    renderTable(getPaginatedEntries());
}

// Auto-save to localStorage (fallback)
function saveToLocalStorage() {
    localStorage.setItem('pigeonRacingData', JSON.stringify({
        races,
        currentRaceId
    }));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('pigeonRacingData');
    if (saved) {
        const data = JSON.parse(saved);
        races = data.races || [];
        currentRaceId = data.currentRaceId || null;

        // If we have local data but no races, create sample data
        if (races.length === 0) {
            races = [
                {
                    id: Date.now(),
                    name: "JOBAIL BULL 70KM",
                    date: "2025-01-31",
                    location: "Jobail Bull",
                    distance: 70.35,
                    releaseTime: "08:05",
                    visibility: "FOGGY",
                    season: "2024-2025",
                    entries: [
                        {
                            id: 1,
                            position: 1,
                            loftName: "rajib a samad loft",
                            ringNumber: "24-52228-h",
                            culture: "blue",
                            trappingTime: "08:56:50",
                            totalTime: "0:51:50",
                            second: 3110,
                            minute: 52,
                            velocity: 1484.2899,
                            club: "CNRPA",
                            returnStatus: "returned"
                        },
                        {
                            id: 2,
                            position: 2,
                            loftName: "rajib a samad loft",
                            ringNumber: "24-52305-c",
                            culture: "rchek",
                            trappingTime: "08:56:53",
                            totalTime: "0:51:53",
                            second: 3113,
                            minute: 52,
                            velocity: 1482.8595,
                            club: "CNRPA",
                            returnStatus: "returned"
                        },
                        {
                            id: 3,
                            position: 3,
                            loftName: "rajib a samad loft",
                            ringNumber: "24-52301-h",
                            culture: "pire",
                            trappingTime: "08:57:05",
                            totalTime: "0:52:05",
                            second: 3125,
                            minute: 52,
                            velocity: 1477.1654,
                            club: "CNRPA",
                            returnStatus: "returned"
                        }
                    ]
                }
            ];
            saveToLocalStorage();
        }
    }
}

// Save data (Firebase or localStorage)
async function saveData() {
    if (isFirebaseEnabled) {
        // Firebase handles real-time updates automatically
        return;
    } else {
        // Fallback to localStorage
        saveToLocalStorage();
    }
}



// Helper function to get consistent loft color index
function getLoftColorIndex(loftName) {
    try {
        const entries = getCurrentRaceEntries();
        if (!entries || entries.length === 0) {
            return 0;
        }

        const uniqueLofts = [...new Set(entries.map(entry => entry.loftName))].sort();
        const index = uniqueLofts.indexOf(loftName);

        // Return 0 if loft name not found, otherwise return the index
        return index >= 0 ? index : 0;
    } catch (error) {
        console.warn('Error getting loft color index:', error);
        return 0;
    }
}

// PDF Download functionality
function downloadPDF() {
    try {
        const race = getCurrentRace();
        if (!race) {
            alert('Please select a race first');
            return;
        }

        // Check if jsPDF is available
        if (!window.jspdf) {
            alert('PDF library not loaded. Please refresh the page and try again.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape'); // Use landscape for better table fit

        // Add logo to PDF with higher quality
        try {
            const logoElement = document.querySelector('.race-header-logo');
            if (logoElement && logoElement.complete) {
                // Create high-resolution canvas for better quality
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                // Use higher resolution for better quality
                canvas.width = 300;
                canvas.height = 300;

                // Enable image smoothing for better quality
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                // Draw the logo at high resolution
                ctx.drawImage(logoElement, 0, 0, 300, 300);
                
                // Convert to PNG for better quality (no compression artifacts)
                const logoDataUrl = canvas.toDataURL('image/png', 1.0);

                // Add to PDF - positioned on the left side
                doc.addImage(logoDataUrl, 'PNG', 10, 8, 25, 25);
            } else {
                // Fallback: simple logo placeholder
                doc.setFillColor(102, 126, 234);
                doc.circle(22.5, 20.5, 12, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(10);
                doc.text('LOGO', 22.5, 23, { align: 'center' });
            }
        } catch (error) {
            console.warn('Could not add logo to PDF, using placeholder:', error);
            // Fallback: simple logo placeholder
            doc.setFillColor(102, 126, 234);
            doc.circle(22.5, 20.5, 12, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.text('LOGO', 22.5, 23, { align: 'center' });
        }

        // Header with professional styling - positioned to avoid logo
        doc.setFontSize(16);
        doc.setTextColor(102, 126, 234);
        doc.text('CHAPAINAWABGANJ RACING PIGEON ASSOCIATION', 148, 12, { align: 'center' });

        // Subtitle
        doc.setFontSize(9);
        doc.setTextColor(128, 128, 128);
        doc.text('Since 2023 - Professional Pigeon Racing Management', 148, 18, { align: 'center' });

        // Race details section - better layout with logo on left
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);

        // Left column - positioned beside logo
        const leftColX = 40;
        const entries = getCurrentRaceEntries();
        const returnedPigeons = entries.filter(entry => entry.returnStatus === 'returned').length;
        const notReturnedPigeons = entries.filter(entry => entry.returnStatus === 'not_returned').length;
        
        doc.text(`Release Time: ${race.releaseTime}:00 AM`, leftColX, 25);
        doc.text(`Returned Pigeons: ${returnedPigeons}`, leftColX, 30);
        doc.text(`Missing Pigeons: ${notReturnedPigeons}`, leftColX, 35);

        // Center - Race name badge
        doc.setFillColor(220, 38, 38);
        doc.rect(120, 23, 56, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.text(race.name, 148, 30, { align: 'center' });
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        doc.text(race.season || '2024-2025', 148, 37, { align: 'center' });

        // Right column
        const date = new Date(race.date);
        const formattedDate = date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).toUpperCase().replace(/(\d+)/, '$1TH');

        const rightColX = 200;
        doc.text(`Date: ${formattedDate}`, rightColX, 25);
        doc.text(`Visibility: ${race.visibility}`, rightColX, 30);
        doc.text(`Registered Pigeon: ${entries.length}`, rightColX, 35);

        // entries already declared above, no need to redeclare

        // Table headers matching the exact format
        const headers = [
            ['POSITION', 'S/L', "Loft's Name", 'Ban Ring No', 'Culture', 'Distance\n(KM)', 'Release\nTime', 'Trapping\nTime', 'Status', 'Total Time', 'Second', 'Minute', 'Velocity\n(YPM)', 'Club\nName']
        ];

        // Table data with proper formatting
        const tableData = entries.map(entry => {
            const entryDistance = entry.distance || race.distance;
            
            // Format status for display
            let statusText = 'Registered';
            if (entry.returnStatus === 'returned') {
                statusText = 'Returned';
            } else if (entry.returnStatus === 'not_returned') {
                statusText = 'Missing';
            }
            
            return [
                entry.position, // POSITION
                entry.position, // S/L
                entry.loftName, // Loft's Name
                entry.ringNumber, // Ban Ring No
                entry.culture.toLowerCase(), // Culture
                entryDistance, // Distance
                race.releaseTime, // Release Time
                entry.trappingTime || '--:--:--', // Trapping Time
                statusText, // Status
                entry.totalTime, // Total Time
                entry.second || 0, // Second
                entry.minute || 0, // Minute
                entry.velocity ? entry.velocity.toFixed(4) : '--', // Velocity
                entry.club // Club Name
            ];
        });

        // Generate table with proper styling
        doc.autoTable({
            head: headers,
            body: tableData,
            startY: 45,
            styles: {
                fontSize: 7,
                cellPadding: 1.5,
                lineColor: [200, 200, 200],
                lineWidth: 0.1,
            },
            headStyles: {
                fillColor: [102, 126, 234],
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center',
                valign: 'middle'
            },
            columnStyles: {
                0: { fillColor: [74, 85, 104], textColor: 255, halign: 'center', cellWidth: 16 }, // POSITION
                1: { halign: 'center', cellWidth: 10 }, // S/L
                2: { halign: 'left', cellWidth: 30 }, // Loft's Name
                3: { halign: 'center', cellWidth: 22 }, // Ban Ring No
                4: { halign: 'center', cellWidth: 13 }, // Culture
                5: { halign: 'center', cellWidth: 15 }, // Distance
                6: { halign: 'center', cellWidth: 15 }, // Release Time
                7: { halign: 'center', cellWidth: 15 }, // Trapping Time
                8: { halign: 'center', cellWidth: 18 }, // Status
                9: { halign: 'center', cellWidth: 18 }, // Total Time
                10: { halign: 'center', cellWidth: 13 }, // Second
                11: { halign: 'center', cellWidth: 13 }, // Minute
                12: { halign: 'center', cellWidth: 18 }, // Velocity
                13: { halign: 'center', cellWidth: 13 } // Club Name
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            },
            margin: { left: 10, right: 10 },
            tableWidth: 'auto',
            didParseCell: function (data) {
                // Style culture badges
                if (data.column.index === 4) {
                    const culture = data.cell.text[0].toLowerCase();
                    switch (culture) {
                        case 'blue':
                            data.cell.styles.fillColor = [190, 227, 248];
                            data.cell.styles.textColor = [43, 108, 176];
                            break;
                        case 'chekr':
                            data.cell.styles.fillColor = [254, 215, 215];
                            data.cell.styles.textColor = [197, 48, 48];
                            break;
                        case 'rchek':
                            data.cell.styles.fillColor = [254, 245, 231];
                            data.cell.styles.textColor = [214, 158, 46];
                            break;
                        case 'mily':
                            data.cell.styles.fillColor = [230, 255, 250];
                            data.cell.styles.textColor = [49, 151, 149];
                            break;
                        case 'piet':
                            data.cell.styles.fillColor = [240, 255, 244];
                            data.cell.styles.textColor = [56, 161, 105];
                            break;
                        case 'white':
                            data.cell.styles.fillColor = [247, 250, 252];
                            data.cell.styles.textColor = [74, 85, 104];
                            break;
                        case 'black':
                            data.cell.styles.fillColor = [45, 55, 72];
                            data.cell.styles.textColor = [255, 255, 255];
                            break;
                        case 'grizzel':
                            data.cell.styles.fillColor = [237, 242, 247];
                            data.cell.styles.textColor = [113, 128, 150];
                            break;
                    }
                }

                // Style Status column (column index 8)
                if (data.column.index === 8) {
                    const status = data.cell.text[0];
                    if (status === 'Returned') {
                        data.cell.styles.fillColor = [198, 246, 213]; // Green
                        data.cell.styles.textColor = [34, 139, 34];
                        data.cell.styles.fontStyle = 'bold';
                    } else if (status === 'Missing') {
                        data.cell.styles.fillColor = [254, 215, 215]; // Red
                        data.cell.styles.textColor = [197, 48, 48];
                        data.cell.styles.fontStyle = 'bold';
                    } else if (status === 'Registered') {
                        data.cell.styles.fillColor = [247, 250, 252]; // Gray
                        data.cell.styles.textColor = [113, 128, 150];
                        data.cell.styles.fontStyle = 'italic';
                    }
                }

                // Style loft names with colors (column index 2)
                if (data.column.index === 2) {
                    const loftName = data.cell.text[0];
                    const loftColorIndex = getLoftColorIndex(loftName);
                    const loftColors = [
                        { bg: [230, 243, 255], text: [0, 102, 204] },    // Blue
                        { bg: [255, 240, 230], text: [204, 102, 0] },    // Orange
                        { bg: [230, 255, 230], text: [0, 153, 0] },      // Green
                        { bg: [255, 230, 240], text: [204, 0, 102] },    // Pink
                        { bg: [240, 230, 255], text: [102, 0, 204] },    // Purple
                        { bg: [255, 230, 230], text: [204, 0, 0] },      // Red
                        { bg: [230, 255, 255], text: [0, 102, 102] },    // Teal
                        { bg: [255, 255, 230], text: [204, 204, 0] },    // Yellow
                        { bg: [245, 245, 245], text: [102, 102, 102] },  // Gray
                        { bg: [255, 230, 204], text: [204, 51, 0] }      // Brown
                    ];

                    // Ensure we have a valid color index (default to 0 if not found)
                    const safeColorIndex = Math.max(0, loftColorIndex) % 10;
                    const colorScheme = loftColors[safeColorIndex];

                    if (colorScheme && colorScheme.bg && colorScheme.text) {
                        data.cell.styles.fillColor = colorScheme.bg;
                        data.cell.styles.textColor = colorScheme.text;
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            }
        });

        // Footer
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, finalY);
        doc.text('Pigeon Racing Tracker System', 148, finalY, { align: 'center' });

        // Save the PDF
        const fileName = `${race.name.replace(/\s+/g, '_')}_${race.date}_Results.pdf`;
        doc.save(fileName);

    } catch (error) {
        console.error('PDF generation error:', error);
        alert('Error generating PDF: ' + error.message + '. Please check the console for details.');
    }
}

// Helper function to save race data
async function saveRaceData(race) {
    return safeDataOperation('saveRaceData', async () => {
        try {
            console.log('Saving race data:', race.name, 'with', race.entries.length, 'entries');

            if (isFirebaseEnabled) {
                // For entry updates, we need to save the complete race with entries
                await window.firebaseService.replaceRace(race.id, race);
                console.log('Race data saved to Firebase successfully');
            } else {
                saveToLocalStorage();
                console.log('Race data saved to localStorage successfully');
            }
        } catch (error) {
            console.error('Error saving race data:', error);
            showNotification('Error saving data: ' + error.message, 'error');
        }
    });
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 1002;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
    `;

    // Set colors based on type
    switch (type) {
        case 'success':
            notification.style.background = '#c6f6d5';
            notification.style.color = '#2f855a';
            notification.style.border = '2px solid #9ae6b4';
            break;
        case 'error':
            notification.style.background = '#fed7d7';
            notification.style.color = '#c53030';
            notification.style.border = '2px solid #feb2b2';
            break;
        case 'warning':
            notification.style.background = '#feebc8';
            notification.style.color = '#c05621';
            notification.style.border = '2px solid #f6ad55';
            break;
        default:
            notification.style.background = '#bee3f8';
            notification.style.color = '#2b6cb0';
            notification.style.border = '2px solid #90cdf4';
    }

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
// Debug function to check race data integrity
function debugRaceData() {
    console.log('=== RACE DATA DEBUG ===');
    console.log('Current Race ID:', currentRaceId);
    console.log('Total Races:', races.length);

    races.forEach((race, index) => {
        console.log(`Race ${index + 1}:`, {
            id: race.id,
            name: race.name,
            entriesCount: race.entries ? race.entries.length : 0
        });
    });

    const currentRace = getCurrentRace();
    if (currentRace) {
        console.log('Current Race Details:', {
            name: currentRace.name,
            entriesCount: currentRace.entries ? currentRace.entries.length : 0,
            entries: currentRace.entries
        });
    }
    console.log('=== END DEBUG ===');
}

// Make it available globally for testing
window.debugRaceData = debugRaceData;// Comprehensive data integrity validation
function validateDataIntegrity() {
    console.log('🔍 RUNNING DATA INTEGRITY CHECK...');

    let issues = [];

    // Check races array
    if (!Array.isArray(races)) {
        issues.push('❌ races is not an array');
        return issues;
    }

    races.forEach((race, raceIndex) => {
        // Check race structure
        if (!race.id) issues.push(`❌ Race ${raceIndex} missing ID`);
        if (!race.name) issues.push(`❌ Race ${raceIndex} missing name`);
        if (!race.entries) {
            issues.push(`❌ Race ${raceIndex} missing entries array`);
            return;
        }

        if (!Array.isArray(race.entries)) {
            issues.push(`❌ Race ${raceIndex} entries is not an array`);
            return;
        }

        // Check entries
        race.entries.forEach((entry, entryIndex) => {
            if (!entry.id) issues.push(`❌ Race ${raceIndex}, Entry ${entryIndex} missing ID`);
            if (!entry.loftName) issues.push(`❌ Race ${raceIndex}, Entry ${entryIndex} missing loftName`);
            if (!entry.ringNumber) issues.push(`❌ Race ${raceIndex}, Entry ${entryIndex} missing ringNumber`);
            if (!entry.culture) issues.push(`❌ Race ${raceIndex}, Entry ${entryIndex} missing culture`);
            if (!entry.club) issues.push(`❌ Race ${raceIndex}, Entry ${entryIndex} missing club`);
        });

        console.log(`✅ Race "${race.name}": ${race.entries.length} entries validated`);
    });

    if (issues.length === 0) {
        console.log('✅ DATA INTEGRITY CHECK PASSED - All data is safe!');
    } else {
        console.log('❌ DATA INTEGRITY ISSUES FOUND:');
        issues.forEach(issue => console.log(issue));
    }

    return issues;
}

// Auto-run integrity check after any data modification
function safeDataOperation(operationName, operation) {
    console.log(`🔧 Starting operation: ${operationName}`);

    // Run integrity check before
    const beforeIssues = validateDataIntegrity();
    if (beforeIssues.length > 0) {
        console.warn('⚠️ Data integrity issues detected BEFORE operation!');
    }

    // Run the operation
    const result = operation();

    // Run integrity check after
    setTimeout(() => {
        const afterIssues = validateDataIntegrity();
        if (afterIssues.length > beforeIssues.length) {
            console.error('🚨 NEW DATA INTEGRITY ISSUES DETECTED!');
            console.error('Operation that caused issues:', operationName);
        } else {
            console.log(`✅ Operation "${operationName}" completed safely`);
        }
    }, 100);

    return result;
}

// Make functions available globally for testing
window.validateDataIntegrity = validateDataIntegrity;
window.safeDataOperation = safeDataOperation;// Debug function to test entry addition
function testAddEntry() {
    console.log('=== TESTING ENTRY ADDITION ===');
    console.log('Is authenticated:', isAuthenticated);
    console.log('Current race ID:', currentRaceId);
    console.log('Current race:', getCurrentRace());
    console.log('Firebase enabled:', isFirebaseEnabled);

    const race = getCurrentRace();
    if (race) {
        console.log('Race entries before:', race.entries.length);

        // Test entry
        const testEntry = {
            id: Date.now(),
            position: race.entries.length + 1,
            loftName: 'Test Loft',
            ringNumber: 'TEST-001',
            culture: 'blue',
            distance: null,
            trappingTime: null,
            club: 'CNRPA',
            totalTime: '--:--:--',
            second: 0,
            minute: 0,
            velocity: 0
        };

        race.entries.push(testEntry);
        console.log('Race entries after:', race.entries.length);

        // Try to save
        saveRaceData(race).then(() => {
            console.log('Test entry saved successfully');
            loadData();
        }).catch(error => {
            console.error('Test entry save failed:', error);
        });
    } else {
        console.log('No race selected');
    }
}

// Make it available globally
window.testAddEntry = testAddEntry;// Debug function to test copy race functionality
function testCopyRace() {
    console.log('=== TESTING COPY RACE FUNCTIONALITY ===');
    console.log('Is authenticated:', isAuthenticated);
    console.log('Current race ID:', currentRaceId);
    console.log('Firebase enabled:', isFirebaseEnabled);

    const race = getCurrentRace();
    if (race) {
        console.log('Current race:', race.name);
        console.log('Entries to copy:', race.entries.length);

        // Test if copy race modal can open
        try {
            copyCurrentRace();
            console.log('✅ Copy race modal opened successfully');
        } catch (error) {
            console.error('❌ Error opening copy race modal:', error);
        }
    } else {
        console.log('❌ No race selected');
    }
}

// Make it available globally
window.testCopyRace = testCopyRace;// Manual refresh function for race dropdown
async function refreshRaceDropdown() {
    console.log('Manually refreshing race dropdown...');

    try {
        if (isFirebaseEnabled) {
            // Fetch latest races from Firebase
            races = await window.firebaseService.getAllRaces();
            console.log('Fetched', races.length, 'races from Firebase');
        }

        // Update dropdown
        populateRaceSelector();
        console.log('Race dropdown refreshed successfully');

        // If we have a current race, make sure it's selected
        if (currentRaceId) {
            const raceSelect = document.getElementById('raceSelect');
            const raceOption = Array.from(raceSelect.options).find(option => option.value === currentRaceId);
            if (raceOption) {
                raceSelect.value = currentRaceId;
                console.log('Current race re-selected:', currentRaceId);
            } else {
                console.warn('Current race not found in dropdown:', currentRaceId);
            }
        }

        return true;
    } catch (error) {
        console.error('Error refreshing race dropdown:', error);
        showNotification('Error refreshing races: ' + error.message, 'error');
        return false;
    }
}

// Make it available globally
window.refreshRaceDropdown = refreshRaceDropdown;// Debug function to check dropdown state
function debugDropdownState() {
    console.log('=== DROPDOWN STATE DEBUG ===');

    const raceSelect = document.getElementById('raceSelect');
    console.log('Dropdown element:', raceSelect);
    console.log('Number of options:', raceSelect.options.length);

    console.log('Options in dropdown:');
    Array.from(raceSelect.options).forEach((option, index) => {
        console.log(`  ${index}: ${option.value} - ${option.textContent}`);
    });

    console.log('Races in memory:', races.length);
    races.forEach((race, index) => {
        console.log(`  ${index}: ${race.id} - ${race.name}`);
    });

    console.log('Current race ID:', currentRaceId);
    console.log('Selected value:', raceSelect.value);
    console.log('Firebase enabled:', isFirebaseEnabled);

    return {
        dropdownOptions: raceSelect.options.length,
        racesInMemory: races.length,
        currentRaceId,
        selectedValue: raceSelect.value
    };
}

// Make it available globally
window.debugDropdownState = debugDropdownState;// Comprehensive data persistence check
async function checkDataPersistence() {
    console.log('🔍 CHECKING DATA PERSISTENCE...');

    // Check Firebase connection
    if (window.firebaseService) {
        try {
            console.log('🔥 Testing Firebase connection...');
            const testRaces = await window.firebaseService.getAllRaces();
            console.log('✅ Firebase connected. Races found:', testRaces.length);

            testRaces.forEach((race, index) => {
                console.log(`  📋 Race ${index + 1}: ${race.name}`);
                console.log(`     📅 Date: ${race.date}`);
                console.log(`     📍 Location: ${race.location}`);
                console.log(`     🏃 Entries: ${race.entries ? race.entries.length : 0}`);
                console.log('     ---');
            });

            return { firebase: true, races: testRaces };
        } catch (error) {
            console.error('❌ Firebase connection failed:', error);
            return { firebase: false, error: error.message };
        }
    } else {
        console.log('❌ Firebase service not available');
        return { firebase: false, error: 'Firebase service not available' };
    }
}

// Test data saving and loading
async function testDataPersistence() {
    console.log('🧪 TESTING DATA PERSISTENCE...');

    // Create a test race
    const testRace = {
        name: 'TEST RACE - ' + Date.now(),
        date: '2025-01-01',
        location: 'Test Location',
        distance: 100,
        releaseTime: '08:00',
        visibility: 'CLEAR',
        season: '2024-2025',
        entries: [
            {
                id: Date.now(),
                position: 1,
                loftName: 'Test Loft',
                ringNumber: 'TEST-001',
                culture: 'blue',
                trappingTime: '09:30:00',
                totalTime: '1:30:00',
                second: 5400,
                minute: 90,
                velocity: 1200,
                club: 'CNRPA'
            }
        ]
    };

    try {
        if (isFirebaseEnabled) {
            console.log('💾 Saving test race to Firebase...');
            const testRaceId = await window.firebaseService.addRace(testRace);
            console.log('✅ Test race saved with ID:', testRaceId);

            // Try to retrieve it
            console.log('📡 Retrieving test race...');
            const retrievedRaces = await window.firebaseService.getAllRaces();
            const foundTestRace = retrievedRaces.find(r => r.id === testRaceId);

            if (foundTestRace) {
                console.log('✅ Test race retrieved successfully');
                console.log('📊 Test race data:', foundTestRace);

                // Clean up - delete test race
                await window.firebaseService.deleteRace(testRaceId);
                console.log('🗑️ Test race cleaned up');

                return { success: true, message: 'Data persistence test passed' };
            } else {
                console.error('❌ Test race not found after saving');
                return { success: false, message: 'Test race not found after saving' };
            }
        } else {
            console.log('📱 Testing local storage...');
            const originalRaces = [...races];
            races.push({ id: 'test-' + Date.now(), ...testRace });
            saveToLocalStorage();

            // Simulate page reload by clearing and reloading
            races = [];
            loadFromLocalStorage();

            const foundTestRace = races.find(r => r.id.startsWith('test-'));
            if (foundTestRace) {
                console.log('✅ Local storage test passed');
                // Clean up
                races = originalRaces;
                saveToLocalStorage();
                return { success: true, message: 'Local storage test passed' };
            } else {
                console.error('❌ Local storage test failed');
                return { success: false, message: 'Local storage test failed' };
            }
        }
    } catch (error) {
        console.error('❌ Data persistence test failed:', error);
        return { success: false, message: error.message };
    }
}

// Make functions available globally
window.checkDataPersistence = checkDataPersistence;
window.testDataPersistence = testDataPersistence;// Data recovery function for when data goes missing
async function recoverMissingData() {
    console.log('🔄 ATTEMPTING DATA RECOVERY...');

    try {
        if (isFirebaseEnabled && window.firebaseService) {
            console.log('🔥 Attempting Firebase data recovery...');

            // Force refresh from Firebase
            const recoveredRaces = await window.firebaseService.getAllRaces();
            console.log('📊 Recovered races from Firebase:', recoveredRaces.length);

            if (recoveredRaces.length > 0) {
                races = recoveredRaces;
                populateRaceSelector();

                // Select first race if none selected
                if (!currentRaceId && races.length > 0) {
                    currentRaceId = races[0].id;
                    document.getElementById('raceSelect').value = currentRaceId;
                    switchRace();
                }

                console.log('✅ Data recovery successful');
                showNotification('Data recovered successfully', 'success');
                return true;
            } else {
                console.log('⚠️ No data found in Firebase to recover');
                showNotification('No data found to recover', 'info');
                return false;
            }
        } else {
            console.log('📱 Attempting local storage recovery...');
            loadFromLocalStorage();
            populateRaceSelector();

            if (races.length > 0) {
                console.log('✅ Local data recovery successful');
                showNotification('Local data recovered', 'success');
                return true;
            } else {
                console.log('⚠️ No local data found to recover');
                showNotification('No local data found', 'info');
                return false;
            }
        }
    } catch (error) {
        console.error('❌ Data recovery failed:', error);
        showNotification('Data recovery failed: ' + error.message, 'error');
        return false;
    }
}

// Auto-recovery check on page load
function checkAndRecoverData() {
    // Wait a moment for initialization to complete
    setTimeout(() => {
        if (races.length === 0) {
            console.log('⚠️ No races found after initialization, attempting recovery...');
            recoverMissingData();
        }
    }, 2000);
}

// Make functions available globally
window.recoverMissingData = recoverMissingData;
window.checkAndRecoverData = checkAndRecoverData;// Comprehensive copy race test function
async function testCopyRaceData() {
    console.log('🧪 TESTING COPY RACE DATA INTEGRITY...');

    const originalRace = getCurrentRace();
    if (!originalRace) {
        console.error('❌ No race selected for testing');
        return false;
    }

    console.log('📋 Original race:', originalRace.name);
    console.log('📊 Original entries:', originalRace.entries.length);

    // Test data structure
    console.log('🔍 Testing data structure...');
    console.log('Original race structure:', {
        hasName: !!originalRace.name,
        hasDate: !!originalRace.date,
        hasLocation: !!originalRace.location,
        hasDistance: !!originalRace.distance,
        hasReleaseTime: !!originalRace.releaseTime,
        hasVisibility: !!originalRace.visibility,
        hasEntries: Array.isArray(originalRace.entries),
        entriesCount: originalRace.entries ? originalRace.entries.length : 0
    });

    // Test entry structure
    if (originalRace.entries && originalRace.entries.length > 0) {
        const sampleEntry = originalRace.entries[0];
        console.log('📝 Sample entry structure:', {
            hasId: !!sampleEntry.id,
            hasLoftName: !!sampleEntry.loftName,
            hasRingNumber: !!sampleEntry.ringNumber,
            hasCulture: !!sampleEntry.culture,
            hasClub: !!sampleEntry.club,
            hasTrappingTime: !!sampleEntry.trappingTime,
            hasVelocity: typeof sampleEntry.velocity === 'number'
        });
    }

    if (isFirebaseEnabled) {
        console.log('🔥 Testing Firebase data integrity...');
        try {
            // Test if we can fetch the current race from Firebase
            const firebaseRace = await window.firebaseService.getRace(originalRace.id);
            console.log('📡 Firebase race entries:', firebaseRace.entries ? firebaseRace.entries.length : 0);

            if (firebaseRace.entries && firebaseRace.entries.length !== originalRace.entries.length) {
                console.warn('⚠️ Entry count mismatch between local and Firebase!');
                console.log('Local entries:', originalRace.entries.length);
                console.log('Firebase entries:', firebaseRace.entries.length);
            } else {
                console.log('✅ Local and Firebase data match');
            }

            return true;
        } catch (error) {
            console.error('❌ Firebase data test failed:', error);
            return false;
        }
    } else {
        console.log('📱 Local storage mode - data integrity looks good');
        return true;
    }
}

// Make it available globally
window.testCopyRaceData = testCopyRaceData;

// Ring Search Functionality
function openRingSearchModal() {
    document.getElementById('ringSearchModal').style.display = 'block';
    document.getElementById('ringSearchInput').focus();
    
    // Clear previous results
    document.getElementById('ringSearchResults').innerHTML = `
        <div class="ring-search-empty">
            <i class="fas fa-search"></i>
            <p>Enter a ring number to search</p>
            <small>Search across all races to see complete pigeon history</small>
        </div>
    `;
}

function closeRingSearchModal() {
    document.getElementById('ringSearchModal').style.display = 'none';
    document.getElementById('ringSearchInput').value = '';
}

function searchRingNumber() {
    const ringNumber = document.getElementById('ringSearchInput').value.trim().toLowerCase();
    
    if (!ringNumber) {
        showNotification('Please enter a ring number', 'warning');
        return;
    }
    
    console.log('Searching for ring number:', ringNumber);
    
    // Search across all races
    const results = [];
    
    races.forEach(race => {
        if (race.entries && Array.isArray(race.entries)) {
            race.entries.forEach(entry => {
                if (entry.ringNumber && entry.ringNumber.toLowerCase().includes(ringNumber)) {
                    results.push({
                        ...entry,
                        raceName: race.name,
                        raceDate: race.date,
                        raceLocation: race.location,
                        raceDistance: entry.distance || race.distance,
                        raceSeason: race.season
                    });
                }
            });
        }
    });
    
    console.log('Search results:', results.length);
    
    displayRingSearchResults(results, ringNumber);
}

function displayRingSearchResults(results, searchTerm) {
    const resultsContainer = document.getElementById('ringSearchResults');
    
    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search" style="font-size: 48px; margin-bottom: 15px; opacity: 0.3;"></i>
                <p>No pigeon found with ring number: <strong>${searchTerm}</strong></p>
                <small>Try searching with a different ring number</small>
            </div>
        `;
        return;
    }
    
    // Group results by ring number (in case of partial matches)
    const groupedResults = {};
    results.forEach(result => {
        const ringKey = result.ringNumber.toLowerCase();
        if (!groupedResults[ringKey]) {
            groupedResults[ringKey] = [];
        }
        groupedResults[ringKey].push(result);
    });
    
    // Display results for each unique ring number
    let html = '';
    
    Object.keys(groupedResults).forEach(ringKey => {
        const pigeonResults = groupedResults[ringKey];
        const firstResult = pigeonResults[0];
        
        // Calculate statistics
        const totalRaces = pigeonResults.length;
        const completedRaces = pigeonResults.filter(r => r.trappingTime).length;
        const top3Finishes = pigeonResults.filter(r => r.position <= 3).length;
        const top10Finishes = pigeonResults.filter(r => r.position <= 10).length;
        
        // Calculate average position (only for completed races)
        const completedPositions = pigeonResults.filter(r => r.trappingTime).map(r => r.position);
        const avgPosition = completedPositions.length > 0 
            ? (completedPositions.reduce((a, b) => a + b, 0) / completedPositions.length).toFixed(1)
            : 'N/A';
        
        // Calculate average velocity
        const velocities = pigeonResults.filter(r => r.velocity > 0).map(r => r.velocity);
        const avgVelocity = velocities.length > 0
            ? (velocities.reduce((a, b) => a + b, 0) / velocities.length).toFixed(2)
            : 'N/A';
        
        // Best position
        const bestPosition = completedPositions.length > 0 ? Math.min(...completedPositions) : 'N/A';
        
        html += `
            <div class="pigeon-summary">
                <h3>
                    <i class="fas fa-dove"></i>
                    Ring Number: ${firstResult.ringNumber}
                </h3>
                <div class="pigeon-stats-grid">
                    <div class="pigeon-stat-item">
                        <div class="label">Loft Name</div>
                        <div class="value" style="font-size: 18px;">${firstResult.loftName}</div>
                    </div>
                    <div class="pigeon-stat-item">
                        <div class="label">Culture</div>
                        <div class="value" style="font-size: 18px;">
                            <span class="culture-badge culture-${firstResult.culture}">${firstResult.culture}</span>
                        </div>
                    </div>
                    <div class="pigeon-stat-item">
                        <div class="label">Total Races</div>
                        <div class="value">${totalRaces}</div>
                    </div>
                    <div class="pigeon-stat-item">
                        <div class="label">Completed</div>
                        <div class="value">${completedRaces}</div>
                    </div>
                    <div class="pigeon-stat-item">
                        <div class="label">Best Position</div>
                        <div class="value">${bestPosition}</div>
                    </div>
                    <div class="pigeon-stat-item">
                        <div class="label">Avg Position</div>
                        <div class="value">${avgPosition}</div>
                    </div>
                    <div class="pigeon-stat-item">
                        <div class="label">Top 3 Finishes</div>
                        <div class="value">${top3Finishes}</div>
                    </div>
                    <div class="pigeon-stat-item">
                        <div class="label">Top 10 Finishes</div>
                        <div class="value">${top10Finishes}</div>
                    </div>
                    <div class="pigeon-stat-item">
                        <div class="label">Avg Velocity</div>
                        <div class="value">${avgVelocity} <small style="font-size: 12px;">YPM</small></div>
                    </div>
                    <div class="pigeon-stat-item">
                        <div class="label">Club</div>
                        <div class="value" style="font-size: 18px;">${firstResult.club}</div>
                    </div>
                </div>
            </div>
            
            <div class="race-history-section">
                <h4><i class="fas fa-history"></i> Race History</h4>
                <table class="race-history-table">
                    <thead>
                        <tr>
                            <th>Position</th>
                            <th>Race Name</th>
                            <th>Date</th>
                            <th>Location</th>
                            <th>Distance (KM)</th>
                            <th>Trapping Time</th>
                            <th>Total Time</th>
                            <th>Velocity (YPM)</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        // Sort by date (most recent first)
        pigeonResults.sort((a, b) => new Date(b.raceDate) - new Date(a.raceDate));
        
        pigeonResults.forEach(result => {
            const positionClass = result.position === 1 ? 'gold' : 
                                 result.position === 2 ? 'silver' :
                                 result.position === 3 ? 'bronze' :
                                 result.position <= 10 ? 'top10' : 'other';
            
            const formattedDate = new Date(result.raceDate).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
            
            html += `
                <tr>
                    <td>
                        <span class="position-badge ${positionClass}">${result.position}</span>
                    </td>
                    <td><strong>${result.raceName}</strong></td>
                    <td>${formattedDate}</td>
                    <td>${result.raceLocation}</td>
                    <td>${result.raceDistance}</td>
                    <td>${result.trappingTime || '<span style="color: #a0aec0; font-style: italic;">Pending</span>'}</td>
                    <td><strong>${result.totalTime || '--:--:--'}</strong></td>
                    <td><span class="velocity-highlight">${result.velocity ? result.velocity.toFixed(4) : '--'}</span></td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
    });
    
    resultsContainer.innerHTML = html;
    showNotification(`Found ${results.length} race(s) for this pigeon`, 'success');
}

// Add Enter key support for ring search
document.addEventListener('DOMContentLoaded', function() {
    const ringSearchInput = document.getElementById('ringSearchInput');
    if (ringSearchInput) {
        ringSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchRingNumber();
            }
        });
    }
    
    // Close modal on outside click
    document.getElementById('ringSearchModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeRingSearchModal();
        }
    });
});
