// State Management
let currentSubject = '';
let currentChapter = '';
let questions = [];
let currentQuestionIndex = 0;
let userAnswers = {}; // { questionId: { selectedIndex: number, status: string } }
let visitedQuestions = new Set();
let timerInterval;
let timeRemaining = 3600; // 60 minutes in seconds
let selectedChapters = [];
let selectionMode = 'multi'; // 'multi' or 'single'
let testStartTime = 0;

// Selectors
const subjectTrigger = document.getElementById('subject-trigger');
const subjectList = document.getElementById('subject-list');
const selectedSubjectText = document.getElementById('selected-subject-text');
const subjectDropdownContent = document.getElementById('subject-dropdown-content');
const startTestBtn = document.getElementById('start-test-btn');
const homeView = document.getElementById('home-view');
const testView = document.getElementById('test-view');
const resultView = document.getElementById('result-view');
const answerKeyView = document.getElementById('answer-key-view');
const timerDisplay = document.getElementById('timer');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const questionNumber = document.getElementById('question-number');
const questionPalette = document.getElementById('question-palette');
const prevBtn = document.getElementById('prev-btn');
const markReviewBtn = document.getElementById('mark-review-btn');
const clearBtn = document.getElementById('clear-response-btn');
const nextBtn = document.getElementById('save-next-btn');
const submitBtn = document.getElementById('submit-test-btn');
const exitBtn = document.getElementById('exit-test-btn');
// New Result Page Selectors
const navRetakeBtn = document.getElementById('nav-retake-btn');
const navHomeBtn = document.getElementById('nav-home-btn');
const viewAnswerKeyBtn = document.getElementById('view-answer-key-btn');
const backToResultBtn = document.getElementById('back-to-result-btn');
const answerKeyContent = document.getElementById('answer-key-content');
const progressIndicator = document.getElementById('progress-indicator');

// Custom Dropdown Selectors
const chapterDropdown = document.getElementById('chapter-dropdown');
const chapterTrigger = document.getElementById('chapter-trigger');
const chapterList = document.getElementById('chapter-list');
const selectedChapterText = document.getElementById('selected-chapter-text');
const applyChaptersBtn = document.getElementById('apply-chapters-btn');
const clearChaptersBtn = document.getElementById('clear-chapters-btn');
const selectedCountBadge = document.getElementById('selected-count');
const modeHint = document.getElementById('mode-hint');
const modeRadios = document.querySelectorAll('input[name="selection-mode"]');
const reshuffleContainer = document.querySelector('.reshuffle-container');

// Modal Elements
const modalOverlay = document.getElementById('modal-overlay');
const exitModal = document.getElementById('exit-modal');
const submitModal = document.getElementById('submit-modal');
const exitCancelBtn = document.getElementById('exit-cancel-btn');
const exitConfirmBtn = document.getElementById('exit-confirm-btn');
const submitCancelBtn = document.getElementById('submit-cancel-btn');
const submitConfirmBtn = document.getElementById('submit-confirm-btn');

// Initialization
function init() {
    if (typeof subjectsRegistry === 'undefined') {
        console.error("Registry not found! Make sure index.js is loaded before app.js");
        return;
    }
    populateSubjects();
    setupEventListeners();
    updateModeHint();
}

function populateSubjects() {
    subjectList.innerHTML = '';
    const subjects = Object.keys(subjectsRegistry);
    subjects.forEach(subject => {
        const item = document.createElement('div');
        item.className = 'chapter-item';
        item.innerHTML = `
            <div class="chapter-item-left">
                <span class="chapter-name">${subject}</span>
            </div>
        `;
        item.addEventListener('click', () => selectSubject(subject, item));
        subjectList.appendChild(item);
    });
}

function selectSubject(subject, element) {
    currentSubject = subject;
    selectedSubjectText.textContent = subject;

    // UI selection
    const items = subjectList.querySelectorAll('.chapter-item');
    items.forEach(item => item.classList.remove('selected'));
    element.classList.add('selected');

    // Close dropdown
    subjectDropdownContent.classList.remove('show');
    subjectTrigger.classList.remove('active');

    // Update chapters
    populateChapters(currentSubject);
    chapterDropdown.classList.remove('disabled');
    startTestBtn.disabled = true;
    clearSelection();
}

function setupEventListeners() {
    // Subject Dropdown
    subjectTrigger.addEventListener('click', () => {
        const isOpen = subjectDropdownContent.classList.contains('show');
        // Close other dropdowns
        document.getElementById('chapter-dropdown-content').classList.remove('show');
        chapterTrigger.classList.remove('active');

        subjectDropdownContent.classList.toggle('show');
        subjectTrigger.classList.toggle('active');
    });

    // Custom Dropdown Event Listeners
    chapterTrigger.addEventListener('click', () => {
        if (!currentSubject) return;
        const isOpen = document.getElementById('chapter-dropdown-content').classList.contains('show');
        // Close other dropdowns
        subjectDropdownContent.classList.remove('show');
        subjectTrigger.classList.remove('active');

        document.getElementById('chapter-dropdown-content').classList.toggle('show');
        chapterTrigger.classList.toggle('active');
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        const subDropdown = document.getElementById('subject-dropdown');
        const chapDropdown = document.getElementById('chapter-dropdown');

        if (!subDropdown.contains(e.target)) {
            subjectDropdownContent.classList.remove('show');
            subjectTrigger.classList.remove('active');
        }
        if (!chapDropdown.contains(e.target)) {
            document.getElementById('chapter-dropdown-content').classList.remove('show');
            chapterTrigger.classList.remove('active');
        }
    });

    modeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            selectionMode = e.target.value;
            updateModeHint();
            clearSelection();
        });
    });

    applyChaptersBtn.addEventListener('click', () => {
        if (selectedChapters.length > 0) {
            document.getElementById('chapter-dropdown-content').classList.remove('show');
            chapterTrigger.classList.remove('active');
            startTestBtn.disabled = false;
            updateTriggerText();
        } else {
            alert('Please select at least one chapter.');
        }
    });

    clearChaptersBtn.addEventListener('click', clearSelection);

    startTestBtn.addEventListener('click', startTest);

    nextBtn.addEventListener('click', () => {
        saveAnswer('answered');
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            showQuestion(currentQuestionIndex);
        } else {
            // Last question behavior
            updatePalette();
            updateLegend();
            alert("This is the last question.");
        }
    });

    markReviewBtn.addEventListener('click', () => {
        saveAnswer('review');
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            showQuestion(currentQuestionIndex);
        } else {
            // Last question behavior
            updatePalette();
            updateLegend();
            alert("This is the last question.");
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            showQuestion(currentQuestionIndex);
        }
    });

    clearBtn.addEventListener('click', () => {
        const radios = optionsContainer.querySelectorAll('input');
        radios.forEach(r => r.checked = false);
        delete userAnswers[questions[currentQuestionIndex].id];
        updatePalette();
        updateLegend();
    });

    submitBtn.addEventListener('click', () => {
        showSubmitModal();
    });

    exitBtn.addEventListener('click', () => {
        showExitModal();
    });

    // Modal Events
    exitCancelBtn.addEventListener('click', hideModals);
    exitConfirmBtn.addEventListener('click', () => {
        location.reload();
    });

    submitCancelBtn.addEventListener('click', hideModals);
    submitConfirmBtn.addEventListener('click', () => {
        hideModals();
        showResult();
    });

    if (navRetakeBtn) navRetakeBtn.addEventListener('click', () => location.reload());
    if (navHomeBtn) navHomeBtn.addEventListener('click', () => location.reload());
    if (viewAnswerKeyBtn) viewAnswerKeyBtn.addEventListener('click', showAnswerKey);

    const viewSolutionsLink = document.getElementById('view-solutions-link');
    if (viewSolutionsLink) {
        viewSolutionsLink.addEventListener('click', (e) => {
            e.preventDefault();
            showAnswerKey();
        });
    }

    backToResultBtn.addEventListener('click', () => {
        answerKeyView.classList.add('hidden');
        resultView.classList.remove('hidden');
    });
}

function populateChapters(subject) {
    chapterList.innerHTML = '';
    const books = subjectsRegistry[subject];

    if (!books) return;

    for (const bookName in books) {
        // Create Book Header
        const header = document.createElement('div');
        header.className = 'book-header';
        header.textContent = bookName;
        chapterList.appendChild(header);

        const chapters = books[bookName];
        for (const chapterName in chapters) {
            const info = chapters[chapterName];
            const item = document.createElement('div');
            item.className = 'chapter-item';
            item.dataset.chapter = chapterName;
            item.dataset.path = info.path;

            item.innerHTML = `
                <div class="chapter-item-left">
                    <div class="chapter-checkbox">
                        <i class="fas fa-check"></i>
                    </div>
                    <span class="chapter-name">${chapterName}</span>
                </div>
                <span class="quest-count">${info.count > 0 ? info.count + ' quests' : 'Coming Soon'}</span>
            `;

            if (info.count > 0) {
                item.addEventListener('click', () => toggleChapter(item, chapterName));
            } else {
                item.classList.add('disabled');
                item.style.opacity = '0.5';
                item.style.cursor = 'not-allowed';
            }
            chapterList.appendChild(item);
        }
    }
}

function toggleChapter(element, chapter) {
    if (selectionMode === 'single') {
        const items = chapterList.querySelectorAll('.chapter-item');
        items.forEach(item => {
            if (item !== element) item.classList.remove('selected');
        });
        selectedChapters = element.classList.contains('selected') ? [] : [chapter];
        element.classList.toggle('selected');
    } else {
        if (element.classList.contains('selected')) {
            element.classList.remove('selected');
            selectedChapters = selectedChapters.filter(c => c !== chapter);
        } else {
            element.classList.add('selected');
            selectedChapters.push(chapter);
        }
    }
    updateSelectionUI();
}

function updateSelectionUI() {
    selectedCountBadge.textContent = selectedChapters.length;
}

function updateTriggerText() {
    if (selectedChapters.length === 0) {
        selectedChapterText.textContent = 'Select Chapter';
    } else if (selectedChapters.length === 1) {
        selectedChapterText.textContent = selectedChapters[0];
    } else {
        selectedChapterText.textContent = `${selectedChapters.length} Chapters Selected`;
    }
}

function clearSelection() {
    selectedChapters = [];
    const items = chapterList.querySelectorAll('.chapter-item');
    items.forEach(item => item.classList.remove('selected'));
    updateSelectionUI();
    updateTriggerText();
    startTestBtn.disabled = true;
}

function updateModeHint() {
    if (selectionMode === 'multi') {
        modeHint.textContent = 'Multi-select mode: 50 random questions, 60-minute limit';
        modeHint.className = 'mode-hint multi-mode';
        reshuffleContainer.style.display = 'none'; // Multi-mode is random by default
    } else {
        modeHint.textContent = 'Single-select mode: All questions, No-time limit';
        modeHint.className = 'mode-hint single-mode';
        reshuffleContainer.style.display = 'block';
    }
}

// Helper to load chapter files dynamically
function loadChapterFile(path) {
    return new Promise((resolve, reject) => {
        // Remove old chapter scripts to prevent clutter (optional)
        const oldScript = document.querySelector(`script[src="${path}"]`);
        if (oldScript) oldScript.remove();

        const script = document.createElement('script');
        script.src = path;
        script.onload = () => resolve(window.currentChapterData);
        script.onerror = () => reject(new Error(`Failed to load chapter at ${path}`));
        document.body.appendChild(script);
    });
}

// Test Logic
async function startTest() {
    questions = [];
    startTestBtn.disabled = true;
    startTestBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';

    const selectedChapterItems = Array.from(chapterList.querySelectorAll('.chapter-item.selected'));

    try {
        if (selectionMode === 'multi') {
            // Load all selected chapters
            for (const item of selectedChapterItems) {
                const path = item.dataset.path;
                const chapterName = item.dataset.chapter;
                const data = await loadChapterFile(path);

                const defaultMarks = data.metadata?.marks || 1;
                const defaultNegative = data.metadata?.negative || 0;

                const processedQuestions = data.questions.map(q => ({
                    ...q,
                    chapter: chapterName,
                    marks: q.marks !== undefined ? q.marks : defaultMarks,
                    negative: q.negative !== undefined ? q.negative : defaultNegative
                }));

                questions.push(...processedQuestions);
            }

            // Shuffle
            for (let i = questions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [questions[i], questions[j]] = [questions[j], questions[i]];
            }

            // Limit to 50
            questions = questions.slice(0, 50);
            timeRemaining = 3600; // 60 minutes
        } else {
            // Single chapter
            const item = selectedChapterItems[0];
            const chapterName = item.dataset.chapter;
            const data = await loadChapterFile(item.dataset.path);

            const defaultMarks = data.metadata?.marks || 1;
            const defaultNegative = data.metadata?.negative || 0;

            questions = data.questions.map(q => ({
                ...q,
                chapter: chapterName,
                marks: q.marks !== undefined ? q.marks : defaultMarks,
                negative: q.negative !== undefined ? q.negative : defaultNegative
            }));

            // Reshuffle questions if toggle is checked
            const reshuffleToggle = document.getElementById('reshuffle-toggle');
            if (reshuffleToggle && reshuffleToggle.checked) {
                for (let i = questions.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [questions[i], questions[j]] = [questions[j], questions[i]];
                }
            }
            timeRemaining = Infinity; // No time limit
        }

        currentQuestionIndex = 0;
        userAnswers = {};
        visitedQuestions = new Set();
        visitedQuestions.add(0);

        homeView.classList.add('hidden');
        testView.classList.remove('hidden');

        const titleText = selectionMode === 'multi'
            ? `${currentSubject}: Multi-Chapter (${selectedChapters.length})`
            : `${currentSubject}: ${selectedChapters[0]}`;

        document.getElementById('active-test-title').textContent = titleText;
        progressIndicator.textContent = `1/${questions.length} Questions`;

        testStartTime = Date.now();
        startTimer();
        renderPalette();
        showQuestion(0);

    } catch (error) {
        console.error(error);
        alert("Error loading questions. Please check your internet connection or try again.");
    } finally {
        startTestBtn.disabled = false;
        startTestBtn.innerHTML = '<span>Start Test</span>';
    }
}

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
            showResult();
        }
    }, 1000);
}

function updateTimerDisplay() {
    if (timeRemaining === Infinity) return;

    const hours = Math.floor(timeRemaining / 3600);
    const mins = Math.floor((timeRemaining % 3600) / 60);
    const secs = timeRemaining % 60;
    timerDisplay.textContent = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    // Timer colors
    timerDisplay.classList.remove('warning', 'critical');
    if (timeRemaining < 300) { // 5 minutes
        timerDisplay.classList.add('critical');
    } else if (timeRemaining < 900) { // 15 minutes
        timerDisplay.classList.add('warning');
    }
}

function showQuestion(index) {
    visitedQuestions.add(index);
    const q = questions[index];
    questionNumber.textContent = `Question ${index + 1}`;
    questionText.textContent = q.question;
    progressIndicator.textContent = `${index + 1}/${questions.length} Questions`;

    optionsContainer.innerHTML = '';
    q.options.forEach((option, i) => {
        const div = document.createElement('div');
        div.className = 'option-item';
        if (userAnswers[q.id] && userAnswers[q.id].selectedIndex === i) {
            div.classList.add('selected');
        }

        div.innerHTML = `
            <input type="radio" name="option" id="opt-${i}" value="${i}" ${userAnswers[q.id] && userAnswers[q.id].selectedIndex === i ? 'checked' : ''}>
            <label for="opt-${i}">${option}</label>
        `;

        div.addEventListener('click', () => {
            const radio = div.querySelector('input');
            radio.checked = true;
            document.querySelectorAll('.option-item').forEach(el => el.classList.remove('selected'));
            div.classList.add('selected');
        });

        optionsContainer.appendChild(div);
    });

    // Update buttons visibility/text
    nextBtn.textContent = (index === questions.length - 1) ? 'Save & Finish' : 'Save & Next';
    prevBtn.disabled = (index === 0);

    updatePalette();
    updateLegend();
}

function saveAnswer(status) {
    const selected = optionsContainer.querySelector('input[name="option"]:checked');
    const qId = questions[currentQuestionIndex].id;

    if (selected) {
        userAnswers[qId] = {
            selectedIndex: parseInt(selected.value),
            status: status
        };
    } else if (status === 'review') {
        userAnswers[qId] = {
            selectedIndex: null,
            status: 'review'
        };
    }
}

function renderPalette() {
    questionPalette.innerHTML = '';
    questions.forEach((_, i) => {
        const btn = document.createElement('button');
        btn.className = 'palette-btn not-visited';
        btn.textContent = i + 1;
        btn.addEventListener('click', () => {
            currentQuestionIndex = i;
            showQuestion(i);
        });
        questionPalette.appendChild(btn);
    });
}

function updatePalette() {
    const buttons = questionPalette.querySelectorAll('.palette-btn');
    buttons.forEach((btn, i) => {
        btn.classList.remove('active', 'answered', 'not-answered', 'review', 'not-visited', 'answered-review');

        if (i === currentQuestionIndex) btn.classList.add('active');

        const qId = questions[i].id;
        const answer = userAnswers[qId];

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

function updateLegend() {
    const stats = { answered: 0, 'not-answered': 0, review: 0, 'not-visited': 0, 'answered-review': 0 };
    questions.forEach((q, i) => {
        const qId = q.id;
        const answer = userAnswers[qId];

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

    const legendItems = document.querySelectorAll('.legend-item .status-box');
    legendItems[0].textContent = stats.answered;
    legendItems[1].textContent = stats['not-answered'];
    legendItems[2].textContent = stats['not-visited'];
    legendItems[3].textContent = stats.review;
    legendItems[4].textContent = stats['answered-review'];
}

// Modal Functions
function showExitModal() {
    modalOverlay.classList.remove('hidden');
    exitModal.classList.remove('hidden');
    submitModal.classList.add('hidden');
}

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

function hideModals() {
    modalOverlay.classList.add('hidden');
    exitModal.classList.add('hidden');
    submitModal.classList.add('hidden');
}

function getStats() {
    const stats = { answered: 0, 'not-answered': 0, review: 0, 'not-visited': 0, 'answered-review': 0 };
    questions.forEach((q, i) => {
        const qId = q.id;
        const answer = userAnswers[qId];

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

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
}

function showResult() {
    clearInterval(timerInterval);
    const endTime = Date.now();
    const timeTakenSecs = Math.floor((endTime - testStartTime) / 1000);
    const avgTimePerQ = Math.round(timeTakenSecs / (questions.length || 1));

    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    let totalMarks = selectionMode === 'multi' ? 250 : 0;
    let earnedMarks = 0;

    // Track per-question data for breakdown
    const questionDetails = [];

    questions.forEach((q, index) => {
        if (selectionMode === 'single') totalMarks += q.marks;
        const answer = userAnswers[q.id];
        const timeSpent = 0;

        if (answer && answer.selectedIndex !== null) {
            if (answer.selectedIndex === q.correct) {
                earnedMarks += q.marks;
                correct++;
                questionDetails.push({
                    id: index,
                    text: q.question,
                    status: 'correct',
                    time: timeSpent,
                    marks: q.marks,
                    selectedOption: answer.selectedIndex,
                    correctOption: q.correct
                });
            } else {
                earnedMarks -= q.negative;
                wrong++;
                questionDetails.push({
                    id: index,
                    text: q.question,
                    status: 'incorrect',
                    time: timeSpent,
                    marks: -q.negative,
                    selectedOption: answer.selectedIndex,
                    correctOption: q.correct
                });
            }
        } else {
            skipped++;
            questionDetails.push({
                id: index,
                text: q.question,
                status: 'unanswered',
                time: timeSpent,
                marks: 0,
                selectedOption: null,
                correctOption: q.correct
            });
        }
    });

    const percentage = totalMarks > 0 ? ((earnedMarks / totalMarks) * 100) : 0;
    const accuracy = (questions.length - wrong) > 0 ? ((correct / (questions.length - wrong)) * 100) : 0;
    const displayPercentage = Math.max(0, Math.round(percentage));

    // Switch Views
    testView.classList.add('hidden');
    resultView.classList.remove('hidden');

    // 1. Header Population
    const subjectTitle = selectionMode === 'multi'
        ? currentSubject
        : `${currentSubject}: ${selectedChapters[0]}`;
    document.getElementById('result-title').textContent = subjectTitle;

    const now = new Date();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[now.getMonth()];
    const date = now.getDate();
    const year = now.getFullYear();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    document.getElementById('result-timestamp').textContent = `Completed on ${month} ${date}, ${year} ${timeStr} IST`;

    // 2. Overview Data
    const mm = Math.floor(timeTakenSecs / 60).toString().padStart(2, '0');
    const ss = (timeTakenSecs % 60).toString().padStart(2, '0');
    document.getElementById('overview-time-taken').textContent = `${mm}:${ss}`;

    const earnedEl = document.querySelector('.earned-text');
    const totalEl = document.querySelector('.total-text');
    if (earnedEl) earnedEl.textContent = earnedMarks;
    if (totalEl) totalEl.textContent = totalMarks;

    // 3. Donut Chart Injection
    createEnhancedDonutChart(correct, wrong, skipped);

    // 4. Badge Logic
    const badgeTitle = document.getElementById('badge-title');
    const badgeIcon = document.querySelector('.badge-icon i');

    if (displayPercentage > 80) {
        badgeTitle.textContent = currentSubject + " Expert";
        badgeIcon.className = "fas fa-trophy";
    } else if (avgTimePerQ < 30) {
        badgeTitle.textContent = "Speed Racer";
        badgeIcon.className = "fas fa-bolt";
    } else if (accuracy > 80) {
        badgeTitle.textContent = "Sharp Shooter";
        badgeIcon.className = "fas fa-crosshairs";
    } else {
        badgeTitle.textContent = "Keep Learning";
        badgeIcon.className = "fas fa-chart-line";
    }

    // Performance card icon (matches message tier)
    const perfIcon = document.querySelector('.performance-card .perf-icon i');
    if (perfIcon) {
        if (displayPercentage >= 90) {
            perfIcon.className = "fas fa-crown";
        } else if (displayPercentage >= 75) {
            perfIcon.className = "fas fa-star";
        } else if (displayPercentage >= 50) {
            perfIcon.className = "fas fa-thumbs-up";
        } else {
            perfIcon.className = "fas fa-chart-line";
        }
    }

    // 5. Performance Message (Enhanced messaging)
    const msgHeader = document.getElementById('msg-header');
    const msgDesc = document.getElementById('msg-desc');
    const msgPercent = document.getElementById('msg-percent');

    msgPercent.textContent = displayPercentage + '%';

    if (displayPercentage >= 90) {
        msgHeader.textContent = "Outstanding!";
        msgDesc.innerHTML = "Excellent performance! You have a deep understanding of the subject.";
    } else if (displayPercentage >= 75) {
        msgHeader.textContent = "Great Job!";
        msgDesc.innerHTML = "You scored well! A little more practice and you'll be perfect.";
    } else if (displayPercentage >= 50) {
        msgHeader.textContent = "Well Done!";
        msgDesc.innerHTML = "You passed! Continue reviewing the chapters to boost your marks.";
    } else {
        msgHeader.textContent = "Keep Practicing!";
        msgDesc.innerHTML = "Every mistake is a lesson. Review your errors and try again!";
    }

    // 6. Legend & Summary
    document.querySelector('#legend-correct .legend-marks').textContent = `+${correct * 5} Marks`;
    document.querySelector('#legend-incorrect .legend-marks').textContent = `- ${wrong * 2} Marks`;
    document.querySelector('#legend-unanswered .legend-marks').textContent = `0 Marks`;

    document.getElementById('summary-total-q').textContent = questions.length;
    document.getElementById('summary-correct-q').textContent = correct;
    document.getElementById('summary-wrong-q').textContent = wrong;
    document.getElementById('summary-unanswered-q').textContent = skipped;

    const accuracyValue = correct + wrong > 0
        ? Math.round((correct / (correct + wrong)) * 100)
        : 0;
    document.getElementById('summary-accuracy').textContent = accuracyValue + '%';
    document.getElementById('summary-total-time').textContent = mm + 'm ' + ss + 's';
    document.getElementById('summary-avg-time').textContent = avgTimePerQ + 's';

    // Update filter badges
    const allBadge = document.querySelector('[data-filter="all"] .count-badge');
    const correctBadge = document.querySelector('[data-filter="correct"] .count-badge');
    const incorrectBadge = document.querySelector('[data-filter="incorrect"] .count-badge');
    const unansweredBadge = document.querySelector('[data-filter="unanswered"] .count-badge');
    if (allBadge) allBadge.textContent = questions.length;
    if (correctBadge) correctBadge.textContent = correct;
    if (incorrectBadge) incorrectBadge.textContent = wrong;
    if (unansweredBadge) unansweredBadge.textContent = skipped;

    // Populate question breakdown table
    populateQuestionBreakdown(questionDetails);

    // Populate chapter analysis
    populateChapterAnalysis();
}

function createEnhancedDonutChart(correct, wrong, skipped) {
    const total = correct + wrong + skipped;
    const COLORS = {
        correct: '#22c55e',
        incorrect: '#ef4444',
        unanswered: '#94a3b8'
    };

    const correctPct = total > 0 ? (correct / total) * 100 : 0;
    const incorrectPct = total > 0 ? (wrong / total) * 100 : 0;
    const unansweredPct = total > 0 ? (skipped / total) * 100 : 0;

    const size = 200;
    const strokeWidth = 40;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const center = size / 2;
    const gapPct = total > 0 ? 1.5 : 0;

    const correctDash = Math.max(0, (correctPct - (correctPct > 0 ? gapPct : 0)) / 100) * circumference;
    const incorrectDash = Math.max(0, (incorrectPct - (incorrectPct > 0 ? gapPct : 0)) / 100) * circumference;
    const unansweredDash = Math.max(0, (unansweredPct - (unansweredPct > 0 ? gapPct : 0)) / 100) * circumference;

    const correctOffset = 0;
    const incorrectOffset = -(correctPct / 100 * circumference);
    const unansweredOffset = -((correctPct + incorrectPct) / 100 * circumference);

    function getArcPosition(startPct, segmentPct) {
        const middleAngle = ((startPct + segmentPct / 2) / 100) * 360;
        const angleRad = (middleAngle - 90) * (Math.PI / 180);
        const x = center + radius * Math.cos(angleRad);
        const y = center + radius * Math.sin(angleRad);
        return { x, y, angle: middleAngle };
    }

    let segments = '';

    if (correctPct > 0) {
        const pos = getArcPosition(0, correctPct);
        segments += `
            <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${COLORS.correct}" stroke-width="${strokeWidth}" stroke-dasharray="${correctDash} ${circumference}" stroke-dashoffset="${correctOffset}" transform="rotate(-90 ${center} ${center})" class="chart-segment" data-label="Correct" data-count="${correct}" data-pct="${Math.round(correctPct)}" style="transition: all 0.3s ease;" />
            ${correctPct > 8 ? `<text x="${pos.x}" y="${pos.y}" text-anchor="middle" dominant-baseline="central" fill="white" font-size="16" font-weight="700" font-family="'Outfit', sans-serif" class="segment-number" style="pointer-events: none;">${correct}</text>` : ''}
        `;
    }
    if (incorrectPct > 0) {
        const pos = getArcPosition(correctPct, incorrectPct);
        segments += `
            <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${COLORS.incorrect}" stroke-width="${strokeWidth}" stroke-dasharray="${incorrectDash} ${circumference}" stroke-dashoffset="${incorrectOffset}" transform="rotate(-90 ${center} ${center})" class="chart-segment" data-label="Incorrect" data-count="${wrong}" data-pct="${Math.round(incorrectPct)}" style="transition: all 0.3s ease;" />
            ${incorrectPct > 8 ? `<text x="${pos.x}" y="${pos.y}" text-anchor="middle" dominant-baseline="central" fill="white" font-size="16" font-weight="700" font-family="'Outfit', sans-serif" class="segment-number" style="pointer-events: none;">${wrong}</text>` : ''}
        `;
    }
    if (unansweredPct > 0) {
        const pos = getArcPosition(correctPct + incorrectPct, unansweredPct);
        segments += `
            <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${COLORS.unanswered}" stroke-width="${strokeWidth}" stroke-dasharray="${unansweredDash} ${circumference}" stroke-dashoffset="${unansweredOffset}" transform="rotate(-90 ${center} ${center})" class="chart-segment" data-label="Unanswered" data-count="${skipped}" data-pct="${Math.round(unansweredPct)}" style="transition: all 0.3s ease;" />
            ${unansweredPct > 8 ? `<text x="${pos.x}" y="${pos.y}" text-anchor="middle" dominant-baseline="central" fill="white" font-size="16" font-weight="700" font-family="'Outfit', sans-serif" class="segment-number" style="pointer-events: none;">${skipped}</text>` : ''}
        `;
    }

    const chartContainer = document.getElementById('donut-chart-container');
    const chartCenter = chartContainer.querySelector('.chart-center');
    const tooltip = document.getElementById('chart-tooltip');

    chartContainer.innerHTML = `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="donut-svg">
            <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="#d7daec" opacity="0" stroke-width="${strokeWidth}" />
            ${segments}
        </svg>
    `;
    if (chartCenter) chartContainer.appendChild(chartCenter);
    if (tooltip) chartContainer.appendChild(tooltip);

    initChartTooltips();
}

function initChartTooltips() {
    const chartContainer = document.getElementById('donut-chart-container');
    const tooltip = document.getElementById('chart-tooltip');
    if (!chartContainer || !tooltip) return;
    const segments = chartContainer.querySelectorAll('.chart-segment');

    segments.forEach((seg) => {
        seg.addEventListener('mouseenter', () => {
            chartContainer.classList.add('has-hover');
            tooltip.classList.remove('hidden');
            tooltip.innerHTML = `${seg.dataset.label}: ${seg.dataset.count} (${seg.dataset.pct}%)`;
        });

        seg.addEventListener('mousemove', (e) => {
            tooltip.style.left = e.clientX + 'px';
            tooltip.style.top = (e.clientY - 20) + 'px';
        });

        seg.addEventListener('mouseleave', () => {
            chartContainer.classList.remove('has-hover');
            tooltip.classList.add('hidden');
        });
    });
}

function populateQuestionBreakdown(questionDetails) {
    const tbody = document.getElementById('breakdown-body');
    if (!tbody) return;

    renderQuestionTable(questionDetails, 'all');

    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.replaceWith(btn.cloneNode(true));
    });
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderQuestionTable(questionDetails, btn.dataset.filter);
        });
    });
}

function renderQuestionTable(questionDetails, filter) {
    const tbody = document.getElementById('breakdown-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const filtered = filter === 'all'
        ? questionDetails
        : questionDetails.filter(q => q.status === filter);

    filtered.forEach((q, index) => {
        const row = document.createElement('tr');
        const statusLabel = q.status.charAt(0).toUpperCase() + q.status.slice(1);
        const iconClass = q.status === 'correct' ? 'fa-circle-check' :
            (q.status === 'incorrect' ? 'fa-circle-xmark' : 'fa-circle-question');
        const pillClass = q.status === 'correct' ? 'success' :
            (q.status === 'incorrect' ? 'danger' : 'muted');
        const marksClass = q.status === 'correct' ? 'success-text' :
            (q.status === 'incorrect' ? 'danger-text' : 'muted-text');
        const marksVal = q.marks > 0 ? `+${q.marks}` :
            (q.marks < 0 ? `${q.marks}` : '0');

        const questionText = q.text.length > 50 ? q.text.substring(0, 50) + '...' : q.text;

        row.innerHTML = `
            <td>${index + 1}.</td>
            <td class="question-text">${questionText}</td>
            <td>
                <div class="status-pill ${pillClass}">
                    <i class="fas ${iconClass}"></i> ${statusLabel}
                </div>
            </td>
            <td>${q.time || '-'}</td>
            <td class="marks-cell ${marksClass}">${marksVal} Marks</td>
        `;
        tbody.appendChild(row);
    });
}

function populateChapterAnalysis() {
    const chapterStats = {};

    questions.forEach((q) => {
        const chapter = q.chapter || (selectedChapters && selectedChapters[0]) || 'Chapter';
        if (!chapterStats[chapter]) {
            chapterStats[chapter] = { total: 0, correct: 0 };
        }
        chapterStats[chapter].total++;

        const answer = userAnswers[q.id];
        if (answer && answer.selectedIndex !== null && answer.selectedIndex === q.correct) {
            chapterStats[chapter].correct++;
        }
    });

    const analysisList = document.querySelector('.analysis-list');
    if (!analysisList) return;

    analysisList.innerHTML = '';

    Object.entries(chapterStats).forEach(([chapter, stats]) => {
        const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
        const statusClass = pct >= 70 ? 'success' : (pct >= 40 ? 'warning' : 'danger');

        const item = document.createElement('div');
        item.className = 'analysis-item';
        item.innerHTML = `
            <div class="item-header">
                <span class="chapter-name">${chapter}</span>
                <span class="chapter-score">
                    <span class="count-val ${statusClass}">${stats.correct}</span>
                    <span class="separator">/</span>
                    <span class="total-val">${stats.total}</span>
                    <span class="text">Correct</span>
                </span>
            </div>
            <div class="progress-container">
                <div class="progress-bar ${statusClass}" style="width: ${pct}%;"></div>
            </div>
        `;
        analysisList.appendChild(item);
    });
}

function showAnswerKey() {
    resultView.classList.add('hidden');
    answerKeyView.classList.remove('hidden');
    answerKeyContent.innerHTML = '';

    questions.forEach((q, index) => {
        const answer = userAnswers[q.id];
        const userSelected = answer && answer.selectedIndex !== null ? answer.selectedIndex : null;
        const isCorrect = userSelected === q.correct;
        const status = userSelected === null ? 'skipped' : (isCorrect ? 'correct' : 'incorrect');

        const questionDiv = document.createElement('div');
        questionDiv.className = 'answer-key-question';

        let statusText = status === 'correct' ? 'Correct' : (status === 'incorrect' ? 'Incorrect' : 'Skipped');
        let statusClass = status;

        questionDiv.innerHTML = `
            <div class="answer-key-question-header">
                <span class="answer-key-question-number">Question ${index + 1}</span>
                <span class="answer-key-status ${statusClass}">
                    <i class="fas ${status === 'correct' ? 'fa-check-circle' : (status === 'incorrect' ? 'fa-times-circle' : 'fa-forward')}"></i>
                    ${statusText}
                </span>
            </div>
            <div class="answer-key-question-text">${q.question}</div>
            <div class="answer-key-options">
                ${q.options.map((option, i) => {
            const isCorrectAnswer = i === q.correct;
            const isUserAnswer = i === userSelected;
            let optionClass = isCorrectAnswer ? 'correct-answer' : (isUserAnswer ? 'user-answer' : '');
            let icon = isCorrectAnswer ? '<i class="fas fa-check-circle answer-key-option-icon"></i>' : (isUserAnswer ? '<i class="fas fa-times-circle answer-key-option-icon"></i>' : '');
            return `
                        <div class="answer-key-option ${optionClass}">
                            <span class="answer-key-option-label">${String.fromCharCode(65 + i)}.</span>
                            <span class="answer-key-option-text">${option}</span>
                            ${icon}
                        </div>
                    `;
        }).join('')}
            </div>
        `;
        answerKeyContent.appendChild(questionDiv);
    });
}

init();
