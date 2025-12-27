// 教务管理员仪表盘功能模块
class AcademicAdminDashboard {
    constructor() {
        this.currentPage = 'dashboard';
        this.userData = null;
        this.programsData = [];
        this.classesData = [];
        this.coursesData = [];
        this.gradesData = [];
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
        this.programsData = dataManager.getData('programs') || this.generateMockPrograms();
        this.classesData = dataManager.getData('classes');
        this.coursesData = dataManager.getData('courses');
        this.gradesData = dataManager.getData('grades');
        this.departmentsData = dataManager.getData('departments');
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

        // 各类添加按钮
        this.setupActionButtons();
        
        // 模态框设置
        this.setupModalListeners();
    }

    // 设置操作按钮
    setupActionButtons() {
        const actionButtons = [
            { id: 'addProgramBtn', action: 'showAddProgramModal' },
            { id: 'addClassBtn', action: 'showAddClassModal' },
            { id: 'addSemesterBtn', action: 'showAddSemesterModal' },
            { id: 'scheduleCourseBtn', action: 'showScheduleCourseModal' },
            { id: 'addClassroomBtn', action: 'showAddClassroomModal' },
            { id: 'addScheduleBtn', action: 'showAddScheduleModal' },
            { id: 'auditGradesBtn', action: 'showAuditGradesModal' },
            { id: 'exportReportsBtn', action: 'exportReports' }
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
            case 'programs':
                this.renderPrograms();
                break;
            case 'classes':
                this.renderClasses();
                break;
            case 'semesters':
                this.renderSemesters();
                break;
            case 'courses':
                this.renderCourses();
                break;
            case 'classrooms':
                this.renderClassrooms();
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
        const statElements = {
            totalStudents: 'totalStudents',
            totalTeachers: 'totalTeachers',
            totalCourses: 'totalCourses',
            totalDepartments: 'totalDepartments',
            activeClasses: 'activeClasses',
            pendingAudits: 'pendingAudits'
        };

        Object.entries(statElements).forEach(([statKey, elementId]) => {
            const element = document.getElementById(elementId);
            if (element) {
                let value = stats[statKey] || 0;
                
                // 计算特殊统计
                if (statKey === 'activeClasses') {
                    value = this.classesData.filter(c => c.grade === '2024').length;
                } else if (statKey === 'pendingAudits') {
                    value = this.gradesData.filter(g => g.status === 'pending').length;
                } else if (statKey === 'totalDepartments') {
                    value = stats.departments || 0;
                }
                
                element.textContent = value;
            }
        });
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
        const chartContainer = document.getElementById('gradeChartContainer');
        if (!chartContainer) return;

        // 简化的图表展示（实际应用中应使用图表库）
        const gradeStats = this.calculateGradeStatistics();
        
        chartContainer.innerHTML = `
            <div class="chart-stats">
                <div class="stat-card">
                    <h4>整体优秀率</h4>
                    <span class="stat-value">${gradeStats.excellentRate}%</span>
                </div>
                <div class="stat-card">
                    <h4>整体及格率</h4>
                    <span class="stat-value">${gradeStats.passRate}%</span>
                </div>
                <div class="stat-card">
                    <h4>平均成绩</h4>
                    <span class="stat-value">${gradeStats.averageScore}</span>
                </div>
                <div class="stat-card">
                    <h4>参与统计</h4>
                    <span class="stat-value">${gradeStats.totalStudents}人</span>
                </div>
            </div>
        `;
    }

    // 计算成绩统计
    calculateGradeStatistics() {
        if (this.gradesData.length === 0) {
            return {
                excellentRate: 0,
                passRate: 0,
                averageScore: 0,
                totalStudents: 0
            };
        }

        const scores = this.gradesData.map(g => g.totalScore);
        const excellentCount = scores.filter(s => s >= 90).length;
        const passCount = scores.filter(s => s >= 60).length;
        const averageScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);

        return {
            excellentRate: ((excellentCount / scores.length) * 100).toFixed(1),
            passRate: ((passCount / scores.length) * 100).toFixed(1),
            averageScore,
            totalStudents: this.gradesData.length
        };
    }

    // 渲染培养方案
    renderPrograms() {
        const programsList = document.getElementById('programsList');
        if (!programsList) return;

        programsList.innerHTML = this.programsData.map(program => {
            const department = this.departmentsData.find(d => d.id === program.departmentId);
            
            return `
                <div class="program-card">
                    <div class="program-header">
                        <h3>${program.name}</h3>
                        <span class="status-badge ${program.status}">${program.status === 'active' ? '生效中' : '已停用'}</span>
                    </div>
                    <div class="program-info">
                        <p><i class="fas fa-graduation-cap"></i> 专业: ${program.major}</p>
                        <p><i class="fas fa-university"></i> 院系: ${department ? department.departmentName : '未知院系'}</p>
                        <p><i class="fas fa-certificate"></i> 学位: ${program.degree}</p>
                        <p><i class="fas fa-clock"></i> 学制: ${program.duration}年</p>
                        <p><i class="fas fa-calculator"></i> 总学分: ${program.totalCredits}</p>
                        <p><i class="fas fa-book"></i> 课程数: ${program.courses.length}</p>
                    </div>
                    <div class="program-actions">
                        <button class="btn-primary" onclick="academicAdmin.viewProgram('${program.id}')">查看详情</button>
                        <button class="btn-secondary" onclick="academicAdmin.editProgram('${program.id}')">编辑</button>
                        <button class="btn-info" onclick="academicAdmin.exportProgram('${program.id}')">导出</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 渲染班级管理
    renderClasses() {
        const classesList = document.getElementById('classesList');
        if (!classesList) return;

        classesList.innerHTML = this.classesData.map(cls => {
            const department = this.departmentsData.find(d => d.id === cls.departmentId);
            const headTeacher = dataManager.getUserById(cls.headTeacher);
            
            return `
                <div class="class-card">
                    <div class="class-header">
                        <h3>${cls.className}</h3>
                        <span class="grade-badge">${cls.grade}级</span>
                    </div>
                    <div class="class-info">
                        <p><i class="fas fa-university"></i> 院系: ${department ? department.departmentName : '未知院系'}</p>
                        <p><i class="fas fa-user"></i> 班主任: ${headTeacher ? headTeacher.name : '未指定'}</p>
                        <p><i class="fas fa-users"></i> 学生人数: ${cls.studentCount}人</p>
                        <p><i class="fas fa-book"></i> 专业: ${cls.major}</p>
                    </div>
                    <div class="class-actions">
                        <button class="btn-primary" onclick="academicAdmin.viewClassStudents('${cls.id}')">查看学生</button>
                        <button class="btn-secondary" onclick="academicAdmin.editClass('${cls.id}')">编辑班级</button>
                        <button class="btn-info" onclick="academicAdmin.manageClassSchedule('${cls.id}')">管理课表</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 渲染学期管理
    renderSemesters() {
        const semestersList = document.getElementById('semestersList');
        if (!semestersList) return;

        const semesters = [
            { id: 'sem001', name: '2024年春季学期', startDate: '2024-02-26', endDate: '2024-07-15', status: 'active' },
            { id: 'sem002', name: '2023年秋季学期', startDate: '2023-09-01', endDate: '2024-01-20', status: 'completed' },
            { id: 'sem003', name: '2024年秋季学期', startDate: '2024-09-01', endDate: '2025-01-20', status: 'upcoming' }
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
        const coursesList = document.getElementById('coursesList');
        if (!coursesList) return;

        coursesList.innerHTML = this.coursesData.map(course => {
            const teacher = dataManager.getUserById(course.teacherId);
            const department = this.departmentsData.find(d => d.id === course.departmentId);
            
            return `
                <div class="course-card admin-course">
                    <div class="course-header">
                        <h3>${course.courseName}</h3>
                        <span class="course-code">${course.courseCode}</span>
                    </div>
                    <div class="course-info">
                        <p><i class="fas fa-user"></i> 教师: ${teacher ? teacher.name : '未指定'}</p>
                        <p><i class="fas fa-university"></i> 院系: ${department ? department.departmentName : '未知院系'}</p>
                        <p><i class="fas fa-credit-card"></i> 学分: ${course.credits}</p>
                        <p><i class="fas fa-users"></i> 学生: ${course.currentStudents}/${course.maxStudents}</p>
                        <p><i class="fas fa-tag"></i> 类型: ${course.category === 'required' ? '必修' : '选修'}</p>
                        <p><i class="fas fa-check-circle"></i> 状态: ${course.status === 'published' ? '已发布' : '草稿'}</p>
                    </div>
                    <div class="course-actions">
                        <button class="btn-primary" onclick="academicAdmin.approveCourse('${course.id}')">审核</button>
                        <button class="btn-secondary" onclick="academicAdmin.editCourse('${course.id}')">编辑</button>
                        <button class="btn-info" onclick="academicAdmin.viewCourseStats('${course.id}')">统计</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 渲染成绩统计
    renderGrades() {
        const gradesList = document.getElementById('gradesList');
        if (!gradesList) return;

        const departmentsStats = this.calculateDepartmentGradeStats();
        
        gradesList.innerHTML = departmentsStats.map(stat => `
            <div class="grade-stat-card">
                <div class="stat-header">
                    <h3>${stat.departmentName}</h3>
                </div>
                <div class="stat-info">
                    <p><i class="fas fa-users"></i> 学生总数: ${stat.totalStudents}</p>
                    <p><i class="fas fa-chart-line"></i> 平均成绩: ${stat.averageScore}</p>
                    <p><i class="fas fa-trophy"></i> 优秀率: ${stat.excellentRate}%</p>
                    <p><i class="fas fa-check-circle"></i> 及格率: ${stat.passRate}%</p>
                    <p><i class="fas fa-graduation-cap"></i> GPA: ${stat.averageGPA}</p>
                </div>
                <div class="stat-actions">
                    <button class="btn-primary" onclick="academicAdmin.viewDepartmentGrades('${stat.departmentId}')">详细统计</button>
                    <button class="btn-secondary" onclick="academicAdmin.exportDepartmentGrades('${stat.departmentId}')">导出报表</button>
                </div>
            </div>
        `).join('');
    }

    // 计算院系成绩统计
    calculateDepartmentGradeStats() {
        return this.departmentsData.map(dept => {
            const deptCourses = this.coursesData.filter(c => c.departmentId === dept.id);
            const deptGrades = this.gradesData.filter(g => {
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

        const semesterSel = document.getElementById('auditSemesterFilter');
        if (semesterSel && !semesterSel.dataset.inited) {
            semesterSel.dataset.inited = '1';
            const semesters = dataManager.getData('semesters') || [];
            semesterSel.innerHTML = '<option value="">选择学期</option>' + semesters.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
            semesterSel.addEventListener('change', () => this.renderAudit());
        }

        const body = document.getElementById('auditTableBody');
        const anomalyList = document.getElementById('anomalyList');
        if (!body) return;

        const semesterFilter = semesterSel ? semesterSel.value : '';

        const statuses = {
            pending: ['submitted', 'pending'],
            approved: ['published', 'approved'],
            rejected: ['rejected']
        };
        const wanted = statuses[this.currentAuditTab] || statuses.pending;

        const allGrades = dataManager.getData('grades') || [];
        const grades = allGrades.filter(g => wanted.includes(g.status) && (!semesterFilter || g.semester === semesterFilter));

        // 聚合：courseId + semester
        const groups = new Map();
        grades.forEach(g => {
            const key = `${g.courseId}__${g.semester || ''}`;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(g);
        });

        const rows = [];
        const anomalies = [];

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
        }

        body.innerHTML = rows.join('') || `<tr><td colspan="10" style="text-align:center;opacity:.7;">暂无记录</td></tr>`;

        // 异常列表
        if (anomalyList) {
            anomalyList.innerHTML = anomalies.slice(0, 8).map(a => `
                <div class="anomaly-item">
                    <div class="anomaly-title">${a.courseName}${a.semesterId ? `（${a.semesterId}）` : ''}</div>
                    <div class="anomaly-desc">${a.flags.join('、')}</div>
                </div>
            `).join('') || '<div style="opacity:.7;">暂无异常</div>';
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
        // 更新管理员个人信息显示
        const profileElements = {
            adminName: document.getElementById('adminName'),
            adminEmail: document.getElementById('adminEmail'),
            adminPhone: document.getElementById('adminPhone'),
            adminOffice: document.getElementById('adminOffice')
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
        showMessage('添加培养方案功能正在开发中...', 'info');
    }

    showAddClassModal() {
        showMessage('添加班级功能正在开发中...', 'info');
    }

    showAddSemesterModal() {
        showMessage('添加学期功能正在开发中...', 'info');
    }

    showScheduleCourseModal() {
        showMessage('排课功能正在开发中...', 'info');
    }

    showAddClassroomModal() {
        showMessage('添加教室功能正在开发中...', 'info');
    }

    showAddScheduleModal() {
        showMessage('添加课表功能正在开发中...', 'info');
    }

    showAuditGradesModal() {
        showMessage('批量审核功能正在开发中...', 'info');
    }

    exportReports() {
        showMessage('导出报表功能正在开发中...', 'info');
    }

    auditGrade(gradeId) {
        this.switchPage('audit');
    }

    processSchedule(scheduleId) {
        showMessage(`处理课表功能正在开发中: ${scheduleId}`, 'info');
    }

    viewProgram(programId) {
        showMessage(`查看培养方案功能正在开发中: ${programId}`, 'info');
    }

    editProgram(programId) {
        showMessage(`编辑培养方案功能正在开发中: ${programId}`, 'info');
    }

    exportProgram(programId) {
        showMessage(`导出培养方案功能正在开发中: ${programId}`, 'info');
    }

    viewClassStudents(classId) {
        showMessage(`查看班级学生功能正在开发中: ${classId}`, 'info');
    }

    editClass(classId) {
        showMessage(`编辑班级功能正在开发中: ${classId}`, 'info');
    }

    manageClassSchedule(classId) {
        showMessage(`管理班级课表功能正在开发中: ${classId}`, 'info');
    }

    viewSemester(semesterId) {
        showMessage(`查看学期功能正在开发中: ${semesterId}`, 'info');
    }

    editSemester(semesterId) {
        showMessage(`编辑学期功能正在开发中: ${semesterId}`, 'info');
    }

    manageSemesterCourses(semesterId) {
        showMessage(`管理学期课程功能正在开发中: ${semesterId}`, 'info');
    }

    approveCourse(courseId) {
        showMessage(`审核课程功能正在开发中: ${courseId}`, 'info');
    }

    editCourse(courseId) {
        showMessage(`编辑课程功能正在开发中: ${courseId}`, 'info');
    }

    viewCourseStats(courseId) {
        showMessage(`查看课程统计功能正在开发中: ${courseId}`, 'info');
    }

    viewDepartmentGrades(departmentId) {
        showMessage(`查看院系成绩功能正在开发中: ${departmentId}`, 'info');
    }

    exportDepartmentGrades(departmentId) {
        showMessage(`导出院系成绩功能正在开发中: ${departmentId}`, 'info');
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
        showMessage('教室管理页面正在开发中...', 'info');
    }

    renderSchedules() {
        showMessage('课表管理页面正在开发中...', 'info');
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