// Helpers
const $ = (sel) => document.querySelector(sel);
const byId = (id) => document.getElementById(id);

function getDays(selection, custom) {
    if (selection === 'Mon-Fri') return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    if (selection === 'Mon-Sat') return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const parts = (custom || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    return parts.length ? parts : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
}

function parseList(text) {
    return (text || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
}

function parseBreaks(text) {
    // Accept "After P2" or just numbers like "2, 5"
    const tokens = (text || '').split(/[,;]+/).map((t) => t.trim()).filter(Boolean);
    const indices = [];
    for (const t of tokens) {
        const m = t.match(/(\d+)/);
        if (m) indices.push(parseInt(m[1], 10));
    }
    return indices; // period index after which there is a break
}

function buildTable(days, periodsPerDay, breaks, subjects, timeLabels = [], lunchPeriod = null, classroomNumbers = [], subjectTeacherMap = {}) {
    const table = byId('timetable');
    table.innerHTML = '';

    const thead = document.createElement('thead');
    const hr = document.createElement('tr');
    const th0 = document.createElement('th');
    th0.textContent = 'Day / Period';
    hr.appendChild(th0);
    for (let p = 1; p <= periodsPerDay; p++) {
        const th = document.createElement('th');
        const label = timeLabels[p - 1] ? `P${p}\n${timeLabels[p - 1]} IST` : `P${p}`;
        th.innerText = label; // innerText preserves newline
        hr.appendChild(th);
    }
    thead.appendChild(hr);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    let subjectIndex = 0;
    const fallback = ['Math', 'Science', 'English', 'History', 'Geography'];
    const pool = subjects.length ? subjects : fallback;
    
    // Prepare classroom pool - use provided numbers or generate default ones
    const classroomPool = classroomNumbers.length > 0 ? classroomNumbers : 
        Array.from({length: Math.max(5, pool.length)}, (_, i) => `Room ${i + 1}`);

    // Sort classroom pool to ensure sequential ordering
    const sortedClassroomPool = [...classroomPool].sort((a, b) => {
        // Extract numbers from classroom names for proper sorting
        const numA = parseInt(a.toString().match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.toString().match(/\d+/)?.[0] || '0');
        return numA - numB;
    });

    let assignmentIndex = 0;
    days.forEach((day) => {
        const tr = document.createElement('tr');
        const dayCell = document.createElement('td');
        dayCell.textContent = day;
        tr.appendChild(dayCell);

        for (let p = 1; p <= periodsPerDay; p++) {
            const td = document.createElement('td');
            // Mark breaks after certain periods by inserting a break cell
            if (lunchPeriod && p === lunchPeriod) {
                td.className = 'break';
                td.textContent = 'Lunch';
            } else if (breaks.includes(p)) {
                td.className = 'break';
                td.textContent = 'Break';
            } else {
                const subject = pool[subjectIndex % pool.length];
                // Assign classrooms sequentially in order
                const classroom = sortedClassroomPool[assignmentIndex % sortedClassroomPool.length];
                
                // Get faculty name for this subject
                const facultyList = subjectTeacherMap[subject] || [];
                const faculty = facultyList.length > 0 ? facultyList[assignmentIndex % facultyList.length] : 'TBA';
                
                td.innerHTML = `<div class="subject-cell">
                    <div class="subject-name">${subject}</div>
                    <div class="faculty-name">${faculty}</div>
                    <div class="classroom-name">${classroom}</div>
                </div>`;
                subjectIndex++;
                assignmentIndex++;
            }
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
}

function buildTableWithSections(days, periodsPerDay, breaks, sections, timeLabels = [], lunchPeriod = null, classroomNumbers = [], subjectTeacherMap = {}) {
    const table = byId('timetable');
    table.innerHTML = '';

    // Group sections by section name
    const sectionGroups = {};
    sections.forEach(section => {
        if (!sectionGroups[section.section]) {
            sectionGroups[section.section] = [];
        }
        sectionGroups[section.section].push(section);
    });

    // If no specific sections, use the original buildTable function
    if (Object.keys(sectionGroups).length === 0 || (Object.keys(sectionGroups).length === 1 && Object.keys(sectionGroups)[0] === 'Default')) {
        const subjects = sections.map(s => s.subject);
        return buildTable(days, periodsPerDay, breaks, subjects, timeLabels, lunchPeriod, classroomNumbers, subjectTeacherMap);
    }

    // Create separate timetable for each section
    Object.keys(sectionGroups).forEach((sectionName, sectionIndex) => {
        // Add section header
        if (sectionIndex > 0) {
            const spacerRow = document.createElement('tr');
            spacerRow.innerHTML = '<td colspan="' + (periodsPerDay + 1) + '" style="height: 20px; background: #f8f9fa;"></td>';
            table.appendChild(spacerRow);
        }

        const sectionHeader = document.createElement('tr');
        sectionHeader.className = 'section-header';
        const headerCell = document.createElement('td');
        headerCell.colSpan = periodsPerDay + 1;
        headerCell.innerHTML = `<h3 style="margin: 0; padding: 10px; background: #e3f2fd; color: #1976d2; text-align: center; font-weight: bold;">Section: ${sectionName}</h3>`;
        sectionHeader.appendChild(headerCell);
        table.appendChild(sectionHeader);

        // Create table header for this section
        const thead = document.createElement('thead');
        const hr = document.createElement('tr');
        const th0 = document.createElement('th');
        th0.textContent = 'Day / Period';
        hr.appendChild(th0);
        for (let p = 1; p <= periodsPerDay; p++) {
            const th = document.createElement('th');
            const label = timeLabels[p - 1] ? `P${p}\n${timeLabels[p - 1]} IST` : `P${p}`;
            th.innerText = label;
            hr.appendChild(th);
        }
        thead.appendChild(hr);
        table.appendChild(thead);

        // Create table body for this section
        const tbody = document.createElement('tbody');
        let subjectIndex = 0;
        const sectionSubjects = sectionGroups[sectionName].map(s => s.subject);
        
        // Prepare classroom pool for this section
        const classroomPool = classroomNumbers.length > 0 ? classroomNumbers : 
            Array.from({length: Math.max(5, sectionSubjects.length)}, (_, i) => `Room ${i + 1}`);

        // Sort classroom pool to ensure sequential ordering
        const sortedClassroomPool = [...classroomPool].sort((a, b) => {
            const numA = parseInt(a.toString().match(/\d+/)?.[0] || '0');
            const numB = parseInt(b.toString().match(/\d+/)?.[0] || '0');
            return numA - numB;
        });

        let assignmentIndex = 0;
        days.forEach((day) => {
            const tr = document.createElement('tr');
            const dayCell = document.createElement('td');
            dayCell.textContent = day;
            tr.appendChild(dayCell);

            for (let p = 1; p <= periodsPerDay; p++) {
                const td = document.createElement('td');
                if (lunchPeriod && p === lunchPeriod) {
                    td.className = 'break';
                    td.textContent = 'Lunch';
                } else if (breaks.includes(p)) {
                    td.className = 'break';
                    td.textContent = 'Break';
                } else {
                    const subject = sectionSubjects[subjectIndex % sectionSubjects.length];
                    const classroom = sortedClassroomPool[assignmentIndex % sortedClassroomPool.length];
                    
                    // Get faculty name for this subject
                    const facultyList = subjectTeacherMap[subject] || [];
                    const faculty = facultyList.length > 0 ? facultyList[assignmentIndex % facultyList.length] : 'TBA';
                    
                    td.innerHTML = `<div class="subject-cell">
                        <div class="subject-name">${subject}</div>
                        <div class="faculty-name">${faculty}</div>
                        <div class="classroom-name">${classroom}</div>
                    </div>`;
                    subjectIndex++;
                    assignmentIndex++;
                }
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
    });
}

function toggleView(showPreview) {
    byId('form-card').classList.toggle('hidden', showPreview);
    byId('preview-card').classList.toggle('hidden', !showPreview);
}

function resetAll() {
    byId('timetable-form').reset();
    byId('customDays').classList.add('hidden');
    byId('timetable').innerHTML = '';
    byId('schoolTitle').textContent = 'Timetable Preview';
    byId('termTitle').textContent = '';
    toggleView(false);
}

// Event wiring
window.addEventListener('DOMContentLoaded', () => {
    const form = byId('timetable-form');
    const allocList = byId('allocList');
    const teacherList = byId('teacherList');

    byId('workingDays').addEventListener('change', (e) => {
        const isCustom = e.target.value === 'Custom';
        byId('customDays').classList.toggle('hidden', !isCustom);
        if (!isCustom) byId('customDays').value = '';
    });

    byId('resetBtn').addEventListener('click', resetAll);
    byId('resetBtn2').addEventListener('click', resetAll);
    byId('backBtn').addEventListener('click', () => toggleView(false));
    byId('downloadBtn')?.addEventListener('click', () => window.print());

    // Dynamic Subject Allocation rows
    function addAllocRow(values = {}) {
        const row = document.createElement('div');
        row.className = 'row grid four mt-6';
        row.innerHTML = `
            <div class="field"><input type="text" placeholder="Subject" value="${values.subject || ''}"></div>
            <div class="field"><input type="text" placeholder="Classes (e.g., 6A,6B)" value="${values.classes || ''}"></div>
            <div class="field"><input type="number" placeholder="Periods/week" min="1" value="${values.periods || ''}"></div>
            <div class="field" style="display:flex;align-items:center;gap:10px;">
                <input type="checkbox" ${values.double ? 'checked' : ''} /> Allow
                <button type="button" class="btn remove-btn">✕</button>
            </div>
        `;
        row.querySelector('.remove-btn').addEventListener('click', () => row.remove());
        allocList.appendChild(row);
    }
    byId('addSubjectBtn')?.addEventListener('click', () => addAllocRow());
    // Seed one row
    addAllocRow();

    // Dynamic Teacher rows
    function addTeacherRow(values = {}) {
        const row = document.createElement('div');
        row.className = 'row grid four mt-6';
        row.innerHTML = `
            <div class="field"><input type="text" placeholder="Faculty" value="${values.name || ''}"></div>
            <div class="field"><input type="text" placeholder="Subjects (e.g., Math,Physics)" value="${values.subjects || ''}"></div>
            <div class="field"><input type="number" placeholder="Max periods/week" min="1" value="${values.max || ''}"></div>
            <div class="field" style="display:flex;align-items:center;gap:10px;">
                <input type="text" placeholder="Availability (e.g., Mon 1-3;)" value="${values.availability || ''}">
                <button type="button" class="btn remove-btn">✕</button>
            </div>
        `;
        row.querySelector('.remove-btn').addEventListener('click', () => row.remove());
        teacherList.appendChild(row);
    }
    byId('addTeacherBtn')?.addEventListener('click', () => addTeacherRow());
    // Seed one row
    addTeacherRow();

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const schoolName = byId('schoolName').value.trim();
        const term = byId('term').value.trim();
        const workingDays = byId('workingDays').value;
        const customDays = byId('customDays').value.trim();
        const periodsPerDay = parseInt(byId('periodsPerDay').value, 10) || 7;
        const periodDuration = parseInt(byId('periodDuration').value, 10) || 45;
        // Build subjects and sections from allocation rows
        const subjectAllocations = Array.from(allocList.querySelectorAll('.row')).map(row => {
            const subjectInput = row.querySelector('input[type="text"]:first-child');
            const classesInput = row.querySelector('input[type="text"]:nth-child(2)');
            const periodsInput = row.querySelector('input[type="number"]');
            
            return {
                subject: subjectInput?.value.trim() || '',
                classes: classesInput?.value.trim() || '',
                periods: parseInt(periodsInput?.value, 10) || 1
            };
        }).filter(allocation => allocation.subject);

        // Extract unique subjects (for fallback)
        const subjects = subjectAllocations.map(allocation => allocation.subject);
        
        // Process sections - if classes are specified, create separate entries
        const sections = [];
        subjectAllocations.forEach(allocation => {
            if (allocation.classes) {
                const classList = parseList(allocation.classes);
                classList.forEach(className => {
                    sections.push({
                        subject: allocation.subject,
                        section: className,
                        periods: allocation.periods
                    });
                });
            } else {
                sections.push({
                    subject: allocation.subject,
                    section: 'Default',
                    periods: allocation.periods
                });
            }
        });

        // Build teachers from teacher rows
        const teachers = Array.from(teacherList.querySelectorAll('.row')).map(row => {
            const nameInput = row.querySelector('input[type="text"]:first-child');
            const subjectsInput = row.querySelector('input[type="text"]:nth-child(2)');
            const maxInput = row.querySelector('input[type="number"]');
            const availabilityInput = row.querySelector('input[type="text"]:last-child');
            
            return {
                name: nameInput?.value.trim() || '',
                subjects: parseList(subjectsInput?.value.trim() || ''),
                maxPeriods: parseInt(maxInput?.value, 10) || 25,
                availability: availabilityInput?.value.trim() || ''
            };
        }).filter(teacher => teacher.name);

        // Create subject-to-teacher mapping
        const subjectTeacherMap = {};
        teachers.forEach(teacher => {
            teacher.subjects.forEach(subject => {
                if (!subjectTeacherMap[subject]) {
                    subjectTeacherMap[subject] = [];
                }
                subjectTeacherMap[subject].push(teacher.name);
            });
        });

        // Timing inputs
        const startTime = byId('startTime').value || '09:00';
        const endTime = byId('endTime').value || '';
        const lunchBreakPeriod = parseInt(byId('lunchBreakPeriod').value, 10) || null;
        const lunchBreakDuration = parseInt(byId('lunchBreakDuration').value, 10) || 45;
        const classroomNumbers = parseList(byId('classroomNumbers').value);
        const totalClassrooms = parseInt(byId('totalClassrooms').value, 10) || 20;
        
        // If no specific classroom numbers provided, generate them based on total classrooms
        let finalClassroomNumbers = classroomNumbers;
        if (classroomNumbers.length === 0 && totalClassrooms > 0) {
            finalClassroomNumbers = Array.from({length: totalClassrooms}, (_, i) => `Room ${i + 1}`);
        }
        const constraints = {
            noDoubleTeacher: byId('ruleNoDoubleTeacher')?.checked || false,
            avoidBackToBack: byId('ruleAvoidBackToBack')?.checked || false,
            fixedLunch: byId('ruleFixedLunch')?.checked || false,
            balanceLoad: byId('ruleBalanceLoad')?.checked || false,
            notes: byId('ruleNotes')?.value?.trim() || ''
        };

        const days = getDays(workingDays, customDays);

        // Compute time labels in IST regardless of local TZ
        const timeLabels = [];
        let cursor = parseHHMMToDateIST(startTime);
        for (let p = 1; p <= periodsPerDay; p++) {
            const start = new Date(cursor.getTime());
            const end = new Date(start.getTime() + periodDuration * 60000);
            timeLabels.push(`${formatHHMM(start)}–${formatHHMM(end)}`);
            // advance for next slot considering lunch break only
            cursor = new Date(end.getTime());
            if (lunchBreakPeriod && p === lunchBreakPeriod) {
                cursor = new Date(cursor.getTime() + lunchBreakDuration * 60000);
            }
        }

        byId('schoolTitle').textContent = schoolName || 'Timetable Preview';
        byId('termTitle').textContent = term ? `Term: ${term}` : '';

        // Try backend; fallback to local build
        tryBackendGenerate({ schoolName, term, days, periodsPerDay, subjects, classroomNumbers: finalClassroomNumbers, constraints, startTime, endTime, periodDuration, lunchBreakPeriod, lunchBreakDuration })
            .then((data) => {
                const fill = data?.subjects?.length ? data.subjects : subjects;
                buildTableWithSections(days, periodsPerDay, [], sections, timeLabels, lunchBreakPeriod, finalClassroomNumbers, subjectTeacherMap);
            })
            .catch(() => buildTableWithSections(days, periodsPerDay, [], sections, timeLabels, lunchBreakPeriod, finalClassroomNumbers, subjectTeacherMap));
        toggleView(true);
    });
});

async function tryBackendGenerate(payload) {
    try {
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('bad response');
        return await res.json();
    } catch (e) {
        return Promise.reject(e);
    }
}

// Time helpers for IST
function parseHHMMToDateIST(hhmm) {
    const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
    // Create date in UTC then add IST offset (+5:30)
    const d = new Date(Date.UTC(2000, 0, 1, h - 5, (m || 0) - 30, 0, 0));
    // The above trick makes local getHours/minutes equal to IST when formatted via custom
    // We'll format using our own function ignoring timezone
    return new Date(Date.UTC(2000, 0, 1, h, m || 0, 0, 0));
}

function formatHHMM(date) {
    const hh = String(date.getUTCHours()).padStart(2, '0');
    const mm = String(date.getUTCMinutes()).padStart(2, '0');
    // Convert to 12h format with AM/PM
    let h = parseInt(hh, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12; if (h === 0) h = 12;
    return `${h}:${mm} ${ampm}`;
}


