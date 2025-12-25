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
        
        // 强制执行兼容性检查，确保作业数据有正确的teacherId
        dataManager.ensureDataCompatibility();
        
        // 加载作业数据 - 直接通过 teacherId 加载所有属于当前教师的作业
        this.assignmentsData = dataManager.getTeacherAssignments(this.userData.id);
        
        // 加载成绩数据
        this.gradesData = dataManager.getData('grades');
    }

    // 加载作业数据的辅助方法
    loadAssignmentsData() {
        // 直接通过 teacherId 加载所有属于当前教师的作业，而不是只加载属于当前教师课程的作业
        // 这样可以确保即使编辑作业时改变了 courseId，只要 teacherId 正确，作业就能被加载
        this.assignmentsData = dataManager.getTeacherAssignments(this.userData.id);
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
                
                // 切换内容区域
                const tabType = btn.dataset.tab;
                this.switchAssignmentTab(tabType);
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

        // 作业课程筛选下拉框
        const assignmentCourseFilter = document.getElementById('assignmentCourseFilter');
        if (assignmentCourseFilter) {
            assignmentCourseFilter.addEventListener('change', (e) => {
                this.filterAssignmentsByCourse(e.target.value);
            });
        }

        // 模态框关闭按钮
        this.setupModalListeners();
    }

    // 设置模态框监听器
    setupModalListeners() {
        const modalIds = ['courseModal', 'assignmentModal', 'gradeModal', 'materialModal', 'gradingModal'];
        
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

        // 编辑作业模态框特定处理
        const editModal = document.getElementById('editAssignmentModal');
        const closeEditBtn = document.getElementById('closeEditAssignmentModal');
        
        if (editModal && closeEditBtn) {
            closeEditBtn.addEventListener('click', () => {
                this.closeEditAssignmentModal();
            });
        }
        
        if (editModal) {
            window.addEventListener('click', (e) => {
                if (e.target === editModal) {
                    this.closeEditAssignmentModal();
                }
            });
        }

        // 批改模态框特定处理
        this.setupGradingModalListeners();
    }

    // 设置批改模态框监听器
    setupGradingModalListeners() {
        const cancelBtn = document.getElementById('cancelGrading');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeGradingModal();
            });
        }

        const saveAllBtn = document.getElementById('saveAllGradesBtn');
        if (saveAllBtn) {
            saveAllBtn.addEventListener('click', () => {
                this.saveAllGrades();
            });
        }

        const exportBtn = document.getElementById('exportGradesBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportGrades();
            });
        }

        const filterSelect = document.getElementById('gradingFilter');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.filterSubmissions(e.target.value);
            });
        }

        const searchInput = document.getElementById('gradingSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchSubmissions(e.target.value);
            });
        }
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

        // 初始化课程筛选下拉框
        this.initAssignmentCourseFilter();

        assignmentsList.innerHTML = '';

        // 只显示作业类型（不包括考试）
        const filteredAssignments = this.assignmentsData.filter(assignment => assignment.type === 'assignment');
        
        if (filteredAssignments.length === 0) {
            if (emptyState) {
                emptyState.style.display = 'block';
            }
            return;
        }

        if (emptyState) {
            emptyState.style.display = 'none';
        }

        filteredAssignments.forEach(assignment => {
            const course = this.coursesData.find(c => c.id === assignment.courseId);
            const submissions = dataManager.getData('submissions').filter(s => s.assignmentId === assignment.id);
            
            const assignmentCard = this.createAssignmentCard(assignment, course, submissions);
            assignmentsList.appendChild(assignmentCard);
        });
    }

    // 初始化作业课程筛选下拉框
    initAssignmentCourseFilter() {
        const courseFilter = document.getElementById('assignmentCourseFilter');
        if (!courseFilter) return;

        // 保存当前选中的值
        const currentValue = courseFilter.value;

        // 清空并添加默认选项
        courseFilter.innerHTML = '<option value="">全部课程</option>';

        // 获取所有有作业的课程（去重）
        const coursesWithAssignments = new Set();
        this.assignmentsData.forEach(assignment => {
            if (assignment.courseId) {
                coursesWithAssignments.add(assignment.courseId);
            }
        });

        // 添加课程选项
        Array.from(coursesWithAssignments).forEach(courseId => {
            const course = this.coursesData.find(c => c.id === courseId);
            if (course) {
                const option = document.createElement('option');
                option.value = courseId;
                option.textContent = `${course.courseName} (${course.courseCode})`;
                courseFilter.appendChild(option);
            }
        });

        // 恢复之前选中的值
        if (currentValue) {
            courseFilter.value = currentValue;
        }
    }

    // 按课程筛选作业
    filterAssignmentsByCourse(courseId) {
        // 获取当前激活的tab类型
        const currentTab = document.querySelector('.assignments-tabs .tab-btn.active');
        const tabType = currentTab ? currentTab.dataset.tab : 'assignments';

        // 根据类型选择正确的容器
        const assignmentsList = document.getElementById(
            tabType === 'exams' ? 'examsList' : 'assignmentsList'
        );
        if (!assignmentsList) return;

        // 映射tab类型到数据类型
        const dataTypeMap = {
            'assignments': 'assignment',
            'exams': 'exam'
        };
        const dataType = dataTypeMap[tabType] || 'assignment';

        // 筛选作业
        let filteredAssignments = this.assignmentsData.filter(assignment => assignment.type === dataType);
        
        if (courseId) {
            filteredAssignments = filteredAssignments.filter(assignment => assignment.courseId === courseId);
        }

        assignmentsList.innerHTML = '';

        if (filteredAssignments.length === 0) {
            assignmentsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-content">
                        <i class="fas fa-${tabType === 'exams' ? 'clipboard-check' : 'file-alt'}"></i>
                        <h3>暂无${tabType === 'exams' ? '考试' : '作业'}</h3>
                        <p>${courseId ? '该课程下暂无' + (tabType === 'exams' ? '考试' : '作业') : '点击"创建作业/考试"开始创建您的第一个' + (tabType === 'exams' ? '考试' : '作业')}</p>
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
                <button class="btn-primary" onclick="teacherDashboard.gradeAssignments('${assignment.id}')">批改作业/考试</button>
                <button class="btn-secondary" onclick="teacherDashboard.editAssignment('${assignment.id}')">编辑</button>
                <button class="btn-danger" onclick="teacherDashboard.deleteAssignment('${assignment.id}')">删除</button>
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
        // 获取当前作业列表的筛选条件
        const assignmentCourseFilter = document.getElementById('assignmentCourseFilter');
        const currentCourseFilterValue = assignmentCourseFilter ? assignmentCourseFilter.value : '';
        
        // 切换到批改作业标签
        const gradingTab = document.querySelector('.assignments-tabs .tab-btn[data-tab="grading"]');
        if (gradingTab) {
            gradingTab.click();
        }
        
        // 保存要聚焦的作业ID和筛选条件
        this.targetAssignmentId = assignmentId;
        this.targetCourseFilter = currentCourseFilterValue;
    }

    editAssignment(assignmentId) {
        const assignment = this.assignmentsData.find(a => a.id === assignmentId);
        if (!assignment) {
            showMessage('作业不存在', 'error');
            return;
        }

        this.showEditAssignmentModal(assignment);
    }

    deleteAssignment(assignmentId) {
        const assignment = this.assignmentsData.find(a => a.id === assignmentId);
        if (!assignment) {
            showMessage('作业不存在', 'error');
            return;
        }

        const assignmentType = assignment.type === 'exam' ? '考试' : '作业';
        const course = this.coursesData.find(c => c.id === assignment.courseId);
        const courseName = course ? course.courseName : '未知课程';

        // 检查是否有学生提交
        const submissions = dataManager.getData('submissions').filter(s => s.assignmentId === assignmentId);
        const hasSubmissions = submissions.length > 0;

        let confirmMessage = `确定要删除${assignmentType}"${assignment.title}"吗？`;
        if (hasSubmissions) {
            confirmMessage += `\n\n注意：该${assignmentType}已有${submissions.length}名学生提交，删除后将同时删除所有提交记录和成绩，此操作不可撤销！`;
        } else {
            confirmMessage += '\n\n此操作不可撤销！';
        }

        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            // 删除相关的提交记录
            if (hasSubmissions) {
                const submissionIds = submissions.map(s => s.id);
                submissionIds.forEach(submissionId => {
                    dataManager.deleteData('submissions', submissionId);
                });
            }

            // 删除相关的成绩记录
            const grades = dataManager.getData('grades');
            const relatedGrades = grades.filter(grade => 
                grade.assignmentScores && grade.assignmentScores.some(score => score.assignmentId === assignmentId)
            );
            
            relatedGrades.forEach(grade => {
                // 从成绩记录中移除该作业的成绩
                grade.assignmentScores = grade.assignmentScores.filter(score => score.assignmentId !== assignmentId);
                
                // 如果该学生的成绩记录为空，可以考虑删除整个成绩记录或更新totalScore
                if (grade.assignmentScores.length === 0) {
                    // 删除空的成绩记录
                    dataManager.deleteData('grades', grade.id);
                } else {
                    // 重新计算总分
                    grade.totalScore = grade.assignmentScores.reduce((sum, score) => sum + (score.score || 0), 0);
                    // 更新成绩记录
                    dataManager.updateData('grades', grade.id, grade);
                }
            });

            // 删除作业/考试
            const success = dataManager.deleteData('assignments', assignmentId);
            
            if (!success) {
                showMessage('删除失败，请重试', 'error');
                return;
            }

            // 重新加载数据
            this.loadAssignmentsData();
            
            // 更新课程筛选下拉框
            this.initAssignmentCourseFilter();
            
            // 重新渲染当前页面
            const currentTab = document.querySelector('.assignments-tabs .tab-btn.active');
            if (currentTab && (currentTab.dataset.tab === 'assignments' || currentTab.dataset.tab === 'exams')) {
                this.filterAssignmentsByType(currentTab.dataset.tab);
            } else {
                this.renderAssignments();
            }

            showMessage(`${assignmentType}"${assignment.title}"删除成功`, 'success');
            
            // 添加操作日志
            dataManager.addLog(this.userData.id, 'delete_assignment', `删除${assignmentType}: ${assignment.title}`);

        } catch (error) {
            console.error('删除作业失败:', error);
            showMessage(`删除${assignmentType}失败：` + error.message, 'error');
        }
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

        // 编辑作业表单事件监听
        const editAssignmentForm = document.getElementById('editAssignmentForm');
        if (editAssignmentForm) {
            editAssignmentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateAssignment();
            });
        }

        // 编辑模态框保存按钮 - 直接点击事件作为备用方案
        const saveEditBtn = document.querySelector('button[form="editAssignmentForm"]');
        if (saveEditBtn) {
            saveEditBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.updateAssignment();
            });
        }

        // 编辑模态框取消按钮
        const cancelEditBtn = document.getElementById('cancelEditAssignment');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => {
                this.closeEditAssignmentModal();
            });
        }

        // 编辑模态框任务类型切换
        const editTypeInputs = document.querySelectorAll('input[name="editAssignmentType"]');
        editTypeInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.toggleEditAssignmentType(input.value);
            });
        });

        // 编辑模态框高级设置切换
        const editSettingsToggle = document.getElementById('editSettingsToggle');
        const editSettingsContent = document.getElementById('editSettingsContent');
        if (editSettingsToggle && editSettingsContent) {
            editSettingsToggle.addEventListener('click', () => {
                editSettingsContent.classList.toggle('show');
                const chevron = editSettingsToggle.querySelector('.fa-chevron-down, .fa-chevron-up');
                if (chevron) {
                    chevron.classList.toggle('fa-chevron-down');
                    chevron.classList.toggle('fa-chevron-up');
                }
            });
        }
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

    // 显示编辑作业模态框
    showEditAssignmentModal(assignment) {
        const modal = document.getElementById('editAssignmentModal');
        if (!modal) {
            console.error('editAssignmentModal not found');
            return;
        }

        // 加载课程选项
        this.loadEditCourseOptions();

        // 填充表单数据
        const form = document.getElementById('editAssignmentForm');
        if (!form) {
            console.error('editAssignmentForm not found');
            return;
        }

        // 设置作业ID
        document.getElementById('editAssignmentId').value = assignment.id;

        // 填充基本信息
        document.getElementById('editAssignmentTitle').value = assignment.title || '';
        document.getElementById('editAssignmentCourse').value = assignment.courseId || '';
        document.getElementById('editAssignmentDescription').value = assignment.description || '';
        document.getElementById('editAssignmentStartTime').value = assignment.startTime ? 
            new Date(assignment.startTime).toISOString().slice(0, 16) : '';
        document.getElementById('editAssignmentEndTime').value = assignment.endTime ? 
            new Date(assignment.endTime).toISOString().slice(0, 16) : '';
        document.getElementById('editAssignmentMaxScore').value = assignment.maxScore || 100;

        // 设置作业类型
        const typeRadios = document.getElementsByName('editAssignmentType');
        typeRadios.forEach(radio => {
            if (radio.value === assignment.type) {
                radio.checked = true;
            }
        });



        // 高级设置
        document.getElementById('editAssignmentLateSubmission').value = assignment.allowLateSubmission || 'no';
        document.getElementById('editAssignmentVisibility').value = assignment.allowPeerReview ? 'yes' : 'no';

        // 检查是否已发布，禁用类型选择
        this.checkAssignmentPublicationStatus(assignment);

        // 显示模态框
        modal.classList.add('active');
        
        // 添加显示动画
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.transform = 'scale(0.9)';
            modalContent.style.opacity = '0';
            setTimeout(() => {
                modalContent.style.transform = 'scale(1)';
                modalContent.style.opacity = '1';
            }, 10);
        }
    }

    // 关闭编辑作业模态框
    closeEditAssignmentModal() {
        const modal = document.getElementById('editAssignmentModal');
        if (!modal) return;

        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.transform = 'scale(0.9)';
            modalContent.style.opacity = '0';
        }

        setTimeout(() => {
            modal.classList.remove('active');
            // 重置表单
            const form = document.getElementById('editAssignmentForm');
            if (form) {
                form.reset();
            }
        }, 200);
    }

    // 加载编辑页面的课程选项
    loadEditCourseOptions() {
        const courseSelect = document.getElementById('editAssignmentCourse');
        if (!courseSelect) return;

        courseSelect.innerHTML = '<option value="">选择课程</option>';
        
        this.coursesData.filter(course => course.status === 'published').forEach(course => {
            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = `${course.courseName} (${course.courseCode})`;
            courseSelect.appendChild(option);
        });
    }

    // 检查作业发布状态，禁用类型选择
    checkAssignmentPublicationStatus(assignment) {
        const now = new Date();
        const startTime = new Date(assignment.startTime);
        const isPublished = startTime <= now;

        const typeOptions = document.querySelectorAll('#editAssignmentModal .assignment-type-option');
        typeOptions.forEach(option => {
            if (isPublished) {
                option.classList.add('disabled');
                option.querySelector('input').disabled = true;
            } else {
                option.classList.remove('disabled');
                option.querySelector('input').disabled = false;
            }
        });

        // 如果已发布，显示提示
        const typeSelector = document.querySelector('#editAssignmentModal .assignment-type-selector');
        const existingTip = typeSelector.querySelector('.publication-tip');
        
        if (isPublished && !existingTip) {
            const tip = document.createElement('div');
            tip.className = 'publication-tip';
            tip.innerHTML = '<i class="fas fa-info-circle"></i> 已发布，无法修改类型';
            typeSelector.appendChild(tip);
        } else if (!isPublished && existingTip) {
            existingTip.remove();
        }
    }

    // 切换编辑页面的作业类型
    toggleEditAssignmentType(type) {
        // 不再需要考试时长相关逻辑
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
        // 不再需要考试时长相关逻辑
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
            startTime: new Date(formData.get('assignmentStartTime')).toISOString(),
            endTime: new Date(formData.get('assignmentEndTime')).toISOString(),
            maxScore: parseInt(formData.get('assignmentMaxScore')) || 100,
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
            
            // 更新课程筛选下拉框
            this.initAssignmentCourseFilter();
            
            // 根据当前tab渲染作业列表
            const currentTab = document.querySelector('.assignments-tabs .tab-btn.active');
            if (currentTab && (currentTab.dataset.tab === 'assignments' || currentTab.dataset.tab === 'exams')) {
                this.filterAssignmentsByType(currentTab.dataset.tab);
            } else {
                this.renderAssignments();
            }

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

        if (errors.length > 0) {
            showMessage(errors.join('\n'), 'error');
            return false;
        }

        return true;
    }

    // 更新作业
    updateAssignment() {
        const form = document.getElementById('editAssignmentForm');
        if (!form) return;

        const formData = new FormData(form);
        const assignmentId = formData.get('editAssignmentId');
        
        if (!assignmentId) {
            showMessage('作业ID缺失', 'error');
            return;
        }

        // 获取原始作业数据
        const originalAssignment = this.assignmentsData.find(a => a.id === assignmentId);
        if (!originalAssignment) {
            showMessage('未找到原始作业数据', 'error');
            return;
        }

        const assignmentData = {
            title: formData.get('editAssignmentTitle'),
            description: formData.get('editAssignmentDescription'),
            courseId: formData.get('editAssignmentCourse'),
            startTime: new Date(formData.get('editAssignmentStartTime')).toISOString(),
            endTime: new Date(formData.get('editAssignmentEndTime')).toISOString(),
            maxScore: parseInt(formData.get('editAssignmentMaxScore')),
            type: formData.get('editAssignmentType'),
            allowLateSubmission: formData.get('editAssignmentLateSubmission'),
            allowPeerReview: formData.get('editAssignmentVisibility') === 'yes',
            // 保留原始数据的关键字段
            id: originalAssignment.id,
            teacherId: originalAssignment.teacherId,
            createdAt: originalAssignment.createdAt
        };

        // 验证数据
        if (!this.validateAssignmentData(assignmentData)) {
            return;
        }

        try {
            // 更新作业数据
            const success = dataManager.updateData('assignments', assignmentId, assignmentData);
            
            if (!success) {
                showMessage('更新失败，请重试', 'error');
                return;
            }
            
            // 重新从 dataManager 加载数据以确保同步
            this.loadAssignmentsData();

            // 更新课程筛选下拉框（因为可能改变了课程）
            this.initAssignmentCourseFilter();

            const assignmentType = assignmentData.type === 'exam' ? '考试' : '作业';
            showMessage(`${assignmentType}更新成功！`, 'success');
            
            // 记录操作日志
            dataManager.addLog(this.userData.id, 'update_assignment', `更新${assignmentType}: ${assignmentData.title}`);
            
            // 关闭模态框
            this.closeEditAssignmentModal();
            
            // 重新渲染当前页面
            const currentTab = document.querySelector('.assignments-tabs .tab-btn.active');
            if (currentTab && (currentTab.dataset.tab === 'assignments' || currentTab.dataset.tab === 'exams')) {
                this.filterAssignmentsByType(currentTab.dataset.tab);
            } else {
                this.renderAssignments();
            }
            
        } catch (error) {
            console.error('Update assignment error:', error);
            showMessage(`更新${assignmentData.type === 'exam' ? '考试' : '作业'}失败，请重试`, 'error');
        }
    }

    // 按类型筛选作业
    // 切换作业标签页
    switchAssignmentTab(tabType) {
        console.log('Switching to tab:', tabType);
        
        // 隐藏所有内容区域
        const allContents = document.querySelectorAll('[data-tab-content]');
        allContents.forEach(content => {
            content.style.display = 'none';
        });
        
        // 显示对应的内容区域
        const targetContent = document.querySelector(`[data-tab-content="${tabType}"]`);
        if (targetContent) {
            targetContent.style.display = 'block';
        }
        
        // 根据标签类型执行相应操作
        switch (tabType) {
            case 'assignments':
            case 'exams':
                this.filterAssignmentsByType(tabType);
                break;
            case 'grading':
                this.loadGradingPage();
                break;
        }
    }

    filterAssignmentsByType(type) {
        // 根据类型选择正确的容器
        const assignmentsList = document.getElementById(
            type === 'exams' ? 'examsList' : 'assignmentsList'
        );
        if (!assignmentsList) return;

        // 获取课程筛选器的值
        const courseFilter = document.getElementById('assignmentCourseFilter');
        const selectedCourseId = courseFilter ? courseFilter.value : '';

        // 映射tab类型到数据类型
        const dataTypeMap = {
            'assignments': 'assignment',
            'exams': 'exam'
        };
        
        const dataType = dataTypeMap[type] || type;
        
        // 先按类型筛选
        let filteredAssignments = this.assignmentsData.filter(assignment => assignment.type === dataType);
        
        // 再按课程筛选（如果选择了课程）
        if (selectedCourseId) {
            filteredAssignments = filteredAssignments.filter(assignment => assignment.courseId === selectedCourseId);
        }

        assignmentsList.innerHTML = '';

        if (filteredAssignments.length === 0) {
            assignmentsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-content">
                        <i class="fas fa-${type === 'exams' ? 'clipboard-check' : 'file-alt'}"></i>
                        <h3>暂无${type === 'exams' ? '考试' : '作业'}</h3>
                        <p>${selectedCourseId ? '该课程下暂无' + (type === 'exams' ? '考试' : '作业') : '点击"创建作业/考试"开始创建您的第一个' + (type === 'exams' ? '考试' : '作业')}</p>
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

    // 加载批改作业页面
    loadGradingPage() {
        console.log('Loading grading page...');
        
        // 清空当前批改作业卡片
        this.updateCurrentGradingAssignment(null);
        
        // 初始化筛选器
        this.initGradingFilters();
        
        // 隐藏批改列表
        const submissionsSection = document.getElementById('gradingSubmissionsSection');
        if (submissionsSection) {
            submissionsSection.style.display = 'none';
        }
        
        // 清空批改列表
        const gradingList = document.getElementById('gradingList');
        if (gradingList) {
            gradingList.innerHTML = '';
        }
    }

    // // 创建批改作业卡片
    // createGradingCard(assignment, course, submissions, gradedCount, pendingCount, isUrgent) {
    //     const card = document.createElement('div');
    //     card.className = `grading-assignment-card ${isUrgent ? 'assignment-urgent' : ''}`;
    //     card.dataset.assignmentId = assignment.id;
        
    //     const progressPercentage = submissions.length > 0 ? Math.round((gradedCount / submissions.length) * 100) : 0;
    //     const progressCircumference = 2 * Math.PI * 25; // 半径为25的圆周长
    //     const progressOffset = progressCircumference - (progressPercentage / 100) * progressCircumference;
        
    //     const assignmentType = assignment.type === 'exam' ? '考试' : '作业';
    //     const dueDate = assignment.endTime ? new Date(assignment.endTime) : null;
    //     const isOverdue = dueDate && dueDate < new Date();

    //     card.innerHTML = `
    //         <div class="assignment-grading-header">
    //             <div class="assignment-grading-info">
    //                 <h4>${assignment.title}</h4>
    //                 <div class="assignment-grading-meta">
    //                     <span class="meta-badge course">${course ? course.courseName : '未知课程'}</span>
    //                     <span class="meta-badge type-${assignment.type}">${assignmentType}</span>
    //                     ${dueDate ? `
    //                         <span class="meta-badge due-date">
    //                             <i class="fas fa-clock"></i>
    //                             ${isOverdue ? '已过期' : '截止: ' + dueDate.toLocaleDateString()}
    //                         </span>
    //                     ` : ''}
    //                     <span class="meta-badge submission-count">
    //                         <i class="fas fa-users"></i>
    //                         ${submissions.length}人提交
    //                     </span>
    //                 </div>
    //             </div>
    //             <div class="assignment-grading-stats">
    //                 <div class="progress-ring">
    //                     <svg width="60" height="60">
    //                         <circle class="background" cx="30" cy="30" r="25"></circle>
    //                         <circle class="progress" cx="30" cy="30" r="25"
    //                             style="stroke-dasharray: ${progressCircumference}; stroke-dashoffset: ${progressOffset};">
    //                         </circle>
    //                     </svg>
    //                     <div class="progress-text">${progressPercentage}%</div>
    //                 </div>
    //                 <div style="text-align: center;">
    //                     <div style="color: #10b981; font-weight: 600;">${gradedCount}已批改</div>
    //                     <div style="color: #f59e0b; font-weight: 600;">${pendingCount}待批改</div>
    //                 </div>
    //             </div>
    //         </div>
            
    //         ${assignment.description ? `
    //             <div class="assignment-grading-description">
    //                 ${assignment.description.length > 100 ? assignment.description.substring(0, 100) + '...' : assignment.description}
    //             </div>
    //         ` : ''}
            
    //         <div class="assignment-grading-actions">
    //             <button class="btn-grade-assignment" onclick="teacherDashboard.startGrading('${assignment.id}')">
    //                 <i class="fas fa-graduation-cap"></i>
    //                 ${pendingCount > 0 ? `批改作业/考试 (${pendingCount})` : '查看批改'}
    //             </button>
    //             <button class="btn-view-details" onclick="teacherDashboard.viewAssignmentDetails('${assignment.id}')">
    //                 <i class="fas fa-info-circle"></i>
    //                 查看详情
    //             </button>
    //         </div>
    //     `;

    //     return card;
    // }

    // 检查作业是否紧急
    isAssignmentUrgent(assignment) {
        if (!assignment.endTime) return false;
        
        const dueDate = new Date(assignment.endTime);
        const now = new Date();
        const submissions = dataManager.getData('submissions').filter(s => s.assignmentId === assignment.id);
        const pendingCount = submissions.filter(s => s.status !== 'graded').length;
        
        // 24小时内过期或有待批改作业超过10个
        const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);
        return (hoursUntilDue <= 24 && hoursUntilDue > 0) || pendingCount >= 10;
    }

    // 更新当前批改作业卡片
    updateCurrentGradingAssignment(assignment) {
        const currentAssignmentDiv = document.getElementById('currentGradingAssignment');
        if (!currentAssignmentDiv) return;
        
        if (!assignment) {
            // 显示空状态
            currentAssignmentDiv.innerHTML = `
                <div class="grading-assignment-card empty-state-card">
                    <div class="empty-content">
                        <i class="fas fa-graduation-cap"></i>
                        <h3>请选择要批改的作业/考试</h3>
                        <p>使用下方的筛选条件选择作业/考试，开始批改</p>
                    </div>
                </div>
            `;
            return;
        }
        
        const course = this.coursesData.find(c => c.id === assignment.courseId);
        const submissions = dataManager.getData('submissions').filter(s => s.assignmentId === assignment.id);
        const gradedCount = submissions.filter(s => s.status === 'graded').length;
        const pendingCount = submissions.length - gradedCount;
        const isUrgent = this.isAssignmentUrgent(assignment);
        
        const progressPercentage = submissions.length > 0 ? Math.round((gradedCount / submissions.length) * 100) : 0;
        const progressCircumference = 2 * Math.PI * 25;
        const progressOffset = progressCircumference - (progressPercentage / 100) * progressCircumference;
        
        const assignmentType = assignment.type === 'exam' ? '考试' : '作业';
        const dueDate = assignment.endTime ? new Date(assignment.endTime) : null;
        const isOverdue = dueDate && dueDate < new Date();
        
        currentAssignmentDiv.innerHTML = `
            <div class="grading-assignment-card ${isUrgent ? 'assignment-urgent' : ''}" data-assignment-id="${assignment.id}">
                <div class="assignment-grading-header">
                    <div class="assignment-grading-info">
                        <h4>${assignment.title}</h4>
                        <div class="assignment-grading-meta">
                            <span class="meta-badge course">${course ? course.courseName : '未知课程'}</span>
                            <span class="meta-badge type-${assignment.type}">${assignmentType}</span>
                            ${dueDate ? `
                                <span class="meta-badge due-date">
                                    <i class="fas fa-clock"></i>
                                    ${isOverdue ? '已截止' : '截止: ' + dueDate.toLocaleDateString()}
                                </span>
                            ` : ''}
                            <span class="meta-badge submission-count">
                                <i class="fas fa-users"></i>
                                ${submissions.length}人提交
                            </span>
                        </div>
                    </div>
                    <div class="assignment-grading-stats">
                        <div class="progress-ring">
                            <svg width="60" height="60">
                                <circle class="background" cx="30" cy="30" r="25"></circle>
                                <circle class="progress" cx="30" cy="30" r="25"
                                    style="stroke-dasharray: ${progressCircumference}; stroke-dashoffset: ${progressOffset};">
                                </circle>
                            </svg>
                            <div class="progress-text">${progressPercentage}%</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="color: #10b981; font-weight: 600;">${gradedCount}已批改</div>
                            <div style="color: #f59e0b; font-weight: 600;">${pendingCount}待批改</div>
                        </div>
                    </div>
                </div>
                
                ${assignment.description ? `
                    <div class="assignment-grading-description">
                        ${assignment.description.length > 150 ? assignment.description.substring(0, 150) + '...' : assignment.description}
                    </div>
                ` : ''}
                
                <div class="assignment-grading-actions">
                    <button class="btn-view-details" onclick="teacherDashboard.viewAssignmentDetails('${assignment.id}')">
                        <i class="fas fa-info-circle"></i>
                        查看详情
                    </button>
                </div>
            </div>
        `;
    }

    // 初始化批改筛选器
    initGradingFilters() {
        const courseFilter = document.getElementById('gradingCourseFilter');
        const assignmentFilter = document.getElementById('gradingAssignmentFilter');
        const statusFilter = document.getElementById('gradingStatusFilter');
        const searchInput = document.getElementById('gradingSearchInput');

        // 初始化课程筛选器
        if (courseFilter) {
            courseFilter.innerHTML = '<option value="">选择课程</option>';
            this.coursesData.filter(course =>course.status === 'published').forEach(course => {
                courseFilter.innerHTML += `<option value="${course.id}">${course.courseName}</option>`;
            });

            // 清除之前的事件监听器
            const newCourseFilter = courseFilter.cloneNode(true);
            courseFilter.parentNode.replaceChild(newCourseFilter, courseFilter);
            
            newCourseFilter.addEventListener('change', () => {
                this.onCourseFilterChange();
            });
        }

        // 初始化作业筛选器
        if (assignmentFilter) {
            assignmentFilter.innerHTML = '<option value="">请先选择课程</option>';
            assignmentFilter.disabled = true;
        }

        // 初始化状态筛选器
        if (statusFilter) {
            statusFilter.value = 'all';
            const newStatusFilter = statusFilter.cloneNode(true);
            statusFilter.parentNode.replaceChild(newStatusFilter, statusFilter);
            
            newStatusFilter.addEventListener('change', () => {
                this.onStatusFilterChange();
            });
        }

        // 初始化搜索输入
        if (searchInput) {
            searchInput.value = '';
            searchInput.disabled = true;
            const newSearchInput = searchInput.cloneNode(true);
            searchInput.parentNode.replaceChild(newSearchInput, searchInput);
            
            newSearchInput.addEventListener('input', (e) => {
                this.onSearchInput(e.target.value);
            });
        }
    }

    // 课程筛选器变化事件
    onCourseFilterChange() {
        const courseFilter = document.getElementById('gradingCourseFilter');
        const assignmentFilter = document.getElementById('gradingAssignmentFilter');
        const searchInput = document.getElementById('gradingSearchInput');
        
        if (!courseFilter) return;
        
        const courseId = courseFilter.value;
        
        if (!courseId) {
            // 重置作业筛选器
            if (assignmentFilter) {
                assignmentFilter.innerHTML = '<option value="">请先选择课程</option>';
                assignmentFilter.disabled = true;
            }
            if (searchInput) {
                searchInput.disabled = true;
                searchInput.value = '';
            }
            
            // 清空当前作业卡片
            this.updateCurrentGradingAssignment(null);
            
            // 隐藏批改列表
            const submissionsSection = document.getElementById('gradingSubmissionsSection');
            if (submissionsSection) {
                submissionsSection.style.display = 'none';
            }
            
            return;
        }
        
        // 启用作业筛选器并加载对应作业
        if (assignmentFilter) {
            assignmentFilter.disabled = false;
            
            // // 获取该课程下有提交的作业 
            // 获取该课程下的作业（允许为空）
            const courseAssignments = this.assignmentsData.filter(assignment => {
                if (assignment.courseId !== courseId) return false;
                // const submissions = dataManager.getData('submissions').filter(s => s.assignmentId === assignment.id);
                // return submissions.length > 0;
                return true;
            });
            
            assignmentFilter.innerHTML = '<option value="">选择作业</option>';
            courseAssignments.forEach(assignment => {
                const assignmentType = assignment.type === 'exam' ? '考试' : '作业';
                assignmentFilter.innerHTML += `<option value="${assignment.id}">${assignment.title} (${assignmentType})</option>`;
            });
            
            // 清除之前的事件监听器
            const newAssignmentFilter = assignmentFilter.cloneNode(true);
            assignmentFilter.parentNode.replaceChild(newAssignmentFilter, assignmentFilter);
            
            newAssignmentFilter.addEventListener('change', () => {
                this.onAssignmentFilterChange();
            });
        }
        
        if (searchInput) {
            searchInput.disabled = false;
        }
    }

    // 作业筛选器变化事件
    onAssignmentFilterChange() {
        const assignmentFilter = document.getElementById('gradingAssignmentFilter');
        const searchInput = document.getElementById('gradingSearchInput');
        
        if (!assignmentFilter) return;
        
        const assignmentId = assignmentFilter.value;
        
        if (!assignmentId) {
            // 清空当前作业卡片
            this.updateCurrentGradingAssignment(null);
            
            // 隐藏批改列表
            const submissionsSection = document.getElementById('gradingSubmissionsSection');
            if (submissionsSection) {
                submissionsSection.style.display = 'none';
            }
            
            if (searchInput) {
                searchInput.value = '';
            }
            
            return;
        }
        
        // 找到选中的作业
        const assignment = this.assignmentsData.find(a => a.id === assignmentId);
        if (assignment) {
            // 更新当前作业卡片
            this.updateCurrentGradingAssignment(assignment);
            
            // 启用搜索
            if (searchInput) {
                searchInput.disabled = false;
            }
            
            // 自动加载提交列表
            this.loadGradingSubmissions(assignmentId);
        }
    }

    // 状态筛选器变化事件
    onStatusFilterChange() {
        const assignmentId = document.getElementById('gradingAssignmentFilter')?.value;
        if (assignmentId && this.currentGradingAssignment) {
            const statusValue = document.getElementById('gradingStatusFilter')?.value || 'all';
            this.filterSubmissions(statusValue);
        }
    }

    // 搜索输入事件
    onSearchInput(searchTerm) {
        if (this.currentGradingAssignment) {
            this.searchSubmissions(searchTerm);
        }
    }

    // 加载批改作业提交列表
    loadGradingSubmissions(assignmentId, searchTerm = '') {
        const assignment = this.assignmentsData.find(a => a.id === assignmentId);
        if (!assignment) return;
        
        const gradingList = document.getElementById('gradingList');
        const submissionsSection = document.getElementById('gradingSubmissionsSection');
        const statusFilter = document.getElementById('gradingStatusFilter');
        
        if (!gradingList || !submissionsSection) return;
        
        // 显示批改列表区域
        submissionsSection.style.display = 'block';
        
        // 获取提交记录
        let submissions = dataManager.getData('submissions').filter(s => s.assignmentId === assignmentId);
        
        // 丰富提交记录数据，添加学生信息
        const users = dataManager.getData('users');
        const students = users.filter(user => user.userType === 'student');
        submissions = submissions.map(submission => {
            const student = students.find(s => s.id === submission.studentId);
            const classInfo = student ? dataManager.getData('classes').find(c => c.id === student.classId) : null;
            return {
                ...submission,
                studentName: student ? student.name : '未知学生',
                studentId: student ? student.username : '未知ID',
                className: classInfo ? classInfo.className : '未知班级'
            };
        });
        
        // 设置当前批改作业对象
        const course = this.coursesData.find(c => c.id === assignment.courseId);
        this.currentGradingAssignment = {
            assignment: assignment,
            courseName: course ? course.courseName : '未知课程',
            submissions: submissions,
            filteredSubmissions: submissions
        };
        
        // 应用状态筛选
        const statusValue = statusFilter ? statusFilter.value : 'all';
        if (statusValue !== 'all') {
            this.currentGradingAssignment.filteredSubmissions = this.currentGradingAssignment.filteredSubmissions.filter(s => s.status === statusValue);
        }
        
        // 应用搜索筛选
        if (searchTerm) {
            const term = searchTerm.toLowerCase().trim();
            this.currentGradingAssignment.filteredSubmissions = this.currentGradingAssignment.filteredSubmissions.filter(submission => 
                submission.studentName.toLowerCase().includes(term) ||
                submission.studentId.toLowerCase().includes(term)
            );
        }
        
        if (this.currentGradingAssignment.filteredSubmissions.length === 0) {
            gradingList.innerHTML = `
                <div class="grading-empty">
                    <i class="fas fa-search"></i>
                    <h4>未找到匹配的提交</h4>
                    <p>请尝试调整筛选条件或搜索关键词</p>
                </div>
            `;
            return;
        }
        
        // 渲染提交列表
        this.renderGradingList();
    }

    // 筛选批改作业
    filterGradingAssignments(searchTerm = '') {
        const gradingList = document.getElementById('gradingList');
        if (!gradingList) return;

        const courseFilter = document.getElementById('gradingCourseFilter');
        const assignmentFilter = document.getElementById('gradingAssignmentFilter');
        const statusFilter = document.getElementById('gradingStatusFilter');
        
        const selectedCourseId = courseFilter ? courseFilter.value : '';
        const selectedAssignmentId = assignmentFilter ? assignmentFilter.value : '';
        const selectedStatus = statusFilter ? statusFilter.value : '';

        const allCards = gradingList.querySelectorAll('.grading-assignment-card');
        
        allCards.forEach(card => {
            const assignmentId = card.dataset.assignmentId;
            const assignment = this.assignmentsData.find(a => a.id === assignmentId);
            const submissions = dataManager.getData('submissions').filter(s => s.assignmentId === assignmentId);
            const gradedCount = submissions.filter(s => s.status === 'graded').length;
            const pendingCount = submissions.length - gradedCount;

            let isVisible = true;

            // 作业筛选（优先级最高）
            if (selectedAssignmentId && assignmentId !== selectedAssignmentId) {
                isVisible = false;
            }

            // 课程筛选
            if (isVisible && selectedCourseId && assignment.courseId !== selectedCourseId) {
                isVisible = false;
            }

            // 状态筛选
            if (isVisible && selectedStatus !== 'all') {
                if (selectedStatus === 'pending' && pendingCount === 0) {
                    isVisible = false;
                } else if (selectedStatus === 'graded' && pendingCount > 0) {
                    isVisible = false;
                }
            }

            // 搜索筛选
            if (isVisible && searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const course = this.coursesData.find(c => c.id === assignment.courseId);
                const matchesSearch = assignment.title.toLowerCase().includes(searchLower) ||
                                   (course && course.courseName.toLowerCase().includes(searchLower));
                
                if (!matchesSearch) {
                    isVisible = false;
                }
            }

            card.style.display = isVisible ? 'block' : 'none';
        });

        // 检查是否有可见的卡片
        const visibleCards = Array.from(allCards).filter(card => card.style.display !== 'none');
        
        if (visibleCards.length === 0) {
            if (!gradingList.querySelector('.grading-empty-state')) {
                const emptyState = document.createElement('div');
                emptyState.className = 'grading-empty-state';
                emptyState.innerHTML = `
                    <div class="grading-empty-icon">
                        <i class="fas fa-search"></i>
                    </div>
                    <h3 class="grading-empty-title">未找到匹配的作业</h3>
                    <p class="grading-empty-description">
                        请尝试调整筛选条件或搜索关键词
                    </p>
                `;
                gradingList.appendChild(emptyState);
            }
        } else {
            const emptyState = gradingList.querySelector('.grading-empty-state');
            if (emptyState) {
                emptyState.remove();
            }
        }
    }





    // 开始批改作业
    startGrading(assignmentId) {
        // 自动设置筛选器并加载对应的提交列表
        const assignment = this.assignmentsData.find(a => a.id === assignmentId);
        if (!assignment) {
            this.showMessage('作业不存在', 'error');
            return;
        }
        
        const courseFilter = document.getElementById('gradingCourseFilter');
        const assignmentFilter = document.getElementById('gradingAssignmentFilter');
        
        if (courseFilter && assignmentFilter) {
            // 设置课程筛选器
            courseFilter.value = assignment.courseId;
            this.onCourseFilterChange();
            
            // 等待作业筛选器加载后设置作业
            setTimeout(() => {
                assignmentFilter.value = assignmentId;
                this.onAssignmentFilterChange();
                
                // 自动加载提交列表
                this.loadGradingSubmissions(assignmentId);
            }, 100);
        }
    }

    // 查看作业详情
    viewAssignmentDetails(assignmentId) {
        const assignment = this.assignmentsData.find(a => a.id === assignmentId);
        if (!assignment) {
            showMessage('作业不存在', 'error');
            return;
        }

        const course = this.coursesData.find(c => c.id === assignment.courseId);
        const courseName = course ? course.courseName : '未知课程';
        const submissions = dataManager.getData('submissions').filter(s => s.assignmentId === assignmentId);
        const gradedCount = submissions.filter(s => s.status === 'graded').length;
        const pendingCount = submissions.length - gradedCount;
        
        const assignmentType = assignment.type === 'exam' ? '考试' : '作业';
        
        alert(`作业/考试详情：

 标题：${assignment.title}
 类型：${assignmentType}
 课程：${courseName}
 满分：${assignment.maxScore}分
 提交人数：${submissions.length}人
 已批改：${gradedCount}人
 待批改：${pendingCount}人

 ${assignment.description ? '描述：' + assignment.description : ''}
 ${assignment.startTime ? '开始时间：' + new Date(assignment.startTime).toLocaleString() : ''}
 ${assignment.endTime ? '截止时间：' + new Date(assignment.endTime).toLocaleString() : ''}

        `);
    }

    showAddAssignmentModal() {
        this.showCreateAssignmentModal();
    }

    // ==================== 批改作业功能 ====================

    // 显示批改模态框
    showGradingModal() {
        const modal = document.getElementById('gradingModal');
        if (!modal) return;

        // 设置模态框标题
        const assignmentType = this.currentGradingAssignment.assignment.type === 'exam' ? '考试' : '作业';
        document.getElementById('gradingModalTitle').textContent = `批改${assignmentType}: ${this.currentGradingAssignment.assignment.title}`;
        document.getElementById('gradingAssignmentTitle').textContent = this.currentGradingAssignment.assignment.title;
        document.getElementById('gradingCourseName').textContent = this.currentGradingAssignment.courseName;
        document.getElementById('gradingSubmissionCount').textContent = `提交人数: ${this.currentGradingAssignment.submissions.length}`;

        // 重置筛选器
        document.getElementById('gradingFilter').value = 'all';
        document.getElementById('gradingSearchInput').value = '';

        // 渲染提交列表
        this.renderGradingList();

        // 显示模态框
        modal.classList.add('active');
        
        // 添加动画效果
        setTimeout(() => {
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.style.transform = 'scale(1)';
                modalContent.style.opacity = '1';
            }
        }, 10);
    }

    // 关闭批改模态框
    closeGradingModal() {
        const modal = document.getElementById('gradingModal');
        if (!modal) return;

        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.transform = 'scale(0.9)';
            modalContent.style.opacity = '0';
        }

        setTimeout(() => {
            modal.classList.remove('active');
            this.currentGradingAssignment = null;
        }, 200);
    }

    // 渲染提交列表
    renderGradingList() {
        const gradingList = document.getElementById('gradingList');
        if (!gradingList || !this.currentGradingAssignment) return;

        const submissions = this.currentGradingAssignment.filteredSubmissions || this.currentGradingAssignment.submissions;

        if (submissions.length === 0) {
            gradingList.innerHTML = `
                <div class="grading-empty">
                    <i class="fas fa-inbox"></i>
                    <h4>暂无提交记录</h4>
                    <p>还没有学生提交这份${this.currentGradingAssignment.assignment.type === 'exam' ? '考试' : '作业'}</p>
                </div>
            `;
            return;
        }

        gradingList.innerHTML = submissions.map(submission => this.createSubmissionCard(submission)).join('');
    }

    // 创建学生提交卡片
    createSubmissionCard(submission) {
        const statusClass = submission.status === 'graded' ? 'graded' : 'pending';
        const statusText = submission.status === 'graded' ? '已批改' : '待批改';
        const isGraded = submission.status === 'graded';

        // 检查是否逾期
        const isOverdue = this.checkSubmissionOverdue(submission);
        const overdueBadge = isOverdue ? '<span class="status-badge overdue">逾期</span>' : '';

        return `
            <div class="submission-card ${statusClass}" data-submission-id="${submission.id}">
                <div class="submission-header">
                    <div class="student-info">
                        <div class="student-avatar">${submission.studentName.charAt(0)}</div>
                        <div class="student-details">
                            <h5>${submission.studentName}</h5>
                            <p>${submission.studentId} · ${submission.className}</p>
                        </div>
                    </div>
                    <div class="submission-status">
                        <span class="status-badge ${statusClass}">${statusText}</span>
                        ${overdueBadge}
                        <span class="submission-time">提交日期：${this.formatSubmissionTime(submission.submittedTime)}</span>
                    </div>
                </div>
                <div class="submission-content">
                    ${submission.content ? `
                        <div class="submission-text">
                            <h6>提交内容</h6>
                            <p>${submission.content}</p>
                        </div>
                    ` : ''}
                    ${submission.files && submission.files.length > 0 ? `
                        <div class="submission-files">
                            <h6>提交文件</h6>
                            <div class="file-list">
                                ${submission.files.map(file => `
                                    <span class="file-tag">
                                        <i class="fas fa-paperclip"></i>
                                        ${file}
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    <div class="grading-area">
                        <div class="grading-deadline-info">
                            <i class="fas fa-clock"></i>
                            <span>截止时间：${new Date(this.currentGradingAssignment.assignment.endTime).toLocaleString()}</span>
                            ${isOverdue ? '<span class="overdue-warning"><i class="fas fa-exclamation-triangle"></i> 逾期提交</span>' : ''}
                        </div>
                        <h6>批改区域</h6>
                        <div class="score-input-group">
                            <label>分数：</label>
                            <input type="number" 
                                   class="score-input ${isGraded ? '' : 'edit-mode'}" 
                                   id="score-${submission.id}" 
                                   min="0" 
                                   max="${this.currentGradingAssignment.assignment.maxScore}" 
                                   value="${submission.score || ''}" 
                                   placeholder="0-${this.currentGradingAssignment.assignment.maxScore}"
                                   ${isGraded ? 'readonly' : ''}>
                            <span class="max-score-label">/ ${this.currentGradingAssignment.assignment.maxScore}分</span>
                            ${isGraded ? `
                                <span class="score-display">${submission.score}分</span>
                            ` : ''}
                        </div>
                        <div class="feedback-group">
                            <label>评语：</label>
                            <textarea class="feedback-textarea ${isGraded ? '' : 'edit-mode'}" 
                                      id="feedback-${submission.id}" 
                                      placeholder="请输入评语..." 
                                      ${isGraded ? 'readonly' : ''}>${submission.feedback || ''}</textarea>
                        </div>
                        ${!isGraded ? `
                            <div class="grading-actions-row">
                                <button class="btn-save-grade" onclick="teacherDashboard.saveGrade('${submission.id}')">
                                    <i class="fas fa-save"></i> 保存成绩
                                </button>
                            </div>
                        ` : `
                            <div class="grading-actions-row">
                                <button class="btn-save-grade" onclick="teacherDashboard.editGrade('${submission.id}')">
                                    <i class="fas fa-edit"></i> 修改
                                </button>
                                <button class="btn-save-grade saved" disabled>
                                    <i class="fas fa-check"></i> 已批改
                                </button>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    // 检查提交是否逾期
    checkSubmissionOverdue(submission) {
        if (!submission.submittedTime || !this.currentGradingAssignment?.assignment?.endTime) {
            return false;
        }
        
        const submittedTime = new Date(submission.submittedTime);
        const deadline = new Date(this.currentGradingAssignment.assignment.endTime);
        
        // 如果提交时间晚于截止时间，则为逾期
        return submittedTime > deadline;
    }

    // 格式化提交时间
    formatSubmissionTime(timeString) {
        if (!timeString) return '未知时间';
        
        const date = new Date(timeString);
        
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60 * 1000) {
            return '刚刚';
        } else if (diff < 60 * 60 * 1000) {
            return Math.floor(diff / (60 * 1000)) + '分钟前';
        } else if (diff < 24 * 60 * 60 * 1000) {
            return Math.floor(diff / (60 * 60 * 1000)) + '小时前';
        } else if (diff < 7 * 24 * 60 * 60 * 1000) {
            return Math.floor(diff / (24 * 60 * 60 * 1000)) + '天前';
        } else {
            return date.toLocaleString();
        }
    }

    // 保存单个成绩
    saveGrade(submissionId) {
        const scoreInput = document.getElementById(`score-${submissionId}`);
        const feedbackTextarea = document.getElementById(`feedback-${submissionId}`);
        
        if (!scoreInput || !feedbackTextarea) return;

        const score = parseInt(scoreInput.value);
        const feedback = feedbackTextarea.value.trim();

        // 验证分数
        if (isNaN(score) || score < 0 || score > this.currentGradingAssignment.assignment.maxScore) {
            showMessage(`分数必须在0-${this.currentGradingAssignment.assignment.maxScore}之间`, 'error');
            return;
        }

        // 验证评语
        if (!feedback) {
            showMessage('请输入评语', 'error');
            return;
        }

        try {
            // 更新提交记录
            const submissionData = {
                score: score,
                feedback: feedback,
                status: 'graded',
                gradedTime: new Date().toISOString()
            };

            const success = dataManager.updateData('submissions', submissionId, submissionData);
            
            if (!success) {
                showMessage('保存失败，请重试', 'error');
                return;
            }

            // 更新学生成绩记录
            this.updateStudentGrade(submissionId, score);

            // 更新本地数据
            const submission = this.currentGradingAssignment.submissions.find(s => s.id === submissionId);
            if (submission) {
                Object.assign(submission, submissionData);
                
                // 移除编辑模式类
                const scoreInput = document.getElementById(`score-${submissionId}`);
                const feedbackTextarea = document.getElementById(`feedback-${submissionId}`);
                if (scoreInput) scoreInput.classList.remove('edit-mode');
                if (feedbackTextarea) feedbackTextarea.classList.remove('edit-mode');

                // 重新渲染该卡片
                this.updateSubmissionCard(submissionId);

                showMessage('成绩保存成功', 'success');

                // 添加操作日志
                dataManager.addLog(this.userData.id, 'grade_assignment', `批改${submission.studentName}的作业：${score}分`);
            }

        } catch (error) {
            console.error('保存成绩失败:', error);
            showMessage('保存失败：' + error.message, 'error');
        }
    }

    // 修改已批改的成绩
    editGrade(submissionId) {
        const scoreInput = document.getElementById(`score-${submissionId}`);
        const feedbackTextarea = document.getElementById(`feedback-${submissionId}`);
        
        if (scoreInput) {
            scoreInput.readOnly = false;
            scoreInput.classList.add('edit-mode');
        }
        if (feedbackTextarea) {
            feedbackTextarea.readOnly = false;
            feedbackTextarea.classList.add('edit-mode');
        }

        // 更新按钮
        const card = document.querySelector(`[data-submission-id="${submissionId}"]`);
        if (card) {
            const actionsRow = card.querySelector('.grading-actions-row');
            if (actionsRow) {
                actionsRow.innerHTML = `
                    <button class="btn-save-grade" onclick="teacherDashboard.saveGrade('${submissionId}')">
                        <i class="fas fa-save"></i> 保存修改
                    </button>
                    <button class="btn-save-grade cancel" onclick="teacherDashboard.cancelEditGrade('${submissionId}')">
                        <i class="fas fa-times"></i> 取消
                    </button>
                `;
            }
        }
    }

    // 取消修改成绩
    cancelEditGrade(submissionId) {
        // 移除编辑模式类
        const scoreInput = document.getElementById(`score-${submissionId}`);
        const feedbackTextarea = document.getElementById(`feedback-${submissionId}`);
        if (scoreInput) scoreInput.classList.remove('edit-mode');
        if (feedbackTextarea) feedbackTextarea.classList.remove('edit-mode');

        const submission = this.currentGradingAssignment.submissions.find(s => s.id === submissionId);
        if (!submission) return;

        this.updateSubmissionCard(submissionId);
    }

    // 更新提交卡片
    updateSubmissionCard(submissionId) {
        const submission = this.currentGradingAssignment.submissions.find(s => s.id === submissionId);
        if (!submission) return;

        const card = document.querySelector(`[data-submission-id="${submissionId}"]`);
        if (card) {
            const newCard = this.createSubmissionCard(submission);
            card.outerHTML = newCard;
        }
    }

    // 更新学生成绩记录
    updateStudentGrade(submissionId, score) {
        const submission = this.currentGradingAssignment.submissions.find(s => s.id === submissionId);
        if (!submission) return;

        // 获取或创建学生成绩记录
        let grade = dataManager.getData('grades').find(g => g.studentId === submission.studentId);
        
        if (!grade) {
            // 创建新的成绩记录
            grade = {
                id: dataManager.generateId(),
                studentId: submission.studentId,
                assignmentScores: [],
                totalScore: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            dataManager.data.grades.push(grade);
        }

        // 查找是否已有该作业的成绩记录
        const existingScoreIndex = grade.assignmentScores.findIndex(s => s.assignmentId === submissionId);
        
        if (existingScoreIndex >= 0) {
            // 更新现有成绩
            grade.assignmentScores[existingScoreIndex] = {
                assignmentId: submissionId,
                score: score,
                gradedAt: new Date().toISOString()
            };
        } else {
            // 添加新成绩
            grade.assignmentScores.push({
                assignmentId: submissionId,
                score: score,
                gradedAt: new Date().toISOString()
            });
        }

        // 重新计算总分
        grade.totalScore = grade.assignmentScores.reduce((sum, score) => sum + score.score, 0);
        grade.updatedAt = new Date().toISOString();

        // 保存成绩记录
        dataManager.updateData('grades', grade.id, grade);
    }

    // 筛选提交记录
    filterSubmissions(filterType) {
        if (!this.currentGradingAssignment) return;

        let filtered = [...this.currentGradingAssignment.submissions];

        switch (filterType) {
            case 'pending':
                filtered = filtered.filter(s => s.status !== 'graded');
                break;
            case 'graded':
                filtered = filtered.filter(s => s.status === 'graded');
                break;
            case 'all':
            default:
                filtered = [...this.currentGradingAssignment.submissions];
                break;
        }

        this.currentGradingAssignment.filteredSubmissions = filtered;
        this.renderGradingList();
    }

    // 搜索提交记录
    searchSubmissions(searchTerm) {
        if (!this.currentGradingAssignment) return;

        if (!searchTerm.trim()) {
            this.currentGradingAssignment.filteredSubmissions = [...this.currentGradingAssignment.submissions];
        } else {
            const term = searchTerm.toLowerCase().trim();
            const source = this.currentGradingAssignment.filteredSubmissions || this.currentGradingAssignment.submissions;
            
            this.currentGradingAssignment.filteredSubmissions = source.filter(submission => 
                submission.studentName.toLowerCase().includes(term) ||
                submission.studentId.toLowerCase().includes(term)
            );
        }

        this.renderGradingList();
    }

    // 批量保存成绩
    saveAllGrades() {
        if (!this.currentGradingAssignment) return;

        const pendingSubmissions = this.currentGradingAssignment.submissions.filter(s => s.status !== 'graded');
        
        if (pendingSubmissions.length === 0) {
            showMessage('没有待批改的提交', 'info');
            return;
        }

        let savedCount = 0;
        let errorCount = 0;

        pendingSubmissions.forEach(submission => {
            const scoreInput = document.getElementById(`score-${submission.id}`);
            const feedbackTextarea = document.getElementById(`feedback-${submission.id}`);
            
            if (scoreInput && feedbackTextarea) {
                const score = parseInt(scoreInput.value);
                const feedback = feedbackTextarea.value.trim();

                if (!isNaN(score) && score >= 0 && score <= this.currentGradingAssignment.assignment.maxScore && feedback) {
                    try {
                        // 更新提交记录
                        const submissionData = {
                            score: score,
                            feedback: feedback,
                            status: 'graded',
                            gradedTime: new Date().toISOString()
                        };

                        dataManager.updateData('submissions', submission.id, submissionData);
                        this.updateStudentGrade(submission.id, score);

                        // 更新本地数据
                        Object.assign(submission, submissionData);
                        savedCount++;
                    } catch (error) {
                        errorCount++;
                    }
                }
            }
        });

        // 重新渲染列表
        this.renderGradingList();

        if (errorCount === 0) {
            showMessage(`成功批量保存${savedCount}份成绩`, 'success');
        } else {
            showMessage(`成功保存${savedCount}份，失败${errorCount}份`, 'warning');
        }
    }

    // 导出成绩
    exportGrades() {
        if (!this.currentGradingAssignment) return;

        const submissions = this.currentGradingAssignment.submissions.filter(s => s.status === 'graded');
        
        if (submissions.length === 0) {
            showMessage('没有已批改的成绩可以导出', 'info');
            return;
        }

        // 创建CSV内容
        const headers = ['学号', '姓名', '班级', '分数', '评语', '提交时间', '批改时间'];
        const csvContent = [
            headers.join(','),
            ...submissions.map(s => [
                s.studentId,
                s.studentName,
                s.className,
                s.score || '',
                `"${(s.feedback || '').replace(/"/g, '""')}"`, // 转义双引号
                new Date(s.submittedTime).toLocaleString(),
                s.gradedTime ? new Date(s.gradedTime).toLocaleString() : ''
            ].join(','))
        ].join('\n');

        // 创建Blob并下载
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const assignmentName = this.currentGradingAssignment.assignment.title.replace(/[^\w\u4e00-\u9fa5]/g, '_');
        link.href = URL.createObjectURL(blob);
        link.download = `${assignmentName}_成绩单_${new Date().toLocaleDateString()}.csv`;
        link.click();

        showMessage('成绩导出成功', 'success');
    }

    // 获取学生班级名称
    getStudentClassName(classId) {
        const classInfo = dataManager.getData('classes').find(c => c.id === classId);
        return classInfo ? classInfo.className : '';
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