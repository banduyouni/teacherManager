// 学生仪表盘功能模块
class StudentDashboard {
    constructor() {
        this.currentPage = 'dashboard';
        this.userData = null;
        this.coursesData = [];
        this.enrollmentsData = [];
        this.gradesData = [];
        this.init();
    }

    // 初始化
    init() {
        // 检查用户登录状态
        if (!auth.checkSession() || auth.currentUser?.userType !== 'student') {
            window.location.href = 'index.html';
            return;
        }

        this.userData = auth.currentUser;
        this.loadStudentData();
        this.setupEventListeners();
        this.renderCurrentPage();
        this.updateUserInfo();
    }

    // 加载学生数据
    loadStudentData() {
        // 加载课程数据
        this.coursesData = dataManager.getData('courses');
        
        // 加载学生选课记录
        this.enrollmentsData = dataManager.getStudentEnrollments(this.userData.id);
        
        // 加载学生成绩
        this.gradesData = dataManager.getStudentGrades(this.userData.id);
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

        // 搜索功能
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.searchCourses();
            });
        }

        const courseSearch = document.getElementById('courseSearch');
        if (courseSearch) {
            courseSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchCourses();
                }
            });
        }

        // 筛选器
        const departmentFilter = document.getElementById('departmentFilter');
        if (departmentFilter) {
            departmentFilter.addEventListener('change', () => {
                this.filterCourses();
            });
        }

        const creditFilter = document.getElementById('creditFilter');
        if (creditFilter) {
            creditFilter.addEventListener('change', () => {
                this.filterCourses();
            });
        }

        // 学期选择
        const semesterSelect = document.getElementById('semesterSelect');
        if (semesterSelect) {
            semesterSelect.addEventListener('change', () => {
                this.updateGradesDisplay();
            });
        }

        // 课程详情模态框
        const closeCourseModal = document.getElementById('closeCourseModal');
        if (closeCourseModal) {
            closeCourseModal.addEventListener('click', () => {
                this.closeCourseModal();
            });
        }

        // 点击模态框外部关闭
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('courseDetailModal');
            if (e.target === modal) {
                this.closeCourseModal();
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
            case 'my-courses':
                this.renderMyCourses();
                break;
            case 'grades':
                this.renderGrades();
                break;
            case 'profile':
                this.renderProfile();
                break;
        }
    }

    // 渲染仪表盘
    renderDashboard() {
        // 更新统计数据
        document.getElementById('totalCourses').textContent = this.enrollmentsData.length;
        
        const completedCourses = this.gradesData.filter(g => g.status === 'published').length;
        document.getElementById('completedCourses').textContent = completedCourses;

        // 计算待完成任务数
        const pendingTasks = this.calculatePendingTasks();
        document.getElementById('pendingTasks').textContent = pendingTasks;

        // 计算平均成绩
        const averageGrade = this.calculateAverageGrade();
        document.getElementById('averageGrade').textContent = averageGrade;

        // 渲染课程进度
        this.renderCourseProgress();
    }

    // 计算待完成任务数
    calculatePendingTasks() {
        let pendingTasks = 0;
        this.enrollmentsData.forEach(enrollment => {
            const assignments = dataManager.getCourseAssignments(enrollment.courseId);
            assignments.forEach(assignment => {
                if (new Date(assignment.endTime) > new Date()) {
                    const submission = dataManager.getStudentSubmissions(this.userData.id, assignment.id);
                    if (!submission || submission.length === 0) {
                        pendingTasks++;
                    }
                }
            });
        });
        return pendingTasks;
    }

    // 计算平均成绩
    calculateAverageGrade() {
        if (this.gradesData.length === 0) return '0.0';
        
        const totalScore = this.gradesData.reduce((sum, grade) => sum + grade.totalScore, 0);
        return (totalScore / this.gradesData.length).toFixed(1);
    }

    // 渲染课程进度
    renderCourseProgress() {
        const progressGrid = document.querySelector('.course-progress-grid');
        if (!progressGrid) return;

        progressGrid.innerHTML = '';

        this.enrollmentsData.slice(0, 3).forEach(enrollment => {
            const course = this.coursesData.find(c => c.id === enrollment.courseId);
            if (!course) return;

            const progress = this.calculateCourseProgress(course.id);
            const teacher = dataManager.getUserById(course.teacherId);

            const progressCard = document.createElement('div');
            progressCard.className = 'progress-card';
            progressCard.innerHTML = `
                <div class="course-info">
                    <h4>${course.courseName}</h4>
                    <p>${teacher ? teacher.name : '未知教师'}</p>
                </div>
                <div class="progress-bar">
                    <div class="progress" style="width: ${progress}%"></div>
                </div>
                <span class="progress-text">${progress}%</span>
            `;

            progressGrid.appendChild(progressCard);
        });
    }

    // 计算课程进度
    calculateCourseProgress(courseId) {
        const assignments = dataManager.getCourseAssignments(courseId);
        if (assignments.length === 0) return 0;

        let completedAssignments = 0;
        assignments.forEach(assignment => {
            const submissions = dataManager.getStudentSubmissions(this.userData.id, assignment.id);
            if (submissions && submissions.length > 0) {
                completedAssignments++;
            }
        });

        return Math.round((completedAssignments / assignments.length) * 100);
    }

    // 渲染课程浏览
    renderCourses() {
        const coursesList = document.getElementById('coursesList');
        if (!coursesList) return;

        coursesList.innerHTML = '';

        const availableCourses = this.coursesData.filter(course => 
            course.status === 'published' && 
            !this.enrollmentsData.some(e => e.courseId === course.id)
        );

        availableCourses.forEach(course => {
            const courseCard = this.createCourseCard(course);
            coursesList.appendChild(courseCard);
        });
    }

    // 创建课程卡片
    createCourseCard(course) {
        const card = document.createElement('div');
        card.className = 'course-card';
        
        const teacher = dataManager.getUserById(course.teacherId);
        const department = dataManager.getData('departments').find(d => d.id === course.departmentId);

        card.innerHTML = `
            <div class="course-header">
                <h3>${course.courseName}</h3>
                <span class="course-code">${course.courseCode}</span>
            </div>
            <div class="course-info">
                <p><i class="fas fa-user"></i> ${teacher ? teacher.name : '未知教师'}</p>
                <p><i class="fas fa-building"></i> ${department ? department.departmentName : '未知院系'}</p>
                <p><i class="fas fa-credit-card"></i> ${course.credits}学分</p>
                <p><i class="fas fa-users"></i> ${course.currentStudents}/${course.maxStudents}人</p>
            </div>
            <div class="course-description">
                <p>${course.description}</p>
            </div>
            <div class="course-actions">
                <button class="btn-primary" onclick="studentDashboard.enrollCourse('${course.id}')">选修课程</button>
                <button class="btn-secondary" onclick="studentDashboard.showCourseDetail('${course.id}')">查看详情</button>
            </div>
        `;

        return card;
    }

    // 选修课程
    enrollCourse(courseId) {
        const course = this.coursesData.find(c => c.id === courseId);
        if (!course) {
            showMessage('课程不存在', 'error');
            return;
        }

        if (course.currentStudents >= course.maxStudents) {
            showMessage('课程人数已满', 'warning');
            return;
        }

        // 检查是否已经选修
        if (this.enrollmentsData.some(e => e.courseId === courseId)) {
            showMessage('您已经选修了这门课程', 'warning');
            return;
        }

        // 创建选课记录
        const enrollment = {
            id: dataManager.generateId(),
            studentId: this.userData.id,
            courseId: courseId,
            enrollmentTime: new Date().toISOString(),
            status: 'active'
        };

        // 添加到数据中（这里需要扩展DataManager的方法）
        this.addEnrollment(enrollment);
        
        // 更新课程当前人数
        course.currentStudents++;
        dataManager.saveData();

        // 重新加载数据并刷新页面
        this.loadStudentData();
        this.renderCourses();
        
        showMessage(`成功选修课程：${course.courseName}`, 'success');
        
        // 记录日志
        dataManager.addLog(this.userData.id, 'course_enroll', `学生 ${this.userData.name} 选修了课程 ${course.courseName}`);
    }

    // 添加选课记录（临时实现，需要在DataManager中添加）
    addEnrollment(enrollment) {
        const data = dataManager.getData();
        if (!data.enrollments) {
            data.enrollments = [];
        }
        data.enrollments.push(enrollment);
        dataManager.saveData();
    }

    // 显示课程详情
    showCourseDetail(courseId) {
        const course = this.coursesData.find(c => c.id === courseId);
        if (!course) return;

        const teacher = dataManager.getUserById(course.teacherId);
        const department = dataManager.getData('departments').find(d => d.id === course.departmentId);
        const assignments = dataManager.getCourseAssignments(courseId);

        const modal = document.getElementById('courseDetailModal');
        const modalTitle = document.getElementById('modalCourseTitle');
        const modalContent = document.getElementById('modalCourseContent');

        modalTitle.textContent = course.courseName;
        
        modalContent.innerHTML = `
            <div class="course-detail">
                <div class="detail-section">
                    <h4>基本信息</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>课程编号:</label>
                            <span>${course.courseCode}</span>
                        </div>
                        <div class="detail-item">
                            <label>学分:</label>
                            <span>${course.credits}</span>
                        </div>
                        <div class="detail-item">
                            <label>授课教师:</label>
                            <span>${teacher ? teacher.name : '未知教师'}</span>
                        </div>
                        <div class="detail-item">
                            <label>所属院系:</label>
                            <span>${department ? department.departmentName : '未知院系'}</span>
                        </div>
                        <div class="detail-item">
                            <label>课程类型:</label>
                            <span>${course.category === 'required' ? '必修' : '选修'}</span>
                        </div>
                        <div class="detail-item">
                            <label>选课人数:</label>
                            <span>${course.currentStudents}/${course.maxStudents}</span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>课程描述</h4>
                    <p>${course.description}</p>
                </div>
                
                <div class="detail-section">
                    <h4>作业安排</h4>
                    <div class="assignments-list">
                        ${assignments.length > 0 ? assignments.map(assignment => `
                            <div class="assignment-item">
                                <h5>${assignment.title}</h5>
                                <p>类型: ${assignment.type === 'assignment' ? '作业' : '考试'}</p>
                                <p>满分: ${assignment.maxScore}分</p>
                                <p>截止时间: ${new Date(assignment.endTime).toLocaleString()}</p>
                            </div>
                        `).join('') : '<p>暂无作业安排</p>'}
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button class="btn-primary" onclick="studentDashboard.enrollCourse('${course.id}')">选修课程</button>
                    <button class="btn-secondary" onclick="studentDashboard.closeCourseModal()">关闭</button>
                </div>
            </div>
        `;

        modal.style.display = 'block';
    }

    // 关闭课程详情模态框
    closeCourseModal() {
        const modal = document.getElementById('courseDetailModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // 搜索课程
    searchCourses() {
        const searchTerm = document.getElementById('courseSearch').value.trim();
        if (!searchTerm) {
            this.renderCourses();
            return;
        }

        const searchResults = dataManager.searchCourses(searchTerm);
        const availableCourses = searchResults.filter(course => 
            course.status === 'published' && 
            !this.enrollmentsData.some(e => e.courseId === course.id)
        );

        const coursesList = document.getElementById('coursesList');
        coursesList.innerHTML = '';

        if (availableCourses.length === 0) {
            coursesList.innerHTML = '<div class="no-results">未找到匹配的课程</div>';
            return;
        }

        availableCourses.forEach(course => {
            const courseCard = this.createCourseCard(course);
            coursesList.appendChild(courseCard);
        });
    }

    // 筛选课程
    filterCourses() {
        const departmentFilter = document.getElementById('departmentFilter').value;
        const creditFilter = document.getElementById('creditFilter').value;

        let filteredCourses = this.coursesData.filter(course => 
            course.status === 'published' && 
            !this.enrollmentsData.some(e => e.courseId === course.id)
        );

        if (departmentFilter) {
            // 根据院系筛选（这里简化处理）
            const departmentMap = {
                'cs': 'd001',
                'ee': 'd002',
                'ma': 'd003'
            };
            const deptId = departmentMap[departmentFilter];
            if (deptId) {
                filteredCourses = filteredCourses.filter(course => course.departmentId === deptId);
            }
        }

        if (creditFilter) {
            filteredCourses = filteredCourses.filter(course => course.credits.toString() === creditFilter);
        }

        const coursesList = document.getElementById('coursesList');
        coursesList.innerHTML = '';

        if (filteredCourses.length === 0) {
            coursesList.innerHTML = '<div class="no-results">未找到符合条件的课程</div>';
            return;
        }

        filteredCourses.forEach(course => {
            const courseCard = this.createCourseCard(course);
            coursesList.appendChild(courseCard);
        });
    }

    // 渲染我的课程
    renderMyCourses() {
        const myCoursesList = document.getElementById('myCoursesList');
        if (!myCoursesList) return;

        myCoursesList.innerHTML = '';

        this.enrollmentsData.forEach(enrollment => {
            const course = this.coursesData.find(c => c.id === enrollment.courseId);
            if (!course) return;

            const teacher = dataManager.getUserById(course.teacherId);
            const progress = this.calculateCourseProgress(course.id);
            const assignments = dataManager.getCourseAssignments(course.id);

            const myCourseCard = document.createElement('div');
            myCourseCard.className = 'my-course-card';
            
            myCourseCard.innerHTML = `
                <div class="course-header">
                    <h3>${course.courseName}</h3>
                    <span class="course-code">${course.courseCode}</span>
                </div>
                <div class="course-info">
                    <p><i class="fas fa-user"></i> ${teacher ? teacher.name : '未知教师'}</p>
                    <p><i class="fas fa-credit-card"></i> ${course.credits}学分</p>
                    <p><i class="fas fa-tasks"></i> ${assignments.length}个作业</p>
                </div>
                <div class="course-progress">
                    <div class="progress-bar">
                        <div class="progress" style="width: ${progress}%"></div>
                    </div>
                    <span class="progress-text">学习进度: ${progress}%</span>
                </div>
                <div class="course-actions">
                    <button class="btn-primary" onclick="studentDashboard.showCourseDetail('${course.id}')">进入学习</button>
                    <button class="btn-secondary" onclick="studentDashboard.viewAssignments('${course.id}')">查看作业</button>
                </div>
            `;

            myCoursesList.appendChild(myCourseCard);
        });
    }

    // 查看作业
    viewAssignments(courseId) {
        // 切换到作业页面或显示作业详情
        showMessage('正在开发中...', 'info');
    }

    // 渲染成绩
    renderGrades() {
        this.updateGradesDisplay();
    }

    // 更新成绩显示
    updateGradesDisplay() {
        const semesterSelect = document.getElementById('semesterSelect');
        const selectedSemester = semesterSelect ? semesterSelect.value : '2024-1';
        
        const semesterGrades = this.gradesData.filter(grade => grade.semester === selectedSemester);
        
        // 更新总览统计
        const overviewStats = document.querySelector('.overview-stats');
        if (overviewStats && semesterGrades.length > 0) {
            const totalCredits = semesterGrades.reduce((sum, grade) => {
                const course = this.coursesData.find(c => c.id === grade.courseId);
                return sum + (course ? course.credits : 0);
            }, 0);
            
            const averageGrade = semesterGrades.reduce((sum, grade) => sum + grade.totalScore, 0) / semesterGrades.length;
            const averageGPA = semesterGrades.reduce((sum, grade) => sum + grade.gpa, 0) / semesterGrades.length;
            
            overviewStats.innerHTML = `
                <div class="stat">
                    <span class="label">平均绩点</span>
                    <span class="value gpa">${averageGPA.toFixed(2)}</span>
                </div>
                <div class="stat">
                    <span class="label">总学分</span>
                    <span class="value">${totalCredits}</span>
                </div>
                <div class="stat">
                    <span class="label">平均成绩</span>
                    <span class="value grade">${averageGrade.toFixed(1)}</span>
                </div>
            `;
        }

        // 更新成绩明细表
        const gradeTableBody = document.getElementById('gradeTableBody');
        if (gradeTableBody) {
            gradeTableBody.innerHTML = '';
            
            semesterGrades.forEach(grade => {
                const course = this.coursesData.find(c => c.id === grade.courseId);
                if (!course) return;
                
                const teacher = dataManager.getUserById(course.teacherId);
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${course.courseCode}</td>
                    <td>${course.courseName}</td>
                    <td>${teacher ? teacher.name : '未知教师'}</td>
                    <td>${course.credits}</td>
                    <td><span class="grade-badge ${this.getGradeClass(grade.totalScore)}">${grade.totalScore}</span></td>
                    <td>${grade.gpa}</td>
                    <td>
                        <button class="btn-sm btn-secondary" onclick="studentDashboard.viewGradeDetail('${grade.id}')">查看详情</button>
                    </td>
                `;
                
                gradeTableBody.appendChild(row);
            });
            
            if (semesterGrades.length === 0) {
                gradeTableBody.innerHTML = '<tr><td colspan="7" class="text-center">暂无成绩数据</td></tr>';
            }
        }
    }

    // 获取成绩样式类
    getGradeClass(score) {
        if (score >= 90) return 'excellent';
        if (score >= 80) return 'good';
        if (score >= 70) return 'average';
        if (score >= 60) return 'pass';
        return 'fail';
    }

    // 查看成绩详情
    viewGradeDetail(gradeId) {
        const grade = this.gradesData.find(g => g.id === gradeId);
        if (!grade) return;
        
        // 显示成绩详情模态框
        showMessage('成绩详情功能正在开发中...', 'info');
    }

    // 渲染个人信息
    renderProfile() {
        // 更新个人信息显示（已在HTML中硬编码，实际应该从数据中获取）
        // 这里可以添加动态更新逻辑
    }

    // 显示通知
    showNotifications() {
        showMessage('您有3条新通知：\n1. 数据结构作业即将截止\n2. 操作系统成绩已发布\n3. 新课程可选修', 'info');
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
    window.studentDashboard = new StudentDashboard();
});