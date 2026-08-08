// hod.js — Department Head Logic
const session = EA.getSession();
if (!session || session.role !== 'hod') window.location.href = '/';

document.addEventListener('DOMContentLoaded', () => {
  EA.seed();
  document.getElementById('hod-avatar').textContent = EA.avatar(session.name);
  document.getElementById('hod-name').textContent = session.name;
  document.getElementById('hod-dept-label').textContent = session.department + ' Department';
  renderOverview();
  renderLeaderboard();
  renderHodSubjectAnalytics();
  renderClasses();
  renderSubjects();
  renderHodStudents();
  renderFaculty();
});

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  if (event && event.currentTarget && event.currentTarget.classList) {
    event.currentTarget.classList.add('active');
  }
  if (name === 'leaderboard') renderLeaderboard();
  if (name === 'subj-analytics') renderHodSubjectAnalytics();
  if (name === 'internships') renderHodInternships();
}

// ── HOD INTERNSHIPS BROADCAST ───────────────────────
async function handleHodPostInternship(e) {
  e.preventDefault();
  const data = {
    title: document.getElementById('hi-title').value.trim(),
    company: document.getElementById('hi-company').value.trim(),
    location: document.getElementById('hi-location').value.trim() || 'Remote / Hybrid',
    stipend: document.getElementById('hi-stipend').value.trim() || '₹35,000 / month',
    target_year: document.getElementById('hi-year').value,
    deadline: document.getElementById('hi-deadline').value || '2026-12-31',
    apply_url: document.getElementById('hi-url').value.trim(),
    description: document.getElementById('hi-desc').value.trim(),
    posted_by: `${session.name} (HOD)`
  };

  const res = await EA.postInternship(data);
  if (res.ok) {
    document.getElementById('hi-title').value = '';
    document.getElementById('hi-company').value = '';
    document.getElementById('hi-location').value = '';
    document.getElementById('hi-stipend').value = '';
    document.getElementById('hi-url').value = '';
    document.getElementById('hi-desc').value = '';

    const msg = document.getElementById('hi-msg');
    if (msg) {
      msg.classList.remove('hidden');
      setTimeout(() => msg.classList.add('hidden'), 3500);
    }
    renderHodInternships();
  }
}

async function renderHodInternships() {
  const el = document.getElementById('hod-internships-list');
  if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:30px;color:#64748b">Loading active department internships...</div>';

  const list = await EA.getInternships();
  if (!list || !list.length) {
    el.innerHTML = '<p class="text-muted" style="text-align:center;padding:30px">No active internships posted in department.</p>';
    return;
  }

  el.innerHTML = list.map(item => `
    <div style="padding:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <span class="badge badge-purple" style="font-size:11px">${item.company}</span>
          <div style="font-weight:700;font-size:15px;color:#1e1b4b;margin-top:2px">${item.title}</div>
        </div>
        <button class="btn btn-outline btn-sm" style="color:#ef4444;border-color:#fca5a5" onclick="deleteInternshipByHod('${item.id}')">🗑️ Delete</button>
      </div>
      <div style="font-size:12px;color:#64748b;margin-top:6px;line-height:1.5">${item.description.slice(0, 110)}...</div>
      <div style="display:flex;gap:12px;margin-top:10px;font-size:11px;color:#94a3b8">
        <span>📍 ${item.location}</span>
        <span>💰 ${item.stipend}</span>
        <span>👨‍🏫 ${item.posted_by}</span>
      </div>
    </div>
  `).join('');
}

async function deleteInternshipByHod(id) {
  if (!confirm('Are you sure you want to delete this department internship posting?')) return;
  await EA.deleteInternship(id);
  renderHodInternships();
}

// ── TOP STUDENT LEADERBOARD & RANKINGS ──────────────
function renderLeaderboard() {
  const yr = document.getElementById('rank-filter-year')?.value || '';
  const dv = document.getElementById('rank-filter-div')?.value || '';
  
  const topStudents = EA.getTopStudents(yr, dv);
  const tbody = document.getElementById('leaderboard-tbody');
  if (!tbody) return;

  if (!topStudents.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-muted" style="text-align:center;padding:30px">No student records found.</td></tr>';
    return;
  }

  tbody.innerHTML = topStudents.map((s, idx) => {
    const medal = idx === 0 ? '🥇 1st' : idx === 1 ? '🥈 2nd' : idx === 2 ? '🥉 3rd' : `#${idx + 1}`;
    const badgeColor = idx === 0 ? 'badge-amber' : idx === 1 ? 'badge-blue' : idx === 2 ? 'badge-purple' : 'badge-green';

    return `
      <tr style="${idx < 3 ? 'background:#fdfcf0;font-weight:600' : ''}">
        <td style="padding:12px 14px"><span class="badge ${badgeColor}" style="font-size:13px;padding:6px 12px">${medal}</span></td>
        <td style="padding:12px 14px">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:32px;height:32px;background:#6366f1;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700">${EA.avatar(s.name)}</div>
            <div>
              <div style="font-size:14px;color:#1f2937">${s.name}</div>
            </div>
          </div>
        </td>
        <td style="padding:12px 14px;color:#6b7280">${s.prn || '—'}</td>
        <td style="padding:12px 14px;color:#374151">${s.year}-${s.division}</td>
        <td style="padding:12px 14px;font-size:15px;font-weight:700;color:#6366f1">${s.avgCgpa.toFixed(2)}</td>
        <td style="padding:12px 14px;font-size:14px;color:#059669;font-weight:600">${s.quizAccuracy}%</td>
        <td style="padding:12px 14px;color:#374151">${s.attendance}%</td>
        <td style="padding:12px 14px"><span class="badge badge-purple" style="font-size:14px;font-weight:700">${s.aiScoreIndex} / 100</span></td>
      </tr>`;
  }).join('');
}

// ── SUBJECT ANALYTICS & PIE CHARTS ─────────────────
let chartHodSubjPie = null;
let chartHodDivPie = null;

function renderHodSubjectAnalytics() {
  // Pie Chart 1: Subject Proficiency
  const ctxSubj = document.getElementById('chart-hod-subject-pie');
  if (ctxSubj) {
    if (chartHodSubjPie) chartHodSubjPie.destroy();
    chartHodSubjPie = new Chart(ctxSubj, {
      type: 'pie',
      data: {
        labels: ['Passed & Mastered (80%+)', 'Average Standing (60-80%)', 'Needs Academic Support (<60%)'],
        datasets: [{
          data: [60, 28, 12],
          backgroundColor: ['#10b981', '#3b82f6', '#ef4444']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  // Pie Chart 2: Division Comparison
  const ctxDiv = document.getElementById('chart-hod-div-pie');
  if (ctxDiv) {
    if (chartHodDivPie) chartHodDivPie.destroy();
    chartHodDivPie = new Chart(ctxDiv, {
      type: 'doughnut',
      data: {
        labels: ['Division A (Avg 8.4 CGPA)', 'Division B (Avg 7.9 CGPA)'],
        datasets: [{
          data: [54, 46],
          backgroundColor: ['#6366f1', '#06b6d4']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
}

// ── OVERVIEW ───────────────────────────────────────
function renderOverview() {
  const students = EA.getStudents();
  const teachers = EA.getTeachers();
  const totalQuizzes = EA.getQuizzes().length;
  const allRecords = students.map(s => EA.getRecord(s.id));

  const avgAtt = allRecords.filter(r=>r.attendance).reduce((a,r)=>a+parseFloat(r.attendance||0),0) / (allRecords.filter(r=>r.attendance).length||1);
  
  document.getElementById('hod-stats').innerHTML = [
    ['Total Students', students.length, '#6366f1'],
    ['Faculty Members', teachers.length, '#059669'],
    ['Published Quizzes', totalQuizzes, '#f59e0b'],
    ['Avg Attendance', avgAtt.toFixed(0)+'%', '#06b6d4'],
  ].map(([l,v,c]) => `
    <div class="stat-card">
      <div class="stat-label">${l}</div>
      <div class="stat-value" style="color:${c}">${v}</div>
    </div>`).join('');

  // Class CGPA Chart
  const classes = [['FY','A'],['FY','B'],['SY','A'],['SY','B'],['TY','A'],['TY','B']];
  document.getElementById('class-cgpa-chart').innerHTML = classes.map(([yr,dv]) => {
    const classStudents = students.filter(s => s.year===yr && s.division===dv);
    const cgpas = classStudents.map(s => {
      const vals = Object.values(EA.getRecord(s.id).cgpa).filter(v=>v!=='').map(Number);
      return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : null;
    }).filter(v => v!==null);
    const avg = cgpas.length ? (cgpas.reduce((a,b)=>a+b,0)/cgpas.length).toFixed(2) : '—';
    const pct = cgpas.length ? Math.min(100, parseFloat(avg)*10) : 0;
    return `
      <div style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">
          <span style="font-weight:600;color:#374151">${yr} — Division ${dv}</span>
          <span style="font-weight:700;color:#6366f1">${avg} CGPA (${classStudents.length} students)</span>
        </div>
        <div class="bar-track"><div class="bar-fill good" style="width:${pct}%"></div></div>
      </div>`;
  }).join('');

  // At-Risk
  const atRisk = students.filter(s => {
    const rec = EA.getRecord(s.id);
    const att = parseFloat(rec.attendance||100);
    const cgpaVals = Object.values(rec.cgpa).filter(v=>v!=='').map(Number);
    const avg = cgpaVals.length ? cgpaVals.reduce((a,b)=>a+b,0)/cgpaVals.length : 10;
    return att < 75 || avg < 6.5;
  });

  document.getElementById('at-risk-list').innerHTML = atRisk.length
    ? atRisk.map(s => {
        const rec = EA.getRecord(s.id);
        const att = parseFloat(rec.attendance||0);
        const cgpaVals = Object.values(rec.cgpa).filter(v=>v!=='').map(Number);
        const avg = cgpaVals.length ? (cgpaVals.reduce((a,b)=>a+b,0)/cgpaVals.length).toFixed(2) : '—';
        return `
          <div style="display:flex;align-items:center;gap:12px;padding:12px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;margin-bottom:8px">
            <div style="width:36px;height:36px;background:#fca5a5;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#991b1b;flex-shrink:0">${EA.avatar(s.name)}</div>
            <div style="flex:1">
              <div style="font-weight:600;font-size:13px;color:#991b1b">${s.name}</div>
              <div style="font-size:12px;color:#6b7280">${s.year}-${s.division} · CGPA: ${avg} · Attendance: ${att}%</div>
            </div>
            <button class="btn btn-outline btn-sm" onclick="openStudentModal('${s.id}')">View Report</button>
          </div>`;
      }).join('')
    : '<p class="text-muted" style="padding:16px;text-align:center">All students are performing well above threshold!</p>';
}

// ── CLASSES ────────────────────────────────────────
function renderClasses() {
  const classes = [['FY','A'],['FY','B'],['SY','A'],['SY','B'],['TY','A'],['TY','B']];
  document.getElementById('classes-grid').innerHTML = classes.map(([yr,dv]) => {
    const count = EA.getStudents().filter(s=>s.year===yr&&s.division===dv).length;
    return `
      <div class="card" style="cursor:pointer;transition:all .2s" onclick="showClassDetail('${yr}','${dv}')">
        <div style="font-size:32px;margin-bottom:10px">🏫</div>
        <div style="font-size:18px;font-weight:700">${yr} — Division ${dv}</div>
        <div style="color:#6b7280;font-size:13px;margin-top:2px">${count} enrolled students</div>
        <div style="margin-top:14px;color:#6366f1;font-size:13px;font-weight:600">View Roster →</div>
      </div>`;
  }).join('');
}

function showClassDetail(yr, dv) {
  const students = EA.getStudents().filter(s=>s.year===yr&&s.division===dv);
  document.getElementById('class-detail').innerHTML = `
    <div class="card">
      <div class="card-title">${yr} — Division ${dv} Roster (${students.length} Students)</div>
      <table class="data-table">
        <thead><tr><th>Name</th><th>PRN</th><th>Avg CGPA</th><th>Attendance</th><th>Assignments</th><th>Action</th></tr></thead>
        <tbody>${students.map(s => classStudentRow(s)).join('')}</tbody>
      </table>
    </div>`;
}

function classStudentRow(s) {
  const rec = EA.getRecord(s.id);
  const cgpaVals = Object.values(rec.cgpa).filter(v=>v!=='').map(Number);
  const avg = cgpaVals.length ? (cgpaVals.reduce((a,b)=>a+b,0)/cgpaVals.length).toFixed(2) : '—';
  const subCount = rec.assignments.filter(a=>a.submitted).length;
  const total = rec.assignments.length;
  return `<tr>
    <td style="padding:10px 12px;font-weight:600">${s.name}</td>
    <td style="padding:10px 12px;color:#6b7280">${s.prn||'—'}</td>
    <td style="padding:10px 12px;font-weight:700;color:${parseFloat(avg)>=7?'#059669':'#dc2626'}">${avg}</td>
    <td style="padding:10px 12px"><span class="badge ${parseFloat(rec.attendance||0)>=75?'badge-green':'badge-red'}">${rec.attendance||'—'}%</span></td>
    <td style="padding:10px 12px">${subCount}/${total}</td>
    <td style="padding:10px 12px"><button class="btn btn-outline btn-sm" onclick="openStudentModal('${s.id}')">Full Report</button></td>
  </tr>`;
}

// ── SUBJECTS ───────────────────────────────────────
function renderSubjects() {
  const dept = EA.getDeptStructure()['Computer Science'];
  const teachers = EA.getTeachers();

  document.getElementById('subjects-content').innerHTML = Object.entries(dept.years).map(([yr, data]) => {
    const subjectCards = data.subjects.map(sub => {
      const assignedTeacher = teachers.find(t => t.subjects?.some(s => s.toLowerCase().includes(sub.toLowerCase()) || sub.toLowerCase().includes(s.toLowerCase()))) || null;
      return `
        <div class="card" style="padding:16px">
          <div style="font-weight:700;font-size:15px;margin-bottom:6px">📖 ${sub}</div>
          <div style="font-size:12px;color:#6b7280">Year: ${yr} · Divisions: ${data.divisions.join(', ')}</div>
          <div style="margin-top:10px;padding:10px;background:#f8f9fc;border-radius:8px;font-size:12px">
            ${assignedTeacher
              ? `👨‍🏫 Faculty: <strong>${assignedTeacher.name}</strong> <span style="color:#6b7280">(${assignedTeacher.employeeId})</span>`
              : '<span style="color:#9ca3af">No faculty assigned</span>'}
          </div>
        </div>`;
    }).join('');

    return `
      <div style="margin-bottom:28px">
        <div style="font-size:15px;font-weight:700;color:#374151;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid #e5e7eb">${yr} Year Curriculum</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px">${subjectCards}</div>
      </div>`;
  }).join('');
}

// ── ALL STUDENTS ───────────────────────────────────
function renderHodStudents() {
  const q = document.getElementById('hod-search')?.value?.toLowerCase() || '';
  const yr = document.getElementById('hod-yr')?.value || '';
  const students = EA.getStudents().filter(s =>
    (!q || s.name.toLowerCase().includes(q) || s.prn?.toLowerCase().includes(q)) &&
    (!yr || s.year === yr)
  );
  document.getElementById('hod-tbody').innerHTML = students.map(s => classStudentRow(s)).join('');
}

// ── FACULTY ────────────────────────────────────────
function renderFaculty() {
  const teachers = EA.getTeachers();
  document.getElementById('faculty-grid').innerHTML = teachers.map(t => {
    const quizzes = EA.getQuizzes().filter(q=>q.teacherId===t.id).length;
    return `
      <div class="card">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">
          <div class="avatar" style="width:48px;height:48px;font-size:16px;background:#6366f1;color:#fff">${EA.avatar(t.name)}</div>
          <div>
            <div style="font-weight:700;font-size:16px">${t.name}</div>
            <div style="font-size:12px;color:#6b7280">${t.employeeId} · ${t.department}</div>
          </div>
        </div>
        <div style="font-size:13px;color:#374151;margin-bottom:8px">
          <strong>Subjects Taught:</strong> ${t.subjects?.join(', ') || 'None assigned'}
        </div>
        <div style="font-size:12px;color:#6b7280">📧 ${t.email}</div>
        <div style="font-size:12px;color:#6b7280">📞 ${t.phone || '—'}</div>
        <div style="margin-top:14px;display:flex;gap:8px">
          <span class="badge badge-purple">${quizzes} Published Quiz${quizzes !== 1 ? 'zes' : ''}</span>
        </div>
      </div>`;
  }).join('');
}

// ── CREATE TEACHER MODAL (HOD ONLY) ────────────────
function openCreateTeacherModal() {
  document.getElementById('nt-err').classList.add('hidden');
  document.getElementById('nt-success').classList.add('hidden');
  document.getElementById('teacher-modal-overlay').classList.remove('hidden');
}

function closeTeacherModal() {
  document.getElementById('teacher-modal-overlay').classList.add('hidden');
}

function handleCreateTeacher(e) {
  e.preventDefault();
  const name = document.getElementById('nt-name').value.trim();
  const emp = document.getElementById('nt-emp').value.trim();
  const email = document.getElementById('nt-email').value.trim();
  const pass = document.getElementById('nt-pass').value;
  const phone = document.getElementById('nt-phone').value.trim();
  const dept = document.getElementById('nt-dept').value;
  const subjStr = document.getElementById('nt-subjects').value.trim();
  const subjects = subjStr ? subjStr.split(',').map(s => s.trim()).filter(Boolean) : [];

  const errEl = document.getElementById('nt-err');
  const succEl = document.getElementById('nt-success');

  const result = EA.createTeacherByHOD({
    name, employeeId: emp, email, password: pass, phone, department: dept, subjects
  });

  if (!result.ok) {
    errEl.textContent = result.msg;
    errEl.classList.remove('hidden');
    succEl.classList.add('hidden');
    return;
  }

  errEl.classList.add('hidden');
  succEl.classList.remove('hidden');

  setTimeout(() => {
    closeTeacherModal();
    renderFaculty();
    renderSubjects();
  }, 1200);
}

// ── STUDENT FULL REPORT MODAL ──────────────────────
function openStudentModal(id) {
  const s = EA.getUserById(id);
  if (!s) return;
  const rec = EA.getRecord(id);
  const cgpaVals = Object.values(rec.cgpa).filter(v=>v!=='').map(Number);
  const avg = cgpaVals.length ? (cgpaVals.reduce((a,b)=>a+b,0)/cgpaVals.length).toFixed(2) : '—';

  const subs = EA.getStudentSubmissions(id);
  const quizHTML = subs.length ? subs.map(sub => {
    const quiz = EA.getQuizzes().find(q=>q.id===sub.quizId);
    const pct = Math.round(sub.score/sub.total*100);
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;background:#f8f9fc;border-radius:8px;margin-bottom:6px;font-size:13px">
        <div>
          <strong>${quiz?.title || 'Quiz'}</strong>
          <div style="font-size:11px;color:#6b7280">Time Taken: ${EA.fmtTimeSeconds(sub.timeTakenSeconds)}</div>
        </div>
        <span class="badge ${pct>=60?'badge-green':'badge-red'}">${sub.score}/${sub.total} (${pct}%)</span>
      </div>`;
  }).join('') : '<p class="text-muted" style="font-size:13px">No quiz attempts recorded yet.</p>';

  const links = [
    s.linkedin && `<a href="https://${s.linkedin.replace('https://','')}" target="_blank" class="profile-link">LinkedIn</a>`,
    s.github && `<a href="https://${s.github.replace('https://','')}" target="_blank" class="profile-link">GitHub</a>`,
    s.leetcode && `<a href="https://${s.leetcode.replace('https://','')}" target="_blank" class="profile-link">LeetCode</a>`,
    s.hackerrank && `<a href="https://${s.hackerrank.replace('https://','')}" target="_blank" class="profile-link">HackerRank</a>`,
  ].filter(Boolean).join(' ');

  document.getElementById('modal-content').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px">
      ${[['Name',s.name],['PRN',s.prn||'—'],['Year / Division',`${s.year}-${s.division}`],['Department',s.department],['Email',s.email],['Phone',s.phone||'—'],['Residential Address',s.address||'—'],['Parent Name',s.parentName||'—'],['Parent Phone',s.parentPhone||'—'],['Parent Email',s.parentEmail||'—']].map(([l,v])=>`
      <div style="padding:10px 12px;background:#f8f9fc;border-radius:8px;font-size:13px"><span style="color:#6b7280">${l}: </span><strong>${v}</strong></div>`).join('')}
    </div>

    ${links ? `<div style="margin-bottom:18px">${links}</div>` : ''}

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">
      ${[['Avg CGPA',avg,'#6366f1'],['Attendance',rec.attendance?rec.attendance+'%':'—','#059669'],['Tests Taken',rec.classTests.length,'#f59e0b']].map(([l,v,c])=>`
      <div style="background:#f8f9fc;border-radius:10px;padding:14px;text-align:center">
        <div style="font-size:11px;color:#6b7280;text-transform:uppercase">${l}</div>
        <div style="font-size:22px;font-weight:700;color:${c}">${v}</div>
      </div>`).join('')}
    </div>

    <div style="margin-bottom:18px">
      <div class="section-label">CGPA Semester History</div>
      <div style="display:flex;gap:8px">
        ${Object.entries(rec.cgpa).map(([sem,v])=>`
        <div style="flex:1;background:${v?'#eef2ff':'#f8f9fc'};border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:10px;color:#6b7280;text-transform:uppercase">${sem.replace('sem','S')}</div>
          <div style="font-size:16px;font-weight:700;color:${v?'#6366f1':'#d1d5db'}">${v||'—'}</div>
        </div>`).join('')}
      </div>
    </div>

    <div style="margin-bottom:18px">
      <div class="section-label">Assignments & Submissions</div>
      ${rec.assignments.length ? rec.assignments.map(a=>`
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px">
        <span>${a.title}</span>
        <div style="display:flex;gap:6px">
          <span class="badge ${a.submitted?'badge-green':'badge-red'}">${a.submitted?'Submitted':'Pending'}</span>
          ${a.submitted?`<span class="badge ${a.onTime?'badge-green':'badge-amber'}">${a.onTime?'On Time':'Late'}</span>`:''}
          ${a.submitted?`<span style="font-size:12px;color:#374151;padding:3px 8px;background:#f3f4f6;border-radius:20px">${a.marks}/${a.maxMarks}</span>`:''}
        </div>
      </div>`).join('') : '<p class="text-muted" style="font-size:13px">No assignments recorded.</p>'}
    </div>

    <div style="margin-bottom:18px">
      <div class="section-label">Behavior Notes</div>
      <div style="padding:12px;background:#f8f9fc;border-radius:8px;font-size:13px;color:#374151">${rec.behavior||'No notes.'}</div>
    </div>

    <div>
      <div class="section-label">Quiz Submissions & Time Taken</div>
      ${quizHTML}
    </div>`;

  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}
