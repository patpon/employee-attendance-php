// ============================================
// Main Application - SPA Router & Page Renderers
// ============================================

// ===== Dark Mode =====
function initDarkMode() {
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') {
        document.body.classList.add('dark');
        updateDarkToggleUI(true);
    }
}
function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('darkMode', isDark);
    updateDarkToggleUI(isDark);
}
function updateDarkToggleUI(isDark) {
    const icon = document.getElementById('darkToggleIcon');
    const label = document.getElementById('darkToggleLabel');
    if (icon) icon.textContent = isDark ? '☀️' : '🌙';
    if (label) label.textContent = isDark ? 'โหมดสว่าง' : 'โหมดมืด';
}

let currentPage = 'dashboard';

// Default shop (single shop mode)
const DEFAULT_SHOP_ID = 'default';
let DEFAULT_SHOP_NAME = 'ร้านค้า';

// Current user info
let currentUser = { username: '', displayName: '', role: 'viewer' };

// Role-based menu permissions
const ROLE_PERMISSIONS = {
    admin: ['dashboard', 'import', 'attendance', 'reports', 'bonus', 'settings'],
    importer: ['import'],
};

function canAccess(page) {
    const perms = ROLE_PERMISSIONS[currentUser.role] || [];
    return perms.includes(page);
}

function applyRoleToSidebar() {
    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
        const page = el.dataset.page;
        el.style.display = canAccess(page) ? '' : 'none';
    });
    // Show user info in sidebar
    const userInfoEl = document.getElementById('sidebarUserInfo');
    if (userInfoEl) {
        const roleLabels = { admin: 'ผู้ดูแลระบบ', importer: 'ผู้นำเข้าข้อมูล' };
        const roleColors = { admin: '#ef4444', importer: '#2563eb' };
        userInfoEl.innerHTML = `
            <div style="padding:12px 16px;border-top:1px solid rgba(255,255,255,0.1);font-size:12px;color:rgba(255,255,255,0.7);">
                <p style="font-weight:600;color:white;font-size:13px;">${escHtml(currentUser.displayName || currentUser.username)}</p>
                <span style="display:inline-block;margin-top:4px;padding:2px 8px;border-radius:8px;font-size:10px;font-weight:600;color:white;background:${roleColors[currentUser.role] || '#6b7280'};">${roleLabels[currentUser.role] || currentUser.role}</span>
            </div>`;
    }
}

// Check auth on load
(async function checkAuth() {
    initDarkMode();
    try {
        const res = await fetch('api/auth.php?action=check');
        const data = await res.json();
        if (!data.authenticated) {
            window.location.href = 'login.html';
            return;
        }
        currentUser = {
            username: data.username || '',
            displayName: data.displayName || '',
            role: data.role || 'viewer',
        };
    } catch {
        window.location.href = 'login.html';
        return;
    }
    // Load shop name from DB
    try {
        const shop = await api.getShop(DEFAULT_SHOP_ID);
        if (shop && shop.name) DEFAULT_SHOP_NAME = shop.name;
    } catch { }
    applyRoleToSidebar();
    navigateTo('dashboard');
})();

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('active');
}

function navigateTo(page) {
    // Role guard: redirect to first allowed page if no access
    if (!canAccess(page)) {
        const perms = ROLE_PERMISSIONS[currentUser.role] || [];
        page = perms[0] || 'dashboard';
    }
    currentPage = page;
    // Update nav
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.page === page);
    });
    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('active');
    // Render page
    renderPage(page);
}

async function handleLogout() {
    await fetch('api/auth.php?action=logout', { method: 'POST' });
    window.location.href = 'login.html';
}

function renderPage(page) {
    const main = document.getElementById('mainContent');
    switch (page) {
        case 'dashboard': renderDashboard(main); break;
        case 'import': renderImport(main); break;
        case 'attendance': renderAttendance(main); break;
        case 'reports': renderReports(main); break;
        case 'bonus': renderBonus(main); break;
        case 'settings': renderSettings(main); break;
        default: main.innerHTML = '<p>Page not found</p>';
    }
}

// ============================================
// DASHBOARD
// ============================================
async function renderDashboard(container) {
    container.innerHTML = `
        <div style="max-width:1100px;margin:0 auto;">
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-800">แดชบอร์ด</h1>
                <p class="text-gray-500 mt-1">ภาพรวมระบบจัดการลงเวลาพนักงาน</p>
            </div>
            <div class="grid-3 mb-8" id="dashStats">
                <div class="card stat-card" onclick="navigateTo('import')">
                    <div class="flex items-center justify-between mb-4">
                        <div class="stat-icon bg-emerald-500">&#128101;</div>
                        <span class="text-gray-300" style="font-size:20px;">&#8594;</span>
                    </div>
                    <p class="text-3xl font-bold text-gray-800" id="statEmployees">0</p>
                    <p class="text-sm text-gray-500 mt-1">พนักงาน</p>
                </div>
                <div class="card stat-card" onclick="navigateTo('attendance')">
                    <div class="flex items-center justify-between mb-4">
                        <div class="stat-icon bg-amber-500">&#128197;</div>
                        <span class="text-gray-300" style="font-size:20px;">&#8594;</span>
                    </div>
                    <p class="text-3xl font-bold text-gray-800" id="statAttendance">0</p>
                    <p class="text-sm text-gray-500 mt-1">ข้อมูลเวลา</p>
                </div>
                <div class="card stat-card" onclick="navigateTo('import')">
                    <div class="flex items-center justify-between mb-4">
                        <div class="stat-icon bg-purple-500">&#128228;</div>
                        <span class="text-gray-300" style="font-size:20px;">&#8594;</span>
                    </div>
                    <p class="text-3xl font-bold text-gray-800" id="statImports">0</p>
                    <p class="text-sm text-gray-500 mt-1">การนำเข้า</p>
                </div>
            </div>
            <div class="grid-2">
                <div class="card">
                    <h2 class="text-lg font-semibold text-gray-800 mb-4">เริ่มต้นใช้งาน</h2>
                    <div class="space-y-3">
                        <a onclick="navigateTo('import')" class="flex items-center gap-3 p-3 rounded-lg" style="cursor:pointer;transition:background 0.2s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background=''">
                            <div style="width:32px;height:32px;background:#dbeafe;color:#1d4ed8;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0;">1</div>
                            <div><p class="font-medium text-gray-800">นำเข้าข้อมูล Excel</p><p class="text-sm text-gray-500">อัพโหลดไฟล์ข้อมูลการสแกนเวลา (พนักงานจะถูกสร้างอัตโนมัติ)</p></div>
                        </a>
                        <a onclick="navigateTo('attendance')" class="flex items-center gap-3 p-3 rounded-lg" style="cursor:pointer;transition:background 0.2s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background=''">
                            <div style="width:32px;height:32px;background:#dbeafe;color:#1d4ed8;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0;">2</div>
                            <div><p class="font-medium text-gray-800">ดูตารางเวลา</p><p class="text-sm text-gray-500">ตรวจสอบและแก้ไขข้อมูลเวลาทำงาน</p></div>
                        </a>
                        <a onclick="navigateTo('reports')" class="flex items-center gap-3 p-3 rounded-lg" style="cursor:pointer;transition:background 0.2s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background=''">
                            <div style="width:32px;height:32px;background:#dbeafe;color:#1d4ed8;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0;">3</div>
                            <div><p class="font-medium text-gray-800">ออกรายงาน PDF</p><p class="text-sm text-gray-500">สร้างรายงานและส่งออกเป็น PDF</p></div>
                        </a>
                    </div>
                </div>
                <div class="card">
                    <h2 class="text-lg font-semibold text-gray-800 mb-4">คุณสมบัติระบบ</h2>
                    <div class="space-y-3">
                        <div class="flex items-center gap-3 p-3">
                            <div style="width:32px;height:32px;background:#d1fae5;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">&#128228;</div>
                            <div><p class="font-medium text-gray-800">นำเข้า Excel</p><p class="text-sm text-gray-500">รองรับไฟล์ .xlsx/.xls จากเครื่องสแกน</p></div>
                        </div>
                        <div class="flex items-center gap-3 p-3">
                            <div style="width:32px;height:32px;background:#d1fae5;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">&#128197;</div>
                            <div><p class="font-medium text-gray-800">จัดกะอัตโนมัติ</p><p class="text-sm text-gray-500">แยก 4 กะ/วัน ตามการตั้งค่าแต่ละคน</p></div>
                        </div>
                        <div class="flex items-center gap-3 p-3">
                            <div style="width:32px;height:32px;background:#d1fae5;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">&#128101;</div>
                            <div><p class="font-medium text-gray-800">สร้างพนักงานอัตโนมัติ</p><p class="text-sm text-gray-500">รายชื่อพนักงานถูกสร้างจากไฟล์ Excel ที่นำเข้า</p></div>
                        </div>
                        <div class="flex items-center gap-3 p-3">
                            <div style="width:32px;height:32px;background:#d1fae5;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">&#128196;</div>
                            <div><p class="font-medium text-gray-800">รายงาน PDF</p><p class="text-sm text-gray-500">ออกรายงานรายบุคคล พร้อมปริ้น</p></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Load stats
    try {
        const [employees, attendance, imports] = await Promise.all([
            api.getEmployees(), api.getAttendance({}), api.getImportSessions(),
        ]);
        document.getElementById('statEmployees').textContent = employees.length;
        document.getElementById('statAttendance').textContent = attendance.length;
        document.getElementById('statImports').textContent = imports.length;
    } catch { }
}

// ============================================
// MERGE MANUAL EDITS
// Preserve admin-edited days (scan times, waive, note, isHoliday)
// when re-importing or reprocessing attendance
// ============================================
function mergeManualEdits(newAttendance, existingAttendance) {
    if (!existingAttendance || !existingAttendance.days) return;

    const existingByDate = new Map(existingAttendance.days.map(d => [d.date, d]));

    for (const newDay of newAttendance.days) {
        const old = existingByDate.get(newDay.date);
        if (!old || !old.manualEdit) continue;

        // Preserve all admin-edited fields
        newDay.scan1 = old.scan1;
        newDay.scan2 = old.scan2;
        newDay.scan3 = old.scan3;
        newDay.scan4 = old.scan4;
        newDay.isHoliday = old.isHoliday;
        newDay.waiveLate1 = old.waiveLate1 || false;
        newDay.waiveLate2 = old.waiveLate2 || false;
        newDay.note = old.note || '';
        newDay.manualEdit = true;

        // Recalculate lateness from preserved scan times
        const config = newAttendance.shiftConfig;
        const deductRate = config.deductionPerMinute || 1;
        if (newDay.isHoliday) {
            newDay.late1Minutes = 0; newDay.late1Baht = 0;
            newDay.late2Minutes = 0; newDay.late2Baht = 0;
            newDay.isAbsent = false;
        } else {
            const late1 = calculateLateness(newDay.scan1, config.shift1Deadline, deductRate);
            newDay.late1Minutes = late1.minutes;
            newDay.late1Baht = late1.baht;

            let late2 = { minutes: 0, baht: 0 };
            if (newDay.scan2) {
                const outMin = timeToMinutes(newDay.scan2);
                const calcDeadline = outMin + (config.breakDurationMinutes || 90);
                let fixedDL;
                if (outMin < timeToMinutes('13:15')) fixedDL = timeToMinutes('14:30');
                else if (outMin < timeToMinutes('14:00')) fixedDL = timeToMinutes('15:00');
                else if (outMin < timeToMinutes('14:45')) fixedDL = timeToMinutes('16:00');
                else fixedDL = timeToMinutes('16:30');
                const deadlineMin = Math.max(calcDeadline, fixedDL);
                const h = Math.floor(deadlineMin / 60);
                const m = deadlineMin % 60;
                const breakDL = h.toString().padStart(2, '0') + ':' + m.toString().padStart(2, '0');
                late2 = calculateLateness(newDay.scan3, breakDL, deductRate);
            }
            newDay.late2Minutes = late2.minutes;
            newDay.late2Baht = late2.baht;
            newDay.isAbsent = !newDay.scan1 && !newDay.scan2 && !newDay.scan3 && !newDay.scan4;
        }
    }

    // Recalculate totals after merge
    let holidays = 0, absent = 0, workingDays = 0, totalLate1 = 0, totalLate2 = 0;
    for (const d of newAttendance.days) {
        if (d.isHoliday) holidays++;
        else if (d.isAbsent) absent++;
        else workingDays++;
        if (!d.waiveLate1) totalLate1 += d.late1Baht;
        if (!d.waiveLate2) totalLate2 += d.late2Baht;
    }
    newAttendance.holidays = holidays;
    newAttendance.absent = absent;
    newAttendance.workingDays = workingDays;
    newAttendance.totalLate1Baht = totalLate1;
    newAttendance.totalLate2Baht = totalLate2;
    newAttendance.totalDeduction = totalLate1 + totalLate2;
}

// ============================================
// IMPORT
// ============================================
let importParsedData = null;
let importDedupedScans = [];
let importFileName = '';

async function renderImport(container) {
    const now = new Date();
    container.innerHTML = `
        <div style="max-width:800px;margin:0 auto;">
            <div class="mb-6">
                <h1 class="text-2xl font-bold text-gray-800">นำเข้าข้อมูล</h1>
                <p class="text-gray-500 text-sm mt-1">อัพโหลดไฟล์ Excel จากเครื่องสแกนเวลา (พนักงานจะถูกสร้างอัตโนมัติ)</p>
            </div>
            <div class="card mb-6">
                <h3 class="text-sm font-semibold text-gray-700 mb-3">ตั้งค่าการนำเข้า</h3>
                <div class="grid-2">
                    <div><label class="text-sm text-gray-600" style="display:block;margin-bottom:4px;">เดือน</label>
                        <select id="importMonth" class="input-field">
                            ${THAI_MONTHS.map((m, i) => `<option value="${i + 1}" ${i + 1 === now.getMonth() + 1 ? 'selected' : ''}>${m}</option>`).join('')}
                        </select>
                    </div>
                    <div><label class="text-sm text-gray-600" style="display:block;margin-bottom:4px;">ปี (ค.ศ.)</label>
                        <input type="number" id="importYear" class="input-field" value="${now.getFullYear()}" min="2020" max="2030">
                    </div>
                </div>
            </div>
            <div class="upload-area mb-6" id="uploadArea" ondragover="event.preventDefault();this.classList.add('dragover')" ondragleave="this.classList.remove('dragover')" ondrop="handleImportDrop(event)">
                <div style="font-size:48px;color:#d1d5db;margin-bottom:16px;">&#128228;</div>
                <p class="text-gray-600 mb-2">ลากไฟล์ Excel มาวางที่นี่ หรือ</p>
                <label class="btn-primary" style="cursor:pointer;">เลือกไฟล์
                    <input type="file" accept=".xlsx,.xls,.csv" onchange="handleImportFile(this.files[0])" style="display:none;">
                </label>
                <p class="text-xs text-gray-400" style="margin-top:12px;">รองรับ .xlsx, .xls, .csv</p>
                <div id="importFileName" class="hidden" style="margin-top:16px;font-size:14px;color:#4b5563;"></div>
            </div>
            <div id="importStatus" class="hidden mb-6"></div>
            <div id="importPreview" class="hidden mb-6"></div>
        </div>
    `;
    importParsedData = null;
    importDedupedScans = [];
}

function handleImportDrop(e) {
    e.preventDefault();
    document.getElementById('uploadArea').classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleImportFile(file);
}

function handleImportFile(file) {
    if (!file) return;
    importFileName = file.name;
    document.getElementById('importFileName').textContent = '📊 ' + file.name;
    document.getElementById('importFileName').classList.remove('hidden');
    document.getElementById('importStatus').classList.add('hidden');
    document.getElementById('importPreview').classList.add('hidden');

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = parseExcelFile(e.target.result);
            const deduped = deduplicateScans(data.scans);
            importParsedData = data;
            importDedupedScans = deduped;
            showImportStatus('info', `พบ ${data.employees.length} พนักงาน, ${data.scans.length} รายการ (หลัง dedup: ${deduped.length})`);
            showImportPreview();
            // Auto-process after showing preview
            setTimeout(() => processImport(), 300);
        } catch (err) {
            showImportStatus('error', 'ไม่สามารถอ่านไฟล์ได้: ' + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
}

function showImportStatus(type, message) {
    const el = document.getElementById('importStatus');
    const cls = type === 'error' ? 'alert-error' : type === 'success' ? 'alert-success' : 'alert-info';
    el.className = `alert ${cls} mb-6`;
    el.innerHTML = message;
    el.classList.remove('hidden');
}

async function showImportPreview() {
    if (!importParsedData) return;
    let currentEmployees = [];
    try { currentEmployees = await api.getEmployees(); } catch { }

    const el = document.getElementById('importPreview');
    el.classList.remove('hidden');
    el.innerHTML = `
        <div class="card">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">ข้อมูลที่พบในไฟล์</h3>
            <div class="overflow-x-auto">
                <table style="font-size:14px;">
                    <thead><tr style="background:#f9fafb;"><th style="padding:8px 12px;text-align:left;">รหัส</th><th style="padding:8px 12px;text-align:left;">ชื่อ</th><th style="padding:8px 12px;text-align:center;">จำนวน scan</th><th style="padding:8px 12px;text-align:center;">สถานะ</th></tr></thead>
                    <tbody>
                        ${importParsedData.employees.map(emp => {
        const scanCount = importDedupedScans.filter(s => s.empCode === emp.code).length;
        const existing = currentEmployees.find(e => e.empCode === emp.code && e.shopId === DEFAULT_SHOP_ID);
        return `<tr style="border-top:1px solid #f3f4f6;">
                                <td style="padding:8px 12px;" class="font-mono">${escHtml(emp.code)}</td>
                                <td style="padding:8px 12px;">${escHtml(emp.name)}</td>
                                <td style="padding:8px 12px;text-align:center;">${scanCount}</td>
                                <td style="padding:8px 12px;text-align:center;">${existing ? '<span class="badge badge-green">มีในระบบ</span>' : '<span class="badge badge-amber">จะสร้างใหม่</span>'}</td>
                            </tr>`;
    }).join('')}
                    </tbody>
                </table>
            </div>
            <div style="margin-top:16px;display:flex;justify-content:flex-end;">
                <button class="btn-success" onclick="processImport()" id="processImportBtn">&#10004; นำเข้าและประมวลผล</button>
            </div>
        </div>
    `;
}

async function processImport() {
    const shopId = DEFAULT_SHOP_ID;
    const shopName = DEFAULT_SHOP_NAME;
    const month = parseInt(document.getElementById('importMonth').value);
    const year = parseInt(document.getElementById('importYear').value);
    if (!importParsedData) return;

    const btn = document.getElementById('processImportBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> กำลังประมวลผล...';

    try {
        let currentEmployees = await api.getEmployees();
        let newEmployeeCount = 0;

        // Auto-create employees from Excel
        for (const emp of importParsedData.employees) {
            const existing = currentEmployees.find(e => e.empCode === emp.code && e.shopId === shopId);
            if (!existing) {
                await api.createEmployee({ empCode: emp.code, name: emp.name, shopId, shiftConfig: { ...DEFAULT_SHIFT_CONFIG }, holidays: {} });
                newEmployeeCount++;
            }
        }

        currentEmployees = await api.getEmployees();

        // Save new scans to DB (INSERT IGNORE = no duplicates)
        const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
        const newMonthScans = importDedupedScans.filter(s => s.date.startsWith(monthStr));
        if (newMonthScans.length > 0) {
            await api.saveScans({ shopId, month, year, scans: newMonthScans });
        }

        // Load ALL scans for this month from DB (merged from all imports)
        const allScans = await api.getScans({ shopId, month, year });

        // Group merged scans by employee
        const scansByEmp = new Map();
        for (const scan of allScans) {
            if (!scansByEmp.has(scan.empCode)) scansByEmp.set(scan.empCode, []);
            scansByEmp.get(scan.empCode).push(scan);
        }

        // Load existing attendance to preserve manual edits
        const existingAtt = await api.getAttendance({ shopId, month, year });
        const existingByEmp = new Map(existingAtt.map(a => [a.empCode, a]));

        // Process each employee using ALL merged scans
        let processedCount = 0;
        for (const [empCode, empScans] of scansByEmp) {
            const employee = currentEmployees.find(e => e.empCode === empCode && e.shopId === shopId);
            if (!employee) continue;

            if (empScans.length === 0) continue;

            const attendance = processEmployeeAttendance(employee, empScans, shopName, month, year);
            mergeManualEdits(attendance, existingByEmp.get(empCode));
            await api.saveAttendance(attendance);
            processedCount++;
        }

        // Save import session
        await api.createImportSession({ shopId, month, year, fileName: importFileName, recordCount: importDedupedScans.length });

        const mergeNote = allScans.length > newMonthScans.length
            ? ` (รวม scan เดิม ${allScans.length - newMonthScans.length} + ใหม่ ${newMonthScans.length} = ทั้งหมด ${allScans.length} รายการ)`
            : '';
        showImportStatus('success', `สำเร็จ! ประมวลผล ${processedCount} พนักงาน` + (newEmployeeCount > 0 ? ` (สร้างใหม่ ${newEmployeeCount} คน)` : '') + mergeNote);
        document.getElementById('importPreview').classList.add('hidden');
    } catch (err) {
        showImportStatus('error', 'เกิดข้อผิดพลาด: ' + err.message);
    }
    btn.disabled = false;
    btn.innerHTML = '&#10004; ประมวลผลและบันทึก';
}

// ============================================
// ATTENDANCE
// ============================================
let attendanceRecords = [];
let expandedAttId = null;
let attSortOrder = 'asc'; // 'asc' or 'desc'
let attSearchQuery = '';

async function renderAttendance(container) {
    const now = new Date();
    container.innerHTML = `
        <div style="max-width:1200px;margin:0 auto;">
            <div class="mb-6">
                <h1 class="text-2xl font-bold text-gray-800">ตารางเวลา</h1>
                <p class="text-gray-500 text-sm mt-1">ดูและแก้ไขข้อมูลเวลาทำงานรายเดือน</p>
            </div>
            <div class="card mb-6">
                <div class="grid-2">
                    <div><label class="text-sm text-gray-600" style="display:block;margin-bottom:4px;">เดือน</label>
                        <select id="attMonth" class="input-field" onchange="loadAttendance()">
                            ${THAI_MONTHS.map((m, i) => `<option value="${i + 1}" ${i + 1 === now.getMonth() + 1 ? 'selected' : ''}>${m}</option>`).join('')}
                        </select>
                    </div>
                    <div><label class="text-sm text-gray-600" style="display:block;margin-bottom:4px;">ปี (ค.ศ.)</label>
                        <input type="number" id="attYear" class="input-field" value="${now.getFullYear()}" min="2020" max="2030" onchange="loadAttendance()">
                    </div>
                </div>
            </div>
            <div class="card mb-4">
                <div class="flex items-center gap-3 flex-wrap">
                    <div style="flex:1;min-width:200px;">
                        <input type="text" id="attSearch" class="input-field" placeholder="&#128269; ค้นหาชื่อหรือรหัสพนักงาน..." oninput="attSearchQuery=this.value;renderAttList()">
                    </div>
                    <div class="flex gap-2">
                        <button id="btnSortAsc" class="btn-secondary" onclick="setAttSort('asc')" style="font-size:13px;padding:6px 12px;">&#9650; น้อย→มาก</button>
                        <button id="btnSortDesc" class="btn-secondary" onclick="setAttSort('desc')" style="font-size:13px;padding:6px 12px;">&#9660; มาก→น้อย</button>
                        <button class="btn-success" onclick="reprocessAttendance()" style="font-size:13px;padding:6px 12px;">&#128260; ประมวลผลใหม่</button>
                        <button class="btn-danger" onclick="resetMonthData()" style="font-size:13px;padding:6px 12px;">&#128465; รีเซ็ตเดือนนี้</button>
                    </div>
                </div>
            </div>
            <div id="attList"></div>
        </div>
    `;
    attendanceRecords = [];
    expandedAttId = null;
    attSearchQuery = '';
    loadAttendance();
}

async function loadAttendance() {
    const month = parseInt(document.getElementById('attMonth').value);
    const year = parseInt(document.getElementById('attYear').value);
    try {
        const [records, emps] = await Promise.all([
            api.getAttendance({ shopId: DEFAULT_SHOP_ID, month, year }),
            api.getEmployees(),
        ]);
        const empMap = {};
        emps.forEach(e => { empMap[e.id] = e; });
        attendanceRecords = records.map(r => ({
            ...r,
            isActive: empMap[r.employeeId] ? empMap[r.employeeId].isActive : 1,
        }));
    } catch { attendanceRecords = []; }
    expandedAttId = null;
    renderAttList();
}

function setAttSort(order) {
    attSortOrder = order;
    renderAttList();
}

async function reprocessAttendance() {
    const month = parseInt(document.getElementById('attMonth').value);
    const year = parseInt(document.getElementById('attYear').value);
    const shopId = DEFAULT_SHOP_ID;
    const shopName = DEFAULT_SHOP_NAME;

    if (!confirm('ต้องการประมวลผลข้อมูลใหม่ทั้งหมดหรือไม่?\n\n(ระบบจะดึง scan จาก DB แล้วคำนวณใหม่ทั้งเดือน)')) return;

    // Show loading popup
    const overlay = document.createElement('div');
    overlay.id = 'reprocessOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;';
    overlay.innerHTML = `<div style="background:white;border-radius:16px;padding:32px 48px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
        <div style="font-size:48px;margin-bottom:12px;animation:spin 1s linear infinite;">&#9881;</div>
        <p style="font-size:18px;font-weight:600;color:#1e3a5f;margin-bottom:8px;">กำลังประมวลผลใหม่...</p>
        <p id="reprocessStatus" style="font-size:14px;color:#6b7280;">กำลังโหลดข้อมูล scan</p>
        <style>@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}</style>
    </div>`;
    document.body.appendChild(overlay);
    const statusEl = document.getElementById('reprocessStatus');

    try {
        statusEl.textContent = 'กำลังโหลดข้อมูล scan...';
        const allScans = await api.getScans({ shopId, month, year });
        if (allScans.length === 0) {
            overlay.remove();
            alert('ไม่พบข้อมูล scan ในเดือนนี้\nกรุณานำเข้าข้อมูลใหม่');
            return;
        }

        statusEl.textContent = 'กำลังโหลดข้อมูลพนักงาน...';
        const employees = await api.getEmployees();

        const scansByEmp = new Map();
        for (const scan of allScans) {
            if (!scansByEmp.has(scan.empCode)) scansByEmp.set(scan.empCode, []);
            scansByEmp.get(scan.empCode).push(scan);
        }

        statusEl.textContent = 'กำลังโหลดข้อมูลที่บันทึกไว้...';
        const existingAtt = await api.getAttendance({ shopId, month, year });
        const existingByEmp = new Map(existingAtt.map(a => [a.empCode, a]));

        let processedCount = 0;
        const totalEmp = scansByEmp.size;
        for (const [empCode, empScans] of scansByEmp) {
            const employee = employees.find(e => e.empCode === empCode && e.shopId === shopId);
            if (!employee) continue;
            processedCount++;
            statusEl.textContent = `กำลังประมวลผล ${processedCount}/${totalEmp} คน...`;
            const attendance = processEmployeeAttendance(employee, empScans, shopName, month, year);
            mergeManualEdits(attendance, existingByEmp.get(empCode));
            await api.saveAttendance(attendance);
        }

        overlay.remove();
        alert(`ประมวลผลใหม่สำเร็จ! ${processedCount} พนักงาน (${allScans.length} scan)`);
        loadAttendance();
    } catch (err) {
        overlay.remove();
        alert('เกิดข้อผิดพลาด: ' + err.message);
    }
}

async function resetMonthData() {
    const month = parseInt(document.getElementById('attMonth').value);
    const year = parseInt(document.getElementById('attYear').value);
    const shopId = DEFAULT_SHOP_ID;
    const monthName = THAI_MONTHS[month - 1];

    if (!confirm(`⚠️ รีเซ็ตข้อมูลเดือน ${monthName} ${year}\n\nจะลบข้อมูลต่อไปนี้ทั้งหมด:\n• ข้อมูล Scan ทั้งเดือน\n• ข้อมูลตารางเวลาทั้งเดือน\n\nหลังรีเซ็ต ให้นำเข้าไฟล์ Excel ใหม่\n\nยืนยันหรือไม่?`)) return;
    if (!confirm(`⚠️ ยืนยันอีกครั้ง!\n\nลบข้อมูลเดือน ${monthName} ${year} ทั้งหมด?`)) return;

    try {
        await api.deleteScans({ shopId, month, year });
        await api.deleteAttendanceMonth({ shopId, month, year });
        attendanceRecords = [];
        renderAttList();
        alert(`✅ รีเซ็ตเดือน ${monthName} ${year} สำเร็จ!\n\nกรุณานำเข้าไฟล์ Excel ใหม่`);
    } catch (err) {
        alert('เกิดข้อผิดพลาด: ' + err.message);
    }
}

function getFilteredAttRecords() {
    let filtered = attendanceRecords;
    if (attSearchQuery.trim()) {
        const q = attSearchQuery.trim().toLowerCase();
        filtered = filtered.filter(r => r.empName.toLowerCase().includes(q) || String(r.empCode).toLowerCase().includes(q));
    }
    filtered = [...filtered].sort((a, b) => {
        const cmp = String(a.empCode).localeCompare(String(b.empCode), undefined, { numeric: true });
        return attSortOrder === 'asc' ? cmp : -cmp;
    });
    return filtered;
}

function renderAttList() {
    const el = document.getElementById('attList');
    if (!el) return;

    // Update sort button styles
    const btnAsc = document.getElementById('btnSortAsc');
    const btnDesc = document.getElementById('btnSortDesc');
    if (btnAsc) btnAsc.className = attSortOrder === 'asc' ? 'btn-primary' : 'btn-secondary';
    if (btnDesc) btnDesc.className = attSortOrder === 'desc' ? 'btn-primary' : 'btn-secondary';

    const displayRecords = getFilteredAttRecords();

    if (attendanceRecords.length === 0) {
        el.innerHTML = `<div class="card text-center py-12"><div style="font-size:64px;color:#d1d5db;margin-bottom:16px;">&#128197;</div><p class="text-gray-500 text-lg">ไม่พบข้อมูล</p><p class="text-gray-400 text-sm mt-1">กรุณาเลือกเดือน หรือนำเข้าข้อมูลก่อน</p></div>`;
        return;
    }
    if (displayRecords.length === 0) {
        el.innerHTML = `<div class="card text-center py-8"><p class="text-gray-500">ไม่พบพนักงานที่ค้นหา "${escHtml(attSearchQuery)}"</p></div>`;
        return;
    }
    el.innerHTML = '<div class="space-y-4">' + displayRecords.map(record => {
        const rIdx = attendanceRecords.indexOf(record);
        const highDeduct = record.totalDeduction >= 60;
        const isResigned = record.isActive === 0;
        const cardBorder = isResigned ? 'border-left:4px solid #9ca3af;opacity:0.75;' : (highDeduct ? 'border-left:4px solid #ef4444;' : '');
        const headerBg = isResigned ? 'background:#f3f4f6;' : (highDeduct ? 'background:#fef2f2;' : '');
        const avatarBg = isResigned ? '#e5e7eb' : (highDeduct ? '#fee2e2' : '#dbeafe');
        const avatarColor = isResigned ? '#9ca3af' : (highDeduct ? '#dc2626' : '#1d4ed8');
        const resignedBadge = isResigned
            ? ' <span style="background:#6b7280;color:white;font-size:11px;padding:2px 9px;border-radius:10px;margin-left:8px;font-weight:600;">&#10060; ลาออกแล้ว</span>'
            : '';
        const activeToggleBtn = isResigned
            ? `<button class="btn-icon" onclick="toggleEmployeeActive('${record.employeeId}','${escHtml(record.empName)}')" title="คลิกเพื่อกลับมาทำงาน" style="font-size:11px;padding:3px 8px;border-radius:10px;border:1px solid #9ca3af;background:#f3f4f6;color:#6b7280;">&#128100; ลาออกแล้ว</button>`
            : `<button class="btn-icon" onclick="toggleEmployeeActive('${record.employeeId}','${escHtml(record.empName)}')" title="คลิกเพื่อตั้งเป็นลาออก" style="font-size:11px;padding:3px 8px;border-radius:10px;border:1px solid #10b981;background:#ecfdf5;color:#059669;font-weight:600;">&#10003; ยังทำงานอยู่</button>`;
        return `
        <div class="card card-no-pad overflow-hidden" style="${cardBorder}">
            <div class="accordion-header" onclick="toggleAttRecord('${record.id}')" style="${headerBg}">
                <div class="flex items-center gap-4">
                    <div style="width:40px;height:40px;background:${avatarBg};border-radius:50%;display:flex;align-items:center;justify-content:center;">
                        <span style="color:${avatarColor};font-weight:700;font-size:14px;">${escHtml(record.empCode)}</span>
                    </div>
                    <div>
                        <p class="font-semibold" style="font-size:16px;color:${isResigned ? '#9ca3af' : '#1f2937'};">${escHtml(record.empName)}${resignedBadge}${!isResigned && highDeduct ? ' <span style="background:#ef4444;color:white;font-size:11px;padding:2px 8px;border-radius:10px;margin-left:8px;font-weight:600;">&#9888; หักเกิน 60</span>' : ''}</p>
                        <p style="font-size:12px;color:#6b7280;margin-top:2px;">${escHtml(record.shopName)} | ${THAI_MONTHS[record.month - 1]} ${record.year}</p>
                    </div>
                    <div class="flex gap-1" style="margin-left:8px;" onclick="event.stopPropagation()">
                        <button class="btn-icon" onclick="editEmployeeName('${record.employeeId}','${escHtml(record.empName)}')" title="แก้ไขชื่อ" style="font-size:14px;padding:4px 6px;">&#9998;</button>
                        <button class="btn-icon" onclick="deleteEmployee('${record.employeeId}','${escHtml(record.empName)}')" title="ลบพนักงาน" style="font-size:14px;padding:4px 6px;color:#ef4444;">&#128465;</button>
                        ${activeToggleBtn}
                    </div>
                </div>
                <div class="flex items-center gap-6">
                    <div class="text-right" style="font-size:13px;">
                        <p style="color:#374151;font-weight:500;">ทำงาน <b>${record.workingDays}</b> | หยุด <b>${record.holidays}</b> | ขาด <b style="${record.absent > 0 ? 'color:#ef4444;' : ''}">${record.absent}</b></p>
                        <p style="margin-top:2px;font-weight:600;">รวมหัก <b style="${highDeduct ? 'color:#ef4444;font-size:16px;' : 'color:#059669;'}">${record.totalDeduction}</b> บาท</p>
                    </div>
                    <span class="chevron ${expandedAttId === record.id ? 'open' : ''}" style="font-size:20px;color:#9ca3af;">&#9660;</span>
                </div>
            </div>
            ${expandedAttId === record.id ? renderAttDetail(record, rIdx) : ''}
        </div>
    `;
    }).join('') + '</div>';
}

function toggleAttRecord(id) {
    expandedAttId = expandedAttId === id ? null : id;
    renderAttList();
}

function renderAttDetail(record, rIdx) {
    return `
        <div class="accordion-body">
            <div class="overflow-x-auto">
                <table class="att-table">
                    <thead><tr>
                        <th>#</th><th>วันที่</th><th>วัน</th><th>หยุด</th>
                        <th>เข้า</th><th>พักออก</th><th>พักเข้า</th><th>เลิก</th>
                        <th>เข้าสาย</th><th>บาท</th>
                        <th>รอบพัก</th>
                        <th>สายพัก</th><th>บาท</th>
                        <th>ยกเว้น</th>
                        <th>หมายเหตุ</th>
                    </tr></thead>
                    <tbody>
                        ${record.days.map((day, idx) => {
        const breakDeadline = day.breakRound || '';
        const scanCount = [day.scan1, day.scan2, day.scan3, day.scan4].filter(s => s && s.trim() !== '').length;
        const hasEmptyScan = !day.isHoliday && scanCount > 0 && scanCount < 4;
        const emptyCellStyle = 'background:#ffebee;';
        const s1empty = !day.isHoliday && !day.scan1;
        const s2empty = !day.isHoliday && !day.scan2;
        const s3empty = !day.isHoliday && !day.scan3;
        const s4empty = !day.isHoliday && !day.scan4;
        const anyEmpty = s1empty || s2empty || s3empty || s4empty;
        return `
                            <tr class="${day.isHoliday ? 'holiday' : day.isAbsent ? 'absent' : ''}">
                                <td style="color:#9ca3af;">${idx + 1}</td>
                                <td>${formatDate(day.date)}</td>
                                <td>${day.dayOfWeek}</td>
                                <td><input type="checkbox" ${day.isHoliday ? 'checked' : ''} onchange="toggleHoliday(${rIdx},${idx})"></td>
                                <td style="${!day.isHoliday && s1empty && anyEmpty ? emptyCellStyle : ''}">${day.isHoliday ? '-' : '<input type="time" class="time-input" value="' + (day.scan1 || '') + '" onchange="updateScanTime(' + rIdx + ',' + idx + ',1,this.value)">'}</td>
                                <td style="${!day.isHoliday && s2empty && anyEmpty ? emptyCellStyle : ''}">${day.isHoliday ? '-' : '<input type="time" class="time-input" value="' + (day.scan2 || '') + '" onchange="updateScanTime(' + rIdx + ',' + idx + ',2,this.value)">'}</td>
                                <td style="${!day.isHoliday && s3empty && anyEmpty ? emptyCellStyle : ''}">${day.isHoliday ? '-' : '<input type="time" class="time-input" value="' + (day.scan3 || '') + '" onchange="updateScanTime(' + rIdx + ',' + idx + ',3,this.value)">'}</td>
                                <td style="${!day.isHoliday && s4empty && anyEmpty ? emptyCellStyle : ''}">${day.isHoliday ? '-' : '<input type="time" class="time-input" value="' + (day.scan4 || '') + '" onchange="updateScanTime(' + rIdx + ',' + idx + ',4,this.value)">'}</td>
                                <td style="${day.waiveLate1 ? 'text-decoration:line-through;color:#9ca3af;' : ''}">${day.late1Minutes > 0 ? minutesToTime(day.late1Minutes) : ''}</td>
                                <td class="text-red-600" style="${day.waiveLate1 ? 'text-decoration:line-through;color:#9ca3af;' : ''}">${day.late1Baht > 0 ? day.late1Baht : 0}</td>
                                <td class="text-center">${day.isHoliday ? '-' : (breakDeadline ? '<span class="badge badge-blue" style="font-size:10px;">' + breakDeadline + '</span>' : '')}</td>
                                <td style="${day.waiveLate2 ? 'text-decoration:line-through;color:#9ca3af;' : ''}">${day.late2Minutes > 0 ? minutesToTime(day.late2Minutes) : ''}</td>
                                <td class="text-red-600" style="${day.waiveLate2 ? 'text-decoration:line-through;color:#9ca3af;' : ''}">${day.late2Baht > 0 ? day.late2Baht : 0}</td>
                                <td>${day.isHoliday ? '' : ((day.late1Baht > 0 || day.late2Baht > 0 || day.waiveLate1 || day.waiveLate2) ? '<div style="display:flex;gap:2px;justify-content:center;">' + (day.late1Baht > 0 || day.waiveLate1 ? '<button onclick="toggleWaive(' + rIdx + ',' + idx + ',1)" title="' + (day.waiveLate1 ? 'ยกเลิกยกเว้นเข้าสาย' : 'ยกเว้นเข้าสาย') + '" style="font-size:10px;padding:2px 6px;border:1px solid ' + (day.waiveLate1 ? '#059669' : '#f59e0b') + ';background:' + (day.waiveLate1 ? '#ecfdf5' : '#fffbeb') + ';color:' + (day.waiveLate1 ? '#059669' : '#d97706') + ';border-radius:4px;cursor:pointer;white-space:nowrap;">' + (day.waiveLate1 ? '&#10003; เข้า' : 'เข้า') + '</button>' : '') + (day.late2Baht > 0 || day.waiveLate2 ? '<button onclick="toggleWaive(' + rIdx + ',' + idx + ',2)" title="' + (day.waiveLate2 ? 'ยกเลิกยกเว้นพักสาย' : 'ยกเว้นพักสาย') + '" style="font-size:10px;padding:2px 6px;border:1px solid ' + (day.waiveLate2 ? '#059669' : '#f59e0b') + ';background:' + (day.waiveLate2 ? '#ecfdf5' : '#fffbeb') + ';color:' + (day.waiveLate2 ? '#059669' : '#d97706') + ';border-radius:4px;cursor:pointer;white-space:nowrap;">' + (day.waiveLate2 ? '&#10003; พัก' : 'พัก') + '</button>' : '') + '</div>' : '')}</td>
                                <td style="min-width:120px;${day.note ? 'background:#fffde7;' : ''}"><input type="text" class="note-input" value="${escHtml(day.note || '')}" placeholder="หมายเหตุ..." onchange="updateNote(${rIdx},${idx},this.value)" style="width:100%;padding:2px 6px;border:1px solid ${day.note ? '#f59e0b' : 'var(--input-border)'};border-radius:4px;font-size:11px;font-family:inherit;background:${day.note ? '#fffde7' : 'var(--input-bg)'};color:${day.note ? '#92400e' : 'var(--text-primary)'};outline:none;font-weight:${day.note ? '600' : 'normal'};"></td>
                            </tr>`;
    }).join('')}
                    </tbody>
                    <tfoot><tr>
                        <td colspan="8" class="text-right">รวม</td>
                        <td>${minutesToTime(record.days.reduce((s, d) => s + (d.waiveLate1 ? 0 : d.late1Minutes), 0))}</td>
                        <td class="text-red-600">${record.totalLate1Baht}</td>
                        <td></td>
                        <td>${minutesToTime(record.days.reduce((s, d) => s + (d.waiveLate2 ? 0 : d.late2Minutes), 0))}</td>
                        <td class="text-red-600">${record.totalLate2Baht}</td>
                        <td></td>
                        <td></td>
                    </tr></tfoot>
                </table>
            </div>
            <div style="padding:12px 24px;background:var(--bg-surface2);display:flex;justify-content:flex-end;">
                <button class="btn-primary text-sm" onclick="saveAttRecord(${rIdx})">&#128190; บันทึกการเปลี่ยนแปลง</button>
            </div>
        </div>
    `;
}

function toggleHoliday(rIdx, dayIdx) {
    const record = attendanceRecords[rIdx];
    const day = record.days[dayIdx];
    day.isHoliday = !day.isHoliday;
    day.manualEdit = true;
    if (day.isHoliday) {
        day.scan1 = null; day.scan2 = null; day.scan3 = null; day.scan4 = null;
        day.isAbsent = false;
        day.late1Minutes = 0; day.late1Baht = 0;
        day.late2Minutes = 0; day.late2Baht = 0;
        day.waiveLate1 = false; day.waiveLate2 = false;
    }
    recalcRecordTotals(record);
    renderAttList();
}

function updateScanTime(rIdx, dayIdx, scanNum, value) {
    const record = attendanceRecords[rIdx];
    const day = record.days[dayIdx];
    const config = record.shiftConfig;
    const deductRate = config.deductionPerMinute || 1;

    // Update the scan value
    day['scan' + scanNum] = value || null;
    day.manualEdit = true;

    // Recalculate break deadline per round: A=14:30, B=15:00, C=16:00, D=16:30
    // If scan2+1.5hrs exceeds fixed DL, use calculated value
    if (day.scan2) {
        const outMin = timeToMinutes(day.scan2);
        const calcDeadline = outMin + (config.breakDurationMinutes || 90);
        let round, fixedDL;
        if (outMin < timeToMinutes('13:15')) { round = 'A'; fixedDL = timeToMinutes('14:30'); }
        else if (outMin < timeToMinutes('14:00')) { round = 'B'; fixedDL = timeToMinutes('15:00'); }
        else if (outMin < timeToMinutes('14:45')) { round = 'C'; fixedDL = timeToMinutes('16:00'); }
        else { round = 'D'; fixedDL = timeToMinutes('16:30'); }
        const deadlineMin = Math.max(calcDeadline, fixedDL);
        const h = Math.floor(deadlineMin / 60);
        const m = deadlineMin % 60;
        const breakDL = h.toString().padStart(2, '0') + ':' + m.toString().padStart(2, '0');
        day.breakRound = round + ' (DL ' + breakDL + ')';
    } else {
        day.breakRound = null;
    }

    // Recalculate late1 (scan1 vs shift1Deadline)
    const late1 = calculateLateness(day.scan1, config.shift1Deadline, deductRate);
    day.late1Minutes = late1.minutes;
    day.late1Baht = late1.baht;

    // Recalculate late2 (scan3 vs break deadline)
    let late2 = { minutes: 0, baht: 0 };
    if (day.scan2) {
        const outMin = timeToMinutes(day.scan2);
        const calcDeadline = outMin + (config.breakDurationMinutes || 90);
        let fixedDL;
        if (outMin < timeToMinutes('13:15')) fixedDL = timeToMinutes('14:30');
        else if (outMin < timeToMinutes('14:00')) fixedDL = timeToMinutes('15:00');
        else if (outMin < timeToMinutes('14:45')) fixedDL = timeToMinutes('16:00');
        else fixedDL = timeToMinutes('16:30');
        const deadlineMin = Math.max(calcDeadline, fixedDL);
        const h = Math.floor(deadlineMin / 60);
        const m = deadlineMin % 60;
        const breakDL = h.toString().padStart(2, '0') + ':' + m.toString().padStart(2, '0');
        late2 = calculateLateness(day.scan3, breakDL, deductRate);
    }
    day.late2Minutes = late2.minutes;
    day.late2Baht = late2.baht;

    // Check absent status
    day.isAbsent = !day.scan1 && !day.scan2 && !day.scan3 && !day.scan4;

    // Recalculate record totals
    recalcRecordTotals(record);
    renderAttList();
}

function recalcRecordTotals(record) {
    let holidays = 0, absent = 0, workingDays = 0, totalLate1 = 0, totalLate2 = 0;
    for (const d of record.days) {
        if (d.isHoliday) holidays++;
        else if (d.isAbsent) absent++;
        else workingDays++;
        if (!d.waiveLate1) totalLate1 += d.late1Baht;
        if (!d.waiveLate2) totalLate2 += d.late2Baht;
    }
    record.holidays = holidays;
    record.absent = absent;
    record.workingDays = workingDays;
    record.totalLate1Baht = totalLate1;
    record.totalLate2Baht = totalLate2;
    record.totalDeduction = totalLate1 + totalLate2;
}

function toggleWaive(rIdx, dayIdx, type) {
    const record = attendanceRecords[rIdx];
    const day = record.days[dayIdx];
    if (type === 1) day.waiveLate1 = !day.waiveLate1;
    if (type === 2) day.waiveLate2 = !day.waiveLate2;
    day.manualEdit = true;
    recalcRecordTotals(record);
    renderAttList();
}

function updateNote(rIdx, dayIdx, value) {
    const record = attendanceRecords[rIdx];
    const day = record.days[dayIdx];
    day.note = value.trim();
    day.manualEdit = true;
}

async function saveAttRecord(rIdx) {
    const record = attendanceRecords[rIdx];
    try {
        await api.updateAttendance(record.id, {
            holidays: record.holidays,
            absent: record.absent,
            workingDays: record.workingDays,
            totalLate1Baht: record.totalLate1Baht,
            totalLate2Baht: record.totalLate2Baht,
            totalDeduction: record.totalDeduction,
            days: record.days,
        });
        // Also save holidays to employee
        const emps = await api.getEmployees();
        const emp = emps.find(e => e.id === record.employeeId);
        if (emp) {
            const monthKey = `${record.year}-${record.month.toString().padStart(2, '0')}`;
            const holidayDates = record.days.filter(d => d.isHoliday).map(d => d.date);
            const holidays = { ...(emp.holidays || {}), [monthKey]: holidayDates };
            await api.updateEmployee(emp.id, { ...emp, holidays });
        }
        alert('บันทึกสำเร็จ!');
    } catch (err) { alert('Error: ' + err.message); }
}

async function editEmployeeName(employeeId, currentName) {
    const newName = prompt('แก้ไขชื่อพนักงาน:', currentName);
    if (!newName || newName.trim() === '' || newName.trim() === currentName) return;
    try {
        const emps = await api.getEmployees();
        const emp = emps.find(e => e.id === employeeId);
        if (!emp) { alert('ไม่พบพนักงาน'); return; }
        await api.updateEmployee(employeeId, { ...emp, name: newName.trim() });
        // Update attendance records in memory
        for (const rec of attendanceRecords) {
            if (rec.employeeId === employeeId) rec.empName = newName.trim();
        }
        // Update attendance in DB
        for (const rec of attendanceRecords) {
            if (rec.employeeId === employeeId) {
                await api.updateAttendance(rec.id, { empName: newName.trim() });
            }
        }
        renderAttList();
        alert('แก้ไขชื่อสำเร็จ!');
    } catch (err) { alert('เกิดข้อผิดพลาด: ' + err.message); }
}

async function deleteEmployee(employeeId, empName) {
    if (!confirm(`ต้องการลบพนักงาน "${empName}" หรือไม่?\n\n(ข้อมูลเวลาทั้งหมดของพนักงานคนนี้จะถูกลบด้วย)`)) return;
    try {
        await api.deleteEmployee(employeeId);
        attendanceRecords = attendanceRecords.filter(r => r.employeeId !== employeeId);
        renderAttList();
        alert('ลบพนักงานสำเร็จ!');
    } catch (err) { alert('เกิดข้อผิดพลาด: ' + err.message); }
}

async function toggleEmployeeActive(employeeId, empName) {
    try {
        const emps = await api.getEmployees();
        const emp = emps.find(e => e.id === employeeId);
        if (!emp) { alert('ไม่พบพนักงาน'); return; }
        const currentActive = emp.isActive !== 0;
        const newActive = currentActive ? 0 : 1;
        if (!confirm(`ต้องการตั้งสถานะ "${empName}" เป็น ${currentActive ? '❗ ลาออก' : '✅ ยังทำงานอยู่'} ใช่ไหม?`)) return;
        await api.updateEmployee(employeeId, { ...emp, isActive: newActive });
        attendanceRecords = attendanceRecords.map(r =>
            r.employeeId === employeeId ? { ...r, isActive: newActive } : r
        );
        renderAttList();
    } catch (err) { alert('เกิดข้อผิดพลาด: ' + err.message); }
}

// ============================================
// REPORTS
// ============================================
let reportRecords = [];
let selectedReportIds = new Set();

async function renderReports(container) {
    const now = new Date();
    container.innerHTML = `
        <div style="max-width:1100px;margin:0 auto;">
            <div class="mb-6">
                <h1 class="text-2xl font-bold text-gray-800">รายงาน / PDF</h1>
                <p class="text-gray-500 text-sm mt-1">สร้างรายงานรายบุคคลและส่งออก PDF</p>
            </div>
            <div class="card mb-6">
                <div class="grid-2">
                    <div><label class="text-sm text-gray-600" style="display:block;margin-bottom:4px;">เดือน</label>
                        <select id="rptMonth" class="input-field" onchange="loadReports()">
                            ${THAI_MONTHS.map((m, i) => `<option value="${i + 1}" ${i + 1 === now.getMonth() + 1 ? 'selected' : ''}>${m}</option>`).join('')}
                        </select>
                    </div>
                    <div><label class="text-sm text-gray-600" style="display:block;margin-bottom:4px;">ปี (ค.ศ.)</label>
                        <input type="number" id="rptYear" class="input-field" value="${now.getFullYear()}" min="2020" max="2030" onchange="loadReports()">
                    </div>
                </div>
            </div>
            <div id="rptList"></div>
        </div>
    `;
    reportRecords = [];
    selectedReportIds = new Set();
    loadReports();
}

async function loadReports() {
    const month = parseInt(document.getElementById('rptMonth').value);
    const year = parseInt(document.getElementById('rptYear').value);
    try {
        reportRecords = await api.getAttendance({ shopId: DEFAULT_SHOP_ID, month, year });
        reportRecords.sort((a, b) => String(a.empCode).localeCompare(String(b.empCode), undefined, { numeric: true }));
        selectedReportIds = new Set(reportRecords.map(r => r.id));
    } catch { reportRecords = []; }
    renderReportList();
}

function renderReportList() {
    const el = document.getElementById('rptList');
    if (!el) return;
    if (reportRecords.length === 0) {
        el.innerHTML = `<div class="card text-center py-12"><div style="font-size:64px;color:#d1d5db;margin-bottom:16px;">&#128196;</div><p class="text-gray-500 text-lg">ไม่พบข้อมูล</p><p class="text-gray-400 text-sm mt-1">กรุณาเลือกเดือน หรือนำเข้าข้อมูลก่อน</p></div>`;
        return;
    }
    el.innerHTML = `
        <div class="card mb-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <input type="checkbox" ${selectedReportIds.size === reportRecords.length ? 'checked' : ''} onchange="toggleAllReports()">
                <span class="text-sm text-gray-600">เลือก ${selectedReportIds.size} / ${reportRecords.length} คน</span>
            </div>
            <div class="flex gap-2">
                <button class="btn-success" onclick="printSummaryReport()" ${reportRecords.length === 0 ? 'disabled' : ''}>&#128202; สรุปรวม</button>
                <button class="btn-primary" onclick="printAllReports()" ${reportRecords.length === 0 ? 'disabled' : ''}>&#128424; พิมพ์ทั้งหมด</button>
            </div>
        </div>
        <div class="space-y-3">
            ${reportRecords.map(record => {
        const highDeduct = record.totalDeduction >= 60;
        return `
                <div class="card flex items-center justify-between" style="${highDeduct ? 'border-left:4px solid #ef4444;background:#fef2f2;' : ''}">
                    <div class="flex items-center gap-4">
                        <input type="checkbox" ${selectedReportIds.has(record.id) ? 'checked' : ''} onchange="toggleReportId('${record.id}')">
                        <div style="width:40px;height:40px;background:${highDeduct ? '#fee2e2' : '#dbeafe'};border-radius:50%;display:flex;align-items:center;justify-content:center;">
                            <span style="color:${highDeduct ? '#dc2626' : '#1d4ed8'};font-weight:700;font-size:14px;">${escHtml(record.empCode)}</span>
                        </div>
                        <div>
                            <p class="font-semibold text-gray-800" style="font-size:16px;">${escHtml(record.empName)}${highDeduct ? ' <span style="background:#ef4444;color:white;font-size:11px;padding:2px 8px;border-radius:10px;margin-left:8px;font-weight:600;">&#9888; หักเกิน 60</span>' : ''}</p>
                            <p style="font-size:13px;color:#374151;font-weight:500;margin-top:2px;">ทำงาน <b>${record.workingDays}</b> | หยุด <b>${record.holidays}</b> | ขาด <b style="${record.absent > 0 ? 'color:#ef4444;' : ''}">${record.absent}</b> | หัก <b style="${highDeduct ? 'color:#ef4444;font-size:15px;' : 'color:#059669;'}">${record.totalDeduction} บาท</b></p>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button class="btn-icon" onclick="printReport('${record.id}')" title="พิมพ์" style="background:#2563eb;color:white;border-radius:6px;padding:6px 10px;font-size:14px;">&#128424; พิมพ์</button>
                        <button class="btn-icon" onclick="downloadSinglePDF('${record.id}')" title="ดาวน์โหลด PDF" style="background:#10b981;color:white;border-radius:6px;padding:6px 10px;font-size:14px;">&#128196; PDF</button>
                    </div>
                </div>`;
    }).join('')}
        </div>
    `;
}

function toggleReportId(id) {
    if (selectedReportIds.has(id)) selectedReportIds.delete(id);
    else selectedReportIds.add(id);
    renderReportList();
}

function toggleAllReports() {
    if (selectedReportIds.size === reportRecords.length) {
        selectedReportIds = new Set();
    } else {
        selectedReportIds = new Set(reportRecords.map(r => r.id));
    }
    renderReportList();
}

async function downloadReportPDF() {
    const selected = reportRecords.filter(r => selectedReportIds.has(r.id));
    if (selected.length === 0) { alert('กรุณาเลือกพนักงานอย่างน้อย 1 คน'); return; }
    try { await generatePDF(selected); } catch (err) { alert('เกิดข้อผิดพลาด: ' + err.message); }
}

async function downloadSinglePDF(id) {
    const record = reportRecords.find(r => r.id === id);
    if (!record) { alert('ไม่พบข้อมูล'); return; }
    if (!record.days || record.days.length === 0) { alert('ไม่มีข้อมูลรายวัน กรุณาประมวลผลใหม่ก่อน'); return; }
    try { await generatePDF([record]); } catch (err) { alert('เกิดข้อผิดพลาด: ' + err.message); }
}

function printSummaryReport() {
    if (reportRecords.length === 0) { alert('ไม่มีข้อมูลให้สรุป'); return; }
    const sorted = [...reportRecords].sort((a, b) => String(a.empCode).localeCompare(String(b.empCode), undefined, { numeric: true }));
    const shopName = DEFAULT_SHOP_NAME;
    const month = parseInt(document.getElementById('rptMonth').value);
    const year = parseInt(document.getElementById('rptYear').value);
    const buddhistYear = ceToBuddhist(year);

    // Calculate grand totals
    let grandWorkingDays = 0, grandHolidays = 0, grandAbsent = 0;
    let grandLate1 = 0, grandLate2 = 0, grandDeduction = 0;
    for (const r of sorted) {
        grandWorkingDays += r.workingDays;
        grandHolidays += r.holidays;
        grandAbsent += r.absent;
        grandLate1 += r.totalLate1Baht;
        grandLate2 += r.totalLate2Baht;
        grandDeduction += r.totalDeduction;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><title>สรุปรวมพนักงาน</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:'Sarabun',sans-serif;font-size:12px;padding:20px;}
        .header{text-align:center;margin-bottom:20px;}
        .header h2{font-size:18px;font-weight:700;margin-bottom:4px;}
        .header p{font-size:13px;color:#555;}
        .stats{display:flex;justify-content:center;gap:24px;margin-bottom:16px;}
        .stat-box{text-align:center;padding:8px 16px;border-radius:8px;background:#f3f4f6;}
        .stat-box .num{font-size:20px;font-weight:700;}
        .stat-box .lbl{font-size:10px;color:#6b7280;}
        table{width:100%;border-collapse:collapse;font-size:11px;margin-top:10px;}
        th,td{border:1px solid #333;padding:5px 8px;text-align:center;}
        th{background:#2563eb;color:white;font-weight:600;font-size:10px;}
        tbody tr:nth-child(even){background:#f9fafb;}
        tbody tr:hover{background:#eff6ff;}
        .text-right{text-align:right;}
        .text-left{text-align:left;}
        tfoot td{background:#1e3a5f;color:white;font-weight:700;}
        .footer{margin-top:15px;font-size:10px;color:#999;}
        .badge{display:inline-block;padding:1px 6px;border-radius:10px;font-size:9px;font-weight:600;}
        .badge-green{background:#dcfce7;color:#15803d;}
        .badge-red{background:#fee2e2;color:#dc2626;}
        .badge-amber{background:#fef3c7;color:#b45309;}
        @media print{body{padding:10px;}}
    </style></head><body>
    <div class="header">
        <h2>สรุปภาพรวมพนักงานทั้งหมด</h2>
        <p>ร้าน: ${shopName} | ประจำเดือน: ${THAI_MONTHS[month - 1]} ${buddhistYear} | จำนวน ${sorted.length} คน</p>
    </div>
    <div class="stats">
        <div class="stat-box"><div class="num" style="color:#2563eb;">${sorted.length}</div><div class="lbl">พนักงาน</div></div>
        <div class="stat-box"><div class="num" style="color:#16a34a;">${grandWorkingDays}</div><div class="lbl">วันทำงานรวม</div></div>
        <div class="stat-box"><div class="num" style="color:#d97706;">${grandHolidays}</div><div class="lbl">วันหยุดรวม</div></div>
        <div class="stat-box"><div class="num" style="color:#dc2626;">${grandAbsent}</div><div class="lbl">ขาดรวม</div></div>
        <div class="stat-box"><div class="num" style="color:#dc2626;">${grandDeduction.toLocaleString()}</div><div class="lbl">หักรวม (บาท)</div></div>
    </div>
    <table>
        <thead><tr>
            <th>ลำดับ</th><th>รหัส</th><th>ชื่อพนักงาน</th>
            <th>วันทำงาน</th><th>วันหยุด</th><th>ขาด</th>
            <th>สายเข้า (บาท)</th><th>สายพัก (บาท)</th><th>รวมหัก (บาท)</th>
            <th>สถานะ</th>
        </tr></thead>
        <tbody>${sorted.map((r, i) => {
        let status = '';
        if (r.totalDeduction === 0 && r.absent === 0) status = '<span class="badge badge-green">ดี</span>';
        else if (r.absent > 0) status = '<span class="badge badge-red">มีขาด</span>';
        else status = '<span class="badge badge-amber">มีหัก</span>';
        return '<tr>' +
            '<td>' + (i + 1) + '</td>' +
            '<td>' + r.empCode + '</td>' +
            '<td class="text-left">' + r.empName + '</td>' +
            '<td>' + r.workingDays + '</td>' +
            '<td>' + r.holidays + '</td>' +
            '<td style="color:' + (r.absent > 0 ? '#dc2626' : 'inherit') + ';font-weight:' + (r.absent > 0 ? '700' : '400') + ';">' + r.absent + '</td>' +
            '<td>' + (r.totalLate1Baht > 0 ? r.totalLate1Baht : 0) + '</td>' +
            '<td>' + (r.totalLate2Baht > 0 ? r.totalLate2Baht : 0) + '</td>' +
            '<td style="color:#dc2626;font-weight:700;">' + r.totalDeduction + '</td>' +
            '<td>' + status + '</td>' +
            '</tr>';
    }).join('')}</tbody>
        <tfoot><tr>
            <td colspan="3" class="text-right">รวมทั้งหมด</td>
            <td>${grandWorkingDays}</td><td>${grandHolidays}</td><td>${grandAbsent}</td>
            <td>${grandLate1}</td><td>${grandLate2}</td><td>${grandDeduction.toLocaleString()}</td>
            <td></td>
        </tr></tfoot>
    </table>
    <div class="footer"><p>พิมพ์เมื่อ: ${new Date().toLocaleString('th-TH')}</p></div>
    <script>window.onload=function(){window.print();}<\/script></body></html>`);
    printWindow.document.close();
}

function buildReportHTML(record) {
    const shopName = DEFAULT_SHOP_NAME;
    const buddhistYear = ceToBuddhist(record.year);
    return `
        <div class="header"><h2>ตารางสรุปการทำงานรายบุคคล</h2><p>ร้าน: ${shopName} | ประจำเดือน: ${THAI_MONTHS[record.month - 1]} ${buddhistYear}</p></div>
        <div class="info-grid">
            <div><span class="label">รหัส:</span> ${record.empCode}</div><div><span class="label">ชื่อ:</span> ${record.empName}</div>
            <div><span class="label">วันทำงาน:</span> ${record.workingDays} วัน</div><div><span class="label">วันหยุด:</span> ${record.holidays} วัน</div>
            <div><span class="label">ขาด:</span> ${record.absent} วัน</div><div><span class="label">รวมหัก:</span> ${record.totalDeduction} บาท</div>
        </div>
        <table><thead><tr><th>#</th><th>วันที่</th><th>วัน</th><th>หยุด</th><th>เข้า</th><th>พักออก</th><th>พักเข้า</th><th>เลิก</th><th>เข้าสาย</th><th>หัก(บาท)</th><th>รอบพัก</th><th>สายพัก</th><th>หัก(บาท)</th></tr></thead>
        <tbody>${record.days.map((day, idx) => {
        return '<tr class="' + (day.isHoliday ? 'holiday' : day.isAbsent ? 'absent' : '') + '">' +
            '<td>' + (idx + 1) + '</td><td>' + formatDate(day.date) + '</td><td>' + day.dayOfWeek + '</td><td>' + (day.isHoliday ? 'YES' : '') + '</td>' +
            '<td>' + (day.isHoliday ? '-' : formatTime(day.scan1)) + '</td><td>' + (day.isHoliday ? '-' : formatTime(day.scan2)) + '</td>' +
            '<td>' + (day.isHoliday ? '-' : formatTime(day.scan3)) + '</td><td>' + (day.isHoliday ? '-' : formatTime(day.scan4)) + '</td>' +
            '<td>' + (day.late1Minutes > 0 ? minutesToTime(day.late1Minutes) : '') + '</td><td>' + (day.late1Baht > 0 ? day.late1Baht : 0) + '</td>' +
            '<td>' + (day.isHoliday ? '-' : (day.breakRound || '')) + '</td>' +
            '<td>' + (day.late2Minutes > 0 ? minutesToTime(day.late2Minutes) : '') + '</td><td>' + (day.late2Baht > 0 ? day.late2Baht : 0) + '</td>' +
            '</tr>';
    }).join('')}</tbody>
        <tfoot><tr style="background:#f3f4f6;font-weight:bold;"><td colspan="8" class="text-right">รวม</td>
            <td>${minutesToTime(record.days.reduce((s, d) => s + d.late1Minutes, 0))}</td><td>${record.totalLate1Baht}</td><td></td>
            <td>${minutesToTime(record.days.reduce((s, d) => s + d.late2Minutes, 0))}</td><td>${record.totalLate2Baht}</td>
        </tr></tfoot></table>
        <div class="summary"><p>รวมหักทั้งหมด: ${record.totalDeduction} บาท</p></div>`;
}

function getPrintStyles() {
    return `
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');
        @page { size: A4 portrait; margin: 12mm 10mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Sarabun', sans-serif; font-size: 14px; padding: 0; }
        .header { text-align: center; margin-bottom: 18px; }
        .header h2 { font-size: 22px; font-weight: 700; margin-bottom: 6px; }
        .header p { font-size: 15px; color: #333; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; margin-bottom: 14px; font-size: 15px; }
        .info-grid .label { font-weight: 700; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; table-layout: auto; }
        th, td { border: 1px solid #444; padding: 5px 6px; text-align: center; }
        th { background: #2563eb; color: white; font-weight: 600; font-size: 12px; white-space: nowrap; }
        .holiday { background: #fef3c7; }
        .absent { background: #fee2e2; }
        .text-right { text-align: right; }
        .summary { margin-top: 14px; font-size: 15px; font-weight: 600; }
        .footer { margin-top: 16px; font-size: 11px; color: #666; }
        .page-break { page-break-after: always; padding: 0; }
        .page-break:last-child { page-break-after: auto; }
        @media print {
            body { padding: 0; }
            .page-break { page-break-after: always; }
            .page-break:last-child { page-break-after: auto; }
        }
    `;
}

function printReport(id) {
    const record = reportRecords.find(r => r.id === id);
    if (!record) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><title>รายงาน ${record.empName}</title>
        <style>${getPrintStyles()}</style></head><body>
        ${buildReportHTML(record)}
        <div class="footer"><p>พิมพ์เมื่อ: ${new Date().toLocaleString('th-TH')}</p></div>
        <script>window.onload=function(){window.print();}<\/script></body></html>`);
    printWindow.document.close();
}

function printAllReports() {
    const sorted = [...reportRecords].sort((a, b) => String(a.empCode).localeCompare(String(b.empCode), undefined, { numeric: true }));
    if (sorted.length === 0) { alert('ไม่มีข้อมูลให้พิมพ์'); return; }
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const pages = sorted.map(record => `<div class="page-break">${buildReportHTML(record)}</div>`).join('');
    printWindow.document.write(`<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><title>รายงานทั้งหมด</title>
        <style>${getPrintStyles()}</style></head><body>
        ${pages}
        <script>window.onload=function(){window.print();}<\/script></body></html>`);
    printWindow.document.close();
}

// ============================================
// SETTINGS
// ============================================
function renderSettings(container) {
    container.innerHTML = `
        <div style="max-width:600px;margin:0 auto;">
            <div class="mb-6">
                <h1 class="text-2xl font-bold text-gray-800">ตั้งค่า</h1>
                <p class="text-gray-500 text-sm mt-1">ตั้งค่าทั่วไปของระบบ</p>
            </div>
            <div class="card">
                <h3 class="text-sm font-semibold text-gray-700 mb-4">ข้อมูลร้านค้า</h3>
                <div style="margin-bottom:16px;">
                    <label class="text-sm text-gray-600" style="display:block;margin-bottom:4px;">ชื่อร้านค้า</label>
                    <input type="text" id="settingShopName" class="input-field" value="${escHtml(DEFAULT_SHOP_NAME)}" placeholder="กรอกชื่อร้านค้า">
                    <p class="text-xs text-gray-400" style="margin-top:4px;">ชื่อร้านจะแสดงในรายงานและ PDF</p>
                </div>
                <div style="display:flex;justify-content:flex-end;">
                    <button class="btn-success" onclick="saveSettings()">&#10004; บันทึกการตั้งค่า</button>
                </div>
            </div>
        </div>
    `;
}

async function saveSettings() {
    const shopName = document.getElementById('settingShopName').value.trim();
    if (!shopName) {
        alert('กรุณากรอกชื่อร้านค้า');
        return;
    }
    try {
        await api.updateShop(DEFAULT_SHOP_ID, { name: shopName });
        DEFAULT_SHOP_NAME = shopName;
        alert('บันทึกการตั้งค่าสำเร็จ!');
    } catch (err) {
        alert('เกิดข้อผิดพลาด: ' + err.message);
    }
}

// ============================================
// BONUS PAGE
// ============================================
let bonusYear = new Date().getFullYear();
let bonusRecords = [];
let bonusEmployees = [];
let bonusSearch = '';
let bonusSort = 'asc';

async function renderBonus(container) {
    bonusYear = new Date().getFullYear();
    container.innerHTML = `
        <div style="max-width:960px;margin:0 auto;">
            <div class="mb-6">
                <h1 class="text-2xl font-bold text-gray-800">🏆 โบนัสประจำปี</h1>
                <p class="text-gray-500 text-sm mt-1">ประเมินผลงานและพิจารณาโบนัสพนักงาน</p>
            </div>
            <div class="card mb-6">
                <div style="display:flex;align-items:flex-end;gap:12px;flex-wrap:wrap;">
                    <div>
                        <label class="text-sm text-gray-600" style="display:block;margin-bottom:4px;">ปี (ค.ศ.)</label>
                        <input type="number" id="bonusYear" class="input-field" value="${bonusYear}" min="2020" max="2035" style="width:120px;" onchange="bonusYear=parseInt(this.value)">
                    </div>
                    <div style="flex:1;min-width:200px;">
                        <label class="text-sm text-gray-600" style="display:block;margin-bottom:4px;">ค้นหาพนักงาน</label>
                        <input type="text" id="bonusSearchInput" class="input-field" placeholder="🔍 ชื่อ หรือ รหัสพนักงาน..." value="${bonusSearch}" oninput="bonusSearch=this.value;renderBonusContent()" style="width:100%;">
                    </div>
                    <div style="display:flex;gap:8px;align-items:flex-end;">
                        <button id="bonusSortAsc" onclick="setBonusSort('asc')" style="padding:8px 14px;border-radius:8px;font-size:13px;cursor:pointer;border:1px solid ${bonusSort === 'asc' ? '#3b82f6' : '#d1d5db'};background:${bonusSort === 'asc' ? '#eff6ff' : 'white'};color:${bonusSort === 'asc' ? '#2563eb' : '#374151'};font-weight:${bonusSort === 'asc' ? '600' : '400'};">A→Z</button>
                        <button id="bonusSortDesc" onclick="setBonusSort('desc')" style="padding:8px 14px;border-radius:8px;font-size:13px;cursor:pointer;border:1px solid ${bonusSort === 'desc' ? '#3b82f6' : '#d1d5db'};background:${bonusSort === 'desc' ? '#eff6ff' : 'white'};color:${bonusSort === 'desc' ? '#2563eb' : '#374151'};font-weight:${bonusSort === 'desc' ? '600' : '400'};">Z→A</button>
                    </div>
                    <div style="display:flex;gap:8px;">
                        <button class="btn-primary" onclick="loadBonusPage()">🔄 โหลดข้อมูล</button>
                        <button class="btn-success" onclick="initBonusAllEmployees()">➕ เพิ่มพนักงานทั้งหมด</button>
                        <button onclick="showBonusSummaryReport()" style="padding:8px 14px;border-radius:8px;font-size:13px;cursor:pointer;border:1px solid #7c3aed;background:#f5f3ff;color:#7c3aed;font-weight:600;">📋 รายงานสรุป</button>
                    </div>
                </div>
            </div>
            <div id="bonusContent">
                <div style="text-align:center;padding:48px;color:#9ca3af;">กรุณากด "โหลดข้อมูล" เพื่อเริ่มต้น</div>
            </div>
        </div>`;
}

async function loadBonusPage() {
    bonusYear = parseInt(document.getElementById('bonusYear').value);
    const content = document.getElementById('bonusContent');
    content.innerHTML = `<div style="text-align:center;padding:48px;color:#6b7280;"><div style="font-size:32px;margin-bottom:8px;">⚙️</div>กำลังโหลด...</div>`;
    try {
        [bonusRecords, bonusEmployees] = await Promise.all([
            api.getBonusRecords({ shopId: DEFAULT_SHOP_ID, year: bonusYear }),
            api.getEmployees(),
        ]);
        renderBonusContent();
    } catch (err) {
        content.innerHTML = `<div class="alert alert-error">เกิดข้อผิดพลาด: ${escHtml(err.message)}</div>`;
    }
}

async function initBonusAllEmployees() {
    bonusYear = parseInt(document.getElementById('bonusYear').value);
    const shopEmps = bonusEmployees.filter(e => e.shopId === DEFAULT_SHOP_ID && e.isActive !== 0);
    if (shopEmps.length === 0) { alert('ไม่พบพนักงานที่ยังทำงานอยู่'); return; }

    const btn = event.target;
    btn.disabled = true; btn.textContent = '⏳ กำลังสร้าง...';
    try {
        for (const emp of shopEmps) {
            await api.createBonusRecord({ shopId: DEFAULT_SHOP_ID, employeeId: emp.id, empCode: emp.empCode, empName: emp.name, year: bonusYear });
        }
        await loadBonusPage();
    } catch (err) {
        alert('เกิดข้อผิดพลาด: ' + err.message);
    }
    btn.disabled = false; btn.textContent = '➕ เพิ่มพนักงานทั้งหมด';
}

function setBonusSort(dir) {
    bonusSort = dir;
    // Update button styles
    const asc = document.getElementById('bonusSortAsc');
    const desc = document.getElementById('bonusSortDesc');
    if (asc) {
        asc.style.border = dir === 'asc' ? '1px solid #3b82f6' : '1px solid #d1d5db';
        asc.style.background = dir === 'asc' ? '#eff6ff' : 'white';
        asc.style.color = dir === 'asc' ? '#2563eb' : '#374151';
        asc.style.fontWeight = dir === 'asc' ? '600' : '400';
    }
    if (desc) {
        desc.style.border = dir === 'desc' ? '1px solid #3b82f6' : '1px solid #d1d5db';
        desc.style.background = dir === 'desc' ? '#eff6ff' : 'white';
        desc.style.color = dir === 'desc' ? '#2563eb' : '#374151';
        desc.style.fontWeight = dir === 'desc' ? '600' : '400';
    }
    renderBonusContent();
}

function renderBonusContent() {
    const content = document.getElementById('bonusContent');
    if (bonusRecords.length === 0) {
        content.innerHTML = `<div class="card" style="text-align:center;padding:48px;color:#9ca3af;">
            <div style="font-size:48px;margin-bottom:12px;">📋</div>
            <p>ยังไม่มีข้อมูลโบนัสปี ${bonusYear}</p>
            <p style="font-size:13px;margin-top:8px;">กด "เพิ่มพนักงานทั้งหมด" เพื่อสร้างรายการ</p>
        </div>`;
        return;
    }
    // Filter out resigned employees (isActive === 0)
    const activeRecords = bonusRecords.filter(r => {
        const emp = bonusEmployees.find(e => e.id === r.employeeId);
        return !emp || emp.isActive !== 0;
    });
    const q = bonusSearch.trim().toLowerCase();
    let filtered = q
        ? activeRecords.filter(r => r.empName.toLowerCase().includes(q) || r.empCode.toLowerCase().includes(q))
        : [...activeRecords];
    filtered.sort((a, b) => {
        const cmp = a.empCode.localeCompare(b.empCode, undefined, { numeric: true, sensitivity: 'base' });
        return bonusSort === 'asc' ? cmp : -cmp;
    });
    if (filtered.length === 0) {
        content.innerHTML = `<div class="card" style="text-align:center;padding:48px;color:#9ca3af;">
            <div style="font-size:40px;margin-bottom:12px;">🔍</div>
            <p>ไม่พบพนักงานที่ค้นหา "${escHtml(q)}"</p>
        </div>`;
        return;
    }
    content.innerHTML = filtered.map((rec, idx) => renderBonusCard(rec, idx)).join('');
}

function renderBonusCard(rec, idx) {
    const statusMap = { pending: { label: 'รอพิจารณา', color: '#f59e0b', bg: '#fffbeb' }, approved: { label: 'อนุมัติแล้ว', color: '#10b981', bg: '#ecfdf5' }, rejected: { label: 'ไม่อนุมัติ', color: '#ef4444', bg: '#fef2f2' } };
    const st = statusMap[rec.bonusStatus] || statusMap.pending;
    const att = rec.attendanceSummary;
    const goodLogs = (rec.behaviorLogs || []).filter(l => l.type === 'good');
    const badLogs = (rec.behaviorLogs || []).filter(l => l.type === 'bad');

    return `
    <div class="card mb-6" id="bonusCard_${rec.id}">
        <div style="display:flex;align-items:flex-start;gap:20px;flex-wrap:wrap;">
            <!-- Photo -->
            <div style="flex-shrink:0;text-align:center;">
                <div id="photoWrap_${rec.id}" style="width:90px;height:90px;border-radius:50%;overflow:hidden;border:3px solid #e5e7eb;background:#f3f4f6;display:flex;align-items:center;justify-content:center;cursor:pointer;" onclick="document.getElementById('photoInput_${rec.id}').click()">
                    ${rec.photo ? `<img src="${rec.photo}" style="width:100%;height:100%;object-fit:cover;">` : `<span style="font-size:36px;">👤</span>`}
                </div>
                <input type="file" id="photoInput_${rec.id}" accept="image/*" style="display:none;" onchange="uploadBonusPhoto('${rec.id}',this)">
                <div style="font-size:10px;color:#9ca3af;margin-top:4px;">คลิกเพื่อเปลี่ยนรูป</div>
            </div>
            <!-- Header info -->
            <div style="flex:1;min-width:200px;">
                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                    <h3 style="font-size:18px;font-weight:700;color:var(--text-primary);margin:0;">${escHtml(rec.empName)}</h3>
                    <span style="font-size:12px;color:#6b7280;background:#f3f4f6;padding:2px 8px;border-radius:8px;">รหัส ${escHtml(rec.empCode)}</span>
                    <span style="font-size:12px;font-weight:600;padding:3px 10px;border-radius:10px;color:${st.color};background:${st.bg};">${st.label}</span>
                </div>
                <p style="font-size:13px;color:#6b7280;margin:4px 0 0;">ปีประเมิน ${bonusYear}</p>
            </div>
            <!-- Action buttons -->
            <div style="flex-shrink:0;display:flex;gap:8px;align-items:flex-start;">
                <button onclick="loadBonusAttendance('${rec.id}','${rec.employeeId}')" style="font-size:12px;padding:6px 12px;border:1px solid #3b82f6;background:#eff6ff;color:#2563eb;border-radius:6px;cursor:pointer;">📊 ดึงสรุปเวลาทำงาน</button>
                <button onclick="deleteBonusRecord('${rec.id}','${escHtml(rec.empName)}')" style="font-size:12px;padding:6px 10px;border:1px solid #fca5a5;background:#fff1f2;color:#dc2626;border-radius:6px;cursor:pointer;" title="ลบพนักงานออกจากรายการโบนัส">🗑️ ลบ</button>
            </div>
        </div>

        <!-- Attendance Summary -->
        ${att ? `
        <div style="margin-top:16px;padding:12px 16px;background:linear-gradient(135deg,#f0f9ff,#e0f2fe);border-radius:10px;border:1px solid #bae6fd;">
            <div style="font-size:13px;font-weight:600;color:#0369a1;margin-bottom:10px;">📊 สรุปเวลาทำงานปี ${bonusYear}</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;">
                ${renderAttSummaryItem('✅ ทำงาน', att.workingDays + ' วัน', '#10b981')}
                ${renderAttSummaryItem('🎌 หยุด', att.holidays + ' วัน', '#6b7280')}
                ${renderAttSummaryItem('❌ ขาดงาน', att.absent + ' วัน', att.absent > 0 ? '#ef4444' : '#10b981')}
                ${renderAttSummaryItem('⏰ สายเข้างาน', minutesToTime(att.late1Minutes) + ' (' + att.late1Baht + '฿)', att.late1Baht > 0 ? '#f59e0b' : '#10b981')}
                ${renderAttSummaryItem('☕ สายพัก', minutesToTime(att.late2Minutes) + ' (' + att.late2Baht + '฿)', att.late2Baht > 0 ? '#f59e0b' : '#10b981')}
                ${renderAttSummaryItem('💸 รวมหัก', att.totalDeduction + ' บาท', att.totalDeduction > 0 ? '#ef4444' : '#10b981')}
            </div>
        </div>` : `<div style="margin-top:12px;padding:10px 14px;background:#f9fafb;border-radius:8px;font-size:13px;color:#9ca3af;border:1px dashed #e5e7eb;">ยังไม่มีสรุปเวลาทำงาน — กด "ดึงสรุปเวลาทำงาน" เพื่อโหลด</div>`}

        <!-- Behavior Logs -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px;" class="bonus-behavior-grid">
            <!-- Good behavior -->
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px;">
                <div style="font-size:13px;font-weight:600;color:#15803d;margin-bottom:10px;">✅ พฤติกรรมที่ดี (${goodLogs.length})</div>
                <div id="goodLogs_${rec.id}">
                    ${goodLogs.length === 0 ? '<div style="font-size:12px;color:#9ca3af;font-style:italic;">ยังไม่มีบันทึก</div>' : goodLogs.map(l => renderBehaviorRow(l, rec.id)).join('')}
                </div>
                <button onclick="showAddBehaviorForm('${rec.id}','good')" style="margin-top:10px;font-size:12px;padding:5px 12px;border:1px dashed #16a34a;background:white;color:#15803d;border-radius:6px;cursor:pointer;width:100%;">+ เพิ่มพฤติกรรมดี</button>
            </div>
            <!-- Bad behavior -->
            <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px;">
                <div style="font-size:13px;font-weight:600;color:#c2410c;margin-bottom:10px;">⚠️ พฤติกรรมที่ต้องปรับปรุง (${badLogs.length})</div>
                <div id="badLogs_${rec.id}">
                    ${badLogs.length === 0 ? '<div style="font-size:12px;color:#9ca3af;font-style:italic;">ยังไม่มีบันทึก</div>' : badLogs.map(l => renderBehaviorRow(l, rec.id)).join('')}
                </div>
                <button onclick="showAddBehaviorForm('${rec.id}','bad')" style="margin-top:10px;font-size:12px;padding:5px 12px;border:1px dashed #ea580c;background:white;color:#c2410c;border-radius:6px;cursor:pointer;width:100%;">+ เพิ่มพฤติกรรมที่ต้องปรับปรุง</button>
            </div>
        </div>
        <div id="behaviorForm_${rec.id}" style="display:none;"></div>

        <!-- Bonus Decision -->
        <div style="margin-top:16px;padding:14px 16px;background:var(--bg-surface2);border-radius:10px;border:1px solid var(--input-border);">
            <div style="font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:12px;">💰 การพิจารณาโบนัส</div>
            <div style="display:grid;grid-template-columns:auto auto 1fr;gap:12px;align-items:center;flex-wrap:wrap;" class="bonus-form-grid">
                <div>
                    <label style="font-size:12px;color:#6b7280;display:block;margin-bottom:4px;">จำนวนโบนัส (บาท)</label>
                    <input type="number" id="bonusAmt_${rec.id}" value="${rec.bonusAmount || 0}" min="0" class="input-field" style="width:150px;" placeholder="0">
                </div>
                <div>
                    <label style="font-size:12px;color:#6b7280;display:block;margin-bottom:4px;">สถานะ</label>
                    <select id="bonusSt_${rec.id}" class="input-field" style="width:140px;">
                        <option value="pending"  ${rec.bonusStatus === 'pending' ? 'selected' : ''}>🟡 รอพิจารณา</option>
                        <option value="approved" ${rec.bonusStatus === 'approved' ? 'selected' : ''}>🟢 อนุมัติแล้ว</option>
                        <option value="rejected" ${rec.bonusStatus === 'rejected' ? 'selected' : ''}>🔴 ไม่อนุมัติ</option>
                    </select>
                </div>
                <div>
                    <label style="font-size:12px;color:#6b7280;display:block;margin-bottom:4px;">สรุปการพิจารณา</label>
                    <input type="text" id="bonusSum_${rec.id}" value="${escHtml(rec.summary || '')}" placeholder="สรุปเหตุผลการพิจารณา..." class="input-field" style="width:100%;">
                </div>
            </div>
            <div style="margin-top:12px;display:flex;justify-content:flex-end;">
                <button class="btn-primary" onclick="saveBonusRecord('${rec.id}')">💾 บันทึกการพิจารณา</button>
            </div>
        </div>
    </div>`;
}

function renderAttSummaryItem(label, value, color) {
    return `<div style="background:white;border-radius:8px;padding:8px 10px;text-align:center;border:1px solid #e0f2fe;">
        <div style="font-size:11px;color:#6b7280;margin-bottom:2px;">${label}</div>
        <div style="font-size:14px;font-weight:700;color:${color};">${value}</div>
    </div>`;
}

function renderBehaviorRow(log, recId) {
    return `<div id="blogRow_${log.id}" style="display:flex;align-items:flex-start;gap:6px;margin-bottom:6px;padding:6px 8px;background:white;border-radius:6px;font-size:12px;">
        <div style="flex:0 0 80px;color:#6b7280;">${log.date || ''}</div>
        <div style="flex:1;color:var(--text-primary);">${escHtml(log.description)}</div>
        <button onclick="deleteBehaviorLog('${log.id}','${recId}')" style="flex-shrink:0;background:none;border:none;cursor:pointer;color:#f87171;font-size:14px;padding:0 2px;" title="ลบ">✕</button>
    </div>`;
}

function showAddBehaviorForm(recId, type) {
    const formEl = document.getElementById(`behaviorForm_${recId}`);
    const typeLabel = type === 'good' ? 'พฤติกรรมดี' : 'พฤติกรรมที่ต้องปรับปรุง';
    const color = type === 'good' ? '#15803d' : '#c2410c';
    const today = new Date().toISOString().slice(0, 10);
    formEl.style.display = 'block';
    formEl.innerHTML = `
        <div style="margin-top:12px;padding:14px;background:${type === 'good' ? '#f0fdf4' : '#fff7ed'};border:1px solid ${type === 'good' ? '#bbf7d0' : '#fed7aa'};border-radius:10px;">
            <div style="font-size:13px;font-weight:600;color:${color};margin-bottom:10px;">+ เพิ่ม${typeLabel}</div>
            <div style="display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:center;">
                <div>
                    <label style="font-size:12px;color:#6b7280;display:block;margin-bottom:4px;">วันที่</label>
                    <input type="date" id="blogDate_${recId}" value="${today}" class="input-field" style="width:150px;">
                </div>
                <div>
                    <label style="font-size:12px;color:#6b7280;display:block;margin-bottom:4px;">รายละเอียด</label>
                    <input type="text" id="blogDesc_${recId}" placeholder="บันทึกรายละเอียด..." class="input-field" style="width:100%;">
                </div>
            </div>
            <div style="margin-top:10px;display:flex;gap:8px;justify-content:flex-end;">
                <button onclick="document.getElementById('behaviorForm_${recId}').style.display='none'" style="font-size:12px;padding:5px 14px;border:1px solid #d1d5db;background:white;color:#6b7280;border-radius:6px;cursor:pointer;">ยกเลิก</button>
                <button onclick="saveBehaviorLog('${recId}','${type}')" style="font-size:12px;padding:5px 14px;border:none;background:${type === 'good' ? '#16a34a' : '#ea580c'};color:white;border-radius:6px;cursor:pointer;font-weight:600;">บันทึก</button>
            </div>
        </div>`;
    document.getElementById(`blogDesc_${recId}`).focus();
}

async function deleteBonusRecord(recId, empName) {
    if (!confirm(`ลบ "${empName}" ออกจากรายการโบนัสปี ${bonusYear}?\n(ข้อมูลพฤติกรรมและการพิจารณาจะถูกลบด้วย)`)) return;
    try {
        await api.deleteBonusRecord(recId);
        bonusRecords = bonusRecords.filter(r => r.id !== recId);
        renderBonusContent();
        showBonusToast('🗑️ ลบเรียบร้อยแล้ว');
    } catch (err) { alert('เกิดข้อผิดพลาด: ' + err.message); }
}

async function saveBehaviorLog(recId, type) {
    const date = document.getElementById(`blogDate_${recId}`).value;
    const desc = document.getElementById(`blogDesc_${recId}`).value.trim();
    if (!desc) { alert('กรุณากรอกรายละเอียด'); return; }
    try {
        const log = await api.addBehavior({ bonusRecordId: recId, type, date, description: desc });
        document.getElementById(`behaviorForm_${recId}`).style.display = 'none';
        const container = document.getElementById(`${type}Logs_${recId}`);
        const placeholder = container.querySelector('div[style*="italic"]');
        if (placeholder) placeholder.remove();
        container.insertAdjacentHTML('beforeend', renderBehaviorRow(log, recId));
        // Update count in header
        const rec = bonusRecords.find(r => r.id === recId);
        if (rec) {
            if (!rec.behaviorLogs) rec.behaviorLogs = [];
            rec.behaviorLogs.push(log);
        }
    } catch (err) { alert('เกิดข้อผิดพลาด: ' + err.message); }
}

async function deleteBehaviorLog(logId, recId) {
    if (!confirm('ลบรายการนี้?')) return;
    try {
        await api.deleteBehavior(logId);
        const row = document.getElementById(`blogRow_${logId}`);
        if (row) row.remove();
    } catch (err) { alert('เกิดข้อผิดพลาด: ' + err.message); }
}

async function loadBonusAttendance(recId, employeeId) {
    const btn = event.target;
    btn.disabled = true; btn.textContent = '⏳ กำลังดึงข้อมูล...';
    try {
        let workingDays = 0, holidays = 0, absent = 0;
        let late1Minutes = 0, late1Baht = 0, late2Minutes = 0, late2Baht = 0, totalDeduction = 0;
        for (let m = 1; m <= 12; m++) {
            try {
                const records = await api.getAttendance({ shopId: DEFAULT_SHOP_ID, month: m, year: bonusYear });
                const empRec = records.find(r => r.employeeId === employeeId);
                if (empRec) {
                    workingDays += empRec.workingDays || 0;
                    holidays += empRec.holidays || 0;
                    absent += empRec.absent || 0;
                    totalDeduction += empRec.totalDeduction || 0;
                    late1Baht += empRec.totalLate1Baht || 0;
                    late2Baht += empRec.totalLate2Baht || 0;
                    if (empRec.days) {
                        for (const d of empRec.days) {
                            late1Minutes += d.late1Minutes || 0;
                            late2Minutes += d.late2Minutes || 0;
                        }
                    }
                }
            } catch { }
        }
        const summary = { workingDays, holidays, absent, late1Minutes, late1Baht, late2Minutes, late2Baht, totalDeduction };
        await api.updateBonusRecord(recId, { attendanceSummary: summary });
        const rec = bonusRecords.find(r => r.id === recId);
        if (rec) rec.attendanceSummary = summary;
        renderBonusContent();
    } catch (err) { alert('เกิดข้อผิดพลาด: ' + err.message); }
    btn.disabled = false; btn.textContent = '📊 ดึงสรุปเวลาทำงาน';
}

async function saveBonusRecord(recId) {
    const amount = parseFloat(document.getElementById(`bonusAmt_${recId}`).value) || 0;
    const status = document.getElementById(`bonusSt_${recId}`).value;
    const summary = document.getElementById(`bonusSum_${recId}`).value.trim();
    try {
        await api.updateBonusRecord(recId, { bonusAmount: amount, bonusStatus: status, summary });
        const rec = bonusRecords.find(r => r.id === recId);
        if (rec) { rec.bonusAmount = amount; rec.bonusStatus = status; rec.summary = summary; }
        // Update status badge
        renderBonusContent();
        // Scroll to card
        setTimeout(() => { const el = document.getElementById(`bonusCard_${recId}`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
        showBonusToast('✅ บันทึกสำเร็จ!');
    } catch (err) { alert('เกิดข้อผิดพลาด: ' + err.message); }
}

function showBonusSummaryReport() {
    if (bonusRecords.length === 0) { alert('ไม่มีข้อมูลโบนัส — กรุณาโหลดข้อมูลก่อน'); return; }

    // Filter out resigned employees (isActive === 0)
    const activeBonus = bonusRecords.filter(r => {
        const emp = bonusEmployees.find(e => e.id === r.employeeId);
        return !emp || emp.isActive !== 0;
    });
    if (activeBonus.length === 0) { alert('ไม่มีข้อมูลโบนัสของพนักงานที่ยังทำงานอยู่'); return; }

    const statusMap = { pending: '🟡 รอพิจารณา', approved: '🟢 อนุมัติแล้ว', rejected: '🔴 ไม่อนุมัติ' };
    const approved = activeBonus.filter(r => r.bonusStatus === 'approved');
    const pending = activeBonus.filter(r => r.bonusStatus === 'pending');
    const rejected = activeBonus.filter(r => r.bonusStatus === 'rejected');
    const totalBudget = approved.reduce((s, r) => s + (parseFloat(r.bonusAmount) || 0), 0);

    const sorted = [...activeBonus].sort((a, b) => (parseFloat(b.bonusAmount) || 0) - (parseFloat(a.bonusAmount) || 0));

    const rows = sorted.map((r, i) => {
        const amt = parseFloat(r.bonusAmount) || 0;
        const att = r.attendanceSummary;
        const stLabel = statusMap[r.bonusStatus] || '🟡 รอพิจารณา';
        const rowBg = r.bonusStatus === 'approved' ? '#f0fdf4' : r.bonusStatus === 'rejected' ? '#fff1f2' : '';
        return `<tr style="background:${rowBg};">
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:600;color:#6b7280;">${i + 1}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">
                <div style="font-weight:600;color:#111827;">${escHtml(r.empName)}</div>
                <div style="font-size:11px;color:#9ca3af;">รหัส ${escHtml(r.empCode)}</div>
            </td>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${att ? att.workingDays + ' วัน' : '-'}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:${att && att.absent > 0 ? '#ef4444' : '#10b981'};font-weight:600;">${att ? att.absent + ' วัน' : '-'}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:${att && att.totalDeduction > 0 ? '#f59e0b' : '#10b981'};">${att ? att.totalDeduction.toLocaleString() + '฿' : '-'}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${stLabel}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700;font-size:15px;color:${amt > 0 ? '#059669' : '#6b7280'};">${amt > 0 ? amt.toLocaleString() + ' ฿' : '-'}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;">${escHtml(r.summary || '-')}</td>
        </tr>`;
    }).join('');

    const modal = document.createElement('div');
    modal.id = 'bonusReportModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9998;display:flex;align-items:flex-start;justify-content:center;padding:24px;overflow-y:auto;';
    modal.innerHTML = `
        <div style="background:white;border-radius:16px;width:100%;max-width:900px;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
            <div style="padding:20px 24px;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between;">
                <div>
                    <h2 style="font-size:20px;font-weight:700;color:#111827;margin:0;">📋 รายงานสรุปโบนัสประจำปี ${bonusYear}</h2>
                    <p style="font-size:13px;color:#6b7280;margin:4px 0 0;">สรุปภาพรวมการพิจารณาโบนัสพนักงานทั้งหมด</p>
                </div>
                <button onclick="document.getElementById('bonusReportModal').remove()" style="background:none;border:none;font-size:22px;cursor:pointer;color:#6b7280;padding:4px 8px;">✕</button>
            </div>
            <!-- Stats Row -->
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#e5e7eb;">
                <div style="background:#f0fdf4;padding:16px 20px;text-align:center;">
                    <div style="font-size:24px;font-weight:700;color:#059669;">${approved.length}</div>
                    <div style="font-size:12px;color:#6b7280;margin-top:2px;">🟢 อนุมัติแล้ว</div>
                </div>
                <div style="background:#fffbeb;padding:16px 20px;text-align:center;">
                    <div style="font-size:24px;font-weight:700;color:#d97706;">${pending.length}</div>
                    <div style="font-size:12px;color:#6b7280;margin-top:2px;">🟡 รอพิจารณา</div>
                </div>
                <div style="background:#fff1f2;padding:16px 20px;text-align:center;">
                    <div style="font-size:24px;font-weight:700;color:#dc2626;">${rejected.length}</div>
                    <div style="font-size:12px;color:#6b7280;margin-top:2px;">🔴 ไม่อนุมัติ</div>
                </div>
                <div style="background:#f5f3ff;padding:16px 20px;text-align:center;">
                    <div style="font-size:22px;font-weight:700;color:#7c3aed;">${totalBudget.toLocaleString()} ฿</div>
                    <div style="font-size:12px;color:#6b7280;margin-top:2px;">💰 งบรวมทั้งหมด</div>
                </div>
            </div>
            <!-- Table -->
            <div style="padding:16px 24px;overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;font-size:13px;">
                    <thead>
                        <tr style="background:#f9fafb;">
                            <th style="padding:10px 12px;text-align:center;font-weight:600;color:#374151;border-bottom:2px solid #e5e7eb;">#</th>
                            <th style="padding:10px 12px;text-align:left;font-weight:600;color:#374151;border-bottom:2px solid #e5e7eb;">ชื่อพนักงาน</th>
                            <th style="padding:10px 12px;text-align:center;font-weight:600;color:#374151;border-bottom:2px solid #e5e7eb;">วันทำงาน</th>
                            <th style="padding:10px 12px;text-align:center;font-weight:600;color:#374151;border-bottom:2px solid #e5e7eb;">ขาดงาน</th>
                            <th style="padding:10px 12px;text-align:center;font-weight:600;color:#374151;border-bottom:2px solid #e5e7eb;">หักรวม</th>
                            <th style="padding:10px 12px;text-align:center;font-weight:600;color:#374151;border-bottom:2px solid #e5e7eb;">สถานะ</th>
                            <th style="padding:10px 12px;text-align:right;font-weight:600;color:#374151;border-bottom:2px solid #e5e7eb;">โบนัส (บาท)</th>
                            <th style="padding:10px 12px;text-align:left;font-weight:600;color:#374151;border-bottom:2px solid #e5e7eb;">หมายเหตุ</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                    <tfoot>
                        <tr style="background:#f5f3ff;">
                            <td colspan="6" style="padding:12px;font-weight:700;color:#7c3aed;border-top:2px solid #e5e7eb;">💰 รวมงบโบนัสที่อนุมัติ</td>
                            <td style="padding:12px;text-align:right;font-weight:700;font-size:16px;color:#7c3aed;border-top:2px solid #e5e7eb;">${totalBudget.toLocaleString()} ฿</td>
                            <td style="border-top:2px solid #e5e7eb;"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <div style="padding:12px 24px 20px;display:flex;justify-content:flex-end;gap:8px;">
                <button onclick="printBonusReport()" style="padding:8px 18px;border:1px solid #7c3aed;background:#f5f3ff;color:#7c3aed;border-radius:8px;cursor:pointer;font-weight:600;">🖨️ พิมพ์รายงาน</button>
                <button onclick="document.getElementById('bonusReportModal').remove()" style="padding:8px 18px;border:1px solid #d1d5db;background:white;color:#374151;border-radius:8px;cursor:pointer;">ปิด</button>
            </div>
        </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

function printBonusReport() {
    const modal = document.getElementById('bonusReportModal');
    if (!modal) return;
    const content = modal.querySelector('div');
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>รายงานโบนัสประจำปี ${bonusYear}</title>
    <style>body{font-family:'Sarabun',sans-serif;padding:20px;}table{width:100%;border-collapse:collapse;font-size:13px;}th,td{padding:8px 10px;border:1px solid #ccc;}th{background:#f3f4f6;font-weight:600;}tr:nth-child(even){background:#f9fafb;}.no-print{display:none;}@media print{.no-print{display:none;}}</style>
    </head><body>${content.innerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 500);
}

function showBonusToast(msg) {
    const t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#1e3a5f;color:white;padding:12px 20px;border-radius:10px;font-size:14px;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.2);';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
}

async function uploadBonusPhoto(recId, input) {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert('ไฟล์ใหญ่เกิน 2MB กรุณาเลือกรูปขนาดเล็กกว่า'); return; }
    const reader = new FileReader();
    reader.onload = async (e) => {
        const original = e.target.result;
        const base64 = await resizeImageBase64(original, 300, 300);
        try {
            await api.updateBonusRecord(recId, { photo: base64 });
            const wrap = document.getElementById(`photoWrap_${recId}`);
            if (wrap) wrap.innerHTML = `<img src="${base64}" style="width:100%;height:100%;object-fit:cover;">`;
            showBonusToast('✅ อัปโหลดรูปสำเร็จ!');
        } catch (err) { alert('เกิดข้อผิดพลาด: ' + err.message); }
    };
    reader.readAsDataURL(file);
}

function resizeImageBase64(dataUrl, maxW, maxH) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            let w = img.width, h = img.height;
            if (w > maxW || h > maxH) {
                const ratio = Math.min(maxW / w, maxH / h);
                w = Math.round(w * ratio);
                h = Math.round(h * ratio);
            }
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = dataUrl;
    });
}

// ============================================
// UTILITIES
// ============================================
function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
