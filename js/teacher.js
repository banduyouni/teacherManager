// 教师仪表盘功能模块
class TeacherDashboard {
    constructor() {
        this.currentPage = 'dashboard';
        this.userData = null;
        this.coursesData = [];
        this.assignmentsData = [];
        this.gradesData = [];
        this.activeAssignmentTab = 'assignments';
        this.editingCourseId = null;
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
        this.renderCourseFilters();
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

    // 渲染筛选下拉
    renderCourseFilters() {
        const selects = [
            document.getElementById('courseSelectForStudents'),
            document.getElementById('assignmentCourseFilter'),
            document.getElementById('gradeCourseFilter'),
            document.getElementById('materialCourseFilter')
        ];

        selects.forEach(select => {
            if (!select) return;
            const current = select.value || '';
            select.innerHTML = '<option value="">选择课程</option>' + this.coursesData.map(course => `
                <option value="${course.id}">${course.courseName}</option>
            `).join('');
            if (current) select.value = current;
        });
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

        // 学生管理筛选/导出
        document.getElementById('courseSelectForStudents')?.addEventListener('change', () => this.renderStudents());
        document.getElementById('exportStudentsBtn')?.addEventListener('click', () => this.exportStudents());

        // 作业考试
        document.getElementById('assignmentCourseFilter')?.addEventListener('change', () => this.renderAssignments());
        document.querySelectorAll('.assignments-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.assignments-tabs .tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeAssignmentTab = btn.dataset.tab || 'assignments';
                this.renderAssignments();
            });
        });
        document.getElementById('createAssignmentBtn')?.addEventListener('click', () => this.openAssignmentModal());

        // 成绩管理
        document.getElementById('gradeCourseFilter')?.addEventListener('change', () => this.renderGrades());
        document.getElementById('gradeSetupBtn')?.addEventListener('click', () => this.openGradeStructureModal());
        document.getElementById('importGradesBtn')?.addEventListener('click', () => this.importGrades());

        // 课件资源
        document.getElementById('materialCourseFilter')?.addEventListener('change', () => this.renderMaterials());
        document.getElementById('uploadMaterialBtn')?.addEventListener('click', () => this.openMaterialPicker());

        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
            uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                const files = Array.from(e.dataTransfer.files || []);
                this.handleMaterialFiles(files);
            });
            uploadArea.addEventListener('click', () => this.openMaterialPicker());
        }

        // 个人信息编辑/修改密码
        document.getElementById('editProfileBtn')?.addEventListener('click', () => this.openEditProfileModal());
        document.getElementById('changePasswordBtn')?.addEventListener('click', () => this.openChangePasswordModal());

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
                    <button class="btn-sm btn-secondary" onclick="teacherDashboard.previewExistingCourse('${course.id}')">
                        <i class="fas fa-eye"></i> 预览
                    </button>
                    ${course.status === 'published' ? `
                        <button class="btn-sm btn-warning" onclick="teacherDashboard.withdrawCourse('${course.id}')">
                            <i class="fas fa-arrow-down"></i> 撤回
                        </button>
                    ` : `
                        <button class="btn-sm btn-success" onclick="teacherDashboard.publishExistingCourse('${course.id}')">
                            <i class="fas fa-upload"></i> 发布
                        </button>
                    `}
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
        const tbody = document.getElementById('studentsTableBody');
        if (!tbody) return;

        const courseId = document.getElementById('courseSelectForStudents')?.value || '';
        const courses = courseId ? this.coursesData.filter(c => c.id === courseId) : this.coursesData;

        const rows = [];
        courses.forEach(course => {
            const students = dataManager.getCourseStudents(course.id);
            students.forEach(student => {
                const progress = this.calculateStudentProgress(student.id, course.id);
                const grade = (this.gradesData || []).find(g => g.studentId === student.id && g.courseId === course.id);
                const classInfo = dataManager.getData('classes').find(c => c.id === student.classId);

                rows.push(`
                    <tr>
                        <td>${student.username}</td>
                        <td>${student.name}</td>
                        <td>${classInfo ? classInfo.className : '--'}</td>
                        <td>${student.enrollmentTime ? new Date(student.enrollmentTime).toLocaleDateString() : '--'}</td>
                        <td>${progress}%</td>
                        <td>${grade ? grade.totalScore : '--'}</td>
                        <td>
                            <button class="btn-sm btn-secondary" onclick="teacherDashboard.viewStudentGrades('${student.id}', '${course.id}')">查看成绩</button>
                        </td>
                    </tr>
                `);
            });
        });

        tbody.innerHTML = rows.join('') || '<tr><td colspan="7" class="text-center">暂无学生数据</td></tr>';
    }

    // 计算学生学习进度
    calculateStudentProgress(studentId, courseId) {
        const assignments = dataManager.getCourseAssignments(courseId);
        if (!assignments.length) return 0;
        const completed = assignments.filter(a => {
            const submissions = dataManager.getStudentSubmissions(studentId, a.id);
            return submissions && submissions.length > 0;
        }).length;
        return Math.round((completed / assignments.length) * 100);
    }

    // 渲染作业管理
    renderAssignments() {
        const assignmentsList = document.getElementById('assignmentsList');
        if (!assignmentsList) return;

        const courseFilter = document.getElementById('assignmentCourseFilter')?.value || '';
        const typeFilter = this.activeAssignmentTab === 'exams' ? 'exam' : 'assignment';

        const assignments = this.assignmentsData.filter(assignment => {
            if (courseFilter && assignment.courseId !== courseFilter) return false;
            return assignment.type === typeFilter;
        });

        assignmentsList.innerHTML = '';

        assignments.forEach(assignment => {
            const course = this.coursesData.find(c => c.id === assignment.courseId);
            const submissions = dataManager.getData('submissions').filter(s => s.assignmentId === assignment.id);
            
            const assignmentCard = this.createAssignmentCard(assignment, course, submissions);
            assignmentsList.appendChild(assignmentCard);
        });

        if (!assignments.length) {
            assignmentsList.innerHTML = '<div class="empty-state">暂无作业/考试记录</div>';
        }
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
        const gradeSelect = document.getElementById('gradeCourseFilter');
        const courseId = gradeSelect?.value || (this.coursesData[0]?.id || '');
        if (gradeSelect && !gradeSelect.value && courseId) {
            gradeSelect.value = courseId;
        }
        if (!courseId) {
            document.getElementById('gradeStructure') && (document.getElementById('gradeStructure').innerHTML = '<p class="empty-state">暂无课程</p>');
            document.getElementById('gradeTableBody') && (document.getElementById('gradeTableBody').innerHTML = '<tr><td colspan="7" class="text-center">暂无课程</td></tr>');
            return;
        }

        this.renderGradeStructure(courseId);
        this.renderGradeTable(courseId);
    }

    // 渲染成绩构成设置
    renderGradeStructure(courseId) {
        const container = document.getElementById('gradeStructure');
        if (!container) return;

        const structure = this.getGradeStructure(courseId);
        container.innerHTML = `
            <div class="grade-structure-header">
                <h4>成绩构成</h4>
                <button class="btn-sm btn-primary" onclick="teacherDashboard.saveGradeStructure('${courseId}')">保存设置</button>
            </div>
            <div class="grade-structure-list">
                ${structure.map((item, index) => `
                    <div class="grade-structure-item">
                        <span>${item.name}</span>
                        <input type="number" min="0" max="100" value="${item.weight}" data-index="${index}" class="structure-weight-input">%
                    </div>
                `).join('')}
            </div>
            <div class="grade-structure-tip">权重总和需为100%</div>
        `;
    }

    getGradeStructure(courseId) {
        const structures = dataManager.getData('gradeStructures') || {};
        if (structures[courseId]) return structures[courseId];
        return [
            { name: '平时成绩', weight: 30 },
            { name: '期中成绩', weight: 30 },
            { name: '期末成绩', weight: 40 }
        ];
    }

    saveGradeStructure(courseId) {
        const inputs = document.querySelectorAll('.structure-weight-input');
        const structure = this.getGradeStructure(courseId).map((item, index) => ({
            ...item,
            weight: parseInt(inputs[index]?.value, 10) || 0
        }));
        const total = structure.reduce((sum, item) => sum + item.weight, 0);
        if (total !== 100) {
            showMessage('成绩构成权重总和必须为100%', 'warning');
            return;
        }
        const structures = dataManager.getData('gradeStructures') || {};
        structures[courseId] = structure;
        dataManager.setData('gradeStructures', structures);
        showMessage('成绩构成已保存', 'success');
    }

    renderGradeTable(courseId) {
        const tbody = document.getElementById('gradeTableBody');
        if (!tbody) return;
        const students = dataManager.getCourseStudents(courseId);
        const course = this.coursesData.find(c => c.id === courseId);
        const structure = this.getGradeStructure(courseId);

        tbody.innerHTML = students.map(student => {
            const grade = (this.gradesData || []).find(g => g.studentId === student.id && g.courseId === courseId);
            const regular = grade?.gradeDetails?.regularScore ?? '';
            const midterm = grade?.gradeDetails?.midtermScore ?? '';
            const final = grade?.gradeDetails?.finalScore ?? '';
            const total = grade?.totalScore ?? '';

            return `
                <tr>
                    <td>${student.username}</td>
                    <td>${student.name}</td>
                    <td><input type="number" min="0" max="100" value="${regular}" data-type="regular" data-student="${student.id}" class="grade-input"></td>
                    <td><input type="number" min="0" max="100" value="${midterm}" data-type="midterm" data-student="${student.id}" class="grade-input"></td>
                    <td><input type="number" min="0" max="100" value="${final}" data-type="final" data-student="${student.id}" class="grade-input"></td>
                    <td>${total || '--'}</td>
                    <td>
                        <button class="btn-sm btn-primary" onclick="teacherDashboard.saveStudentGrade('${student.id}', '${courseId}')">保存</button>
                    </td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="7" class="text-center">暂无学生</td></tr>';
    }

    saveStudentGrade(studentId, courseId) {
        const inputs = Array.from(document.querySelectorAll(`.grade-input[data-student="${studentId}"]`));
        const scoreMap = {};
        inputs.forEach(input => {
            scoreMap[input.dataset.type] = parseFloat(input.value) || 0;
        });

        const structure = this.getGradeStructure(courseId);
        const totalScore = structure.reduce((sum, item) => {
            if (item.name.includes('平时')) return sum + scoreMap.regular * (item.weight / 100);
            if (item.name.includes('期中')) return sum + scoreMap.midterm * (item.weight / 100);
            if (item.name.includes('期末')) return sum + scoreMap.final * (item.weight / 100);
            return sum;
        }, 0);

        const course = this.coursesData.find(c => c.id === courseId);
        const semester = dataManager.getData('semesters')[0]?.id || this.getCurrentSemester();

        const grades = dataManager.getData('grades') || [];
        const existing = grades.find(g => g.studentId === studentId && g.courseId === courseId);
        const record = {
            id: existing?.id || dataManager.generateId(),
            studentId,
            courseId,
            courseCode: course?.courseCode || '',
            courseName: course?.courseName || '',
            credits: course?.credits || 0,
            totalScore: Math.round(totalScore),
            gpa: parseFloat((totalScore / 100 * 4.5).toFixed(2)),
            semester,
            gradeTime: new Date().toISOString(),
            status: 'submitted',
            gradeDetails: {
                regularScore: scoreMap.regular,
                midtermScore: scoreMap.midterm,
                finalScore: scoreMap.final
            }
        };

        if (existing) {
            Object.assign(existing, record);
        } else {
            grades.push(record);
        }

        dataManager.setData('grades', grades);
        this.gradesData = grades;
        this.renderGradeTable(courseId);
        showMessage('成绩已保存并提交审核', 'success');
    }

    // 渲染课件资源
    renderMaterials() {
        const materialsList = document.getElementById('materialsList');
        if (!materialsList) return;

        materialsList.innerHTML = '';

        const courseId = document.getElementById('materialCourseFilter')?.value || '';
        const courses = courseId ? this.coursesData.filter(c => c.id === courseId) : this.coursesData;

        courses.forEach(course => {
            const materials = dataManager.getData('materials').filter(m => m.courseId === course.id);
            
            const courseMaterialsCard = this.createCourseMaterialsCard(course, materials);
            materialsList.appendChild(courseMaterialsCard);
        });

        if (!courses.length) {
            materialsList.innerHTML = '<div class="empty-state">暂无课程</div>';
        }
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
        const user = this.userData;
        if (!user) return;
        const department = dataManager.getData('departments').find(d => d.id === user.departmentId);

        document.getElementById('profileName') && (document.getElementById('profileName').textContent = user.name || user.username);
        document.getElementById('profileTitle') && (document.getElementById('profileTitle').textContent = `${department ? department.departmentName : ''} · ${user.title || '教师'}`.trim());
        document.getElementById('profileTeacherId') && (document.getElementById('profileTeacherId').textContent = user.username || '--');
        document.getElementById('profileTeacherName') && (document.getElementById('profileTeacherName').textContent = user.name || '--');
        document.getElementById('profileTeacherTitle') && (document.getElementById('profileTeacherTitle').textContent = user.title || '教师');
        document.getElementById('profileTeacherDept') && (document.getElementById('profileTeacherDept').textContent = department ? department.departmentName : '--');
        document.getElementById('profileEmail') && (document.getElementById('profileEmail').textContent = user.email || '--');
        document.getElementById('profilePhone') && (document.getElementById('profilePhone').textContent = user.phone || '--');
        document.getElementById('profileOffice') && (document.getElementById('profileOffice').textContent = user.office || '--');
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

    // 搜索学生
    searchStudents() {
        showMessage('请使用课程筛选查看学生列表', 'info');
        this.renderStudents();
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

    editCourse(courseId) {
        const course = this.coursesData.find(c => c.id === courseId);
        if (!course) return;
        this.showCreateCourseModal(course);
    }

    deleteCourse(courseId) {
        if (!confirm('确定要删除这门课程吗？此操作不可撤销！')) return;
        const ok = dataManager.deleteCourse(courseId);
        if (ok) {
            showMessage('课程已删除', 'success');
            this.loadTeacherData();
            this.renderCourseFilters();
            this.renderCourses();
        }
    }

    manageStudents(courseId) {
        this.switchPage('students');
        const select = document.getElementById('courseSelectForStudents');
        if (select) {
            select.value = courseId;
        }
        this.renderStudents();
    }

    manageAssignments(courseId) {
        this.switchPage('assignments');
        const select = document.getElementById('assignmentCourseFilter');
        if (select) {
            select.value = courseId;
        }
        this.renderAssignments();
    }

    manageGrades(courseId) {
        this.switchPage('grades');
        const select = document.getElementById('gradeCourseFilter');
        if (select) {
            select.value = courseId;
        }
        this.renderGrades();
    }

    viewStudentGrades(studentId, courseId) {
        const grade = (this.gradesData || []).find(g => g.studentId === studentId && g.courseId === courseId);
        if (!grade) {
            showMessage('该学生暂无成绩记录', 'info');
            return;
        }
        alert(`${grade.courseName}：${grade.totalScore}分（绩点 ${grade.gpa}）`);
    }

    contactStudent(studentId) {
        const student = dataManager.getUserById(studentId);
        if (!student) return;
        alert(`联系方式：${student.email || '--'} / ${student.phone || '--'}`);
    }

    openAssignmentModal(assignmentId = null) {
        const assignment = assignmentId ? this.assignmentsData.find(a => a.id === assignmentId) : null;
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${assignment ? '编辑作业/考试' : '创建作业/考试'}</h3>
                    <button class="close">×</button>
                </div>
                <div class="modal-body">
                    <form id="assignmentForm">
                        <div class="form-group">
                            <label>课程</label>
                            <select id="assignmentCourse" class="form-control" required>
                                <option value="">选择课程</option>
                                ${this.coursesData.map(c => `<option value="${c.id}" ${assignment?.courseId === c.id ? 'selected' : ''}>${c.courseName}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>类型</label>
                            <select id="assignmentType" class="form-control" required>
                                <option value="assignment" ${assignment?.type === 'assignment' ? 'selected' : ''}>作业</option>
                                <option value="exam" ${assignment?.type === 'exam' ? 'selected' : ''}>考试</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>标题</label>
                            <input type="text" id="assignmentTitle" value="${assignment?.title || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>满分</label>
                            <input type="number" id="assignmentMaxScore" value="${assignment?.maxScore || 100}" min="1" max="150" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>开始时间</label>
                                <input type="datetime-local" id="assignmentStart" value="${assignment ? this.toLocalDatetime(assignment.startTime) : ''}" required>
                            </div>
                            <div class="form-group">
                                <label>截止时间</label>
                                <input type="datetime-local" id="assignmentEnd" value="${assignment ? this.toLocalDatetime(assignment.endTime) : ''}" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>描述</label>
                            <textarea id="assignmentDesc" rows="3">${assignment?.description || ''}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" id="cancelAssignment">取消</button>
                    <button class="btn-primary" id="saveAssignment">${assignment ? '保存' : '创建'}</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('.close')?.addEventListener('click', () => modal.remove());
        modal.querySelector('#cancelAssignment')?.addEventListener('click', () => modal.remove());
        modal.querySelector('#saveAssignment')?.addEventListener('click', () => {
            this.saveAssignment(assignmentId, modal);
        });
    }

    saveAssignment(assignmentId, modal) {
        const courseId = modal.querySelector('#assignmentCourse')?.value;
        const type = modal.querySelector('#assignmentType')?.value;
        const title = modal.querySelector('#assignmentTitle')?.value?.trim();
        const maxScore = parseInt(modal.querySelector('#assignmentMaxScore')?.value, 10) || 100;
        const startTime = modal.querySelector('#assignmentStart')?.value;
        const endTime = modal.querySelector('#assignmentEnd')?.value;
        const description = modal.querySelector('#assignmentDesc')?.value?.trim();

        if (!courseId || !type || !title || !startTime || !endTime) {
            showMessage('请填写完整信息', 'warning');
            return;
        }

        const assignments = dataManager.getData('assignments') || [];
        const now = new Date().toISOString();

        if (assignmentId) {
            const existing = assignments.find(a => a.id === assignmentId);
            if (existing) {
                Object.assign(existing, {
                    courseId,
                    type,
                    title,
                    maxScore,
                    startTime: new Date(startTime).toISOString(),
                    endTime: new Date(endTime).toISOString(),
                    description,
                    updatedAt: now
                });
            }
        } else {
            assignments.push({
                id: dataManager.generateId(),
                courseId,
                type,
                title,
                maxScore,
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(endTime).toISOString(),
                description,
                createdAt: now,
                updatedAt: now
            });
        }

        dataManager.setData('assignments', assignments);
        this.loadTeacherData();
        this.renderAssignments();
        modal.remove();
        showMessage('作业/考试已保存', 'success');
    }

    gradeAssignments(assignmentId) {
        const assignment = this.assignmentsData.find(a => a.id === assignmentId);
        if (!assignment) return;

        const submissions = dataManager.getData('submissions').filter(s => s.assignmentId === assignmentId);
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h3>批改：${assignment.title}</h3>
                    <button class="close">×</button>
                </div>
                <div class="modal-body">
                    ${submissions.length ? `
                        <table class="students-table">
                            <thead>
                                <tr>
                                    <th>学号</th>
                                    <th>姓名</th>
                                    <th>提交时间</th>
                                    <th>得分</th>
                                    <th>评语</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${submissions.map(sub => {
                                    const student = dataManager.getUserById(sub.studentId);
                                    return `
                                        <tr>
                                            <td>${student?.username || '--'}</td>
                                            <td>${student?.name || '--'}</td>
                                            <td>${new Date(sub.submittedTime).toLocaleString()}</td>
                                            <td><input type="number" min="0" max="${assignment.maxScore}" value="${sub.score || ''}" data-sub="${sub.id}" class="grade-input"></td>
                                            <td><input type="text" value="${sub.feedback || ''}" data-feedback="${sub.id}" class="grade-input"></td>
                                            <td><button class="btn-sm btn-primary" data-save="${sub.id}">保存</button></td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    ` : '<div class="empty-state">暂无学生提交</div>'}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('.close')?.addEventListener('click', () => modal.remove());
        modal.querySelectorAll('button[data-save]').forEach(btn => {
            btn.addEventListener('click', () => {
                const subId = btn.dataset.save;
                const scoreInput = modal.querySelector(`input[data-sub="${subId}"]`);
                const feedbackInput = modal.querySelector(`input[data-feedback="${subId}"]`);
                const score = parseFloat(scoreInput?.value) || 0;
                const feedback = feedbackInput?.value || '';
                this.saveSubmissionGrade(subId, score, feedback);
                showMessage('已保存评分', 'success');
            });
        });
    }

    saveSubmissionGrade(submissionId, score, feedback) {
        const submissions = dataManager.getData('submissions') || [];
        const submission = submissions.find(s => s.id === submissionId);
        if (!submission) return;
        submission.score = score;
        submission.feedback = feedback;
        submission.status = 'graded';
        submission.gradedTime = new Date().toISOString();
        dataManager.setData('submissions', submissions);
    }

    editAssignment(assignmentId) {
        this.openAssignmentModal(assignmentId);
    }

    viewSubmissions(assignmentId) {
        const assignment = this.assignmentsData.find(a => a.id === assignmentId);
        if (!assignment) return;
        const submissions = dataManager.getData('submissions').filter(s => s.assignmentId === assignmentId);
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h3>提交记录：${assignment.title}</h3>
                    <button class="close">×</button>
                </div>
                <div class="modal-body">
                    ${submissions.length ? submissions.map(sub => {
                        const student = dataManager.getUserById(sub.studentId);
                        return `
                            <div class="material-item">
                                <div class="material-info">
                                    <div>
                                        <h4>${student?.name || '--'} (${student?.username || '--'})</h4>
                                        <p>提交时间：${new Date(sub.submittedTime).toLocaleString()}</p>
                                        <p>状态：${sub.status}</p>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('') : '<div class="empty-state">暂无提交</div>'}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('.close')?.addEventListener('click', () => modal.remove());
    }

    manageCourseGrades(courseId) {
        this.manageGrades(courseId);
    }

    exportStudents() {
        const courseId = document.getElementById('courseSelectForStudents')?.value;
        if (!courseId) {
            showMessage('请先选择课程', 'warning');
            return;
        }
        const students = dataManager.getCourseStudents(courseId);
        const course = this.coursesData.find(c => c.id === courseId);
        const rows = [
            ['学号', '姓名', '班级', '邮箱'],
            ...students.map(s => {
                const cls = dataManager.getData('classes').find(c => c.id === s.classId);
                return [s.username, s.name, cls?.className || '', s.email || ''];
            })
        ];
        this.downloadText(`${course?.courseCode || 'students'}_${Date.now()}.csv`, rows.map(r => r.map(this.escapeCSV).join(',')).join('\n'));
        showMessage('学生名单已导出', 'success');
    }

    exportGrades(courseId) {
        const targetCourseId = courseId || document.getElementById('gradeCourseFilter')?.value;
        if (!targetCourseId) {
            showMessage('请选择课程', 'warning');
            return;
        }
        const course = this.coursesData.find(c => c.id === targetCourseId);
        const grades = (dataManager.getData('grades') || []).filter(g => g.courseId === targetCourseId);
        const rows = [
            ['学号', '姓名', '课程', '总评', '绩点', '学期', '状态'],
            ...grades.map(g => {
                const student = dataManager.getUserById(g.studentId);
                return [student?.username || '', student?.name || '', course?.courseName || '', g.totalScore, g.gpa, g.semester || '', g.status || ''];
            })
        ];
        this.downloadText(`${course?.courseCode || 'grades'}_${Date.now()}.csv`, rows.map(r => r.map(this.escapeCSV).join(',')).join('\n'));
        showMessage('成绩已导出', 'success');
    }

    viewGradeStats(courseId) {
        const stats = dataManager.getCourseGradeStats(courseId);
        if (!stats) {
            showMessage('暂无统计数据', 'info');
            return;
        }
        alert(`平均分 ${stats.average}，最高分 ${stats.max}，最低分 ${stats.min}`);
    }

    openGradeStructureModal() {
        const courseId = document.getElementById('gradeCourseFilter')?.value;
        if (!courseId) {
            showMessage('请先选择课程', 'warning');
            return;
        }
        document.getElementById('gradeStructure')?.scrollIntoView({ behavior: 'smooth' });
        showMessage('请在下方调整成绩构成并保存', 'info');
    }

    importGrades() {
        const courseId = document.getElementById('gradeCourseFilter')?.value;
        if (!courseId) {
            showMessage('请先选择课程', 'warning');
            return;
        }
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        input.addEventListener('change', () => {
            const file = input.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                const rows = String(reader.result || '').split(/\r?\n/).filter(Boolean);
                if (rows.length < 2) {
                    showMessage('文件内容为空', 'warning');
                    return;
                }
                const header = rows[0].split(',').map(h => h.trim());
                const dataRows = rows.slice(1).map(line => {
                    const cols = line.split(',');
                    const obj = {};
                    header.forEach((h, idx) => obj[h] = cols[idx] ? cols[idx].trim() : '');
                    return obj;
                });
                this.applyImportedGrades(courseId, dataRows);
            };
            reader.readAsText(file, 'utf-8');
        });
        input.click();
    }

    applyImportedGrades(courseId, rows) {
        const course = this.coursesData.find(c => c.id === courseId);
        if (!course) return;
        rows.forEach(row => {
            const studentNo = row.studentNo || row.学号 || row.username;
            const student = dataManager.getData('users').find(u => u.username === studentNo && u.userType === 'student');
            if (!student) return;
            const regular = parseFloat(row.regular || row.平时 || row.regularScore || 0) || 0;
            const midterm = parseFloat(row.midterm || row.期中 || row.midtermScore || 0) || 0;
            const final = parseFloat(row.final || row.期末 || row.finalScore || 0) || 0;
            const grades = dataManager.getData('grades') || [];
            const existing = grades.find(g => g.studentId === student.id && g.courseId === courseId);
            const record = {
                id: existing?.id || dataManager.generateId(),
                studentId: student.id,
                courseId,
                courseCode: course.courseCode,
                courseName: course.courseName,
                credits: course.credits,
                totalScore: Math.round((regular + midterm + final) / 3),
                gpa: parseFloat((((regular + midterm + final) / 3) / 100 * 4.5).toFixed(2)),
                semester: dataManager.getData('semesters')[0]?.id || this.getCurrentSemester(),
                gradeTime: new Date().toISOString(),
                status: 'submitted',
                gradeDetails: {
                    regularScore: regular,
                    midtermScore: midterm,
                    finalScore: final
                }
            };
            if (existing) {
                Object.assign(existing, record);
            } else {
                grades.push(record);
            }
            dataManager.setData('grades', grades);
        });
        this.gradesData = dataManager.getData('grades');
        this.renderGradeTable(courseId);
        showMessage('成绩已导入', 'success');
    }

    openMaterialPicker() {
        if (!this.materialInput) {
            this.materialInput = document.createElement('input');
            this.materialInput.type = 'file';
            this.materialInput.multiple = true;
            this.materialInput.accept = '.pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.mp4,.mp3';
            this.materialInput.addEventListener('change', () => {
                const files = Array.from(this.materialInput.files || []);
                this.handleMaterialFiles(files);
            });
        }
        this.materialInput.click();
    }

    handleMaterialFiles(files) {
        const courseId = document.getElementById('materialCourseFilter')?.value;
        if (!courseId) {
            showMessage('请先选择课程', 'warning');
            return;
        }
        const materials = dataManager.getData('materials') || [];
        files.forEach(file => {
            const type = this.getMaterialType(file.name);
            materials.push({
                id: dataManager.generateId(),
                courseId,
                title: file.name,
                type,
                size: this.formatFileSize(file.size),
                uploadTime: new Date().toISOString()
            });
        });
        dataManager.setData('materials', materials);
        this.renderMaterials();
        showMessage('课件已添加', 'success');
    }

    uploadMaterial(courseId) {
        const select = document.getElementById('materialCourseFilter');
        if (select) {
            select.value = courseId;
        }
        this.openMaterialPicker();
    }

    downloadMaterial(materialId) {
        showMessage('课件下载已触发（演示）', 'info');
    }

    deleteMaterial(materialId) {
        if (!confirm('确定要删除这个课件吗？')) return;
        const materials = dataManager.getData('materials') || [];
        dataManager.setData('materials', materials.filter(m => m.id !== materialId));
        this.renderMaterials();
        showMessage('课件已删除', 'success');
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

            // 自动保存草稿（本地）
            createCourseForm.addEventListener('input', () => {
                this.saveCourseDraftToLocal();
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

        document.getElementById('previewCourseBtn')?.addEventListener('click', () => {
            this.previewCourse();
        });

        document.getElementById('addCarouselImage')?.addEventListener('click', () => {
            this.addImageToList('carousel');
        });
        document.getElementById('addGalleryImage')?.addEventListener('click', () => {
            this.addImageToList('gallery');
        });

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
    showCreateCourseModal(course = null) {
        const modal = document.getElementById('createCourseModal');
        if (!modal) return;

        // 重置表单
        const form = document.getElementById('createCourseForm');
        if (form) {
            form.reset();
        }
        this.editingCourseId = course ? course.id : null;

        // 清空图片列表
        this.renderImageList('carousel', []);
        this.renderImageList('gallery', []);

        // 恢复草稿或加载编辑数据
        if (course) {
            this.applyCourseFormData(course);
        } else {
            const draft = this.loadCourseDraft();
            if (draft && confirm('检测到未发布的课程草稿，是否恢复？')) {
                this.applyCourseFormData(draft);
            } else if (draft) {
                this.clearCourseDraft();
            }
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

    // 课程草稿本地存储
    getCourseDraftKey() {
        return `courseDraft_${this.userData.id}`;
    }

    loadCourseDraft() {
        try {
            const raw = localStorage.getItem(this.getCourseDraftKey());
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            return null;
        }
    }

    saveCourseDraftToLocal() {
        const data = this.getFormData();
        if (!data) return;
        localStorage.setItem(this.getCourseDraftKey(), JSON.stringify(data));
    }

    clearCourseDraft() {
        localStorage.removeItem(this.getCourseDraftKey());
    }

    applyCourseFormData(course) {
        const form = document.getElementById('createCourseForm');
        if (!form || !course) return;
        form.courseName.value = course.courseName || '';
        form.courseCode.value = course.courseCode || '';
        form.courseDescription.value = course.description || '';
        form.courseCredits.value = course.credits || '';
        form.maxStudents.value = course.maxStudents || '';
        form.courseCategory.value = course.category || '';
        const requirements = document.getElementById('courseRequirements');
        if (requirements) requirements.value = course.requirements || '';
        const highlights = document.getElementById('courseHighlights');
        if (highlights) highlights.value = (course.extra?.highlights || []).join(', ');
        const enableComments = document.getElementById('enableComments');
        const enableNotes = document.getElementById('enableNotes');
        if (enableComments) enableComments.checked = !!course.extra?.enableComments;
        if (enableNotes) enableNotes.checked = !!course.extra?.enableNotes;
        this.renderImageList('carousel', course.extra?.carouselImages || []);
        this.renderImageList('gallery', course.extra?.galleryImages || []);
    }

    addImageToList(type) {
        const inputId = type === 'carousel' ? 'carouselImageInput' : 'galleryImageInput';
        const input = document.getElementById(inputId);
        if (!input || !input.value.trim()) return;
        const url = input.value.trim();
        const list = this.getImageList(type);
        list.push(url);
        this.renderImageList(type, list);
        input.value = '';
        this.saveCourseDraftToLocal();
    }

    getImageList(type) {
        const listEl = document.getElementById(type === 'carousel' ? 'carouselImageList' : 'galleryImageList');
        if (!listEl) return [];
        return Array.from(listEl.querySelectorAll('li')).map(li => li.dataset.url).filter(Boolean);
    }

    renderImageList(type, images) {
        const listEl = document.getElementById(type === 'carousel' ? 'carouselImageList' : 'galleryImageList');
        if (!listEl) return;
        listEl.innerHTML = images.map((url, idx) => `
            <li draggable="true" data-url="${url}">
                <span>${idx + 1}. ${url}</span>
                <div class="image-actions">
                    <button type="button" class="btn-sm btn-danger" data-remove="${url}">删除</button>
                </div>
            </li>
        `).join('') || '<li style="opacity:.6;cursor:default;">暂无图片，拖拽可排序</li>';

        listEl.querySelectorAll('button[data-remove]').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.remove;
                const next = images.filter(item => item !== target);
                this.renderImageList(type, next);
                this.saveCourseDraftToLocal();
            });
        });

        this.setupImageDrag(listEl, type);
    }

    setupImageDrag(listEl, type) {
        let dragged = null;
        listEl.querySelectorAll('li[draggable="true"]').forEach(item => {
            item.addEventListener('dragstart', () => {
                dragged = item;
                item.style.opacity = '0.5';
            });
            item.addEventListener('dragend', () => {
                item.style.opacity = '';
                dragged = null;
                this.saveCourseDraftToLocal();
            });
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
            });
            item.addEventListener('drop', (e) => {
                e.preventDefault();
                if (!dragged || dragged === item) return;
                const list = Array.from(listEl.querySelectorAll('li[draggable="true"]'));
                const draggedIndex = list.indexOf(dragged);
                const targetIndex = list.indexOf(item);
                if (draggedIndex > -1 && targetIndex > -1) {
                    if (draggedIndex < targetIndex) {
                        item.after(dragged);
                    } else {
                        item.before(dragged);
                    }
                    const newList = this.getImageList(type);
                    this.renderImageList(type, newList);
                }
            });
        });
    }

    previewCourse() {
        const data = this.getFormData();
        if (!data) return;
        this.openPreviewModal(data);
    }

    previewExistingCourse(courseId) {
        const course = this.coursesData.find(c => c.id === courseId);
        if (!course) return;
        this.openPreviewModal(course);
    }

    openPreviewModal(course) {
        const teacher = dataManager.getUserById(course.teacherId);
        const department = dataManager.getData('departments').find(d => d.id === course.departmentId);
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h3>课程预览 - ${course.courseName}</h3>
                    <button class="close">×</button>
                </div>
                <div class="modal-body">
                    <p><strong>课程编号：</strong>${course.courseCode}</p>
                    <p><strong>授课教师：</strong>${teacher ? teacher.name : '--'}</p>
                    <p><strong>开课院系：</strong>${department ? department.departmentName : '--'}</p>
                    <p><strong>学分：</strong>${course.credits}</p>
                    <p><strong>选课要求：</strong>${course.requirements || '无特殊要求'}</p>
                    <p><strong>课程简介：</strong>${course.description || '--'}</p>
                    <p><strong>课程亮点：</strong>${course.extra?.highlights?.join('、') || '--'}</p>
                    <p><strong>评论区：</strong>${course.extra?.enableComments ? '开启' : '关闭'}</p>
                    <p><strong>笔记区：</strong>${course.extra?.enableNotes ? '开启' : '关闭'}</p>
                    <div style="margin-top:12px;">
                        <strong>首页轮播图：</strong>
                        <div>${(course.extra?.carouselImages || []).map(img => `<div>${img}</div>`).join('') || '--'}</div>
                    </div>
                    <div style="margin-top:12px;">
                        <strong>课程内轮播图：</strong>
                        <div>${(course.extra?.galleryImages || []).map(img => `<div>${img}</div>`).join('') || '--'}</div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('.close')?.addEventListener('click', () => modal.remove());
    }

    publishExistingCourse(courseId) {
        const course = this.coursesData.find(c => c.id === courseId);
        if (!course) return;
        dataManager.updateCourse(courseId, { status: 'published' });
        this.loadTeacherData();
        this.renderCourses();
        showMessage('课程已发布', 'success');
    }

    withdrawCourse(courseId) {
        const course = this.coursesData.find(c => c.id === courseId);
        if (!course) return;
        dataManager.updateCourse(courseId, { status: 'draft' });
        this.loadTeacherData();
        this.renderCourses();
        showMessage('课程已撤回为草稿', 'success');
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

        // 添加或更新
        let courseId = this.editingCourseId;
        if (courseId) {
            dataManager.updateCourse(courseId, courseData);
        } else {
            courseId = this.addCourseToSystem(courseData);
        }
        
        if (courseId) {
            showMessage('课程草稿保存成功！', 'success');
            this.clearCourseDraft();
            this.closeCreateCourseModal();
            this.loadTeacherData(); // 重新加载数据
            this.renderCourseFilters();
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

        // 添加或更新
        let courseId = this.editingCourseId;
        if (courseId) {
            dataManager.updateCourse(courseId, courseData);
        } else {
            courseId = this.addCourseToSystem(courseData);
        }
        
        if (courseId) {
            showMessage('课程发布成功！学生现在可以选课了', 'success');
            this.clearCourseDraft();
            this.closeCreateCourseModal();
            this.loadTeacherData(); // 重新加载数据
            this.renderCourseFilters();
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
            requirements: document.getElementById('courseRequirements')?.value?.trim() || '',
            credits: parseInt(form.courseCredits.value) || 0,
            maxStudents: parseInt(form.maxStudents.value) || 0,
            category: form.courseCategory.value,
            teacherId: this.userData.id,
            currentStudents: 0,
            departmentId: this.userData.departmentId,
            extra: {
                carouselImages: this.getImageList('carousel'),
                galleryImages: this.getImageList('gallery'),
                enableComments: !!document.getElementById('enableComments')?.checked,
                enableNotes: !!document.getElementById('enableNotes')?.checked,
                highlights: (document.getElementById('courseHighlights')?.value || '')
                    .split(',')
                    .map(item => item.trim())
                    .filter(Boolean)
            }
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
                course.courseCode === data.courseCode && course.id !== this.editingCourseId
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
        this.showCreateCourseModal();
    }

    showAddAssignmentModal() {
        this.openAssignmentModal();
    }

    // 工具方法
    toLocalDatetime(isoString) {
        if (!isoString) return '';
        const date = new Date(isoString);
        const pad = (n) => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    getCurrentSemester() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        return month >= 2 && month <= 7 ? `${year}-1` : `${year}-2`;
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

    formatFileSize(size) {
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
        return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }

    getMaterialType(filename) {
        const ext = (filename.split('.').pop() || '').toLowerCase();
        if (['pdf', 'doc', 'docx', 'ppt', 'pptx'].includes(ext)) return 'document';
        if (['mp4', 'mov', 'avi'].includes(ext)) return 'video';
        if (['mp3', 'wav'].includes(ext)) return 'audio';
        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'image';
        return 'document';
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
