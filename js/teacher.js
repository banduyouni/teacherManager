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
        this.setupEditCourseModalListeners();
        this.setupAssignmentModalListeners();

        // 创建作业/考试按钮
        const createAssignmentBtn = document.getElementById('createAssignmentBtn');
        if (createAssignmentBtn) {
            createAssignmentBtn.addEventListener('click', (e) => {
                console.log('Create assignment button clicked');
                e.preventDefault();
                this.showCreateAssignmentModal();
            });
        }

        // 快速操作 - 创建作业
        const quickCreateAssignment = document.querySelector('[data-action="create-assignment"]');
        if (quickCreateAssignment) {
            quickCreateAssignment.addEventListener('click', () => {
                this.showCreateAssignmentModal();
            });
        }

        // 作业与考试tab切换
        const tabButtons = document.querySelectorAll('.assignments-tabs .tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                console.log('Tab button clicked:', btn.dataset.tab);
                // 移除所有active类
                tabButtons.forEach(b => b.classList.remove('active'));
                // 添加active类到当前按钮
                btn.classList.add('active');
                
                // 筛选对应类型的作业
                const type = btn.dataset.tab;
                this.filterAssignmentsByType(type);
            });
        });

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
        
        // 计算作业和考试数量
        const assignmentCount = assignments.filter(a => a.type === 'assignment').length;
        const examCount = assignments.filter(a => a.type === 'exam').length;

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
                        <span class="stat-number">${students.length}/${course.maxStudents}</span>
                        <span class="stat-label">已选/容量</span>
                    </div>
                </div>
                <div class="stat-item">
                    <div class="stat-icon">
                        <i class="fas fa-tasks"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-number">${assignmentCount}</span>
                        <span class="stat-label">作业数量</span>
                    </div>
                </div>
                <div class="stat-item">
                    <div class="stat-icon">
                        <i class="fas fa-clipboard-check"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-number">${examCount}</span>
                        <span class="stat-label">考试数量</span>
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
            </div>
            <div class="course-management-actions">
                <button class="btn-primary" onclick="teacherDashboard.manageAssignments('${course.id}')">
                    <i class="fas fa-tasks"></i> 管理作业/考试
                </button>
                <button class="btn-info" onclick="teacherDashboard.manageGrades('${course.id}')">
                    <i class="fas fa-chart-bar"></i> 管理成绩
                </button>
            </div>
        `;

        return card;
    }



    // 渲染作业管理
    renderAssignments() {
        const assignmentsList = document.getElementById('assignmentsList');
        const emptyState = document.getElementById('assignmentsEmptyState');
        
        if (!assignmentsList) return;

        assignmentsList.innerHTML = '';

        if (this.assignmentsData.length === 0) {
            if (emptyState) {
                emptyState.style.display = 'block';
            }
            return;
        }

        if (emptyState) {
            emptyState.style.display = 'none';
        }

        // 默认只显示作业类型
        const filteredAssignments = this.assignmentsData.filter(assignment => assignment.type === 'assignment');
        
        filteredAssignments.forEach(assignment => {
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

    // 编辑课程
    editCourse(courseId) {
        const course = this.coursesData.find(c => c.id === courseId);
        if (!course) {
            showMessage('课程不存在', 'error');
            return;
        }

        this.showEditCourseModal(course);
    }

    // 删除课程
    deleteCourse(courseId) {
        const course = this.coursesData.find(c => c.id === courseId);
        if (!course) {
            showMessage('课程不存在', 'error');
            return;
        }

        // 检查课程是否有学生选课
        const students = dataManager.getCourseStudents(courseId);
        if (students.length > 0) {
            if (!confirm(`"${course.courseName}" 已有 ${students.length} 名学生选课，删除课程将同时删除所有相关数据（包括学生选课记录、作业、成绩等）。确定要删除吗？`)) {
                return;
            }
        } else {
            if (!confirm(`确定要删除课程"${course.courseName}"吗？此操作不可撤销！`)) {
                return;
            }
        }

        try {
            // 删除课程相关的所有数据
            this.deleteCourseRelatedData(courseId);
            
            // 删除课程
            const courseIndex = dataManager.data.courses.findIndex(c => c.id === courseId);
            if (courseIndex > -1) {
                dataManager.data.courses.splice(courseIndex, 1);
                
                // 保存数据
                dataManager.saveData();
                
                // 重新加载数据并渲染
                this.loadTeacherData();
                this.renderCourses();
                
                showMessage(`课程"${course.courseName}"删除成功`, 'success');
                
                // 添加操作日志
                try {
                    dataManager.addLog(this.userData.id, 'delete_course', `删除课程: ${course.courseName}`);
                } catch (logError) {
                    console.log('日志记录失败，但课程删除成功');
                }
            } else {
                showMessage('课程不存在或已被删除', 'warning');
            }
        } catch (error) {
            console.error('删除课程失败:', error);
            showMessage('删除课程失败：' + error.message, 'error');
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
        if (!this.validateCourseData(courseData, false)) {
            return;
        }

        // 额外检查课程编号是否重复
        const existingCourse = this.coursesData.find(course => 
            course.courseCode === courseData.courseCode
        );
        if (existingCourse) {
            showMessage('课程编号已存在，请使用其他编号', 'error');
            return;
        }

        // 发布时的额外验证
        if (!courseData.description || courseData.description.length < 10) {
            showMessage('发布课程时，课程简介不能少于10个字符', 'error');
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
        }

        if (errors.length > 0) {
            showMessage(errors.join('\n'), 'error');
            return false;
        }

        return true;
    }

    // 验证编辑课程数据
    validateEditCourseData(data, excludeCourseId = null) {
        const errors = [];

        // 基础字段验证
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

        // 检查课程编号是否重复（排除当前课程）
        const existingCourse = this.coursesData.find(course => 
            course.courseCode === data.courseCode && course.id !== excludeCourseId
        );
        if (existingCourse) {
            errors.push('课程编号已存在，请使用其他编号');
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

    // 设置编辑课程模态框事件监听器
    setupEditCourseModalListeners() {
        // 编辑课程表单提交
        const editCourseForm = document.getElementById('editCourseForm');
        if (editCourseForm) {
            editCourseForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateCourse();
            });
        }

        // 取消按钮
        const cancelEditBtn = document.getElementById('cancelEditCourse');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => {
                this.closeEditCourseModal();
            });
        }

        // 关闭按钮
        const closeBtn = document.getElementById('closeEditCourseModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeEditCourseModal();
            });
        }

        // 点击模态框外部关闭
        const modal = document.getElementById('editCourseModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeEditCourseModal();
                }
            });
        }
    }

    // 显示编辑课程模态框
    showEditCourseModal(course) {
        const modal = document.getElementById('editCourseModal');
        if (!modal) return;

        // 填充表单数据
        const form = document.getElementById('editCourseForm');
        if (form) {
            form.editCourseId.value = course.id;
            form.editCourseName.value = course.courseName || '';
            form.editCourseCode.value = course.courseCode || '';
            form.editCourseDescription.value = course.description || '';
            form.editCourseCredits.value = course.credits || 1;
            form.editMaxStudents.value = course.maxStudents || 10;
            form.editCourseCategory.value = course.category || 'required';
            form.editCourseStatus.value = course.status || 'draft';
        }

        // 显示模态框
        modal.classList.add('active');
        
        // 添加动画效果
        setTimeout(() => {
            modal.querySelector('.modal-content').style.transform = 'scale(1)';
            modal.querySelector('.modal-content').style.opacity = '1';
        }, 10);
    }

    // 关闭编辑课程模态框
    closeEditCourseModal() {
        const modal = document.getElementById('editCourseModal');
        if (!modal) return;

        // 添加关闭动画
        modal.querySelector('.modal-content').style.transform = 'scale(0.9)';
        modal.querySelector('.modal-content').style.opacity = '0';

        setTimeout(() => {
            modal.classList.remove('active');
        }, 200);
    }

    // 更新课程
    updateCourse() {
        const form = document.getElementById('editCourseForm');
        if (!form) return;

        const courseId = form.editCourseId.value;
        const course = this.coursesData.find(c => c.id === courseId);
        
        if (!course) {
            showMessage('课程不存在', 'error');
            return;
        }

        const updatedData = {
            courseName: form.editCourseName.value.trim(),
            courseCode: form.editCourseCode.value.trim(),
            description: form.editCourseDescription.value.trim(),
            credits: parseInt(form.editCourseCredits.value) || 0,
            maxStudents: parseInt(form.editMaxStudents.value) || 0,
            category: form.editCourseCategory.value,
            status: form.editCourseStatus.value,
            updatedAt: new Date().toISOString()
        };

        // 验证数据（使用编辑模式的验证）
        if (!this.validateEditCourseData(updatedData, courseId)) {
            return;
        }

        try {
            // 更新课程数据
            Object.assign(course, updatedData);
            
            // 如果是草稿改为发布，设置发布时间
            if (course.status === 'published' && !course.publishedAt) {
                course.publishedAt = new Date().toISOString();
            }

            // 保存数据
            dataManager.saveData();
            
            // 重新加载数据并渲染
            this.loadTeacherData();
            this.renderCourses();
            
            showMessage(`课程"${course.courseName}"更新成功`, 'success');
            this.closeEditCourseModal();
            
            // 添加操作日志
            dataManager.addLog(this.userData.id, 'update_course', `更新课程: ${course.courseName}`);
        } catch (error) {
            console.error('更新课程失败:', error);
            showMessage('更新课程失败，请重试', 'error');
        }
    }

    // 删除课程相关数据
    deleteCourseRelatedData(courseId) {
        try {
            // 删除学生选课记录
            if (dataManager.data.enrollments) {
                dataManager.data.enrollments = dataManager.data.enrollments.filter(e => e.courseId !== courseId);
            }
            
            // 删除课程作业和提交记录
            if (dataManager.data.assignments) {
                const courseAssignments = dataManager.data.assignments.filter(a => a.courseId === courseId);
                
                // 删除这些作业的提交记录
                if (dataManager.data.submissions) {
                    courseAssignments.forEach(assignment => {
                        dataManager.data.submissions = dataManager.data.submissions.filter(s => s.assignmentId !== assignment.id);
                    });
                }
                
                // 删除课程作业
                dataManager.data.assignments = dataManager.data.assignments.filter(a => a.courseId !== courseId);
            }
            
            // 删除课程成绩记录（简化逻辑）
            if (dataManager.data.grades) {
                // 这里我们可以简单跳过成绩删除，因为逻辑复杂，或者可以添加更简单的逻辑
                // 为了确保删除成功，我们先注释掉复杂的成绩删除逻辑
                // dataManager.data.grades = dataManager.data.grades.filter(g => g.courseId !== courseId);
            }
            
            // 删除课程课件
            if (dataManager.data.materials) {
                dataManager.data.materials = dataManager.data.materials.filter(m => m.courseId !== courseId);
            }
        } catch (error) {
            console.error('删除课程相关数据时出错:', error);
            // 即使部分删除失败，也继续删除主课程
        }
    }

    showAddCourseModal() {
        showMessage('添加课程功能正在开发中...', 'info');
    }

    // 设置作业模态框事件监听器
    setupAssignmentModalListeners() {
        // 创建作业表单提交
        const createAssignmentForm = document.getElementById('createAssignmentForm');
        if (createAssignmentForm) {
            createAssignmentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.createAssignment();
            });
        }

        // 取消按钮
        const cancelBtn = document.getElementById('cancelCreateAssignment');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeCreateAssignmentModal();
            });
        }

        // 关闭按钮
        const closeBtn = document.getElementById('closeCreateAssignmentModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeCreateAssignmentModal();
            });
        }

        // 点击模态框外部关闭
        const modal = document.getElementById('createAssignmentModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeCreateAssignmentModal();
                }
            });
        }

        // 文件上传
        const fileUploadArea = document.getElementById('assignmentFileUpload');
        const fileInput = document.getElementById('assignmentFiles');
        
        if (fileUploadArea && fileInput) {
            fileUploadArea.addEventListener('click', () => {
                fileInput.click();
            });

            fileUploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                fileUploadArea.classList.add('dragover');
            });

            fileUploadArea.addEventListener('dragleave', () => {
                fileUploadArea.classList.remove('dragover');
            });

            fileUploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                fileUploadArea.classList.remove('dragover');
                this.handleFileSelect(e.dataTransfer.files);
            });

            fileInput.addEventListener('change', (e) => {
                this.handleFileSelect(e.target.files);
            });
        }

        // 任务类型切换
        const typeInputs = document.querySelectorAll('input[name="assignmentType"]');
        typeInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.toggleAssignmentType(input.value);
            });
        });

        // 高级设置切换
        const settingsToggle = document.getElementById('settingsToggle');
        const settingsContent = document.getElementById('settingsContent');
        if (settingsToggle && settingsContent) {
            settingsToggle.addEventListener('click', () => {
                settingsContent.classList.toggle('show');
                const chevron = settingsToggle.querySelector('.fa-chevron-down, .fa-chevron-up');
                if (chevron) {
                    chevron.classList.toggle('fa-chevron-down');
                    chevron.classList.toggle('fa-chevron-up');
                }
            });
        }

        // Tab切换
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.filterAssignmentsByType(btn.dataset.tab);
            });
        });
    }

    // 显示创建作业模态框
    showCreateAssignmentModal() {
        console.log('showCreateAssignmentModal called');
        const modal = document.getElementById('createAssignmentModal');
        if (!modal) {
            console.error('createAssignmentModal not found');
            return;
        }

        const modalContent = modal.querySelector('.modal-content');
        if (!modalContent) {
            console.error('modal-content not found in createAssignmentModal');
            return;
        }
        console.log('Modal and modal-content found');

        // 重置表单
        const form = document.getElementById('createAssignmentForm');
        if (form) {
            form.reset();
            // 设置默认开始时间为当前时间
            const now = new Date();
            const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
                .toISOString()
                .slice(0, 16);
            form.assignmentStartTime.value = localDateTime;
        }

        // 加载课程选项
        this.loadCourseOptions();

        // 重置动画状态
        modalContent.style.transform = 'scale(0.9)';
        modalContent.style.opacity = '0';
        
        // 显示模态框
        modal.classList.add('active');
        
        // 添加动画效果
        setTimeout(() => {
            modalContent.style.transform = 'scale(1)';
            modalContent.style.opacity = '1';
        }, 10);
    }

    // 关闭创建作业模态框
    closeCreateAssignmentModal() {
        const modal = document.getElementById('createAssignmentModal');
        if (!modal) return;

        const modalContent = modal.querySelector('.modal-content');
        if (!modalContent) return;

        // 添加关闭动画
        modalContent.style.transform = 'scale(0.9)';
        modalContent.style.opacity = '0';

        setTimeout(() => {
            modal.classList.remove('active');
            // 清空已上传文件列表
            const uploadedFiles = document.getElementById('uploadedFiles');
            if (uploadedFiles) {
                uploadedFiles.innerHTML = '';
            }
            this.currentFiles = [];
        }, 200);
    }

    // 加载课程选项
    loadCourseOptions() {
        const courseSelect = document.getElementById('assignmentCourse');
        if (!courseSelect) return;

        courseSelect.innerHTML = '<option value="">选择课程</option>';
        
        this.coursesData.filter(course => course.status === 'published').forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = `${course.courseName} (${course.courseCode})`;
            courseSelect.appendChild(option);
        });
    }

    // 切换作业类型
    toggleAssignmentType(type) {
        const durationField = document.getElementById('assignmentDuration').parentElement;
        if (type === 'exam') {
            durationField.style.display = 'block';
            durationField.querySelector('label').textContent = '考试时长（分钟）*';
        } else {
            durationField.style.display = 'none';
        }
    }

    // 处理文件选择
    handleFileSelect(files) {
        const maxSize = 50 * 1024 * 1024; // 50MB
        const allowedTypes = ['.doc', '.docx', '.pdf', '.txt', '.jpg', '.jpeg', '.png', '.mp4', '.mp3'];
        
        Array.from(files).forEach(file => {
            if (file.size > maxSize) {
                showMessage(`文件 "${file.name}" 超过50MB限制`, 'error');
                return;
            }

            const fileExt = '.' + file.name.split('.').pop().toLowerCase();
            if (!allowedTypes.includes(fileExt)) {
                showMessage(`文件 "${file.name}" 格式不支持`, 'error');
                return;
            }

            if (!this.currentFiles) {
                this.currentFiles = [];
            }

            if (this.currentFiles.length >= 5) {
                showMessage('最多只能上传5个文件', 'error');
                return;
            }

            this.currentFiles.push(file);
            this.displayUploadedFile(file);
        });

        // 清空文件输入
        document.getElementById('assignmentFiles').value = '';
    }

    // 显示已上传文件
    displayUploadedFile(file) {
        const uploadedFiles = document.getElementById('uploadedFiles');
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';

        const fileExt = file.name.split('.').pop().toLowerCase();
        let iconClass = 'file';
        
        if (['pdf'].includes(fileExt)) iconClass = 'pdf';
        else if (['doc', 'docx'].includes(fileExt)) iconClass = 'doc';
        else if (['txt'].includes(fileExt)) iconClass = 'txt';
        else if (['jpg', 'jpeg', 'png'].includes(fileExt)) iconClass = 'image';
        else if (['mp4'].includes(fileExt)) iconClass = 'video';
        else if (['mp3'].includes(fileExt)) iconClass = 'audio';

        const fileSize = (file.size / 1024 / 1024).toFixed(2);

        fileItem.innerHTML = `
            <div class="file-info">
                <div class="file-icon ${iconClass}">
                    <i class="fas fa-file-${iconClass}"></i>
                </div>
                <div class="file-details">
                    <h5>${file.name}</h5>
                    <span>${fileSize} MB</span>
                </div>
            </div>
            <button type="button" class="file-remove" onclick="teacherDashboard.removeUploadedFile(this, '${file.name}')">
                <i class="fas fa-times"></i>
            </button>
        `;

        uploadedFiles.appendChild(fileItem);
    }

    // 移除已上传文件
    removeUploadedFile(button, fileName) {
        const fileItem = button.closest('.file-item');
        fileItem.remove();
        
        this.currentFiles = this.currentFiles.filter(file => file.name !== fileName);
    }

    // 创建作业
    createAssignment() {
        const form = document.getElementById('createAssignmentForm');
        if (!form) return;

        const formData = new FormData(form);
        const assignmentType = formData.get('assignmentType');

        // 获取表单数据
        const assignmentData = {
            type: assignmentType,
            title: formData.get('assignmentTitle').trim(),
            courseId: formData.get('assignmentCourse'),
            description: formData.get('assignmentDescription').trim(),
            startTime: formData.get('assignmentStartTime'),
            endTime: formData.get('assignmentEndTime'),
            maxScore: parseInt(formData.get('assignmentMaxScore')) || 100,
            duration: assignmentType === 'exam' ? parseInt(formData.get('assignmentDuration')) : null,
            lateSubmission: formData.get('assignmentLateSubmission'),
            allowPeerReview: formData.get('assignmentVisibility') === 'yes',
            teacherId: this.userData.id,
            files: this.currentFiles || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // 验证数据
        if (!this.validateAssignmentData(assignmentData)) {
            return;
        }

        try {
            // 生成作业ID
            const assignmentId = dataManager.generateId();
            const assignment = {
                id: assignmentId,
                ...assignmentData
            };

            // 保存到数据管理器
            dataManager.data.assignments.push(assignment);
            dataManager.saveData();

            // 重新加载数据并渲染
            this.loadTeacherData();
            this.renderAssignments();

            showMessage(`${assignmentType === 'exam' ? '考试' : '作业'}创建成功！`, 'success');
            this.closeCreateAssignmentModal();

            // 添加操作日志
            dataManager.addLog(this.userData.id, 'create_assignment', `创建${assignmentType === 'exam' ? '考试' : '作业'}: ${assignmentData.title}`);

        } catch (error) {
            console.error('创建作业失败:', error);
            showMessage('创建作业失败，请重试', 'error');
        }
    }

    // 验证作业数据
    validateAssignmentData(data) {
        const errors = [];

        if (!data.title) {
            errors.push('标题不能为空');
        }
        if (!data.courseId) {
            errors.push('请选择所属课程');
        }
        if (!data.startTime) {
            errors.push('请设置开始时间');
        }
        if (!data.endTime) {
            errors.push('请设置截止时间');
        }
        if (new Date(data.endTime) <= new Date(data.startTime)) {
            errors.push('截止时间必须晚于开始时间');
        }
        if (data.type === 'exam' && (!data.duration || data.duration < 30)) {
            errors.push('考试时长不能少于30分钟');
        }

        if (errors.length > 0) {
            showMessage(errors.join('\n'), 'error');
            return false;
        }

        return true;
    }

    // 按类型筛选作业
    filterAssignmentsByType(type) {
        console.log('Filtering assignments by type:', type);
        const assignmentsList = document.getElementById('assignmentsList');
        if (!assignmentsList) return;

        // 映射tab类型到数据类型
        const dataTypeMap = {
            'assignments': 'assignment',
            'exams': 'exam'
        };
        
        const dataType = dataTypeMap[type] || type;
        console.log('Mapped data type:', dataType);
        console.log('Total assignments:', this.assignmentsData.length);
        
        const filteredAssignments = this.assignmentsData.filter(assignment => assignment.type === dataType);
        console.log('Filtered assignments count:', filteredAssignments.length);

        assignmentsList.innerHTML = '';

        if (filteredAssignments.length === 0) {
            assignmentsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-content">
                        <i class="fas fa-${type === 'exams' ? 'clipboard-check' : 'file-alt'}"></i>
                        <h3>暂无${type === 'exams' ? '考试' : '作业'}</h3>
                        <p>点击"创建作业/考试"开始创建您的第一个${type === 'exams' ? '考试' : '作业'}</p>
                    </div>
                </div>
            `;
            return;
        }

        filteredAssignments.forEach(assignment => {
            const course = this.coursesData.find(c => c.id === assignment.courseId);
            const submissions = dataManager.getData('submissions').filter(s => s.assignmentId === assignment.id);
            
            const assignmentCard = this.createAssignmentCard(assignment, course, submissions);
            assignmentsList.appendChild(assignmentCard);
        });
    }

    showAddAssignmentModal() {
        this.showCreateAssignmentModal();
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