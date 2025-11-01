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
    setupEventListeners();

    // Check for stored authentication
    checkStoredAuth();

    try {
        // Try to initialize Firebase
        await initializeFirebase();
    } catch (error) {
        console.warn('Firebase initialization failed, using local storage:', error);
        // Fallback to local storage
        loadFromLocalStorage();
        populateRaceSelector();
        if (races.length > 0) {
            currentRaceId = races[0].id;
            document.getElementById('raceSelect').value = currentRaceId;
            switchRace();
        }
    }
}

async function initializeFirebase() {
    if (!window.firebaseService) {
        throw new Error('Firebase service not available');
    }

    try {
        // Test Firebase connection by trying to get races
        races = await window.firebaseService.getAllRaces();
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
    const editButtons = document.querySelectorAll('#editRaceBtn, #copyRaceBtn, #deleteRaceBtn, #addEntryBtn');
    const raceBtn = document.querySelector('.race-btn');
    const actionsHeader = document.querySelector('.actions-header');

    if (isAuthenticated) {
        editButtons.forEach(btn => btn.style.display = 'inline-block');
        raceBtn.style.display = 'inline-block';
        if (actionsHeader) actionsHeader.style.display = 'table-cell';
    } else {
        editButtons.forEach(btn => btn.style.display = 'none');
        raceBtn.style.display = 'none';
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
            <td style="text-align: center;">${entry.trappingTime}</td>
            <td style="text-align: center;"><strong>${entry.totalTime}</strong></td>
            <td style="text-align: center;">${entry.second || 0}</td>
            <td style="text-align: center;">${entry.minute || 0}</td>
            <td style="text-align: center;">${entry.velocity.toFixed(4)}</td>
            <td style="text-align: center;"><span class="club-badge">${entry.club}</span></td>
        `;

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
    const totalPigeons = entries.length;
    const completedRaces = entries.filter(entry => entry.totalTime !== '--:--').length;

    // Count unique participants (loft names)
    const uniqueParticipants = [...new Set(entries.map(entry => entry.loftName))].length;

    // Calculate average time
    let avgTime = '--:--';
    if (completedRaces > 0) {
        const totalSeconds = entries
            .filter(entry => entry.second)
            .reduce((sum, entry) => sum + entry.second, 0);
        const avgSeconds = Math.floor(totalSeconds / completedRaces);
        const minutes = Math.floor(avgSeconds / 60);
        const seconds = avgSeconds % 60;
        avgTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    document.getElementById('totalParticipants').textContent = uniqueParticipants;
    document.getElementById('totalPigeons').textContent = totalPigeons;
    document.getElementById('completedRaces').textContent = completedRaces;
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
            document.getElementById('deleteRaceBtn').disabled = false;
        } else {
            document.getElementById('addEntryBtn').disabled = true;
            document.getElementById('editRaceBtn').disabled = true;
            document.getElementById('copyRaceBtn').disabled = true;
            document.getElementById('deleteRaceBtn').disabled = true;
        }

        // Load race data
        loadData();
        updateStats();
        populateFilters();
    } else {
        currentRaceId = null;
        document.getElementById('currentRaceInfo').textContent = 'Select a race to view';
        document.getElementById('raceHeaderSection').style.display = 'none';
        document.getElementById('addEntryBtn').disabled = true;
        document.getElementById('editRaceBtn').disabled = true;
        document.getElementById('copyRaceBtn').disabled = true;
        document.getElementById('deleteRaceBtn').disabled = true;
        document.getElementById('downloadBtn').disabled = true;

        // Clear table
        document.getElementById('tableBody').innerHTML = '';
        updateStats();
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

    // Update header elements
    document.getElementById('headerReleaseTime').textContent = formattedTime;
    document.getElementById('headerParticipants').textContent = entries.length;
    document.getElementById('headerParticipantCount').textContent = uniqueParticipants;
    document.getElementById('headerRaceName').textContent = race.name;
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
    if (!originalRace) return;

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
        // Create the new race first
        let newRaceId;
        if (isFirebaseEnabled) {
            newRaceId = await window.firebaseService.addRace(newRaceData);
        } else {
            newRaceId = Date.now().toString();
            const newRace = {
                id: newRaceId,
                ...newRaceData
            };
            races.push(newRace);
        }

        // Copy all entries from original race
        const copiedEntries = originalRace.entries.map(entry => ({
            ...entry,
            id: Date.now() + Math.random(), // Generate new unique ID
            // Recalculate times and velocity based on new race parameters
        }));

        // Recalculate all entries for the new race parameters
        copiedEntries.forEach(entry => {
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
            }
        });

        // Sort by velocity and update positions
        copiedEntries.sort((a, b) => {
            if (b.velocity !== a.velocity) {
                return b.velocity - a.velocity;
            }
            return a.second - b.second;
        });

        copiedEntries.forEach((entry, index) => {
            entry.position = index + 1;
        });

        // Update the race with copied entries
        if (isFirebaseEnabled) {
            const raceToUpdate = { ...newRaceData, entries: copiedEntries };
            await window.firebaseService.updateRace(newRaceId, raceToUpdate);
        } else {
            const raceIndex = races.findIndex(r => r.id === newRaceId);
            if (raceIndex !== -1) {
                races[raceIndex].entries = copiedEntries;
            }
            saveToLocalStorage();
            populateRaceSelector();
        }

        // Switch to the new race
        currentRaceId = newRaceId;

        closeCopyRaceModal();
        showNotification(`Race copied successfully with ${copiedEntries.length} entries`, 'success');

        // Wait for Firebase update, then select the new race
        setTimeout(() => {
            document.getElementById('raceSelect').value = currentRaceId;
            switchRace();
        }, 500);

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
    document.getElementById('trappingTime').value = entry.trappingTime;
    document.getElementById('club').value = entry.club;

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

    const formData = {
        name: document.getElementById('raceName').value,
        date: document.getElementById('raceDate').value,
        location: document.getElementById('raceLocation').value,
        distance: parseFloat(document.getElementById('raceDistance').value),
        releaseTime: document.getElementById('raceReleaseTime').value,
        visibility: document.getElementById('raceVisibility').value,
        season: document.getElementById('raceSeason').value,
        entries: []
    };

    try {
        if (editingRaceId) {
            // Update existing race
            if (isFirebaseEnabled) {
                await window.firebaseService.updateRace(editingRaceId, formData);
                showNotification('Race updated successfully', 'success');
            } else {
                const raceIndex = races.findIndex(r => r.id === editingRaceId);
                if (raceIndex !== -1) {
                    races[raceIndex] = {
                        ...races[raceIndex],
                        ...formData
                    };
                }
                saveToLocalStorage();
                populateRaceSelector();
            }
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

    } catch (error) {
        console.error('Error saving race:', error);
        showNotification('Error saving race: ' + error.message, 'error');
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const race = getCurrentRace();
    if (!race) return;

    const entryDistanceValue = document.getElementById('entryDistance').value;
    const trappingTimeStr = document.getElementById('trappingTime').value;

    if (!trappingTimeStr) {
        alert('Please enter the trapping time');
        return;
    }

    const formData = {
        loftName: document.getElementById('loftName').value,
        ringNumber: document.getElementById('ringNumber').value,
        culture: document.getElementById('culture').value,
        distance: entryDistanceValue ? parseFloat(entryDistanceValue) : null,
        trappingTime: trappingTimeStr,
        club: document.getElementById('club').value
    };

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

    const totalTime = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    const totalSeconds = Math.floor(timeDiff / 1000);
    const totalMinutes = Math.floor(timeDiff / (1000 * 60));

    // Calculate velocity with precise timing (distance in km / time in hours)
    // Convert to YPM (Yards Per Minute) - 1 km = 1093.61 yards
    const timeInHours = timeDiff / (1000 * 60 * 60);
    const velocityKmH = distanceToUse / timeInHours;
    const velocity = velocityKmH * 18.2269; // Convert km/h to YPM (1 km/h = 18.2269 YPM)

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
        race.entries.push(newEntry);
    }

    // Sort by velocity (highest velocity = fastest = position 1) and recalculate positions
    race.entries.sort((a, b) => {
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

    closeModal();
    loadData();
    updateStats();
    populateFilters();
    await saveRaceData(race);
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
                            club: "CNRPA"
                        },
                        {
                            id: 2,
                            position: 2,
                            loftName: "rajib a samad loft",
                            ringNumber: "24-52305-c",
                            culture: "cheq",
                            trappingTime: "08:56:53",
                            totalTime: "0:51:53",
                            second: 3113,
                            minute: 52,
                            velocity: 1482.8595,
                            club: "CNRPA"
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
                            club: "CNRPA"
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

        // Add logo to PDF (using existing logo from page if available)
        try {
            const logoElement = document.querySelector('.race-header-logo');
            if (logoElement && logoElement.complete) {
                // Create canvas to convert logo to base64
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 100;
                canvas.height = 100;

                // Draw the logo
                ctx.drawImage(logoElement, 0, 0, 100, 100);
                const logoDataUrl = canvas.toDataURL('image/jpeg', 0.8);

                // Add to PDF
                doc.addImage(logoDataUrl, 'JPEG', 20, 5, 30, 30);
            } else {
                // Fallback: simple logo placeholder
                doc.setFillColor(102, 126, 234);
                doc.circle(35, 20, 15, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(12);
                doc.text('LOGO', 35, 25, { align: 'center' });
            }
        } catch (error) {
            console.warn('Could not add logo to PDF, using placeholder:', error);
            // Fallback: simple logo placeholder
            doc.setFillColor(102, 126, 234);
            doc.circle(35, 20, 15, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(12);
            doc.text('LOGO', 35, 25, { align: 'center' });
        }

        // Header with professional styling
        doc.setFontSize(16);
        doc.setTextColor(102, 126, 234);
        doc.text('CHAPAINAWABGANJ RACING PIGEON ASSOCIATION', 148, 15, { align: 'center' });

        // Subtitle
        doc.setFontSize(10);
        doc.setTextColor(128, 128, 128);
        doc.text('Since 2023 - Professional Pigeon Racing Management', 148, 22, { align: 'center' });


        // Race details in a more compact format
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);

        // Left column
        doc.text(`Release Time: ${race.releaseTime}:00 AM`, 20, 30);
        doc.text(`Number Of P: ${getCurrentRaceEntries().length}`, 20, 37);
        doc.text(`No.Of Participant: ${[...new Set(getCurrentRaceEntries().map(entry => entry.loftName))].length}`, 20, 44);

        // Center - Race name badge
        doc.setFillColor(220, 38, 38);
        doc.rect(120, 25, 56, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.text(race.name, 148, 33, { align: 'center' });
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text(race.season || '2024-2025', 148, 42, { align: 'center' });

        // Right column
        const date = new Date(race.date);
        const formattedDate = date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).toUpperCase().replace(/(\d+)/, '$1TH');

        doc.text(`Date: ${formattedDate}`, 200, 30);
        doc.text(`Visibility: ${race.visibility}`, 200, 37);
        doc.text(`Registered Pigeon: ${getCurrentRaceEntries().length}`, 200, 44);

        // Get all entries for the table
        const entries = getCurrentRaceEntries();

        // Table headers matching the exact format
        const headers = [
            ['POSITION', 'S/L', "Loft's Name", 'Ban Ring No', 'Culture', 'Distance\n(KM)', 'Release\nTime', 'Trapping\nTime', 'Total Time', 'Second', 'Minute', 'Velocity\n(YPM)', 'Club\nName']
        ];

        // Table data with proper formatting
        const tableData = entries.map(entry => {
            const entryDistance = entry.distance || race.distance;
            return [
                entry.position, // POSITION
                entry.position, // S/L
                entry.loftName, // Loft's Name
                entry.ringNumber, // Ban Ring No
                entry.culture.toLowerCase(), // Culture
                entryDistance, // Distance
                race.releaseTime, // Release Time
                entry.trappingTime, // Trapping Time
                entry.totalTime, // Total Time
                entry.second || 0, // Second
                entry.minute || 0, // Minute
                entry.velocity.toFixed(4), // Velocity
                entry.club // Club Name
            ];
        });

        // Generate table with proper styling
        doc.autoTable({
            head: headers,
            body: tableData,
            startY: 55,
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
                0: { fillColor: [74, 85, 104], textColor: 255, halign: 'center', cellWidth: 18 }, // POSITION
                1: { halign: 'center', cellWidth: 12 }, // S/L
                2: { halign: 'left', cellWidth: 35 }, // Loft's Name
                3: { halign: 'center', cellWidth: 25 }, // Ban Ring No
                4: { halign: 'center', cellWidth: 15 }, // Culture
                5: { halign: 'center', cellWidth: 18 }, // Distance
                6: { halign: 'center', cellWidth: 18 }, // Release Time
                7: { halign: 'center', cellWidth: 18 }, // Trapping Time
                8: { halign: 'center', cellWidth: 20 }, // Total Time
                9: { halign: 'center', cellWidth: 15 }, // Second
                10: { halign: 'center', cellWidth: 15 }, // Minute
                11: { halign: 'center', cellWidth: 20 }, // Velocity
                12: { halign: 'center', cellWidth: 15 } // Club Name
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
                        case 'chek':
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
    try {
        if (isFirebaseEnabled) {
            await window.firebaseService.updateRace(race.id, race);
        } else {
            saveToLocalStorage();
        }
    } catch (error) {
        console.error('Error saving race data:', error);
        showNotification('Error saving data: ' + error.message, 'error');
    }
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
