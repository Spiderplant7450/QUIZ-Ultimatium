/**
 * ============================================================================
 * TEST.JS - Test/CBT Interface Logic
 * ============================================================================
 * 
 * This file handles all functionality for the test/CBT page:
 * - Loading questions from selected chapters
 * - Timer management
 * - Question display and navigation
 * - Answer saving and status tracking
 * - Question palette
 * - Modals (exit, submit)
 * - Fullscreen mode
 * 
 * Dependencies: registry.js, common.js
 * ============================================================================
 */

/* ============================================================================
   DOM ELEMENT SELECTORS
   ============================================================================ */

const testView = document.getElementById('test-view');
const timerDisplay = document.getElementById('timer');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const questionNumber = document.getElementById('question-number');
const questionPalette = document.getElementById('question-palette');
const progressIndicator = document.getElementById('progress-indicator');

// Navigation buttons
const prevBtn = document.getElementById('prev-btn');
const markReviewBtn = document.getElementById('mark-review-btn');
const clearBtn = document.getElementById('clear-response-btn');
const nextBtn = document.getElementById('save-next-btn');
const submitBtn = document.getElementById('submit-test-btn');
const exitBtn = document.getElementById('exit-test-btn');

// Modal elements
const modalOverlay = document.getElementById('modal-overlay');
const exitModal = document.getElementById('exit-modal');
const submitModal = document.getElementById('submit-modal');
const exitCancelBtn = document.getElementById('exit-cancel-btn');
const exitConfirmBtn = document.getElementById('exit-confirm-btn');
const submitCancelBtn = document.getElementById('submit-cancel-btn');
const submitConfirmBtn = document.getElementById('submit-confirm-btn');

// Fullscreen exit button
const fullscreenExitBtn = document.querySelector('.fullscreen-exit-btn');

/* ============================================================================
   INITIALIZATION
   ============================================================================ */

/**
 * Initialize the test page
 * Loads test configuration and starts the test
 */
async function init() {
    if (!isRegistryLoaded()) return;

    // Check if test is already completed in this session
    const existingData = loadTestData();
    if (existingData && existingData.testEndTime) {
        // Test already submitted, redirect to home to break history loop
        goToHome();
        return;
    }

    // Load test configuration from sessionStorage
    const config = loadTestConfig();
    if (!config) {
        alert('No test configuration found. Returning to home page.');
        goToHome();
        return;
    }

    // Navigation Protection
    // ------------------------------------------------------------------------
    // Push an extra state to trap the first back button press
    history.pushState({ page: 'test' }, '', window.location.href);

    // Prevent back navigation by showing exit modal
    window.addEventListener('popstate', (event) => {
        // If we're legitimately navigating away, don't trap
        if (isLegitimateNavigation) return;

        // Push state again to keep the trap active
        history.pushState({ page: 'test' }, '', window.location.href);
        showExitModal();
    });

    // Prevent refresh/close with browser's native dialog
    window.addEventListener('beforeunload', (event) => {
        if (isLegitimateNavigation) return;

        // standard way to trigger browser confirmation
        event.preventDefault();
        event.returnValue = ''; // Required for Chrome
        return ''; // Required for some older browsers
    });
    // ------------------------------------------------------------------------

    // Set global variables from config
    currentSubject = config.currentSubject;
    selectedChapters = config.selectedChapters;
    selectionMode = config.selectionMode;
    reshuffleEnabled = config.reshuffleEnabled;

    // Load questions and start test
    await loadQuestionsAndStartTest(reshuffleEnabled);
}

// Flag to allow legitimate navigation (submit/exit)
let isLegitimateNavigation = false;

/* ============================================================================
   QUESTION LOADING
   ============================================================================ */

/**
 * Load questions from selected chapters and start the test
 * @param {boolean} reshuffleEnabled - Whether to shuffle questions in single mode
 */
async function loadQuestionsAndStartTest(reshuffleEnabled) {
    questions = [];

    try {
        if (selectionMode === 'multi') {
            // Multi-select mode: load all chapters, shuffle, limit to 50
            await loadMultipleChapters();
            shuffleQuestions();
            questions = questions.slice(0, 50);
            timeRemaining = 3600; // 60 minutes
        } else {
            // Single-select mode: load one chapter, optionally shuffle
            await loadSingleChapter();
            if (reshuffleEnabled) {
                shuffleQuestions();
            }
            timeRemaining = Infinity; // No time limit
        }

        // Initialize test state
        currentQuestionIndex = 0;
        visitedQuestions = new Set();
        visitedQuestions.add(0);
        questionTimes = {};

        // Update UI
        const titleText = selectionMode === 'multi'
            ? `${currentSubject}: Multi-Chapter (${selectedChapters.length})`
            : `${currentSubject}: ${selectedChapters[0]}`;
        document.getElementById('active-test-title').textContent = titleText;
        progressIndicator.textContent = `1/${questions.length} Questions`;

        // Start test
        testStartTime = Date.now();
        startTimer();
        renderPalette();
        showQuestion(0);

        // Enter fullscreen mode
        enterFullscreen();

    } catch (error) {
        console.error('Error loading questions:', error);
        alert('Error loading questions. Returning to home page.');
        goToHome();
    }
}

/**
 * Load questions from multiple chapters (multi-select mode)
 */
async function loadMultipleChapters() {
    const books = subjectsRegistry[currentSubject];

    for (const chapterName of selectedChapters) {
        // Find chapter path
        let chapterPath = null;
        for (const bookName in books) {
            if (books[bookName][chapterName]) {
                chapterPath = books[bookName][chapterName].path;
                break;
            }
        }

        if (!chapterPath) continue;

        // Load chapter data
        const data = await loadChapterFile(chapterPath);
        const defaultMarks = data.metadata?.marks || 5;
        const defaultNegative = data.metadata?.negative || -1;

        // Process questions
        const processedQuestions = data.questions.map(q => ({
            ...q,
            chapter: chapterName,
            uniqueId: `${chapterName}_${q.id}`,
            marks: q.marks !== undefined ? q.marks : defaultMarks,
            negative: q.negative !== undefined ? q.negative : defaultNegative
        }));

        questions.push(...processedQuestions);
    }
}

/**
 * Load questions from a single chapter (single-select mode)
 */
async function loadSingleChapter() {
    const chapterName = selectedChapters[0];
    const books = subjectsRegistry[currentSubject];

    // Find chapter path
    let chapterPath = null;
    for (const bookName in books) {
        if (books[bookName][chapterName]) {
            chapterPath = books[bookName][chapterName].path;
            break;
        }
    }

    if (!chapterPath) {
        throw new Error('Chapter not found');
    }

    // Load chapter data
    const data = await loadChapterFile(chapterPath);
    const defaultMarks = data.metadata?.marks || 1;
    const defaultNegative = data.metadata?.negative || 0;

    // Process questions
    questions = data.questions.map(q => ({
        ...q,
        chapter: chapterName,
        uniqueId: `${chapterName}_${q.id}`,
        marks: q.marks !== undefined ? q.marks : defaultMarks,
        negative: q.negative !== undefined ? q.negative : defaultNegative
    }));
}

/**
 * Shuffle questions array using Fisher-Yates algorithm
 */
function shuffleQuestions() {
    for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
    }
}

/* ============================================================================
   TIMER MANAGEMENT
   ============================================================================ */

/**
 * Start the countdown timer
 */
function startTimer() {
    clearInterval(timerInterval);

    if (timeRemaining === Infinity) {
        timerDisplay.textContent = "No Limit";
        timerDisplay.classList.remove('warning', 'critical');
        return;
    }

    updateTimerDisplay();
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            submitTest();
        }
    }, 1000);
}

/**
 * Update timer display and apply warning/critical styles
 */
function updateTimerDisplay() {
    if (timeRemaining === Infinity) return;

    const hours = Math.floor(timeRemaining / 3600);
    const mins = Math.floor((timeRemaining % 3600) / 60);
    const secs = timeRemaining % 60;
    timerDisplay.textContent = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    // Apply warning/critical styles
    timerDisplay.classList.remove('warning', 'critical');
    if (timeRemaining < 300) { // < 5 minutes
        timerDisplay.classList.add('critical');
    } else if (timeRemaining < 900) { // < 15 minutes
        timerDisplay.classList.add('warning');
    }
}

/**
 * Update the time spent on the current question
 */
function updateQuestionTime() {
    if (!questions || questions.length === 0 || currentQuestionStartTime === 0) return;

    const now = Date.now();
    const elapsed = Math.floor((now - currentQuestionStartTime) / 1000);
    const qUniqueId = questions[currentQuestionIndex].uniqueId;

    if (!questionTimes[qUniqueId]) {
        questionTimes[qUniqueId] = 0;
    }
    questionTimes[qUniqueId] += elapsed;
}

/* ============================================================================
   QUESTION DISPLAY
   ============================================================================ */

/**
 * Display a question at the given index
 * @param {number} index - Question index to display
 */
function showQuestion(index) {
    visitedQuestions.add(index);
    const q = questions[index];
    currentQuestionStartTime = Date.now();

    // Update question header
    questionNumber.textContent = `Question ${index + 1}`;
    questionText.textContent = q.question;
    progressIndicator.textContent = `${index + 1}/${questions.length} Questions`;

    // Render options
    optionsContainer.innerHTML = '';
    const qUniqueId = q.uniqueId;

    q.options.forEach((option, i) => {
        const div = document.createElement('div');
        div.className = 'option-item';

        // Check if this option was previously selected
        if (userAnswers[qUniqueId] && userAnswers[qUniqueId].selectedIndex === i) {
            div.classList.add('selected');
        }

        div.innerHTML = `
            <input type="radio" name="option_${index}" id="opt_${index}_${i}" value="${i}" ${userAnswers[qUniqueId] && userAnswers[qUniqueId].selectedIndex === i ? 'checked' : ''}>
            <label for="opt_${index}_${i}">${option}</label>
        `;

        // Handle option selection
        div.addEventListener('click', () => {
            const radio = div.querySelector('input');
            radio.checked = true;
            document.querySelectorAll('.option-item').forEach(el => el.classList.remove('selected'));
            div.classList.add('selected');
        });

        optionsContainer.appendChild(div);
    });

    // Update button states
    nextBtn.textContent = (index === questions.length - 1) ? 'Save & Finish' : 'Save & Next';
    prevBtn.disabled = (index === 0);

    // Update palette and legend
    updatePalette();
    updateLegend();
}

/* ============================================================================
   ANSWER MANAGEMENT
   ============================================================================ */

/**
 * Save the current answer with the given status
 * @param {string} status - Answer status ('answered' or 'review')
 */
function saveAnswer(status) {
    const selected = optionsContainer.querySelector('input[type="radio"]:checked');
    const qUniqueId = questions[currentQuestionIndex].uniqueId;

    if (selected) {
        userAnswers[qUniqueId] = {
            selectedIndex: parseInt(selected.value),
            status: status
        };
    } else if (status === 'review') {
        // Mark for review without answer
        userAnswers[qUniqueId] = {
            selectedIndex: null,
            status: 'review'
        };
    }
}

/* ============================================================================
   PALETTE MANAGEMENT
   ============================================================================ */

/**
 * Render the question palette (numbered buttons)
 */
function renderPalette() {
    questionPalette.innerHTML = '';
    questions.forEach((_, i) => {
        const btn = document.createElement('button');
        btn.className = 'palette-btn not-visited';
        btn.textContent = i + 1;
        btn.addEventListener('click', () => {
            updateQuestionTime();
            currentQuestionIndex = i;
            showQuestion(i);
        });
        questionPalette.appendChild(btn);
    });
}

/**
 * Update palette button styles based on answer status
 */
function updatePalette() {
    const buttons = questionPalette.querySelectorAll('.palette-btn');
    buttons.forEach((btn, i) => {
        btn.classList.remove('active', 'answered', 'not-answered', 'review', 'not-visited', 'answered-review');

        // Mark current question as active
        if (i === currentQuestionIndex) btn.classList.add('active');

        const qUniqueId = questions[i].uniqueId;
        const answer = userAnswers[qUniqueId];

        // Apply status classes
        if (answer) {
            if (answer.status === 'answered') {
                btn.classList.add('answered');
            } else if (answer.status === 'review') {
                if (answer.selectedIndex !== null) {
                    btn.classList.add('answered-review');
                } else {
                    btn.classList.add('review');
                }
            }
        } else if (visitedQuestions.has(i)) {
            btn.classList.add('not-answered');
        } else {
            btn.classList.add('not-visited');
        }
    });
}

/**
 * Update legend counts in sidebar
 */
function updateLegend() {
    const stats = getStats();
    const legendItems = document.querySelectorAll('.legend-item .status-box');
    legendItems[0].textContent = stats.answered;
    legendItems[1].textContent = stats['not-answered'];
    legendItems[2].textContent = stats['not-visited'];
    legendItems[3].textContent = stats.review;
    legendItems[4].textContent = stats['answered-review'];
}

/* ============================================================================
   MODAL FUNCTIONS
   ============================================================================ */

/**
 * Show exit confirmation modal
 */
function showExitModal() {
    modalOverlay.classList.remove('hidden');
    exitModal.classList.remove('hidden');
    submitModal.classList.add('hidden');
}

/**
 * Show submit confirmation modal with stats
 */
function showSubmitModal() {
    const stats = getStats();
    document.getElementById('modal-answered-count').textContent = stats.answered;
    document.getElementById('modal-not-answered-count').textContent = stats['not-answered'];
    document.getElementById('modal-not-visited-count').textContent = stats['not-visited'];
    document.getElementById('modal-review-count').textContent = stats.review;
    document.getElementById('modal-answered-review-count').textContent = stats['answered-review'];

    modalOverlay.classList.remove('hidden');
    submitModal.classList.remove('hidden');
    exitModal.classList.add('hidden');
}

/**
 * Hide all modals
 */
function hideModals() {
    modalOverlay.classList.add('hidden');
    exitModal.classList.add('hidden');
    submitModal.classList.add('hidden');
}

/**
 * Submit the test and navigate to results
 */
function submitTest() {
    updateQuestionTime();
    testEndTime = Date.now();
    clearInterval(timerInterval);
    hideModals();
    isLegitimateNavigation = true; // Allow navigation to result page
    goToResult();
}

/* ============================================================================
   FULLSCREEN MANAGEMENT
   ============================================================================ */

/**
 * Enter fullscreen mode
 */
function enterFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => {
            console.log('Fullscreen request failed:', err);
        });
    }
}

/**
 * Exit fullscreen mode
 */
function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    }
}

/**
 * Show fullscreen exit button on hover
 */
function setupFullscreenExitButton() {
    if (!fullscreenExitBtn) return;

    // Show button when mouse near top of screen
    document.addEventListener('mousemove', (e) => {
        if (document.fullscreenElement && e.clientY < 50) {
            fullscreenExitBtn.classList.add('visible');
        } else {
            fullscreenExitBtn.classList.remove('visible');
        }
    });

    // Exit fullscreen and show exit modal
    fullscreenExitBtn.addEventListener('click', () => {
        exitFullscreen();
        showExitModal();
    });
}

/* ============================================================================
   EVENT LISTENERS
   ============================================================================ */

/**
 * Set up all event listeners for the test page
 */
function setupEventListeners() {
    // Navigation buttons
    nextBtn.addEventListener('click', () => {
        saveAnswer('answered');
        updateQuestionTime();
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            showQuestion(currentQuestionIndex);
        } else {
            updatePalette();
            updateLegend();
            alert("This is the last question.");
        }
    });

    markReviewBtn.addEventListener('click', () => {
        saveAnswer('review');
        updateQuestionTime();
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            showQuestion(currentQuestionIndex);
        } else {
            updatePalette();
            updateLegend();
            alert("This is the last question.");
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            updateQuestionTime();
            currentQuestionIndex--;
            showQuestion(currentQuestionIndex);
        }
    });

    clearBtn.addEventListener('click', () => {
        const radios = optionsContainer.querySelectorAll('input');
        radios.forEach(r => r.checked = false);
        delete userAnswers[questions[currentQuestionIndex].uniqueId];

        // Remove selected class from options
        document.querySelectorAll('.option-item').forEach(el => el.classList.remove('selected'));

        updatePalette();
        updateLegend();
    });

    submitBtn.addEventListener('click', showSubmitModal);
    exitBtn.addEventListener('click', showExitModal);

    // Modal buttons
    exitCancelBtn.addEventListener('click', hideModals);
    exitConfirmBtn.addEventListener('click', () => {
        isLegitimateNavigation = true; // Allow navigation back to home
        goToHome();
    });

    submitCancelBtn.addEventListener('click', hideModals);
    submitConfirmBtn.addEventListener('click', submitTest);

    // Fullscreen exit button
    setupFullscreenExitButton();
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
