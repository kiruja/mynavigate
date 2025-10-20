document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const subjectItems = document.querySelectorAll('.subject-item');
    const calendar = document.getElementById('sessionCalendar');
    const timeSlots = document.getElementById('timeSlots');
    const calendarGrid = document.querySelector('.calendar-grid');
    const upcomingSessionsContainer = document.getElementById('upcomingSessionsContainer');
    const bookNewBtn = document.getElementById('bookNewBtn');
    const bookingContainer = document.getElementById('bookingContainer');
    const backToSessions = document.getElementById('backToSessions');
    const subscribeBtn = document.createElement('button');
    subscribeBtn.className = 'subscribe-btn';

    // Pagination setup
    const sessionsPerPage = 5;
    let currentPage = 1;
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    const upcomingSessions = document.querySelector('.upcoming-sessions');

    // State
    let selectedSubject = '';
    let selectedDate = '';
    let selectedTime = '';
    let isUpcomingMinimized = false;

    function updatePagination() {
        const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
        const totalPages = Math.ceil(sessions.length / sessionsPerPage);
        
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;

        // Display current page sessions
        const start = (currentPage - 1) * sessionsPerPage;
        const end = start + sessionsPerPage;
        const currentSessions = sessions.slice(start, end);

        // Clear current display
        upcomingSessions.innerHTML = '';

        // Add current page sessions
        currentSessions.forEach(session => {
            const sessionCard = createSessionCard(session);
            upcomingSessions.appendChild(sessionCard);
        });
    }

    function createSessionCard(session) {
        const card = document.createElement('div');
        card.className = 'session-card';
        card.innerHTML = `
            <div class="session-info">
                <h4>${session.subject.charAt(0).toUpperCase() + session.subject.slice(1)}</h4>
                <p class="session-date">${session.date} - ${session.time}</p>
            </div>
            <button class="join-session-btn">
                <span class="material-icons">video_call</span>
                Join
            </button>
        `;

        card.querySelector('.join-session-btn').addEventListener('click', function() {
            const joinUrl = new URL('../pages/join-session.html', window.location.href);
            joinUrl.searchParams.set('subject', session.subject);
            joinUrl.searchParams.set('date', session.date);
            joinUrl.searchParams.set('time', session.time);
            joinUrl.searchParams.set('meetLink', session.meetLink);
            window.location.href = joinUrl.toString();
        });

        return card;
    }

    // Initialize event listeners
    function initializeEventListeners() {
        // Pagination event listeners
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                updatePagination();
            }
        });

        nextPageBtn.addEventListener('click', () => {
            const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
            const totalPages = Math.ceil(sessions.length / sessionsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                updatePagination();
            }
        });

        // Subject selection handling
        subjectItems.forEach(item => {
            item.addEventListener('click', handleSubjectSelection);
        });

        // Book new session button
        bookNewBtn.addEventListener('click', handleBookNewSession);

        // Back to sessions button
        backToSessions.addEventListener('click', handleBackToSessions);

        // Time slots
        document.querySelectorAll('.time-slot').forEach(slot => {
            slot.addEventListener('click', handleTimeSlotSelection);
        });

        // Subscribe button
        subscribeBtn.addEventListener('click', handleSubscribe);
    }

    // Event handlers
    function handleSubjectSelection() {
        subjectItems.forEach(si => si.classList.remove('active'));
        this.classList.add('active');
        selectedSubject = this.dataset.subject;
        
        calendar.style.display = 'block';
        calendar.classList.add('active');
        timeSlots.classList.remove('active');
        timeSlots.style.display = 'none';
        
        generateCalendar();
        calendar.scrollIntoView({ behavior: 'smooth' });
    }

    function handleBookNewSession() {
        upcomingSessionsContainer.style.display = 'none';
        bookingContainer.style.display = 'block';
        bookingContainer.classList.add('active');
        
        resetBookingForm();
        document.querySelector('.subject-selection').style.display = 'block';
        calendar.style.display = 'none';
        timeSlots.style.display = 'none';
    }

    function handleBackToSessions() {
        bookingContainer.style.display = 'none';
        bookingContainer.classList.remove('active');
        upcomingSessionsContainer.style.display = 'block';
        resetBookingForm();
    }

    function handleTimeSlotSelection() {
        if (!selectedSubject || !selectedDate) return;

        const allSlots = document.querySelectorAll('.time-slot');
        allSlots.forEach(s => s.classList.remove('selected'));
        this.classList.add('selected');
        selectedTime = this.textContent.trim();

        showConfirmationMessage();
    }

    function showConfirmationMessage() {
        const confirmationDiv = document.createElement('div');
        confirmationDiv.className = 'confirmation-message';
        confirmationDiv.innerHTML = `
            <div class="confirmation-content">
                <h3>Confirm Your Live Session</h3>
                <div class="session-details">
                    <p><strong>Subject:</strong> ${selectedSubject}</p>
                    <p><strong>Date:</strong> ${selectedDate}</p>
                    <p><strong>Time:</strong> ${selectedTime}</p>
                </div>
                <div class="confirmation-buttons">
                    <button class="confirm-btn" id="confirmSession">
                        <span class="material-icons">check_circle</span>
                        Confirm Session
                    </button>
                    <button class="cancel-btn" id="cancelSession">
                        <span class="material-icons">cancel</span>
                        Cancel
                    </button>
                </div>
            </div>
        `;

        // Remove any existing confirmation message
        const existingMessage = document.querySelector('.confirmation-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Add the new confirmation message
        timeSlots.appendChild(confirmationDiv);

        // Add event listeners to the buttons
        document.getElementById('confirmSession').addEventListener('click', function() {
            const meetLink = generateMeetLink();
            saveSession(meetLink);
            
            // Show success message
            confirmationDiv.innerHTML = `
                <div class="confirmation-content success">
                    <span class="material-icons success-icon">check_circle</span>
                    <h3>Session Booked Successfully!</h3>
                    <p>Your live session has been confirmed.</p>
                    <div class="confirmation-buttons">
                        <button class="join-btn" onclick="navigateToJoinSession('${meetLink}')">
                            <span class="material-icons">video_call</span>
                            Join Session
                        </button>
                    </div>
                </div>
            `;
        });

        document.getElementById('cancelSession').addEventListener('click', function() {
            confirmationDiv.remove();
            const selectedSlot = document.querySelector('.time-slot.selected');
            if (selectedSlot) {
                selectedSlot.classList.remove('selected');
            }
            selectedTime = '';
        });

        // Scroll to the confirmation message
        confirmationDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function showBookingMessage() {
        const bookingMessageDiv = document.querySelector('.booking-message') || createBookingMessageDiv();
        bookingMessageDiv.innerHTML = generateBookingMessageHTML();
        bookingMessageDiv.style.display = 'block';
        
        setTimeout(() => {
            bookingMessageDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);

        const confirmBtn = bookingMessageDiv.querySelector('.confirm-booking-btn');
        confirmBtn.addEventListener('click', handleConfirmBooking);
    }

    function createBookingMessageDiv() {
        const div = document.createElement('div');
        div.className = 'booking-message';
        timeSlots.appendChild(div);
        return div;
    }

    function generateBookingMessageHTML() {
        return `
            <div class="booking-summary">
                <h3>Booking Summary</h3>
                <div>
                    <p><strong>Subject:</strong> ${selectedSubject}</p>
                    <p><strong>Date:</strong> ${selectedDate}</p>
                    <p><strong>Time:</strong> ${selectedTime}</p>
                </div>
                <button class="confirm-booking-btn">
                    <span class="material-icons">check_circle</span>
                    Confirm Booking
                </button>
            </div>
        `;
    }

    function handleConfirmBooking() {
        const meetLink = generateMeetLink();
        saveSession(meetLink);
        navigateToJoinSession(meetLink);
    }

    function generateMeetLink() {
        const chars = 'abcdefghijklmnopqrstuvwxyz';
        let link = 'meet.google.com/';
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3 + Math.floor(Math.random() * 2); j++) {
                link += chars[Math.floor(Math.random() * chars.length)];
            }
            if (i < 2) link += '-';
        }
        return link;
    }

    function saveSession(meetLink) {
        const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
        sessions.push({
            subject: selectedSubject,
            date: selectedDate,
            time: selectedTime,
            meetLink: meetLink
        });
        localStorage.setItem('sessions', JSON.stringify(sessions));
    }

    function navigateToJoinSession(meetLink) {
        const joinUrl = new URL('../pages/join-session.html', window.location.href);
        joinUrl.searchParams.set('subject', selectedSubject);
        joinUrl.searchParams.set('date', selectedDate);
        joinUrl.searchParams.set('time', selectedTime);
        joinUrl.searchParams.set('meetLink', meetLink);
        window.location.href = joinUrl.toString();
    }

    function resetBookingForm() {
        selectedSubject = '';
        selectedDate = '';
        selectedTime = '';
        subjectItems.forEach(i => i.classList.remove('selected'));
        calendar.classList.remove('active');
        timeSlots.classList.remove('active');
        subscribeBtn.classList.remove('active');
        const successMessage = document.querySelector('.success-message');
        if (successMessage) successMessage.classList.remove('active');
        const successActions = document.querySelector('.success-actions');
        if (successActions) successActions.classList.remove('active');
    }

    // Initialize the page
    function init() {
        updatePagination();
        initializeEventListeners();
        bookingContainer.style.display = 'none';
    }

    init();
});