/**
 * ============================================================================
 * ANSWER-KEY.JS - Answer Key Page Logic
 * ============================================================================
 * 
 * This file handles all functionality for the answer key page:
 * - Loading test data from sessionStorage
 * - Displaying all questions with correct answers
 * - Highlighting user's answers (correct/incorrect)
 * - Navigation back to result page
 * 
 * Dependencies: registry.js, common.js
 * ============================================================================
 */

/* ============================================================================
   DOM ELEMENT SELECTORS
   ============================================================================ */

const answerKeyContent = document.getElementById('answer-key-content');
const navigatorGrid = document.getElementById('navigator-grid');
const backToResultBtn = document.getElementById('back-to-result-btn');

/* ============================================================================
   INITIALIZATION
   ============================================================================ */

/**
 * Initialize the answer key page
 * Loads test data and displays answer key
 */
function init() {
    // Load test data from sessionStorage
    const testData = loadTestData();
    if (!testData) {
        alert('No test data found. Returning to home page.');
        window.location.href = '../index.html';
        return;
    }

    // Set global variables from test data
    questions = testData.questions;
    userAnswers = testData.userAnswers;

    // Display answer key
    displayAnswerKey();
}

/* ============================================================================
   ANSWER KEY DISPLAY
   ============================================================================ */

/**
 * Display all questions with correct answers and user's responses
 */
function displayAnswerKey() {
    answerKeyContent.innerHTML = '';
    navigatorGrid.innerHTML = '';

    questions.forEach((q, index) => {
        const answer = userAnswers[q.uniqueId] || userAnswers[q.id];
        const userSelectedIndex = answer ? answer.selectedIndex : null;
        const correctIndex = q.correct;

        // Determine status
        let status = 'skipped';
        if (userSelectedIndex !== null) {
            status = userSelectedIndex === correctIndex ? 'correct' : 'incorrect';
        }

        // Create question card
        const questionCard = document.createElement('div');
        questionCard.className = 'answer-key-question';
        questionCard.id = `question-${index}`;
        questionCard.dataset.index = index;

        // Question header
        const header = document.createElement('div');
        header.className = 'answer-key-question-header';
        header.innerHTML = `
            <div class="answer-key-question-number">Question ${index + 1}</div>
            <div class="answer-key-status ${status}">
                <i class="fas ${status === 'correct' ? 'fa-circle-check' : (status === 'incorrect' ? 'fa-circle-xmark' : 'fa-circle-question')}"></i>
                ${status.charAt(0).toUpperCase() + status.slice(1)}
            </div>
        `;
        questionCard.appendChild(header);

        // Question text
        const questionTextEl = document.createElement('div');
        questionTextEl.className = 'answer-key-question-text';
        questionTextEl.textContent = q.question;
        questionCard.appendChild(questionTextEl);

        // Options
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'answer-key-options';

        q.options.forEach((option, i) => {
            const optionEl = document.createElement('div');
            optionEl.className = 'answer-key-option';

            // Apply classes based on correct answer and user's answer
            if (i === correctIndex) {
                optionEl.classList.add('correct-answer');
            }
            if (i === userSelectedIndex) {
                optionEl.classList.add('user-answer');
            }

            // Option content
            const optionLabel = String.fromCharCode(65 + i); // A, B, C, D
            const icon = i === correctIndex ? '<i class="fas fa-check answer-key-option-icon"></i>' :
                (i === userSelectedIndex ? '<i class="fas fa-times answer-key-option-icon"></i>' : '');

            optionEl.innerHTML = `
                <span class="answer-key-option-label">${optionLabel}.</span>
                <span class="answer-key-option-text">${option}</span>
                ${icon}
            `;

            optionsContainer.appendChild(optionEl);
        });

        questionCard.appendChild(optionsContainer);
        answerKeyContent.appendChild(questionCard);

        // Create navigator button
        const navBtn = document.createElement('button');
        navBtn.className = `nav-item ${status}`;
        navBtn.textContent = index + 1;
        navBtn.id = `nav-item-${index}`;
        navBtn.onclick = () => {
            // Manually highlight immediately for better UX
            document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
            navBtn.classList.add('active');

            questionCard.scrollIntoView({ behavior: 'auto', block: 'start' });
        };
        navigatorGrid.appendChild(navBtn);
    });

    // Setup intersection observer for highlighting current question
    setupScrollHighlighting();
}

/**
 * Highlighting the navigator button for the question currently in view
 */
function setupScrollHighlighting() {
    const container = document.querySelector('.answer-key-container');
    const options = {
        root: container,
        threshold: [0, 0.1, 0.5, 0.9, 1.0]
    };

    const observer = new IntersectionObserver((entries) => {
        // Highlighting logic: find the question card that's closest to the top of the container
        const questionCards = document.querySelectorAll('.answer-key-question');
        let activeIndex = -1;
        let minTop = Infinity;

        // Check if we are at the bottom of the scroll container
        const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;

        if (isAtBottom) {
            // If at bottom, the last question is always considered active
            activeIndex = questionCards.length - 1;
        } else {
            questionCards.forEach(card => {
                const rect = card.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();

                // The relative top position within the container
                const relativeTop = rect.top - containerRect.top;

                // We want the card that is at or just below the top of the container
                // A small buffer (like 50px) helps if the scroll position is slightly off
                if (rect.bottom > containerRect.top + 50 && relativeTop < minTop) {
                    minTop = relativeTop;
                    activeIndex = card.dataset.index;
                }
            });
        }

        if (activeIndex !== -1) {
            // Remove active class from all
            document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
            // Add to current
            const activeBtn = document.getElementById(`nav-item-${activeIndex}`);
            if (activeBtn) {
                activeBtn.classList.add('active');
                // Ensure the active button is visible in the navigator grid
                activeBtn.scrollIntoView({ behavior: 'auto', block: 'nearest' });
            }
        }
    }, options);

    document.querySelectorAll('.answer-key-question').forEach(card => {
        observer.observe(card);
    });
}

/* ============================================================================
   EVENT LISTENERS
   ============================================================================ */

/**
 * Set up all event listeners for the answer key page
 */
function setupEventListeners() {
    if (backToResultBtn) {
        backToResultBtn.addEventListener('click', () => {
            window.location.href = 'result.html';
        });
    }
}

/* ============================================================================
   INITIALIZATION CALL
   ============================================================================ */

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        init();
        setupEventListeners();
    });
} else {
    init();
    setupEventListeners();
}
