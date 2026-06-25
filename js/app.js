/**
 * app.js
 * Main UI Logic for CivicAI Grievance Management
 */

// --- State Management ---
let complaints = [];

// Load from localStorage if available
try {
    const saved = localStorage.getItem('civicAI_complaints');
    if (saved) {
        complaints = JSON.parse(saved);
    }
} catch (e) {
    console.error('Could not load complaints', e);
}

function saveComplaints() {
    localStorage.setItem('civicAI_complaints', JSON.stringify(complaints));
    updateDashboard();
}

// --- DOM Elements ---
const btnCitizen = document.getElementById('btn-citizen');
const btnAuthority = document.getElementById('btn-authority');
const viewCitizen = document.getElementById('view-citizen');
const viewAuthority = document.getElementById('view-authority');

const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');

const complaintsGrid = document.getElementById('complaints-grid');
const filterDept = document.getElementById('filter-dept');

// Stats
const statTotal = document.getElementById('stat-total');
const statHigh = document.getElementById('stat-high');
const statResolved = document.getElementById('stat-resolved');
const locationBtn = document.getElementById('location-btn');

let currentLocation = null;

locationBtn.addEventListener('click', () => {
    if ("geolocation" in navigator) {
        locationBtn.style.color = 'var(--accent)';
        navigator.geolocation.getCurrentPosition((position) => {
            currentLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            addMessage(`Location attached: ${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`, 'bot');
            locationBtn.style.color = 'var(--resolved)';
        }, (error) => {
            addMessage(`Error getting location: ${error.message}`, 'bot');
            locationBtn.style.color = 'var(--text-muted)';
        });
    } else {
        addMessage("Geolocation is not supported by your browser.", "bot");
    }
});

// --- Navigation Logic ---
function switchView(viewName) {
    if (viewName === 'citizen') {
        btnCitizen.classList.add('active');
        btnAuthority.classList.remove('active');
        viewCitizen.classList.add('active');
        viewCitizen.classList.remove('hidden');
        viewAuthority.classList.remove('active');
        viewAuthority.classList.add('hidden');
        
        // Scroll chat to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } else {
        btnAuthority.classList.add('active');
        btnCitizen.classList.remove('active');
        viewAuthority.classList.add('active');
        viewAuthority.classList.remove('hidden');
        viewCitizen.classList.remove('active');
        viewCitizen.classList.add('hidden');
        
        updateDashboard();
    }
}

btnCitizen.addEventListener('click', () => switchView('citizen'));
btnAuthority.addEventListener('click', () => switchView('authority'));

// --- Chat Logic ---

function addMessage(text, sender, aiData = null) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}-message`;
    
    let innerHTML = `<div class="message-bubble">${text}</div>`;
    
    // Add AI Card if available
    if (aiData) {
        let pColor = aiData.priority === 'high' ? '#ef4444' : (aiData.priority === 'med' ? '#f59e0b' : '#10b981');
        innerHTML += `
            <div class="message-ai-card">
                <strong>ID:</strong> ${aiData.id} <br>
                <strong>Routed to:</strong> ${aiData.department} Dept. <br>
                <strong>Priority:</strong> <span style="color:${pColor}; text-transform:uppercase;">${aiData.priority}</span>
            </div>
        `;
    }
    
    msgDiv.innerHTML = innerHTML;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message';
    typingDiv.id = 'typing-indicator-wrapper';
    typingDiv.innerHTML = `
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTyping() {
    const typing = document.getElementById('typing-indicator-wrapper');
    if (typing) {
        typing.remove();
    }
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    // Add user message
    addMessage(text, 'user');
    chatInput.value = '';

    // Show typing
    showTyping();

    // Call AI Mock
    try {
        const result = await window.AI.analyzeComplaint(text);
        
        if (currentLocation) {
            result.location = currentLocation;
        }

        hideTyping();
        
        // Save to state
        complaints.unshift(result);
        saveComplaints();
        
        // Bot response
        addMessage(`Thank you. Your report has been analyzed and forwarded.`, 'bot', result);

        // Determine API URL based on environment
        const isLocalFile = window.location.protocol === 'file:';
        const apiUrl = isLocalFile ? 'http://localhost:3000/api/send-email' : '/api/send-email';

        // Send email via backend
        try {
            await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: result.id,
                    text: result.originalText,
                    department: result.department,
                    priority: result.priority,
                    location: currentLocation
                })
            });
        } catch (emailErr) {
            console.error("Failed to send email via backend", emailErr);
        }

        // Reset location for next complaint
        currentLocation = null;
        locationBtn.style.color = 'var(--text-muted)';
        
    } catch (err) {
        hideTyping();
        addMessage("Sorry, I encountered an error processing that.", "bot");
    }
});

// --- Dashboard Logic ---

function createCard(complaint) {
    const template = document.getElementById('card-template');
    const clone = template.content.cloneNode(true);
    const card = clone.querySelector('.complaint-card');
    
    card.classList.add(`priority-${complaint.priority}`);
    if (complaint.status === 'Resolved') {
        card.classList.add('resolved');
    }

    clone.querySelector('.complaint-id').textContent = complaint.id;
    
    const badge = clone.querySelector('.priority-badge');
    badge.textContent = complaint.priority;
    badge.classList.add(complaint.priority);

    clone.querySelector('.complaint-summary').textContent = complaint.summary;
    clone.querySelector('.complaint-desc').textContent = complaint.originalText;
    clone.querySelector('.dept-name').textContent = complaint.department;

    const resolveBtn = clone.querySelector('.resolve-btn');
    if (complaint.status === 'Resolved') {
        resolveBtn.textContent = 'Resolved';
    } else {
        resolveBtn.addEventListener('click', () => {
            complaint.status = 'Resolved';
            saveComplaints();
            updateDashboard();
        });
    }

    return card;
}

function updateDashboard() {
    const filter = filterDept.value;
    
    // Clear grid
    complaintsGrid.innerHTML = '';
    
    let total = 0;
    let high = 0;
    let resolved = 0;

    complaints.forEach(c => {
        // Stats
        total++;
        if (c.priority === 'high' && c.status !== 'Resolved') high++;
        if (c.status === 'Resolved') resolved++;

        // Filter
        if (filter !== 'All' && c.department !== filter) return;

        complaintsGrid.appendChild(createCard(c));
    });

    statTotal.textContent = total;
    statHigh.textContent = high;
    statResolved.textContent = resolved;
}

filterDept.addEventListener('change', updateDashboard);

// Init
updateDashboard();
