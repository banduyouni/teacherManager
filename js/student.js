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

        // 考试页面课程选择器
        const examCourseSelect = document.getElementById('examCourseSelect');
        if (examCourseSelect) {
            examCourseSelect.addEventListener('change', () => {
                this.loadCourseExams();
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
            case 'assignments':
                this.renderAssignmentsPage();
                break;
            case 'exams':
                this.renderExamsPage();
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
            const assignments = dataManager.getCourseHomework(enrollment.courseId);
            assignments.forEach(assignment => {
                if (new Date(assignment.endTime) > new Date()) {
                    const submissions = dataManager.getStudentSubmissions(this.userData.id, assignment.id);
                    if (submissions.length === 0) {
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
        // 检查是否在grades数组中有成绩记录（根据新的数据结构）
        // 支持两种字段名：studentid 和 studentId，以及username匹配
        const grade = this.gradesData.find(g => 
            g.courseId === courseId && (
                g.studentid === this.userData.id || 
                g.studentId === this.userData.id ||
                g.username === this.userData.username
            )
        );
        if (grade) {
            return 100; // 有成绩记录则课程完成度为100%
        }

        // 如果没有成绩，则基于作业完成情况自动计算
        const assignments = dataManager.getCourseHomework(courseId);
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
        const assignments = dataManager.getCourseHomework(courseId);
        
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

        // 检查课程是否可选
        if (!dataManager.isCourseAvailable(courseId)) {
            showMessage('课程不可选或人数已满', 'warning');
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

        // 使用dataManager的添加选课记录方法（确保数据一致性）
        if (!dataManager.addEnrollment(enrollment)) {
            showMessage('选课失败，请检查课程状态或您是否已选过该课程', 'error');
            return;
        }
        
        // 确保课程状态完全初始化（清除可能的旧数据残留）
        this.initializeCourseState(courseId);
        
        // 重新加载课程数据以获取更新的学生数
        this.coursesData = dataManager.getData('courses');

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
        
        // 1. 清除该课程的作业提交记录
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

        // 使用dataManager的删除选课记录方法（确保数据一致性）
        if (!dataManager.removeEnrollment(this.userData.id, courseId)) {
            showMessage('退选失败，未找到选课记录', 'error');
            return;
        }
        
        // 彻底清除该课程相关的所有学生数据
        this.cleanCourseData(courseId);
        
        // 重新加载课程数据以获取更新的学生数
        this.coursesData = dataManager.getData('courses');

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
        const assignments = dataManager.getCourseHomework(courseId);
        
        // 获取课程课件
        const courseMaterials = dataManager.getData('courseMaterials').filter(cm => cm.courseId === courseId);
        const materialsList = this.processCourseMaterials(courseMaterials);

        // 创建动态模态框以确保样式一致
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'course-detail-modal-overlay';
        modalOverlay.innerHTML = `
            <div class="course-detail-modal">
                <div class="detail-header">
                    <h3>📚 课程详情 - ${course.courseName}</h3>
                    <button class="close-btn" onclick="this.closest('.course-detail-modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="detail-content">
                    <div class="course-detail">
                        <div class="detail-section">
                            <h4>📋 基本信息</h4>
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
                            <h4>📝 课程描述</h4>
                            <div class="description-content">
                                <p>${course.description}</p>
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h4>📚 课程课件</h4>
                            <div class="course-materials">
                                ${materialsList.length > 0 ? materialsList.map(material => `
                                    <div class="material-item">
                                        <div class="material-info">
                                            <i class="fas fa-file-${this.getFileIcon(material.extension)}"></i>
                                            <div>
                                                <h5>${this.escapeHtml(material.name)}</h5>
                                                <p>文件类型: <span class="file-type-badge">${material.extension.toUpperCase()}</span> | 文件大小: <span class="file-size-badge ${this.getFileSizeClass(material.size || 0)}">${this.formatFileSize(material.size || 0)}</span> | 上传时间: ${new Date(material.uploadTime).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div class="material-actions">
                                            <button class="btn-sm btn-success" onclick="studentDashboard.downloadCourseMaterial('${this.escapeHtml(material.tempPath)}', '${this.escapeHtml(material.name)}')">
                                                <i class="fas fa-download"></i>下载
                                            </button>
                                        </div>
                                    </div>
                                `).join('') : '<div class="no-materials"><i class="fas fa-folder-open"></i> 暂无课程课件</div>'}
                            </div>
                        </div>
                        
                        <div class="detail-section">
                            <h4>📋 作业与考试安排</h4>
                            <div class="assignments-list">
                                ${assignments.length > 0 ? assignments.map(assignment => `
                                    <div class="assignment-item">
                                        <div class="assignment-info">
                                            <h5>${assignment.title}</h5>
                                            <div class="assignment-meta">
                                                <span class="assignment-type-badge ${assignment.type}">
                                                    <i class="fas fa-${assignment.type === 'assignment' ? 'edit' : 'clipboard-check'}"></i>
                                                    ${assignment.type === 'assignment' ? '作业' : '考试'}
                                                </span>
                                                ${assignment.type === 'exam' ? `<span class="exam-duration"><i class="fas fa-clock"></i> ${assignment.duration || 120}分钟</span>` : ''}
                                                <span class="assignment-score"><i class="fas fa-star"></i> ${assignment.maxScore}分</span>
                                            </div>
                                            <p class="assignment-deadline">
                                                <i class="fas fa-calendar-alt"></i>
                                                截止时间: ${new Date(assignment.endTime).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                `).join('') : '<div class="no-assignments"><i class="fas fa-tasks"></i> 暂无作业和考试安排</div>'}
                            </div>
                        </div>
                        
                        <div class="detail-actions">
                            <button class="btn-primary" onclick="this.closest('.course-detail-modal-overlay').remove(); studentDashboard.enrollCourse('${course.id}')">
                                <i class="fas fa-plus-circle"></i> 选修课程
                            </button>
                            <button class="btn-secondary" onclick="this.closest('.course-detail-modal-overlay').remove()">
                                <i class="fas fa-times"></i> 关闭
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modalOverlay);
        
        // 点击背景关闭
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.remove();
            }
        });

        modal.style.display = 'block';
    }

    // 处理课程课件列表
    processCourseMaterials(courseMaterials) {
        const materialsList = [];
        
        courseMaterials.forEach(cm => {
            if (cm.files && Array.isArray(cm.files)) {
                cm.files.forEach(fileData => {
                    // 检查是否是新格式的文件数据（包含完整文件信息）
                    if (typeof fileData === 'object' && fileData.name) {
                        const extension = fileData.name.split('.').pop().toLowerCase();
                        
                        // 使用tempPath作为下载路径
                        const tempPath = fileData.tempPath || fileData.blobUrl;
                        
                        materialsList.push({
                            tempPath: tempPath,
                            name: fileData.name,
                            extension: extension,
                            uploadTime: fileData.uploadTime || cm.uploadTime || new Date().toISOString(),
                            size: fileData.size,
                            type: fileData.type
                        });
                    } else {
                        // 兼容旧格式
                        const fileInfo = this.extractFileInfo(fileData);
                        materialsList.push({
                            ...fileInfo,
                            uploadTime: cm.uploadTime || new Date().toISOString()
                        });
                    }
                });
            }
        });
        
        return materialsList;
    }

    // 从文件路径提取文件信息
    extractFileInfo(filePath) {
        const fileName = filePath.split('/').pop();
        const lastDotIndex = fileName.lastIndexOf('.');
        const extension = lastDotIndex > -1 ? fileName.substring(lastDotIndex + 1) : '';
        const name = lastDotIndex > -1 ? fileName.substring(0, lastDotIndex) : fileName;
        
        return {
            tempPath: filePath,
            name: fileName,
            extension: extension.toLowerCase()
        };
    }

    // 下载课程课件
    downloadCourseMaterial(tempPath, fileName) {
        try {
            console.log('下载课程课件:', tempPath, fileName);
            dataManager.downloadTempFile(tempPath);
            showMessage(`正在下载课件: ${fileName}`, 'info');
            dataManager.addLog(this.userData.id, 'download_course_material', `下载课件: ${fileName}`);
        } catch (error) {
            console.error('下载课件失败:', error);
            showMessage(`下载课件失败: ${fileName}`, 'error');
        }
    }

    // 下载考试附件
    downloadExamAttachment(tempPath, fileName) {
        try {
            console.log('下载考试附件:', tempPath, fileName);
            dataManager.downloadTempFile(tempPath);
            showMessage(`正在下载附件: ${fileName}`, 'info');
            dataManager.addLog(this.userData.id, 'download_exam_attachment', `下载考试附件: ${fileName}`);
        } catch (error) {
            console.error('下载附件失败:', error);
            showMessage(`下载附件失败: ${fileName}`, 'error');
        }
    }

    // 获取文件图标
    getFileIcon(extension) {
        const iconMap = {
            'pdf': 'pdf',
            'doc': 'word',
            'docx': 'word',
            'xls': 'excel',
            'xlsx': 'excel',
            'ppt': 'powerpoint',
            'pptx': 'powerpoint',
            'txt': 'alt',
            'md': 'alt',
            'jpg': 'image',
            'jpeg': 'image',
            'png': 'image',
            'gif': 'image',
            'svg': 'image',
            'mp4': 'video',
            'avi': 'video',
            'mov': 'video',
            'mp3': 'audio',
            'wav': 'audio',
            'zip': 'archive',
            'rar': 'archive',
            'cpp': 'code',
            'java': 'code',
            'py': 'code',
            'js': 'code',
            'html': 'code',
            'css': 'code'
        };
        return iconMap[extension.toLowerCase()] || 'alt';
    }

    // 获取文件大小样式类
    getFileSizeClass(size) {
        if (size < 1024) return 'size-small';
        if (size < 1024 * 1024) return 'size-medium';
        return 'size-large';
    }

    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
            const assignments = dataManager.getCourseHomework(course.id);

            const myCourseCard = document.createElement('div');
            myCourseCard.className = 'my-course-card';
            
            // 检查是否有成绩记录（根据新的数据结构）
            const hasGrade = this.gradesData.some(g => 
                g.courseId === course.id && (
                    g.studentid === this.userData.id || 
                    g.studentId === this.userData.id ||
                    g.username === this.userData.username
                )
            );
            const isCompleted = progress === 100 || hasGrade;
            
            // 显示课程信息，不包含手动进度设置
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
                    <p><i class="fas fa-chart-line"></i> 学习进度：${progress}%</p>
                </div>
                <div class="course-actions">
                    ${(() => {
                        const gradeRecord = this.gradesData.find(g => 
                            g.courseId === course.id && (
                                g.studentid === this.userData.id || 
                                g.studentId === this.userData.id ||
                                g.username === this.userData.username
                            )
                        );
                        return isCompleted ? 
                            `<button class="btn-success" onclick="studentDashboard.showCourseDetail('${course.id}')">📋 查看详情</button>
                             <button class="btn-secondary" onclick="studentDashboard.viewGradeDetail('${gradeRecord?.id}')">📊 查看成绩</button>` :
                            `<button class="btn-primary" onclick="studentDashboard.showCourseDetail('${course.id}')">进入学习</button>
                             <button class="btn-secondary" onclick="studentDashboard.viewAssignments('${course.id}')">查看作业</button>`;
                    })()}
                </div>
            `;

            myCoursesList.appendChild(myCourseCard);
        });
    }

    // 查看作业
    viewAssignments(courseId) {
        const course = this.coursesData.find(c => c.id === courseId);
        if (!course) return;

        // 切换到作业管理页面
        this.switchPage('assignments');
        
        // 设置选中的课程
        setTimeout(() => {
            const courseSelect = document.getElementById('assignmentCourseSelect');
            if (courseSelect) {
                courseSelect.value = courseId;
                this.loadCourseAssignments();
            }
        }, 100);
    }

    // 显示作业列表模态框
    showAssignmentsModal(course, assignments) {
        const modal = document.createElement('div');
        modal.className = 'assignments-modal-overlay';
        modal.innerHTML = `
            <div class="assignments-modal">
                <div class="assignments-header">
                    <h3>📚 ${course.courseName} - 作业列表</h3>
                    <button class="close-btn" onclick="this.closest('.assignments-modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="assignments-content">
                    <div class="assignments-list">
                        ${assignments.map(assignment => this.createAssignmentItem(assignment)).join('')}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // 创建作业项HTML
    createAssignmentItem(assignment) {
        const submissions = dataManager.getStudentSubmissions(this.userData.id, assignment.id);
        const submission = submissions.length > 0 ? submissions[0] : null;
        const isOverdue = new Date(assignment.endTime) < new Date();
        const hasSubmission = submissions.length > 0;
        const isSubmitted = hasSubmission;
        const isGraded = hasSubmission && submission && submission.status === 'graded';

        // 计算剩余时间
        const timeRemaining = this.getTimeRemaining(assignment.endTime);
        
        return `
            <div class="assignment-item ${isOverdue ? 'overdue' : ''} ${isSubmitted ? 'submitted' : ''}">
                <div class="assignment-main">
                    <div class="assignment-info">
                        <h4 class="assignment-title">
                            ${assignment.title}
                            ${isGraded ? '<span class="graded-badge">已批改</span>' : 
                              isSubmitted ? '<span class="submitted-badge">已提交</span>' : 
                              isOverdue ? '<span class="overdue-badge">已逾期</span>' : 
                              '<span class="pending-badge">待提交</span>'}
                        </h4>
                        <p class="assignment-description">${assignment.description}</p>
                        <div class="assignment-meta">
                            <span class="assignment-type">
                                <i class="fas fa-${assignment.type === 'exam' ? 'file-alt' : 'edit'}"></i>
                                ${assignment.type === 'exam' ? '考试' : '作业'}
                            </span>
                            <span class="assignment-score">
                                <i class="fas fa-star"></i>
                                ${assignment.maxScore}分
                            </span>
                            <span class="assignment-time ${isOverdue ? 'overdue' : ''}">
                                <i class="fas fa-clock"></i>
                                截止: ${new Date(assignment.endTime).toLocaleString()}
                            </span>
                        </div>
                    </div>
                    <div class="assignment-actions">
                        ${isGraded ? `
                            <button class="btn-sm btn-success" onclick="studentDashboard.viewGradeDetail('${submission.id}')">
                                <i class="fas fa-eye"></i> 查看成绩
                            </button>
                            <button class="btn-sm btn-secondary" onclick="studentDashboard.viewSubmission('${assignment.id}')">
                                <i class="fas fa-file-alt"></i> 查看提交
                            </button>
                        ` : isSubmitted ? `
                            <button class="btn-sm btn-secondary" onclick="studentDashboard.viewSubmission('${assignment.id}')">
                                <i class="fas fa-file-alt"></i> 查看提交
                            </button>
                        ` : isOverdue ? `
                            <button class="btn-sm btn-danger disabled">
                                <i class="fas fa-times-circle"></i> 已逾期
                            </button>
                        ` : `
                            <button class="btn-sm btn-primary" onclick="studentDashboard.submitAssignment('${assignment.id}')">
                                <i class="fas fa-upload"></i> 提交作业
                            </button>
                        `}
                    </div>
                </div>
                ${isGraded ? `
                    <div class="grade-summary">
                        <div class="grade-display">
                            <span class="score-value">${submission.score}</span>
                            <span class="score-total">/ ${assignment.maxScore}</span>
                        </div>
                        <div class="grade-feedback">
                            <strong>教师评语：</strong>
                            <p>${submission.feedback || '暂无评语'}</p>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // 计算剩余时间
    getTimeRemaining(endTime) {
        const now = new Date();
        const end = new Date(endTime);
        const diff = end - now;

        if (diff <= 0) return '已截止';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `剩余 ${days}天${hours}小时`;
        if (hours > 0) return `剩余 ${hours}小时${minutes}分钟`;
        return `剩余 ${minutes}分钟`;
    }

    // 提交作业
    submitAssignment(assignmentId, isResubmission = false) {
        const assignment = dataManager.getData('assignments').find(a => a.id === assignmentId);
        if (!assignment) return;

        this.showSubmissionModal(assignment, isResubmission);
    }

    // 显示提交作业模态框
    showSubmissionModal(assignment, isResubmission = false) {
        const modal = document.createElement('div');
        modal.className = 'submission-modal-overlay';
        modal.innerHTML = `
            <div class="submission-modal">
                <div class="submission-header">
                    <h3>📝 ${isResubmission ? '重新提交作业' : '提交作业'} - ${assignment.title}</h3>
                    <button class="close-btn" onclick="this.closest('.submission-modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="submission-content">
                    <div class="assignment-info">
                        <h4>${assignment.title}</h4>
                        <p>${assignment.description}</p>
                        <div class="submission-deadline">
                            <strong>截止时间：</strong>
                            <span class="deadline-time ${new Date(assignment.endTime) < new Date() ? 'overdue' : ''}">
                                ${new Date(assignment.endTime).toLocaleString()}
                            </span>
                        </div>
                        <div class="submission-score">
                            <strong>满分：</strong>${assignment.maxScore}分
                        </div>
                    </div>
                    
                    <form class="submission-form" id="submissionForm">
                        <div class="form-group">
                            <label for="submissionContent">作业内容</label>
                            <textarea id="submissionContent" 
                                      placeholder="请描述您的作业完成情况、主要思路等..." 
                                      rows="6" required></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label>附件文件（可选）</label>
                            <div class="file-upload-area" id="fileUploadArea">
                                <input type="file" id="fileInput" multiple accept=".pdf,.doc,.docx,.zip,.rar,.cpp,.c,.java,.py,.js" style="display: none;">
                                <div class="file-drop-zone">
                                    <i class="fas fa-cloud-upload-alt"></i>
                                    <p>拖拽文件到这里或点击选择文件</p>
                                    <small>支持 PDF, DOC, ZIP, RAR, 代码文件等（最多5个文件，单文件不超过10MB）</small>
                                </div>
                                <div class="file-list" id="fileList"></div>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn-secondary" onclick="this.closest('.submission-modal-overlay').remove()">
                                取消
                            </button>
                            <button type="submit" class="btn-primary">
                                <i class="fas fa-paper-plane"></i> 提交作业
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        this.setupFileUpload();
        this.setupSubmissionForm(assignment.id, isResubmission);
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // 设置文件上传
    setupFileUpload() {
        const fileInput = document.getElementById('fileInput');
        const fileDropZone = document.querySelector('.file-drop-zone');
        const fileList = document.getElementById('fileList');
        
        // 初始化当前作业文件数组
        this.currentAssignmentFiles = [];

        fileDropZone.addEventListener('click', () => fileInput.click());
        
        fileDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileDropZone.classList.add('dragover');
        });

        fileDropZone.addEventListener('dragleave', () => {
            fileDropZone.classList.remove('dragover');
        });

        fileDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            fileDropZone.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files, this.currentAssignmentFiles, fileList);
        });

        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files, this.currentAssignmentFiles, fileList);
        });
    }

    // 处理文件
    async handleFiles(files, uploadedFiles, fileList) {
        for (const file of Array.from(files)) {
            if (uploadedFiles.length >= 5) {
                showMessage('最多只能上传5个文件', 'warning');
                continue;
            }
            
            if (file.size > 10 * 1024 * 1024) { // 10MB
                showMessage(`文件 ${file.name} 超过10MB限制`, 'warning');
                continue;
            }
            
            // 生成临时路径并存储文件
            const tempPath = dataManager.generateTempPath(file.name);
            try {
                await dataManager.storeTempFile(file, tempPath);
                uploadedFiles.push({
                    file: file,
                    tempPath: tempPath
                });
            } catch (error) {
                console.error('文件存储失败:', error);
                showMessage(`文件 ${file.name} 存储失败`, 'error');
            }
        }
        
        this.updateFileList(uploadedFiles, fileList);
    }

    // 更新文件列表显示
    updateFileList(files, fileList) {
        fileList.innerHTML = files.map((fileItem, index) => {
            const file = fileItem.file || fileItem; // 兼容旧格式
            const tempPath = fileItem.tempPath;
            return `
                <div class="file-item">
                    <i class="fas fa-file"></i>
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${this.formatFileSize(file.size)}</span>
                    <button type="button" class="file-download" onclick="event.preventDefault(); dataManager.downloadTempFile('${tempPath}')" title="下载文件">
                        <i class="fas fa-download"></i>
                    </button>
                    <button type="button" class="file-remove" onclick="studentDashboard.removeAssignmentFile(${index})" title="移除文件">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        }).join('');
    }

    // 更新考试文件列表显示
    updateExamFileList(files, fileList) {
        fileList.innerHTML = files.map((fileItem, index) => {
            const file = fileItem.file || fileItem; // 兼容旧格式
            const tempPath = fileItem.tempPath;
            return `
                <div class="file-item">
                    <i class="fas fa-file"></i>
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${this.formatFileSize(file.size)}</span>
                    <button type="button" class="file-download" onclick="event.preventDefault(); dataManager.downloadTempFile('${tempPath}')" title="下载文件">
                        <i class="fas fa-download"></i>
                    </button>
                    <button type="button" class="file-remove" onclick="studentDashboard.removeExamFile(${index})" title="移除文件">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        }).join('');
    }

    // 下载文件
    downloadFile(submissionId, fileIndex, fileIdentifier, fileType) {
        // 阻止事件冒泡
        event.preventDefault();
        event.stopPropagation();
        
        const submissions = dataManager.getStudentSubmissions(this.userData.id);
        const submission = submissions.find(s => s.id === submissionId);
        
        if (!submission) {
            showMessage('找不到提交记录', 'error');
            return;
        }

        let file, fileName;
        
        if (fileType === 'string') {
            // 旧格式：简单文件名
            file = { name: fileIdentifier };
            fileName = fileIdentifier;
        } else {
            // 新格式：详细文件信息
            file = submission.files.find(f => f.localPath === fileIdentifier);
            fileName = file ? file.name : fileIdentifier;
        }

        if (!file) {
            showMessage('找不到文件信息', 'error');
            return;
        }

        try {
            // 生成模拟的文件内容
            const fileContent = this.generateMockFileContent(fileName, submission);

            // 创建下载链接
            const blob = new Blob([fileContent], { 
                type: this.getMimeType(fileName) 
            });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            
            // 清理
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);

            showMessage(`正在下载文件: ${fileName}`, 'success');
        } catch (error) {
            console.error('下载文件失败:', error);
            showMessage('下载文件失败，请重试', 'error');
        }
    }

    // 生成模拟文件内容
    generateMockFileContent(fileName, submission) {
        const fileExtension = fileName.split('.').pop().toLowerCase();
        const assignment = dataManager.getData('assignments').find(a => a.id === submission.assignmentId);
        
        let content = '';
        
        try {
            switch (fileExtension) {
                case 'txt':
                case 'md':
                    content = `# ${assignment?.title || '作业提交'}

**学生**: ${this.userData.name} (${this.userData.id})
**提交时间**: ${new Date(submission.submittedTime).toLocaleString()}
**作业内容**: ${submission.content || '无文字说明'}

---
这是由系统生成的模拟文件内容。
实际应用中，这里应该是用户上传的真实文件内容。
`;
                    break;
                    
                case 'cpp':
                case 'c':
                case 'java':
                case 'py':
                case 'js':
                    content = `// ${fileName}
// 作业: ${assignment?.title || '编程作业'}
// 学生: ${this.userData.name}
// 提交时间: ${new Date(submission.submittedTime).toLocaleString()}

#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    cout << "作业: ${assignment?.title || '编程作业'}" << endl;
    cout << "学生: ${this.userData.name}" << endl;
    cout << "提交时间: ${new Date(submission.submittedTime).toLocaleString()}" << endl;
    return 0;
}
`;
                    break;
                    
                case 'pdf':
                case 'doc':
                case 'docx':
                    content = `文件: ${fileName}
作业: ${assignment?.title || '文档作业'}
学生: ${this.userData.name}
提交时间: ${new Date(submission.submittedTime).toLocaleString()}
文件标识符: ${submission.files.find(f => f.name === fileName)?.localPath || 'N/A'}

注意：由于浏览器安全限制，无法访问真实的${fileExtension.toUpperCase()}文件内容。
这里是模拟的文件信息，包含基本元数据。

作业内容说明:
${submission.content || '无文字说明'}
`;
                    break;
                    
                case 'zip':
                case 'rar':
                    content = `压缩包: ${fileName}
作业: ${assignment?.title || '压缩文件作业'}
学生: ${this.userData.name}
提交时间: ${new Date(submission.submittedTime).toLocaleString()}

注意：由于浏览器安全限制，无法访问真实的压缩包内容。
这里是模拟的压缩包信息。

压缩包可能包含:
- 源代码文件
- 文档说明
- 测试用例
- 运行结果截图

作业内容说明:
${submission.content || '无文字说明'}
`;
                    break;
                    
                default:
                    content = `文件: ${fileName}
作业: ${assignment?.title || '未知作业'}
学生: ${this.userData.name}
提交时间: ${new Date(submission.submittedTime).toLocaleString()}
文件类型: ${fileExtension.toUpperCase()}
文件标识符: ${submission.files.find(f => f.name === fileName)?.localPath || 'N/A'}

注意：由于浏览器安全限制，无法访问真实的上传文件内容。
这里是模拟的文件信息。

作业内容说明:
${submission.content || '无文字说明'}
`;
            }
        } catch (error) {
            console.error('生成文件内容失败:', error);
            content = `文件: ${fileName}
生成内容时出错，请检查文件格式。
错误信息: ${error.message}`;
        }
        
        return content;
    }

    // 获取MIME类型
    getMimeType(fileName) {
        const extension = fileName.split('.').pop().toLowerCase();
        const mimeTypes = {
            'txt': 'text/plain',
            'md': 'text/markdown',
            'cpp': 'text/x-c++src',
            'c': 'text/x-csrc',
            'java': 'text/x-java-source',
            'py': 'text/x-python',
            'js': 'application/javascript',
            'html': 'text/html',
            'css': 'text/css',
            'json': 'application/json',
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'zip': 'application/zip',
            'rar': 'application/x-rar-compressed'
        };
        
        return mimeTypes[extension] || 'text/plain';
    }

    // HTML转义，防止XSS攻击
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 移除作业文件
    removeAssignmentFile(index) {
        const fileList = document.getElementById('fileList');
        
        // 获取当前文件列表（这里需要从全局或DOM中获取）
        if (!this.currentAssignmentFiles) {
            this.currentAssignmentFiles = [];
        }
        
        const removedFile = this.currentAssignmentFiles[index];
        
        // 删除临时文件
        if (removedFile && removedFile.tempPath) {
            dataManager.removeTempFile(removedFile.tempPath);
        }
        
        // 从数组中移除
        this.currentAssignmentFiles.splice(index, 1);
        
        // 更新显示
        this.updateFileList(this.currentAssignmentFiles, fileList);
    }

    // 移除考试文件
    removeExamFile(index) {
        const fileList = document.getElementById('examFileList');
        
        // 获取当前文件列表
        if (!this.currentExamFiles) {
            this.currentExamFiles = [];
        }
        
        const removedFile = this.currentExamFiles[index];
        
        // 删除临时文件
        if (removedFile && removedFile.tempPath) {
            dataManager.removeTempFile(removedFile.tempPath);
        }
        
        // 从数组中移除
        this.currentExamFiles.splice(index, 1);
        
        // 更新显示
        this.updateExamFileList(this.currentExamFiles, fileList);
    }

    // 移除文件（保持向后兼容）
    removeFile(index) {
        this.removeAssignmentFile(index);
    }

    // 设置提交表单
    setupSubmissionForm(assignmentId, isResubmission = false) {
        const form = document.getElementById('submissionForm');
        
        // 如果是重新提交，加载之前的提交内容
        if (isResubmission) {
            this.loadPreviousAssignmentSubmission(assignmentId);
        }
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const content = document.getElementById('submissionContent').value.trim();
            
            if (!content && this.currentAssignmentFiles.length === 0) {
                showMessage('请填写作业内容或上传文件', 'warning');
                return;
            }
            
            // 使用临时文件数组而不是input.files
            const files = this.currentAssignmentFiles;
            
            this.processSubmission(assignmentId, content, files, isResubmission);
        });
    }

    // 加载之前的作业提交内容
    loadPreviousAssignmentSubmission(assignmentId) {
        const submissions = dataManager.getStudentSubmissions(this.userData.id, assignmentId);
        if (submissions.length > 0) {
            const submission = submissions[0];
            
            // 加载文本内容
            const contentTextarea = document.getElementById('submissionContent');
            if (contentTextarea && submission.content) {
                contentTextarea.value = submission.content;
            }
            
            // 加载文件
            if (submission.files && submission.files.length > 0) {
                this.currentAssignmentFiles = [];
                const fileList = document.getElementById('fileList');
                
                submission.files.forEach(fileInfo => {
                    // 为重新提交创建文件对象，但保持原有的临时路径
                    const fileItem = {
                        tempPath: fileInfo.tempPath,
                        file: {
                            name: fileInfo.originalName,
                            size: fileInfo.size
                        }
                    };
                    this.currentAssignmentFiles.push(fileItem);
                });
                
                // 更新文件列表显示
                this.updateFileList(this.currentAssignmentFiles, fileList);
            }
        }
    }

    // 处理作业提交
    async processSubmission(assignmentId, content, files, isResubmission = false) {
        const assignment = dataManager.getData('assignments').find(a => a.id === assignmentId);
        
        if (new Date(assignment.endTime) < new Date()) {
            showMessage('作业已截止，无法提交', 'error');
            return;
        }

        // 如果是重新提交，先删除旧的提交记录
        if (isResubmission) {
            const data = dataManager.getData();
            const submissionIndex = data.submissions.findIndex(s => 
                s.assignmentId === assignmentId && s.studentId === this.userData.id
            );
            
            if (submissionIndex !== -1) {
                data.submissions.splice(submissionIndex, 1);
            }
        }

        // 处理文件：将文件保存为临时路径
        const fileTempPaths = [];
        const fileInfos = [];
        
        for (const fileItem of files) {
            if (fileItem.tempPath) {
                // 已经是临时路径格式
                fileTempPaths.push(fileItem.tempPath);
                fileInfos.push({
                    tempPath: fileItem.tempPath,
                    originalName: fileItem.file.name,
                    size: fileItem.file.size
                });
            } else {
                // 兼容旧格式，转换为临时路径
                const tempPath = dataManager.generateTempPath(file.name);
                try {
                    await dataManager.storeTempFile(file, tempPath);
                    fileTempPaths.push(tempPath);
                    fileInfos.push({
                        tempPath: tempPath,
                        originalName: file.name,
                        size: file.size
                    });
                } catch (error) {
                    console.error('文件存储失败:', error);
                    showMessage(`文件 ${file.name} 存储失败`, 'error');
                    return;
                }
            }
        }

        // 创建提交记录
        const submission = {
            id: dataManager.generateId(),
            assignmentId: assignmentId,
            studentId: this.userData.id,
            submittedTime: new Date().toISOString(),
            content: content,
            files: fileInfos, // 使用包含临时路径的文件信息
            status: 'pending',
            score: null,
            feedback: null,
            gradedTime: null
        };

        // 保存到数据管理器
        const data = dataManager.getData();
        if (!data.submissions) {
            data.submissions = [];
        }
        data.submissions.push(submission);
        dataManager.saveData();

        // 关闭模态框
        document.querySelector('.submission-modal-overlay')?.remove();
        
        // 刷新界面
        this.renderMyCourses();
        
        // 如果当前在作业页面，也刷新作业页面
        if (this.currentPage === 'assignments') {
            this.renderAssignmentsPage();
        }
        
        const successMessage = isResubmission ? 
            `✅ 作业"${assignment.title}"重新提交成功！` : 
            `✅ 作业"${assignment.title}"提交成功！`;
        showMessage(successMessage, 'success');
        
        // 记录日志
        dataManager.addLog(this.userData.id, 'assignment_submit', 
            `学生 ${this.userData.name} 提交了作业 ${assignment.title}`);
    }

    // 查看作业详情（包括未提交的情况）
    viewAssignmentDetail(assignmentId) {
        const assignments = dataManager.getData('assignments');
        const item = assignments.find(item => item.id === assignmentId);
        
        if (!item) {
            showMessage('未找到对应的作业或考试', 'error');
            return;
        }

        // 获取提交记录（可能没有）
        const submissions = dataManager.getStudentSubmissions(this.userData.id, assignmentId);
        const submission = submissions.length > 0 ? submissions[0] : null;
        
        this.showAssignmentDetailModal(item, submission);
    }

    // 查看提交详情
    viewSubmission(assignmentId) {
        const submissions = dataManager.getStudentSubmissions(this.userData.id, assignmentId);
        if (submissions.length === 0) {
            showMessage('未找到提交记录', 'error');
            return;
        }

        const submission = submissions[0];
        
        // 根据提交类型查找对应的作业或考试
        // 注意：考试和作业都存储在assignments数组中，通过type字段区分
        const assignments = dataManager.getData('assignments');
        const item = assignments.find(item => item.id === assignmentId);
        
        if (!item) {
            showMessage('未找到对应的作业或考试', 'error');
            return;
        }
        
        this.showSubmissionDetailModal(submission, item);
    }

    // 显示作业详情模态框（包括未提交的情况）
    showAssignmentDetailModal(item, submission) {
        const isExam = item.type === 'exam';
        const hasSubmission = submission !== null;
        
        const modal = document.createElement('div');
        modal.className = 'submission-detail-modal-overlay';
        modal.innerHTML = `
            <div class="submission-detail-modal">
                <div class="detail-header">
                    <h3>📄 ${isExam ? '考试' : '作业'}详情 - ${item.title}</h3>
                    <button class="close-btn" onclick="this.closest('.submission-detail-modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="detail-content">
                    <div class="submission-info">
                        <div class="info-row">
                            <label>${isExam ? '考试' : '作业'}类型：</label>
                            <span>${isExam ? '考试' : '作业'}</span>
                        </div>
                        <div class="info-row">
                            <label>发布时间：</label>
                            <span>${new Date(item.createdTime).toLocaleString()}</span>
                        </div>
                        <div class="info-row">
                            <label>截止时间：</label>
                            <span>${new Date(item.endTime).toLocaleString()}</span>
                        </div>
                        ${isExam ? `
                            <div class="info-row">
                                <label>考试时长：</label>
                                <span>${item.duration || 120}分钟</span>
                            </div>
                        ` : ''}
                        <div class="info-row">
                            <label>满分：</label>
                            <span>${item.maxScore}分</span>
                        </div>
                        <div class="info-row">
                            <label>提交状态：</label>
                            <span class="status-badge ${hasSubmission ? submission.status : 'pending'}">
                                ${hasSubmission ? this.getStatusText(submission.status) : '未提交'}
                            </span>
                        </div>
                        ${hasSubmission ? `
                            <div class="info-row">
                                <label>提交时间：</label>
                                <span>${new Date(submission.submittedTime).toLocaleString()}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    ${item.files && item.files.length > 0 ? `
                        <div class="submission-files-section">
                            <h4>教师附件</h4>
                            <div class="files-list">
                                ${item.files.map(file => `
                                    <div class="file-item downloadable">
                                        <i class="fas fa-paperclip"></i>
                                        <span class="file-name" title="${this.escapeHtml(file.name)}">${this.escapeHtml(file.name)}</span>
                                        <span class="file-size">${file.size ? this.formatFileSize(file.size) : '未知大小'}</span>
                                        <button class="file-download-btn" onclick="event.preventDefault(); studentDashboard.downloadTeacherAttachment('${this.escapeHtml(file.tempPath)}', '${this.escapeHtml(file.name)}')" title="下载教师附件">
                                            <i class="fas fa-download"></i>
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="submission-content-section">
                        <h4>${isExam ? '考试说明' : '作业要求'}</h4>
                        <div class="content-display">
                            ${item.description || '无说明内容'}
                        </div>
                    </div>
                    
                    ${hasSubmission ? `
                        <div class="submission-content-section">
                            <h4>我的提交内容</h4>
                            <div class="content-display">
                                ${submission.content || '无文字内容'}
                            </div>
                        </div>
                        
                        ${submission.files && submission.files.length > 0 ? `
                            <div class="submission-files-section">
                                <h4>我的附件</h4>
                                <div class="files-list">
                                    ${submission.files.map(file => {
                                        const fileName = file && (file.originalName || file.name) ? file.originalName || file.name : (typeof file === 'string' ? file : '未知文件');
                                        
                                        if (file && file.tempPath) {
                                            return `
                                                <div class="file-item downloadable">
                                                    <i class="fas fa-file"></i>
                                                    <span class="file-name" title="${this.escapeHtml(fileName)}">${this.escapeHtml(fileName)}</span>
                                                    <span class="file-size">${file.size ? this.formatFileSize(file.size) : '未知大小'}</span>
                                                    <button class="file-download-btn" onclick="event.preventDefault(); dataManager.downloadTempFile('${this.escapeHtml(file.tempPath)}')" title="下载 ${this.escapeHtml(fileName)}">
                                                        <i class="fas fa-download"></i>
                                                    </button>
                                                </div>
                                            `;
                                        } else if (typeof file === 'string') {
                                            return `
                                                <div class="file-item downloadable">
                                                    <i class="fas fa-file"></i>
                                                    <span class="file-name" title="${this.escapeHtml(file)}">${this.escapeHtml(file)}</span>
                                                    <span class="file-size">未知大小</span>
                                                    <button class="file-download-btn" onclick="studentDashboard.downloadSubmissionFile('${this.escapeHtml(file)}', '${this.escapeHtml(file)}', 'string')" title="下载 ${this.escapeHtml(file)}">
                                                        <i class="fas fa-download"></i>
                                                    </button>
                                                </div>
                                            `;
                                        } else {
                                            return `
                                                <div class="file-item downloadable">
                                                    <i class="fas fa-file"></i>
                                                    <span class="file-name" title="${this.escapeHtml(fileName)}">${this.escapeHtml(fileName)}</span>
                                                    <span class="file-size">${file.size ? this.formatFileSize(file.size) : '未知大小'}</span>
                                                    <span class="file-status">已上传</span>
                                                </div>
                                            `;
                                        }
                                    }).join('')}
                                </div>
                            </div>
                        ` : ''}
                    ` : ''}
                    
                    <div class="detail-actions">
                        <button class="btn-secondary" onclick="this.closest('.submission-detail-modal-overlay').remove()">
                            关闭
                        </button>
                        ${!hasSubmission ? `
                            <button class="btn-primary" onclick="this.closest('.submission-detail-modal-overlay').remove(); studentDashboard.${isExam ? 'startExam' : 'submitAssignment'}('${item.id}')">
                                <i class="fas fa-${isExam ? 'play' : 'edit'}"></i> ${isExam ? '开始考试' : '开始提交'}
                            </button>
                        ` : submission.status === 'pending' ? `
                            <button class="btn-primary" onclick="this.closest('.submission-detail-modal-overlay').remove(); studentDashboard.${isExam ? 'resubmitExam' : 'resubmitAssignment'}('${item.id}')">
                                <i class="fas fa-redo"></i> 重新提交
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // 显示提交详情模态框
    showSubmissionDetailModal(submission, item) {
        const isExam = item.type === 'exam';
        const modal = document.createElement('div');
        modal.className = 'submission-detail-modal-overlay';
        modal.innerHTML = `
            <div class="submission-detail-modal">
                <div class="detail-header">
                    <h3>📄 提交详情 - ${item.title}</h3>
                    <button class="close-btn" onclick="this.closest('.submission-detail-modal-overlay').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="detail-content">
                    <div class="submission-info">
                        <div class="info-row">
                            <label>提交时间：</label>
                            <span>${new Date(submission.submittedTime).toLocaleString()}</span>
                        </div>
                        <div class="info-row">
                            <label>${isExam ? '考试状态' : '作业状态'}：</label>
                            <span class="status-badge ${submission.status}">
                                ${this.getStatusText(submission.status)}
                            </span>
                        </div>
                        ${isExam ? `
                            <div class="info-row">
                                <label>考试时长：</label>
                                <span>${item.duration || 120}分钟</span>
                            </div>
                            ${submission.examEndTime ? `
                                <div class="info-row">
                                    <label>实际用时：</label>
                                    <span>${this.calculateExamTimeUsed(submission.examStartTime, submission.examEndTime)}分钟</span>
                                </div>
                            ` : ''}
                        ` : ''}
                        ${submission.score !== null ? `
                            <div class="info-row">
                                <label>得分：</label>
                                <span class="score-display">${submission.score} / ${item.maxScore}</span>
                            </div>
                        ` : ''}
                        ${submission.feedback ? `
                            <div class="info-row">
                                <label>教师评语：</label>
                                <div class="feedback-content">${submission.feedback}</div>
                            </div>
                        ` : ''}
                    </div>
                    
                    ${item.files && item.files.length > 0 ? `
                        <div class="submission-files-section">
                            <h4>教师附件</h4>
                            <div class="files-list">
                                ${item.files.map(file => `
                                    <div class="file-item downloadable">
                                        <i class="fas fa-paperclip"></i>
                                        <span class="file-name" title="${this.escapeHtml(file.name)}">${this.escapeHtml(file.name)}</span>
                                        <span class="file-size">${file.size ? this.formatFileSize(file.size) : '未知大小'}</span>
                                        <button class="file-download-btn" onclick="event.preventDefault(); studentDashboard.downloadTeacherAttachment('${this.escapeHtml(file.tempPath)}', '${this.escapeHtml(file.name)}')" title="下载教师附件">
                                            <i class="fas fa-download"></i>
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="submission-content-section">
                        <h4>${isExam ? '考试内容' : '作业内容'}</h4>
                        <div class="content-display">
                            ${submission.content || '无文字内容'}
                        </div>
                    </div>
                    
                    ${submission.files && submission.files.length > 0 ? `
                        <div class="submission-files-section">
                            <h4>附件文件</h4>
                            <div class="files-list">
                                ${submission.files.map(file => {
                                    // 统一文件处理逻辑，参考教师端方式
                                    const fileName = file && (file.originalName || file.name) ? file.originalName || file.name : (typeof file === 'string' ? file : '未知文件');
                                    
                                    if (file && file.tempPath) {
                                        // 有临时路径的文件 - 直接使用临时文件系统下载
                                        return `
                                            <div class="file-item downloadable">
                                                <i class="fas fa-file"></i>
                                                <span class="file-name" title="${this.escapeHtml(fileName)}">${this.escapeHtml(fileName)}</span>
                                                <span class="file-size">${file.size ? this.formatFileSize(file.size) : '未知大小'}</span>
                                                <button class="file-download-btn" onclick="event.preventDefault(); dataManager.downloadTempFile('${this.escapeHtml(file.tempPath)}')" title="下载 ${this.escapeHtml(fileName)}">
                                                    <i class="fas fa-download"></i>
                                                </button>
                                            </div>
                                        `;
                                    } else if (typeof file === 'string') {
                                        // 旧格式字符串 - 生成模拟内容下载
                                        return `
                                            <div class="file-item downloadable">
                                                <i class="fas fa-file"></i>
                                                <span class="file-name" title="${this.escapeHtml(file)}">${this.escapeHtml(file)}</span>
                                                <span class="file-size">未知大小</span>
                                                <button class="file-download-btn" onclick="studentDashboard.downloadSubmissionFile('${this.escapeHtml(file)}', '${this.escapeHtml(file)}', 'string')" title="下载 ${this.escapeHtml(file)}">
                                                    <i class="fas fa-download"></i>
                                                </button>
                                            </div>
                                        `;
                                    } else {
                                        // 其他格式的文件对象
                                        const fileName = file.name || '未知文件';
                                        return `
                                            <div class="file-item downloadable">
                                                <i class="fas fa-file"></i>
                                                <span class="file-name" title="${this.escapeHtml(fileName)}">${this.escapeHtml(fileName)}</span>
                                                <span class="file-size">${file.size ? this.formatFileSize(file.size) : '未知大小'}</span>
                                                <span class="file-status">已上传</span>
                                            </div>
                                        `;
                                    }
                                }).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="detail-actions">
                        <button class="btn-secondary" onclick="this.closest('.submission-detail-modal-overlay').remove()">
                            关闭
                        </button>
                        ${submission.status === 'pending' ? `
                            <button class="btn-primary" onclick="studentDashboard.${isExam ? 'resubmitExam' : 'resubmitAssignment'}('${item.id}')">
                                <i class="fas fa-redo"></i> 重新提交
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // 获取状态文本
    getStatusText(status) {
        const statusMap = {
            'pending': '待批改',
            'graded': '已批改',
            'rejected': '已拒绝'
        };
        return statusMap[status] || status;
    }

    // 重新提交作业
    resubmitAssignment(assignmentId) {
        if (confirm('确定要重新提交作业吗？这将覆盖之前的提交记录。')) {
            // 关闭详情模态框
            document.querySelector('.submission-detail-modal-overlay')?.remove();
            
            // 打开提交模态框，标记为重新提交
            this.submitAssignment(assignmentId, true);
        }
    }

    // 开始考试
    startExam(examId, isResubmission = false) {
        const exam = dataManager.getData('assignments').find(a => a.id === examId);
        if (!exam) return;

        // 检查是否在考试时间内
        const now = new Date();
        const startTime = new Date(exam.startTime || exam.endTime);
        const endTime = new Date(exam.endTime);

        if (now > endTime) {
            showMessage('考试已结束，无法开始', 'error');
            return;
        }

        this.showExamModal(exam, isResubmission);
    }

    // 重新提交考试
    resubmitExam(examId) {
        if (confirm('确定要重新提交考试吗？这将覆盖之前的提交记录。')) {
            // 关闭详情模态框
            document.querySelector('.submission-detail-modal-overlay')?.remove();
            
            // 打开考试模态框，标记为重新提交
            this.startExam(examId, true);
        }
    }

    // 显示考试模态框
    showExamModal(exam, isResubmission = false) {
        const modal = document.createElement('div');
        modal.className = 'exam-modal-overlay';
        modal.innerHTML = `
            <div class="exam-modal">
                <div class="exam-header">
                    <h3>📝 ${isResubmission ? '重新参加考试' : '参加考试'} - ${exam.title}</h3>
                    <button class="close-btn" onclick="studentDashboard.closeExamModal('${exam.id}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="exam-content">
                    <div class="exam-info">
                        <h4>${exam.title}</h4>
                        <p>${exam.description}</p>
                        <div class="exam-details">
                            <div class="exam-time">
                                <strong>考试时长：</strong>
                                <span class="duration">${exam.duration || 120}分钟</span>
                            </div>
                            <div class="exam-deadline">
                                <strong>截止时间：</strong>
                                <span class="deadline-time ${new Date(exam.endTime) < new Date() ? 'overdue' : ''}">
                                    ${new Date(exam.endTime).toLocaleString()}
                                </span>
                            </div>
                            <div class="exam-score">
                                <strong>满分：</strong>${exam.maxScore}分
                            </div>
                        </div>
                        
                        ${exam.files && exam.files.length > 0 ? `
                            <div class="exam-attachments">
                                <h5><i class="fas fa-paperclip"></i> 教师附件</h5>
                                <div class="exam-attachment-list">
                                    ${exam.files.map(file => `
                                        <div class="exam-attachment-item">
                                            <div class="attachment-info">
                                                <i class="fas fa-file-${this.getFileIcon(file.name.split('.').pop())}"></i>
                                                <div>
                                                    <h6>${this.escapeHtml(file.name)}</h6>
                                                    <p>文件类型: <span class="file-type-badge">${file.name.split('.').pop().toUpperCase()}</span> | 文件大小: <span class="file-size-badge ${this.getFileSizeClass(file.size || 0)}">${this.formatFileSize(file.size || 0)}</span> | 上传时间: ${new Date(file.uploadTime || Date.now()).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div class="attachment-actions">
                                                <button class="btn-sm btn-primary" onclick="studentDashboard.downloadExamAttachment('${this.escapeHtml(file.tempPath || file.blobUrl)}', '${this.escapeHtml(file.name)}')">
                                                    <i class="fas fa-download"></i> 下载
                                                </button>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="exam-timer" id="examTimer">
                        <div class="timer-display">
                            <i class="fas fa-clock"></i>
                            <span id="timerText">准备就绪</span>
                        </div>
                        <div class="timer-progress">
                            <div class="progress-bar" id="timerProgress"></div>
                        </div>
                    </div>
                    
                    <form class="exam-form" id="examForm">
                        <div class="form-group">
                            <label for="examContent">考试答案</label>
                            <textarea id="examContent" 
                                      placeholder="请在此输入您的考试答案..." 
                                      rows="12" required></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label>附件文件（可选）</label>
                            <div class="file-upload-area" id="examFileUploadArea">
                                <input type="file" id="examFileInput" multiple accept=".pdf,.doc,.docx,.zip,.rar,.cpp,.c,.java,.py,.js,.txt" style="display: none;">
                                <div class="file-drop-zone">
                                    <i class="fas fa-cloud-upload-alt"></i>
                                    <p>拖拽文件到这里或点击选择文件</p>
                                    <small>支持 PDF, DOC, ZIP, 代码文件等（最多5个文件，单文件不超过10MB）</small>
                                </div>
                                <div class="file-list" id="examFileList"></div>
                            </div>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn-secondary" onclick="studentDashboard.closeExamModal('${exam.id}')">
                                取消
                            </button>
                            <button type="submit" class="btn-primary" id="submitExamBtn">
                                <i class="fas fa-paper-plane"></i> 提交考试
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        this.setupExamFileUpload();
        this.setupExamForm(exam.id, isResubmission);
        this.startExamTimer(exam.duration || 120, exam.id);
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeExamModal(exam.id);
            }
        });
    }

    // 关闭考试模态框
    closeExamModal(examId) {
        const modal = document.querySelector('.exam-modal-overlay');
        if (modal) {
            // 停止计时器
            if (this.examTimer) {
                clearInterval(this.examTimer);
                this.examTimer = null;
            }
            modal.remove();
        }
    }

    // 设置考试文件上传
    setupExamFileUpload() {
        const fileInput = document.getElementById('examFileInput');
        const fileDropZone = document.querySelector('#examFileUploadArea .file-drop-zone');
        const fileList = document.getElementById('examFileList');
        
        // 初始化当前考试文件数组
        this.currentExamFiles = [];

        fileDropZone.addEventListener('click', () => fileInput.click());
        
        fileDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileDropZone.classList.add('dragover');
        });

        fileDropZone.addEventListener('dragleave', () => {
            fileDropZone.classList.remove('dragover');
        });

        fileDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            fileDropZone.classList.remove('dragover');
            this.handleExamFiles(e.dataTransfer.files, this.currentExamFiles, fileList);
        });

        fileInput.addEventListener('change', (e) => {
            this.handleExamFiles(e.target.files, this.currentExamFiles, fileList);
        });
    }

    // 处理考试文件
    async handleExamFiles(files, uploadedFiles, fileList) {
        for (const file of Array.from(files)) {
            if (uploadedFiles.length >= 5) {
                showMessage('最多只能上传5个文件', 'warning');
                continue;
            }
            
            if (file.size > 10 * 1024 * 1024) { // 10MB
                showMessage(`文件 ${file.name} 超过10MB限制`, 'warning');
                continue;
            }
            
            // 生成临时路径并存储文件
            const tempPath = dataManager.generateTempPath(file.name);
            try {
                await dataManager.storeTempFile(file, tempPath);
                uploadedFiles.push({
                    file: file,
                    tempPath: tempPath
                });
            } catch (error) {
                console.error('文件存储失败:', error);
                showMessage(`文件 ${file.name} 存储失败`, 'error');
            }
        }
        
        this.updateExamFileList(uploadedFiles, fileList);
    }



    // 移除考试文件
    removeExamFile(index) {
        const fileInput = document.getElementById('examFileInput');
        const fileList = document.getElementById('examFileList');
        
        // 获取当前文件列表（这里需要从全局或DOM中获取）
        if (!this.currentExamFiles) {
            this.currentExamFiles = [];
        }
        
        const removedFile = this.currentExamFiles[index];
        
        // 删除临时文件
        if (removedFile && removedFile.tempPath) {
            dataManager.removeTempFile(removedFile.tempPath);
        }
        
        // 从数组中移除
        this.currentExamFiles.splice(index, 1);
        
        // 更新显示
        this.updateExamFileList(this.currentExamFiles, fileList);
    }

    // 下载临时文件
    downloadTempFile(tempPath) {
        dataManager.downloadTempFile(tempPath);
    }

    // 下载教师附件
    downloadTeacherAttachment(tempPath, fileName) {
        try {
            console.log('下载教师附件:', tempPath, fileName);
            
            // 直接调用dataManager下载教师附件，与教师端保持一致
            dataManager.downloadTempFile(tempPath);
            
            showMessage(`正在下载教师附件: ${fileName}`, 'info');
            
            // 记录下载日志
            dataManager.addLog(this.userData.id, 'download_teacher_attachment', `下载教师附件: ${fileName}`);
            
        } catch (error) {
            console.error('下载教师附件失败:', error);
            showMessage(`下载教师附件失败: ${fileName}`, 'error');
        }
    }

    // 下载提交的文件（参照教师端逻辑）
    downloadSubmissionFile(fileIdentifier, originalName, fileType) {
        try {
            console.log('下载文件参数:', {
                fileIdentifier: fileIdentifier,
                originalName: originalName,
                fileType: fileType,
                userData: this.userData?.id
            });
            
            if (fileType === 'temp') {
                // 新格式：有临时路径的文件
                console.log('使用临时文件下载:', fileIdentifier);
                const tempFile = dataManager.tempFiles.get(fileIdentifier);
                console.log('临时文件数据:', tempFile);
                
                if (tempFile) {
                    dataManager.downloadTempFile(fileIdentifier);
                    showMessage(`正在下载文件: ${originalName}`, 'info');
                } else {
                    console.error('临时文件不存在:', fileIdentifier);
                    showMessage('文件不存在或已过期', 'error');
                }
            } else if (fileType === 'string') {
                // 旧格式：简单文件名，生成模拟内容下载
                console.log('使用模拟文件下载:', originalName);
                const submissions = dataManager.getStudentSubmissions(this.userData.id);
                console.log('用户所有提交:', submissions);
                
                const submission = submissions.find(s => {
                    console.log('检查提交:', s.id, s.files);
                    return s.files && (s.files.includes(originalName) || 
                           (Array.isArray(s.files) && s.files.some(f => 
                               typeof f === 'string' ? f === originalName : f.name === originalName)));
                });
                
                console.log('找到匹配的提交:', submission);
                
                if (submission) {
                    const fileContent = this.generateMockFileContent(originalName, submission);
                    console.log('生成的文件内容长度:', fileContent.length);
                    
                    const blob = new Blob([fileContent], { 
                        type: this.getMimeType(originalName) 
                    });
                    const url = URL.createObjectURL(blob);
                    
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = originalName;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    
                    setTimeout(() => {
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                    }, 100);
                    
                    showMessage(`正在下载文件: ${originalName}`, 'success');
                } else {
                    console.error('找不到文件信息:', originalName);
                    showMessage('找不到文件信息', 'error');
                }
            } else {
                console.error('不支持的文件类型:', fileType);
                showMessage('不支持的文件类型', 'error');
            }
            
            // 记录下载日志
            if (this.userData && this.userData.id) {
                dataManager.addLog(this.userData.id, 'download_submission_file', `下载文件: ${originalName}`);
            }
            
        } catch (error) {
            console.error('下载文件失败:', error);
            showMessage(`下载文件失败: ${originalName}`, 'error');
        }
    }

    // 计算考试用时
    calculateExamTimeUsed(startTime, endTime) {
        if (!startTime || !endTime) {
            return '未知';
        }
        
        const start = new Date(startTime);
        const end = new Date(endTime);
        const timeUsedMs = end - start;
        const timeUsedMinutes = Math.round(timeUsedMs / (1000 * 60));
        
        return timeUsedMinutes;
    }

    // 显示临时文件状态信息（调试用）
    showTempFilesStatus() {
        const tempFiles = dataManager.tempFiles;
        const fileCount = tempFiles.size;
        const fileDetails = [];
        
        tempFiles.forEach((fileData, tempPath) => {
            const uploadTime = fileData.uploadTime ? new Date(fileData.uploadTime) : null;
            const age = uploadTime ? Math.round((new Date() - uploadTime) / (1000 * 60 * 60)) : '未知';
            
            fileDetails.push({
                name: fileData.name,
                path: tempPath,
                uploadTime: uploadTime?.toLocaleString() || '未知',
                ageHours: age
            });
        });
        
        console.group('📁 临时文件状态信息');
        console.log(`总文件数: ${fileCount}`);
        if (fileCount > 0) {
            console.table(fileDetails);
            console.log('提示: 临时文件默认7天后自动清理');
        }
        console.groupEnd();
        
        return { fileCount, fileDetails };
    }

    // 创建文件内容（示例实现）
    createFileContent(fileName, submission) {
        // 根据文件类型创建不同的示例内容
        const extension = fileName.split('.').pop().toLowerCase();
        let content = '';
        
        switch(extension) {
            case 'txt':
            case 'md':
                content = `文件名: ${fileName}\n提交时间: ${new Date(submission.submittedTime).toLocaleString()}\n学生ID: ${submission.studentId}\n\n${submission.content || '无内容描述'}`;
                break;
            case 'pdf':
            case 'doc':
            case 'docx':
                // 对于二进制文件，创建一个简单的文本表示
                content = `这是一个模拟的${extension.toUpperCase()}文件\n原始文件名: ${fileName}\n提交时间: ${new Date(submission.submittedTime).toLocaleString()}\n学生ID: ${submission.studentId}\n\n注意: 由于浏览器限制，这里显示的是文件信息而非原始二进制内容`;
                break;
            default:
                content = `文件信息:\n文件名: ${fileName}\n提交时间: ${new Date(submission.submittedTime).toLocaleString()}\n学生ID: ${submission.studentId}\n内容描述: ${submission.content || '无'}`;
        }
        
        return 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
    }

    // 设置考试表单
    setupExamForm(examId, isResubmission = false) {
        const form = document.getElementById('examForm');
        
        // 如果是重新提交，加载之前的提交内容
        if (isResubmission) {
            this.loadPreviousExamSubmission(examId);
        }
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const content = document.getElementById('examContent').value.trim();
            
            if (!content && this.currentExamFiles.length === 0) {
                showMessage('请填写考试答案或上传文件', 'warning');
                return;
            }
            
            // 使用临时文件数组而不是input.files
            const files = this.currentExamFiles;
            
            this.processExamSubmission(examId, content, files, isResubmission);
        });
    }

    // 加载之前的考试提交内容
    loadPreviousExamSubmission(examId) {
        const submissions = dataManager.getStudentSubmissions(this.userData.id, examId);
        if (submissions.length > 0) {
            const submission = submissions[0];
            
            // 加载文本内容
            const contentTextarea = document.getElementById('examContent');
            if (contentTextarea && submission.content) {
                contentTextarea.value = submission.content;
            }
            
            // 加载文件
            if (submission.files && submission.files.length > 0) {
                this.currentExamFiles = [];
                const fileList = document.getElementById('examFileList');
                
                submission.files.forEach(fileInfo => {
                    // 为重新提交创建文件对象，但保持原有的临时路径
                    const fileItem = {
                        tempPath: fileInfo.tempPath,
                        file: {
                            name: fileInfo.originalName,
                            size: fileInfo.size
                        }
                    };
                    this.currentExamFiles.push(fileItem);
                });
                
                // 更新文件列表显示
                this.updateExamFileList(this.currentExamFiles, fileList);
            }
        }
    }

    // 开始考试计时器
    startExamTimer(durationMinutes, examId) {
        let totalSeconds = durationMinutes * 60;
        this.examStartTime = new Date();
        
        const timerElement = document.getElementById('timerText');
        const progressElement = document.getElementById('timerProgress');
        
        this.examTimer = setInterval(() => {
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            
            const timeString = hours > 0 ? 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}` :
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            timerElement.textContent = timeString;
            
            // 更新进度条
            const progress = ((durationMinutes * 60 - totalSeconds) / (durationMinutes * 60)) * 100;
            progressElement.style.width = `${progress}%`;
            
            // 时间警告
            if (totalSeconds === 300) { // 最后5分钟
                timerElement.classList.add('warning');
                showMessage('⚠️ 考试还剩5分钟，请及时提交！', 'warning');
            }
            
            if (totalSeconds === 60) { // 最后1分钟
                timerElement.classList.add('danger');
                showMessage('⚠️ 考试还剩1分钟！', 'error');
            }
            
            if (totalSeconds <= 0) {
                clearInterval(this.examTimer);
                this.examTimer = null;
                this.autoSubmitExam(examId);
                return;
            }
            
            totalSeconds--;
        }, 1000);
    }

    // 自动提交考试
    autoSubmitExam(examId) {
        const content = document.getElementById('examContent')?.value.trim() || '时间到，自动提交';
        const fileInput = document.getElementById('examFileInput');
        const files = fileInput ? Array.from(fileInput.files) : [];
        
        this.processExamSubmission(examId, content, files, false);
        showMessage('⏰ 考试时间到，已自动提交', 'info');
    }

    // 处理考试提交
    async processExamSubmission(examId, content, files, isResubmission = false) {
        const exam = dataManager.getData('assignments').find(a => a.id === examId);
        
        if (new Date(exam.endTime) < new Date() && !isResubmission) {
            showMessage('考试已结束，无法提交', 'error');
            return;
        }

        // 停止计时器
        if (this.examTimer) {
            clearInterval(this.examTimer);
            this.examTimer = null;
        }

        // 如果是重新提交，先删除旧的提交记录
        if (isResubmission) {
            const data = dataManager.getData();
            const submissionIndex = data.submissions.findIndex(s => 
                s.assignmentId === examId && s.studentId === this.userData.id
            );
            
            if (submissionIndex !== -1) {
                data.submissions.splice(submissionIndex, 1);
            }
        }

        // 计算实际用时
        const timeUsed = this.examStartTime ? 
            Math.round((new Date() - this.examStartTime) / 1000) : 0;

        // 处理文件：将文件保存为临时路径
        const fileTempPaths = [];
        const fileInfos = [];
        
        for (const fileItem of files) {
            if (fileItem.tempPath) {
                // 已经是临时路径格式
                fileTempPaths.push(fileItem.tempPath);
                fileInfos.push({
                    tempPath: fileItem.tempPath,
                    originalName: fileItem.file.name,
                    size: fileItem.file.size
                });
            } else {
                // 兼容旧格式，转换为临时路径
                const tempPath = dataManager.generateTempPath(file.name);
                try {
                    await dataManager.storeTempFile(file, tempPath);
                    fileTempPaths.push(tempPath);
                    fileInfos.push({
                        tempPath: tempPath,
                        originalName: file.name,
                        size: file.size
                    });
                } catch (error) {
                    console.error('文件存储失败:', error);
                    showMessage(`文件 ${file.name} 存储失败`, 'error');
                    return;
                }
            }
        }

        // 创建提交记录
        const submission = {
            id: dataManager.generateId(),
            assignmentId: examId,
            studentId: this.userData.id,
            submittedTime: new Date().toISOString(),
            content: content,
            files: fileInfos, // 使用包含临时路径的文件信息
            status: 'pending',
            score: null,
            feedback: null,
            gradedTime: null,
            timeUsed: timeUsed, // 考试用时（秒）
            examStartTime: this.examStartTime ? this.examStartTime.toISOString() : null,
            examEndTime: new Date().toISOString(),
            submissionType: 'exam' // 标记为考试提交
        };

        // 保存到数据管理器
        const data = dataManager.getData();
        if (!data.submissions) {
            data.submissions = [];
        }
        data.submissions.push(submission);
        dataManager.saveData();

        // 关闭模态框
        document.querySelector('.exam-modal-overlay')?.remove();
        
        // 刷新界面
        this.renderMyCourses();
        
        // 如果当前在考试页面，也刷新考试页面
        if (this.currentPage === 'exams') {
            this.renderExamsPage();
        }
        
        const successMessage = isResubmission ? 
            `✅ 考试"${exam.title}"重新提交成功！` : 
            `✅ 考试"${exam.title}"提交成功！`;
        showMessage(successMessage, 'success');
        
        // 记录日志
        dataManager.addLog(this.userData.id, 'exam_submit', 
            `学生 ${this.userData.name} 提交了考试 ${exam.title}`);
    }

    // 渲染作业管理页面
    renderAssignmentsPage() {
        this.populateCourseSelector();
        this.setupAssignmentFilters();
        
        // 如果已经有选中的课程，重新加载作业
        const courseSelect = document.getElementById('assignmentCourseSelect');
        if (courseSelect && courseSelect.value) {
            this.loadCourseAssignments();
        }
    }

    // 填充课程选择器
    populateCourseSelector() {
        const courseSelect = document.getElementById('assignmentCourseSelect');
        if (!courseSelect) return;

        courseSelect.innerHTML = '<option value="">请选择课程</option>';

        this.enrollmentsData.forEach(enrollment => {
            const course = this.coursesData.find(c => c.id === enrollment.courseId);
            if (!course) return;

            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = `${course.courseName} (${course.courseCode})`;
            courseSelect.appendChild(option);
        });
    }

    // 加载选中课程的作业
    loadCourseAssignments() {
        const courseSelect = document.getElementById('assignmentCourseSelect');
        const courseId = courseSelect.value;
        
        if (!courseId) {
            this.hideAssignmentsContent();
            return;
        }

        const course = this.coursesData.find(c => c.id === courseId);
        if (!course) return;

        const assignments = dataManager.getCourseHomework(courseId);
        
        // 更新页面标题
        const courseTitle = document.getElementById('selectedCourseTitle');
        if (courseTitle) {
            courseTitle.textContent = `${course.courseName} - 作业列表`;
        }

        if (assignments.length === 0) {
            this.showNoAssignments();
            return;
        }

        this.showAssignmentsContent();
        this.renderAssignmentsGrid(assignments);
        this.updateAssignmentStats(assignments);
    }

    // 显示作业内容区域
    showAssignmentsContent() {
        const container = document.getElementById('assignmentsContainer');
        const stats = document.getElementById('assignmentStats');
        const noAssignments = document.getElementById('noAssignments');
        
        if (container) container.style.display = 'block';
        if (stats) stats.style.display = 'flex';
        if (noAssignments) noAssignments.style.display = 'none';
    }

    // 隐藏作业内容区域
    hideAssignmentsContent() {
        const container = document.getElementById('assignmentsContainer');
        const stats = document.getElementById('assignmentStats');
        const noAssignments = document.getElementById('noAssignments');
        
        if (container) container.style.display = 'none';
        if (stats) stats.style.display = 'none';
        if (noAssignments) noAssignments.style.display = 'none';
    }

    // 显示无作业提示
    showNoAssignments() {
        const container = document.getElementById('assignmentsContainer');
        const stats = document.getElementById('assignmentStats');
        const noAssignments = document.getElementById('noAssignments');
        
        if (container) container.style.display = 'none';
        if (stats) stats.style.display = 'none';
        if (noAssignments) noAssignments.style.display = 'block';
    }

    // 渲染作业网格
    renderAssignmentsGrid(assignments) {
        const grid = document.getElementById('assignmentsGrid');
        if (!grid) return;

        grid.innerHTML = '';

        const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';

        const filteredAssignments = this.filterAssignments(assignments, activeFilter);

        if (filteredAssignments.length === 0) {
            grid.innerHTML = '<div class="no-filtered-assignments">没有符合筛选条件的作业</div>';
            return;
        }

        filteredAssignments.forEach(assignment => {
            const assignmentCard = this.createAssignmentCard(assignment);
            grid.appendChild(assignmentCard);
        });
    }

    // 筛选作业
    filterAssignments(assignments, filter) {
        if (filter === 'all') return assignments;

        return assignments.filter(assignment => {
            const submissions = dataManager.getStudentSubmissions(this.userData.id, assignment.id);
            const submission = submissions.length > 0 ? submissions[0] : null;
            const isOverdue = new Date(assignment.endTime) < new Date();
            
            // 判断作业状态：
            // 1. 有提交记录且状态不是pending = 已提交（包括已批改）
            // 2. 有提交记录且状态是pending = 已提交待批改
            // 3. 没有提交记录 = 未提交
            const hasSubmission = submissions.length > 0;
            const isSubmitted = hasSubmission;
            const isGraded = hasSubmission && submission.status === 'graded';

            switch (filter) {
                case 'pending':
                    // 待提交：没有提交记录且未逾期
                    return !hasSubmission && !isOverdue;
                case 'submitted':
                    // 已提交：有提交记录但未批改
                    return hasSubmission && !isGraded;
                case 'graded':
                    // 已批改：有提交记录且已批改
                    return isGraded;
                case 'overdue':
                    // 已逾期：没有提交记录且已逾期
                    return !hasSubmission && isOverdue;
                default:
                    return true;
            }
        });
    }

    // 创建作业卡片
    createAssignmentCard(assignment) {
        const card = document.createElement('div');
        card.className = 'assignment-card';
        
        const submissions = dataManager.getStudentSubmissions(this.userData.id, assignment.id);
        const submission = submissions.length > 0 ? submissions[0] : null;
        const isOverdue = new Date(assignment.endTime) < new Date();
        
        // 判断作业状态：
        // hasSubmission: 是否有提交记录
        // isSubmitted: 有提交记录就算已提交
        // isGraded: 有提交记录且状态是graded
        const hasSubmission = submissions.length > 0;
        const isSubmitted = hasSubmission;
        const isGraded = hasSubmission && submission && submission.status === 'graded';

        // 计算剩余时间
        const timeRemaining = this.getTimeRemaining(assignment.endTime);
        
        // 获取状态信息
        let statusClass, statusText, statusIcon;
        if (isGraded) {
            statusClass = 'graded';
            statusText = '已批改';
            statusIcon = 'check-circle';
        } else if (isSubmitted) {
            statusClass = 'submitted';
            statusText = '已提交';
            statusIcon = 'paper-plane';
        } else if (isOverdue) {
            statusClass = 'overdue';
            statusText = '已逾期';
            statusIcon = 'exclamation-triangle';
        } else {
            statusClass = 'pending';
            statusText = '待提交';
            statusIcon = 'clock';
        }

        card.innerHTML = `
            <div class="assignment-header">
                <div class="assignment-title-section">
                    <h4 class="assignment-title">${assignment.title}</h4>
                    <div class="assignment-meta">
                        <span class="assignment-type">
                            <i class="fas fa-${assignment.type === 'exam' ? 'file-alt' : 'edit'}"></i>
                            ${assignment.type === 'exam' ? '考试' : '作业'}
                        </span>
                        <span class="assignment-score">
                            <i class="fas fa-star"></i>
                            ${assignment.maxScore}分
                        </span>
                    </div>
                </div>
                <div class="assignment-status ${statusClass}">
                    <i class="fas fa-${statusIcon}"></i>
                    <span>${statusText}</span>
                </div>
            </div>
            
            <div class="assignment-content">
                <p class="assignment-description">${assignment.description}</p>
                
                <div class="assignment-time-info">
                    <span class="deadline-time ${isOverdue ? 'overdue' : ''}">
                        <i class="fas fa-clock"></i>
                        截止: ${new Date(assignment.endTime).toLocaleString()}
                    </span>
                    <span class="time-remaining ${isOverdue ? 'overdue' : ''}">
                        ${timeRemaining}
                    </span>
                </div>
            </div>

            ${isGraded ? `
                <div class="assignment-grade">
                    <div class="grade-display">
                        <span class="score-value">${submission.score}</span>
                        <span class="score-total">/ ${assignment.maxScore}</span>
                        <span class="score-percentage">${Math.round((submission.score / assignment.maxScore) * 100)}%</span>
                    </div>
                    ${submission.feedback ? `
                        <div class="grade-feedback">
                            <strong>评语：</strong>
                            <p>${submission.feedback}</p>
                        </div>
                    ` : ''}
                </div>
            ` : ''}

            <div class="assignment-actions">
                ${!hasSubmission ? `
                    <!-- 未提交状态：显示查看附件和开始提交按钮 -->
                    ${assignment.files && assignment.files.length > 0 ? `
                        <button class="btn-sm btn-info" onclick="studentDashboard.viewAssignmentDetail('${assignment.id}')">
                            <i class="fas fa-paperclip"></i> 查看附件
                        </button>
                    ` : ''}
                    <button class="btn-sm btn-primary" onclick="studentDashboard.submitAssignment('${assignment.id}')">
                        <i class="fas fa-edit"></i> 开始提交
                    </button>
                ` : isGraded ? `
                    <!-- 已批改状态：显示查看详情和查看成绩 -->
                    <button class="btn-sm btn-secondary" onclick="studentDashboard.viewAssignmentDetail('${assignment.id}')">
                        <i class="fas fa-eye"></i> 查看详情
                    </button>
                    <button class="btn-sm btn-secondary" onclick="studentDashboard.viewGradeDetail('${submission.id}')">
                        <i class="fas fa-chart-line"></i> 查看成绩
                    </button>
                ` : isSubmitted ? `
                    <!-- 已提交未批改状态：显示查看详情和重新提交 -->
                    <button class="btn-sm btn-secondary" onclick="studentDashboard.viewAssignmentDetail('${assignment.id}')">
                        <i class="fas fa-eye"></i> 查看详情
                    </button>
                    <button class="btn-sm btn-warning" onclick="studentDashboard.resubmitAssignment('${assignment.id}')">
                        <i class="fas fa-redo"></i> 重新提交
                    </button>
                ` : isOverdue ? `
                    <!-- 已逾期状态：显示查看附件（如果有）和逾期提示 -->
                    ${assignment.files && assignment.files.length > 0 ? `
                        <button class="btn-sm btn-info" onclick="studentDashboard.viewAssignmentDetail('${assignment.id}')">
                            <i class="fas fa-paperclip"></i> 查看附件
                        </button>
                    ` : ''}
                    <button class="btn-sm btn-danger disabled">
                        <i class="fas fa-times-circle"></i> 已逾期
                    </button>
                ` : `
                    <button class="btn-sm btn-primary" onclick="studentDashboard.submitAssignment('${assignment.id}')">
                        <i class="fas fa-upload"></i> 提交作业
                    </button>
                `}
            </div>
        `;

        return card;
    }

    // 更新作业统计
    updateAssignmentStats(assignments) {
        let total = assignments.length;
        let pending = 0;
        let submitted = 0;
        let graded = 0;
        let overdue = 0;

        assignments.forEach(assignment => {
            const submissions = dataManager.getStudentSubmissions(this.userData.id, assignment.id);
            const submission = submissions.length > 0 ? submissions[0] : null;
            const isOverdue = new Date(assignment.endTime) < new Date();
            
            // 判断逻辑：
            // hasSubmission: 是否有提交记录
            // isGraded: 有提交记录且状态是graded算已批改
            // isSubmittedButNotGraded: 有提交记录但未批改
            const hasSubmission = submissions.length > 0;
            const isGraded = hasSubmission && submission && submission.status === 'graded';

            if (isGraded) {
                // 已批改
                graded++;
            } else if (hasSubmission) {
                // 已提交但未批改
                submitted++;
            } else if (isOverdue) {
                // 没有提交记录且已逾期
                overdue++;
            } else {
                // 没有提交记录且未逾期
                pending++;
            }
        });

        const totalEl = document.getElementById('totalAssignments');
        const pendingEl = document.getElementById('pendingAssignments');
        const submittedEl = document.getElementById('submittedAssignments');
        const gradedEl = document.getElementById('gradedAssignments');
        const overdueEl = document.getElementById('overdueAssignments');

        if (totalEl) totalEl.textContent = total;
        if (pendingEl) pendingEl.textContent = pending;
        if (submittedEl) submittedEl.textContent = submitted;
        if (gradedEl) gradedEl.textContent = graded;
        if (overdueEl) overdueEl.textContent = overdue;
    }

    // 设置作业筛选器
    setupAssignmentFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // 更新按钮状态
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // 重新渲染作业列表
                const courseSelect = document.getElementById('assignmentCourseSelect');
                if (courseSelect.value) {
                    this.loadCourseAssignments();
                }
            });
        });

        // 设置课程选择器事件监听器
        const courseSelect = document.getElementById('assignmentCourseSelect');
        if (courseSelect) {
            courseSelect.addEventListener('change', () => {
                this.loadCourseAssignments();
            });
        }
    }

    // 渲染考试管理页面
    renderExamsPage() {
        this.populateExamCourseSelector();
        this.setupExamFilters();
        
        // 如果已经有选中的课程，重新加载考试
        const courseSelect = document.getElementById('examCourseSelect');
        if (courseSelect && courseSelect.value) {
            this.loadCourseExams();
        }
    }

    // 填充考试课程选择器
    populateExamCourseSelector() {
        const courseSelect = document.getElementById('examCourseSelect');
        if (!courseSelect) return;

        courseSelect.innerHTML = '<option value="">请选择课程</option>';

        this.enrollmentsData.forEach(enrollment => {
            const course = this.coursesData.find(c => c.id === enrollment.courseId);
            if (!course) return;

            const option = document.createElement('option');
            option.value = course.id;
            option.textContent = `${course.courseName} (${course.courseCode})`;
            courseSelect.appendChild(option);
        });
    }

    // 加载选中课程的考试
    loadCourseExams() {
        const courseSelect = document.getElementById('examCourseSelect');
        const courseId = courseSelect.value;
        
        if (!courseId) {
            this.hideExamsContent();
            return;
        }

        const course = this.coursesData.find(c => c.id === courseId);
        if (!course) return;

        // 获取课程的所有考试
        const exams = dataManager.getCourseExams(courseId);
        
        // 更新页面标题
        const courseTitle = document.getElementById('selectedExamTitle');
        if (courseTitle) {
            courseTitle.textContent = `${course.courseName} - 考试列表`;
        }

        if (exams.length === 0) {
            this.showNoExams();
            return;
        }

        this.showExamsContent();
        this.renderExamsGrid(exams);
        this.updateExamStats(exams);
    }

    // 显示考试内容区域
    showExamsContent() {
        const container = document.getElementById('examsContainer');
        const stats = document.getElementById('examStats');
        const noExams = document.getElementById('noExams');
        
        if (container) container.style.display = 'block';
        if (stats) stats.style.display = 'flex';
        if (noExams) noExams.style.display = 'none';
    }

    // 隐藏考试内容区域
    hideExamsContent() {
        const container = document.getElementById('examsContainer');
        const stats = document.getElementById('examStats');
        const noExams = document.getElementById('noExams');
        
        if (container) container.style.display = 'none';
        if (stats) stats.style.display = 'none';
        if (noExams) noExams.style.display = 'none';
    }

    // 显示无考试提示
    showNoExams() {
        const container = document.getElementById('examsContainer');
        const stats = document.getElementById('examStats');
        const noExams = document.getElementById('noExams');
        
        if (container) container.style.display = 'none';
        if (stats) stats.style.display = 'none';
        if (noExams) noExams.style.display = 'block';
    }

    // 渲染考试网格
    renderExamsGrid(exams) {
        const grid = document.getElementById('examsGrid');
        if (!grid) return;

        grid.innerHTML = '';

        const activeFilter = document.querySelector('#examsContainer .filter-btn.active')?.dataset.filter || 'all';

        const filteredExams = this.filterExams(exams, activeFilter);

        if (filteredExams.length === 0) {
            grid.innerHTML = '<div class="no-filtered-assignments">没有符合筛选条件的考试</div>';
            return;
        }

        filteredExams.forEach(exam => {
            const examCard = this.createExamCard(exam);
            grid.appendChild(examCard);
        });
    }

    // 筛选考试
    filterExams(exams, filter) {
        if (filter === 'all') return exams;

        return exams.filter(exam => {
            const submissions = dataManager.getStudentSubmissions(this.userData.id, exam.id);
            const submission = submissions.length > 0 ? submissions[0] : null;
            const isOverdue = new Date(exam.endTime) < new Date();
            
            const hasSubmission = submissions.length > 0;
            const isSubmitted = hasSubmission;
            const isGraded = hasSubmission && submission.status === 'graded';

            switch (filter) {
                case 'pending':
                    return !hasSubmission && !isOverdue;
                case 'submitted':
                    return hasSubmission && !isGraded;
                case 'graded':
                    return isGraded;
                case 'overdue':
                    return !hasSubmission && isOverdue;
                default:
                    return true;
            }
        });
    }

    // 创建考试卡片
    createExamCard(exam) {
        const card = document.createElement('div');
        card.className = 'assignment-card exam-card';
        
        const submissions = dataManager.getStudentSubmissions(this.userData.id, exam.id);
        const submission = submissions.length > 0 ? submissions[0] : null;
        const isOverdue = new Date(exam.endTime) < new Date();
        
        const hasSubmission = submissions.length > 0;
        const isSubmitted = hasSubmission;
        const isGraded = hasSubmission && submission && submission.status === 'graded';

        // 计算剩余时间
        const timeRemaining = this.getTimeRemaining(exam.endTime);
        
        // 获取状态信息
        let statusClass, statusText, statusIcon;
        if (isGraded) {
            statusClass = 'graded';
            statusText = '已批改';
            statusIcon = 'check-circle';
        } else if (isSubmitted) {
            statusClass = 'submitted';
            statusText = '已提交';
            statusIcon = 'paper-plane';
        } else if (isOverdue) {
            statusClass = 'overdue';
            statusText = '已逾期';
            statusIcon = 'exclamation-triangle';
        } else {
            statusClass = 'pending';
            statusText = '待提交';
            statusIcon = 'clock';
        }

        card.innerHTML = `
            <div class="assignment-header">
                <div class="assignment-title-section">
                    <h4 class="assignment-title">
                        ${exam.title}
                        <span class="exam-type-badge">
                            <i class="fas fa-clipboard-check"></i>
                            考试
                        </span>
                    </h4>
                    <div class="assignment-meta">
                        <span class="exam-duration">
                            <i class="fas fa-clock"></i>
                            ${exam.duration || 120}分钟
                        </span>
                        <span class="assignment-score">
                            <i class="fas fa-star"></i>
                            ${exam.maxScore}分
                        </span>
                    </div>
                </div>
                <div class="assignment-status ${statusClass}">
                    <i class="fas fa-${statusIcon}"></i>
                    <span>${statusText}</span>
                </div>
            </div>
            
            <div class="assignment-content">
                <p class="assignment-description">${exam.description}</p>
                <div class="assignment-time-info">
                    <span class="deadline-time ${isOverdue ? 'overdue' : ''}">
                        <i class="fas fa-clock"></i>
                        截止: ${new Date(exam.endTime).toLocaleString()}
                    </span>
                    <span class="time-remaining ${isOverdue ? 'overdue' : ''}">
                        ${timeRemaining}
                    </span>
                </div>
            </div>

            ${isGraded ? `
                <div class="assignment-grade">
                    <div class="grade-display">
                        <span class="score-value">${submission.score}</span>
                        <span class="score-total">/ ${exam.maxScore}</span>
                        <span class="score-percentage">${Math.round((submission.score / exam.maxScore) * 100)}%</span>
                    </div>
                    ${submission.feedback ? `
                        <div class="grade-feedback">
                            <strong>评语：</strong>
                            <p>${submission.feedback}</p>
                        </div>
                    ` : ''}
                </div>
            ` : ''}

            <div class="assignment-actions">
                ${!hasSubmission ? `
                    <!-- 未提交状态：显示查看附件和开始考试按钮 -->
                    ${exam.files && exam.files.length > 0 ? `
                        <button class="btn-sm btn-info" onclick="studentDashboard.viewAssignmentDetail('${exam.id}')">
                            <i class="fas fa-paperclip"></i> 查看附件
                        </button>
                    ` : ''}
                    <button class="btn-sm btn-primary" onclick="studentDashboard.startExam('${exam.id}')">
                        <i class="fas fa-play"></i> 开始考试
                    </button>
                ` : isGraded ? `
                    <!-- 已批改状态：显示查看详情和查看成绩 -->
                    <button class="btn-sm btn-secondary" onclick="studentDashboard.viewAssignmentDetail('${exam.id}')">
                        <i class="fas fa-eye"></i> 查看详情
                    </button>
                    <button class="btn-sm btn-secondary" onclick="studentDashboard.viewGradeDetail('${submission.id}')">
                        <i class="fas fa-chart-line"></i> 查看成绩
                    </button>
                ` : isSubmitted ? `
                    <!-- 已提交未批改状态：显示查看详情和重新提交 -->
                    <button class="btn-sm btn-secondary" onclick="studentDashboard.viewAssignmentDetail('${exam.id}')">
                        <i class="fas fa-eye"></i> 查看详情
                    </button>
                    <button class="btn-sm btn-warning" onclick="studentDashboard.resubmitExam('${exam.id}')">
                        <i class="fas fa-redo"></i> 重新提交
                    </button>
                ` : isOverdue ? `
                    <!-- 已逾期状态：显示查看附件（如果有）和逾期提示 -->
                    ${exam.files && exam.files.length > 0 ? `
                        <button class="btn-sm btn-info" onclick="studentDashboard.viewAssignmentDetail('${exam.id}')">
                            <i class="fas fa-paperclip"></i> 查看附件
                        </button>
                    ` : ''}
                    <button class="btn-sm btn-danger disabled">
                        <i class="fas fa-times-circle"></i> 已逾期
                    </button>
                ` : ''}
            </div>
        `;

        return card;
    }

    // 更新考试统计
    updateExamStats(exams) {
        let total = exams.length;
        let pending = 0;
        let submitted = 0;
        let graded = 0;
        let overdue = 0;

        exams.forEach(exam => {
            const submissions = dataManager.getStudentSubmissions(this.userData.id, exam.id);
            const submission = submissions.length > 0 ? submissions[0] : null;
            const isOverdue = new Date(exam.endTime) < new Date();
            
            const hasSubmission = submissions.length > 0;
            const isGraded = hasSubmission && submission && submission.status === 'graded';

            if (isGraded) {
                graded++;
            } else if (hasSubmission) {
                submitted++;
            } else if (isOverdue) {
                overdue++;
            } else {
                pending++;
            }
        });

        const totalEl = document.getElementById('totalExams');
        const pendingEl = document.getElementById('pendingExams');
        const submittedEl = document.getElementById('submittedExams');
        const gradedEl = document.getElementById('gradedExams');
        const overdueEl = document.getElementById('overdueExams');

        if (totalEl) totalEl.textContent = total;
        if (pendingEl) pendingEl.textContent = pending;
        if (submittedEl) submittedEl.textContent = submitted;
        if (gradedEl) gradedEl.textContent = graded;
        if (overdueEl) overdueEl.textContent = overdue;
    }

    // 设置考试筛选器
    setupExamFilters() {
        // 获取考试页面的筛选按钮
        const filterButtons = document.querySelectorAll('#examsContainer .filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // 更新按钮状态
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // 重新渲染考试列表
                const courseSelect = document.getElementById('examCourseSelect');
                if (courseSelect.value) {
                    this.loadCourseExams();
                }
            });
        });

        // 设置考试课程选择器事件监听器
        const courseSelect = document.getElementById('examCourseSelect');
        if (courseSelect) {
            courseSelect.addEventListener('change', () => {
                this.loadCourseExams();
            });
        }
    }

    // 渲染成绩
    renderGrades() {
        this.updateGradesDisplay();
    }

    // 更新成绩显示
    updateGradesDisplay() {
        // 根据新的grades数组结构过滤成绩 - 只包含当前学生的成绩
        // 支持多种字段名匹配：studentid、studentId、username
        const studentGrades = this.gradesData.filter(grade => 
            grade.studentid === this.userData.id || 
            grade.studentId === this.userData.id ||
            grade.username === this.userData.username
        );
        
        // 更新总览统计 - 显示当前学生的所有成绩统计
        const overviewStats = document.querySelector('.overview-stats');
        if (overviewStats) {
            // 只统计当前学生的实际成绩
            const actualGrades = studentGrades;
            
            if (actualGrades.length > 0) {
                // 从grades数组获取信息，需要通过courseId查找课程信息来获取学分
                let totalCredits = 0;
                actualGrades.forEach(grade => {
                    const course = this.coursesData.find(c => c.id === grade.courseId);
                    if (course) {
                        totalCredits += course.credits;
                    }
                });
                
                // 计算加权平均绩点（基于实际成绩，假设grades中有gpa字段）
                let weightedGPA = 0;
                actualGrades.forEach(grade => {
                    const course = this.coursesData.find(c => c.id === grade.courseId);
                    if (course && grade.gpa) {
                        weightedGPA += grade.gpa * course.credits;
                    }
                });
                weightedGPA = totalCredits > 0 ? weightedGPA / totalCredits : 0;
                
                // 计算平均成绩（基于实际成绩）
                const averageGrade = actualGrades.reduce((sum, grade) => sum + grade.totalScore, 0) / actualGrades.length;
                
                overviewStats.innerHTML = `
                    <div class="stat">
                        <span class="label">平均绩点</span>
                        <span class="value gpa">${weightedGPA.toFixed(2)}</span>
                    </div>
                    <div class="stat">
                        <span class="label">总学分</span>
                        <span class="value">${totalCredits}</span>
                    </div>
                    <div class="stat">
                        <span class="label">平均成绩</span>
                        <span class="value grade">${averageGrade.toFixed(1)}</span>
                    </div>
                    <div class="stat">
                        <span class="label">已评课程</span>
                        <span class="value">${actualGrades.length}</span>
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

        // 更新成绩明细表 - 只显示当前学生的成绩
        const gradeTableBody = document.getElementById('gradeTableBody');
        if (gradeTableBody) {
            gradeTableBody.innerHTML = '';
            
            // 只显示当前学生的成绩记录
            if (studentGrades.length === 0) {
                gradeTableBody.innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align: center; padding: 40px; color: #666;">
                            <i class="fas fa-info-circle"></i> 
                            暂无成绩数据，请等待教师评分
                        </td>
                    </tr>
                `;
            } else {
                studentGrades.forEach(grade => {
                    const course = this.coursesData.find(c => c.id === grade.courseId);
                    if (!course) return;
                    
                    const teacher = dataManager.getUserById(course.teacherId);
                    const row = document.createElement('tr');
                    
                    // 计算绩点（如果没有gpa字段，则根据totalScore计算）
                    const gpa = grade.gpa || ((grade.totalScore / 100) * 4.5).toFixed(2);
                    
                    row.innerHTML = `
                        <td>${course.courseCode}</td>
                        <td>${course.courseName}</td>
                        <td>${teacher ? teacher.name : '未知教师'}</td>
                        <td>${course.credits}</td>
                        <td><span class="grade-badge ${this.getGradeClass(grade.totalScore)}">${grade.totalScore}</span></td>
                        <td>${gpa}</td>
                        <td>
                            <button class="btn-sm btn-secondary" onclick="studentDashboard.viewGradeDetail('${grade.id}')">查看详情</button>
                        </td>
                    `;
                    
                    gradeTableBody.appendChild(row);
                });
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
        const grade = this.gradesData.find(g => 
            g.id === gradeId && (
                g.studentid === this.userData.id || 
                g.studentId === this.userData.id ||
                g.username === this.userData.username
            )
        );
        if (!grade) return;
        
        // 获取课程信息
        const course = this.coursesData.find(c => c.id === grade.courseId);
        if (!course) return;
        
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
                            <span class="gpa-value">${grade.gpa || ((grade.totalScore / 100) * 4.5).toFixed(2)}</span>
                        </div>
                    </div>
                    ${grade.componentScores && grade.componentScores.length > 0 ? `
                    <div class="grade-breakdown">
                        <h4>📝 成绩构成</h4>
                        ${grade.componentScores.map(comp => `
                            <div class="breakdown-item">
                                <span class="item-label">${comp.name || comp.id}</span>
                                <span class="item-score">${comp.score || 0}分</span>
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}
                    <div class="grade-info">
                        <p><strong>课程：</strong>${course.courseName} (${course.courseCode})</p>
                        <p><strong>学分：</strong>${course.credits}</p>
                        <p><strong>学生：</strong>${grade.name || grade.username || '未知'}</p>
                        <p><strong>成绩发布时间：</strong>${new Date(grade.createdAt).toLocaleString()}</p>
                        ${grade.updatedAt && grade.updatedAt !== grade.createdAt ? 
                            `<p><strong>更新时间：</strong>${new Date(grade.updatedAt).toLocaleString()}</p>` : ''}
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
            const assignments = dataManager.getCourseHomework(enrollment.courseId);
            assignments.forEach(assignment => {
                const endTime = new Date(assignment.endTime);
                const hoursLeft = (endTime - now) / (1000 * 60 * 60);
                
                // 24小时内到期的作业和考试
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
            const assignments = dataManager.getCourseHomework(enrollment.courseId);
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
            const assignments = dataManager.getCourseHomework(enrollment.courseId);
            
            assignments.forEach(assignment => {
                const now = new Date();
                const endTime = new Date(assignment.endTime);
                const hoursLeft = (endTime - now) / (1000 * 60 * 60);
                
                if (hoursLeft > 0 && hoursLeft <= 24) {
                    const itemType = assignment.type === 'exam' ? '考试' : '作业';
                    notifications.push({
                        type: assignment.type,
                        text: `${course?.courseName || '课程'}${itemType}"${assignment.title}"将在${Math.round(hoursLeft)}小时后截止`,
                        priority: hoursLeft <= 6 ? 'high' : 'normal'
                    });
                }
            });
        });
        
        // 新发布的成绩
        const unpublishedGrades = this.gradesData.filter(grade => 
            (grade.studentid === this.userData.id || grade.studentId === this.userData.id || grade.username === this.userData.username) &&
            grade.status !== 'read' && 
            grade.totalScore !== undefined
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