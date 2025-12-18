// 系统管理员仪表盘功能模块
class SystemAdminDashboard {
    constructor() {
        this.currentPage = 'dashboard';
        this.userData = null;
        this.usersData = [];
        this.logsData = [];
        this.backupsData = [];
        this.init();
    }

    // 初始化
    init() {
        // 检查用户登录状态
        if (!auth.checkSession() || auth.currentUser?.userType !== 'systemAdmin') {
            window.location.href = 'index.html';
            return;
        }

        this.userData = auth.currentUser;
        this.loadSystemData();
        this.setupEventListeners();
        this.renderCurrentPage();
        this.updateUserInfo();
        this.startSystemMonitoring();
    }

    // 加载系统数据
    loadSystemData() {
        this.usersData = dataManager.getData('users');
        this.logsData = dataManager.getLogs();
        this.backupsData = dataManager.getBackups();
        this.settings = dataManager.getSettings();
    }

    // 设置事件监听器
    setupEventListeners() {
        // 侧边栏导航
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.switchPage(page);
            });
        });

        // 登出按钮
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                auth.logout();
            });
        }

        // 搜索功能
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.performSearch();
            });
        }

        // 批量操作按钮
        this.setupBatchActions();
        
        // 操作按钮
        this.setupActionButtons();
        
        // 模态框设置
        this.setupModalListeners();
        
        // 实时监控刷新
        this.setupMonitoringRefresh();
    }

    // 设置批量操作
    setupBatchActions() {
        const batchDeleteBtn = document.getElementById('batchDeleteBtn');
        if (batchDeleteBtn) {
            batchDeleteBtn.addEventListener('click', () => {
                this.batchDeleteUsers();
            });
        }

        const batchExportBtn = document.getElementById('batchExportBtn');
        if (batchExportBtn) {
            batchExportBtn.addEventListener('click', () => {
                this.batchExportData();
            });
        }
    }

    // 设置操作按钮
    setupActionButtons() {
        const actionButtons = [
            { id: 'addUserBtn', action: 'showAddUserModal' },
            { id: 'createBackupBtn', action: 'createBackup' },
            { id: 'restoreBackupBtn', action: 'showRestoreBackupModal' },
            { id: 'clearLogsBtn', action: 'clearLogs' },
            { id: 'exportLogsBtn', action: 'exportLogs' },
            { id: 'updateSettingsBtn', action: 'updateSystemSettings' },
            { id: 'runDiagnosticsBtn', action: 'runSystemDiagnostics' },
            { id: 'securityScanBtn', action: 'runSecurityScan' },
            { id: 'performanceTestBtn', action: 'runPerformanceTest' }
        ];

        actionButtons.forEach(({ id, action }) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => {
                    this[action]();
                });
            }
        });
    }

    // 设置模态框监听器
    setupModalListeners() {
        document.querySelectorAll('[id$="Modal"]').forEach(modal => {
            const closeBtn = modal.querySelector('.close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    modal.style.display = 'none';
                });
            }

            window.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }

    // 设置监控刷新
    setupMonitoringRefresh() {
        // 每30秒刷新一次监控数据
        setInterval(() => {
            if (this.currentPage === 'monitoring') {
                this.updateMonitoringData();
            }
        }, 30000);
    }

    // 开始系统监控
    startSystemMonitoring() {
        // 初始化系统状态监控
        this.updateSystemStatus();
        
        // 定期更新系统状态
        setInterval(() => {
            this.updateSystemStatus();
        }, 60000); // 每分钟更新一次
    }

    // 更新系统状态
    updateSystemStatus() {
        const statusCards = {
            systemHealth: this.calculateSystemHealth(),
            databaseStatus: this.checkDatabaseStatus(),
            serverUptime: this.getServerUptime(),
            activeConnections: this.getActiveConnections(),
            memoryUsage: this.getMemoryUsage(),
            cpuUsage: this.getCPUUsage()
        };

        Object.entries(statusCards).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) {
                element.textContent = value;
            }
        });
    }

    // 计算系统健康状态
    calculateSystemHealth() {
        const health = Math.floor(Math.random() * 20) + 80; // 80-99%
        return health + '%';
    }

    // 检查数据库状态
    checkDatabaseStatus() {
        return '正常';
    }

    // 获取服务器运行时间
    getServerUptime() {
        const uptime = Math.floor(Math.random() * 30) + 1; // 1-30天
        return `${uptime}天`;
    }

    // 获取活跃连接数
    getActiveConnections() {
        return Math.floor(Math.random() * 100) + 50; // 50-150
    }

    // 获取内存使用率
    getMemoryUsage() {
        const usage = Math.floor(Math.random() * 30) + 40; // 40-70%
        return usage + '%';
    }

    // 获取CPU使用率
    getCPUUsage() {
        const usage = Math.floor(Math.random() * 40) + 20; // 20-60%
        return usage + '%';
    }

    // 更新用户信息显示
    updateUserInfo() {
        const userNameElements = [
            document.getElementById('currentUserName'),
            document.getElementById('welcomeName')
        ];
        
        userNameElements.forEach(element => {
            if (element) {
                element.textContent = this.userData.name;
            }
        });
    }

    // 切换页面
    switchPage(page) {
        // 更新导航状态
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');

        // 更新页面内容
        document.querySelectorAll('.page-content').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(page).classList.add('active');

        this.currentPage = page;
        this.renderCurrentPage();
    }

    // 渲染当前页面
    renderCurrentPage() {
        switch (this.currentPage) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'users':
                this.renderUsers();
                break;
            case 'permissions':
                this.renderPermissions();
                break;
            case 'logs':
                this.renderLogs();
                break;
            case 'backup':
                this.renderBackup();
                break;
            case 'system':
                this.renderSystem();
                break;
            case 'monitoring':
                this.renderMonitoring();
                break;
            case 'security':
                this.renderSecurity();
                break;
            case 'profile':
                this.renderProfile();
                break;
        }
    }

    // 渲染仪表盘
    renderDashboard() {
        this.updateSystemStatus();
        this.renderRecentActivity();
        this.renderSystemAlerts();
        this.renderQuickStats();
    }

    // 渲染最近活动
    renderRecentActivity() {
        const activityList = document.querySelector('.activity-list');
        if (!activityList) return;

        const recentLogs = this.logsData.slice(0, 5);

        activityList.innerHTML = recentLogs.map(log => {
            const user = dataManager.getUserById(log.userId);
            return `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-${this.getActivityIcon(log.action)}"></i>
                    </div>
                    <div class="activity-content">
                        <h4>${this.getActionDescription(log.action)}</h4>
                        <p>${user ? user.name : '系统'} - ${log.description}</p>
                        <span class="activity-time">${new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 获取活动图标
    getActivityIcon(action) {
        const iconMap = {
            'login': 'sign-in-alt',
            'logout': 'sign-out-alt',
            'user_created': 'user-plus',
            'user_updated': 'user-edit',
            'user_deleted': 'user-times',
            'password_change': 'key',
            'data_export': 'download',
            'data_import': 'upload',
            'backup_created': 'database',
            'settings_updated': 'cogs'
        };
        return iconMap[action] || 'circle';
    }

    // 获取操作描述
    getActionDescription(action) {
        const descMap = {
            'login': '用户登录',
            'logout': '用户登出',
            'user_created': '创建用户',
            'user_updated': '更新用户',
            'user_deleted': '删除用户',
            'password_change': '修改密码',
            'data_export': '数据导出',
            'data_import': '数据导入',
            'backup_created': '创建备份',
            'settings_updated': '更新设置'
        };
        return descMap[action] || '其他操作';
    }

    // 渲染系统警告
    renderSystemAlerts() {
        const alertsContainer = document.querySelector('.system-alerts');
        if (!alertsContainer) return;

        const alerts = [
            { type: 'warning', message: '磁盘空间使用率超过80%', time: '10分钟前' },
            { type: 'info', message: '系统备份已完成', time: '2小时前' },
            { type: 'error', message: '检测到异常登录尝试', time: '5小时前' }
        ];

        alertsContainer.innerHTML = alerts.map(alert => `
            <div class="alert-item ${alert.type}">
                <i class="fas fa-${this.getAlertIcon(alert.type)}"></i>
                <div class="alert-content">
                    <p>${alert.message}</p>
                    <span class="alert-time">${alert.time}</span>
                </div>
            </div>
        `).join('');
    }

    // 获取警告图标
    getAlertIcon(type) {
        const iconMap = {
            'warning': 'exclamation-triangle',
            'info': 'info-circle',
            'error': 'times-circle',
            'success': 'check-circle'
        };
        return iconMap[type] || 'info-circle';
    }

    // 渲染快速统计
    renderQuickStats() {
        const statsContainer = document.querySelector('.quick-stats');
        if (!statsContainer) return;

        const stats = dataManager.getStatistics();
        
        statsContainer.innerHTML = `
            <div class="stat-card">
                <h4>总用户数</h4>
                <span class="stat-value">${stats.totalUsers}</span>
            </div>
            <div class="stat-card">
                <h4>活跃用户</h4>
                <span class="stat-value">${stats.activeUsers}</span>
            </div>
            <div class="stat-card">
                <h4>今日登录</h4>
                <span class="stat-value">${this.getTodayLogins()}</span>
            </div>
            <div class="stat-card">
                <h4>系统状态</h4>
                <span class="stat-value status-good">正常</span>
            </div>
        `;
    }

    // 获取今日登录数
    getTodayLogins() {
        const today = new Date().toDateString();
        const todayLogs = this.logsData.filter(log => 
            log.action === 'login' && 
            new Date(log.timestamp).toDateString() === today
        );
        return todayLogs.length;
    }

    // 渲染用户管理
    renderUsers() {
        const usersList = document.getElementById('usersList');
        if (!usersList) return;

        usersList.innerHTML = this.usersData.map(user => `
            <div class="user-card">
                <div class="user-header">
                    <h4>${user.name}</h4>
                    <span class="user-type ${user.userType}">${this.getUserTypeText(user.userType)}</span>
                    <span class="user-status ${user.status}">${this.getStatusText(user.status)}</span>
                </div>
                <div class="user-info">
                    <p><i class="fas fa-id-card"></i> 用户名: ${user.username}</p>
                    <p><i class="fas fa-envelope"></i> 邮箱: ${user.email}</p>
                    <p><i class="fas fa-phone"></i> 电话: ${user.phone}</p>
                    ${user.major ? `<p><i class="fas fa-graduation-cap"></i> 专业: ${user.major}</p>` : ''}
                    ${user.title ? `<p><i class="fas fa-briefcase"></i> 职称: ${user.title}</p>` : ''}
                    <p><i class="fas fa-clock"></i> 创建时间: ${new Date().toLocaleDateString()}</p>
                </div>
                <div class="user-actions">
                    <button class="btn-primary" onclick="systemAdmin.editUser('${user.id}')">编辑</button>
                    <button class="btn-secondary" onclick="systemAdmin.resetPassword('${user.id}')">重置密码</button>
                    <button class="btn-info" onclick="systemAdmin.viewUserLogs('${user.id}')">查看日志</button>
                    ${user.status === 'active' ? 
                        `<button class="btn-warning" onclick="systemAdmin.lockUser('${user.id}')">锁定</button>` :
                        `<button class="btn-success" onclick="systemAdmin.unlockUser('${user.id}')">解锁</button>`
                    }
                    <button class="btn-danger" onclick="systemAdmin.deleteUser('${user.id}')">删除</button>
                </div>
            </div>
        `).join('');
    }

    // 获取用户类型文本
    getUserTypeText(type) {
        const typeMap = {
            'student': '学生',
            'teacher': '教师',
            'academicAdmin': '教务管理员',
            'systemAdmin': '系统管理员'
        };
        return typeMap[type] || type;
    }

    // 获取状态文本
    getStatusText(status) {
        const statusMap = {
            'active': '正常',
            'inactive': '未激活',
            'locked': '已锁定'
        };
        return statusMap[status] || status;
    }

    // 渲染权限管理
    renderPermissions() {
        const permissionsList = document.getElementById('permissionsList');
        if (!permissionsList) return;

        const userTypes = ['student', 'teacher', 'academicAdmin', 'systemAdmin'];
        
        permissionsList.innerHTML = userTypes.map(userType => {
            const permissions = auth.getUserPermissions(userType);
            
            return `
                <div class="permission-card">
                    <div class="permission-header">
                        <h4>${this.getUserTypeText(userType)}权限</h4>
                        <button class="btn-sm btn-primary" onclick="systemAdmin.editPermissions('${userType}')">编辑权限</button>
                    </div>
                    <div class="permission-list">
                        ${permissions.map(permission => `
                            <div class="permission-item">
                                <span class="permission-name">${this.getPermissionName(permission)}</span>
                                <span class="permission-desc">${this.getPermissionDescription(permission)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    // 获取权限名称
    getPermissionName(permission) {
        const nameMap = {
            'view_courses': '查看课程',
            'enroll_courses': '选修课程',
            'view_grades': '查看成绩',
            'view_materials': '查看课件',
            'manage_courses': '管理课程',
            'view_students': '查看学生',
            'manage_assignments': '管理作业',
            'manage_grades': '管理成绩',
            'upload_materials': '上传课件',
            'manage_programs': '管理培养方案',
            'manage_classes': '管理班级',
            'manage_schedules': '管理课表',
            'audit_grades': '审核成绩',
            'export_reports': '导出报表',
            'manage_users': '管理用户',
            'manage_permissions': '管理权限',
            'view_logs': '查看日志',
            'backup_data': '数据备份',
            'system_settings': '系统设置',
            'search_courses': '搜索课程'
        };
        return nameMap[permission] || permission;
    }

    // 获取权限描述
    getPermissionDescription(permission) {
        const descMap = {
            'view_courses': '可以浏览系统中的课程信息',
            'enroll_courses': '可以选修课程',
            'view_grades': '可以查看课程成绩',
            'view_materials': '可以查看课程课件',
            'manage_courses': '可以创建和管理课程',
            'view_students': '可以查看学生信息',
            'manage_assignments': '可以创建和管理作业',
            'manage_grades': '可以录入和管理成绩',
            'upload_materials': '可以上传课程课件',
            'manage_programs': '可以管理专业培养方案',
            'manage_classes': '可以管理班级信息',
            'manage_schedules': '可以管理课表安排',
            'audit_grades': '可以审核成绩',
            'export_reports': '可以导出各类报表',
            'manage_users': '可以创建和管理用户账户',
            'manage_permissions': '可以管理用户权限',
            'view_logs': '可以查看系统操作日志',
            'backup_data': '可以备份和恢复数据',
            'system_settings': '可以修改系统设置',
            'search_courses': '可以搜索课程'
        };
        return descMap[permission] || '暂无描述';
    }

    // 渲染操作日志
    renderLogs() {
        const logsList = document.getElementById('logsList');
        if (!logsList) return;

        // 添加筛选功能
        this.setupLogFilters();

        logsList.innerHTML = this.logsData.slice(0, 50).map(log => {
            const user = dataManager.getUserById(log.userId);
            
            return `
                <div class="log-item">
                    <div class="log-header">
                        <span class="log-action">${this.getActionDescription(log.action)}</span>
                        <span class="log-time">${new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <div class="log-details">
                        <p><strong>用户:</strong> ${user ? user.name : '系统'}</p>
                        <p><strong>描述:</strong> ${log.description}</p>
                        <p><strong>IP:</strong> ${log.ip}</p>
                        <p><strong>浏览器:</strong> ${this.getBrowserInfo(log.userAgent)}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 设置日志筛选
    setupLogFilters() {
        const actionFilter = document.getElementById('actionFilter');
        const dateFilter = document.getElementById('dateFilter');
        const userFilter = document.getElementById('userFilter');

        if (actionFilter) {
            actionFilter.addEventListener('change', () => {
                this.filterLogs();
            });
        }

        if (dateFilter) {
            dateFilter.addEventListener('change', () => {
                this.filterLogs();
            });
        }

        if (userFilter) {
            userFilter.addEventListener('input', () => {
                this.filterLogs();
            });
        }
    }

    // 筛选日志
    filterLogs() {
        const actionFilter = document.getElementById('actionFilter')?.value;
        const dateFilter = document.getElementById('dateFilter')?.value;
        const userFilter = document.getElementById('userFilter')?.value.toLowerCase();

        let filteredLogs = [...this.logsData];

        if (actionFilter) {
            filteredLogs = filteredLogs.filter(log => log.action === actionFilter);
        }

        if (dateFilter) {
            const filterDate = new Date(dateFilter);
            filteredLogs = filteredLogs.filter(log => {
                const logDate = new Date(log.timestamp);
                return logDate.toDateString() === filterDate.toDateString();
            });
        }

        if (userFilter) {
            filteredLogs = filteredLogs.filter(log => {
                const user = dataManager.getUserById(log.userId);
                return user && user.name.toLowerCase().includes(userFilter);
            });
        }

        this.renderFilteredLogs(filteredLogs);
    }

    // 渲染筛选后的日志
    renderFilteredLogs(logs) {
        const logsList = document.getElementById('logsList');
        if (!logsList) return;

        logsList.innerHTML = logs.slice(0, 50).map(log => {
            const user = dataManager.getUserById(log.userId);
            
            return `
                <div class="log-item">
                    <div class="log-header">
                        <span class="log-action">${this.getActionDescription(log.action)}</span>
                        <span class="log-time">${new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <div class="log-details">
                        <p><strong>用户:</strong> ${user ? user.name : '系统'}</p>
                        <p><strong>描述:</strong> ${log.description}</p>
                        <p><strong>IP:</strong> ${log.ip}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 获取浏览器信息
    getBrowserInfo(userAgent) {
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        return '其他浏览器';
    }

    // 渲染数据备份
    renderBackup() {
        this.renderBackupList();
        this.renderBackupStats();
    }

    // 渲染备份列表
    renderBackupList() {
        const backupList = document.getElementById('backupList');
        if (!backupList) return;

        backupList.innerHTML = this.backupsData.map(backup => `
            <div class="backup-item">
                <div class="backup-info">
                    <h4>备份 #${backup.id.slice(-6)}</h4>
                    <p><i class="fas fa-calendar"></i> 时间: ${new Date(backup.timestamp).toLocaleString()}</p>
                    <p><i class="fas fa-database"></i> 大小: ${this.formatFileSize(backup.size)}</p>
                    <p><i class="fas fa-cog"></i> 状态: 已完成</p>
                </div>
                <div class="backup-actions">
                    <button class="btn-primary" onclick="systemAdmin.restoreFromBackup('${backup.id}')">恢复</button>
                    <button class="btn-secondary" onclick="systemAdmin.downloadBackup('${backup.id}')">下载</button>
                    <button class="btn-danger" onclick="systemAdmin.deleteBackup('${backup.id}')">删除</button>
                </div>
            </div>
        `).join('');
    }

    // 渲染备份统计
    renderBackupStats() {
        const backupStats = document.getElementById('backupStats');
        if (!backupStats) return;

        const totalSize = this.backupsData.reduce((sum, backup) => sum + backup.size, 0);
        
        backupStats.innerHTML = `
            <div class="stat-card">
                <h4>备份数量</h4>
                <span class="stat-value">${this.backupsData.length}</span>
            </div>
            <div class="stat-card">
                <h4>总大小</h4>
                <span class="stat-value">${this.formatFileSize(totalSize)}</span>
            </div>
            <div class="stat-card">
                <h4>最近备份</h4>
                <span class="stat-value">${this.backupsData.length > 0 ? 
                    new Date(this.backupsData[0].timestamp).toLocaleDateString() : '无'}</span>
            </div>
            <div class="stat-card">
                <h4>自动备份</h4>
                <span class="stat-value">已启用</span>
            </div>
        `;
    }

    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 渲染系统设置
    renderSystem() {
        this.renderSystemSettings();
    }

    // 渲染系统设置
    renderSystemSettings() {
        const settingsForm = document.getElementById('systemSettingsForm');
        if (!settingsForm) return;

        settingsForm.innerHTML = `
            <div class="settings-section">
                <h4>基本设置</h4>
                <div class="form-group">
                    <label>系统名称</label>
                    <input type="text" id="systemName" value="${this.settings.systemName || '成绩管理教学平台'}">
                </div>
                <div class="form-group">
                    <label>版本号</label>
                    <input type="text" id="systemVersion" value="${this.settings.version || '2.0.1'}" readonly>
                </div>
                <div class="form-group">
                    <label>管理员邮箱</label>
                    <input type="email" id="adminEmail" value="${this.settings.adminEmail || ''}">
                </div>
            </div>

            <div class="settings-section">
                <h4>安全设置</h4>
                <div class="form-group">
                    <label>最大登录尝试次数</label>
                    <input type="number" id="maxLoginAttempts" value="${this.settings.maxLoginAttempts || 5}">
                </div>
                <div class="form-group">
                    <label>会话超时时间(分钟)</label>
                    <input type="number" id="sessionTimeout" value="${(this.settings.sessionTimeout || 120) / 60}">
                </div>
            </div>

            <div class="settings-section">
                <h4>密码策略</h4>
                <div class="form-group">
                    <label>最小长度</label>
                    <input type="number" id="passwordMinLength" value="${this.settings.passwordPolicy?.minLength || 6}">
                </div>
                <div class="form-group">
                    <label>要求大写字母</label>
                    <input type="checkbox" id="passwordRequireUppercase" ${this.settings.passwordPolicy?.requireUppercase ? 'checked' : ''}>
                </div>
                <div class="form-group">
                    <label>要求数字</label>
                    <input type="checkbox" id="passwordRequireNumbers" ${this.settings.passwordPolicy?.requireNumbers ? 'checked' : ''}>
                </div>
                <div class="form-group">
                    <label>要求特殊字符</label>
                    <input type="checkbox" id="passwordRequireSpecialChars" ${this.settings.passwordPolicy?.requireSpecialChars ? 'checked' : ''}>
                </div>
            </div>

            <div class="settings-actions">
                <button type="button" class="btn-primary" onclick="systemAdmin.saveSystemSettings()">保存设置</button>
                <button type="button" class="btn-secondary" onclick="systemAdmin.resetSettings()">重置默认</button>
            </div>
        `;
    }

    // 渲染系统监控
    renderMonitoring() {
        this.updateMonitoringData();
    }

    // 更新监控数据
    updateMonitoringData() {
        this.updateSystemStatus();
        
        // 更新性能图表
        this.updatePerformanceCharts();
        
        // 更新实时监控
        this.updateRealTimeMonitoring();
    }

    // 更新性能图表
    updatePerformanceCharts() {
        const performanceContainer = document.getElementById('performanceCharts');
        if (!performanceContainer) return;

        // 模拟性能数据
        const performanceData = {
            cpu: Array.from({length: 24}, () => Math.floor(Math.random() * 40) + 20),
            memory: Array.from({length: 24}, () => Math.floor(Math.random() * 30) + 40),
            disk: Array.from({length: 24}, () => Math.floor(Math.random() * 20) + 60)
        };

        performanceContainer.innerHTML = `
            <div class="chart-container">
                <h4>CPU使用率 (24小时)</h4>
                <div class="chart-placeholder">
                    <p>平均: ${(performanceData.cpu.reduce((a, b) => a + b) / performanceData.cpu.length).toFixed(1)}%</p>
                    <p>峰值: ${Math.max(...performanceData.cpu)}%</p>
                </div>
            </div>
            <div class="chart-container">
                <h4>内存使用率 (24小时)</h4>
                <div class="chart-placeholder">
                    <p>平均: ${(performanceData.memory.reduce((a, b) => a + b) / performanceData.memory.length).toFixed(1)}%</p>
                    <p>峰值: ${Math.max(...performanceData.memory)}%</p>
                </div>
            </div>
            <div class="chart-container">
                <h4>磁盘使用率 (24小时)</h4>
                <div class="chart-placeholder">
                    <p>平均: ${(performanceData.disk.reduce((a, b) => a + b) / performanceData.disk.length).toFixed(1)}%</p>
                    <p>峰值: ${Math.max(...performanceData.disk)}%</p>
                </div>
            </div>
        `;
    }

    // 更新实时监控
    updateRealTimeMonitoring() {
        const realTimeContainer = document.getElementById('realTimeMonitoring');
        if (!realTimeContainer) return;

        realTimeContainer.innerHTML = `
            <div class="monitoring-grid">
                <div class="monitor-item">
                    <h4>实时连接数</h4>
                    <span class="monitor-value">${this.getActiveConnections()}</span>
                </div>
                <div class="monitor-item">
                    <h4>请求/秒</h4>
                    <span class="monitor-value">${Math.floor(Math.random() * 100) + 50}</span>
                </div>
                <div class="monitor-item">
                    <h4>响应时间</h4>
                    <span class="monitor-value">${Math.floor(Math.random() * 200) + 100}ms</span>
                </div>
                <div class="monitor-item">
                    <h4>错误率</h4>
                    <span class="monitor-value">${(Math.random() * 2).toFixed(2)}%</span>
                </div>
            </div>
        `;
    }

    // 渲染安全管理
    renderSecurity() {
        this.renderSecurityOverview();
        this.renderSecurityEvents();
    }

    // 渲染安全概览
    renderSecurityOverview() {
        const securityOverview = document.getElementById('securityOverview');
        if (!securityOverview) return;

        securityOverview.innerHTML = `
            <div class="security-stats">
                <div class="security-card">
                    <h4>登录安全</h4>
                    <div class="security-metric">
                        <span>今日登录</span>
                        <span class="metric-value">${this.getTodayLogins()}</span>
                    </div>
                    <div class="security-metric">
                        <span>失败尝试</span>
                        <span class="metric-value warning">${Math.floor(Math.random() * 10)}</span>
                    </div>
                    <div class="security-metric">
                        <span>锁定账户</span>
                        <span class="metric-value">${this.usersData.filter(u => u.status === 'locked').length}</span>
                    </div>
                </div>

                <div class="security-card">
                    <h4>数据安全</h4>
                    <div class="security-metric">
                        <span>数据备份</span>
                        <span class="metric-value success">正常</span>
                    </div>
                    <div class="security-metric">
                        <span>加密状态</span>
                        <span class="metric-value success">已启用</span>
                    </div>
                    <div class="security-metric">
                        <span>访问控制</span>
                        <span class="metric-value success">正常</span>
                    </div>
                </div>

                <div class="security-card">
                    <h4>系统安全</h4>
                    <div class="security-metric">
                        <span>防火墙</span>
                        <span class="metric-value success">启用</span>
                    </div>
                    <div class="security-metric">
                        <span>病毒扫描</span>
                        <span class="metric-value success">已更新</span>
                    </div>
                    <div class="security-metric">
                        <span>系统补丁</span>
                        <span class="metric-value warning">待更新</span>
                    </div>
                </div>
            </div>
        `;
    }

    // 渲染安全事件
    renderSecurityEvents() {
        const securityEvents = document.getElementById('securityEvents');
        if (!securityEvents) return;

        const events = [
            { type: 'warning', message: '检测到来自异常IP的登录尝试', time: '5分钟前', severity: 'medium' },
            { type: 'error', message: '多次密码失败触发账户锁定', time: '1小时前', severity: 'high' },
            { type: 'info', message: '系统安全扫描完成', time: '3小时前', severity: 'low' },
            { type: 'warning', message: '检测到权限异常访问', time: '1天前', severity: 'high' }
        ];

        securityEvents.innerHTML = events.map(event => `
            <div class="security-event ${event.type}">
                <div class="event-header">
                    <span class="event-severity ${event.severity}">${this.getSeverityText(event.severity)}</span>
                    <span class="event-time">${event.time}</span>
                </div>
                <p class="event-message">${event.message}</p>
            </div>
        `).join('');
    }

    // 获取严重程度文本
    getSeverityText(severity) {
        const severityMap = {
            'low': '低',
            'medium': '中',
            'high': '高',
            'critical': '严重'
        };
        return severityMap[severity] || severity;
    }

    // 渲染个人信息
    renderProfile() {
        const profileElements = {
            adminName: document.getElementById('adminName'),
            adminEmail: document.getElementById('adminEmail'),
            adminPhone: document.getElementById('adminPhone'),
            adminOffice: document.getElementById('adminOffice'),
            lastLogin: document.getElementById('lastLogin'),
            loginCount: document.getElementById('loginCount')
        };

        if (profileElements.adminName) {
            profileElements.adminName.textContent = this.userData.name;
        }
        if (profileElements.adminEmail) {
            profileElements.adminEmail.textContent = this.userData.email;
        }
        if (profileElements.adminPhone) {
            profileElements.adminPhone.textContent = this.userData.phone;
        }
        if (profileElements.adminOffice) {
            profileElements.adminOffice.textContent = this.userData.office;
        }
        if (profileElements.lastLogin) {
            profileElements.lastLogin.textContent = new Date().toLocaleString();
        }
        if (profileElements.loginCount) {
            profileElements.loginCount.textContent = Math.floor(Math.random() * 100) + 1;
        }
    }

    // 占位方法 - 这些方法的具体实现需要根据业务需求进一步开发
    performSearch() {
        const searchTerm = document.getElementById('searchInput').value.trim();
        if (!searchTerm) {
            showMessage('请输入搜索关键词', 'warning');
            return;
        }
        showMessage(`搜索功能正在开发中: ${searchTerm}`, 'info');
    }

    showAddUserModal() {
        showMessage('添加用户功能正在开发中...', 'info');
    }

    editUser(userId) {
        showMessage(`编辑用户功能正在开发中: ${userId}`, 'info');
    }

    resetPassword(userId) {
        if (confirm('确定要重置该用户的密码吗？')) {
            showMessage(`重置密码功能正在开发中: ${userId}`, 'info');
        }
    }

    viewUserLogs(userId) {
        showMessage(`查看用户日志功能正在开发中: ${userId}`, 'info');
    }

    lockUser(userId) {
        if (confirm('确定要锁定该用户吗？')) {
            showMessage(`锁定用户功能正在开发中: ${userId}`, 'info');
        }
    }

    unlockUser(userId) {
        if (confirm('确定要解锁该用户吗？')) {
            showMessage(`解锁用户功能正在开发中: ${userId}`, 'info');
        }
    }

    deleteUser(userId) {
        if (confirm('确定要删除该用户吗？此操作不可撤销！')) {
            showMessage(`删除用户功能正在开发中: ${userId}`, 'info');
        }
    }

    batchDeleteUsers() {
        showMessage('批量删除功能正在开发中...', 'info');
    }

    batchExportData() {
        showMessage('批量导出功能正在开发中...', 'info');
    }

    editPermissions(userType) {
        showMessage(`编辑权限功能正在开发中: ${userType}`, 'info');
    }

    clearLogs() {
        if (confirm('确定要清空所有日志吗？此操作不可撤销！')) {
            showMessage('清空日志功能正在开发中...', 'info');
        }
    }

    exportLogs() {
        showMessage('导出日志功能正在开发中...', 'info');
    }

    createBackup() {
        const backup = dataManager.createBackup();
        showMessage(`备份创建成功，备份ID: ${backup.id.slice(-6)}`, 'success');
        this.loadSystemData();
        if (this.currentPage === 'backup') {
            this.renderBackup();
        }
    }

    showRestoreBackupModal() {
        showMessage('恢复备份功能正在开发中...', 'info');
    }

    restoreFromBackup(backupId) {
        if (confirm('确定要从此备份恢复数据吗？当前数据将被覆盖！')) {
            const success = dataManager.restoreBackup(backupId);
            if (success) {
                showMessage('数据恢复成功！', 'success');
                this.loadSystemData();
            } else {
                showMessage('数据恢复失败！', 'error');
            }
        }
    }

    downloadBackup(backupId) {
        showMessage(`下载备份功能正在开发中: ${backupId}`, 'info');
    }

    deleteBackup(backupId) {
        if (confirm('确定要删除此备份吗？')) {
            showMessage(`删除备份功能正在开发中: ${backupId}`, 'info');
        }
    }

    saveSystemSettings() {
        const settings = {
            systemName: document.getElementById('systemName')?.value,
            adminEmail: document.getElementById('adminEmail')?.value,
            maxLoginAttempts: parseInt(document.getElementById('maxLoginAttempts')?.value),
            sessionTimeout: parseInt(document.getElementById('sessionTimeout')?.value) * 60,
            passwordPolicy: {
                minLength: parseInt(document.getElementById('passwordMinLength')?.value),
                requireUppercase: document.getElementById('passwordRequireUppercase')?.checked,
                requireNumbers: document.getElementById('passwordRequireNumbers')?.checked,
                requireSpecialChars: document.getElementById('passwordRequireSpecialChars')?.checked
            }
        };

        dataManager.updateSettings(settings);
        this.settings = dataManager.getSettings();
        showMessage('系统设置保存成功！', 'success');
    }

    resetSettings() {
        if (confirm('确定要重置为默认设置吗？')) {
            showMessage('重置设置功能正在开发中...', 'info');
        }
    }

    updateSystemSettings() {
        showMessage('更新系统设置功能正在开发中...', 'info');
    }

    runSystemDiagnostics() {
        showMessage('系统诊断功能正在开发中...', 'info');
    }

    runSecurityScan() {
        showMessage('安全扫描功能正在开发中...', 'info');
    }

    runPerformanceTest() {
        showMessage('性能测试功能正在开发中...', 'info');
    }
}

// 显示消息的全局函数
function showMessage(message, type = 'info') {
    const container = document.getElementById('messageContainer');
    if (!container) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;

    container.appendChild(messageDiv);

    // 3秒后自动消失
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.systemAdmin = new SystemAdminDashboard();
});