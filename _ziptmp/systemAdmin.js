// 系统管理员仪表盘功能模块（与 system-admin-dashboard.html 对齐）
class SystemAdminDashboard {
    constructor() {
        this.currentPage = 'dashboard';
        this.userData = null;
        this.usersData = [];
        this.logsData = [];
        this.backupsData = [];
        this.pageSize = 10;
        this.currentUsersPage = 1;
        this.activeLogFilters = {};
        this.init();
    }

    init() {
        if (!auth.checkSession() || auth.currentUser?.userType !== 'systemAdmin') {
            window.location.href = 'index.html';
            return;
        }

        this.userData = auth.currentUser;
        this.reloadData();
        this.setupEventListeners();
        this.renderCurrentPage();
        this.updateUserInfo();
        this.enforcePasswordChange();
        this.startSystemMonitoring();
    }

    reloadData() {
        this.usersData = dataManager.getData('users');
        this.logsData = dataManager.getLogs();
        this.backupsData = dataManager.getBackups();
        this.settings = dataManager.getSettings();
    }

    setupEventListeners() {
        // 侧边栏导航
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.switchPage(page);
            });
        });

        // 登出
        document.getElementById('logoutBtn')?.addEventListener('click', () => auth.logout());

        // 用户管理：筛选/搜索
        document.getElementById('userSearchInput')?.addEventListener('input', () => {
            this.currentUsersPage = 1;
            this.renderUsers();
        });
        document.getElementById('userTypeFilter')?.addEventListener('change', () => {
            this.currentUsersPage = 1;
            this.renderUsers();
        });
        document.getElementById('userStatusFilter')?.addEventListener('change', () => {
            this.currentUsersPage = 1;
            this.renderUsers();
        });

        // 全选
        document.getElementById('selectAllUsers')?.addEventListener('change', (e) => {
            const checked = e.target.checked;
            document.querySelectorAll('input.user-select').forEach(cb => cb.checked = checked);
        });

        // 创建用户
        document.getElementById('createUserBtn')?.addEventListener('click', () => this.openModal('createUserModal'));
        document.getElementById('closeCreateUserModal')?.addEventListener('click', () => this.closeModal('createUserModal'));
        document.getElementById('cancelCreateUser')?.addEventListener('click', () => this.closeModal('createUserModal'));
        document.getElementById('createUserForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCreateUser();
        });

        // 批量导入
        document.getElementById('batchImportBtn')?.addEventListener('click', () => this.openModal('batchImportModal'));
        document.getElementById('closeBatchImportModal')?.addEventListener('click', () => this.closeModal('batchImportModal'));
        document.getElementById('cancelBatchImport')?.addEventListener('click', () => this.closeModal('batchImportModal'));
        document.getElementById('downloadImportTemplate')?.addEventListener('click', () => this.downloadStudentTemplate());
        document.getElementById('batchImportForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleBatchImport();
        });

        // 导出用户
        document.getElementById('exportUsersBtn')?.addEventListener('click', () => this.exportUsers());

        // 日志
        document.getElementById('searchLogsBtn')?.addEventListener('click', () => this.applyLogFilters());
        document.getElementById('clearLogsBtn')?.addEventListener('click', () => this.clearLogs());
        document.getElementById('exportLogsBtn')?.addEventListener('click', () => this.exportLogs());

        // 备份
        document.getElementById('createBackupBtn')?.addEventListener('click', () => this.createBackup());
        document.getElementById('scheduleBackupBtn')?.addEventListener('click', () => {
            showMessage('定时备份（演示）', 'info');
        });
        document.getElementById('backupSelect')?.addEventListener('change', () => {
            const val = document.getElementById('backupSelect').value;
            const btn = document.getElementById('startRestoreBtn');
            if (btn) btn.disabled = !val;
        });
        document.getElementById('confirmRestore')?.addEventListener('change', () => {
            const cb = document.getElementById('confirmRestore');
            const btn = document.getElementById('startRestoreBtn');
            if (btn) btn.disabled = !cb.checked || !document.getElementById('backupSelect')?.value;
        });
        document.getElementById('startRestoreBtn')?.addEventListener('click', () => this.restoreSelectedBackup());

        // 监控
        document.getElementById('refreshMonitoringBtn')?.addEventListener('click', () => this.renderMonitoring());

        // 安全扫描
        document.getElementById('securityScanBtn')?.addEventListener('click', () => this.runSecurityScan());
    }

    openModal(id) {
        const modal = document.getElementById(id);
        if (!modal) return;
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        // 清理状态
        if (id === 'batchImportModal') {
            document.getElementById('importResult')?.classList.add('hidden');
            document.getElementById('importResultBody') && (document.getElementById('importResultBody').innerHTML = '');
            document.getElementById('importFile') && (document.getElementById('importFile').value = '');
        }
    }

    closeModal(id) {
        const modal = document.getElementById(id);
        if (!modal) return;
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    switchPage(page) {
        this.currentPage = page;
        document.querySelectorAll('.page-content').forEach(section => section.classList.remove('active'));
        document.getElementById(page)?.classList.add('active');
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');
        this.renderCurrentPage();
    }

    renderCurrentPage() {
        this.reloadData();
        if (this.currentPage === 'users') this.renderUsers();
        if (this.currentPage === 'logs') this.renderLogs();
        if (this.currentPage === 'backup') this.renderBackups();
        if (this.currentPage === 'dashboard') this.renderDashboard();
    }

    updateUserInfo() {
        document.getElementById('userName') && (document.getElementById('userName').textContent = this.userData.name);
        document.getElementById('userRole') && (document.getElementById('userRole').textContent = '系统管理员');
    }

    renderDashboard() {
        const stats = dataManager.getStatistics();
        const statsContainer = document.getElementById('systemStats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="stat-card"><h4>总用户数</h4><span class="stat-value">${stats.totalUsers}</span></div>
                <div class="stat-card"><h4>活跃用户</h4><span class="stat-value">${stats.activeUsers}</span></div>
                <div class="stat-card"><h4>课程数</h4><span class="stat-value">${stats.totalCourses}</span></div>
                <div class="stat-card"><h4>备份数</h4><span class="stat-value">${this.backupsData.length}</span></div>
            `;
        }

        const recentLogsBody = document.getElementById('recentLogsBody');
        if (recentLogsBody) {
            const logs = this.logsData.slice(0, 8);
            recentLogsBody.innerHTML = logs.map(log => {
                const u = dataManager.getUserById(log.userId) || { name: '系统' };
                return `
                    <tr>
                        <td>${new Date(log.timestamp).toLocaleString()}</td>
                        <td>${u.name}</td>
                        <td>${log.action}</td>
                        <td>${log.description}</td>
                    </tr>
                `;
            }).join('');
        }

        this.renderMonitoring();
    }

    // 用户管理
    getFilteredUsers() {
        const kw = (document.getElementById('userSearchInput')?.value || '').trim().toLowerCase();
        const type = document.getElementById('userTypeFilter')?.value || '';
        const status = document.getElementById('userStatusFilter')?.value || '';

        return this.usersData.filter(u => {
            if (type && u.userType !== type) return false;
            if (status && u.status !== status) return false;
            if (!kw) return true;
            return (
                (u.username || '').toLowerCase().includes(kw) ||
                (u.name || '').toLowerCase().includes(kw) ||
                (u.email || '').toLowerCase().includes(kw)
            );
        }).sort((a, b) => (b.lastLoginAt || '').localeCompare(a.lastLoginAt || ''));
    }

    renderUsers() {
        const tbody = document.getElementById('usersTableBody');
        const pager = document.getElementById('usersPagination');
        if (!tbody) return;

        const users = this.getFilteredUsers();
        const totalPages = Math.max(1, Math.ceil(users.length / this.pageSize));
        this.currentUsersPage = Math.min(this.currentUsersPage, totalPages);

        const start = (this.currentUsersPage - 1) * this.pageSize;
        const pageItems = users.slice(start, start + this.pageSize);

        tbody.innerHTML = pageItems.map(u => {
            const lastLogin = u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '--';
            return `
                <tr>
                    <td><input class="user-select" type="checkbox" data-id="${u.id}"></td>
                    <td>${u.id.slice(-8)}</td>
                    <td>${u.username}</td>
                    <td>${u.name || '--'}</td>
                    <td>${this.getUserTypeText(u.userType)}</td>
                    <td>${u.email || '--'}</td>
                    <td>${lastLogin}</td>
                    <td><span class="status-badge ${u.status}">${this.getStatusText(u.status)}</span></td>
                    <td>
                        <button class="btn-sm btn-secondary" onclick="systemAdmin.resetPassword('${u.id}')">重置密码</button>
                        ${u.status === 'locked' ?
                            `<button class="btn-sm btn-success" onclick="systemAdmin.unlockUser('${u.id}')">解锁</button>` :
                            `<button class="btn-sm btn-warning" onclick="systemAdmin.lockUser('${u.id}')">锁定</button>`
                        }
                        <button class="btn-sm btn-danger" onclick="systemAdmin.deleteUser('${u.id}')">删除</button>
                    </td>
                </tr>
            `;
        }).join('');

        if (pager) {
            pager.innerHTML = this.renderPagination(totalPages, this.currentUsersPage, (p) => `systemAdmin.goUsersPage(${p})`);
        }
    }

    renderPagination(totalPages, current, handlerExprBuilder) {
        if (totalPages <= 1) return '';
        const btn = (label, page, disabled = false, active = false) => {
            const cls = `page-btn ${active ? 'active' : ''}`;
            const dis = disabled ? 'disabled' : '';
            return `<button class="${cls}" ${dis} onclick="${handlerExprBuilder(page)}">${label}</button>`;
        };

        const parts = [];
        parts.push(btn('上一页', Math.max(1, current - 1), current === 1));
        const windowSize = 5;
        let start = Math.max(1, current - Math.floor(windowSize / 2));
        let end = Math.min(totalPages, start + windowSize - 1);
        start = Math.max(1, end - windowSize + 1);
        for (let p = start; p <= end; p++) {
            parts.push(btn(String(p), p, false, p === current));
        }
        parts.push(btn('下一页', Math.min(totalPages, current + 1), current === totalPages));
        return parts.join('');
    }

    goUsersPage(page) {
        this.currentUsersPage = page;
        this.renderUsers();
    }

    getUserTypeText(type) {
        return ({
            student: '学生',
            teacher: '教师',
            academicAdmin: '教学管理员',
            systemAdmin: '系统管理员'
        })[type] || type;
    }

    getStatusText(status) {
        return ({ active: '正常', inactive: '未激活', locked: '锁定' })[status] || status;
    }

    handleCreateUser() {
        const userType = document.getElementById('newUserType')?.value;
        const username = document.getElementById('newUsername')?.value?.trim();
        const name = document.getElementById('newName')?.value?.trim();
        const email = document.getElementById('newEmail')?.value?.trim();
        const password = document.getElementById('newPassword')?.value;
        const requirePasswordChange = !!document.getElementById('requirePasswordChange')?.checked;

        if (!userType || !username || !name || !email || !password) {
            showMessage('请填写完整信息', 'warning');
            return;
        }

        const result = dataManager.createUser({
            username,
            name,
            userType,
            email,
            initialPassword: password,
            requirePasswordChange,
            createdBy: this.userData.id
        });

        if (!result.success) {
            showMessage(result.message || '创建失败', 'error');
            return;
        }

        showMessage(`用户创建成功（初始密码已设置）`, 'success');
        this.closeModal('createUserModal');
        this.renderCurrentPage();
    }

    resetPassword(userId) {
        const user = dataManager.getUserById(userId);
        if (!user) return;
        if (!confirm(`确定重置 ${user.name}（${user.username}）的密码为 123456 吗？`)) return;

        const salt = user.username;
        const hash = dataManager.hashPassword('123456', salt);
        dataManager.updateUserPassword(userId, hash, salt, { requirePasswordChange: true });
        dataManager.addLog(this.userData.id, 'password_reset_by_admin', `重置密码：${user.userType}/${user.username}`);

        this.renderCurrentPage();
        showMessage('密码已重置，首次登录将强制修改', 'success');
    }

    lockUser(userId) {
        const user = dataManager.getUserById(userId);
        if (!user) return;
        if (!confirm(`确定锁定用户 ${user.name}（${user.username}）吗？`)) return;
        const until = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(); // 演示：锁7天
        dataManager.updateUserLoginSecurity(userId, { lockedUntil: until, failedLoginCount: user.failedLoginCount || 0 });
        dataManager.addLog(this.userData.id, 'user_locked', `锁定用户：${user.userType}/${user.username}`);
        this.renderCurrentPage();
    }

    unlockUser(userId) {
        const user = dataManager.getUserById(userId);
        if (!user) return;
        if (!confirm(`确定解锁用户 ${user.name}（${user.username}）吗？`)) return;
        dataManager.updateUserLoginSecurity(userId, { lockedUntil: null, failedLoginCount: 0 });
        user.status = 'active';
        dataManager.saveData();
        dataManager.addLog(this.userData.id, 'user_unlocked', `解锁用户：${user.userType}/${user.username}`);
        this.renderCurrentPage();
    }

    deleteUser(userId) {
        const user = dataManager.getUserById(userId);
        if (!user) return;
        if (!confirm(`确定删除用户 ${user.name}（${user.username}）吗？此操作不可撤销。`)) return;

        const data = dataManager.getData();
        data.users = data.users.filter(u => u.id !== userId);
        // 关联数据清理（演示：选课/成绩/提交）
        data.enrollments = (data.enrollments || []).filter(e => e.studentId !== userId);
        data.grades = (data.grades || []).filter(g => g.studentId !== userId);
        data.submissions = (data.submissions || []).filter(s => s.studentId !== userId);
        dataManager.saveData();
        dataManager.addLog(this.userData.id, 'user_deleted', `删除用户：${user.userType}/${user.username}`);

        this.renderCurrentPage();
        showMessage('用户已删除', 'success');
    }

    // 批量导入
    downloadStudentTemplate() {
        const csv = '学号,姓名,班级,邮箱\n2021001004,李四,计算机2101,2021001004@university.edu.cn\n';
        this.downloadText('student_import_template.csv', csv);
    }

    async handleBatchImport() {
        const file = document.getElementById('importFile')?.files?.[0];
        const defaultPassword = document.getElementById('importDefaultPassword')?.value || '123456';
        const requireChange = !!document.getElementById('importRequireChange')?.checked;

        if (!file) {
            showMessage('请选择要导入的文件', 'warning');
            return;
        }

        try {
            const rows = await this.parseImportFile(file);
            if (!rows || rows.length === 0) {
                showMessage('未解析到有效数据', 'warning');
                return;
            }

            const result = dataManager.importStudents(rows, {
                defaultPassword,
                requirePasswordChange: requireChange,
                createdBy: this.userData.id
            });

            this.renderImportResult(result);
            this.reloadData();
            this.renderUsers();
            dataManager.addLog(this.userData.id, 'students_imported', `批量导入学生：成功 ${result.created.length}，失败 ${result.failed.length}`);
        } catch (err) {
            console.error(err);
            showMessage('导入失败：' + (err.message || err), 'error');
        }
    }

    renderImportResult(result) {
        const panel = document.getElementById('importResult');
        const body = document.getElementById('importResultBody');
        if (!panel || !body) return;

        panel.classList.remove('hidden');
        const created = result.created || [];
        const failed = result.failed || [];

        body.innerHTML = `
            <div style="margin-bottom:10px;">
                <strong>导入完成：</strong>
                <span style="margin-right:12px;">成功 ${created.length}</span>
                <span>失败 ${failed.length}</span>
            </div>
            ${failed.length ? `
                <div class="table-container" style="max-height:220px;overflow:auto;">
                    <table class="users-table">
                        <thead><tr><th>行号</th><th>原因</th></tr></thead>
                        <tbody>
                            ${failed.slice(0, 50).map(f => `<tr><td>${f.row}</td><td>${f.reason}</td></tr>`).join('')}
                        </tbody>
                    </table>
                </div>
                <div style="margin-top:8px;opacity:.8;">仅展示前50条失败记录</div>
            ` : '<div style="color:#2e7d32;">全部导入成功</div>'}
        `;
    }

    parseImportFile(file) {
        const name = (file.name || '').toLowerCase();
        if (name.endsWith('.csv')) {
            return this.readFileText(file).then(t => this.parseCSV(t));
        }
        if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
            if (!window.XLSX) {
                throw new Error('未加载 XLSX 解析库，请联网或改用 CSV');
            }
            return this.readFileArrayBuffer(file).then(buf => {
                const wb = window.XLSX.read(buf, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                return window.XLSX.utils.sheet_to_json(ws, { defval: '' });
            });
        }
        throw new Error('仅支持 .csv / .xlsx / .xls');
    }

    readFileText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(reader.error || new Error('读取失败'));
            reader.readAsText(file, 'utf-8');
        });
    }

    readFileArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error || new Error('读取失败'));
            reader.readAsArrayBuffer(file);
        });
    }

    parseCSV(text) {
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length < 2) return [];
        const header = lines[0].split(',').map(h => h.trim());
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            const cols = this.parseCSVLine(lines[i]);
            const obj = {};
            header.forEach((h, idx) => obj[h] = cols[idx] ?? '');
            rows.push(obj);
        }
        return rows;
    }


    parseCSVLine(line) {
        const res = [];
        let cur = '';
        let inQuote = false;

        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                // 处理转义双引号
                if (inQuote && line[i + 1] === '"') {
                    cur += '"';
                    i++;
                } else {
                    inQuote = !inQuote;
                }
            } else if (ch === ',' && !inQuote) {
                res.push(cur);
                cur = '';
            } else {
                cur += ch;
            }
        }
        res.push(cur);
        return res;
    }
}

// 消息提示
function showMessage(message, type = 'info') {
    const container = document.getElementById('messageContainer');
    if (!container) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    container.appendChild(messageDiv);

    setTimeout(() => messageDiv.remove(), 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    window.systemAdmin = new SystemAdminDashboard();
});
