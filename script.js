// User data structure
let userData = {
    telegramUID: '',
    lodPoints: 0,
    refereeCount: 0,
    tasks: {},
    referralTimestamp: null,
    verificationTimers: {}
};

// Available tasks
const tasks = [
    {
        id: "task1",
        name: 'Join Main Channel',
        reward: 50,
        channel: 'https://t.me/lodcoin_main'
    },
    {
        id: "task2",
        name: 'Join Announcement Channel',
        reward: 30,
        channel: 'https://t.me/lodcoin_announcements'
    }
];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    if (userData.telegramUID) {
        showHomePage();
    }
    resumeVerifications();
});

// Resume any pending verifications
function resumeVerifications() {
    if (!userData.verificationTimers) return;
    
    Object.entries(userData.verificationTimers).forEach(([taskId, endTime]) => {
        if (endTime) {
            const remainingTime = endTime - Date.now();
            if (remainingTime > 0) {
                startVerificationTimer(taskId, remainingTime);
            } else {
                completeVerification(taskId);
            }
        }
    });
}

// Start verification timer
function startVerificationTimer(taskId, duration = 30000) {
    // Store end time in userData
    userData.verificationTimers[taskId] = Date.now() + duration;
    saveUserData();

    // Update button to show countdown
    updateTaskButton(taskId, 'verifying', 'Verifying...');
    
    // Set timer to complete verification
    setTimeout(() => {
        completeVerification(taskId);
    }, duration);
}

// Complete verification process
function completeVerification(taskId) {
    if (!userData.tasks) userData.tasks = {};
    userData.tasks[taskId] = 'verified';
    delete userData.verificationTimers[taskId];
    saveUserData();
    
    updateTaskButton(taskId, 'verified', 'Claim');
    showAlert('Verification complete! Click Claim to receive your reward.', 3000);
}

// Registration function
function register() {
    const uidInput = document.getElementById('telegramUID');
    const uid = uidInput.value.trim();
    
    if (uid) {
        userData.telegramUID = uid;
        userData.lodPoints = 0;
        userData.refereeCount = 0;
        userData.tasks = {};
        userData.verificationTimers = {};
        saveUserData();
        showHomePage();
        showAlert('Registration successful!');
    } else {
        showAlert('Please enter your Telegram User ID');
    }
}

// Show homepage
function showHomePage() {
    document.getElementById('registrationPage').classList.remove('active');
    document.getElementById('homePage').classList.add('active');
    updateUI();
    populateTasks();
}

// Update UI elements
function updateUI() {
    document.getElementById('userUID').textContent = userData.telegramUID || '-';
    document.getElementById('pointsBalance').textContent = userData.lodPoints || 0;
    document.getElementById('refereeCount').textContent = userData.refereeCount || 0;
    document.getElementById('referralLink').value = userData.telegramUID ? 
        `https://t.me/lodcoin_bot/?start=${userData.telegramUID}` : '';
}

// Populate tasks
function populateTasks() {
    const tasksList = document.getElementById('tasksList');
    if (!tasksList) return;
    
    tasksList.innerHTML = '';
    
    tasks.forEach(task => {
        const isVerifying = userData.verificationTimers && userData.verificationTimers[task.id];
        const taskStatus = isVerifying ? 'verifying' : (userData.tasks[task.id] || 'pending');
        
        const buttonText = isVerifying ? 'Verifying...' :
                         taskStatus === 'completed' ? 'Claimed' :
                         taskStatus === 'verified' ? 'Claim' : 'Verify';
        
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        taskElement.innerHTML = `
            <div class="task-info">
                <h3>${task.name}</h3>
                <p>Reward: ${task.reward} LodPoints</p>
            </div>
            <button 
                class="task-button"
                data-task-id="${task.id}"
                ${taskStatus === 'completed' ? 'disabled' : ''}>
                ${buttonText}
            </button>
        `;
        tasksList.appendChild(taskElement);
    });

    // Add click event listeners to all task buttons
    document.querySelectorAll('.task-button').forEach(button => {
        button.addEventListener('click', function() {
            const taskId = this.dataset.taskId;
            handleTask(taskId);
        });
    });
}

// Update task button
function updateTaskButton(taskId, status, text) {
    const button = document.querySelector(`button[data-task-id="${taskId}"]`);
    if (button) {
        button.textContent = text;
        if (status === 'completed') {
            button.disabled = true;
        }
    }
}

// Handle task verification and completion
function handleTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
        console.error('Task not found:', taskId);
        return;
    }

    if (!userData.tasks) userData.tasks = {};
    if (!userData.verificationTimers) userData.verificationTimers = {};

    if (!userData.tasks[taskId] || userData.tasks[taskId] === 'pending') {
        // Open channel and start verification
        window.open(task.channel, '_blank');
        showAlert('Verification started! Please wait....', 3000);
        startVerificationTimer(taskId);
    } else if (userData.tasks[taskId] === 'verified') {
        // Claim reward
        userData.lodPoints = (userData.lodPoints || 0) + task.reward;
        userData.tasks[taskId] = 'completed';
        delete userData.verificationTimers[taskId];
        saveUserData();
        
        // Update UI
        updateUI();
        updateTaskButton(taskId, 'completed', 'Claimed');
        showAlert(`Congratulations! You've earned ${task.reward} LodPoints!`, 3000);
    }
}

// Copy referral link
function copyReferralLink() {
    const referralLink = document.getElementById('referralLink');
    referralLink.select();
    document.execCommand('copy');
    
    if (!userData.referralTimestamp) {
        userData.referralTimestamp = Date.now();
        saveUserData();
    }
    
    showAlert('Referral link copied!');
    checkReferralReward();
}

// Check and process referral reward
function checkReferralReward() {
    if (userData.referralTimestamp) {
        const twelveHours = 12 * 60 * 60 * 1000;
        const timeElapsed = Date.now() - userData.referralTimestamp;
        
        if (timeElapsed >= twelveHours) {
            userData.refereeCount = (userData.refereeCount || 0) + 1;
            userData.lodPoints = (userData.lodPoints || 0) + 100;
            userData.referralTimestamp = null;
            saveUserData();
            updateUI();
            showAlert('Referral reward claimed: +100 LodPoints!');
        }
    }
}

// Custom alert
function showAlert(message, duration = 3000) {
    const alert = document.getElementById('customAlert');
    if (!alert) return;
    
    const alertMessage = document.getElementById('alertMessage');
    if (!alertMessage) return;
    
    alertMessage.textContent = message;
    alert.classList.add('active');
    
    setTimeout(() => {
        alert.classList.remove('active');
    }, duration);
}

// Local storage functions
function saveUserData() {
    localStorage.setItem('lodcoinUserData', JSON.stringify(userData));
}

function loadUserData() {
    try {
        const saved = localStorage.getItem('lodcoinUserData');
        if (saved) {
            userData = JSON.parse(saved);
            // Ensure all required properties exist
            userData.tasks = userData.tasks || {};
            userData.verificationTimers = userData.verificationTimers || {};
            userData.lodPoints = userData.lodPoints || 0;
            userData.refereeCount = userData.refereeCount || 0;
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        userData = {
            telegramUID: '',
            lodPoints: 0,
            refereeCount: 0,
            tasks: {},
            referralTimestamp: null,
            verificationTimers: {}
        };
    }
}