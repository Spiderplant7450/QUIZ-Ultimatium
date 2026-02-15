/**
 * ============================================================================
 * RESULT.JS - Result Page Logic
 * ============================================================================
 * 
 * This file handles all functionality for the result/score page:
 * - Loading test data from sessionStorage
 * - Calculating scores and statistics
 * - Rendering donut chart
 * - Populating question breakdown table with filters
 * - Generating chapter-wise analysis
 * - Navigation to answer key or home
 * 
 * Dependencies: registry.js, common.js
 * ============================================================================
 */

/* ============================================================================
   DOM ELEMENT SELECTORS
   ============================================================================ */

const navRetakeBtn = document.getElementById('nav-retake-btn');
const navHomeBtn = document.getElementById('nav-home-btn');
const viewAnswerKeyBtn = document.getElementById('view-answer-key-btn');

/* ============================================================================
   INITIALIZATION
   ============================================================================ */

/**
 * Initialize the result page
 * Loads test data and displays results
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
    testStartTime = testData.testStartTime;
    testEndTime = testData.testEndTime;
    timeRemaining = testData.timeRemaining;
    questionTimes = testData.questionTimes || {};
    currentSubject = testData.currentSubject;
    selectedChapters = testData.selectedChapters;
    selectionMode = testData.selectionMode;

    // Calculate and display results
    displayResults();
}

/* ============================================================================
   RESULT CALCULATION AND DISPLAY
   ============================================================================ */

/**
 * Calculate scores and populate all result sections
 */
function displayResults() {
    const endTime = testEndTime || Date.now();
    const timeTakenSecs = Math.floor((endTime - testStartTime) / 1000);
    const avgTimePerQ = Math.round(timeTakenSecs / (questions.length || 1));

    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    let totalMarks = selectionMode === 'multi' ? 250 : 0;
    let earnedMarks = 0;
    let earnedPosMarks = 0;
    let lostNegMarks = 0;

    // Track per-question data for breakdown
    const questionDetails = [];

    // Calculate scores
    questions.forEach((q, index) => {
        if (selectionMode === 'single') totalMarks += q.marks;
        const answer = userAnswers[q.uniqueId];

        if (answer && answer.selectedIndex !== null) {
            if (answer.selectedIndex === q.correct) {
                earnedMarks += q.marks;
                earnedPosMarks += q.marks;
                correct++;
                questionDetails.push({
                    id: index,
                    text: q.question,
                    status: 'correct',
                    marks: q.marks,
                    selectedOption: answer.selectedIndex,
                    correctOption: q.correct,
                    timeTaken: formatTime(questionTimes[q.uniqueId] || 0)
                });
            } else {
                earnedMarks -= q.negative;
                lostNegMarks += q.negative;
                wrong++;
                questionDetails.push({
                    id: index,
                    text: q.question,
                    status: 'incorrect',
                    marks: -q.negative,
                    selectedOption: answer.selectedIndex,
                    correctOption: q.correct,
                    timeTaken: formatTime(questionTimes[q.uniqueId] || 0)
                });
            }
        } else {
            skipped++;
            questionDetails.push({
                id: index,
                text: q.question,
                status: 'unanswered',
                marks: 0,
                selectedOption: null,
                correctOption: q.correct,
                timeTaken: formatTime(questionTimes[q.uniqueId] || 0)
            });
        }
    });

    const percentage = totalMarks > 0 ? ((earnedMarks / totalMarks) * 100) : 0;
    const accuracy = (correct + wrong) > 0 ? ((correct / (correct + wrong)) * 100) : 0;
    const displayPercentage = Math.max(0, Math.round(percentage));

    // Populate all result sections
    populateHeader();
    populateOverview(timeTakenSecs, earnedMarks, totalMarks);
    createEnhancedDonutChart(correct, wrong, skipped);
    populateBadge(displayPercentage, avgTimePerQ, accuracy);
    populatePerformance(displayPercentage);
    populateSummary(timeTakenSecs, avgTimePerQ, accuracy, correct, wrong, skipped, earnedPosMarks, lostNegMarks);
    populateQuestionBreakdown(questionDetails, correct, wrong, skipped);
    populateChapterAnalysis();
}

/**
 * Populate result header (title and timestamp)
 */
function populateHeader() {
    const subjectTitle = selectionMode === 'multi'
        ? `${currentSubject}: Multi-Chapter (${selectedChapters.length})`
        : `${currentSubject}: ${selectedChapters[0]}`;
    document.getElementById('result-title').textContent = subjectTitle;

    const now = testEndTime ? new Date(testEndTime) : new Date();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[now.getMonth()];
    const date = now.getDate();
    const year = now.getFullYear();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    document.getElementById('result-timestamp').textContent = `Completed on ${month} ${date}, ${year} ${timeStr} IST`;
}

/**
 * Populate overview card (time taken, marks)
 * @param {number} timeTakenSecs - Time taken in seconds
 * @param {number} earnedMarks - Marks earned
 * @param {number} totalMarks - Total marks
 */
function populateOverview(timeTakenSecs, earnedMarks, totalMarks) {
    const mm = Math.floor(timeTakenSecs / 60).toString().padStart(2, '0');
    const ss = (timeTakenSecs % 60).toString().padStart(2, '0');
    document.getElementById('overview-time-taken').textContent = `${mm}:${ss}`;

    const earnedEl = document.querySelector('.earned-text');
    const totalEl = document.querySelector('.total-text');
    if (earnedEl) earnedEl.textContent = earnedMarks;
    if (totalEl) totalEl.textContent = totalMarks;
}

/**
 * Populate badge based on performance
 * @param {number} percentage - Score percentage
 * @param {number} avgTimePerQ - Average time per question
 * @param {number} accuracy - Accuracy percentage
 */
function populateBadge(percentage, avgTimePerQ, accuracy) {
    const badgeTitle = document.getElementById('badge-title');
    const badgeIcon = document.querySelector('.badge-icon i');

    if (percentage > 80) {
        badgeTitle.textContent = currentSubject + " Expert";
        badgeIcon.className = "fas fa-trophy";
    } else if (avgTimePerQ < 30) {
        badgeTitle.textContent = "Speed Racer";
        badgeIcon.className = "fa-solid fa-fire";
    } else if (accuracy > 80) {
        badgeTitle.textContent = "Sharp Shooter";
        badgeIcon.className = "fas fa-crosshairs";
    } else {
        badgeTitle.textContent = "Keep Growing";
        badgeIcon.className = "fa-solid fa-seedling";
    }
}

/**
 * Populate performance card (message and percentage)
 * @param {number} percentage - Score percentage
 */
function populatePerformance(percentage) {
    const msgHeader = document.getElementById('msg-header');
    const msgDesc = document.getElementById('msg-desc');
    const msgPercent = document.getElementById('msg-percent');
    const perfIcon = document.querySelector('.performance-card .perf-icon i');

    msgPercent.textContent = percentage + '%';

    if (percentage >= 90) {
        msgHeader.textContent = "Outstanding!";
        msgDesc.innerHTML = "Excellent performance! You have a deep understanding of the subject.";
        if (perfIcon) perfIcon.className = "fas fa-crown";
    } else if (percentage >= 75) {
        msgHeader.textContent = "Great Job!";
        msgDesc.innerHTML = "You scored well! A little more practice and you'll be perfect.";
        if (perfIcon) perfIcon.className = "fas fa-star";
    } else if (percentage >= 50) {
        msgHeader.textContent = "Well Done!";
        msgDesc.innerHTML = "You passed! Continue reviewing the chapters to boost your marks.";
        if (perfIcon) perfIcon.className = "fas fa-thumbs-up";
    } else {
        msgHeader.textContent = "Keep Practicing!";
        msgDesc.innerHTML = "Every mistake is a lesson. Review your errors and try again!";
        if (perfIcon) perfIcon.className = "fas fa-chart-line";
    }
}

/**
 * Populate summary statistics card
 * @param {number} timeTakenSecs - Time taken in seconds
 * @param {number} avgTimePerQ - Average time per question
 * @param {number} accuracy - Accuracy percentage
 * @param {number} correct - Correct answers count
 * @param {number} wrong - Wrong answers count
 * @param {number} skipped - Skipped questions count
 * @param {number} earnedPosMarks - Total positive marks earned
 * @param {number} lostNegMarks - Total negative marks lost
 */
function populateSummary(timeTakenSecs, avgTimePerQ, accuracy, correct, wrong, skipped, earnedPosMarks, lostNegMarks) {
    const mm = Math.floor(timeTakenSecs / 60).toString().padStart(2, '0');
    const ss = (timeTakenSecs % 60).toString().padStart(2, '0');

    document.getElementById('summary-total-q').textContent = questions.length;
    document.getElementById('summary-correct-q').textContent = correct;
    document.getElementById('summary-wrong-q').textContent = wrong;
    document.getElementById('summary-unanswered-q').textContent = skipped;
    document.getElementById('summary-accuracy').textContent = Math.round(accuracy) + '%';
    document.getElementById('summary-total-time').textContent = mm + 'm ' + ss + 's';
    document.getElementById('summary-avg-time').textContent = avgTimePerQ + 's';

    // Update legend marks
    document.querySelector('#legend-correct .legend-marks').textContent = `+${earnedPosMarks} Marks`;
    document.querySelector('#legend-incorrect .legend-marks').textContent = `-${lostNegMarks} Marks`;
    document.querySelector('#legend-unanswered .legend-marks').textContent = `0 Marks`;
}

/* ============================================================================
   DONUT CHART CREATION
   ============================================================================ */

/**
 * Create interactive donut chart
 * @param {number} correct - Correct answers count
 * @param {number} wrong - Wrong answers count
 * @param {number} skipped - Skipped questions count
 */
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
        return { x, y };
    }

    let segments = '';

    if (correctPct > 0) {
        const pos = getArcPosition(0, correctPct);
        segments += `
            <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${COLORS.correct}" stroke-width="${strokeWidth}" stroke-dasharray="${correctDash} ${circumference}" stroke-dashoffset="${correctOffset}" transform="rotate(-90 ${center} ${center})" class="chart-segment" data-label="Correct" data-count="${correct}" data-pct="${Math.round(correctPct)}" />
            ${correctPct > 8 ? `<text x="${pos.x}" y="${pos.y}" text-anchor="middle" dominant-baseline="central" fill="white" font-size="16" font-weight="700" font-family="'Outfit', sans-serif" class="segment-number">${correct}</text>` : ''}
        `;
    }
    if (incorrectPct > 0) {
        const pos = getArcPosition(correctPct, incorrectPct);
        segments += `
            <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${COLORS.incorrect}" stroke-width="${strokeWidth}" stroke-dasharray="${incorrectDash} ${circumference}" stroke-dashoffset="${incorrectOffset}" transform="rotate(-90 ${center} ${center})" class="chart-segment" data-label="Incorrect" data-count="${wrong}" data-pct="${Math.round(incorrectPct)}" />
            ${incorrectPct > 8 ? `<text x="${pos.x}" y="${pos.y}" text-anchor="middle" dominant-baseline="central" fill="white" font-size="16" font-weight="700" font-family="'Outfit', sans-serif" class="segment-number">${wrong}</text>` : ''}
        `;
    }
    if (unansweredPct > 0) {
        const pos = getArcPosition(correctPct + incorrectPct, unansweredPct);
        segments += `
            <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${COLORS.unanswered}" stroke-width="${strokeWidth}" stroke-dasharray="${unansweredDash} ${circumference}" stroke-dashoffset="${unansweredOffset}" transform="rotate(-90 ${center} ${center})" class="chart-segment" data-label="Unanswered" data-count="${skipped}" data-pct="${Math.round(unansweredPct)}" />
            ${unansweredPct > 8 ? `<text x="${pos.x}" y="${pos.y}" text-anchor="middle" dominant-baseline="central" fill="white" font-size="16" font-weight="700" font-family="'Outfit', sans-serif" class="segment-number">${skipped}</text>` : ''}
        `;
    }

    const chartContainer = document.getElementById('donut-chart-container');
    const chartCenter = chartContainer.querySelector('.chart-center');
    const tooltip = document.getElementById('chart-tooltip');

    chartContainer.innerHTML = `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="donut-svg">
            ${segments}
        </svg>
    `;
    if (chartCenter) chartContainer.appendChild(chartCenter);
    if (tooltip) chartContainer.appendChild(tooltip);

    initChartTooltips();
}

/**
 * Initialize chart tooltips
 */
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

/* ============================================================================
   QUESTION BREAKDOWN TABLE
   ============================================================================ */

/**
 * Populate question breakdown table with filters
 * @param {Array} questionDetails - Array of question detail objects
 * @param {number} correct - Correct answers count
 * @param {number} wrong - Wrong answers count
 * @param {number} skipped - Skipped questions count
 */
function populateQuestionBreakdown(questionDetails, correct, wrong, skipped) {
    // Update filter badges
    const allBadge = document.querySelector('[data-filter="all"] .count-badge');
    const correctBadge = document.querySelector('[data-filter="correct"] .count-badge');
    const incorrectBadge = document.querySelector('[data-filter="incorrect"] .count-badge');
    const unansweredBadge = document.querySelector('[data-filter="unanswered"] .count-badge');
    if (allBadge) allBadge.textContent = questions.length;
    if (correctBadge) correctBadge.textContent = correct;
    if (incorrectBadge) incorrectBadge.textContent = wrong;
    if (unansweredBadge) unansweredBadge.textContent = skipped;

    // Render initial table
    renderQuestionTable(questionDetails, 'all');

    // Set up filter buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderQuestionTable(questionDetails, btn.dataset.filter);
        });
    });
}

/**
 * Render question table based on filter
 * @param {Array} questionDetails - Array of question detail objects
 * @param {string} filter - Filter type ('all', 'correct', 'incorrect', 'unanswered')
 */
function renderQuestionTable(questionDetails, filter) {
    const tbody = document.getElementById('breakdown-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const filtered = filter === 'all'
        ? questionDetails
        : questionDetails.filter(q => q.status === filter);

    if (filtered.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="5" style="text-align: center; padding: 3rem; color: var(--text-muted); font-style: italic;">
                No questions found in this category
            </td>
        `;
        tbody.appendChild(emptyRow);
        return;
    }

    filtered.forEach((q) => {
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

        row.innerHTML = `
            <td>${q.id + 1}</td>
            <td class="question-text">${q.text}</td>
            <td>
                <div class="status-pill ${pillClass}">
                    <i class="fas ${iconClass}"></i>
                    ${statusLabel}
                </div>
            </td>
            <td>${q.timeTaken || '0m 0s'}</td>
            <td class="marks-cell ${marksClass}">${marksVal}</td>
        `;
        tbody.appendChild(row);
    });
}

/* ============================================================================
   CHAPTER ANALYSIS
   ============================================================================ */

/**
 * Generate chapter-wise analysis
 */
function populateChapterAnalysis() {
    const analysisList = document.getElementById('analysis-list');
    if (!analysisList) return;

    // Group questions by chapter
    const chapterStats = {};
    questions.forEach(q => {
        if (!chapterStats[q.chapter]) {
            chapterStats[q.chapter] = { total: 0, correct: 0 };
        }
        chapterStats[q.chapter].total++;

        const answer = userAnswers[q.uniqueId];
        if (answer && answer.selectedIndex === q.correct) {
            chapterStats[q.chapter].correct++;
        }
    });

    // Render chapter analysis
    analysisList.innerHTML = '';
    for (const chapter in chapterStats) {
        const stats = chapterStats[chapter];
        const percentage = (stats.correct / stats.total) * 100;
        const progressClass = percentage >= 75 ? 'success' : (percentage >= 50 ? 'warning' : 'danger');
        const countClass = percentage >= 75 ? 'success' : (percentage >= 50 ? 'warning' : 'danger');

        const item = document.createElement('div');
        item.className = 'analysis-item';
        item.innerHTML = `
            <div class="item-header">
                <div class="chapter-name">${chapter}</div>
                <div class="chapter-score">
                    <span class="count-val ${countClass}">${stats.correct}</span>
                    <span class="separator">/</span>
                    <span class="count-val">${stats.total}</span>
                    <span class="text">Correct</span>
                </div>
            </div>
            <div class="progress-container">
                <div class="progress-bar ${progressClass}" style="width: ${percentage}%"></div>
            </div>
        `;
        analysisList.appendChild(item);
    }
}

/* ============================================================================
   EVENT LISTENERS
   ============================================================================ */

/**
 * Set up all event listeners for the result page
 */
function setupEventListeners() {
    if (navRetakeBtn) navRetakeBtn.addEventListener('click', () => goToHome(true));
    if (navHomeBtn) navHomeBtn.addEventListener('click', () => goToHome());
    if (viewAnswerKeyBtn) viewAnswerKeyBtn.addEventListener('click', () => goToAnswerKey());

    const viewSolutionsLink = document.getElementById('view-solutions-link');
    if (viewSolutionsLink) {
        viewSolutionsLink.addEventListener('click', (e) => {
            e.preventDefault();
            goToAnswerKey();
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
