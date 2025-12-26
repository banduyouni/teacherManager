// 认证管理模块 - 成绩管理教学平台
class AuthManager {
    constructor(dataManager = null) {
        this.currentUser = null;
        this.loginAttempts = {};
        this.maxLoginAttempts = 5;
        this.lockoutDuration = 30 * 60 * 1000; // 30分钟
        this.sessionTimeout = 2 * 60 * 60 * 1000; // 2小时
        this.sessionTimer = null;
        // 优先使用传入的数据管理器，其次使用全局的 dataManager，确保在测试页等场景下也能正常工作
        this.dataManager = dataManager || (typeof window !== 'undefined' ? window.dataManager : null);
    }

    // 初始化认证
    init() {
        this.checkSession();
        this.setupAutoLogout();
    }

    // 登录
    login(username, password, userType) {
        const user = this.getUserByUsername(username, userType);
        if (!user) {
            return { success: false, message: '用户名或密码错误' };
        }

        // 账号状态检查
        if (user.status === 'inactive') {
            return { success: false, message: '账号未激活，请联系管理员' };
        }

        // 锁定检查（优先使用持久化字段）
        const lockedUntil = user.lockedUntil ? new Date(user.lockedUntil).getTime() : null;
        if (lockedUntil && Date.now() < lockedUntil) {
            const remainingMs = lockedUntil - Date.now();
            const minutes = Math.ceil(remainingMs / 60000);
            return { success: false, message: `账号已被锁定，请在 ${minutes} 分钟后重试` };
        }

        // 密码验证：优先使用“用户名作为盐值”，兼容旧salt
        const primarySalt = user.username;
        const okPrimary = this.verifyPassword(password, user.password, primarySalt);
        const okLegacy = (!okPrimary && user.salt && user.salt !== primarySalt) ? this.verifyPassword(password, user.password, user.salt) : false;
        const isValid = okPrimary || okLegacy;

        if (!isValid) {
            const currentFail = (typeof user.failedLoginCount === 'number') ? user.failedLoginCount : 0;
            const nextFail = currentFail + 1;
            const settings = this.dataManager?.getSettings?.() || {};
            const maxAttempts = settings.maxLoginAttempts || this.maxLoginAttempts;
            const freezeMinutes = Number(settings.freezeDuration ?? settings.sessionTimeout) || (this.lockoutDuration / 60000);
            const lockoutMs = Math.max(1, freezeMinutes) * 60 * 1000;

            let newLockedUntil = null;
            if (nextFail >= maxAttempts) {
                newLockedUntil = new Date(Date.now() + lockoutMs).toISOString();
            }

            this.dataManager?.updateUserLoginSecurity?.(user.id, {
                failedLoginCount: nextFail,
                lockedUntil: newLockedUntil,
                lastLoginAt: user.lastLoginAt || null
            });

            if (newLockedUntil) {
                this.addLog(user.id, 'account_locked', `用户 ${user.username} 因多次登录失败被锁定`);
                return { success: false, message: '密码错误次数过多，账号已锁定，请稍后再试' };
            }

            return { success: false, message: `用户名或密码错误（剩余 ${Math.max(0, maxAttempts - nextFail)} 次）` };
        }

        // 若使用旧salt登录成功，则迁移到“用户名作为盐值”
        if (user.salt !== user.username) {
            const newHash = this.hashPassword(password, user.username);
            this.updateUserPassword(user.id, newHash, user.username);
        }

        // 清理失败次数/锁定
        this.dataManager?.updateUserLoginSecurity?.(user.id, {
            failedLoginCount: 0,
            lockedUntil: null,
            lastLoginAt: new Date().toISOString()
        });

        // 登录成功
        this.currentUser = this.getUserById(user.id) || user;
        this.createSession(this.currentUser);
        this.addLog(user.id, 'login', `用户 ${user.name} 登录成功`);

        return { success: true, user: this.currentUser, mustChangePassword: !!this.currentUser.requirePasswordChange };
    }

    // 登出
    logout() {
        if (this.currentUser) {
            this.addLog(this.currentUser.id, 'logout', `用户 ${this.currentUser.name} 登出系统`);
        }
        
        this.currentUser = null;
        this.clearSession();
        this.clearAutoLogout();
        
        // 重定向到首页
        window.location.href = 'index.html';
    }

    // 检查会话
    checkSession() {
        const sessionData = sessionStorage.getItem('userSession');
        if (!sessionData) {
            return false;
        }

        try {
            const session = JSON.parse(sessionData);
            const now = Date.now();
            
            if (now > session.expiresAt) {
                this.clearSession();
                return false;
            }

            this.currentUser = session.user;
            this.startSessionTimer();
            return true;
        } catch (error) {
            this.clearSession();
            return false;
        }
    }

    // 创建会话
    createSession(user) {
        const session = {
            user: user,
            loginTime: Date.now(),
            expiresAt: Date.now() + this.sessionTimeout
        };

        sessionStorage.setItem('userSession', JSON.stringify(session));
        this.startSessionTimer();
    }

    // 清除会话
    clearSession() {
        sessionStorage.removeItem('userSession');
        this.currentUser = null;
        this.clearAutoLogout();
    }

    // 设置自动登出
    setupAutoLogout() {
        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseSessionTimer();
            } else {
                this.resumeSessionTimer();
                this.checkSessionTimeout();
            }
        });

        // 监听鼠标和键盘活动
        let activityTimer;
        const resetActivityTimer = () => {
            clearTimeout(activityTimer);
            activityTimer = setTimeout(() => {
                if (this.checkSession()) {
                    this.showInactivityWarning();
                }
            }, this.sessionTimeout - 5 * 60 * 1000); // 提前5分钟警告
        };

        document.addEventListener('mousemove', resetActivityTimer);
        document.addEventListener('keydown', resetActivityTimer);
        resetActivityTimer();
    }

    // 开始会话计时器
    startSessionTimer() {
        this.clearAutoLogout();
        this.sessionTimer = setTimeout(() => {
            this.logout();
            this.showMessage('会话已超时，请重新登录', 'warning');
        }, this.sessionTimeout);
    }

    // 暂停会话计时器
    pauseSessionTimer() {
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
            this.sessionTimer = null;
        }
    }

    // 恢复会话计时器
    resumeSessionTimer() {
        if (this.currentUser && !this.sessionTimer) {
            const sessionData = sessionStorage.getItem('userSession');
            if (sessionData) {
                try {
                    const session = JSON.parse(sessionData);
                    const remainingTime = session.expiresAt - Date.now();
                    if (remainingTime > 0) {
                        this.sessionTimer = setTimeout(() => {
                            this.logout();
                        }, remainingTime);
                    }
                } catch (error) {
                    console.error('恢复会话计时器失败:', error);
                }
            }
        }
    }

    // 清除自动登出
    clearAutoLogout() {
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
            this.sessionTimer = null;
        }
    }

    // 检查会话超时
    checkSessionTimeout() {
        const sessionData = sessionStorage.getItem('userSession');
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                if (Date.now() > session.expiresAt) {
                    this.logout();
                }
            } catch (error) {
                this.clearSession();
            }
        }
    }

    // 显示不活动警告
    showInactivityWarning() {
        if (typeof showMessage === 'function') {
            showMessage('您的会话即将超时，请继续操作以保持登录状态', 'warning');
        }
    }

    // 记录失败登录尝试
    recordFailedAttempt(username) {
        if (!this.loginAttempts[username]) {
            this.loginAttempts[username] = {
                attempts: 0,
                firstAttempt: Date.now()
            };
        }
        
        this.loginAttempts[username].attempts++;
        this.loginAttempts[username].lastAttempt = Date.now();
    }

    // 清除失败登录尝试
    clearFailedAttempts(username) {
        delete this.loginAttempts[username];
    }

    // 检查账户是否被锁定
    isAccountLocked(username) {
        const attempts = this.loginAttempts[username];
        if (!attempts) return false;
        
        if (attempts.attempts >= this.maxLoginAttempts) {
            const now = Date.now();
            const lockoutEnd = attempts.lastAttempt + this.lockoutDuration;
            return now < lockoutEnd;
        }
        
        return false;
    }

    // 锁定账户
    lockAccount(username) {
        const attempts = this.loginAttempts[username];
        if (attempts) {
            attempts.lockedAt = Date.now();
            attempts.lockedUntil = Date.now() + this.lockoutDuration;
        }
        
        this.addLog(null, 'account_locked', `用户 ${username} 因多次登录失败被锁定`);
    }

    // 获取剩余锁定时间
    getRemainingLockoutTime(username) {
        const attempts = this.loginAttempts[username];
        if (!attempts || !attempts.lockedUntil) return 0;
        
        const remaining = attempts.lockedUntil - Date.now();
        return Math.max(0, remaining);
    }

    // 验证密码
    verifyPassword(inputPassword, storedPassword, salt) {
        // 使用与数据管理器完全一致的哈希算法
        if (this.dataManager && typeof this.dataManager.hashPassword === 'function') {
            const hashedInput = this.dataManager.hashPassword(inputPassword, salt);
            return hashedInput === storedPassword;
        }
        // 如果dataManager不可用，使用本地hashPassword方法
        const hashedInput = this.hashPassword(inputPassword, salt);
        return hashedInput === storedPassword;
    }

    // 哈希密码
    hashPassword(password, salt) {
        // 为了保证和 DataManager 中的初始密码一致，这里复用相同的简化哈希逻辑
        // 优先调用 dataManager.hashPassword（如可用），否则使用同样的实现
        if (this.dataManager && typeof this.dataManager.hashPassword === 'function') {
            return this.dataManager.hashPassword(password, salt);
        }

        let hash = 0;
        const combined = password + salt + 'teachManager2024';
        for (let iteration = 0; iteration < 1000; iteration++) {
            const str = combined + iteration;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char + iteration;
                hash = hash & hash;
            }
        }
        const checkDigit = (hash % 1000).toString().padStart(3, '0');
        return Math.abs(hash).toString(16) + checkDigit;
    }

    // 生成盐值
    generateSalt() {
        const array = new Uint8Array(16);
        const cryptoObj = window.crypto || window.msCrypto;
        if (cryptoObj && cryptoObj.getRandomValues) {
            cryptoObj.getRandomValues(array);
        } else {
            for (let i = 0; i < array.length; i++) {
                array[i] = Math.floor(Math.random() * 256);
            }
        }
        return Array.from(array)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    // 忘记密码
    forgotPassword(username, userType, email) {
        const user = this.getUserByUsername(username, userType);
        if (!user) {
            return { success: false, message: '未找到对应的用户账号' };
        }

        if (!user.email || user.email !== email) {
            return { success: false, message: '邮箱地址不匹配' };
        }

        // 生成重置令牌
        const resetToken = this.generateResetToken();
        const resetExpires = Date.now() + 24 * 60 * 60 * 1000; // 24小时有效

        // 保存重置信息
        this.savePasswordReset(user.id, resetToken, resetExpires);

        // 演示环境：不实际发邮件，返回token供前端展示
        this.addLog(user.id, 'password_reset_request', `用户 ${user.name} 请求重置密码`);

        return {
            success: true,
            message: '重置链接已发送到绑定邮箱（演示：将显示重置令牌）',
            token: resetToken
        };
    }

    // 生成重置令牌
    generateResetToken() {
        return Array.from({length: 32}, () => 
            Math.random().toString(36).substring(2, 15)
        ).join('');
    }

    // 保存密码重置信息
    savePasswordReset(userId, token, expires) {
        const resets = JSON.parse(localStorage.getItem('passwordResets') || '{}');
        resets[userId] = {
            token: token,
            expires: expires,
            createdAt: Date.now()
        };
        localStorage.setItem('passwordResets', JSON.stringify(resets));
    }

    // 重置密码
    resetPassword(token, newPassword) {
        const resets = JSON.parse(localStorage.getItem('passwordResets') || '{}');
        
        for (const [userId, reset] of Object.entries(resets)) {
            if (reset.token === token && Date.now() < reset.expires) {
                // 验证成功，更新密码
                const user = this.getUserById(userId);
                if (user) {
                    const salt = user.username;
                    const hashedPassword = this.hashPassword(newPassword, salt);
                    
                    // 更新用户密码（这里应该调用数据管理器）
                    this.updateUserPassword(userId, hashedPassword, salt, { requirePasswordChange: true });
                    
                    // 清除重置令牌
                    delete resets[userId];
                    localStorage.setItem('passwordResets', JSON.stringify(resets));
                    
                    this.addLog(userId, 'password_reset', `用户 ${user.name} 重置了密码`);
                    
                    return { success: true, message: '密码重置成功' };
                }
            }
        }
        
        return { success: false, message: '重置链接无效或已过期' };
    }

    // 修改密码
    changePassword(oldPassword, newPassword) {
        if (!this.currentUser) {
            return { success: false, message: '请先登录' };
        }

        // 验证旧密码
        if (!(this.verifyPassword(oldPassword, this.currentUser.password, this.currentUser.username) || (this.currentUser.salt && this.verifyPassword(oldPassword, this.currentUser.password, this.currentUser.salt)))) {
            return { success: false, message: '原密码错误' };
        }

        // 更新新密码
        const salt = this.currentUser.username;
        const hashedPassword = this.hashPassword(newPassword, salt);
        
        this.updateUserPassword(this.currentUser.id, hashedPassword, salt, { requirePasswordChange: false });
        this.currentUser.password = hashedPassword;
        this.currentUser.salt = salt;
        this.currentUser.requirePasswordChange = false;

        // 更新会话
        this.createSession(this.currentUser);

        this.addLog(this.currentUser.id, 'password_change', `用户 ${this.currentUser.name} 修改了密码`);

        return { success: true, message: '密码修改成功' };
    }

    // 获取用户菜单
    getUserMenu(userType) {
        const menus = {
            student: [
                { id: 'dashboard', title: '仪表盘', icon: 'home' },
                { id: 'courses', title: '课程浏览', icon: 'book' },
                { id: 'my-courses', title: '我的课程', icon: 'graduation-cap' },
                { id: 'grades', title: '成绩中心', icon: 'chart-line' },
                { id: 'profile', title: '个人信息', icon: 'user' }
            ],
            teacher: [
                { id: 'dashboard', title: '仪表盘', icon: 'home' },
                { id: 'courses', title: '课程管理', icon: 'book' },
                { id: 'students', title: '学生管理', icon: 'users' },
                { id: 'assignments', title: '作业考试', icon: 'tasks' },
                { id: 'grades', title: '成绩管理', icon: 'chart-line' },
                { id: 'materials', title: '课件资源', icon: 'folder' },
                { id: 'profile', title: '个人信息', icon: 'user' }
            ],
            academicAdmin: [
                { id: 'dashboard', title: '仪表盘', icon: 'home' },
                { id: 'programs', title: '培养方案', icon: 'graduation-cap' },
                { id: 'classes', title: '班级管理', icon: 'users' },
                { id: 'semesters', title: '学期管理', icon: 'calendar-alt' },
                { id: 'courses', title: '课程安排', icon: 'book' },
                { id: 'classrooms', title: '教室管理', icon: 'school' },
                { id: 'schedules', title: '课表管理', icon: 'clock' },
                { id: 'grades', title: '成绩统计', icon: 'chart-line' },
                { id: 'audit', title: '成绩审核', icon: 'shield-alt' },
                { id: 'profile', title: '个人信息', icon: 'user' }
            ],
            systemAdmin: [
                { id: 'dashboard', title: '仪表盘', icon: 'home' },
                { id: 'users', title: '用户管理', icon: 'users' },
                { id: 'permissions', title: '权限管理', icon: 'shield-alt' },
                { id: 'logs', title: '操作日志', icon: 'list-alt' },
                { id: 'backup', title: '数据备份', icon: 'database' },
                { id: 'system', title: '系统设置', icon: 'cogs' },
                { id: 'monitoring', title: '系统监控', icon: 'chart-area' },
                { id: 'security', title: '安全管理', icon: 'lock' },
                { id: 'profile', title: '个人信息', icon: 'user' }
            ],
            guest: [
                { id: 'home', title: '首页', icon: 'home' },
                { id: 'courses', title: '课程浏览', icon: 'book' },
                { id: 'search', title: '课程搜索', icon: 'search' }
            ]
        };

        return menus[userType] || menus.guest;
    }

    // 获取用户权限
    getUserPermissions(userType) {
        const permissions = {
            student: ['view_courses', 'enroll_courses', 'view_grades', 'view_materials'],
            teacher: ['manage_courses', 'view_students', 'manage_assignments', 'manage_grades', 'upload_materials'],
            academicAdmin: ['manage_programs', 'manage_classes', 'manage_schedules', 'audit_grades', 'export_reports'],
            systemAdmin: ['manage_users', 'manage_permissions', 'view_logs', 'backup_data', 'system_settings'],
            guest: ['view_courses', 'search_courses']
        };

        return permissions[userType] || [];
    }

    // 检查权限
    hasPermission(permission) {
        if (!this.currentUser) return false;
        return this.getUserPermissions(this.currentUser.userType).includes(permission);
    }

    // 以下方法需要与数据管理器集成
    getUserByUsername(username, userType) {
        // 这里应该调用数据管理器的方法
        return this.dataManager?.getUserByUsername(username, userType);
    }

    getUserById(userId) {
        return this.dataManager?.getUserById(userId);
    }

    updateUserPassword(userId, password, salt) {
        return this.dataManager?.updateUserPassword(userId, password, salt);
    }

    addLog(userId, action, description) {
        // 使用当前实例持有的数据管理器，避免引用未定义的全局变量
        return this.dataManager?.addLog(userId, action, description);
    }

    // 显示消息（需要页面级别的实现）
    showMessage(message, type = 'info') {
        if (typeof showMessage === 'function') {
            showMessage(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// 创建全局认证管理器实例
let auth;

// 初始化AuthManager
function initializeAuth() {
    if (typeof window.dataManager !== 'undefined') {
        auth = new AuthManager(window.dataManager);
        window.auth = auth;
        auth.init();
        console.log('AuthManager 已成功初始化并连接到 DataManager');
        return true;
    } else {
        console.error('DataManager 未加载，无法初始化 AuthManager');
        return false;
    }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    // 立即尝试初始化
    if (!initializeAuth()) {
        // 如果失败，延迟重试
        setTimeout(() => {
            if (!initializeAuth()) {
                // 再延迟重试一次
                setTimeout(initializeAuth, 100);
            }
        }, 100);
    }
});
