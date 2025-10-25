// Firebase Configuration
// Replace these values with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyB-FKTO78_B8ed6u5vYc3Tx9WX-iSU_AAc",
  authDomain: "pegion-tracker.firebaseapp.com",
  projectId: "pegion-tracker",
  storageBucket: "pegion-tracker.firebasestorage.app",
  messagingSenderId: "670292019665",
  appId: "1:670292019665:web:c4789a76cc2365412138f0"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Firebase Database Service
class FirebaseService {
    constructor() {
        this.db = db;
        this.racesCollection = 'races';
    }

    // Get all races
    async getAllRaces() {
        try {
            const snapshot = await this.db.collection(this.racesCollection).get();
            const races = [];
            snapshot.forEach(doc => {
                races.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            return races;
        } catch (error) {
            console.error('Error getting races:', error);
            throw error;
        }
    }

    // Add a new race
    async addRace(raceData) {
        try {
            const docRef = await this.db.collection(this.racesCollection).add({
                ...raceData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return docRef.id;
        } catch (error) {
            console.error('Error adding race:', error);
            throw error;
        }
    }

    // Update a race
    async updateRace(raceId, raceData) {
        try {
            await this.db.collection(this.racesCollection).doc(raceId).update({
                ...raceData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (error) {
            console.error('Error updating race:', error);
            throw error;
        }
    }

    // Delete a race
    async deleteRace(raceId) {
        try {
            await this.db.collection(this.racesCollection).doc(raceId).delete();
            return true;
        } catch (error) {
            console.error('Error deleting race:', error);
            throw error;
        }
    }

    // Get a specific race
    async getRace(raceId) {
        try {
            const doc = await this.db.collection(this.racesCollection).doc(raceId).get();
            if (doc.exists) {
                return {
                    id: doc.id,
                    ...doc.data()
                };
            } else {
                throw new Error('Race not found');
            }
        } catch (error) {
            console.error('Error getting race:', error);
            throw error;
        }
    }

    // Listen to real-time updates for all races
    onRacesSnapshot(callback) {
        return this.db.collection(this.racesCollection)
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const races = [];
                snapshot.forEach(doc => {
                    races.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                callback(races);
            }, error => {
                console.error('Error listening to races:', error);
            });
    }

    // Listen to real-time updates for a specific race
    onRaceSnapshot(raceId, callback) {
        return this.db.collection(this.racesCollection).doc(raceId)
            .onSnapshot(doc => {
                if (doc.exists) {
                    callback({
                        id: doc.id,
                        ...doc.data()
                    });
                }
            }, error => {
                console.error('Error listening to race:', error);
            });
    }
}

// Create global Firebase service instance
window.firebaseService = new FirebaseService();

// Connection status indicator
let isOnline = true;
let connectionStatusElement = null;

// Check Firebase connection status
function checkFirebaseConnection() {
    const connectedRef = firebase.database().ref('.info/connected');
    connectedRef.on('value', (snapshot) => {
        isOnline = snapshot.val() === true;
        updateConnectionStatus();
    });
}

// Update connection status UI
function updateConnectionStatus() {
    if (!connectionStatusElement) {
        connectionStatusElement = document.createElement('div');
        connectionStatusElement.id = 'connection-status';
        connectionStatusElement.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            z-index: 1001;
            transition: all 0.3s ease;
        `;
        document.body.appendChild(connectionStatusElement);
    }

    if (isOnline) {
        connectionStatusElement.textContent = '🟢 Online';
        connectionStatusElement.style.background = '#c6f6d5';
        connectionStatusElement.style.color = '#2f855a';
        connectionStatusElement.style.border = '2px solid #9ae6b4';
    } else {
        connectionStatusElement.textContent = '🔴 Offline';
        connectionStatusElement.style.background = '#fed7d7';
        connectionStatusElement.style.color = '#c53030';
        connectionStatusElement.style.border = '2px solid #feb2b2';
    }
}

// Initialize connection monitoring when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Note: Firebase Realtime Database is needed for connection monitoring
    // For Firestore-only projects, you can remove this or implement alternative connection checking
    try {
        checkFirebaseConnection();
    } catch (error) {
        console.log('Connection monitoring not available (Firestore-only project)');
    }
});