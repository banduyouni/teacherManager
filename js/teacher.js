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

        // 添加课程按钮
        const addCourseBtn = document.getElementById('addCourseBtn');
        if (addCourseBtn) {
            addCourseBtn.addEventListener('click', () => {
                this.showAddCourseModal();
            });
        }

        // 添加作业按钮
        const addAssignmentBtn = document.getElementById('addAssignmentBtn');
        if (addAssignmentBtn) {
            addAssignmentBtn.addEventListener('click', () => {
                this.showAddAssignmentModal();
            });
        }

        // 搜索功能
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.searchStudents();
            });
        }

        const studentSearch = document.getElementById('studentSearch');
        if (studentSearch) {
            studentSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchStudents();
                }
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

        this.updateStatCard('totalCourses', totalCourses);
        this.updateStatCard('totalStudents', totalStudents);
        this.updateStatCard('totalAssignments', totalAssignments);
        this.updateStatCard('pendingGrades', pendingGrades);

        // 渲染最近活动
        this.renderRecentActivity();
        
        // 渲染课程概览
        this.renderCourseOverview();
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

    // 渲染最近活动
    renderRecentActivity() {
        const activityList = document.querySelector('.activity-list');
        if (!activityList) return;

        const activities = [
            {
                icon: 'upload',
                title: '作业提交',
                description: '学生提交了新的作业',
                time: '10分钟前'
            },
            {
                icon: 'comment',
                title: '学生提问',
                description: '有学生在课程讨论区提问',
                time: '1小时前'
            },
            {
                icon: 'star',
                title: '成绩发布',
                description: '发布了期中考试成绩',
                time: '2小时前'
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

    // 渲染课程概览
    renderCourseOverview() {
        const overviewGrid = document.querySelector('.course-overview-grid');
        if (!overviewGrid) return;

        overviewGrid.innerHTML = this.coursesData.slice(0, 4).map(course => `
            <div class="overview-card">
                <h4>${course.courseName}</h4>
                <p>选课人数: ${course.currentStudents}/${course.maxStudents}</p>
                <div class="overview-stats">
                    <div class="stat">
                        <span class="label">作业</span>
                        <span class="value">${dataManager.getCourseAssignments(course.id).length}</span>
                    </div>
                    <div class="stat">
                        <span class="label">学生</span>
                        <span class="value">${course.currentStudents}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 渲染课程管理
    renderCourses() {
        const coursesList = document.getElementById('coursesList');
        if (!coursesList) return;

        coursesList.innerHTML = '';

        this.coursesData.forEach(course => {
            const courseCard = this.createTeacherCourseCard(course);
            coursesList.appendChild(courseCard);
        });
    }

    // 创建教师课程卡片
    createTeacherCourseCard(course) {
        const card = document.createElement('div');
        card.className = 'course-card teacher-course';
        
        const assignments = dataManager.getCourseAssignments(course.id);
        const students = dataManager.getCourseStudents(course.id);

        card.innerHTML = `
            <div class="course-header">
                <h3>${course.courseName}</h3>
                <span class="course-code">${course.courseCode}</span>
                <div class="course-actions">
                    <button class="btn-sm btn-primary" onclick="teacherDashboard.editCourse('${course.id}')">编辑</button>
                    <button class="btn-sm btn-danger" onclick="teacherDashboard.deleteCourse('${course.id}')">删除</button>
                </div>
            </div>
            <div class="course-info">
                <p><i class="fas fa-users"></i> 学生: ${students.length}人</p>
                <p><i class="fas fa-tasks"></i> 作业: ${assignments.length}个</p>
                <p><i class="fas fa-credit-card"></i> ${course.credits}学分</p>
                <p><i class="fas fa-chart-line"></i> 选课率: ${Math.round((course.currentStudents / course.maxStudents) * 100)}%</p>
            </div>
            <div class="course-management">
                <button class="btn-primary" onclick="teacherDashboard.manageStudents('${course.id}')">管理学生</button>
                <button class="btn-secondary" onclick="teacherDashboard.manageAssignments('${course.id}')">管理作业</button>
                <button class="btn-info" onclick="teacherDashboard.manageGrades('${course.id}')">管理成绩</button>
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

    showAddCourseModal() {
        showMessage('添加课程功能正在开发中...', 'info');
    }

    showAddAssignmentModal() {
        showMessage('添加作业功能正在开发中...', 'info');
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