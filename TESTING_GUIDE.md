# Quiz Application Testing Guide

## Quick Start

1. **Open the Application**
   - Navigate to: `d:\quiz\quiz 3 - Copy\index.html`
   - Open it in your web browser (Chrome, Firefox, Edge, or Safari)

2. **Expected Initial State**
   - ✅ Hero section with "Mock Test Portal" title
   - ✅ Subject dropdown (enabled)
   - ✅ Chapter dropdown (disabled/grayed out)
   - ✅ Reshuffle toggle (visible and checked)
   - ✅ Start Test button (disabled/grayed out)
   - ✅ Three feature cards at the bottom

## Step-by-Step Testing

### Test 1: Home Page - Subject Selection

1. Click on **"Select Subject"** dropdown
2. **Expected:** Dropdown opens showing three subjects:
   - Political Science
   - History  
   - Geography
3. Click on **"Political Science"**
4. **Expected:**
   - Dropdown closes
   - "Political Science" appears in the trigger
   - Chapter dropdown becomes enabled (no longer grayed out)

### Test 2: Home Page - Chapter Selection (Multi-Select Mode)

1. Click on **"Select Chapter"** dropdown
2. **Expected:** Dropdown opens showing:
   - Two radio buttons at top (Multi-select mode ✓, Single-select mode)
   - Book headers (e.g., "Contemporary World Politics")
   - Chapters under each book with question counts
   - Footer with "0 Chapters Selected", Apply, and Clear buttons
   - Mode hint: "Multi-select mode: 50 random questions, 60-minute limit"

3. Click on **multiple chapters** (e.g., "The End of Bipolarity", "US Hegemony in World Politics")
4. **Expected:**
   - Checkboxes appear next to selected chapters
   - "Selected count" updates (e.g., "2 Chapters Selected")

5. Click **"Apply"** button
6. **Expected:**
   - Dropdown closes
   - Trigger shows "2 Chapters Selected"
   - Start Test button becomes enabled (blue/clickable)

### Test 3: Home Page - Single-Select Mode

1. Click on **"Select Chapter"** dropdown again
2. Click on **"Single-select mode"** radio button
3. **Expected:**
   - Mode hint changes to: "Single-select mode: All questions, No-time limit"
   - Reshuffle toggle becomes visible below the dropdowns
   - Previous selections are cleared

4. Click on **one chapter**
5. **Expected:**
   - Only one chapter can be selected at a time
   - Clicking another chapter deselects the first

6. Click **"Apply"**
7. **Expected:**
   - Dropdown closes
   - Trigger shows the chapter name
   - Start Test button becomes enabled

### Test 4: Home Page - Clear Selection

1. With chapters selected, click **"Select Chapter"** dropdown
2. Click **"Clear"** button
3. **Expected:**
   - All selections are cleared
   - Count shows "0 Chapters Selected"
   - Start Test button becomes disabled

### Test 5: Navigation to Test Page

1. Select a subject and chapters (either mode)
2. Click **"Apply"**
3. Click **"Start Test"** button
4. **Expected:**
   - Browser navigates to `pages/test.html`
   - Test page loads with:
     - Header showing subject/chapter title
     - Timer (either countdown or "No Limit")
     - Question 1 displayed
     - Four options (A, B, C, D)
     - Navigation buttons at bottom
     - Sidebar with question palette on the right

### Test 6: Test Page - Question Navigation

1. Read Question 1
2. Click on **an option** to select it
3. **Expected:**
   - Option highlights/becomes selected
   - Radio button is checked

4. Click **"Save & Next"** button
5. **Expected:**
   - Question 2 appears
   - Progress indicator updates (e.g., "2/50 Questions")
   - Palette button #1 turns green (answered)
   - Palette button #2 becomes active (highlighted)

6. Click **"Previous"** button
7. **Expected:**
   - Returns to Question 1
   - Your previous answer is still selected

### Test 7: Test Page - Question Palette

1. In the sidebar, click on **palette button #5**
2. **Expected:**
   - Jumps directly to Question 5
   - Progress indicator shows "5/X Questions"

3. Click on **palette button #1** to return
4. **Expected:**
   - Returns to Question 1

### Test 8: Test Page - Mark for Review

1. On any question, click **"Mark for Review & Next"** button
2. **Expected:**
   - Moves to next question
   - Previous question's palette button turns purple/orange (marked for review)
   - Legend count for "Marked for Review" increases

### Test 9: Test Page - Clear Response

1. Select an option on a question
2. Click **"Clear Response"** button
3. **Expected:**
   - Selection is removed
   - Palette button changes to "Not Answered" (red/orange)

### Test 10: Test Page - Timer (Multi-Select Mode Only)

1. If in multi-select mode, observe the timer
2. **Expected:**
   - Timer counts down from 60:00
   - Timer turns orange when < 15 minutes
   - Timer turns red when < 5 minutes

### Test 11: Test Page - Submit Test

1. Answer a few questions
2. Click **"Submit"** button
3. **Expected:**
   - Modal appears showing:
     - Count of answered questions
     - Count of not answered questions
     - Count of not visited questions
     - Count of marked for review
     - "Are you sure to submit?" message
   - Two buttons: Cancel and Submit

4. Click **"Submit"** (confirm)
5. **Expected:**
   - Browser navigates to `pages/result.html`
   - Result page loads

### Test 12: Result Page - Score Display

1. On the result page, verify:
   - ✅ Subject/chapter title at top
   - ✅ Timestamp showing completion date/time
   - ✅ Donut chart showing correct (green), incorrect (red), unanswered (gray)
   - ✅ Marks displayed (earned/total)
   - ✅ Time taken displayed
   - ✅ Badge earned (e.g., "Keep Learning", "Expert", etc.)
   - ✅ Performance message based on score
   - ✅ Summary statistics (total questions, correct, incorrect, accuracy, etc.)

2. Hover over **donut chart segments**
3. **Expected:**
   - Tooltip appears showing count and percentage

### Test 13: Result Page - Question Breakdown

1. Scroll down to **"Question-wise Breakdown"** section
2. **Expected:**
   - Table showing all questions
   - Columns: #, Question, Result, Time Taken, Marks
   - Filter buttons at top: All, Correct, Incorrect, Unanswered

3. Click **"Correct"** filter
4. **Expected:**
   - Table shows only correct answers
   - Badge count updates

5. Click **"Incorrect"** filter
6. **Expected:**
   - Table shows only incorrect answers

### Test 14: Result Page - Chapter Analysis

1. Scroll down to **"Chapter-Wise Analysis"** section
2. **Expected:**
   - List of chapters with:
     - Chapter name
     - Correct/Total count
     - Progress bar showing percentage
   - Progress bars are color-coded (green for good, orange for medium, red for poor)

### Test 15: Navigation to Answer Key

1. Click **"View Answer Key"** button (top right)
2. **Expected:**
   - Browser navigates to `pages/answer-key.html`
   - Answer key page loads

### Test 16: Answer Key Page

1. On the answer key page, verify:
   - ✅ Header with "Answer Key" title
   - ✅ "Back to Results" button
   - ✅ All questions displayed in order
   - ✅ Each question shows:
     - Question number and text
     - All four options
     - Correct answer highlighted in green
     - Your answer (if different) highlighted in red
     - Status indicator (Correct/Incorrect/Skipped)

2. Scroll through questions
3. **Expected:**
   - Can see all questions and answers
   - Visual indicators are clear

### Test 17: Navigation Back to Results

1. Click **"Back to Results"** button
2. **Expected:**
   - Returns to `pages/result.html`
   - All data is still displayed correctly

### Test 18: Navigation to Home

1. On result page, click **"Back to Home"** button (top left)
2. **Expected:**
   - Returns to `index.html`
   - Home page loads fresh (selections cleared)

### Test 19: Retake Test

1. On result page, click **"Retake"** button
2. **Expected:**
   - Returns to `index.html`
   - Can start a new test

## Console Error Check

**Important:** Open browser Developer Tools (F12) and check the Console tab throughout testing.

**Expected:** No red error messages should appear. If you see errors, note them down.

## Common Issues to Watch For

### Issue 1: "Cannot read property of undefined"
- **Cause:** Registry not loaded or path incorrect
- **Check:** Verify `js/registry.js` loads before other scripts

### Issue 2: Dropdowns don't open
- **Cause:** JavaScript not loading or event listeners not attached
- **Check:** Console for errors, verify script tags in HTML

### Issue 3: Navigation doesn't work
- **Cause:** Incorrect file paths
- **Check:** Verify paths in JavaScript (e.g., `window.location.href = 'pages/test.html'`)

### Issue 4: Styles look broken
- **Cause:** CSS files not loading
- **Check:** Verify CSS file paths in HTML `<link>` tags

### Issue 5: Data doesn't persist between pages
- **Cause:** sessionStorage not working
- **Check:** Browser privacy settings, ensure sessionStorage is enabled

## Testing Checklist

Use this checklist to track your testing progress:

- [ ] Home page loads correctly
- [ ] Subject dropdown works
- [ ] Chapter dropdown works (multi-select)
- [ ] Chapter dropdown works (single-select)
- [ ] Mode toggle works
- [ ] Reshuffle toggle appears/disappears correctly
- [ ] Start Test button enables/disables correctly
- [ ] Navigation to test page works
- [ ] Test page loads with questions
- [ ] Question navigation works (next, previous)
- [ ] Question palette works
- [ ] Answer selection works
- [ ] Mark for review works
- [ ] Clear response works
- [ ] Timer works (multi-select mode)
- [ ] Submit modal works
- [ ] Navigation to result page works
- [ ] Result page displays correctly
- [ ] Donut chart renders
- [ ] Question breakdown table works
- [ ] Filters work on breakdown table
- [ ] Chapter analysis displays
- [ ] Navigation to answer key works
- [ ] Answer key displays correctly
- [ ] Navigation back to results works
- [ ] Navigation to home works
- [ ] No console errors

## Success Criteria

✅ **All features work as expected**
✅ **No console errors**
✅ **UI looks polished and professional**
✅ **Data persists correctly between pages**
✅ **All navigation works smoothly**

## Reporting Issues

If you find any issues, please note:
1. **What you did** (steps to reproduce)
2. **What you expected** (expected behavior)
3. **What happened** (actual behavior)
4. **Console errors** (if any)

---

**Ready to test!** Start with Test 1 and work your way through. Good luck! 🚀
