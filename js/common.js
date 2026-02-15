/**
 * ============================================================================
 * COMMON.JS - Shared Utilities and Helper Functions
 * ============================================================================
 * 
 * This file contains shared utilities, helper functions, and state management
 * used across multiple pages of the quiz application.
 * 
 * Contents:
 * - Shared state variables (questions, userAnswers, etc.)
 * - Utility functions (formatTime, loadChapterFile, etc.)
 * - LocalStorage/SessionStorage management for cross-page data
 * - Common DOM manipulation helpers
 * 
 * This file should be loaded on all pages after registry.js
 * ============================================================================
 */

/* ============================================================================
   SHARED STATE VARIABLES
   
   These variables hold the application state and are accessed by page-specific
   JavaScript files. They persist data across different views.
   ============================================================================ */

// Current test configuration
let currentSubject = '';
let currentChapter = '';
let selectedChapters = [];
let selectionMode = 'multi'; // 'multi' or 'single'
let reshuffleEnabled = true;

// Question data and test state
let questions = [];              // Array of question objects for current test
let currentQuestionIndex = 0;    // Index of currently displayed question
let userAnswers = {};            // { questionId: { selectedIndex: number, status: string } }
let visitedQuestions = new Set(); // Set of question indices that user has visited

// Timer state
let timerInterval;               // setInterval reference for countdown timer
let timeRemaining = 3600;        // Time remaining in seconds (default: 60 minutes)
let testStartTime = 0;           // Timestamp when test started (for calculating time taken)
let testEndTime = 0;             // Timestamp when test ended
let questionTimes = {};          // { questionId: totalSecondsSpent }
let currentQuestionStartTime = 0; // Timestamp when current question was displayed

/* ============================================================================
   UTILITY FUNCTIONS
   ============================================================================ */

/**
 * Format seconds into a readable time string
 * @param {number} seconds - Number of seconds to format
 * @returns {string} Formatted time string (e.g., "5m 30s")
 */
function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
}

/**
 * Dynamically load a chapter data file
 * @param {string} path - Relative path to the chapter JavaScript file
 * @returns {Promise} Promise that resolves with the chapter data
 */
function loadChapterFile(path) {
    return new Promise((resolve, reject) => {
        // Adjust path if the current page is in the 'pages/' directory
        let adjustedPath = path;
        const isInPagesDir = window.location.pathname.includes('/pages/');

        if (isInPagesDir && !path.startsWith('../')) {
            adjustedPath = '../' + path;
        } else if (!isInPagesDir && path.startsWith('../')) {
            adjustedPath = path.substring(3);
        }

        // Remove old chapter scripts to prevent clutter
        const oldScript = document.querySelector(`script[src="${adjustedPath}"]`);
        if (oldScript) oldScript.remove();

        // Create and inject new script tag
        const script = document.createElement('script');
        script.src = adjustedPath;
        script.onload = () => resolve(window.currentChapterData);
        script.onerror = () => reject(new Error(`Failed to load chapter at ${adjustedPath}`));
        document.body.appendChild(script);
    });
}

/**
 * Get statistics about question statuses
 * @returns {Object} Object with counts for each status type
 */
function getStats() {
    const stats = {
        answered: 0,
        'not-answered': 0,
        review: 0,
        'not-visited': 0,
        'answered-review': 0
    };

    questions.forEach((q, i) => {
        const qUniqueId = q.uniqueId || q.id;
        const answer = userAnswers[qUniqueId];

        if (answer) {
            if (answer.status === 'answered') {
                stats.answered++;
            } else if (answer.status === 'review') {
                if (answer.selectedIndex !== null) {
                    stats['answered-review']++;
                } else {
                    stats.review++;
                }
            }
        } else if (visitedQuestions.has(i)) {
            stats['not-answered']++;
        } else {
            stats['not-visited']++;
        }
    });

    return stats;
}

/* ============================================================================
   LOCAL STORAGE MANAGEMENT
   
   Functions to save and retrieve data between page navigations
   ============================================================================ */

/**
 * Save test configuration to sessionStorage
 * Used when navigating from home page to test page
 */
function saveTestConfig() {
    const config = {
        currentSubject,
        selectedChapters,
        selectionMode,
        reshuffleEnabled: document.getElementById('reshuffle-toggle')?.checked || false
    };
    sessionStorage.setItem('testConfig', JSON.stringify(config));
}

/**
 * Load test configuration from sessionStorage
 * Used when test page loads
 * @returns {Object|null} Test configuration object or null if not found
 */
function loadTestConfig() {
    const configStr = sessionStorage.getItem('testConfig');
    return configStr ? JSON.parse(configStr) : null;
}

/**
 * Save test data (questions, answers, time) to sessionStorage
 * Used when navigating from test page to result page
 */
function saveTestData() {
    const testData = {
        questions,
        userAnswers,
        questionTimes,
        testStartTime,
        testEndTime,
        timeRemaining,
        currentSubject,
        selectedChapters,
        selectionMode,
        reshuffleEnabled
    };
    sessionStorage.setItem('testData', JSON.stringify(testData));
}

/**
 * Load test data from sessionStorage
 * Used when result/answer-key pages load
 * @returns {Object|null} Test data object or null if not found
 */
function loadTestData() {
    const dataStr = sessionStorage.getItem('testData');
    if (!dataStr) return null;
    const data = JSON.parse(dataStr);
    // Sync global variables if data exists
    if (data) {
        reshuffleEnabled = data.reshuffleEnabled !== undefined ? data.reshuffleEnabled : true;
    }
    return data;
}

/**
 * Clear all session data
 * Used when returning to home page or starting new test
 */
function clearSessionData() {
    sessionStorage.removeItem('testConfig');
    sessionStorage.removeItem('testData');
}

/* ============================================================================
   NAVIGATION FUNCTIONS
   
   Functions to navigate between different pages/views
   ============================================================================ */

/**
 * Navigate to home page
 */
function goToHome(isRetake = false) {
    if (!isRetake) {
        clearSessionData();
    }
    const isInPagesDir = window.location.pathname.includes('/pages/');
    const target = isInPagesDir ? '../index.html' : 'index.html';
    window.location.replace(target);
}

/**
 * Navigate to test page
 * @param {string} subject - Selected subject
 * @param {Array} chapters - Array of selected chapter names
 * @param {string} mode - Selection mode ('single' or 'multi')
 */
function goToTest(subject, chapters, mode) {
    currentSubject = subject;
    selectedChapters = chapters;
    selectionMode = mode;
    // Clear old test results to avoid redirect loops in test.js
    sessionStorage.removeItem('testData');
    saveTestConfig();
    const isInPagesDir = window.location.pathname.includes('/pages/');
    window.location.href = isInPagesDir ? 'test.html' : 'pages/test.html';
}

/**
 * Navigate to result page
 */
function goToResult() {
    saveTestData();
    const isInPagesDir = window.location.pathname.includes('/pages/');
    const target = isInPagesDir ? 'result.html' : 'pages/result.html';
    window.location.replace(target);
}

/**
 * Navigate to answer key page
 */
function goToAnswerKey() {
    const isInPagesDir = window.location.pathname.includes('/pages/');
    window.location.href = isInPagesDir ? 'answer-key.html' : 'pages/answer-key.html';
}

/* ============================================================================
   DOM HELPER FUNCTIONS
   
   Common DOM manipulation utilities
   ============================================================================ */

/**
 * Show an element by removing the 'hidden' class
 * @param {HTMLElement} element - Element to show
 */
function showElement(element) {
    if (element) element.classList.remove('hidden');
}

/**
 * Hide an element by adding the 'hidden' class
 * @param {HTMLElement} element - Element to hide
 */
function hideElement(element) {
    if (element) element.classList.add('hidden');
}

/**
 * Toggle element visibility
 * @param {HTMLElement} element - Element to toggle
 */
function toggleElement(element) {
    if (element) element.classList.toggle('hidden');
}

/* ============================================================================
   VALIDATION FUNCTIONS
   ============================================================================ */

/**
 * Check if registry is loaded
 * @returns {boolean} True if registry is available
 */
function isRegistryLoaded() {
    if (typeof subjectsRegistry === 'undefined') {
        console.error("Registry not found! Make sure registry.js is loaded before other scripts.");
        return false;
    }
    return true;
}

/* ============================================================================
   EXPORTS

   Make functions available globally for use in page-specific scripts
   ============================================================================ */

// All functions and variables are already in global scope
// No need for explicit exports in browser environment
