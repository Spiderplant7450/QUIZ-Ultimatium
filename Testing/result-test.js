// ==========================================================================
// RESULT PAGE TEST JAVASCRIPT
// Use this file to test functionality changes before applying to app.js
// ==========================================================================

// Sample data for testing
const testData = {
    correct: 10,
    incorrect: 2,
    unanswered: 2,
    totalQuestions: 14,
    totalMarks: 70,
    earnedMarks: 48,
    timeTaken: 252, // in seconds (4:12)
    subject: "Political Science",
    chapter: "The End of Bipolarity",
    percentage: 68,
    timestamp: "Feb 5, 2026 05:47 PM IST",
    chapters: [
        { name: "End of Bipolarity", correct: 8, total: 10 },
        { name: "Contemporary Powers of South Asia", correct: 5, total: 10 },
        { name: "International Organisations", correct: 2, total: 10 }
    ],
    questions: [
        { id: 1, text: "What is End of Bipolarity ?", status: "correct", time: 12, marks: 5 },
        { id: 2, text: "What is End of Bipo.... ?", status: "incorrect", time: 35, marks: -1 },
        { id: 3, text: "What is End of Bipolarity ?", status: "unanswered", time: 5, marks: 0 },
        { id: 4, text: "What is End of Bipolarity ?", status: "correct", time: 19, marks: 5 },
        { id: 5, text: "What is End of Bipolarity ?", status: "correct", time: 7, marks: 5 },
        { id: 6, text: "What is End of Bipolarity ?", status: "correct", time: 24, marks: 5 },
        { id: 7, text: "What is End of Bipolarity ?", status: "correct", time: 15, marks: 5 },
        { id: 8, text: "What is End of Bipolarity ?", status: "correct", time: 8, marks: 5 },
        { id: 9, text: "What is End of Bipolarity ?", status: "correct", time: 11, marks: 5 },
        { id: 10, text: "What is End of Bipolarity ?", status: "correct", time: 20, marks: 5 },
        { id: 11, text: "What is End of Bipolarity ?", status: "correct", time: 14, marks: 5 },
        { id: 12, text: "What is End of Bipolarity ?", status: "correct", time: 22, marks: 5 },
        { id: 13, text: "What is End of Bipolarity ?", status: "incorrect", time: 45, marks: -1 },
        { id: 14, text: "What is End of Bipolarity ?", status: "unanswered", time: 10, marks: 0 }
    ]
};

// Colors for chart segments
const COLORS = {
    correct: '#22c55e',
    incorrect: '#ef4444',
    unanswered: '#94a3b8'
};

/**
 * Formats time in seconds to mm:ss or m s
 */
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatTimeLong(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
}

// Create donut chart with proper SVG rendering
function createDonutChart(correct, incorrect, unanswered) {
    const total = correct + incorrect + unanswered;

    // Calculate percentages
    const correctPct = (correct / total) * 100;
    const incorrectPct = (incorrect / total) * 100;
    const unansweredPct = (unanswered / total) * 100;

    // SVG circle parameters
    const size = 200;
    const strokeWidth = 40;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const center = size / 2;

    // Gap between segments (in percentage points)
    const gapPct = total > 0 ? 1.5 : 0;

    // Calculate dash arrays for each segment (reduced by gap)
    const correctDash = Math.max(0, (correctPct - (correctPct > 0 ? gapPct : 0)) / 100) * circumference;
    const incorrectDash = Math.max(0, (incorrectPct - (incorrectPct > 0 ? gapPct : 0)) / 100) * circumference;
    const unansweredDash = Math.max(0, (unansweredPct - (unansweredPct > 0 ? gapPct : 0)) / 100) * circumference;

    // Calculate rotation offsets
    const correctOffset = 0;
    const incorrectOffset = -(correctPct / 100 * circumference);
    const unansweredOffset = -((correctPct + incorrectPct) / 100 * circumference);

    // Function to calculate text position on the arc
    function getArcPosition(startPct, segmentPct) {
        const middleAngle = ((startPct + segmentPct / 2) / 100) * 360;
        const angleRad = (middleAngle - 90) * (Math.PI / 180);
        const x = center + radius * Math.cos(angleRad);
        const y = center + radius * Math.sin(angleRad);
        return { x, y, angle: middleAngle };
    }

    // Build SVG
    let segments = '';

    // Correct segment
    if (correctPct > 0) {
        const pos = getArcPosition(0, correctPct);
        segments += `
            <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${COLORS.correct}" stroke-width="${strokeWidth}" stroke-dasharray="${correctDash} ${circumference}" stroke-dashoffset="${correctOffset}" transform="rotate(-90 ${center} ${center})" class="chart-segment" data-label="Correct" data-count="${correct}" data-pct="${Math.round(correctPct)}" style="transition: all 0.3s ease;" />
            ${correctPct > 8 ? `<text x="${pos.x}" y="${pos.y}" text-anchor="middle" dominant-baseline="central" fill="white" font-size="16" font-weight="700" font-family="'Outfit', sans-serif" class="segment-number" style="pointer-events: none;">${correct}</text>` : ''}
        `;
    }

    // Incorrect segment
    if (incorrectPct > 0) {
        const pos = getArcPosition(correctPct, incorrectPct);
        segments += `
            <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${COLORS.incorrect}" stroke-width="${strokeWidth}" stroke-dasharray="${incorrectDash} ${circumference}" stroke-dashoffset="${incorrectOffset}" transform="rotate(-90 ${center} ${center})" class="chart-segment" data-label="Incorrect" data-count="${incorrect}" data-pct="${Math.round(incorrectPct)}" style="transition: all 0.3s ease;" />
            ${incorrectPct > 8 ? `<text x="${pos.x}" y="${pos.y}" text-anchor="middle" dominant-baseline="central" fill="white" font-size="16" font-weight="700" font-family="'Outfit', sans-serif" class="segment-number" style="pointer-events: none;">${incorrect}</text>` : ''}
        `;
    }

    // Unanswered segment
    if (unansweredPct > 0) {
        const pos = getArcPosition(correctPct + incorrectPct, unansweredPct);
        segments += `
            <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${COLORS.unanswered}" stroke-width="${strokeWidth}" stroke-dasharray="${unansweredDash} ${circumference}" stroke-dashoffset="${unansweredOffset}" transform="rotate(-90 ${center} ${center})" class="chart-segment" data-label="Unanswered" data-count="${unanswered}" data-pct="${Math.round(unansweredPct)}" style="transition: all 0.3s ease;" />
            ${unansweredPct > 8 ? `<text x="${pos.x}" y="${pos.y}" text-anchor="middle" dominant-baseline="central" fill="white" font-size="16" font-weight="700" font-family="'Outfit', sans-serif" class="segment-number" style="pointer-events: none;">${unanswered}</text>` : ''}
        `;
    }

    return `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="donut-svg">
            <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="#d7daec" opacity="0" stroke-width="${strokeWidth}" />
            ${segments}
        </svg>
    `;
}

// Initialize tooltip functionality
function initTooltips() {
    const chartContainer = document.getElementById('donut-chart-container');
    const tooltip = document.getElementById('chart-tooltip');
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

// Update the entire result page
function updateResultPage(data) {
    // Header
    document.getElementById('result-title').textContent = `${data.subject}: ${data.chapter}`;
    document.getElementById('result-timestamp').textContent = `Completed on ${data.timestamp}`;

    // Overview Card
    document.querySelector('.earned-text').textContent = data.earnedMarks;
    document.querySelector('.total-text').textContent = data.totalMarks;
    document.getElementById('overview-time-taken').textContent = formatTime(data.timeTaken);

    // Donut Chart
    const chartContainer = document.getElementById('donut-chart-container');
    const chartCenter = chartContainer.querySelector('.chart-center');
    const tooltip = document.getElementById('chart-tooltip');

    chartContainer.innerHTML = createDonutChart(data.correct, data.incorrect, data.unanswered);
    chartContainer.appendChild(chartCenter);
    chartContainer.appendChild(tooltip);
    initTooltips();

    // Performance Card
    const percentage = Math.round((data.earnedMarks / data.totalMarks) * 100);
    document.getElementById('msg-percent').textContent = `${percentage}%`;

    let msgHeader = "Good Effort!";
    let msgDesc = "You're making progress. Keep practicing to improve your score!";

    if (percentage >= 90) {
        msgHeader = "Outstanding!";
        msgDesc = "Excellent performance! You have a deep understanding of the subject.";
    } else if (percentage >= 75) {
        msgHeader = "Great Job!";
        msgDesc = "You scored well! A little more practice and you'll be perfect.";
    } else if (percentage >= 50) {
        msgHeader = "Well Done!";
        msgDesc = "You passed! Continue reviewing the chapters to boost your marks.";
    }

    document.getElementById('msg-header').textContent = msgHeader;
    document.getElementById('msg-desc').textContent = msgDesc;

    // Summary Card
    document.getElementById('summary-total-q').textContent = data.totalQuestions;
    document.getElementById('summary-correct-q').textContent = data.correct;
    document.getElementById('summary-wrong-q').textContent = data.incorrect;
    document.getElementById('summary-unanswered-q').textContent = data.unanswered;

    const accuracy = data.correct + data.incorrect > 0
        ? Math.round((data.correct / (data.correct + data.incorrect)) * 100)
        : 0;
    document.getElementById('summary-accuracy').textContent = `${accuracy}%`;
    document.getElementById('summary-total-time').textContent = formatTimeLong(data.timeTaken);

    const avgTime = Math.round(data.timeTaken / data.totalQuestions);
    document.getElementById('summary-avg-time').textContent = `${avgTime}s`;

    // Filter Badges
    document.querySelector('[data-filter="all"] .count-badge').textContent = data.totalQuestions;
    document.querySelector('[data-filter="correct"] .count-badge').textContent = data.correct;
    document.querySelector('[data-filter="incorrect"] .count-badge').textContent = data.incorrect;
    document.querySelector('[data-filter="unanswered"] .count-badge').textContent = data.unanswered;

    // Chapter Analysis
    populateChapterAnalysis(data.chapters);

    // Question Table
    populateQuestionTable(data.questions);
}

function populateChapterAnalysis(chapters) {
    const list = document.querySelector('.analysis-list');
    list.innerHTML = '';

    chapters.forEach(chapter => {
        const pct = Math.round((chapter.correct / chapter.total) * 100);
        const statusClass = pct >= 70 ? 'success' : (pct >= 40 ? 'warning' : 'danger');

        const item = document.createElement('div');
        item.className = 'analysis-item';
        item.innerHTML = `
            <div class="item-header">
                <span class="chapter-name">${chapter.name}</span>
                <span class="chapter-score">
                    <span class="count-val ${statusClass}">${chapter.correct}</span>
                    <span class="separator">/</span>
                    <span class="total-val">${chapter.total}</span>
                    <span class="text">Correct</span>
                </span>
            </div>
            <div class="progress-container">
                <div class="progress-bar ${statusClass}" style="width: ${pct}%;"></div>
            </div>
        `;
        list.appendChild(item);
    });
}

function populateQuestionTable(questions, filter = 'all') {
    const tbody = document.getElementById('breakdown-body');
    tbody.innerHTML = '';

    const filtered = filter === 'all'
        ? questions
        : questions.filter(q => q.status === filter);

    filtered.forEach((q, index) => {
        const row = document.createElement('tr');
        const statusLabel = q.status.charAt(0).toUpperCase() + q.status.slice(1);
        const iconClass = q.status === 'correct' ? 'fa-circle-check' : (q.status === 'incorrect' ? 'fa-circle-xmark' : 'fa-circle-question');
        const pillClass = q.status === 'correct' ? 'success' : (q.status === 'incorrect' ? 'danger' : 'muted');
        const marksClass = q.status === 'correct' ? 'success-text' : (q.status === 'incorrect' ? 'danger-text' : 'muted-text');
        const marksVal = q.marks > 0 ? `+${q.marks}` : (q.marks < 0 ? `${q.marks}` : '0');

        row.innerHTML = `
            <td>${index + 1}.</td>
            <td class="question-text">${q.text}</td>
            <td>
                <div class="status-pill ${pillClass}">
                    <i class="fas ${iconClass}"></i> ${statusLabel}
                </div>
            </td>
            <td>${q.time}s</td>
            <td class="marks-cell ${marksClass}">${marksVal} Marks</td>
        `;
        tbody.appendChild(row);
    });
}

// Initialize Filters
function initFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            populateQuestionTable(testData.questions, btn.dataset.filter);
        });
    });
}

// Initialize Action Buttons
function initActionButtons() {
    const retakeBtn = document.getElementById('nav-retake-btn');
    const homeBtn = document.getElementById('nav-home-btn');
    const answerKeyBtn = document.getElementById('view-answer-key-btn');

    if (retakeBtn) {
        retakeBtn.addEventListener('click', () => {
            console.log('Retake Test clicked');
            alert('Retaking test...');
        });
    }

    if (homeBtn) {
        homeBtn.addEventListener('click', () => {
            console.log('Back to Home clicked');
            alert('Redirecting to home...');
        });
    }

    if (answerKeyBtn) {
        answerKeyBtn.addEventListener('click', () => {
            console.log('View Answer Key clicked');
            alert('Opening answer key...');
        });
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateResultPage(testData);
    initFilters();
    initActionButtons();
});

// Expose functions for testing
window.testResultPage = {
    updateResultPage,
    testData,
    setData: (correct, incorrect, unanswered) => {
        const newTotal = correct + incorrect + unanswered;
        const newData = {
            ...testData,
            correct,
            incorrect,
            unanswered,
            totalQuestions: newTotal,
            earnedMarks: (correct * 5) - (incorrect * 1) // Mock marks calc
        };
        updateResultPage(newData);
    }
};
