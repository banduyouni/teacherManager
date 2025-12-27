// 教师仪表盘功能模块
class TeacherDashboard {
    constructor() {
        this.currentPage = 'dashboard';
        this.userData = null;
        this.coursesData = [];
        this.assignmentsData = [];
        this.gradesData = [];
        this.init();
    }

    // 初始化
    init() {
        // 检查用户登录状态
        if (!auth.checkSession() || auth.currentUser?.userType !== 'teacher') {
            window.location.href = 'index.html';
            return;
        }

        this.userData = auth.currentUser;
        this.loadTeacherData();
        this.setupEventListeners();
        this.renderCurrentPage();
        this.updateUserInfo();
        this.enforcePasswordChange();
    }

    // 加载教师数据
    loadTeacherData() {
        // 加载教师的课程
        this.coursesData = dataManager.getTeacherCourses(this.userData.id);
        
        // 加载作业数据
        this.assignmentsData = [];
        this.coursesData.forEach(course => {
            const assignments = dataManager.getCourseAssignments(course.id);
            this.assignmentsData.push(...assignments);
        });
        
        // 加载成绩数据
        this.gradesData = dataManager.getData('grades');
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

        // 通知按钮
        const notificationBtn = document.getElementById('notificationBtn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => {
                this.showNotifications();
            });
        }

        // 创建新课程按钮
        const createCourseBtn = document.getElementById('createCourseBtn');
        if (createCourseBtn) {
            createCourseBtn.addEventListener('click', () => {
                this.showCreateCourseModal();
            });
        }

        // 快速操作 - 创建新课程
        const quickCreateCourse = document.querySelector('[data-action="create-course"]');
        if (quickCreateCourse) {
            quickCreateCourse.addEventListener('click', () => {
                this.showCreateCourseModal();
            });
        }

        // 模态框事件监听
        this.setupCourseModalListeners();

        // 搜索功能
        const courseSearchInput = document.getElementById('courseSearchInput');
        if (courseSearchInput) {
            courseSearchInput.addEventListener('input', (e) => {
                this.filterCourses(e.target.value);
            });
        }

        const courseStatusFilter = document.getElementById('courseStatusFilter');
        if (courseStatusFilter) {
            courseStatusFilter.addEventListener('change', (e) => {
                this.filterCoursesByStatus(e.target.value);
            });
        }

        // 模态框关闭按钮
        this.setupModalListeners();
    }

    // 设置模态框监听器
    setupModalListeners() {
        const modalIds = ['courseModal', 'assignmentModal', 'gradeModal', 'materialModal'];
        
        modalIds.forEach(modalId => {
            const modal = document.getElementById(modalId);
            const closeBtn = document.getElementById(`close${modalId.charAt(0).toUpperCase() + modalId.slice(1, -5)}Modal`);
            
            if (modal && closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.closeModal(modalId);
                });
            }
            
            if (modal) {
                window.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.closeModal(modalId);
                    }
                });
            }
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
            case 'courses':
                this.renderCourses();
                break;
            case 'students':
                this.renderStudents();
                break;
            case 'assignments':
                this.renderAssignments();
                break;
            case 'grades':
                this.renderGrades();
                break;
            case 'materials':
                this.renderMaterials();
                break;
            case 'profile':
                this.renderProfile();
                break;
        }
    }

    // 渲染仪表盘
    renderDashboard() {
        // 更新统计数据
        const totalCourses = this.coursesData.length;
        const totalStudents = this.coursesData.reduce((sum, course) => sum + course.currentStudents, 0);
        const totalAssignments = this.assignmentsData.length;
        const pendingGrades = this.calculatePendingGrades();

        document.getElementById('teachingCourses').textContent = totalCourses;
        document.getElementById('totalStudents').textContent = totalStudents;
        document.getElementById('pendingGrades').textContent = pendingGrades;

        // 渲染最近课程
        this.renderRecentCourses();
        
        // 渲染待办事项
        this.renderTodoList();
    }

    // 更新统计卡片
    updateStatCard(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    // 计算待评分数量
    calculatePendingGrades() {
        let pendingGrades = 0;
        this.assignmentsData.forEach(assignment => {
            if (new Date(assignment.endTime) < new Date()) {
                const submissions = dataManager.getData('submissions').filter(s => 
                    s.assignmentId === assignment.id && s.status !== 'graded'
                );
                pendingGrades += submissions.length;
            }
        });
        return pendingGrades;
    }

    // 渲染最近课程
    renderRecentCourses() {
        const recentCoursesContainer = document.getElementById('recentCourses');
        if (!recentCoursesContainer) return;

        // 获取最近的4门课程，按创建时间排序
        const recentCourses = [...this.coursesData]
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .slice(0, 4);

        if (recentCourses.length === 0) {
            recentCoursesContainer.innerHTML = `
                <div class="empty-courses">
                    <i class="fas fa-book-open"></i>
                    <p>暂无课程，点击"创建新课程"开始</p>
                </div>
            `;
            return;
        }

        recentCoursesContainer.innerHTML = recentCourses.map(course => {
            const assignments = dataManager.getCourseAssignments(course.id);
            const enrollmentRate = Math.round((course.currentStudents / course.maxStudents) * 100);
            
            return `
                <div class="course-card-dashboard">
                    <div class="course-header">
                        <div class="course-title">
                            <h4>${course.courseName}</h4>
                            <span class="course-code">${course.courseCode}</span>
                        </div>
                        <span class="status-badge ${course.status}">${this.getStatusText(course.status)}</span>
                    </div>
                    <div class="course-stats">
                        <div class="stat-item">
                            <i class="fas fa-users"></i>
                            <span>${course.currentStudents}/${course.maxStudents}</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-tasks"></i>
                            <span>${assignments.length}</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-chart-line"></i>
                            <span>${enrollmentRate}%</span>
                        </div>
                    </div>
                    <div class="course-actions">
                        <button class="btn-primary btn-sm" onclick="teacherDashboard.switchPage('courses')">
                            管理课程
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 渲染待办事项
    renderTodoList() {
        const todoListContainer = document.getElementById('todoList');
        if (!todoListContainer) return;

        // 动态生成待办事项
        const todos = this.generateTodos();

        if (todos.length === 0) {
            todoListContainer.innerHTML = `
                <div class="empty-todos">
                    <i class="fas fa-check-circle"></i>
                    <p>暂无待办事项</p>
                </div>
            `;
            return;
        }

        todoListContainer.innerHTML = todos.map(todo => `
            <div class="todo-item ${todo.priority}">
                <div class="todo-icon">
                    <i class="fas fa-${todo.icon}"></i>
                </div>
                <div class="todo-content">
                    <h4>${todo.title}</h4>
                    <p>${todo.description}</p>
                    <span class="todo-time">${todo.time}</span>
                </div>
                <div class="todo-actions">
                    <button class="btn-sm btn-${todo.type}" onclick="teacherDashboard.handleTodoAction('${todo.id}', '${todo.action}')">
                        ${todo.actionText}
                    </button>
                </div>
            </div>
        `).join('');
    }

    // 生成待办事项
    generateTodos() {
        const todos = [];
        
        // 检查是否有草稿课程
        const draftCourses = this.coursesData.filter(course => course.status === 'draft');
        draftCourses.forEach(course => {
            todos.push({
                id: `draft_${course.id}`,
                title: '完善课程信息',
                description: `课程"${course.courseName}"仍为草稿状态，请完善信息后发布`,
                time: '待处理',
                icon: 'edit',
                priority: 'high',
                type: 'warning',
                action: 'edit_course',
                actionText: '编辑课程'
            });
        });

        // 检查待批改的作业
        let pendingAssignments = 0;
        this.assignmentsData.forEach(assignment => {
            if (new Date(assignment.endTime) < new Date()) {
                const submissions = dataManager.getData('submissions').filter(s => 
                    s.assignmentId === assignment.id && s.status !== 'graded'
                );
                pendingAssignments += submissions.length;
            }
        });

        if (pendingAssignments > 0) {
            todos.push({
                id: 'grading',
                title: '批改作业',
                description: `有 ${pendingAssignments} 份作业等待批改`,
                time: '紧急',
                icon: 'clipboard-check',
                priority: 'high',
                type: 'danger',
                action: 'grade_assignments',
                actionText: '开始批改'
            });
        }

        // 检查课程选课情况
        const lowEnrollmentCourses = this.coursesData.filter(course => 
            course.status === 'published' && course.currentStudents < course.maxStudents * 0.5
        );

        lowEnrollmentCourses.forEach(course => {
            todos.push({
                id: `enrollment_${course.id}`,
                title: '课程选课提醒',
                description: `课程"${course.courseName}"选课人数较少，可考虑推广`,
                time: '建议关注',
                icon: 'user-plus',
                priority: 'medium',
                type: 'info',
                action: 'promote_course',
                actionText: '查看详情'
            });
        });

        return todos.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    // 获取状态文本
    getStatusText(status) {
        const statusMap = {
            'draft': '草稿',
            'published': '已发布',
            'archived': '已归档'
        };
        return statusMap[status] || status;
    }

    // 处理待办事项操作
    handleTodoAction(todoId, action) {
        switch (action) {
            case 'edit_course':
                const courseId = todoId.replace('draft_', '');
                this.editCourse(courseId);
                break;
            case 'grade_assignments':
                this.switchPage('assignments');
                break;
            case 'promote_course':
                const promoteCourseId = todoId.replace('enrollment_', '');
                this.switchPage('courses');
                break;
            default:
                showMessage('功能开发中...', 'info');
        }
    }

    // 渲染课程管理
    renderCourses() {
        const courseManagementList = document.getElementById('courseManagementList');
        if (!courseManagementList) return;

        courseManagementList.innerHTML = '';

        if (this.coursesData.length === 0) {
            courseManagementList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book-open"></i>
                    <h3>暂无课程</h3>
                    <p>点击"创建新课程"开始创建您的第一门课程</p>
                </div>
            `;
            return;
        }

        this.coursesData.forEach(course => {
            const courseCard = this.createCourseManagementCard(course);
            courseManagementList.appendChild(courseCard);
        });
    }

    // 创建课程管理卡片
    createCourseManagementCard(course) {
        const card = document.createElement('div');
        card.className = 'course-management-card';
        
        const assignments = dataManager.getCourseAssignments(course.id);
        const students = dataManager.getCourseStudents(course.id);
        const statusBadge = this.getStatusBadge(course.status);

        card.innerHTML = `
            <div class="course-card-header">
                <div class="course-info-left">
                    <h3>${course.courseName}</h3>
                    <div class="course-meta">
                        <span class="course-code">${course.courseCode}</span>
                        <span class="course-category">${this.getCategoryLabel(course.category)}</span>
                        ${statusBadge}
                    </div>
                </div>
                <div class="course-actions">
                    <button class="btn-sm btn-primary" onclick="teacherDashboard.editCourse('${course.id}')">
                        <i class="fas fa-edit"></i> 编辑
                    </button>
                    <button class="btn-sm btn-danger" onclick="teacherDashboard.deleteCourse('${course.id}')">
                        <i class="fas fa-trash"></i> 删除
                    </button>
                </div>
            </div>
            <div class="course-description">
                ${course.description || '暂无课程描述'}
            </div>
            <div class="course-stats-grid">
                <div class="stat-item">
                    <div class="stat-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-number">${students.length}</span>
                        <span class="stat-label">已选/容量</span>
                        <span class="stat-detail">${course.maxStudents}人</span>
                    </div>
                </div>
                <div class="stat-item">
                    <div class="stat-icon">
                        <i class="fas fa-tasks"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-number">${assignments.length}</span>
                        <span class="stat-label">作业数量</span>
                    </div>
                </div>
                <div class="stat-item">
                    <div class="stat-icon">
                        <i class="fas fa-credit-card"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-number">${course.credits}</span>
                        <span class="stat-label">学分</span>
                    </div>
                </div>
                <div class="stat-item">
                    <div class="stat-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-number">${Math.round((course.currentStudents / course.maxStudents) * 100)}%</span>
                        <span class="stat-label">选课率</span>
                    </div>
                </div>
            </div>
            <div class="course-management-actions">
                <button class="btn-primary" onclick="teacherDashboard.manageStudents('${course.id}')">
                    <i class="fas fa-users"></i> 管理学生
                </button>
                <button class="btn-secondary" onclick="teacherDashboard.manageAssignments('${course.id}')">
                    <i class="fas fa-tasks"></i> 管理作业
                </button>
                <button class="btn-info" onclick="teacherDashboard.manageGrades('${course.id}')">
                    <i class="fas fa-chart-bar"></i> 管理成绩
                </button>
            </div>
        `;

        return card;
    }

    // 渲染学生管理
    renderStudents() {
        const studentsList = document.getElementById('studentsList');
        if (!studentsList) return;

        // 获取所有课程的学生
        const allStudents = new Map();
        this.coursesData.forEach(course => {
            const students = dataManager.getCourseStudents(course.id);
            students.forEach(student => {
                if (!allStudents.has(student.id)) {
                    allStudents.set(student.id, {
                        ...student,
                        courses: []
                    });
                }
                allStudents.get(student.id).courses.push(course.courseName);
            });
        });

        studentsList.innerHTML = '';

        allStudents.forEach(student => {
            const studentCard = this.createStudentCard(student);
            studentsList.appendChild(studentCard);
        });
    }

    // 创建学生卡片
    createStudentCard(student) {
        const card = document.createElement('div');
        card.className = 'student-card';
        
        card.innerHTML = `
            <div class="student-header">
                <img src="https://picsum.photos/seed/${student.id}/50/50.jpg" alt="学生头像" class="student-avatar">
                <div class="student-info">
                    <h4>${student.name}</h4>
                    <p>${student.username} | ${student.major}</p>
                </div>
            </div>
            <div class="student-details">
                <p><i class="fas fa-envelope"></i> ${student.email}</p>
                <p><i class="fas fa-phone"></i> ${student.phone}</p>
                <p><i class="fas fa-book"></i> 课程: ${student.courses.join(', ')}</p>
            </div>
            <div class="student-actions">
                <button class="btn-primary" onclick="teacherDashboard.viewStudentGrades('${student.id}')">查看成绩</button>
                <button class="btn-secondary" onclick="teacherDashboard.contactStudent('${student.id}')">联系学生</button>
            </div>
        `;

        return card;
    }

    // 渲染作业管理
    renderAssignments() {
        const assignmentsList = document.getElementById('assignmentsList');
        if (!assignmentsList) return;

        assignmentsList.innerHTML = '';

        this.assignmentsData.forEach(assignment => {
            const course = this.coursesData.find(c => c.id === assignment.courseId);
            const submissions = dataManager.getData('submissions').filter(s => s.assignmentId === assignment.id);
            
            const assignmentCard = this.createAssignmentCard(assignment, course, submissions);
            assignmentsList.appendChild(assignmentCard);
        });
    }

    // 创建作业卡片
    createAssignmentCard(assignment, course, submissions) {
        const card = document.createElement('div');
        card.className = 'assignment-card';
        
        const submittedCount = submissions.length;
        const gradedCount = submissions.filter(s => s.status === 'graded').length;
        const status = this.getAssignmentStatus(assignment);

        card.innerHTML = `
            <div class="assignment-header">
                <h3>${assignment.title}</h3>
                <span class="status-badge ${status.class}">${status.text}</span>
            </div>
            <div class="assignment-info">
                <p><i class="fas fa-book"></i> 课程: ${course ? course.courseName : '未知课程'}</p>
                <p><i class="fas fa-tag"></i> 类型: ${assignment.type === 'assignment' ? '作业' : '考试'}</p>
                <p><i class="fas fa-star"></i> 满分: ${assignment.maxScore}分</p>
                <p><i class="fas fa-clock"></i> 截止: ${new Date(assignment.endTime).toLocaleString()}</p>
                <p><i class="fas fa-users"></i> 提交: ${submittedCount}/${course ? course.currentStudents : 0}人</p>
                <p><i class="fas fa-check"></i> 已批改: ${gradedCount}人</p>
            </div>
            <div class="assignment-actions">
                <button class="btn-primary" onclick="teacherDashboard.gradeAssignments('${assignment.id}')">批改作业</button>
                <button class="btn-secondary" onclick="teacherDashboard.editAssignment('${assignment.id}')">编辑</button>
                <button class="btn-info" onclick="teacherDashboard.viewSubmissions('${assignment.id}')">查看提交</button>
            </div>
        `;

        return card;
    }

    // 获取作业状态
    getAssignmentStatus(assignment) {
        const now = new Date();
        const endTime = new Date(assignment.endTime);
        
        if (now < endTime) {
            return { class: 'ongoing', text: '进行中' };
        } else if (now >= endTime && now <= endTime + 7 * 24 * 60 * 60 * 1000) {
            return { class: 'pending', text: '待批改' };
        } else {
            return { class: 'completed', text: '已完成' };
        }
    }

    // 渲染成绩管理
    renderGrades() {
        const gradesList = document.getElementById('gradesList');
        if (!gradesList) return;

        gradesList.innerHTML = '';

        this.coursesData.forEach(course => {
            const courseGrades = this.gradesData.filter(g => {
                return g.assignmentScores.some(score => {
                    const assignment = dataManager.getData('assignments').find(a => a.id === score.assignmentId);
                    return assignment && assignment.courseId === course.id;
                });
            });

            const gradeCard = this.createGradeCard(course, courseGrades);
            gradesList.appendChild(gradeCard);
        });
    }

    // 创建成绩卡片
    createGradeCard(course, grades) {
        const card = document.createElement('div');
        card.className = 'grade-card';
        
        const stats = dataManager.getCourseGradeStats(course.id);
        const students = dataManager.getCourseStudents(course.id);

        card.innerHTML = `
            <div class="grade-header">
                <h3>${course.courseName}</h3>
                <span class="course-code">${course.courseCode}</span>
            </div>
            <div class="grade-info">
                <p><i class="fas fa-users"></i> 学生: ${students.length}人</p>
                <p><i class="fas fa-chart-line"></i> 已评分: ${grades.length}人</p>
                ${stats ? `
                    <p><i class="fas fa-calculator"></i> 平均分: ${stats.average}</p>
                    <p><i class="fas fa-trophy"></i> 最高分: ${stats.max}</p>
                    <p><i class="fas fa-arrow-up"></i> 优秀率: ${stats.excellentRate}%</p>
                    <p><i class="fas fa-check-circle"></i> 及格率: ${stats.passRate}%</p>
                ` : '<p>暂无成绩数据</p>'}
            </div>
            <div class="grade-actions">
                <button class="btn-primary" onclick="teacherDashboard.manageCourseGrades('${course.id}')">管理成绩</button>
                <button class="btn-secondary" onclick="teacherDashboard.exportGrades('${course.id}')">导出成绩</button>
                <button class="btn-info" onclick="teacherDashboard.viewGradeStats('${course.id}')">查看统计</button>
            </div>
        `;

        return card;
    }

    // 渲染课件资源
    renderMaterials() {
        const materialsList = document.getElementById('materialsList');
        if (!materialsList) return;

        materialsList.innerHTML = '';

        this.coursesData.forEach(course => {
            const materials = dataManager.getData('materials').filter(m => m.courseId === course.id);
            
            const courseMaterialsCard = this.createCourseMaterialsCard(course, materials);
            materialsList.appendChild(courseMaterialsCard);
        });
    }

    // 创建课程课件卡片
    createCourseMaterialsCard(course, materials) {
        const card = document.createElement('div');
        card.className = 'materials-card';
        
        card.innerHTML = `
            <div class="materials-header">
                <h3>${course.courseName}</h3>
                <button class="btn-sm btn-primary" onclick="teacherDashboard.uploadMaterial('${course.id}')">
                    <i class="fas fa-upload"></i> 上传课件
                </button>
            </div>
            <div class="materials-list">
                ${materials.length > 0 ? materials.map(material => `
                    <div class="material-item">
                        <div class="material-info">
                            <i class="fas fa-file-${this.getFileIcon(material.type)}"></i>
                            <div>
                                <h4>${material.title}</h4>
                                <p>大小: ${material.size} | 上传时间: ${new Date(material.uploadTime).toLocaleString()}</p>
                            </div>
                        </div>
                        <div class="material-actions">
                            <button class="btn-sm btn-secondary" onclick="teacherDashboard.downloadMaterial('${material.id}')">下载</button>
                            <button class="btn-sm btn-danger" onclick="teacherDashboard.deleteMaterial('${material.id}')">删除</button>
                        </div>
                    </div>
                `).join('') : '<p class="no-materials">暂无课件</p>'}
            </div>
        `;

        return card;
    }

    // 获取文件图标
    getFileIcon(type) {
        const iconMap = {
            'document': 'alt',
            'pdf': 'pdf',
            'video': 'video',
            'audio': 'audio',
            'image': 'image'
        };
        return iconMap[type] || 'alt';
    }

    // 渲染个人信息
    renderProfile() {
        // 更新个人信息显示
        const profileElements = {
            teacherName: document.getElementById('teacherName'),
            teacherTitle: document.getElementById('teacherTitle'),
            teacherDepartment: document.getElementById('teacherDepartment'),
            teacherOffice: document.getElementById('teacherOffice'),
            teacherEmail: document.getElementById('teacherEmail'),
            teacherPhone: document.getElementById('teacherPhone')
        };

        if (profileElements.teacherName) {
            profileElements.teacherName.textContent = this.userData.name;
        }
        if (profileElements.teacherTitle) {
            profileElements.teacherTitle.textContent = this.userData.title || '教师';
        }
        if (profileElements.teacherEmail) {
            profileElements.teacherEmail.textContent = this.userData.email;
        }
        if (profileElements.teacherPhone) {
            profileElements.teacherPhone.textContent = this.userData.phone;
        }
    }

    // 搜索学生
    searchStudents() {
        const searchTerm = document.getElementById('studentSearch').value.trim();
        if (!searchTerm) {
            this.renderStudents();
            return;
        }

        const searchResults = dataManager.searchUsers(searchTerm, 'student');
        
        const studentsList = document.getElementById('studentsList');
        studentsList.innerHTML = '';

        if (searchResults.length === 0) {
            studentsList.innerHTML = '<div class="no-results">未找到匹配的学生</div>';
            return;
        }

        // 过滤出实际在教师课程中的学生
        searchResults.forEach(student => {
            const studentCourses = [];
            this.coursesData.forEach(course => {
                const courseStudents = dataManager.getCourseStudents(course.id);
                if (courseStudents.some(s => s.id === student.id)) {
                    studentCourses.push(course.courseName);
                }
            });

            if (studentCourses.length > 0) {
                const studentWithCourses = {
                    ...student,
                    courses: studentCourses
                };
                const studentCard = this.createStudentCard(studentWithCourses);
                studentsList.appendChild(studentCard);
            }
        });
    }

    // 显示通知
    showNotifications() {
        showMessage('您有2条新通知：\n1. 有学生提交了新的作业\n2. 作业批改提醒', 'info');
    }

    // 关闭模态框
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // 占位方法 - 这些方法的具体实现需要根据业务需求进一步开发
    editCourse(courseId) {
        showMessage('编辑课程功能正在开发中...', 'info');
    }

    deleteCourse(courseId) {
        if (confirm('确定要删除这门课程吗？此操作不可撤销！')) {
            showMessage('删除课程功能正在开发中...', 'info');
        }
    }

    manageStudents(courseId) {
        showMessage('管理学生功能正在开发中...', 'info');
    }

    manageAssignments(courseId) {
        showMessage('管理作业功能正在开发中...', 'info');
    }

    manageGrades(courseId) {
        showMessage('管理成绩功能正在开发中...', 'info');
    }

    viewStudentGrades(studentId) {
        showMessage('查看学生成绩功能正在开发中...', 'info');
    }

    contactStudent(studentId) {
        showMessage('联系学生功能正在开发中...', 'info');
    }

    gradeAssignments(assignmentId) {
        showMessage('批改作业功能正在开发中...', 'info');
    }

    editAssignment(assignmentId) {
        showMessage('编辑作业功能正在开发中...', 'info');
    }

    viewSubmissions(assignmentId) {
        showMessage('查看提交功能正在开发中...', 'info');
    }

    manageCourseGrades(courseId) {
        showMessage('管理课程成绩功能正在开发中...', 'info');
    }

    exportGrades(courseId) {
        showMessage('导出成绩功能正在开发中...', 'info');
    }

    viewGradeStats(courseId) {
        showMessage('查看成绩统计功能正在开发中...', 'info');
    }

    uploadMaterial(courseId) {
        showMessage('上传课件功能正在开发中...', 'info');
    }

    downloadMaterial(materialId) {
        showMessage('下载课件功能正在开发中...', 'info');
    }

    deleteMaterial(materialId) {
        if (confirm('确定要删除这个课件吗？')) {
            showMessage('删除课件功能正在开发中...', 'info');
        }
    }

    // 设置课程模态框事件监听器
    setupCourseModalListeners() {
        // 创建课程表单提交
        const createCourseForm = document.getElementById('createCourseForm');
        if (createCourseForm) {
            createCourseForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.publishCourse();
            });
        }

        // 保存草稿按钮
        const saveDraftBtn = document.getElementById('saveCourseDraft');
        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', () => {
                this.saveCourseDraft();
            });
        }

        // 取消按钮
        const cancelBtn = document.getElementById('cancelCreateCourse');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeCreateCourseModal();
            });
        }

        // 关闭按钮
        const closeBtn = document.getElementById('closeCreateCourseModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeCreateCourseModal();
            });
        }

        // 点击模态框外部关闭
        const modal = document.getElementById('createCourseModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeCreateCourseModal();
                }
            });
        }
    }

    // 显示创建课程模态框
    showCreateCourseModal() {
        const modal = document.getElementById('createCourseModal');
        if (!modal) return;

        // 重置表单
        const form = document.getElementById('createCourseForm');
        if (form) {
            form.reset();
        }

        // 显示模态框
        modal.classList.add('active');
        
        // 添加动画效果
        setTimeout(() => {
            modal.querySelector('.modal-content').style.transform = 'scale(1)';
            modal.querySelector('.modal-content').style.opacity = '1';
        }, 10);
    }

    // 关闭创建课程模态框
    closeCreateCourseModal() {
        const modal = document.getElementById('createCourseModal');
        if (!modal) return;

        // 添加关闭动画
        modal.querySelector('.modal-content').style.transform = 'scale(0.9)';
        modal.querySelector('.modal-content').style.opacity = '0';

        setTimeout(() => {
            modal.classList.remove('active');
        }, 200);
    }

    // 保存课程草稿
    saveCourseDraft() {
        const courseData = this.getFormData();
        if (!this.validateCourseData(courseData, false)) {
            return;
        }

        courseData.status = 'draft';
        courseData.createdAt = new Date().toISOString();
        courseData.updatedAt = new Date().toISOString();

        // 添加到数据管理器
        const courseId = this.addCourseToSystem(courseData);
        
        if (courseId) {
            showMessage('课程草稿保存成功！', 'success');
            this.closeCreateCourseModal();
            this.loadTeacherData(); // 重新加载数据
            this.renderCourses(); // 重新渲染课程列表
        } else {
            showMessage('保存草稿失败，请重试', 'error');
        }
    }

    // 发布课程
    publishCourse() {
        const courseData = this.getFormData();
        if (!this.validateCourseData(courseData, true)) {
            return;
        }

        courseData.status = 'published';
        courseData.createdAt = new Date().toISOString();
        courseData.updatedAt = new Date().toISOString();

        // 添加到数据管理器
        const courseId = this.addCourseToSystem(courseData);
        
        if (courseId) {
            showMessage('课程发布成功！学生现在可以选课了', 'success');
            this.closeCreateCourseModal();
            this.loadTeacherData(); // 重新加载数据
            this.renderCourses(); // 重新渲染课程列表
            
            // 添加操作日志
            dataManager.addLog(this.userData.id, 'create_course', `创建课程: ${courseData.courseName}`);
        } else {
            showMessage('发布课程失败，请重试', 'error');
        }
    }

    // 获取表单数据
    getFormData() {
        const form = document.getElementById('createCourseForm');
        if (!form) return null;

        return {
            courseName: form.courseName.value.trim(),
            courseCode: form.courseCode.value.trim(),
            description: form.courseDescription.value.trim(),
            credits: parseInt(form.courseCredits.value) || 0,
            maxStudents: parseInt(form.maxStudents.value) || 0,
            category: form.courseCategory.value,
            teacherId: this.userData.id,
            currentStudents: 0,
            departmentId: this.userData.departmentId
        };
    }

    // 验证课程数据
    validateCourseData(data, isPublish = false) {
        const errors = [];

        // 必填字段验证
        if (!data.courseName) {
            errors.push('课程名称不能为空');
        }
        if (!data.courseCode) {
            errors.push('课程编号不能为空');
        }
        if (!data.credits || data.credits < 1 || data.credits > 6) {
            errors.push('学分必须在1-6之间');
        }
        if (!data.maxStudents || data.maxStudents < 10 || data.maxStudents > 200) {
            errors.push('最大选课人数必须在10-200之间');
        }
        if (!data.category) {
            errors.push('请选择课程类别');
        }

        // 发布时的额外验证
        if (isPublish) {
            if (!data.description || data.description.length < 10) {
                errors.push('发布课程时，课程简介不能少于10个字符');
            }

            // 检查课程编号是否重复
            const existingCourse = this.coursesData.find(course => 
                course.courseCode === data.courseCode
            );
            if (existingCourse) {
                errors.push('课程编号已存在，请使用其他编号');
            }
        }

        if (errors.length > 0) {
            showMessage(errors.join('\n'), 'error');
            return false;
        }

        return true;
    }

    // 添加课程到系统
    addCourseToSystem(courseData) {
        try {
            const courseId = dataManager.generateId();
            const course = {
                id: courseId,
                ...courseData
            };

            // 添加到数据管理器
            dataManager.data.courses.push(course);
            dataManager.saveData();

            return courseId;
        } catch (error) {
            console.error('添加课程失败:', error);
            return null;
        }
    }

    // 获取状态标签
    getStatusBadge(status) {
        const statusMap = {
            'draft': '<span class="status-badge draft">草稿</span>',
            'published': '<span class="status-badge published">已发布</span>',
            'archived': '<span class="status-badge archived">已归档</span>'
        };
        return statusMap[status] || '';
    }

    // 获取分类标签
    getCategoryLabel(category) {
        const categoryMap = {
            'required': '必修课',
            'elective': '选修课',
            'practical': '实践课'
        };
        return categoryMap[category] || category;
    }

    // 筛选课程
    filterCourses(searchTerm) {
        if (!searchTerm) {
            this.renderCourses();
            return;
        }

        const filteredCourses = this.coursesData.filter(course => {
            return course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   course.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()));
        });

        this.renderFilteredCourses(filteredCourses);
    }

    // 按状态筛选课程
    filterCoursesByStatus(status) {
        if (!status) {
            this.renderCourses();
            return;
        }

        const filteredCourses = this.coursesData.filter(course => 
            course.status === status
        );

        this.renderFilteredCourses(filteredCourses);
    }

    // 渲染筛选后的课程
    renderFilteredCourses(courses) {
        const courseManagementList = document.getElementById('courseManagementList');
        if (!courseManagementList) return;

        courseManagementList.innerHTML = '';

        if (courses.length === 0) {
            courseManagementList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>未找到匹配的课程</h3>
                    <p>尝试调整搜索条件或筛选器</p>
                </div>
            `;
            return;
        }

        courses.forEach(course => {
            const courseCard = this.createCourseManagementCard(course);
            courseManagementList.appendChild(courseCard);
        });
    }

    showAddCourseModal() {
        showMessage('添加课程功能正在开发中...', 'info');
    }

    showAddAssignmentModal() {
        showMessage('添加作业功能正在开发中...', 'info');
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
    window.teacherDashboard = new TeacherDashboard();
});