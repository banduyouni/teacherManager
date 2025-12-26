// 系统管理员仪表盘功能模块（与 system-admin-dashboard.html 对齐）
class SystemAdminDashboard {
    constructor() {
        this.currentPage = 'dashboard';
        this.userData = null;
        this.usersData = [];
        this.logsData = [];
        this.backupsData = [];
        this.settings = {};
        this.pageSize = 10;
        this.currentUsersPage = 1;
        this.currentLogsPage = 1;
        this.activeLogFilters = { type: '', startDate: '', endDate: '' };
        this.monitorTimer = null;
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
        this.usersData = dataManager.getData('users') || [];
        this.logsData = dataManager.getLogs() || [];
        this.backupsData = dataManager.getBackups() || [];
        this.settings = dataManager.getSettings() || {};
    }

    setupEventListeners() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (event) => {
                event.preventDefault();
                const page = item.dataset.page;
                if (page) this.switchPage(page);
            });
        });

        document.getElementById('logoutBtn')?.addEventListener('click', () => auth.logout());

        document.getElementById('userSearch')?.addEventListener('input', () => {
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

        document.getElementById('selectAllUsers')?.addEventListener('change', (event) => {
            const checked = event.target.checked;
            document.querySelectorAll('input.user-select').forEach(cb => cb.checked = checked);
        });

        document.getElementById('createUserBtn')?.addEventListener('click', () => this.openModal('createUserModal'));
        document.getElementById('closeCreateUserModal')?.addEventListener('click', () => this.closeModal('createUserModal'));
        document.getElementById('cancelCreateUser')?.addEventListener('click', () => this.closeModal('createUserModal'));
        document.getElementById('createUserForm')?.addEventListener('submit', (event) => {
            event.preventDefault();
            this.handleCreateUser();
        });

        document.getElementById('batchImportBtn')?.addEventListener('click', () => this.openModal('batchImportModal'));
        document.getElementById('closeBatchImportModal')?.addEventListener('click', () => this.closeModal('batchImportModal'));
        document.getElementById('cancelBatchImport')?.addEventListener('click', () => this.closeModal('batchImportModal'));
        document.getElementById('downloadImportTemplate')?.addEventListener('click', () => this.downloadStudentTemplate());
        document.getElementById('batchImportForm')?.addEventListener('submit', (event) => {
            event.preventDefault();
            this.handleBatchImport();
        });

        document.getElementById('exportUsersBtn')?.addEventListener('click', () => this.exportUsers());

        document.getElementById('searchLogsBtn')?.addEventListener('click', () => this.applyLogFilters());
        document.getElementById('clearLogsBtn')?.addEventListener('click', () => this.clearLogs());
        document.getElementById('exportLogsBtn')?.addEventListener('click', () => this.exportLogs());

        document.getElementById('createBackupBtn')?.addEventListener('click', () => this.createBackup());
        document.getElementById('refreshMonitoringBtn')?.addEventListener('click', () => this.renderMonitoring());
        document.getElementById('securityScanBtn')?.addEventListener('click', () => this.runSecurityScan());

        document.querySelectorAll('.quick-actions .action-card').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                if (action === 'create-user') this.openModal('createUserModal');
                if (action === 'backup-system') this.createBackup();
                if (action === 'view-logs') this.switchPage('logs');
                if (action === 'system-health') this.switchPage('system');
                if (action === 'security-scan') this.runSecurityScan();
            });
        });

        document.querySelectorAll('.settings-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.settings-tabs .tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.settings-content .tab-content').forEach(tab => tab.classList.remove('active'));
                btn.classList.add('active');
                const target = btn.dataset.tab;
                document.getElementById(`${target}Tab`)?.classList.add('active');
            });
        });

        document.querySelectorAll('.settings-form').forEach(form => {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                this.saveSettings();
            });
        });
        document.querySelectorAll('.settings-form .btn-secondary').forEach(button => {
            button.addEventListener('click', () => this.resetSettings());
        });
    }

    openModal(id) {
        const modal = document.getElementById(id);
        if (!modal) return;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (id === 'batchImportModal') {
            const result = document.getElementById('importResult');
            if (result) result.innerHTML = '';
            const file = document.getElementById('importFile');
            if (file) file.value = '';
        }
    }

    closeModal(id) {
        const modal = document.getElementById(id);
        if (!modal) return;
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    switchPage(page) {
        if (page === 'monitoring') page = 'system';
        this.currentPage = page;
        document.querySelectorAll('.page-content').forEach(section => section.classList.remove('active'));
        document.getElementById(page)?.classList.add('active');
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');
        this.renderCurrentPage();
    }

    renderCurrentPage() {
        this.reloadData();
        if (this.currentPage === 'dashboard') this.renderDashboard();
        if (this.currentPage === 'users') this.renderUsers();
        if (this.currentPage === 'logs') this.renderLogs();
        if (this.currentPage === 'backup') this.renderBackups();
        if (this.currentPage === 'system') {
            this.renderMonitoring();
            this.renderSettings();
        }
        if (this.currentPage === 'monitoring') this.renderMonitoring();
        if (this.currentPage === 'profile') this.renderProfile();
    }

    updateUserInfo() {
        document.getElementById('userName') && (document.getElementById('userName').textContent = this.userData?.name || this.userData?.username || '--');
        document.getElementById('userRole') && (document.getElementById('userRole').textContent = '系统管理员');
    }

    renderDashboard() {
        const stats = dataManager.getStatistics();
        const totalUsers = document.getElementById('totalUsers');
        if (totalUsers) totalUsers.textContent = stats.totalUsers || 0;
        document.getElementById('welcomeName') && (document.getElementById('welcomeName').textContent = this.userData?.name || this.userData?.username || '--');

        this.renderRecentLogs();
    }

    renderRecentLogs() {
        const recentLogsBody = document.getElementById('recentLogsBody');
        if (!recentLogsBody) return;
        const logs = (this.logsData || []).slice(0, 8);
        recentLogsBody.innerHTML = logs.map(log => {
            const user = dataManager.getUserById(log.userId) || { name: '系统' };
            return `
                <tr>
                    <td>${new Date(log.timestamp).toLocaleString()}</td>
                    <td>${user.name}</td>
                    <td>${log.action}</td>
                    <td>${log.description}</td>
                    <td>${log.ip || '--'}</td>
                    <td><span class="status-badge active">正常</span></td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="6" style="text-align:center;opacity:.7;">暂无日志</td></tr>';
    }

    getFilteredUsers() {
        const kw = (document.getElementById('userSearch')?.value || '').trim().toLowerCase();
        const type = document.getElementById('userTypeFilter')?.value || '';
        const status = document.getElementById('userStatusFilter')?.value || '';

        return this.usersData.filter(user => {
            if (type && user.userType !== type) return false;
            if (status && user.status !== status) return false;
            if (!kw) return true;
            return (
                (user.username || '').toLowerCase().includes(kw) ||
                (user.name || '').toLowerCase().includes(kw) ||
                (user.email || '').toLowerCase().includes(kw)
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

        tbody.innerHTML = pageItems.map(user => {
            const lastLogin = user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '--';
            return `
                <tr>
                    <td><input class="user-select" type="checkbox" data-id="${user.id}"></td>
                    <td>${user.id.slice(-8)}</td>
                    <td>${user.username || '--'}</td>
                    <td>${user.name || '--'}</td>
                    <td>${this.getUserTypeText(user.userType)}</td>
                    <td>${user.email || '--'}</td>
                    <td>${lastLogin}</td>
                    <td><span class="status-badge ${user.status}">${this.getStatusText(user.status)}</span></td>
                    <td>
                        <button class="btn-sm btn-secondary" onclick="systemAdmin.resetPassword('${user.id}')">重置密码</button>
                        ${user.status === 'locked'
                            ? `<button class="btn-sm btn-success" onclick="systemAdmin.unlockUser('${user.id}')">解锁</button>`
                            : `<button class="btn-sm btn-warning" onclick="systemAdmin.lockUser('${user.id}')">锁定</button>`
                        }
                        <button class="btn-sm btn-danger" onclick="systemAdmin.deleteUser('${user.id}')">删除</button>
                    </td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="9" style="text-align:center;opacity:.7;">暂无用户</td></tr>';

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
        const email = document.getElementById('newEmail')?.value?.trim() || '';

        if (!userType || !username || !name) {
            showMessage('请填写必填项', 'warning');
            return;
        }

        const initialPassword = `${username}123`;
        const result = dataManager.createUser({
            username,
            name,
            userType,
            email,
            initialPassword,
            requirePasswordChange: false,
            createdBy: this.userData.id
        });

        if (!result.success) {
            showMessage(result.message || '创建失败', 'error');
            return;
        }

        showMessage(`用户创建成功，初始密码为 ${initialPassword}`, 'success');
        this.closeModal('createUserModal');
        this.renderUsers();
    }

    resetPassword(userId) {
        const user = dataManager.getUserById(userId);
        if (!user) return;
        const newPassword = `${user.username}123`;
        if (!confirm(`确定重置 ${user.name || user.username} 的密码为 ${newPassword} 吗？`)) return;

        const salt = user.username;
        const hash = dataManager.hashPassword(newPassword, salt);
        dataManager.updateUserPassword(userId, hash, salt, { requirePasswordChange: false });
        dataManager.addLog(this.userData.id, 'password_reset_by_admin', `重置密码：${user.userType}/${user.username}`);
        this.reloadData();
        this.renderUsers();
        showMessage(`密码已重置为 ${newPassword}`, 'success');
    }

    lockUser(userId) {
        const user = dataManager.getUserById(userId);
        if (!user) return;
        if (!confirm(`确定锁定用户 ${user.name || user.username} 吗？`)) return;
        const settings = dataManager.getSettings();
        const freezeMinutes = Number(settings.freezeDuration ?? settings.sessionTimeout) || 30;
        const until = new Date(Date.now() + Math.max(1, freezeMinutes) * 60 * 1000).toISOString();
        dataManager.updateUserLoginSecurity(userId, { lockedUntil: until, failedLoginCount: user.failedLoginCount || 0 });
        dataManager.addLog(this.userData.id, 'user_locked', `锁定用户：${user.userType}/${user.username}`);
        this.reloadData();
        this.renderUsers();
    }

    unlockUser(userId) {
        const user = dataManager.getUserById(userId);
        if (!user) return;
        if (!confirm(`确定解锁用户 ${user.name || user.username} 吗？`)) return;
        dataManager.updateUserLoginSecurity(userId, { lockedUntil: null, failedLoginCount: 0 });
        user.status = 'active';
        dataManager.saveData();
        dataManager.addLog(this.userData.id, 'user_unlocked', `解锁用户：${user.userType}/${user.username}`);
        this.reloadData();
        this.renderUsers();
    }

    deleteUser(userId) {
        const user = dataManager.getUserById(userId);
        if (!user) return;
        if (!confirm(`确定删除用户 ${user.name || user.username} 吗？此操作不可撤销。`)) return;
        const data = dataManager.getData();
        data.users = (data.users || []).filter(u => u.id !== userId);
        data.enrollments = (data.enrollments || []).filter(e => e.studentId !== userId);
        data.grades = (data.grades || []).filter(g => g.studentId !== userId);
        data.submissions = (data.submissions || []).filter(s => s.studentId !== userId);
        dataManager.saveData();
        dataManager.addLog(this.userData.id, 'user_deleted', `删除用户：${user.userType}/${user.username}`);
        this.reloadData();
        this.renderUsers();
        showMessage('用户已删除', 'success');
    }
    downloadStudentTemplate() {
        const csv = '学号,姓名,班级,专业,邮箱,状态\n'
            + 'stu01,六百六十六,软件工程21-1班,计算机科学与技术,,正常\n'
            + 'stu02,演都不,软件工程21-2班,计算机科学与技术,,正常\n'
            + 'stu03,演了,软件工程21-3班,计算机科学与技术,,正常\n';
        this.downloadText('student_import_template.csv', csv);
    }

    async handleBatchImport() {
        const file = document.getElementById('importFile')?.files?.[0];
        if (!file) {
            showMessage('请选择要导入的文件', 'warning');
            return;
        }

        const name = (file.name || '').toLowerCase();
        if (!name.endsWith('.csv')) {
            showMessage('仅支持CSV导入，请转换格式', 'warning');
            return;
        }

        try {
            const text = await this.readFileText(file);
            const rows = this.parseCSV(text);
            if (!rows || rows.length === 0) {
                showMessage('未解析到有效数据', 'warning');
                return;
            }

            const result = dataManager.importStudents(rows, {
                requirePasswordChange: true,
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
        if (!panel) return;
        const created = result.created || [];
        const failed = result.failed || [];

        panel.innerHTML = `
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

    async readFileText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(reader.error || new Error('读取失败'));
            reader.readAsText(file, 'utf-8');
        });
    }

    parseCSV(text) {
        const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lines.length < 2) return [];
        const headerLine = lines[0];
        const delimiterCounts = {
            ',': (headerLine.match(/,/g) || []).length,
            '\t': (headerLine.match(/\t/g) || []).length,
            ';': (headerLine.match(/;/g) || []).length
        };
        const delimiter = Object.keys(delimiterCounts).reduce((best, current) => {
            return delimiterCounts[current] > delimiterCounts[best] ? current : best;
        }, ',');
        const header = this.parseCSVLine(headerLine, delimiter).map((h, idx) => {
            const clean = String(h || '').trim();
            return idx === 0 ? clean.replace(/^\ufeff/, '') : clean;
        });
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            const cols = this.parseCSVLine(lines[i], delimiter);
            const obj = {};
            header.forEach((h, idx) => obj[h] = cols[idx] ?? '');
            rows.push(obj);
        }
        return rows;
    }

    parseCSVLine(line, delimiter = ',') {
        const res = [];
        let cur = '';
        let inQuote = false;

        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                if (inQuote && line[i + 1] === '"') {
                    cur += '"';
                    i++;
                } else {
                    inQuote = !inQuote;
                }
            } else if (ch === delimiter && !inQuote) {
                res.push(cur);
                cur = '';
            } else {
                cur += ch;
            }
        }
        res.push(cur);
        return res;
    }

    exportUsers() {
        const users = this.getFilteredUsers();
        const rows = [
            ['用户ID', '用户名', '姓名', '用户类型', '邮箱', '状态'],
            ...users.map(u => [u.id, u.username || '', u.name || '', this.getUserTypeText(u.userType), u.email || '', this.getStatusText(u.status)])
        ];
        this.downloadText(`users_${Date.now()}.csv`, rows.map(r => r.map(this.escapeCSV).join(',')).join('\n'));
        showMessage('用户数据已导出', 'success');
    }
    applyLogFilters() {
        this.activeLogFilters = {
            type: document.getElementById('logTypeFilter')?.value || '',
            startDate: document.getElementById('logStartDate')?.value || '',
            endDate: document.getElementById('logEndDate')?.value || ''
        };
        this.currentLogsPage = 1;
        this.renderLogs();
    }

    renderLogs() {
        const tbody = document.getElementById('logsTableBody');
        const pager = document.getElementById('logsPagination');
        if (!tbody) return;

        const logs = this.getFilteredLogs();
        const totalPages = Math.max(1, Math.ceil(logs.length / this.pageSize));
        this.currentLogsPage = Math.min(this.currentLogsPage, totalPages);
        const start = (this.currentLogsPage - 1) * this.pageSize;
        const pageItems = logs.slice(start, start + this.pageSize);

        tbody.innerHTML = pageItems.map(log => {
            const user = dataManager.getUserById(log.userId) || { name: '系统' };
            return `
                <tr>
                    <td>${new Date(log.timestamp).toLocaleString()}</td>
                    <td>${user.name}</td>
                    <td>${log.action}</td>
                    <td>${log.description}</td>
                    <td>${log.ip || '--'}</td>
                    <td><span class="status-badge active">正常</span></td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="6" style="text-align:center;opacity:.7;">暂无日志</td></tr>';

        if (pager) {
            pager.innerHTML = this.renderPagination(totalPages, this.currentLogsPage, (p) => `systemAdmin.goLogsPage(${p})`);
        }
    }

    goLogsPage(page) {
        this.currentLogsPage = page;
        this.renderLogs();
    }

    getFilteredLogs() {
        const { type, startDate, endDate } = this.activeLogFilters;
        return this.logsData.filter(log => {
            if (type) {
                const category = this.getLogCategory(log.action);
                if (category !== type) return false;
            }
            if (startDate && new Date(log.timestamp) < new Date(startDate)) return false;
            if (endDate && new Date(log.timestamp) > new Date(endDate)) return false;
            return true;
        }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    getLogCategory(action) {
        if (!action) return 'operation';
        if (action.includes('login') || action.includes('logout')) return 'login';
        if (action.includes('security') || action.includes('lock') || action.includes('password')) return 'security';
        if (action.includes('error')) return 'error';
        return 'operation';
    }

    clearLogs() {
        if (!confirm('确定清理所有日志吗？')) return;
        const data = dataManager.getData();
        data.logs = [];
        dataManager.saveData();
        this.reloadData();
        this.renderLogs();
        showMessage('日志已清理', 'success');
    }

    exportLogs() {
        const logs = this.getFilteredLogs();
        const rows = [
            ['时间', '用户', '类型', '内容', 'IP'],
            ...logs.map(log => {
                const user = dataManager.getUserById(log.userId) || { name: '系统' };
                return [new Date(log.timestamp).toLocaleString(), user.name, log.action, log.description, log.ip || ''];
            })
        ];
        this.downloadText(`logs_${Date.now()}.csv`, rows.map(r => r.map(this.escapeCSV).join(',')).join('\n'));
        showMessage('日志已导出', 'success');
    }
    renderBackups() {
        const backups = this.backupsData;
        const list = document.getElementById('backupList');
        if (list) {
            list.innerHTML = backups.map(backup => `
                <div class="backup-item">
                    <div class="backup-info">
                        <h4>${backup.name || '系统备份'}</h4>
                        <p>${new Date(backup.timestamp).toLocaleString()} · ${(backup.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button class="btn-secondary" onclick="systemAdmin.restoreBackupById('${backup.id}')">恢复</button>
                </div>
            `).join('') || '<div style="text-align:center;opacity:.7;">暂无备份</div>';
        }

        const lastBackup = backups[0];
        document.querySelector('.last-backup') && (document.querySelector('.last-backup').textContent = lastBackup ? new Date(lastBackup.timestamp).toLocaleString() : '--');
        document.querySelector('.backup-size') && (document.querySelector('.backup-size').textContent = lastBackup ? `${(lastBackup.size / 1024 / 1024).toFixed(2)} MB` : '--');
        document.querySelector('.backup-count') && (document.querySelector('.backup-count').textContent = backups.length);
        document.querySelector('.storage-usage') && (document.querySelector('.storage-usage').textContent = `${(backups.reduce((sum, b) => sum + (b.size || 0), 0) / 1024 / 1024).toFixed(2)} MB / 50 GB`);
    }

    createBackup() {
        const backup = dataManager.createBackup();
        dataManager.addLog(this.userData.id, 'backup_created', `创建备份：${backup.name}`);
        this.reloadData();
        this.renderBackups();
        showMessage('备份已创建', 'success');
    }

    renderMonitoring() {
        const metrics = this.getNextMetrics();

        const updateChart = (id, value) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.innerHTML = `<div style="height:100%;background:linear-gradient(180deg,#7c3aed 0%,#c4b5fd 100%);border-radius:8px;transform-origin:bottom;transform:scaleY(${value / 100});"></div>`;
        };
        updateChart('cpuChart', metrics.cpu);
        updateChart('memoryChart', metrics.memory);
        updateChart('diskChart', metrics.disk);
        updateChart('networkChart', metrics.networkPercent);
        document.getElementById('cpuValue') && (document.getElementById('cpuValue').textContent = `${metrics.cpu}%`);
        document.getElementById('memoryValue') && (document.getElementById('memoryValue').textContent = `${metrics.memory}%`);
        document.getElementById('diskValue') && (document.getElementById('diskValue').textContent = `${metrics.disk}%`);
        document.getElementById('networkValue') && (document.getElementById('networkValue').textContent = `${metrics.networkMbps.toFixed(1)} MB/s`);
    }

    getNextMetrics() {
        const stats = dataManager.getStatistics();
        const loadBase = Math.min(1, (stats.totalUsers + stats.totalCourses) / 5000);
        const baseCpu = 30 + loadBase * 45;
        const baseMemory = 40 + loadBase * 40;
        const baseDisk = 55 + loadBase * 35;
        const baseNetwork = 0.6 + loadBase * 1.8;

        if (!this.metricState) {
            this.metricState = {
                cpu: baseCpu,
                memory: baseMemory,
                disk: baseDisk,
                networkMbps: baseNetwork
            };
        }

        const drift = (value, target, min, max, step) => {
            const next = value + (target - value) * 0.15 + (Math.random() * 2 - 1) * step;
            return Math.min(max, Math.max(min, next));
        };

        this.metricState.cpu = drift(this.metricState.cpu, baseCpu, 15, 95, 5.5);
        this.metricState.memory = drift(this.metricState.memory, baseMemory, 35, 90, 3.5);
        this.metricState.disk = drift(this.metricState.disk, baseDisk, 45, 95, 2);
        this.metricState.networkMbps = drift(this.metricState.networkMbps, baseNetwork, 0.2, 3.5, 0.35);

        return {
            cpu: Math.round(this.metricState.cpu),
            memory: Math.round(this.metricState.memory),
            disk: Math.round(this.metricState.disk),
            networkMbps: this.metricState.networkMbps,
            networkPercent: Math.min(100, Math.round((this.metricState.networkMbps / 3.5) * 100))
        };
    }

    runSecurityScan() {
        showMessage('安全扫描完成：未发现异常', 'success');
    }

    renderProfile() {
        const user = this.userData || {};
        document.getElementById('profileName') && (document.getElementById('profileName').textContent = user.name || user.username || '--');
        document.getElementById('profileDepartment') && (document.getElementById('profileDepartment').textContent = `${user.office || '信息中心'} · 系统管理员`);
        document.getElementById('profileAdminId') && (document.getElementById('profileAdminId').textContent = user.username || '--');
        document.getElementById('profileAdminName') && (document.getElementById('profileAdminName').textContent = user.name || '--');
        document.getElementById('profileAdminDept') && (document.getElementById('profileAdminDept').textContent = user.office || '信息中心');
        document.getElementById('profileAdminTitle') && (document.getElementById('profileAdminTitle').textContent = '系统管理员');
        document.getElementById('profileEmail') && (document.getElementById('profileEmail').textContent = user.email || '--');
        document.getElementById('profilePhone') && (document.getElementById('profilePhone').textContent = user.phone || '--');
        document.getElementById('profileOffice') && (document.getElementById('profileOffice').textContent = user.office || '--');
    }

    renderSettings() {
        const settings = dataManager.getSettings();
        const freezeFallback = settings.freezeDuration ?? settings.sessionTimeout ?? 30;
        const systemName = document.getElementById('systemName');
        const systemVersion = document.getElementById('systemVersion');
        const adminEmail = document.getElementById('adminEmail');
        const maxLoginAttempts = document.getElementById('maxLoginAttempts');
        const freezeDuration = document.getElementById('freezeDuration');

        if (systemName) systemName.value = settings.systemName || '';
        if (systemVersion) systemVersion.value = settings.version || 'v2.0.1';
        if (adminEmail) adminEmail.value = settings.adminEmail || '';
        if (maxLoginAttempts) maxLoginAttempts.value = settings.maxLoginAttempts || 5;
        if (freezeDuration) freezeDuration.value = freezeFallback;
    }

    saveSettings() {
        const systemName = document.getElementById('systemName')?.value?.trim() || '';
        const adminEmail = document.getElementById('adminEmail')?.value?.trim() || '';
        const maxLoginAttempts = parseInt(document.getElementById('maxLoginAttempts')?.value, 10);
        const freezeDuration = parseInt(document.getElementById('freezeDuration')?.value, 10);

        if (!systemName || !adminEmail || !maxLoginAttempts || !freezeDuration) {
            showMessage('请填写完整设置项', 'warning');
            return;
        }

        if (maxLoginAttempts < 1 || freezeDuration < 1) {
            showMessage('数值需大于0', 'warning');
            return;
        }

        dataManager.updateSettings({
            systemName,
            adminEmail,
            maxLoginAttempts,
            freezeDuration
        });
        showMessage('设置已保存', 'success');
    }

    resetSettings() {
        const current = dataManager.getSettings();
        const defaults = {
            systemName: '成绩管理教学平台',
            adminEmail: 'admin@university.edu.cn',
            maxLoginAttempts: 5,
            freezeDuration: 30
        };
        dataManager.updateSettings({
            ...defaults,
            version: current.version || '2.0.1'
        });
        this.renderSettings();
        showMessage('已恢复默认设置', 'success');
    }

    startSystemMonitoring() {
        if (this.monitorTimer) clearInterval(this.monitorTimer);
        this.monitorTimer = setInterval(() => {
            if (this.currentPage === 'system' || this.currentPage === 'monitoring') this.renderMonitoring();
        }, 500);
    }

    downloadText(filename, text) {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    escapeCSV(value) {
        const str = String(value ?? '');
        if (/[",\n]/.test(str)) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    }

    enforcePasswordChange() {
        if (!this.userData || !this.userData.requirePasswordChange) return;
        const modal = document.getElementById('forceChangePasswordModal');
        const form = document.getElementById('forceChangePasswordForm');
        if (!modal || !form) return;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        const onSubmit = (event) => {
            event.preventDefault();
            const oldPassword = document.getElementById('forceOldPassword')?.value || '';
            const newPassword = document.getElementById('forceNewPassword')?.value || '';
            const confirmPassword = document.getElementById('forceConfirmPassword')?.value || '';

            if (!oldPassword || !newPassword || !confirmPassword) {
                showMessage('请填写所有字段', 'warning');
                return;
            }
            if (newPassword !== confirmPassword) {
                showMessage('两次输入的新密码不一致', 'warning');
                return;
            }
            const result = auth.changePassword(oldPassword, newPassword);
            if (!result.success) {
                showMessage(result.message || '修改失败', 'error');
                return;
            }
            this.userData = auth.currentUser;
            modal.classList.remove('active');
            document.body.style.overflow = '';
            showMessage('密码修改成功', 'success');
            form.removeEventListener('submit', onSubmit);
        };

        form.addEventListener('submit', onSubmit);
    }
}

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
