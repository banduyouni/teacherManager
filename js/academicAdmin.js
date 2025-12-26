// 教务管理员仪表盘功能模块
class AcademicAdminDashboard {
    constructor() {
        this.currentPage = 'dashboard';
        this.userData = null;
        this.usersData = [];
        this.programsData = [];
        this.classesData = [];
        this.coursesData = [];
        this.gradesData = [];
        this.pageSize = 10;
        this.currentStudentsPage = 1;
        this.currentTeachersPage = 1;
        this.mockGradesData = null;
        this.init();
    }

    // 初始化
    init() {
        // 检查用户登录状态
        if (!auth.checkSession() || auth.currentUser?.userType !== 'academicAdmin') {
            window.location.href = 'index.html';
            return;
        }

        this.userData = auth.currentUser;
        this.loadAdminData();
        this.setupEventListeners();
        this.renderCurrentPage();
        this.updateUserInfo();
        this.enforcePasswordChange();
    }

    // 加载管理员数据
    loadAdminData() {
        // 加载所有相关数据
        const programs = dataManager.getData('programs') || [];
        this.programsData = programs.length ? programs : this.generateMockPrograms();
        if (!programs.length) {
            dataManager.setData('programs', this.programsData);
        }
        this.classesData = dataManager.getData('classes');
        this.usersData = dataManager.getData('users') || [];
        this.coursesData = dataManager.getData('courses');
        this.gradesData = dataManager.getData('grades');
        this.departmentsData = dataManager.getData('departments');
        this.semestersData = dataManager.getData('semesters') || [];
        this.classroomsData = dataManager.getData('classrooms') || [];
        this.schedulesData = dataManager.getData('schedules') || [];
        this.mockGradesData = null;
    }

    // 生成模拟培养方案数据
    generateMockPrograms() {
        return [
            {
                id: 'prog001',
                name: '计算机科学与技术本科培养方案',
                departmentId: 'd001',
                major: '计算机科学与技术',
                degree: '本科',
                duration: 4,
                totalCredits: 160,
                courses: ['course001', 'course002', 'course003', 'course004'],
                status: 'active',
                version: '2021',
                createdAt: '2021-09-01T00:00:00Z'
            },
            {
                id: 'prog002',
                name: '软件工程本科培养方案',
                departmentId: 'd001',
                major: '软件工程',
                degree: '本科',
                duration: 4,
                totalCredits: 158,
                courses: ['course001', 'course003', 'course005'],
                status: 'active',
                version: '2021',
                createdAt: '2021-09-01T00:00:00Z'
            }
        ];
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

        // 培养方案搜索与筛选
        document.getElementById('programSearch')?.addEventListener('input', () => this.renderPrograms());
        document.getElementById('programStatusFilter')?.addEventListener('change', () => this.renderPrograms());

        // 学生管理筛选
        document.getElementById('studentSearch')?.addEventListener('input', () => {
            this.currentStudentsPage = 1;
            this.renderStudents();
        });
        document.getElementById('studentStatusFilter')?.addEventListener('change', () => {
            this.currentStudentsPage = 1;
            this.renderStudents();
        });
        document.getElementById('selectAllStudents')?.addEventListener('change', (e) => {
            const checked = e.target.checked;
            document.querySelectorAll('input.student-select').forEach(cb => cb.checked = checked);
        });
        document.getElementById('studentImportBtn')?.addEventListener('click', () => this.batchImportStudents());
        document.getElementById('studentExportBtn')?.addEventListener('click', () => this.exportStudents());

        // 教师管理筛选
        document.getElementById('teacherSearch')?.addEventListener('input', () => {
            this.currentTeachersPage = 1;
            this.renderTeachers();
        });
        document.getElementById('teacherStatusFilter')?.addEventListener('change', () => {
            this.currentTeachersPage = 1;
            this.renderTeachers();
        });
        document.getElementById('selectAllTeachers')?.addEventListener('change', (e) => {
            const checked = e.target.checked;
            document.querySelectorAll('input.teacher-select').forEach(cb => cb.checked = checked);
        });
        document.getElementById('teacherImportBtn')?.addEventListener('click', () => this.batchImportTeachers());
        document.getElementById('teacherExportBtn')?.addEventListener('click', () => this.exportTeachers());

        // 各类添加按钮
        this.setupActionButtons();
        this.setupDashboardTodoLinks();

        // 快速操作卡片
        document.querySelectorAll('.action-card').forEach(card => {
            card.addEventListener('click', () => {
                const action = card.dataset.action;
                const actionMap = {
                    'create-program': 'showAddProgramModal',
                    'semester-planning': 'showAddSemesterModal',
                    'classroom-scheduling': 'showAddClassroomModal',
                    'grade-audit': 'switchToAudit',
                    'import-students': 'batchImportStudents',
                    'export-reports': 'exportReports'
                };
                const handler = actionMap[action];
                if (handler && typeof this[handler] === 'function') {
                    this[handler]();
                }
            });
        });

        // 课程安排筛选
        document.getElementById('courseDepartmentFilter')?.addEventListener('change', () => this.renderCourses());
        document.getElementById('courseTypeFilter')?.addEventListener('change', () => this.renderCourses());

        // 教室筛选
        document.getElementById('classroomBuildingFilter')?.addEventListener('change', () => this.renderClassrooms());
        document.getElementById('classroomTypeFilter')?.addEventListener('change', () => this.renderClassrooms());

        // 课表筛选
        document.getElementById('scheduleStudentFilter')?.addEventListener('change', (e) => {
            const teacherSelect = document.getElementById('scheduleTeacherFilter');
            if (teacherSelect && e.target?.value) teacherSelect.value = '';
            this.renderSchedules();
        });
        document.getElementById('scheduleTeacherFilter')?.addEventListener('change', (e) => {
            const studentSelect = document.getElementById('scheduleStudentFilter');
            if (studentSelect && e.target?.value) studentSelect.value = '';
            this.renderSchedules();
        });

        // 成绩统计筛选
        document.getElementById('gradeDepartmentFilter')?.addEventListener('change', () => this.renderGrades());

        // 个人信息编辑/修改密码
        document.getElementById('editProfileBtn')?.addEventListener('click', () => this.openEditProfileModal());
        document.getElementById('changePasswordBtn')?.addEventListener('click', () => this.openChangePasswordModal());

        // 模态框设置
        this.setupModalListeners();
    }

    // 设置操作按钮
    setupActionButtons() {
        const actionButtons = [
            { id: 'createProgramBtn', action: 'showAddProgramModal' },
            { id: 'importProgramBtn', action: 'importProgram' },
            { id: 'createStudentBtn', action: 'showAddStudentModal' },
            { id: 'createTeacherBtn', action: 'showAddTeacherModal' },
            { id: 'createClassBtn', action: 'showAddClassModal' },
            { id: 'batchImportBtn', action: 'batchImportStudents' },
            { id: 'createSemesterBtn', action: 'showAddSemesterModal' },
            { id: 'arrangeCourseBtn', action: 'showScheduleCourseModal' },
            { id: 'autoArrangeBtn', action: 'autoArrangeCourses' },
            { id: 'addClassroomBtn', action: 'showAddClassroomModal' },
            { id: 'generateScheduleBtn', action: 'showAddScheduleModal' },
            { id: 'exportScheduleBtn', action: 'exportSchedule' },
            { id: 'exportGradeReportBtn', action: 'exportReports' }
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

    setupDashboardTodoLinks() {
        const actions = {
            'go-audit': 'audit',
            'go-courses': 'courses',
            'go-students': 'students'
        };
        document.querySelectorAll('#dashboard .todo-footer [data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = actions[btn.dataset.action];
                if (target) this.switchPage(target);
            });
        });
    }

    // 设置模态框监听器
    setupModalListeners() {
        // 通用模态框关闭逻辑
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
            case 'students':
                this.renderStudents();
                break;
            case 'teachers':
                this.renderTeachers();
                break;
            case 'programs':
                this.renderPrograms();
                break;
            case 'classes':
                this.renderClasses();
                break;
            case 'courses':
                this.renderCourses();
                break;
            case 'schedules':
                this.renderSchedules();
                break;
            case 'grades':
                this.renderGrades();
                break;
            case 'audit':
                this.renderAudit();
                break;
            case 'profile':
                this.renderProfile();
                break;
        }
    }

    // 渲染仪表盘
    renderDashboard() {
        // 更新统计数据
        const stats = dataManager.getStatistics();
        this.updateDashboardStats(stats);

        // 渲染最近活动
        this.renderRecentActivity();

        // 渲染待审核项目
        this.renderPendingItems();

        // 渲染成绩统计图表
        this.renderGradeCharts();
    }

    // 更新仪表盘统计
    updateDashboardStats(stats) {
        const totalPrograms = document.getElementById('totalPrograms');
        const totalClasses = document.getElementById('totalClasses');
        const currentSemesterCourses = document.getElementById('currentSemesterCourses');
        const totalStudents = document.getElementById('totalStudents');

        if (totalPrograms) totalPrograms.textContent = this.programsData.length;
        if (totalClasses) totalClasses.textContent = this.classesData.length;
        if (currentSemesterCourses) currentSemesterCourses.textContent = this.coursesData.length;
        if (totalStudents) totalStudents.textContent = stats.totalStudents || 0;
    }

    // 渲染最近活动
    renderRecentActivity() {
        const activityList = document.querySelector('.activity-list');
        if (!activityList) return;

        const activities = [
            {
                icon: 'graduation-cap',
                title: '培养方案更新',
                description: '计算机科学与技术培养方案已更新',
                time: '2小时前'
            },
            {
                icon: 'calendar-check',
                title: '课表安排',
                description: '2024年春季学期课表已发布',
                time: '5小时前'
            },
            {
                icon: 'chart-line',
                title: '成绩审核',
                description: '有15条成绩记录待审核',
                time: '1天前'
            },
            {
                icon: 'users',
                title: '班级管理',
                description: '新增3个班级，共120名学生',
                time: '2天前'
            }
        ];

        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <h4>${activity.title}</h4>
                    <p>${activity.description}</p>
                    <span class="activity-time">${activity.time}</span>
                </div>
            </div>
        `).join('');
    }

    // 渲染待审核项目
    renderPendingItems() {
        const pendingItems = document.querySelector('.pending-items');
        if (!pendingItems) return;

        const pendingGrades = this.gradesData.filter(g => g.status === 'pending').slice(0, 5);
        const pendingSchedules = this.getPendingSchedules().slice(0, 3);

        pendingItems.innerHTML = `
            <div class="pending-section">
                <h4>待审核成绩</h4>
                <div class="pending-list">
                    ${pendingGrades.length > 0 ? pendingGrades.map(grade => {
                        const course = this.coursesData.find(c => c.id === grade.courseId);
                        const student = dataManager.getUserById(grade.studentId);
                        return `
                            <div class="pending-item">
                                <span>${student ? student.name : '未知学生'} - ${course ? course.courseName : '未知课程'}</span>
                                <button class="btn-sm btn-primary" onclick="academicAdmin.auditGrade('${grade.id}')">审核</button>
                            </div>
                        `;
                    }).join('') : '<p class="no-pending">暂无待审核成绩</p>'}
                </div>
            </div>
            
            <div class="pending-section">
                <h4>待处理课表</h4>
                <div class="pending-list">
                    ${pendingSchedules.length > 0 ? pendingSchedules.map(schedule => `
                        <div class="pending-item">
                            <span>${schedule.title}</span>
                            <button class="btn-sm btn-secondary" onclick="academicAdmin.processSchedule('${schedule.id}')">处理</button>
                        </div>
                    `).join('') : '<p class="no-pending">暂无待处理课表</p>'}
                </div>
            </div>
        `;
    }

    // 获取待处理课表
    getPendingSchedules() {
        return [
            { id: 'sched001', title: '2024年秋季学期课表' },
            { id: 'sched002', title: '计算机学院考试安排' }
        ];
    }

    // 渲染成绩图表
    renderGradeCharts() {
        const distChart = document.getElementById('gradeDistributionChart');
        const deptChart = document.getElementById('departmentAvgChart');

        if (distChart) {
            const gradeStats = this.calculateGradeStatistics();
            distChart.innerHTML = `
                <div class="chart-stats">
                    <div class="stat-card">
                        <h4>优秀率</h4>
                        <span class="stat-value">${gradeStats.excellentRate}%</span>
                    </div>
                    <div class="stat-card">
                        <h4>及格率</h4>
                        <span class="stat-value">${gradeStats.passRate}%</span>
                    </div>
                    <div class="stat-card">
                        <h4>平均分</h4>
                        <span class="stat-value">${gradeStats.averageScore}</span>
                    </div>
                </div>
            `;
        }

        if (deptChart) {
            const deptStats = this.calculateDepartmentGradeStats();
            deptChart.innerHTML = deptStats.length ? `
                <div class="chart-stats">
                    ${deptStats.map(stat => `
                        <div class="stat-card">
                            <h4>${stat.departmentName}</h4>
                            <span class="stat-value">${stat.averageScore}</span>
                        </div>
                    `).join('')}
                </div>
            ` : '<div style="opacity:.7;">暂无数据</div>';
        }
    }

    // 计算成绩统计
    calculateGradeStatistics() {
        const grades = this.getGradesForStats();
        if (grades.length === 0) {
            return {
                excellentRate: 0,
                passRate: 0,
                averageScore: 0,
                totalStudents: 0
            };
        }

        const scores = grades.map(g => g.totalScore);
        const excellentCount = scores.filter(s => s >= 90).length;
        const passCount = scores.filter(s => s >= 60).length;
        const averageScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);

        return {
            excellentRate: ((excellentCount / scores.length) * 100).toFixed(1),
            passRate: ((passCount / scores.length) * 100).toFixed(1),
            averageScore,
            totalStudents: grades.length
        };
    }

    // 渲染培养方案
    renderPrograms() {
        const programsList = document.getElementById('programsList');
        if (!programsList) return;

        const searchValue = document.getElementById('programSearch')?.value.trim().toLowerCase() || '';
        const statusValue = document.getElementById('programStatusFilter')?.value || '';

        const filteredPrograms = this.programsData.filter(program => {
            if (statusValue && program.status !== statusValue) {
                return false;
            }
            if (!searchValue) return true;

            const department = this.departmentsData.find(d => d.id === program.departmentId);
            const departmentName = department ? department.departmentName : '';
            const courseText = (program.courses || []).map(courseId => {
                const course = this.coursesData.find(c => c.id === courseId);
                return course ? `${course.courseCode} ${course.courseName}` : courseId;
            }).join(' ');

            const haystack = [
                program.name,
                program.major,
                program.degree,
                program.version,
                program.totalCredits,
                program.duration,
                departmentName,
                courseText
            ].filter(Boolean).join(' ').toLowerCase();

            return haystack.includes(searchValue);
        });

        if (!filteredPrograms.length) {
            programsList.innerHTML = '<div class="empty-state">暂无匹配的培养方案</div>';
            return;
        }

        programsList.innerHTML = filteredPrograms.map(program => {
            const department = this.departmentsData.find(d => d.id === program.departmentId);
            const statusMap = {
                active: '生效中',
                archived: '已归档',
                draft: '草稿'
            };
            const statusText = statusMap[program.status] || '生效中';
            
            return `
                <div class="program-card">
                    <div class="program-header">
                        <h3>${program.name}</h3>
                        <span class="status-badge ${program.status}">${statusText}</span>
                    </div>
                    <div class="program-info">
                        <p><i class="fas fa-graduation-cap"></i> 专业: ${program.major}</p>
                        <p><i class="fas fa-university"></i> 院系: ${department ? department.departmentName : '未知院系'}</p>
                        <p><i class="fas fa-certificate"></i> 学位: ${program.degree}</p>
                        <p><i class="fas fa-clock"></i> 学制: ${program.duration}年</p>
                        <p><i class="fas fa-calculator"></i> 总学分: ${program.totalCredits}</p>
                        <p><i class="fas fa-book"></i> 课程数: ${(program.courses || []).length}</p>
                    </div>
                    <div class="program-actions">
                        <button class="btn-primary" onclick="academicAdmin.viewProgram('${program.id}')">查看详情</button>
                        <button class="btn-secondary" onclick="academicAdmin.editProgram('${program.id}')">编辑</button>
                        <button class="btn-info" onclick="academicAdmin.exportProgram('${program.id}')">导出</button>
                        ${program.status === 'active' ? `<button class="btn-archive" onclick="academicAdmin.archiveProgram('${program.id}')">归档</button>` : ''}
                        ${program.status === 'archived' ? `<button class="btn-archive" onclick="academicAdmin.unarchiveProgram('${program.id}')">取消归档</button>` : ''}
                        ${program.status === 'draft' ? `<button class="btn-success" onclick="academicAdmin.activateProgram('${program.id}')">执行</button>` : ''}
                        <button class="btn-danger" onclick="academicAdmin.deleteProgram('${program.id}')">删除</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 学生管理
    getFilteredStudents() {
        const kw = (document.getElementById('studentSearch')?.value || '').trim().toLowerCase();
        const status = document.getElementById('studentStatusFilter')?.value || '';
        this.usersData = dataManager.getData('users') || [];

        return this.usersData.filter(user => {
            if (user.userType !== 'student') return false;
            if (status && user.status !== status) return false;
            if (!kw) return true;
            const className = this.classesData.find(c => c.id === user.classId)?.className || '';
            return (
                (user.username || '').toLowerCase().includes(kw) ||
                (user.name || '').toLowerCase().includes(kw) ||
                (user.email || '').toLowerCase().includes(kw) ||
                className.toLowerCase().includes(kw)
            );
        }).sort((a, b) => (b.lastLoginAt || '').localeCompare(a.lastLoginAt || ''));
    }

    renderStudents() {
        const tbody = document.getElementById('studentsTableBody');
        const pager = document.getElementById('studentsPagination');
        if (!tbody) return;

        const students = this.getFilteredStudents();
        const totalPages = Math.max(1, Math.ceil(students.length / this.pageSize));
        this.currentStudentsPage = Math.min(this.currentStudentsPage, totalPages);

        const start = (this.currentStudentsPage - 1) * this.pageSize;
        const pageItems = students.slice(start, start + this.pageSize);

        tbody.innerHTML = pageItems.map(student => {
            const className = this.classesData.find(c => c.id === student.classId)?.className || '--';
            const lastLogin = student.lastLoginAt ? new Date(student.lastLoginAt).toLocaleString() : '--';
            return `
                <tr>
                    <td><input class="student-select" type="checkbox" data-id="${student.id}"></td>
                    <td>${student.id}</td>
                    <td>${student.username || '--'}</td>
                    <td>${student.name || '--'}</td>
                    <td>${className}</td>
                    <td>${student.major || '--'}</td>
                    <td>${student.email || '--'}</td>
                    <td>${lastLogin}</td>
                    <td><span class="status-badge ${student.status}">${this.getUserStatusText(student.status)}</span></td>
                    <td>
                        <button class="btn-sm btn-secondary" onclick="academicAdmin.resetUserPassword('${student.id}')">重置密码</button>
                        ${student.status === 'locked' ?
                            `<button class="btn-sm btn-success" onclick="academicAdmin.unlockUser('${student.id}')">解锁</button>` :
                            `<button class="btn-sm btn-lock" onclick="academicAdmin.lockUser('${student.id}')">锁定</button>`
                        }
                        <button class="btn-sm btn-danger" onclick="academicAdmin.deleteUser('${student.id}')">删除</button>
                    </td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="10" style="text-align:center;opacity:.7;">暂无学生</td></tr>';

        if (pager) {
            pager.innerHTML = this.renderPagination(totalPages, this.currentStudentsPage, (p) => `academicAdmin.goStudentsPage(${p})`);
        }
    }

    goStudentsPage(page) {
        this.currentStudentsPage = page;
        this.renderStudents();
    }

    // 教师管理
    getFilteredTeachers() {
        const kw = (document.getElementById('teacherSearch')?.value || '').trim().toLowerCase();
        const status = document.getElementById('teacherStatusFilter')?.value || '';
        this.usersData = dataManager.getData('users') || [];

        return this.usersData.filter(user => {
            if (user.userType !== 'teacher') return false;
            if (status && user.status !== status) return false;
            if (!kw) return true;
            const departmentName = this.departmentsData.find(d => d.id === user.departmentId)?.departmentName || user.office || '';
            return (
                (user.username || '').toLowerCase().includes(kw) ||
                (user.name || '').toLowerCase().includes(kw) ||
                (user.email || '').toLowerCase().includes(kw) ||
                departmentName.toLowerCase().includes(kw)
            );
        }).sort((a, b) => (b.lastLoginAt || '').localeCompare(a.lastLoginAt || ''));
    }

    renderTeachers() {
        const tbody = document.getElementById('teachersTableBody');
        const pager = document.getElementById('teachersPagination');
        if (!tbody) return;

        const teachers = this.getFilteredTeachers();
        const totalPages = Math.max(1, Math.ceil(teachers.length / this.pageSize));
        this.currentTeachersPage = Math.min(this.currentTeachersPage, totalPages);

        const start = (this.currentTeachersPage - 1) * this.pageSize;
        const pageItems = teachers.slice(start, start + this.pageSize);

        tbody.innerHTML = pageItems.map(teacher => {
            const departmentName = this.departmentsData.find(d => d.id === teacher.departmentId)?.departmentName || '--';
            const lastLogin = teacher.lastLoginAt ? new Date(teacher.lastLoginAt).toLocaleString() : '--';
            return `
                <tr>
                    <td><input class="teacher-select" type="checkbox" data-id="${teacher.id}"></td>
                    <td>${teacher.id}</td>
                    <td>${teacher.username || '--'}</td>
                    <td>${teacher.name || '--'}</td>
                    <td>${teacher.title || '--'}</td>
                    <td>${departmentName}</td>
                    <td>${teacher.email || '--'}</td>
                    <td>${lastLogin}</td>
                    <td><span class="status-badge ${teacher.status}">${this.getUserStatusText(teacher.status)}</span></td>
                    <td>
                        <button class="btn-sm btn-secondary" onclick="academicAdmin.resetUserPassword('${teacher.id}')">重置密码</button>
                        ${teacher.status === 'locked' ?
                            `<button class="btn-sm btn-success" onclick="academicAdmin.unlockUser('${teacher.id}')">解锁</button>` :
                            `<button class="btn-sm btn-lock" onclick="academicAdmin.lockUser('${teacher.id}')">锁定</button>`
                        }
                        <button class="btn-sm btn-danger" onclick="academicAdmin.deleteUser('${teacher.id}')">删除</button>
                    </td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="10" style="text-align:center;opacity:.7;">暂无教师</td></tr>';

        if (pager) {
            pager.innerHTML = this.renderPagination(totalPages, this.currentTeachersPage, (p) => `academicAdmin.goTeachersPage(${p})`);
        }
    }

    goTeachersPage(page) {
        this.currentTeachersPage = page;
        this.renderTeachers();
    }

    getUserStatusText(status) {
        return ({ active: '正常', inactive: '未激活', locked: '锁定' })[status] || status;
    }

    // 渲染班级管理
    renderClasses() {
        const tbody = document.getElementById('classesTableBody');
        if (!tbody) return;
        const users = dataManager.getData('users') || [];

        tbody.innerHTML = this.classesData.map(cls => {
            const department = this.departmentsData.find(d => d.id === cls.departmentId);
            const headTeacherName = cls.headTeacher || '未指定';
            const studentCount = users.filter(user => user.userType === 'student' && user.classId === cls.id).length;
            return `
                <tr>
                    <td>${cls.id}</td>
                    <td>${cls.className}</td>
                    <td>${department ? department.departmentName : '未知院系'}</td>
                    <td>${cls.grade}</td>
                    <td>${cls.major}</td>
                    <td>${studentCount}</td>
                    <td>${headTeacherName}</td>
                    <td>
                        <div class="class-table-actions">
                            <button class="btn-sm btn-primary" onclick="academicAdmin.viewClassStudents('${cls.id}')">学生</button>
                            <button class="btn-sm btn-secondary" onclick="academicAdmin.editClass('${cls.id}')">编辑</button>
                            <button class="btn-sm btn-danger" onclick="academicAdmin.deleteClass('${cls.id}')">删除</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="8" style="text-align:center;opacity:.7;">暂无班级</td></tr>';
    }

    // 渲染学期管理
    renderSemesters() {
        const semestersList = document.getElementById('semesterCards');
        if (!semestersList) return;

        const semesters = this.semestersData.length ? this.semestersData : [
            { id: '2024-1', name: '2024年春季学期', startDate: '2024-02-26', endDate: '2024-07-15', status: 'active' }
        ];

        semestersList.innerHTML = semesters.map(semester => `
            <div class="semester-card">
                <div class="semester-header">
                    <h3>${semester.name}</h3>
                    <span class="status-badge ${semester.status}">${this.getSemesterStatusText(semester.status)}</span>
                </div>
                <div class="semester-info">
                    <p><i class="fas fa-calendar-alt"></i> 开始: ${semester.startDate}</p>
                    <p><i class="fas fa-calendar-check"></i> 结束: ${semester.endDate}</p>
                    <p><i class="fas fa-book"></i> 课程数: ${this.getSemesterCourseCount(semester.id)}</p>
                </div>
                <div class="semester-actions">
                    <button class="btn-primary" onclick="academicAdmin.viewSemester('${semester.id}')">查看详情</button>
                    <button class="btn-secondary" onclick="academicAdmin.editSemester('${semester.id}')">编辑</button>
                    <button class="btn-info" onclick="academicAdmin.manageSemesterCourses('${semester.id}')">管理课程</button>
                </div>
            </div>
        `).join('');
    }

    // 获取学期状态文本
    getSemesterStatusText(status) {
        const statusMap = {
            'active': '进行中',
            'completed': '已结束',
            'upcoming': '即将开始'
        };
        return statusMap[status] || '未知';
    }

    // 获取学期课程数
    getSemesterCourseCount(semesterId) {
        return Math.floor(Math.random() * 50) + 20; // 模拟数据
    }

    // 渲染课程安排
    renderCourses() {
        const tbody = document.getElementById('courseScheduleBody');
        if (!tbody) return;

        const schedules = this.schedulesData || [];
        const departmentFilter = document.getElementById('courseDepartmentFilter');
        const typeFilter = document.getElementById('courseTypeFilter');

        if (departmentFilter && !departmentFilter.dataset.inited) {
            departmentFilter.dataset.inited = '1';
            departmentFilter.innerHTML = '<option value="">全部院系</option>' + this.departmentsData.map(d => `<option value="${d.id}">${d.departmentName}</option>`).join('');
        }
        if (typeFilter && !typeFilter.dataset.inited) {
            typeFilter.dataset.inited = '1';
            typeFilter.innerHTML = '<option value="">全部类型</option><option value="required">必修课</option><option value="elective">选修课</option><option value="practical">实践课</option>';
        }

        const filterDept = departmentFilter?.value || '';
        const filterType = typeFilter?.value || '';

        const rows = [];

        this.coursesData.filter(course => {
            if (filterDept && course.departmentId !== filterDept) return false;
            if (filterType && course.category !== filterType) return false;
            return true;
        }).forEach(course => {
            const teacher = dataManager.getUserById(course.teacherId);
            const department = this.departmentsData.find(d => d.id === course.departmentId);
            let schedule = null;
            for (let i = schedules.length - 1; i >= 0; i -= 1) {
                if (schedules[i].courseId === course.id) {
                    schedule = schedules[i];
                    break;
                }
            }
            const classroom = schedule ? this.classroomsData.find(c => c.id === schedule.classroomId) : null;
            const semesterName = schedule
                ? (this.semestersData.find(s => s.id === schedule.semesterId)?.name || '未知学期')
                : '待安排';

            const timeText = schedule ? this.formatScheduleTime(schedule) : '待安排';

            rows.push(`
                <tr>
                    <td>${course.courseCode}</td>
                    <td>${course.courseName}</td>
                    <td>${teacher ? teacher.name : '未指定'}</td>
                    <td>${department ? department.departmentName : '未知院系'}</td>
                    <td>${timeText}</td>
                    <td>${classroom ? `${classroom.building} ${classroom.roomNumber}` : '待安排'}</td>
                    <td>${course.currentStudents}/${course.maxStudents}</td>
                    <td>${semesterName}</td>
                    <td>
                        <button class="btn-sm btn-secondary" onclick="academicAdmin.editCourse('${course.id}')">编辑</button>
                    </td>
                </tr>
            `);
        });

        tbody.innerHTML = rows.join('') || '<tr><td colspan="9" style="text-align:center;opacity:.7;">暂无课程安排</td></tr>';
    }

    formatScheduleTime(schedule) {
        if (!schedule) return '待安排';
        const dayMap = {
            1: '周一',
            2: '周二',
            3: '周三',
            4: '周四',
            5: '周五',
            6: '周六',
            7: '周日'
        };
        const slotMap = {
            1: '第1-2节',
            2: '第3-4节',
            3: '第5-6节',
            4: '第7-8节',
            5: '第9-10节'
        };
        const dayKey = Number(schedule.day);
        const slotKey = Number(schedule.slot);
        const dayText = dayMap[dayKey] || (schedule.day ? `周${schedule.day}` : '待安排');
        const slotText = slotMap[slotKey] || (schedule.slot ? `第${schedule.slot}节` : '');
        return slotText ? `${dayText} ${slotText}` : dayText;
    }

    // 渲染成绩统计
    renderGrades() {
        const tbody = document.getElementById('gradeStatisticsBody');
        if (!tbody) return;

        const deptSelect = document.getElementById('gradeDepartmentFilter');
        if (deptSelect && !deptSelect.dataset.inited) {
            deptSelect.dataset.inited = '1';
            deptSelect.innerHTML = '<option value="">选择院系</option>' + this.departmentsData.map(d => `<option value="${d.id}">${d.departmentName}</option>`).join('');
        }

        const deptFilter = document.getElementById('gradeDepartmentFilter')?.value || '';

        const gradesForStats = this.getGradesForStats();
        const studentAvgMap = this.buildStudentAverageMap(gradesForStats);
        const courses = this.coursesData.filter(c => !deptFilter || c.departmentId === deptFilter);

        tbody.innerHTML = courses.map(course => {
            const teacher = dataManager.getUserById(course.teacherId);
            const students = dataManager.getCourseStudents(course.id);
            const courseGrades = gradesForStats.filter(g => g.courseId === course.id);
            const scores = courseGrades.map(g => g.totalScore).filter(score => typeof score === 'number');
            const mean = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
            const std = scores.length ? Math.sqrt(scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length) : 0;
            const average = scores.length ? (mean).toFixed(1) : '--';
            const excellentRate = scores.length ? ((scores.filter(s => s >= 90).length / scores.length) * 100).toFixed(1) : '--';
            const passRate = scores.length ? ((scores.filter(s => s >= 60).length / scores.length) * 100).toFixed(1) : '--';
            const studentCount = students.length || courseGrades.length;
            const anomalyFlags = this.getCourseAnomalyFlags(courseGrades, studentAvgMap);
            const anomalyText = anomalyFlags.length
                ? `<div class="anomaly-badges">${anomalyFlags.map(flag => {
                    const badgeClass = flag === '学生成绩异常' ? 'danger' : 'warning';
                    return `<span class="status-badge ${badgeClass}">${flag}</span>`;
                }).join('')}</div>`
                : '-';
            const rowClass = anomalyFlags.length ? 'grade-anomaly' : '';

            return `
                <tr class="${rowClass}">
                    <td>${course.courseCode}</td>
                    <td>${course.courseName}</td>
                    <td>${teacher ? teacher.name : '--'}</td>
                    <td>${studentCount || 0}</td>
                    <td>${average}</td>
                    <td>${excellentRate}%</td>
                    <td>${passRate}%</td>
                    <td>${scores.length ? std.toFixed(1) : '--'}</td>
                    <td>${anomalyText}</td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="9" style="text-align:center;opacity:.7;">暂无成绩数据</td></tr>';
    }

    getGradesForStats() {
        if (this.gradesData && this.gradesData.length) return this.gradesData;
        if (!this.mockGradesData) {
            this.mockGradesData = this.generateMockGrades();
        }
        return this.mockGradesData;
    }

    generateMockGrades() {
        const courses = this.coursesData || [];
        const students = (this.usersData || []).filter(u => u.userType === 'student');
        if (!courses.length || !students.length) return [];

        const enrollments = dataManager.getData('enrollments') || [];
        const semesterId = this.semestersData[0]?.id || '2024-1';
        const courseIndexMap = new Map(courses.map((course, index) => [course.id, index]));
        const studentIndexMap = new Map(students.map((student, index) => [student.id, index]));
        const fallbackPairs = [];

        if (!enrollments.length) {
            courses.slice(0, 4).forEach(course => {
                students.slice(0, 20).forEach(student => {
                    fallbackPairs.push({ courseId: course.id, studentId: student.id });
                });
            });
        }

        const pairs = enrollments.length ? enrollments : fallbackPairs;
        const grades = [];
        const now = Date.now();

        pairs.forEach((enrollment, idx) => {
            const courseId = enrollment.courseId;
            const studentId = enrollment.studentId;
            const courseIndex = courseIndexMap.get(courseId);
            const studentIndex = studentIndexMap.get(studentId);
            if (courseIndex === undefined || studentIndex === undefined) return;

            let score = 60 + ((courseIndex * 11 + studentIndex * 7) % 41);
            if (courseIndex === 0) {
                score = 90 + (studentIndex % 10);
            } else if (courseIndex === 1) {
                score = 42 + (studentIndex % 18);
            } else if (courseIndex === 2) {
                score = studentIndex % 3 === 0 ? 95 : (studentIndex % 3 === 1 ? 45 : score);
            }

            score = Math.max(35, Math.min(100, Math.round(score)));

            grades.push({
                id: dataManager.generateId(),
                studentId,
                courseId,
                courseName: courses[courseIndex]?.courseName || '',
                totalScore: score,
                gpa: Number(((score / 100) * 4.5).toFixed(2)),
                semester: semesterId,
                gradeTime: new Date(now - idx * 3600 * 1000).toISOString(),
                status: 'published'
            });
        });

        return grades;
    }

    buildStudentAverageMap(grades) {
        const studentScores = new Map();
        grades.forEach(g => {
            if (typeof g.totalScore !== 'number') return;
            if (!studentScores.has(g.studentId)) studentScores.set(g.studentId, []);
            studentScores.get(g.studentId).push(g.totalScore);
        });
        const avgMap = new Map();
        studentScores.forEach((scores, studentId) => {
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            avgMap.set(studentId, avg);
        });
        return avgMap;
    }

    getCourseAnomalyFlags(courseGrades, studentAvgMap) {
        const scores = courseGrades.map(g => g.totalScore).filter(score => typeof score === 'number');
        if (!scores.length) return [];
        const flags = [];
        const excellentRate = scores.filter(s => s >= 90).length / scores.length;
        const passRate = scores.filter(s => s >= 60).length / scores.length;
        if (excellentRate > 0.7) flags.push('优秀率偏高');
        if (passRate < 0.5) flags.push('及格率偏低');

        const anomalyCount = courseGrades.filter(g => {
            const avg = studentAvgMap.get(g.studentId);
            if (typeof avg !== 'number') return false;
            return Math.abs(g.totalScore - avg) >= 20;
        }).length;
        const threshold = Math.max(3, Math.ceil(courseGrades.length * 0.3));
        if (anomalyCount >= threshold) {
            flags.push('学生成绩异常');
        }
        return flags;
    }

    // 计算院系成绩统计
    calculateDepartmentGradeStats() {
        const grades = this.getGradesForStats();
        return this.departmentsData.map(dept => {
            const deptCourses = this.coursesData.filter(c => c.departmentId === dept.id);
            const deptGrades = grades.filter(g => {
                if (g.courseId) {
                    return deptCourses.some(c => c.id === g.courseId);
                }
                if (!g.assignmentScores) return false;
                return g.assignmentScores.some(score => {
                    const assignment = dataManager.getData('assignments').find(a => a.id === score.assignmentId);
                    return assignment && deptCourses.some(c => c.id === assignment.courseId);
                });
            });

            if (deptGrades.length === 0) {
                return {
                    departmentId: dept.id,
                    departmentName: dept.departmentName,
                    totalStudents: 0,
                    averageScore: 0,
                    excellentRate: 0,
                    passRate: 0,
                    averageGPA: 0
                };
            }

            const scores = deptGrades.map(g => g.totalScore);
            const excellentCount = scores.filter(s => s >= 90).length;
            const passCount = scores.filter(s => s >= 60).length;
            const averageScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
            const averageGPA = (deptGrades.reduce((sum, g) => sum + g.gpa, 0) / deptGrades.length).toFixed(2);

            return {
                departmentId: dept.id,
                departmentName: dept.departmentName,
                totalStudents: deptGrades.length,
                averageScore,
                excellentRate: ((excellentCount / scores.length) * 100).toFixed(1),
                passRate: ((passCount / scores.length) * 100).toFixed(1),
                averageGPA
            };
        });
    }

    // 渲染成绩审核
    renderAudit() {
        // 当前tab：pending/approved/rejected
        if (!this.currentAuditTab) this.currentAuditTab = 'pending';

        const tabBtns = document.querySelectorAll('#audit .audit-tabs .tab-btn');
        tabBtns.forEach(btn => {
            btn.onclick = () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentAuditTab = btn.dataset.tab || 'pending';
                this.renderAudit();
            };
        });

        const body = document.getElementById('auditTableBody');
        const anomalyList = document.getElementById('anomalyList');
        if (!body) return;

        const statuses = {
            pending: ['submitted', 'pending'],
            approved: ['published', 'approved'],
            rejected: ['rejected']
        };
        const wanted = statuses[this.currentAuditTab] || statuses.pending;

        const allGrades = dataManager.getData('grades') || [];
        const grades = allGrades.filter(g => wanted.includes(g.status));

        // 聚合：courseId + semester
        const groups = new Map();
        grades.forEach(g => {
            const key = `${g.courseId}__${g.semester || ''}`;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(g);
        });

        const rows = [];
        const anomalies = [];
        const studentAnomalies = [];

        // 学生维度异常：与个人平均分偏差过大
        const studentScoreMap = new Map();
        allGrades.forEach(g => {
            if (typeof g.totalScore !== 'number') return;
            if (!studentScoreMap.has(g.studentId)) studentScoreMap.set(g.studentId, []);
            studentScoreMap.get(g.studentId).push(g.totalScore);
        });
        const studentAvgMap = new Map();
        studentScoreMap.forEach((scores, studentId) => {
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            studentAvgMap.set(studentId, avg);
        });

        for (const [key, list] of groups.entries()) {
            const [courseId, semesterId] = key.split('__');
            const course = this.coursesData.find(c => c.id === courseId);
            const teacher = course ? dataManager.getUserById(course.teacherId) : null;

            const scores = list.map(x => Number(x.totalScore ?? 0));
            const n = scores.length;
            const excellent = scores.filter(s => s >= 90).length;
            const passed = scores.filter(s => s >= 60).length;
            const excellentRate = n ? (excellent / n) : 0;
            const passRate = n ? (passed / n) : 0;

            const flags = [];
            if (excellentRate > 0.7) flags.push('优秀率偏高');
            if (passRate < 0.5) flags.push('及格率偏低');

            if (flags.length) {
                anomalies.push({
                    courseName: course ? course.courseName : courseId,
                    semesterId,
                    flags
                });
            }

            const time = list.map(x => x.submittedAt || x.updatedAt || x.gradeTime || x.createdAt).filter(Boolean).sort().pop();

            rows.push(`
                <tr>
                    <td><input type="checkbox" class="audit-select" data-key="${key}"></td>
                    <td>${course ? course.courseId : '-'}</td>
                    <td>${course ? course.courseName : '未知课程'}</td>
                    <td>${teacher ? teacher.name : '-'}</td>
                    <td>${n}</td>
                    <td>${(excellentRate * 100).toFixed(1)}%</td>
                    <td>${(passRate * 100).toFixed(1)}%</td>
                    <td>${flags.length ? `<span class="status-badge warning">${flags.join('、')}</span>` : '-'}</td>
                    <td>${time ? new Date(time).toLocaleString() : '-'}</td>
                    <td>
                        <button class="btn-success btn-sm" onclick="academicAdmin.approveGradeSet('${key}')">通过</button>
                        <button class="btn-danger btn-sm" onclick="academicAdmin.rejectGradeSet('${key}')">拒绝</button>
                    </td>
                </tr>
            `);

            // 学生维度异常（针对当前课程）
            list.forEach(g => {
                const avg = studentAvgMap.get(g.studentId);
                if (typeof avg !== 'number') return;
                if (Math.abs(g.totalScore - avg) >= 20) {
                    const student = dataManager.getUserById(g.studentId);
                    studentAnomalies.push({
                        name: student ? student.name : g.studentId,
                        courseName: course ? course.courseName : courseId,
                        diff: Math.round(g.totalScore - avg)
                    });
                }
            });
        }

        body.innerHTML = rows.join('') || `<tr><td colspan="10" style="text-align:center;opacity:.7;">暂无记录</td></tr>`;

        // 异常列表
        if (anomalyList) {
            const courseAnomalies = anomalies.slice(0, 6).map(a => `
                <div class="anomaly-item">
                    <div class="anomaly-title">${a.courseName}${a.semesterId ? `（${a.semesterId}）` : ''}</div>
                    <div class="anomaly-desc">${a.flags.join('、')}</div>
                </div>
            `).join('');
            const studentItems = studentAnomalies.slice(0, 6).map(a => `
                <div class="anomaly-item">
                    <div class="anomaly-title">${a.name} - ${a.courseName}</div>
                    <div class="anomaly-desc">成绩波动 ${a.diff > 0 ? '+' : ''}${a.diff} 分</div>
                </div>
            `).join('');
            anomalyList.innerHTML = (courseAnomalies + studentItems) || '<div style="opacity:.7;">暂无异常</div>';
        }

        // 选择/批量按钮
        const selectAll = document.getElementById('selectAll');
        if (selectAll && !selectAll.dataset.inited) {
            selectAll.dataset.inited = '1';
            selectAll.addEventListener('change', () => {
                document.querySelectorAll('.audit-select').forEach(cb => cb.checked = selectAll.checked);
            });
        }

        const batchApproveBtn = document.getElementById('batchApproveBtn');
        const batchRejectBtn = document.getElementById('batchRejectBtn');
        if (batchApproveBtn && !batchApproveBtn.dataset.inited) {
            batchApproveBtn.dataset.inited = '1';
            batchApproveBtn.addEventListener('click', () => this.batchUpdateAudit('approve'));
        }
        if (batchRejectBtn && !batchRejectBtn.dataset.inited) {
            batchRejectBtn.dataset.inited = '1';
            batchRejectBtn.addEventListener('click', () => this.batchUpdateAudit('reject'));
        }
    }

    batchUpdateAudit(action) {
        const keys = Array.from(document.querySelectorAll('.audit-select:checked')).map(cb => cb.dataset.key).filter(Boolean);
        if (!keys.length) {
            alert('请选择要操作的记录');
            return;
        }
        const ok = confirm(`确定要批量${action === 'approve' ? '通过' : '拒绝'}选中的 ${keys.length} 个课程成绩吗？`);
        if (!ok) return;
        keys.forEach(k => action === 'approve' ? this.approveGradeSet(k) : this.rejectGradeSet(k));
    }

    approveGradeSet(groupKey) {
        this.updateGradeSetStatus(groupKey, 'published');
        alert('已通过并发布成绩（学生可见）');
        this.renderAudit();
    }

    rejectGradeSet(groupKey) {
        this.updateGradeSetStatus(groupKey, 'rejected');
        alert('已拒绝成绩提交');
        this.renderAudit();
    }

    updateGradeSetStatus(groupKey, status) {
        const [courseId, semesterId] = groupKey.split('__');
        const grades = dataManager.getData('grades') || [];
        const now = new Date().toISOString();
        grades.forEach(g => {
            if (g.courseId === courseId && String(g.semester || '') === String(semesterId || '')) {
                // 仅更新提交态的记录
                if (['submitted', 'pending', 'published', 'rejected', 'approved'].includes(g.status)) {
                    g.status = status;
                    g.updatedAt = now;
                }
            }
        });
        dataManager.setData('grades', grades);
        dataManager.addLog?.(this.userData?.id || 'academicAdmin', 'grade_audit', `${status} ${courseId} ${semesterId}`);
        this.gradesData = grades;
    }


    // 渲染个人信息
    renderProfile() {
        const user = this.userData;
        if (!user) return;
        document.getElementById('profileName') && (document.getElementById('profileName').textContent = user.name || user.username);
        document.getElementById('profileDepartment') && (document.getElementById('profileDepartment').textContent = `${user.office || '教务处'} · 教学管理员`);
        document.getElementById('profileAdminId') && (document.getElementById('profileAdminId').textContent = user.username || '--');
        document.getElementById('profileAdminName') && (document.getElementById('profileAdminName').textContent = user.name || '--');
        document.getElementById('profileAdminDept') && (document.getElementById('profileAdminDept').textContent = user.office || '教务处');
        document.getElementById('profileAdminTitle') && (document.getElementById('profileAdminTitle').textContent = '教学管理员');
        document.getElementById('profileEmail') && (document.getElementById('profileEmail').textContent = user.email || '--');
        document.getElementById('profilePhone') && (document.getElementById('profilePhone').textContent = user.phone || '--');
        document.getElementById('profileOffice') && (document.getElementById('profileOffice').textContent = user.office || '--');
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

    showAddProgramModal() {
        this.openActionModal({
            title: '创建培养方案',
            centerButtons: true,
            buttonOrder: ['confirm', 'cancel', 'draft'],
            extraButtons: [
                {
                    key: 'draft',
                    label: '存草稿',
                    className: 'btn-archive',
                    requireValidation: true,
                    onClick: (values) => {
                        const program = {
                            id: dataManager.generateId(),
                            name: values.programName || '未命名培养方案',
                            departmentId: values.programDept || this.departmentsData[0]?.id || '',
                            major: values.programMajor || '',
                            degree: values.programDegree || '本科',
                            duration: parseInt(values.programDuration, 10) || 4,
                            totalCredits: parseInt(values.programCredits, 10) || 0,
                            courses: values.programCourses || [],
                            status: 'draft',
                            version: new Date().getFullYear().toString(),
                            createdAt: new Date().toISOString()
                        };
                        const programs = dataManager.getData('programs') || [];
                        programs.push(program);
                        dataManager.setData('programs', programs);
                        this.loadAdminData();
                        this.renderPrograms();
                        showMessage('培养方案已存为草稿', 'success');
                    }
                }
            ],
            fields: [
                { id: 'programName', label: '培养方案名称', type: 'text', required: true },
                { id: 'programMajor', label: '专业名称', type: 'text', required: true },
                { id: 'programDegree', label: '学位层次', type: 'select', required: true, options: [
                    { value: '本科', label: '本科' },
                    { value: '硕士', label: '硕士' },
                    { value: '博士', label: '博士' }
                ]},
                { id: 'programDuration', label: '学制（年）', type: 'number', required: true, value: 4 },
                { id: 'programCredits', label: '总学分', type: 'number', required: true, value: 160 },
                { id: 'programDept', label: '所属院系', type: 'select', required: true, options: this.departmentsData.map(d => ({
                    value: d.id,
                    label: d.departmentName
                }))},
                { id: 'programCourses', label: '课程列表', type: 'multiselect', required: false, options: this.coursesData.map(c => ({
                    value: c.id,
                    label: `${c.courseCode} ${c.courseName}`
                }))}
            ],
            onConfirm: (values) => {
                const program = {
                    id: dataManager.generateId(),
                    name: values.programName,
                    departmentId: values.programDept,
                    major: values.programMajor,
                    degree: values.programDegree,
                    duration: parseInt(values.programDuration, 10) || 4,
                    totalCredits: parseInt(values.programCredits, 10) || 160,
                    courses: values.programCourses || [],
                    status: 'active',
                    version: new Date().getFullYear().toString(),
                    createdAt: new Date().toISOString()
                };
                const programs = dataManager.getData('programs') || [];
                programs.push(program);
                dataManager.setData('programs', programs);
                this.loadAdminData();
                this.renderPrograms();
                showMessage('培养方案已创建', 'success');
            }
        });
    }

    showAddStudentModal() {
        if (!this.classesData.length) {
            showMessage('请先创建班级', 'warning');
            return;
        }
        this.openActionModal({
            title: '新增学生',
            centerButtons: true,
            buttonOrder: ['confirm', 'cancel'],
            fields: [
                { id: 'studentUsername', label: '学号', type: 'text', required: true },
                { id: 'studentName', label: '姓名', type: 'text', required: true },
                { id: 'studentClass', label: '班级', type: 'select', required: true, options: this.classesData.map(c => ({
                    value: c.id,
                    label: c.className
                }))},
                { id: 'studentMajor', label: '专业', type: 'text', required: false },
                { id: 'studentEmail', label: '邮箱', type: 'email', required: false },
                { id: 'studentPhone', label: '电话', type: 'text', required: false }
            ],
            onConfirm: (values) => {
                const cls = this.classesData.find(c => c.id === values.studentClass);
                const result = dataManager.createUser({
                    username: values.studentUsername,
                    name: values.studentName,
                    userType: 'student',
                    email: values.studentEmail || '',
                    initialPassword: `${values.studentUsername}123`,
                    requirePasswordChange: false,
                    createdBy: this.userData?.id,
                    extra: {
                        classId: values.studentClass,
                        grade: cls?.grade || '',
                        major: values.studentMajor || cls?.major || '',
                        phone: values.studentPhone || ''
                    }
                });

                if (!result.success) {
                    showMessage(result.message || '新增学生失败', 'error');
                    return;
                }

                this.loadAdminData();
                this.renderStudents();
                showMessage(`学生已新增，初始密码为 ${values.studentUsername}123`, 'success');
            }
        });
    }

    showAddTeacherModal() {
        if (!this.departmentsData.length) {
            showMessage('请先配置院系信息', 'warning');
            return;
        }
        this.openActionModal({
            title: '新增教师',
            centerButtons: true,
            buttonOrder: ['confirm', 'cancel'],
            fields: [
                { id: 'teacherUsername', label: '工号', type: 'text', required: true },
                { id: 'teacherName', label: '姓名', type: 'text', required: true },
                { id: 'teacherTitle', label: '职称', type: 'select', required: true, options: [
                    { value: '教授', label: '教授' },
                    { value: '副教授', label: '副教授' },
                    { value: '讲师', label: '讲师' },
                    { value: '助教', label: '助教' }
                ]},
                { id: 'teacherDepartment', label: '所属院系', type: 'select', required: true, options: this.departmentsData.map(d => ({
                    value: d.id,
                    label: d.departmentName
                }))},
                { id: 'teacherEmail', label: '邮箱', type: 'email', required: false },
                { id: 'teacherPhone', label: '电话', type: 'text', required: false },
                { id: 'teacherOffice', label: '办公室', type: 'text', required: false }
            ],
            onConfirm: (values) => {
                const result = dataManager.createUser({
                    username: values.teacherUsername,
                    name: values.teacherName,
                    userType: 'teacher',
                    email: values.teacherEmail || '',
                    initialPassword: `${values.teacherUsername}123`,
                    requirePasswordChange: false,
                    createdBy: this.userData?.id,
                    extra: {
                        title: values.teacherTitle,
                        departmentId: values.teacherDepartment,
                        office: values.teacherOffice || '',
                        phone: values.teacherPhone || ''
                    }
                });

                if (!result.success) {
                    showMessage(result.message || '新增教师失败', 'error');
                    return;
                }

                this.loadAdminData();
                this.renderTeachers();
                showMessage(`教师已新增，初始密码为 ${values.teacherUsername}123`, 'success');
            }
        });
    }

    showAddClassModal() {
        this.openActionModal({
            title: '创建班级',
            centerButtons: true,
            buttonOrder: ['confirm', 'cancel'],
            fields: [
                { id: 'className', label: '班级名称', type: 'text', required: true },
                { id: 'classDept', label: '所属院系', type: 'select', required: true, options: this.departmentsData.map(d => ({
                    value: d.id,
                    label: d.departmentName
                })) },
                { id: 'classGrade', label: '年级（如2024）', type: 'text', required: true },
                { id: 'classMajor', label: '专业名称', type: 'text', required: true },
                { id: 'classHeadTeacher', label: '班主任', type: 'text', required: false }
            ],
            onConfirm: (values) => {
                const cls = {
                    id: dataManager.generateId(),
                    className: values.className,
                    departmentId: values.classDept,
                    grade: values.classGrade,
                    major: values.classMajor,
                    headTeacher: values.classHeadTeacher || '',
                    studentCount: 0
                };
                const classes = dataManager.getData('classes') || [];
                classes.push(cls);
                dataManager.setData('classes', classes);
                this.loadAdminData();
                this.renderClasses();
                showMessage('班级已创建', 'success');
            }
        });
    }

    showAddSemesterModal() {
        this.openActionModal({
            title: '创建学期',
            fields: [
                { id: 'semesterName', label: '学期名称', type: 'text', required: true },
                { id: 'semesterStart', label: '开始日期', type: 'date', required: true },
                { id: 'semesterEnd', label: '结束日期', type: 'date', required: true },
                { id: 'semesterStatus', label: '学期状态', type: 'select', required: true, options: [
                    { value: 'upcoming', label: '即将开始' },
                    { value: 'active', label: '进行中' },
                    { value: 'completed', label: '已结束' }
                ]}
            ],
            onConfirm: (values) => {
                const semester = {
                    id: `${new Date().getFullYear()}-${Math.floor(Math.random() * 9) + 1}`,
                    name: values.semesterName,
                    startDate: values.semesterStart,
                    endDate: values.semesterEnd,
                    status: values.semesterStatus
                };
                const semesters = dataManager.getData('semesters') || [];
                semesters.push(semester);
                dataManager.setData('semesters', semesters);
                this.loadAdminData();
                this.renderSemesters();
                showMessage('学期已创建', 'success');
            }
        });
    }

    showScheduleCourseModal() {
        if (!this.coursesData.length) {
            showMessage('暂无课程可安排', 'warning');
            return;
        }
        if (!this.semestersData.length) {
            showMessage('请先创建学期', 'warning');
            return;
        }
        if (!this.classroomsData.length) {
            showMessage('请先添加教室', 'warning');
            return;
        }
        this.openActionModal({
            title: '安排课程',
            fields: [
                { id: 'scheduleCourse', label: '课程', type: 'select', required: true, options: this.coursesData.map(c => ({
                    value: c.id,
                    label: `${c.courseCode} ${c.courseName}`
                }))},
                { id: 'scheduleSemester', label: '学期', type: 'select', required: true, options: this.semestersData.map(s => ({
                    value: s.id,
                    label: s.name
                }))},
                { id: 'scheduleDay', label: '周几', type: 'select', required: true, options: [
                    { value: '1', label: '周一' },
                    { value: '2', label: '周二' },
                    { value: '3', label: '周三' },
                    { value: '4', label: '周四' },
                    { value: '5', label: '周五' }
                ]},
                { id: 'scheduleSlot', label: '节次', type: 'select', required: true, options: [
                    { value: '1', label: '第1-2节' },
                    { value: '2', label: '第3-4节' },
                    { value: '3', label: '第5-6节' },
                    { value: '4', label: '第7-8节' },
                    { value: '5', label: '第9-10节' }
                ]},
                { id: 'scheduleRoom', label: '教室', type: 'select', required: true, options: this.classroomsData.map(r => ({
                    value: r.id,
                    label: `${r.building} ${r.roomNumber}`
                }))}
            ],
            onConfirm: (values) => {
                const course = this.coursesData.find(c => c.id === values.scheduleCourse);
                const schedule = {
                    id: dataManager.generateId(),
                    semesterId: values.scheduleSemester,
                    courseId: values.scheduleCourse,
                    teacherId: course?.teacherId || '',
                    classId: '',
                    day: parseInt(values.scheduleDay, 10) || 1,
                    slot: parseInt(values.scheduleSlot, 10) || 1,
                    classroomId: values.scheduleRoom
                };
                const schedules = dataManager.getData('schedules') || [];
                schedules.push(schedule);
                dataManager.setData('schedules', schedules);
                this.loadAdminData();
                this.renderCourses();
                showMessage('已添加课程安排', 'success');
            }
        });
    }

    showAddClassroomModal() {
        this.openActionModal({
            title: '添加教室',
            fields: [
                { id: 'roomBuilding', label: '教学楼', type: 'text', required: true },
                { id: 'roomNumber', label: '教室号', type: 'text', required: true },
                { id: 'roomCapacity', label: '容量', type: 'number', required: true, value: 60 },
                { id: 'roomType', label: '教室类型', type: 'select', required: true, options: [
                    { value: 'lecture', label: '讲座教室' },
                    { value: 'lab', label: '实验室' },
                    { value: 'computer', label: '机房' }
                ]}
            ],
            onConfirm: (values) => {
                const classrooms = dataManager.getData('classrooms') || [];
                classrooms.push({
                    id: dataManager.generateId(),
                    building: values.roomBuilding,
                    roomNumber: values.roomNumber,
                    capacity: parseInt(values.roomCapacity, 10) || 60,
                    type: values.roomType
                });
                dataManager.setData('classrooms', classrooms);
                this.loadAdminData();
                this.renderClassrooms();
                showMessage('教室已添加', 'success');
            }
        });
    }

    showAddScheduleModal() {
        this.generateSchedule();
    }

    showAuditGradesModal() {
        showMessage('批量审核功能正在开发中...', 'info');
    }

    exportReports() {
        const rows = [
            ['课程编号', '课程名称', '平均成绩', '优秀率', '及格率'],
            ...this.coursesData.map(course => {
                const stats = dataManager.getCourseGradeStats(course.id);
                return [course.courseCode, course.courseName, stats?.average || '--', stats?.excellentRate || '--', stats?.passRate || '--'];
            })
        ];
        this.downloadText(`grade_report_${Date.now()}.csv`, rows.map(r => r.map(this.escapeCSV).join(',')).join('\n'));
        showMessage('报表已导出', 'success');
    }

    importProgram() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        input.addEventListener('change', () => {
            const file = input.files?.[0];
            if (!file) return;
            const name = file.name.toLowerCase();
            if (!name.endsWith('.csv')) {
                showMessage('仅支持CSV文件导入', 'warning');
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                const text = String(reader.result || '');
                const rows = this.parseCSV(text);
                if (!rows.length) {
                    showMessage('未检测到有效数据，请检查CSV内容', 'warning');
                    return;
                }

                const normalizeKey = (key) => String(key || '').replace(/^\ufeff/, '').trim();
                const normalizeValue = (value) => String(value || '').trim();
                const getField = (row, keys) => {
                    for (const key of keys) {
                        const value = row[key];
                        if (value) return value;
                    }
                    return '';
                };
                const parseNumber = (value) => {
                    const parsed = parseFloat(String(value || '').replace(/[^\d.]/g, ''));
                    return Number.isFinite(parsed) ? parsed : null;
                };
                const mapStatus = (value) => {
                    const text = String(value || '').toLowerCase();
                    if (!text) return 'active';
                    if (text.includes('草稿') || text.includes('draft')) return 'draft';
                    if (text.includes('归档') || text.includes('archived')) return 'archived';
                    if (text.includes('生效') || text.includes('执行') || text.includes('active')) return 'active';
                    return 'active';
                };

                const programs = dataManager.getData('programs') || [];
                const created = [];
                const failed = [];
                let missingCourseCount = 0;

                rows.forEach((rawRow, index) => {
                    const normalizedRow = {};
                    Object.keys(rawRow).forEach((key) => {
                        const normalizedKey = normalizeKey(key);
                        const normalizedValue = normalizeValue(rawRow[key]);
                        normalizedRow[normalizedKey] = normalizedValue;
                        if (normalizedKey.toLowerCase() !== normalizedKey) {
                            normalizedRow[normalizedKey.toLowerCase()] = normalizedValue;
                        }
                    });

                    const nameValue = getField(normalizedRow, ['培养方案名称', '方案名称', 'name', 'programname']);
                    const deptValue = getField(normalizedRow, ['所属院系', '院系', '学院', 'department', 'departmentname', 'departmentid']);
                    const majorValue = getField(normalizedRow, ['专业名称', '专业', 'major']);
                    const degreeValue = getField(normalizedRow, ['学位层次', '学位', 'degree']);
                    const durationValue = getField(normalizedRow, ['学制', '学制(年)', '学制（年）', 'duration']);
                    const creditsValue = getField(normalizedRow, ['总学分', '学分', 'totalcredits']);
                    const coursesValue = getField(normalizedRow, ['课程列表', '课程', 'courses', 'courselist']);
                    const statusValue = getField(normalizedRow, ['状态', 'status']);
                    const versionValue = getField(normalizedRow, ['版本', 'version']);

                    const duration = parseNumber(durationValue);
                    const totalCredits = parseNumber(creditsValue);

                    const department = this.departmentsData.find(d => d.id === deptValue)
                        || this.departmentsData.find(d => d.departmentName === deptValue)
                        || this.departmentsData.find(d => d.departmentName.includes(deptValue));

                    if (!nameValue || !majorValue || !degreeValue || !department || duration === null || totalCredits === null) {
                        failed.push({ index: index + 2, reason: '必填字段缺失' });
                        return;
                    }

                    const courseTokens = String(coursesValue || '')
                        .split(/[;；|、/]/)
                        .map(token => token.trim())
                        .filter(Boolean);
                    const courseIds = [];
                    courseTokens.forEach(token => {
                        const course = this.coursesData.find(c => c.id === token)
                            || this.coursesData.find(c => c.courseCode === token)
                            || this.coursesData.find(c => c.courseName === token);
                        if (course) {
                            courseIds.push(course.id);
                        } else {
                            missingCourseCount += 1;
                        }
                    });

                    created.push({
                        id: dataManager.generateId(),
                        name: nameValue,
                        departmentId: department.id,
                        major: majorValue,
                        degree: degreeValue,
                        duration: Math.round(duration),
                        totalCredits: Math.round(totalCredits),
                        courses: courseIds,
                        status: mapStatus(statusValue),
                        version: versionValue || new Date().getFullYear().toString(),
                        createdAt: new Date().toISOString()
                    });
                });

                if (created.length) {
                    const nextPrograms = programs.concat(created);
                    dataManager.setData('programs', nextPrograms);
                    this.loadAdminData();
                    this.renderPrograms();
                }

                showMessage(`导入完成：成功 ${created.length}，失败 ${failed.length}`, created.length ? 'success' : 'warning');
                if (missingCourseCount > 0) {
                    showMessage(`有 ${missingCourseCount} 条课程未匹配，已忽略`, 'warning');
                }
                if (!created.length && failed.length) {
                    showMessage('请确保包含：培养方案名称、所属院系、专业名称、学位层次、学制、总学分', 'info');
                }
            };
            reader.readAsText(file, 'utf-8');
        });
        input.click();
    }

    batchImportStudents() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv,.xls,.xlsx';
        input.addEventListener('change', () => {
            const file = input.files?.[0];
            if (!file) return;
            const name = file.name.toLowerCase();
            if (name.endsWith('.csv')) {
                const reader = new FileReader();
                reader.onload = () => {
                    const text = String(reader.result || '');
                    const rows = this.parseCSV(text);
                    const result = dataManager.importStudents(rows, { requirePasswordChange: true, createdBy: this.userData?.id });
                    showMessage(`导入完成：成功 ${result.created.length}，失败 ${result.failed.length}`, 'success');
                    this.loadAdminData();
                    this.renderClasses();
                    this.renderStudents();
                    if (result.failed.length) {
                        const details = result.failed.slice(0, 20).map(item => `第${item.row}行：${item.reason}`).join('\n');
                        alert(`导入失败明细（最多展示20条）：\n${details}`);
                        if (result.failed.length > 20) {
                            showMessage('失败记录超过20条，请检查源文件内容', 'warning');
                        }
                    }
                };
                reader.readAsText(file, 'utf-8');
            } else {
                showMessage('暂仅支持CSV导入，请转换格式', 'warning');
            }
        });
        input.click();
    }

    batchImportTeachers() {
        if (!this.departmentsData.length) {
            showMessage('请先配置院系信息', 'warning');
            return;
        }
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        input.addEventListener('change', () => {
            const file = input.files?.[0];
            if (!file) return;
            const name = file.name.toLowerCase();
            if (!name.endsWith('.csv')) {
                showMessage('暂仅支持CSV导入，请转换格式', 'warning');
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                const text = String(reader.result || '');
                const rows = this.parseCSV(text);
                if (!rows.length) {
                    showMessage('未解析到有效数据', 'warning');
                    return;
                }

                const created = [];
                const failed = [];

                rows.forEach((row, idx) => {
                    const teacherNo = String(row.teacherNo || row.工号 || row.teacher_id || row.username || '').trim();
                    const nameValue = String(row.name || row.姓名 || '').trim();
                    const titleValue = String(row.title || row.职称 || '').trim();
                    const departmentValue = String(row.department || row.院系 || row.学院 || row.departmentName || '').trim();
                    const emailValue = String(row.email || row.邮箱 || '').trim();
                    const statusText = String(row.status || row.状态 || '').trim();

                    if (!teacherNo || !nameValue || !departmentValue) {
                        failed.push({ row: idx + 2, reason: '缺少工号/姓名/院系' });
                        return;
                    }

                    const department = this.departmentsData.find(d => d.id === departmentValue)
                        || this.departmentsData.find(d => d.departmentName === departmentValue)
                        || this.departmentsData.find(d => d.departmentName.includes(departmentValue));

                    if (!department) {
                        failed.push({ row: idx + 2, reason: '未匹配到院系' });
                        return;
                    }

                    const status = statusText.includes('锁') ? 'locked' : (statusText.includes('未') ? 'inactive' : 'active');
                    const result = dataManager.createUser({
                        username: teacherNo,
                        name: nameValue,
                        userType: 'teacher',
                        email: emailValue,
                        status,
                        initialPassword: `${teacherNo}123`,
                        requirePasswordChange: false,
                        createdBy: this.userData?.id,
                        extra: {
                            title: titleValue || '讲师',
                            departmentId: department.id,
                            office: '',
                            phone: ''
                        }
                    });

                    if (result.success) {
                        created.push(result.user);
                    } else {
                        failed.push({ row: idx + 2, reason: result.message || '创建失败' });
                    }
                });

                showMessage(`导入完成：成功 ${created.length}，失败 ${failed.length}`, created.length ? 'success' : 'warning');
                this.loadAdminData();
                this.renderTeachers();
                if (failed.length) {
                    const details = failed.slice(0, 20).map(item => `第${item.row}行：${item.reason}`).join('\n');
                    alert(`导入失败明细（最多展示20条）：\n${details}`);
                    if (failed.length > 20) {
                        showMessage('失败记录超过20条，请检查源文件内容', 'warning');
                    }
                }
            };
            reader.readAsText(file, 'utf-8');
        });
        input.click();
    }

    auditGrade(gradeId) {
        this.switchPage('audit');
    }

    processSchedule(scheduleId) {
        showMessage(`处理课表功能正在开发中: ${scheduleId}`, 'info');
    }

    viewProgram(programId) {
        const program = this.programsData.find(p => p.id === programId);
        if (!program) return;
        const department = this.departmentsData.find(d => d.id === program.departmentId);
        const courseNames = (program.courses || []).map(courseId => {
            const course = this.coursesData.find(c => c.id === courseId);
            return course ? `${course.courseCode} ${course.courseName}` : courseId;
        }).join('，');
        const statusMap = {
            active: '生效中',
            archived: '已归档',
            draft: '草稿'
        };

        this.openActionModal({
            title: '培养方案详情',
            confirmText: '关闭',
            hideCancel: true,
            fields: [
                { id: 'programName', label: '培养方案名称', type: 'text', value: program.name, readOnly: true },
                { id: 'programDept', label: '所属院系', type: 'text', value: department ? department.departmentName : '--', readOnly: true },
                { id: 'programMajor', label: '专业名称', type: 'text', value: program.major, readOnly: true },
                { id: 'programDegree', label: '学位层次', type: 'text', value: program.degree, readOnly: true },
                { id: 'programDuration', label: '学制（年）', type: 'text', value: program.duration, readOnly: true },
                { id: 'programCredits', label: '总学分', type: 'text', value: program.totalCredits, readOnly: true },
                { id: 'programStatus', label: '状态', type: 'text', value: statusMap[program.status] || '生效中', readOnly: true },
                { id: 'programVersion', label: '版本', type: 'text', value: program.version, readOnly: true },
                { id: 'programCourses', label: '课程列表', type: 'text', value: courseNames || '暂无', readOnly: true }
            ],
            onConfirm: () => {}
        });
    }

    editProgram(programId) {
        const program = this.programsData.find(p => p.id === programId);
        if (!program) return;
        this.openActionModal({
            title: '编辑培养方案',
            centerButtons: true,
            buttonOrder: ['confirm', 'cancel'],
            fields: [
                { id: 'programName', label: '培养方案名称', type: 'text', required: true, value: program.name },
                { id: 'programDept', label: '所属院系', type: 'select', required: true, value: program.departmentId, options: this.departmentsData.map(d => ({
                    value: d.id,
                    label: d.departmentName
                })) },
                { id: 'programMajor', label: '专业名称', type: 'text', required: true, value: program.major },
                { id: 'programDegree', label: '学位层次', type: 'select', required: true, value: program.degree, options: [
                    { value: '本科', label: '本科' },
                    { value: '硕士', label: '硕士' },
                    { value: '博士', label: '博士' }
                ]},
                { id: 'programDuration', label: '学制（年）', type: 'number', required: true, value: program.duration },
                { id: 'programCredits', label: '总学分', type: 'number', required: true, value: program.totalCredits },
                { id: 'programStatus', label: '状态', type: 'select', required: true, value: program.status, options: [
                    { value: 'active', label: '生效中' },
                    { value: 'archived', label: '已归档' },
                    { value: 'draft', label: '草稿' }
                ]},
                { id: 'programVersion', label: '版本', type: 'text', required: true, value: program.version },
                { id: 'programCourses', label: '课程列表', type: 'multiselect', required: false, value: program.courses || [], options: this.coursesData.map(c => ({
                    value: c.id,
                    label: `${c.courseCode} ${c.courseName}`
                }))}
            ],
            onConfirm: (values) => {
                program.name = values.programName;
                program.departmentId = values.programDept;
                program.major = values.programMajor;
                program.degree = values.programDegree;
                program.duration = parseInt(values.programDuration, 10) || program.duration;
                program.totalCredits = parseInt(values.programCredits, 10) || program.totalCredits;
                program.status = values.programStatus;
                program.version = values.programVersion;
                program.courses = values.programCourses || [];
                dataManager.setData('programs', this.programsData);
                this.renderPrograms();
                showMessage('培养方案已更新', 'success');
            }
        });
    }

    exportProgram(programId) {
        const program = this.programsData.find(p => p.id === programId);
        if (!program) return;
        const department = this.departmentsData.find(d => d.id === program.departmentId);
        const courses = (program.courses || []).map(courseId => this.coursesData.find(c => c.id === courseId)).filter(Boolean);

        const headerRows = [
            ['字段', '值'],
            ['培养方案名称', program.name],
            ['所属院系', department ? department.departmentName : '--'],
            ['专业', program.major],
            ['学位层次', program.degree],
            ['学制', program.duration],
            ['总学分', program.totalCredits],
            ['状态', program.status],
            ['版本', program.version]
        ];

        const courseRows = [
            [],
            ['课程编号', '课程名称', '学分'],
            ...courses.map(c => [c.courseCode, c.courseName, c.credits])
        ];

        const csv = headerRows.concat(courseRows).map(row => row.map(this.escapeCSV).join(',')).join('\n');
        this.downloadText(`${program.name}_培养方案.csv`, csv);
        showMessage('培养方案已导出', 'success');
    }

    archiveProgram(programId) {
        const program = this.programsData.find(p => p.id === programId);
        if (!program) return;
        program.status = 'archived';
        dataManager.setData('programs', this.programsData);
        this.renderPrograms();
        showMessage('培养方案已归档', 'success');
    }

    unarchiveProgram(programId) {
        const program = this.programsData.find(p => p.id === programId);
        if (!program) return;
        program.status = 'active';
        dataManager.setData('programs', this.programsData);
        this.renderPrograms();
        showMessage('培养方案已取消归档', 'success');
    }

    activateProgram(programId) {
        const program = this.programsData.find(p => p.id === programId);
        if (!program) return;
        program.status = 'active';
        dataManager.setData('programs', this.programsData);
        this.renderPrograms();
        showMessage('培养方案已生效', 'success');
    }

    deleteProgram(programId) {
        const program = this.programsData.find(p => p.id === programId);
        if (!program) return;
        if (!confirm(`确定删除培养方案 "${program.name}" 吗？此操作不可撤销。`)) return;
        const programs = (dataManager.getData('programs') || []).filter(p => p.id !== programId);
        dataManager.setData('programs', programs);
        this.loadAdminData();
        this.renderPrograms();
        showMessage('培养方案已删除', 'success');
    }

    viewClassStudents(classId) {
        const cls = this.classesData.find(c => c.id === classId);
        if (!cls) return;
        const existing = document.getElementById('classStudentsModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'classStudentsModal';
        modal.className = 'modal active class-students-modal';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h3>${cls.className} · 学生管理</h3>
                    <button class="close">×</button>
                </div>
                <div class="modal-body">
                    <div class="modal-tabs">
                        <button class="tab-btn active" data-tab="current">当前学生</button>
                        <button class="tab-btn" data-tab="add">添加学生</button>
                    </div>
                    <div class="tab-panel active" data-panel="current">
                        <div class="student-search">
                            <input type="text" id="currentStudentSearch" placeholder="按学号或ID搜索学生">
                        </div>
                        <div class="student-list" id="currentStudentList"></div>
                    </div>
                    <div class="tab-panel" data-panel="add">
                        <div class="student-search">
                            <input type="text" id="studentSearchInput" placeholder="按学号或ID搜索学生">
                        </div>
                        <div class="student-list" id="addStudentList"></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const closeModal = () => modal.remove();
        modal.querySelector('.close')?.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        const renderCurrentStudents = () => {
            const users = dataManager.getData('users') || [];
            const keyword = (modal.querySelector('#currentStudentSearch')?.value || '').trim().toLowerCase();
            const currentStudents = users.filter(u => {
                if (u.userType !== 'student' || u.classId !== classId) return false;
                if (!keyword) return true;
                return (u.username || '').toLowerCase().includes(keyword)
                    || (u.id || '').toLowerCase().includes(keyword)
                    || (u.name || '').toLowerCase().includes(keyword);
            });
            const container = modal.querySelector('#currentStudentList');
            if (!container) return;
            if (!currentStudents.length) {
                container.innerHTML = '<div class="empty-state">暂无学生</div>';
                return;
            }
            container.innerHTML = currentStudents.map(student => `
                <div class="student-item">
                    <div class="student-main">
                        <div class="student-name">${student.name || '未命名'}</div>
                        <div class="student-meta">学号：${student.username || '--'} · ID：${student.id}</div>
                    </div>
                    <div class="student-actions">
                        <button class="btn-sm btn-danger" data-remove-student="${student.id}">移除</button>
                    </div>
                </div>
            `).join('');

            container.querySelectorAll('[data-remove-student]').forEach(button => {
                button.addEventListener('click', () => {
                    const studentId = button.getAttribute('data-remove-student');
                    const student = users.find(u => u.id === studentId);
                    if (!student) return;
                    this.confirmRemoveStudent(student, classId, () => {
                        renderCurrentStudents();
                        renderAddStudents();
                        this.renderClasses();
                    });
                });
            });
        };

        const renderAddStudents = () => {
            const users = dataManager.getData('users') || [];
            const keyword = (modal.querySelector('#studentSearchInput')?.value || '').trim().toLowerCase();
            const availableStudents = users.filter(u => {
                if (u.userType !== 'student') return false;
                if (u.classId === classId) return false;
                if (!keyword) return true;
                return (u.username || '').toLowerCase().includes(keyword) || (u.id || '').toLowerCase().includes(keyword);
            });

            const container = modal.querySelector('#addStudentList');
            if (!container) return;
            if (!availableStudents.length) {
                container.innerHTML = '<div class="empty-state">暂无可添加的学生</div>';
                return;
            }

            container.innerHTML = availableStudents.map(student => {
                const oldClassName = this.classesData.find(c => c.id === student.classId)?.className || '未分班';
                return `
                    <div class="student-item">
                        <div class="student-main">
                            <div class="student-name">${student.name || '未命名'}</div>
                            <div class="student-meta">学号：${student.username || '--'} · ID：${student.id}</div>
                            <div class="student-sub">当前班级：${oldClassName}</div>
                        </div>
                        <button class="btn-sm btn-primary" data-add-student="${student.id}">添加</button>
                    </div>
                `;
            }).join('');

            container.querySelectorAll('[data-add-student]').forEach(button => {
                button.addEventListener('click', () => {
                    const studentId = button.getAttribute('data-add-student');
                    const allUsers = dataManager.getData('users') || [];
                    const target = allUsers.find(u => u.id === studentId);
                    if (!target) return;
                    target.classId = classId;
                    dataManager.setData('users', allUsers);
                    this.loadAdminData();
                    renderCurrentStudents();
                    renderAddStudents();
                    this.renderClasses();
                    showMessage('学生已添加到当前班级', 'success');
                });
            });
        };

        modal.querySelector('#currentStudentSearch')?.addEventListener('input', renderCurrentStudents);
        modal.querySelector('#studentSearchInput')?.addEventListener('input', renderAddStudents);
        modal.querySelectorAll('.modal-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.querySelectorAll('.modal-tabs .tab-btn').forEach(b => b.classList.remove('active'));
                modal.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
                btn.classList.add('active');
                const target = btn.dataset.tab;
                modal.querySelector(`.tab-panel[data-panel="${target}"]`)?.classList.add('active');
            });
        });

        renderCurrentStudents();
        renderAddStudents();
    }

    confirmRemoveStudent(student, currentClassId, onFinish) {
        this.openActionModal({
            title: '移除学生',
            centerButtons: true,
            buttonOrder: ['confirm', 'cancel'],
            modalClass: 'transfer-modal',
            contentClass: 'center-note-modal',
            fields: [
                {
                    id: 'removeNote',
                    type: 'note',
                    tone: 'warning',
                    value: `确定将 ${student.name || student.username} 移出当前班级吗？`
                }
            ],
            onConfirm: () => {
                const targetClasses = this.classesData.filter(c => c.id !== currentClassId);
                if (!targetClasses.length) {
                    showMessage('暂无可选择的班级', 'warning');
                    return;
                }
                this.openActionModal({
                    title: '选择转入班级',
                    centerButtons: true,
                    buttonOrder: ['confirm', 'cancel'],
                    modalClass: 'transfer-modal',
                    fields: [
                        {
                            id: 'transferNote',
                            type: 'note',
                            tone: 'info',
                            value: '请选择要转入的班级'
                        },
                        {
                            id: 'targetClass',
                            label: '转入班级',
                            type: 'select',
                            required: true,
                            options: targetClasses.map(c => ({ value: c.id, label: c.className }))
                        }
                    ],
                    onConfirm: (values) => {
                        const users = dataManager.getData('users') || [];
                        const target = users.find(u => u.id === student.id);
                        if (!target) return;
                        target.classId = values.targetClass;
                        dataManager.setData('users', users);
                        this.loadAdminData();
                        onFinish?.();
                        const targetClassName = this.classesData.find(c => c.id === values.targetClass)?.className || '目标班级';
                        this.openActionModal({
                            title: '操作成功',
                            confirmText: '关闭',
                            hideCancel: true,
                            modalClass: 'transfer-modal',
                            contentClass: 'center-note-modal',
                            fields: [
                                {
                                    id: 'successNote',
                                    type: 'note',
                                    tone: 'success',
                                    value: `已将学生移入 ${targetClassName}`
                                }
                            ],
                            onConfirm: () => {}
                        });
                    }
                });
            }
        });
    }

    editClass(classId) {
        const cls = this.classesData.find(c => c.id === classId);
        if (!cls) return;
        this.openActionModal({
            title: '编辑班级',
            centerButtons: true,
            buttonOrder: ['confirm', 'cancel'],
            fields: [
                { id: 'className', label: '班级名称', type: 'text', required: true, value: cls.className },
                { id: 'classDept', label: '所属院系', type: 'select', required: true, value: cls.departmentId, options: this.departmentsData.map(d => ({
                    value: d.id,
                    label: d.departmentName
                })) },
                { id: 'classGrade', label: '年级（如2024）', type: 'text', required: true, value: cls.grade },
                { id: 'classMajor', label: '专业名称', type: 'text', required: true, value: cls.major },
                { id: 'classHeadTeacher', label: '班主任', type: 'text', required: false, value: cls.headTeacher || '' }
            ],
            onConfirm: (values) => {
                cls.className = values.className;
                cls.departmentId = values.classDept;
                cls.grade = values.classGrade;
                cls.major = values.classMajor;
                cls.headTeacher = values.classHeadTeacher || '';
                dataManager.setData('classes', this.classesData);
                this.renderClasses();
                showMessage('班级已更新', 'success');
            }
        });
    }

    deleteClass(classId) {
        const cls = this.classesData.find(c => c.id === classId);
        if (!cls) return;
        this.openActionModal({
            title: '删除班级',
            confirmText: '删除',
            cancelText: '取消',
            centerButtons: true,
            buttonOrder: ['confirm', 'cancel'],
            modalClass: 'transfer-modal',
            contentClass: 'center-note-modal',
            fields: [
                {
                    id: 'deleteNote',
                    type: 'note',
                    tone: 'warning',
                    value: `确定删除 ${cls.className} 吗？班级内学生将变为未分班。`
                }
            ],
            onConfirm: () => {
                const users = dataManager.getData('users') || [];
                users.forEach(user => {
                    if (user.userType === 'student' && user.classId === classId) {
                        user.classId = '';
                    }
                });
                dataManager.setData('users', users);
                this.classesData = this.classesData.filter(item => item.id !== classId);
                dataManager.setData('classes', this.classesData);
                this.renderClasses();
                this.renderStudents();
                showMessage('班级已删除，学生已移出班级', 'success');
            }
        });
    }

    manageClassSchedule(classId) {
        this.switchPage('schedules');
        const select = document.getElementById('scheduleStudentFilter');
        if (!select) return;
        const student = (dataManager.getData('users') || []).find(u => u.userType === 'student' && u.classId === classId);
        if (!student) {
            showMessage('该班级暂无学生可查看课表', 'info');
            return;
        }
        select.value = student.id;
        this.renderSchedules();
    }

    viewSemester(semesterId) {
        const semester = this.semestersData.find(s => s.id === semesterId);
        if (!semester) return;
        alert(`${semester.name}\n${semester.startDate} 至 ${semester.endDate}`);
    }

    editSemester(semesterId) {
        showMessage(`编辑学期功能正在开发中: ${semesterId}`, 'info');
    }

    manageSemesterCourses(semesterId) {
        this.switchPage('courses');
        this.renderCourses();
    }

    approveCourse(courseId) {
        dataManager.updateCourse(courseId, { status: 'published' });
        this.loadAdminData();
        this.renderCourses();
        showMessage('课程已审核发布', 'success');
    }

    editCourse(courseId) {
        const course = this.coursesData.find(c => c.id === courseId);
        if (!course) return;
        if (!this.semestersData.length) {
            showMessage('请先创建学期', 'warning');
            return;
        }
        if (!this.classroomsData.length) {
            showMessage('请先添加教室', 'warning');
            return;
        }

        const schedules = dataManager.getData('schedules') || [];
        let scheduleToEdit = null;
        for (let i = schedules.length - 1; i >= 0; i -= 1) {
            if (schedules[i].courseId === courseId) {
                scheduleToEdit = schedules[i];
                break;
            }
        }
        const defaultSemester = scheduleToEdit?.semesterId || this.semestersData[0]?.id || '';

        this.openActionModal({
            title: '编辑课程安排',
            centerButtons: true,
            buttonOrder: ['confirm', 'cancel'],
            fields: [
                { id: 'courseName', label: '课程名称', type: 'text', required: true, value: course.courseName || '' },
                { id: 'courseSemester', label: '学期', type: 'select', required: true, value: defaultSemester, options: this.semestersData.map(s => ({
                    value: s.id,
                    label: s.name
                }))},
                { id: 'courseDay', label: '周几', type: 'select', required: true, value: String(scheduleToEdit?.day || 1), options: [
                    { value: '1', label: '周一' },
                    { value: '2', label: '周二' },
                    { value: '3', label: '周三' },
                    { value: '4', label: '周四' },
                    { value: '5', label: '周五' }
                ]},
                { id: 'courseSlot', label: '节次', type: 'select', required: true, value: String(scheduleToEdit?.slot || 1), options: [
                    { value: '1', label: '第1-2节' },
                    { value: '2', label: '第3-4节' },
                    { value: '3', label: '第5-6节' },
                    { value: '4', label: '第7-8节' },
                    { value: '5', label: '第9-10节' }
                ]},
                { id: 'courseRoom', label: '教室', type: 'select', required: true, value: scheduleToEdit?.classroomId || this.classroomsData[0]?.id || '', options: this.classroomsData.map(r => ({
                    value: r.id,
                    label: `${r.building} ${r.roomNumber}`
                }))}
            ],
            onConfirm: (values) => {
                dataManager.updateCourse(courseId, { courseName: values.courseName });

                const day = parseInt(values.courseDay, 10) || 1;
                const slot = parseInt(values.courseSlot, 10) || 1;
                const semesterId = values.courseSemester;
                const classroomId = values.courseRoom;

                let updatedSchedule = null;
                const existingSchedule = schedules.find(s => s.courseId === courseId && s.semesterId === semesterId);
                if (existingSchedule) {
                    existingSchedule.day = day;
                    existingSchedule.slot = slot;
                    existingSchedule.classroomId = classroomId;
                    updatedSchedule = existingSchedule;
                } else if (scheduleToEdit) {
                    scheduleToEdit.semesterId = semesterId;
                    scheduleToEdit.day = day;
                    scheduleToEdit.slot = slot;
                    scheduleToEdit.classroomId = classroomId;
                    updatedSchedule = scheduleToEdit;
                } else {
                    updatedSchedule = {
                        id: dataManager.generateId(),
                        semesterId,
                        courseId,
                        teacherId: course.teacherId || '',
                        classId: '',
                        day,
                        slot,
                        classroomId
                    };
                    schedules.push(updatedSchedule);
                }

                if (updatedSchedule) {
                    const updatedIndex = schedules.indexOf(updatedSchedule);
                    if (updatedIndex > -1 && updatedIndex !== schedules.length - 1) {
                        schedules.splice(updatedIndex, 1);
                        schedules.push(updatedSchedule);
                    }
                }

                dataManager.setData('schedules', schedules);
                this.loadAdminData();
                this.renderCourses();
                showMessage('课程安排已更新', 'success');
            }
        });
    }

    viewCourseStats(courseId) {
        const stats = dataManager.getCourseGradeStats(courseId);
        if (!stats) {
            showMessage('暂无成绩统计', 'info');
            return;
        }
        alert(`平均分 ${stats.average}，优秀率 ${stats.excellentRate}%`);
    }

    viewDepartmentGrades(departmentId) {
        this.switchPage('grades');
        const select = document.getElementById('gradeDepartmentFilter');
        if (select) {
            select.value = departmentId;
        }
        this.renderGrades();
    }

    exportDepartmentGrades(departmentId) {
        const department = this.departmentsData.find(d => d.id === departmentId);
        const courses = this.coursesData.filter(c => c.departmentId === departmentId);
        const grades = (dataManager.getData('grades') || []).filter(g => courses.some(c => c.id === g.courseId));
        const rows = [
            ['学号', '姓名', '课程', '成绩'],
            ...grades.map(g => {
                const student = dataManager.getUserById(g.studentId);
                return [student?.username || '', student?.name || '', g.courseName || '', g.totalScore || ''];
            })
        ];
        this.downloadText(`${department?.departmentName || 'department'}_grades.csv`, rows.map(r => r.map(this.escapeCSV).join(',')).join('\n'));
        showMessage('院系成绩已导出', 'success');
    }

    approveGrade(gradeId) {
        if (confirm('确定要审核通过这条成绩记录吗？')) {
            showMessage(`审核通过成绩功能正在开发中: ${gradeId}`, 'info');
        }
    }

    rejectGrade(gradeId) {
        if (confirm('确定要驳回这条成绩记录吗？')) {
            showMessage(`驳回成绩功能正在开发中: ${gradeId}`, 'info');
        }
    }

    viewGradeDetails(gradeId) {
        showMessage(`查看成绩详情功能正在开发中: ${gradeId}`, 'info');
    }

    renderClassrooms() {
        const grid = document.getElementById('classroomsGrid');
        if (!grid) return;

        const buildingFilter = document.getElementById('classroomBuildingFilter');
        const typeFilter = document.getElementById('classroomTypeFilter');

        if (buildingFilter && !buildingFilter.dataset.inited) {
            const buildings = Array.from(new Set(this.classroomsData.map(c => c.building)));
            buildingFilter.dataset.inited = '1';
            buildingFilter.innerHTML = '<option value="">全部教学楼</option>' + buildings.map(b => `<option value="${b}">${b}</option>`).join('');
        }
        if (typeFilter && !typeFilter.dataset.inited) {
            typeFilter.dataset.inited = '1';
            typeFilter.innerHTML = '<option value="">全部类型</option><option value="lecture">讲座教室</option><option value="lab">实验室</option><option value="computer">机房</option>';
        }

        const building = buildingFilter?.value || '';
        const type = typeFilter?.value || '';

        const filtered = this.classroomsData.filter(room => {
            if (building && room.building !== building) return false;
            if (type && room.type !== type) return false;
            return true;
        });

        grid.innerHTML = filtered.map(room => `
            <div class="classroom-card">
                <h4>${room.building} ${room.roomNumber}</h4>
                <p>容量：${room.capacity}人</p>
                <p>类型：${room.type}</p>
                <button class="btn-sm btn-secondary" onclick="academicAdmin.editClassroom('${room.id}')">编辑</button>
            </div>
        `).join('') || '<div style="opacity:.7;">暂无教室数据</div>';
    }

    renderSchedules() {
        const gridBody = document.getElementById('scheduleGridBody');
        if (!gridBody) return;

        const studentFilter = document.getElementById('scheduleStudentFilter');
        const teacherFilter = document.getElementById('scheduleTeacherFilter');

        if (studentFilter && !studentFilter.dataset.inited) {
            const students = (dataManager.getData('users') || []).filter(u => u.userType === 'student');
            studentFilter.dataset.inited = '1';
            studentFilter.innerHTML = '<option value="">选择学生</option>' + students.map(s => {
                const className = this.classesData.find(c => c.id === s.classId)?.className || '';
                return `<option value="${s.id}">${s.name || s.username}${className ? `（${className}）` : ''}</option>`;
            }).join('');
        }
        if (teacherFilter && !teacherFilter.dataset.inited) {
            const teachers = dataManager.getData('users').filter(u => u.userType === 'teacher');
            teacherFilter.dataset.inited = '1';
            teacherFilter.innerHTML = '<option value="">选择教师</option>' + teachers.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
        }

        const studentId = studentFilter?.value || '';
        const enrollments = studentId ? dataManager.getStudentEnrollments(studentId) : [];
        const enrolledCourseIds = enrollments.map(e => e.courseId);
        const teacherId = teacherFilter?.value || '';
        const slots = ['1-2节', '3-4节', '5-6节', '7-8节', '9-10节'];
        const days = [1, 2, 3, 4, 5];

        const schedules = this.schedulesData.filter(s => {
            if (studentId) {
                if (!enrolledCourseIds.length) return false;
                if (!enrolledCourseIds.includes(s.courseId)) return false;
            }
            if (teacherId && s.teacherId !== teacherId) return false;
            return true;
        });

        if (studentId && !enrolledCourseIds.length) {
            showMessage('该学生暂无选课记录', 'info');
        }

        gridBody.innerHTML = slots.map((slot, slotIndex) => {
            const cells = days.map(day => {
                const entry = schedules.find(s => s.slot === slotIndex + 1 && s.day === day);
                if (!entry) return '<td></td>';
                const course = this.coursesData.find(c => c.id === entry.courseId);
                const room = this.classroomsData.find(r => r.id === entry.classroomId);
                return `<td><strong>${course?.courseName || '--'}</strong><br>${room ? `${room.building}${room.roomNumber}` : ''}</td>`;
            }).join('');
            return `<tr><td>${slot}</td>${cells}</tr>`;
        }).join('');
    }

    openEditProfileModal() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>修改个人信息</h3>
                    <button class="close">×</button>
                </div>
                <div class="modal-body">
                    <form id="editProfileForm">
                        <div class="form-group">
                            <label>姓名</label>
                            <input type="text" id="editName" value="${this.userData.name || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>邮箱</label>
                            <input type="email" id="editEmail" value="${this.userData.email || ''}">
                        </div>
                        <div class="form-group">
                            <label>电话</label>
                            <input type="text" id="editPhone" value="${this.userData.phone || ''}">
                        </div>
                        <div class="form-group">
                            <label>办公室</label>
                            <input type="text" id="editOffice" value="${this.userData.office || ''}">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" id="cancelEditProfile">取消</button>
                    <button class="btn-primary" id="saveEditProfile">保存</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('.close')?.addEventListener('click', () => modal.remove());
        modal.querySelector('#cancelEditProfile')?.addEventListener('click', () => modal.remove());
        modal.querySelector('#saveEditProfile')?.addEventListener('click', () => {
            const name = modal.querySelector('#editName')?.value?.trim();
            if (!name) {
                showMessage('请填写姓名', 'warning');
                return;
            }
            const email = modal.querySelector('#editEmail')?.value?.trim() || '';
            const phone = modal.querySelector('#editPhone')?.value?.trim() || '';
            const office = modal.querySelector('#editOffice')?.value?.trim() || '';
            const users = dataManager.getData('users');
            const user = users.find(u => u.id === this.userData.id);
            if (user) {
                user.name = name;
                user.email = email;
                user.phone = phone;
                user.office = office;
                dataManager.setData('users', users);
                this.userData = user;
                this.updateUserInfo();
                this.renderProfile();
                showMessage('个人信息已更新', 'success');
            }
            modal.remove();
        });
    }

    openChangePasswordModal() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>修改密码</h3>
                    <button class="close">×</button>
                </div>
                <div class="modal-body">
                    <form id="changePasswordForm">
                        <div class="form-group">
                            <label>原密码</label>
                            <input type="password" id="oldPassword" required>
                        </div>
                        <div class="form-group">
                            <label>新密码</label>
                            <input type="password" id="newPassword" required>
                        </div>
                        <div class="form-group">
                            <label>确认新密码</label>
                            <input type="password" id="confirmPassword" required>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" id="cancelChangePassword">取消</button>
                    <button class="btn-primary" id="saveChangePassword">保存</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('.close')?.addEventListener('click', () => modal.remove());
        modal.querySelector('#cancelChangePassword')?.addEventListener('click', () => modal.remove());
        modal.querySelector('#saveChangePassword')?.addEventListener('click', () => {
            const oldPwd = modal.querySelector('#oldPassword')?.value || '';
            const newPwd = modal.querySelector('#newPassword')?.value || '';
            const confirmPwd = modal.querySelector('#confirmPassword')?.value || '';
            if (!oldPwd || !newPwd || !confirmPwd) {
                showMessage('请填写所有字段', 'warning');
                return;
            }
            if (newPwd !== confirmPwd) {
                showMessage('两次输入的新密码不一致', 'warning');
                return;
            }
            const result = auth.changePassword(oldPwd, newPwd);
            if (!result.success) {
                showMessage(result.message || '修改失败', 'error');
                return;
            }
            this.userData = auth.currentUser;
            showMessage('密码修改成功', 'success');
            modal.remove();
        });
    }

    generateSchedule() {
        const studentId = document.getElementById('scheduleStudentFilter')?.value || '';
        const enrollments = studentId ? dataManager.getStudentEnrollments(studentId) : [];
        const enrolledCourseIds = enrollments.map(e => e.courseId);
        const teacherId = document.getElementById('scheduleTeacherFilter')?.value || '';
        const semesterId = this.semestersData[0]?.id || '';
        if (!studentId && !teacherId) {
            showMessage('请选择学生或教师', 'warning');
            return;
        }
        if (studentId && !enrolledCourseIds.length) {
            showMessage('该学生暂无选课记录', 'warning');
            return;
        }
        const schedules = dataManager.getData('schedules') || [];
        const courses = studentId
            ? this.coursesData.filter(course => enrolledCourseIds.includes(course.id))
            : this.coursesData.slice(0, 5);
        courses.forEach((course, idx) => {
            if (schedules.some(s => s.courseId === course.id && s.semesterId === semesterId)) return;
            schedules.push({
                id: dataManager.generateId(),
                semesterId,
                courseId: course.id,
                teacherId: course.teacherId,
                classId: '',
                day: (idx % 5) + 1,
                slot: (idx % 5) + 1,
                classroomId: this.classroomsData[0]?.id || ''
            });
        });
        dataManager.setData('schedules', schedules);
        this.loadAdminData();
        this.renderSchedules();
        showMessage('课表已生成', 'success');
    }

    autoArrangeCourses() {
        const schedules = dataManager.getData('schedules') || [];
        this.coursesData.forEach((course, idx) => {
            if (schedules.some(s => s.courseId === course.id)) return;
            schedules.push({
                id: dataManager.generateId(),
                semesterId: this.semestersData[0]?.id || '',
                courseId: course.id,
                teacherId: course.teacherId,
                classId: '',
                day: (idx % 5) + 1,
                slot: ((idx + 1) % 5) + 1,
                classroomId: this.classroomsData[0]?.id || ''
            });
        });
        dataManager.setData('schedules', schedules);
        this.loadAdminData();
        this.renderCourses();
        showMessage('智能排课完成', 'success');
    }

    exportSchedule() {
        const studentId = document.getElementById('scheduleStudentFilter')?.value || '';
        const enrollments = studentId ? dataManager.getStudentEnrollments(studentId) : [];
        const enrolledCourseIds = enrollments.map(e => e.courseId);
        const teacherId = document.getElementById('scheduleTeacherFilter')?.value || '';
        const schedules = this.schedulesData.filter(s => {
            if (studentId) {
                if (!enrolledCourseIds.length) return false;
                if (!enrolledCourseIds.includes(s.courseId)) return false;
            }
            if (teacherId && s.teacherId !== teacherId) return false;
            return true;
        });
        const rows = [
            ['课程', '教师', '周次', '节次', '教室'],
            ...schedules.map(s => {
                const course = this.coursesData.find(c => c.id === s.courseId);
                const teacher = dataManager.getUserById(s.teacherId);
                const room = this.classroomsData.find(r => r.id === s.classroomId);
                return [course?.courseName || '', teacher?.name || '', `周${s.day}`, `第${s.slot}节`, room ? `${room.building}${room.roomNumber}` : ''];
            })
        ];
        this.downloadText(`schedule_${Date.now()}.csv`, rows.map(r => r.map(this.escapeCSV).join(',')).join('\n'));
        showMessage('课表已导出', 'success');
    }

    editClassroom(classroomId) {
        const room = this.classroomsData.find(r => r.id === classroomId);
        if (!room) return;
        const capacity = parseInt(prompt('更新容量', String(room.capacity)), 10);
        if (Number.isNaN(capacity)) return;
        room.capacity = capacity;
        dataManager.setData('classrooms', this.classroomsData);
        this.renderClassrooms();
        showMessage('教室已更新', 'success');
    }

    openActionModal(config) {
        if (!config || !config.fields) return;
        const existing = document.getElementById('actionModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'actionModal';
        modal.className = 'modal active';
        if (config.modalClass) {
            modal.classList.add(config.modalClass);
        }

        const extraButtons = Array.isArray(config.extraButtons) ? config.extraButtons : [];
        const buttonTemplates = {};
        if (!config.hideCancel) {
            buttonTemplates.cancel = `<button class="btn-secondary" id="cancelAction" type="button">${config.cancelText || '取消'}</button>`;
        }
        buttonTemplates.confirm = `<button class="btn-primary" id="confirmAction" type="button">${config.confirmText || '确定'}</button>`;
        extraButtons.forEach(button => {
            const className = button.className || 'btn-secondary';
            buttonTemplates[button.key] = `<button class="${className}" id="extraAction-${button.key}" type="button">${button.label}</button>`;
        });

        const defaultOrder = [];
        if (!config.hideCancel) defaultOrder.push('cancel');
        defaultOrder.push('confirm');
        extraButtons.forEach(button => defaultOrder.push(button.key));

        const buttonOrder = Array.isArray(config.buttonOrder) && config.buttonOrder.length
            ? config.buttonOrder
            : defaultOrder;

        const footerButtons = buttonOrder.map(key => buttonTemplates[key]).filter(Boolean).join('');
        const footerClass = `modal-footer${config.centerButtons ? ' centered' : ''}`;

        const contentClass = `modal-content${config.contentClass ? ` ${config.contentClass}` : ''}`;
        modal.innerHTML = `
            <div class="${contentClass}">
                <div class="modal-header">
                    <h3>${config.title || '操作'}</h3>
                    <button class="close">×</button>
                </div>
                <div class="modal-body">
                    <form id="actionForm">
                        ${config.fields.map(field => this.renderModalField(field)).join('')}
                    </form>
                </div>
                <div class="${footerClass}">
                    ${footerButtons}
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('.close')?.addEventListener('click', () => modal.remove());
        modal.querySelector('#cancelAction')?.addEventListener('click', (event) => {
            event.preventDefault();
            modal.remove();
        });

        // 多选列表点击切换
        modal.querySelectorAll('.multi-select-item').forEach(item => {
            item.addEventListener('click', () => {
                item.classList.toggle('selected');
            });
        });

        const collectValues = (requireValidation = true) => {
            const values = {};
            let valid = true;
            config.fields.forEach(field => {
                if (field.type === 'note') {
                    values[field.id] = field.value || '';
                    return;
                }
                if (field.type === 'multiselect') {
                    const list = modal.querySelector(`#${field.id}`);
                    const selected = list ? Array.from(list.querySelectorAll('.multi-select-item.selected')).map(el => el.dataset.value) : [];
                    if (requireValidation && field.required && selected.length === 0) valid = false;
                    values[field.id] = selected;
                    return;
                }
                const input = modal.querySelector(`#${field.id}`);
                const value = input ? String(input.value || '').trim() : '';
                if (requireValidation && field.required && !value) valid = false;
                values[field.id] = value;
            });
            if (requireValidation && !valid) {
                showMessage('请填写所有必填项', 'warning');
                return null;
            }
            return values;
        };

        modal.querySelector('#confirmAction')?.addEventListener('click', (event) => {
            event.preventDefault();
            const values = collectValues(true);
            if (!values) return;
            config.onConfirm?.(values);
            modal.remove();
        });

        extraButtons.forEach(button => {
            const btn = modal.querySelector(`#extraAction-${button.key}`);
            if (!btn) return;
            btn.addEventListener('click', (event) => {
                event.preventDefault();
                const values = collectValues(button.requireValidation !== false);
                if (!values) return;
                button.onClick?.(values);
                if (button.closeOnClick !== false) {
                    modal.remove();
                }
            });
        });
    }

    renderModalField(field) {
        const value = typeof field.value !== 'undefined' ? field.value : '';
        if (field.type === 'note') {
            const toneClass = field.tone ? ` ${field.tone}` : '';
            return `
                <div class="modal-note${toneClass}">${value}</div>
            `;
        }
        if (field.type === 'select') {
            return `
                <div class="form-group">
                    <label for="${field.id}">${field.label}${field.required ? ' *' : ''}</label>
                    <select id="${field.id}" class="form-control" ${field.required ? 'required' : ''} ${field.readOnly ? 'disabled' : ''}>
                        <option value="">请选择</option>
                        ${(field.options || []).map(opt => `
                            <option value="${opt.value}" ${String(opt.value) === String(value) ? 'selected' : ''}>${opt.label}</option>
                        `).join('')}
                    </select>
                </div>
            `;
        }
        if (field.type === 'multiselect') {
            const selectedValues = Array.isArray(value) ? value.map(String) : [];
            return `
                <div class="form-group">
                    <label for="${field.id}">${field.label}${field.required ? ' *' : ''}</label>
                    <div id="${field.id}" class="multi-select-list">
                        ${(field.options || []).map(opt => `
                            <div class="multi-select-item ${selectedValues.includes(String(opt.value)) ? 'selected' : ''}" data-value="${opt.value}">
                                <span class="multi-select-label">${opt.label}</span>
                                <span class="multi-select-check">✓</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        return `
            <div class="form-group">
                <label for="${field.id}">${field.label}${field.required ? ' *' : ''}</label>
                <input id="${field.id}" type="${field.type || 'text'}" value="${value}" ${field.required ? 'required' : ''} ${field.readOnly ? 'readonly' : ''}>
            </div>
        `;
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

    resetUserPassword(userId) {
        const user = dataManager.getUserById(userId);
        if (!user) return;
        const newPassword = `${user.username}123`;
        if (!confirm(`确定重置 ${user.name || user.username} 的密码为 ${newPassword} 吗？`)) return;
        const salt = user.username;
        const hash = dataManager.hashPassword(newPassword, salt);
        dataManager.updateUserPassword(userId, hash, salt, { requirePasswordChange: false });
        dataManager.addLog?.(this.userData?.id || 'academicAdmin', 'password_reset_by_admin', `重置密码：${user.userType}/${user.username}`);
        this.loadAdminData();
        this.renderCurrentPage();
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
        dataManager.addLog?.(this.userData?.id || 'academicAdmin', 'user_locked', `锁定用户：${user.userType}/${user.username}`);
        this.loadAdminData();
        this.renderCurrentPage();
        showMessage('用户已锁定', 'success');
    }

    unlockUser(userId) {
        const user = dataManager.getUserById(userId);
        if (!user) return;
        if (!confirm(`确定解锁用户 ${user.name || user.username} 吗？`)) return;
        const past = new Date(0).toISOString();
        dataManager.updateUserLoginSecurity(userId, { lockedUntil: past, failedLoginCount: 0 });
        dataManager.addLog?.(this.userData?.id || 'academicAdmin', 'user_unlocked', `解锁用户：${user.userType}/${user.username}`);
        this.loadAdminData();
        this.renderCurrentPage();
        showMessage('用户已解锁', 'success');
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
        dataManager.addLog?.(this.userData?.id || 'academicAdmin', 'user_deleted', `删除用户：${user.userType}/${user.username}`);
        this.loadAdminData();
        this.renderCurrentPage();
        showMessage('用户已删除', 'success');
    }

    exportStudents() {
        const students = this.getFilteredStudents();
        const rows = [
            ['学生ID', '学号', '姓名', '班级', '专业', '邮箱', '状态'],
            ...students.map(student => {
                const className = this.classesData.find(c => c.id === student.classId)?.className || '--';
                return [
                    student.id,
                    student.username || '',
                    student.name || '',
                    className,
                    student.major || '',
                    student.email || '',
                    this.getUserStatusText(student.status)
                ];
            })
        ];
        this.downloadText(`students_${Date.now()}.csv`, rows.map(r => r.map(this.escapeCSV).join(',')).join('\n'));
        showMessage('学生名单已导出', 'success');
    }

    exportTeachers() {
        const teachers = this.getFilteredTeachers();
        const rows = [
            ['教师ID', '工号', '姓名', '职称', '院系', '邮箱', '状态'],
            ...teachers.map(teacher => {
                const departmentName = this.departmentsData.find(d => d.id === teacher.departmentId)?.departmentName || '--';
                return [
                    teacher.id,
                    teacher.username || '',
                    teacher.name || '',
                    teacher.title || '',
                    departmentName,
                    teacher.email || '',
                    this.getUserStatusText(teacher.status)
                ];
            })
        ];
        this.downloadText(`teachers_${Date.now()}.csv`, rows.map(r => r.map(this.escapeCSV).join(',')).join('\n'));
        showMessage('教师名单已导出', 'success');
    }

    switchToAudit() {
        this.switchPage('audit');
    }

    // CSV工具
    parseCSV(text) {
        const lines = text.split(/\r?\n/).filter(l => l.trim());
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
        const header = headerLine.split(delimiter).map((h, idx) => {
            const clean = h.trim();
            return idx === 0 ? clean.replace(/^\ufeff/, '') : clean;
        });
        return lines.slice(1).map(line => {
            const cols = line.split(delimiter);
            const obj = {};
            header.forEach((h, idx) => obj[h] = cols[idx] ? cols[idx].trim() : '');
            return obj;
        });
    }

    downloadText(filename, content) {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(link.href);
    }

    escapeCSV(value) {
        const text = String(value ?? '');
        if (text.includes(',') || text.includes('"') || text.includes('\n')) {
            return `"${text.replace(/\"/g, '""')}"`;
        }
        return text;
    }


    // 首次登录强制修改密码
    enforcePasswordChange() {
        if (!this.userData || !this.userData.requirePasswordChange) return;
        const modal = document.getElementById('forceChangePasswordModal');
        const form = document.getElementById('forceChangePasswordForm');
        if (!modal || !form) return;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        const onSubmit = (e) => {
            e.preventDefault();
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
    window.academicAdmin = new AcademicAdminDashboard();
});
