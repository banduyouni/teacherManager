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
        this.updateNotificationBadge();
        
        // 每30秒更新一次通知徽章
        setInterval(() => {
            this.updateNotificationBadge();
        }, 30000);
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



    // 计算课程进度
    calculateCourseProgress(courseId) {
        // 优先使用手动设置的进度
        const progressData = JSON.parse(localStorage.getItem('courseProgress') || '{}');
        if (progressData[courseId] && progressData[courseId].studentId === this.userData.id) {
            return progressData[courseId].progress;
        }

        // 如果没有手动设置，则基于作业完成情况计算
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

    // 为完成的课程生成成绩
    generateGradeForCompletedCourse(courseId, course) {
        // 检查是否已经有成绩
        const existingGrade = this.gradesData.find(g => g.courseId === courseId && g.studentId === this.userData.id);
        if (existingGrade) {
            return false; // 已有成绩，不再生成
        }

        // 生成随机成绩 (60-100分)
        const score = Math.round(Math.random() * 40 + 60);
        
        // 根据成绩计算绩点 (等比例换算：4.5对应100分)
        const gpa = (score / 100 * 4.5).toFixed(2);
        
        // 生成成绩记录
        const grade = {
            id: dataManager.generateId(),
            studentId: this.userData.id,
            courseId: courseId,
            courseCode: course.courseCode,
            courseName: course.courseName,
            credits: course.credits,
            totalScore: score,
            gpa: parseFloat(gpa),
            semester: this.getCurrentSemester(),
            gradeTime: new Date().toISOString(),
            status: 'published',
            gradeDetails: {
                regularScore: Math.round(score * 0.3),  // 平时成绩30%
                midtermScore: Math.round(score * 0.3),   // 期中成绩30%
                finalScore: Math.round(score * 0.4),     // 期末成绩40%
                attendanceScore: Math.round(Math.random() * 5 + 5) // 出勤分数5-10分
            }
        };

        // 保存成绩到数据管理器
        const data = dataManager.getData();
        if (!data.grades) {
            data.grades = [];
        }
        data.grades.push(grade);
        dataManager.saveData();

        // 重新加载成绩数据
        this.gradesData = dataManager.getStudentGrades(this.userData.id);

        return true;
    }

    // 获取当前学期
    getCurrentSemester() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        
        // 假设3-8月为第一学期，9-2月为第二学期
        if (month >= 2 && month <= 7) {
            return `${year}-1`;
        } else {
            return `${year}-2`;
        }
    }

    // 检查课程是否应该有成绩（基于学习进度）
    shouldHaveGrade(courseId) {
        const progress = this.calculateCourseProgress(courseId);
        const assignments = dataManager.getCourseAssignments(courseId);
        
        // 只有当进度达到80%以上，或者作业大部分完成时，才应该有成绩
        const completedCount = assignments.filter(assignment => {
            const submissions = dataManager.getStudentSubmissions(this.userData.id, assignment.id);
            return submissions && submissions.length > 0;
        }).length;

        // 进度超过80%或完成大部分作业，才可能有成绩
        return progress >= 80 || (assignments.length > 0 && completedCount / assignments.length >= 0.8);
    }

    // 渲染课程浏览
    renderCourses() {
        const coursesList = document.getElementById('coursesList');
        if (!coursesList) return;

        coursesList.innerHTML = '';

        // 显示所有课程，但标记已选状态
        const allCourses = this.coursesData.filter(course => 
            course.status === 'published'
        );

        allCourses.forEach(course => {
            const isEnrolled = this.enrollmentsData.some(e => e.courseId === course.id);
            const courseCard = this.createCourseCard(course, isEnrolled);
            coursesList.appendChild(courseCard);
        });
    }

    // 创建课程卡片
    createCourseCard(course, isEnrolled = false) {
        const card = document.createElement('div');
        card.className = 'course-card';
        
        const teacher = dataManager.getUserById(course.teacherId);
        const department = dataManager.getData('departments').find(d => d.id === course.departmentId);

        // 根据是否已选课设置不同的按钮和状态
        const actionButtons = isEnrolled ? 
            `<button class="btn-danger" onclick="studentDashboard.dropCourse('${course.id}')">退选课程</button>
             <button class="btn-secondary" onclick="studentDashboard.showCourseDetail('${course.id}')">查看详情</button>` :
            `<button class="btn-primary" onclick="studentDashboard.enrollCourse('${course.id}')">选修课程</button>
             <button class="btn-secondary" onclick="studentDashboard.showCourseDetail('${course.id}')">查看详情</button>`;

        const statusBadge = isEnrolled ? '<span class="enrollment-badge enrolled">已选</span>' : '<span class="enrollment-badge available">可选</span>';

        card.innerHTML = `
            <div class="course-header">
                <h3>${course.courseName}</h3>
                <span class="course-code">${course.courseCode}</span>
                ${statusBadge}
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
                ${actionButtons}
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
            status: 'active',
            type: 'enrolled' // 标记为正式选修
        };

        // 添加到数据中
        this.addEnrollment(enrollment);
        
        // 更新课程当前人数
        course.currentStudents++;
        
        // 确保课程状态完全初始化（清除可能的旧数据残留）
        this.initializeCourseState(courseId);
        
        dataManager.saveData();

        // 重新加载数据并刷新页面
        this.loadStudentData();
        this.renderCourses();
        this.renderMyCourses();
        
        showMessage(`成功选修课程：${course.courseName}`, 'success');
        
        // 记录日志
        dataManager.addLog(this.userData.id, 'course_enroll', `学生 ${this.userData.name} 选修了课程 ${course.courseName}`);
    }

    // 清除课程相关数据（确保重新选课时没有数据残留）
    cleanCourseData(courseId) {
        const data = dataManager.getData();
        
        // 1. 清除该课程的进度数据
        const progressData = JSON.parse(localStorage.getItem('courseProgress') || '{}');
        if (progressData[courseId]) {
            delete progressData[courseId];
            localStorage.setItem('courseProgress', JSON.stringify(progressData));
        }
        
        // 2. 清除该课程的作业提交记录
        if (data.submissions) {
            data.submissions = data.submissions.filter(submission => {
                const assignment = data.assignments?.find(a => a.id === submission.assignmentId);
                return !(assignment && assignment.courseId === courseId);
            });
        }
        
        // 3. 清除该课程的成绩记录
        if (data.grades) {
            data.grades = data.grades.filter(grade => grade.courseId !== courseId);
        }
        
        // 4. 清除该课程的作业缓存（在当前实例中的数据）
        this.enrollmentsData = this.enrollmentsData.filter(e => e.courseId !== courseId);
        this.gradesData = this.gradesData.filter(g => g.courseId !== courseId);
        
        console.log(`已清除课程 ${courseId} 的所有相关数据`);
    }

    // 初始化课程状态（确保新选课的课程状态正确）
    initializeCourseState(courseId) {
        // 确保没有残留的进度数据
        const progressData = JSON.parse(localStorage.getItem('courseProgress') || '{}');
        if (progressData[courseId]) {
            delete progressData[courseId];
            localStorage.setItem('courseProgress', JSON.stringify(progressData));
        }
        
        // 确保没有残留的成绩记录
        const data = dataManager.getData();
        if (data.grades) {
            const existingGradeIndex = data.grades.findIndex(g => 
                g.courseId === courseId && g.studentId === this.userData.id
            );
            if (existingGradeIndex !== -1) {
                data.grades.splice(existingGradeIndex, 1);
            }
        }
        
        console.log(`已初始化课程 ${courseId} 的状态`);
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

    // 更新课程进度
    updateCourseProgress(courseId, progressValue) {
        const progress = parseInt(progressValue);
        
        // 输入验证
        if (isNaN(progress) || progress < 0 || progress > 100) {
            showMessage('请输入0-100之间的有效数字', 'error');
            // 重置输入框为当前保存的进度值
            const currentProgress = this.calculateCourseProgress(courseId);
            const inputElement = document.getElementById(`progress-input-${courseId}`);
            if (inputElement) {
                inputElement.value = currentProgress;
                inputElement.classList.add('error');
                setTimeout(() => {
                    inputElement.classList.remove('error');
                    inputElement.focus();
                }, 500);
            }
            return;
        }

        // 获取课程信息
        const course = this.coursesData.find(c => c.id === courseId);
        const courseName = course ? course.courseName : '课程';

        // 保存进度到本地存储
        const progressData = JSON.parse(localStorage.getItem('courseProgress') || '{}');
        progressData[courseId] = {
            studentId: this.userData.id,
            progress: progress,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('courseProgress', JSON.stringify(progressData));

        // 检查是否达到100%进度，如果是则生成成绩
        let gradeGenerated = false;
        if (progress === 100) {
            gradeGenerated = this.generateGradeForCompletedCourse(courseId, course);
        }

        // 添加视觉反馈效果
        const inputElement = document.getElementById(`progress-input-${courseId}`);
        
        if (inputElement) {
            // 添加成功动画效果
            inputElement.classList.add('success');
            setTimeout(() => {
                inputElement.classList.remove('success');
            }, 1500);
        }

        // 刷新相关显示
        this.renderMyCourses();
        this.renderGrades();
        
        // 显示不同的成功消息
        if (gradeGenerated) {
            showMessage(`🎉 恭喜！"${courseName}" 学习进度达到100%，已生成最终成绩`, 'success');
        } else {
            showMessage(`✅ "${courseName}" 学习进度已更新为 ${progress}%`, 'success');
        }
    }

    // 退选课程
    dropCourse(courseId) {
        const course = this.coursesData.find(c => c.id === courseId);
        if (!course) {
            showMessage('课程不存在', 'error');
            return;
        }

        // 找到选课记录（从数据管理器中查找）
        const allEnrollments = dataManager.getData('enrollments');
        const enrollmentIndex = allEnrollments.findIndex(e => 
            e.studentId === this.userData.id && e.courseId === courseId && e.status === 'active'
        );
        if (enrollmentIndex === -1) {
            showMessage('未找到选课记录', 'error');
            return;
        }

        // 确认对话框
        if (!confirm(`确定要退选课程"${course.courseName}"吗？此操作不可恢复。`)) {
            return;
        }

        // 从数据管理器中删除选课记录（关键修复）
        allEnrollments.splice(enrollmentIndex, 1);
        
        // 更新课程当前人数
        if (course.currentStudents > 0) {
            course.currentStudents--;
        }
        
        // 彻底清除该课程相关的所有学生数据
        this.cleanCourseData(courseId);
        
        // 保存到持久化存储
        dataManager.saveData();

        // 重新加载数据并刷新页面
        this.loadStudentData();
        this.renderCourses();
        this.renderMyCourses();
        
        showMessage(`已成功退选课程"${course.courseName}"`, 'success');
        
        // 记录日志
        dataManager.addLog(this.userData.id, 'course_drop', `学生 ${this.userData.name} 退选了课程 ${course.courseName}`);
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
            course.status === 'published'
        );

        const coursesList = document.getElementById('coursesList');
        coursesList.innerHTML = '';

        if (availableCourses.length === 0) {
            coursesList.innerHTML = '<div class="no-results">未找到匹配的课程</div>';
            return;
        }

        availableCourses.forEach(course => {
            const isEnrolled = this.enrollmentsData.some(e => e.courseId === course.id);
            const courseCard = this.createCourseCard(course, isEnrolled);
            coursesList.appendChild(courseCard);
        });
    }

    // 筛选课程
    filterCourses() {
        const departmentFilter = document.getElementById('departmentFilter').value;
        const creditFilter = document.getElementById('creditFilter').value;

        let filteredCourses = this.coursesData.filter(course => 
            course.status === 'published'
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
            const isEnrolled = this.enrollmentsData.some(e => e.courseId === course.id);
            const courseCard = this.createCourseCard(course, isEnrolled);
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
            
            // 检查是否有成绩（表示课程已完成）
            const hasGrade = this.gradesData.some(g => g.courseId === course.id);
            const isCompleted = progress === 100 || hasGrade;
            
            // 始终显示进度输入框，无论课程是否已完成
            myCourseCard.innerHTML = `
                <div class="course-header">
                    <h3>${course.courseName}</h3>
                    <span class="course-code">${course.courseCode}</span>
                    ${isCompleted ? '<span class="completion-badge completed">✅ 已完成</span>' : '<span class="completion-badge learning">📖 学习中</span>'}
                </div>
                <div class="course-info">
                    <p><i class="fas fa-user"></i> ${teacher ? teacher.name : '未知教师'}</p>
                    <p><i class="fas fa-credit-card"></i> ${course.credits}学分</p>
                    <p><i class="fas fa-tasks"></i> ${assignments.length}个作业</p>
                </div>
                <div class="progress-input-section">
                    <label for="progress-input-${course.id}">📊 学习进度设置</label>
                    <div class="progress-input-group">
                        <input type="number" 
                               id="progress-input-${course.id}" 
                               class="progress-input" 
                               min="0" 
                               max="100" 
                               value="${progress}" 
                               placeholder="0-100"
                               title="请输入0-100之间的数字"
                               onkeypress="if(event.key==='Enter'){studentDashboard.updateCourseProgress('${course.id}', this.value)}"
                               onblur="if(this.value!=='${progress}'){studentDashboard.updateCourseProgress('${course.id}', this.value)}">
                        <span>%</span>
                        <button class="btn-sm btn-primary" onclick="studentDashboard.updateCourseProgress('${course.id}', document.getElementById('progress-input-${course.id}').value)">✓ 更新进度</button>
                    </div>
                </div>
                <div class="course-actions">
                    ${isCompleted ? 
                        `<button class="btn-success" onclick="studentDashboard.showCourseDetail('${course.id}')">📋 查看详情</button>
                         <button class="btn-secondary" onclick="studentDashboard.viewGradeDetail('${this.gradesData.find(g => g.courseId === course.id)?.id}')">📊 查看成绩</button>` :
                        `<button class="btn-primary" onclick="studentDashboard.showCourseDetail('${course.id}')">进入学习</button>
                         <button class="btn-secondary" onclick="studentDashboard.viewAssignments('${course.id}')">查看作业</button>`
                    }
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
        const selectedSemester = semesterSelect ? semesterSelect.value : this.getCurrentSemester();
        
        // 过滤指定学期的所有成绩（不过滤进度，只要学期匹配就显示）
        const semesterGrades = this.gradesData.filter(grade => grade.semester === selectedSemester);
        
        // 更新总览统计 - 显示所有该学期的成绩和预测成绩统计
        const overviewStats = document.querySelector('.overview-stats');
        if (overviewStats) {
            // 获取当前学期的所有选课
            const currentSemesterEnrollments = this.enrollmentsData.filter(e => {
                const course = this.coursesData.find(c => c.id === e.courseId);
                return course && e.status === 'active' && e.type === 'enrolled';
            });
            
            // 统计实际成绩
            let actualGrades = semesterGrades;
            
            // 统计预测绩点和成绩（只针对没有实际成绩但进度100%的课程）
            let predictedGPAs = [];
            let predictedScores = [];
            
            currentSemesterEnrollments.forEach(enrollment => {
                const course = this.coursesData.find(c => c.id === enrollment.courseId);
                if (!course) return;
                
                const progress = this.calculateCourseProgress(course.id);
                const hasActualGrade = semesterGrades.some(g => g.courseId === course.id);
                
                if (progress === 100 && !hasActualGrade) {
                    // 生成预测成绩和绩点（与明细表逻辑一致）
                    const assignments = dataManager.getCourseAssignments(course.id);
                    const completedAssignments = assignments.filter(assignment => {
                        const submissions = dataManager.getStudentSubmissions(this.userData.id, assignment.id);
                        return submissions && submissions.length > 0;
                    }).length;
                    
                    let score;
                    if (assignments.length > 0 && completedAssignments === assignments.length) {
                        // 所有作业都完成，给予较好的预测成绩 (85-100分)
                        score = Math.random() * 15 + 85;
                    } else if (completedAssignments > 0) {
                        // 部分作业完成，给予中等预测成绩 (75-89分)
                        score = Math.random() * 14 + 75;
                    } else {
                        // 没有作业完成，给予基础预测成绩 (60-79分)
                        score = Math.random() * 19 + 60;
                    }
                    
                    // 根据成绩等比例换算绩点 (4.5对应100分)
                    const predictedGPA = score / 100 * 4.5;
                    predictedGPAs.push({ gpa: predictedGPA, credits: course.credits });
                    predictedScores.push(score);
                }
            });
            
            // 计算综合统计
            const allGPAs = [
                ...actualGrades.map(g => ({ gpa: g.gpa, credits: g.credits })),
                ...predictedGPAs
            ];
            
            // 计算所有成绩（实际+预测）的平均值
            const allScores = [
                ...actualGrades.map(g => g.totalScore),
                ...predictedScores
            ];
            
            if (currentSemesterEnrollments.length > 0) {
                // 计算总学分（实际选课的学分）
                const totalCredits = currentSemesterEnrollments.reduce((sum, enrollment) => {
                    const course = this.coursesData.find(c => c.id === enrollment.courseId);
                    return sum + (course ? course.credits : 0);
                }, 0);
                
                // 计算加权平均绩点
                const weightedGPA = allGPAs.length > 0 ? 
                    allGPAs.reduce((sum, item) => sum + (item.gpa * item.credits), 0) / totalCredits : 0;
                
                // 计算平均成绩
                const averageGrade = allScores.length > 0 ? 
                    allScores.reduce((sum, score) => sum + score, 0) / allScores.length : 0;
                
                overviewStats.innerHTML = `
                    <div class="stat">
                        <span class="label">平均绩点</span>
                        <span class="value gpa">${weightedGPA > 0 ? weightedGPA.toFixed(2) : '--'}</span>
                    </div>
                    <div class="stat">
                        <span class="label">总学分</span>
                        <span class="value">${totalCredits}</span>
                    </div>
                    <div class="stat">
                        <span class="label">平均成绩</span>
                        <span class="value grade">${averageGrade > 0 ? averageGrade.toFixed(1) : '--'}</span>
                    </div>
                    <div class="stat">
                        <span class="label">课程数量</span>
                        <span class="value">${currentSemesterEnrollments.length}</span>
                    </div>
                `;
            } else {
                // 该学期没有选课时显示默认值
                overviewStats.innerHTML = `
                    <div class="stat">
                        <span class="label">平均绩点</span>
                        <span class="value gpa">--</span>
                    </div>
                    <div class="stat">
                        <span class="label">总学分</span>
                        <span class="value">0</span>
                    </div>
                    <div class="stat">
                        <span class="label">平均成绩</span>
                        <span class="value grade">--</span>
                    </div>
                    <div class="stat">
                        <span class="label">课程数量</span>
                        <span class="value">0</span>
                    </div>
                `;
            }
        }

        // 更新成绩明细表
        const gradeTableBody = document.getElementById('gradeTableBody');
        if (gradeTableBody) {
            gradeTableBody.innerHTML = '';
            
            // 显示当前学期的所有选课情况
            const enrolledCourses = this.enrollmentsData.filter(e => 
                e.status === 'active' && e.type === 'enrolled'
            );
            
            enrolledCourses.forEach(enrollment => {
                const course = this.coursesData.find(c => c.id === enrollment.courseId);
                if (!course) return;
                
                const progress = this.calculateCourseProgress(course.id);
                const teacher = dataManager.getUserById(course.teacherId);
                const grade = semesterGrades.find(g => g.courseId === course.id);
                
                const row = document.createElement('tr');
                
                if (grade) {
                    // 有成绩的课程
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
                } else {
                    // 没有成绩的课程
                    const statusText = progress === 100 ? '已完成' : '学习中';
                    const statusClass = progress === 100 ? 'completed' : 'progress';
                    const statusBadge = progress === 100 ? 
                        `<span class="grade-badge ${statusClass}">🎉 已完成 (${progress}%)</span>` :
                        `<span class="grade-badge ${statusClass}">学习中 (${progress}%)</span>`;
                    
                    // 如果进度为100%，生成预测绩点和对应成绩
                    let predictedGPA = '-';
                    let predictedScore = '-';
                    if (progress === 100) {
                        // 基于作业完成情况生成预测绩点
                        const assignments = dataManager.getCourseAssignments(course.id);
                        const completedAssignments = assignments.filter(assignment => {
                            const submissions = dataManager.getStudentSubmissions(this.userData.id, assignment.id);
                            return submissions && submissions.length > 0;
                        }).length;
                        
                        let score;
                        if (assignments.length > 0 && completedAssignments === assignments.length) {
                            // 所有作业都完成，给予较好的预测成绩 (85-100分)
                            score = Math.random() * 15 + 85;
                        } else if (completedAssignments > 0) {
                            // 部分作业完成，给予中等预测成绩 (75-89分)
                            score = Math.random() * 14 + 75;
                        } else {
                            // 没有作业完成，给予基础预测成绩 (60-79分)
                            score = Math.random() * 19 + 60;
                        }
                        
                        // 根据成绩等比例换算绩点 (4.5对应100分)
                        predictedGPA = (score / 100 * 4.5).toFixed(2);
                        predictedScore = Math.round(score);
                    }
                    
                    const gradeDisplay = predictedScore !== '-' ? 
                        `<span class="grade-badge ${this.getGradeClass(predictedScore)}">${predictedScore}</span>` : 
                        statusBadge;
                    
                    row.innerHTML = `
                        <td>${course.courseCode}</td>
                        <td>${course.courseName}</td>
                        <td>${teacher ? teacher.name : '未知教师'}</td>
                        <td>${course.credits}</td>
                        <td>${gradeDisplay}</td>
                        <td>${predictedGPA}</td>
                        <td>
                            <span class="status ${progress === 100 ? 'completed' : 'learning'}">
                                ${progress === 100 ? '✅ 已完成' : '📖 学习中'}
                            </span>
                        </td>
                    `;
                }
                
                gradeTableBody.appendChild(row);
            });
            
            if (enrolledCourses.length === 0) {
                gradeTableBody.innerHTML = '<tr><td colspan="7" class="text-center">暂无选课记录</td></tr>';
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
        
        // 创建成绩详情HTML
        const detailsHTML = `
            <div class="grade-detail-modal">
                <div class="grade-detail-header">
                    <h3>📊 成绩详情</h3>
                    <button class="close-modal" onclick="this.closest('.grade-detail-modal').remove()">×</button>
                </div>
                <div class="grade-detail-content">
                    <div class="grade-summary">
                        <div class="total-score">
                            <span class="score-label">总成绩</span>
                            <span class="score-value">${grade.totalScore}</span>
                            <span class="score-unit">分</span>
                        </div>
                        <div class="gpa-score">
                            <span class="gpa-label">绩点</span>
                            <span class="gpa-value">${grade.gpa}</span>
                        </div>
                    </div>
                    <div class="grade-breakdown">
                        <h4>📝 成绩构成</h4>
                        <div class="breakdown-item">
                            <span class="item-label">平时成绩</span>
                            <span class="item-score">${grade.gradeDetails.regularScore}分</span>
                        </div>
                        <div class="breakdown-item">
                            <span class="item-label">期中成绩</span>
                            <span class="item-score">${grade.gradeDetails.midtermScore}分</span>
                        </div>
                        <div class="breakdown-item">
                            <span class="item-label">期末成绩</span>
                            <span class="item-score">${grade.gradeDetails.finalScore}分</span>
                        </div>
                        <div class="breakdown-item">
                            <span class="item-label">出勤分数</span>
                            <span class="item-score">${grade.gradeDetails.attendanceScore}分</span>
                        </div>
                    </div>
                    <div class="grade-info">
                        <p><strong>课程：</strong>${grade.courseName} (${grade.courseCode})</p>
                        <p><strong>学分：</strong>${grade.credits}</p>
                        <p><strong>学期：</strong>${grade.semester}</p>
                        <p><strong>成绩发布时间：</strong>${new Date(grade.gradeTime).toLocaleString()}</p>
                    </div>
                </div>
            </div>
        `;

        // 显示模态框
        const modal = document.createElement('div');
        modal.className = 'grade-modal-overlay';
        modal.innerHTML = detailsHTML;
        document.body.appendChild(modal);

        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // 渲染个人信息
    renderProfile() {
        // 更新个人信息显示（已在HTML中硬编码，实际应该从数据中获取）
        // 这里可以添加动态更新逻辑
    }

    // 更新通知徽章
    updateNotificationBadge() {
        const badge = document.querySelector('.notification-btn .badge');
        if (!badge) return;

        // 获取学生的未读通知数量
        const unreadCount = this.getUnreadNotificationsCount();
        
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.style.display = 'inline-block';
            badge.classList.add('has-new');
        } else {
            badge.style.display = 'none';
            badge.classList.remove('has-new');
        }
    }

    // 获取未读通知数量
    getUnreadNotificationsCount() {
        // 这里可以根据实际业务逻辑计算
        let count = 0;
        
        // 检查即将到期的作业
        count += this.getUpcomingAssignmentsCount();
        
        // 检查新发布的通知
        count += this.getNewAnnouncementsCount();
        
        // 检查待处理的事务
        count += this.getPendingTasksCount();
        
        return count;
    }

    // 获取即将到期的作业数量
    getUpcomingAssignmentsCount() {
        const now = new Date();
        let count = 0;
        
        this.enrollmentsData.forEach(enrollment => {
            const assignments = dataManager.getCourseAssignments(enrollment.courseId);
            assignments.forEach(assignment => {
                const endTime = new Date(assignment.endTime);
                const hoursLeft = (endTime - now) / (1000 * 60 * 60);
                
                // 24小时内到期的作业
                if (hoursLeft > 0 && hoursLeft <= 24) {
                    count++;
                }
            });
        });
        
        return count;
    }

    // 获取新公告数量
    getNewAnnouncementsCount() {
        // 模拟新公告数量，实际应该从数据库获取
        return Math.floor(Math.random() * 3);
    }

    // 获取待处理任务数量
    getPendingTasksCount() {
        let count = 0;
        
        // 检查未提交的作业
        this.enrollmentsData.forEach(enrollment => {
            const assignments = dataManager.getCourseAssignments(enrollment.courseId);
            assignments.forEach(assignment => {
                const submissions = dataManager.getStudentSubmissions(this.userData.id, assignment.id);
                if (submissions.length === 0) {
                    const now = new Date();
                    const endTime = new Date(assignment.endTime);
                    if (endTime > now) {
                        count++;
                    }
                }
            });
        });
        
        return count;
    }

    // 显示通知
    showNotifications() {
        const notifications = this.getNotificationsList();
        
        if (notifications.length === 0) {
            showMessage('暂无新通知', 'info');
            return;
        }
        
        let notificationText = `您有${notifications.length}条新通知：\n`;
        notifications.forEach((notif, index) => {
            notificationText += `${index + 1}. ${notif.text}\n`;
        });
        
        showMessage(notificationText, 'info');
    }

    // 获取通知列表
    getNotificationsList() {
        const notifications = [];
        
        // 即将到期的作业
        this.enrollmentsData.forEach(enrollment => {
            const course = dataManager.getData('courses').find(c => c.id === enrollment.courseId);
            const assignments = dataManager.getCourseAssignments(enrollment.courseId);
            
            assignments.forEach(assignment => {
                const now = new Date();
                const endTime = new Date(assignment.endTime);
                const hoursLeft = (endTime - now) / (1000 * 60 * 60);
                
                if (hoursLeft > 0 && hoursLeft <= 24) {
                    notifications.push({
                        type: 'assignment',
                        text: `${course?.courseName || '课程'}作业"${assignment.title}"将在${Math.round(hoursLeft)}小时后截止`,
                        priority: hoursLeft <= 6 ? 'high' : 'normal'
                    });
                }
            });
        });
        
        // 新发布的成绩
        const unpublishedGrades = this.gradesData.filter(grade => 
            grade.status !== 'read' && grade.totalScore !== undefined
        );
        
        unpublishedGrades.forEach(grade => {
            const course = dataManager.getData('courses').find(c => c.id === grade.courseId);
            notifications.push({
                type: 'grade',
                text: `${course?.courseName || '课程'}成绩已发布：${grade.totalScore}分`,
                priority: 'normal'
            });
        });
        
        // 按优先级和时间排序
        return notifications.sort((a, b) => {
            if (a.priority === 'high' && b.priority !== 'high') return -1;
            if (b.priority === 'high' && a.priority !== 'high') return 1;
            return 0;
        });
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