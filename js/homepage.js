// 首页JavaScript文件

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    initializeHomepage();
});

// 获取认证管理器实例，确保集成 DataManager
function getAuthInstance() {
    // 首先确保dataManager存在
    if (!window.dataManager) {
        console.error('DataManager 未加载');
        return null;
    }
    
    // 检查全局auth实例是否存在且正确初始化
    if (window.auth && typeof window.auth === 'object' && window.auth.login) {
        // 确保全局 auth 拥有 dataManager
        if (!window.auth.dataManager) {
            window.auth.dataManager = window.dataManager;
        }
        return window.auth;
    }
    
    // 如果全局auth不存在，创建新的auth实例
    try {
        window.auth = new AuthManager(window.dataManager);
        window.auth.init();
        return window.auth;
    } catch (error) {
        console.error('创建AuthManager失败:', error);
        return null;
    }
}

// 初始化首页功能
function initializeHomepage() {
    // 初始化轮播图
    initCarousel();
    
    // 初始化课程数据
    loadCourses();
    
    // 初始化搜索功能
    initSearch();
    
    // 初始化统计数字动画
    initCounterAnimation();
    
    // 初始化登录按钮
    initLoginButton();
    
    // 检查用户登录状态并更新导航
    checkLoginStatus();
}

// 轮播图功能
let currentSlide = 0;
const totalSlides = 3;
let slideInterval;

function initCarousel() {
    slideInterval = setInterval(() => {
        currentSlide = (currentSlide + 1) % totalSlides;
        showSlide(currentSlide);
    }, 5000);
}

function showSlide(index) {
    const slides = document.querySelectorAll('.carousel-item');
    const indicators = document.querySelectorAll('.indicator');
    
    slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
    });
    
    indicators.forEach((indicator, i) => {
        indicator.classList.toggle('active', i === index);
    });
    
    currentSlide = index;
}

function changeSlide(direction) {
    currentSlide = (currentSlide + direction + totalSlides) % totalSlides;
    showSlide(currentSlide);
    
    // 重置自动轮播
    clearInterval(slideInterval);
    initCarousel();
}

function goToSlide(index) {
    currentSlide = index;
    showSlide(currentSlide);
    
    // 重置自动轮播
    clearInterval(slideInterval);
    initCarousel();
}

// 课程数据加载
function loadCourses() {
    const coursesData = [
        {
            id: 1,
            code: 'CS101',
            title: '数据结构与算法',
            teacher: '王教授',
            department: 'cs',
            credits: 3,
            type: 'required',
            description: '学习基本的数据结构和算法，包括数组、链表、树、图等数据结构，以及排序、搜索等算法。',
            enrolled: 245,
            rating: 4.8
        },
        {
            id: 2,
            code: 'CS201',
            title: '计算机网络',
            teacher: '李教授',
            department: 'cs',
            credits: 3,
            type: 'required',
            description: '深入学习计算机网络的基本原理、协议和体系结构，包括TCP/IP、HTTP等协议。',
            enrolled: 189,
            rating: 4.6
        },
        {
            id: 3,
            code: 'CS301',
            title: '操作系统',
            teacher: '张教授',
            department: 'cs',
            credits: 4,
            type: 'core',
            description: '学习操作系统的基本概念和原理，包括进程管理、内存管理、文件系统等。',
            enrolled: 156,
            rating: 4.7
        },
        {
            id: 4,
            code: 'MA101',
            title: '高等数学',
            teacher: '刘教授',
            department: 'ma',
            credits: 4,
            type: 'required',
            description: '学习微积分、线性代数等高等数学基础知识，为后续专业课程打下基础。',
            enrolled: 312,
            rating: 4.5
        },
        {
            id: 5,
            code: 'EE201',
            title: '数字电路与逻辑设计',
            teacher: '陈教授',
            department: 'ee',
            credits: 3,
            type: 'core',
            description: '学习数字电路的基本原理和逻辑设计方法，包括组合逻辑和时序逻辑电路。',
            enrolled: 128,
            rating: 4.4
        },
        {
            id: 6,
            code: 'CS401',
            title: '人工智能基础',
            teacher: '赵教授',
            department: 'cs',
            credits: 3,
            type: 'elective',
            description: '介绍人工智能的基本概念、机器学习算法和深度学习技术。',
            enrolled: 267,
            rating: 4.9
        }
    ];

    renderCourses(coursesData);
    setupLoadMore(coursesData);
}

function renderCourses(courses, startIndex = 0, limit = 6) {
    const coursesContainer = document.getElementById('coursesList');
    if (!coursesContainer) return;

    const coursesToShow = courses.slice(startIndex, startIndex + limit);
    
    coursesToShow.forEach(course => {
        const courseCard = createCourseCard(course);
        coursesContainer.appendChild(courseCard);
    });
}

function createCourseCard(course) {
    const card = document.createElement('div');
    card.className = 'course-card';
    
    const typeText = {
        'required': '必修课',
        'elective': '选修课',
        'core': '核心课'
    }[course.type] || '其他';
    
    card.innerHTML = `
        <div class="course-header">
            <div class="course-code">${course.code}</div>
            <div class="course-type">${typeText}</div>
            <h3>${course.title}</h3>
        </div>
        <div class="course-info">
            <p><i class="fas fa-user"></i> ${course.teacher}</p>
            <p><i class="fas fa-university"></i> ${getDepartmentName(course.department)}</p>
            <p><i class="fas fa-coins"></i> ${course.credits} 学分</p>
            <p><i class="fas fa-users"></i> ${course.enrolled} 人已选修</p>
            <p><i class="fas fa-star"></i> ${course.rating} 分</p>
        </div>
        <div class="course-description">
            <p>${course.description}</p>
        </div>
        <div class="course-actions">
            <button class="btn-secondary" onclick="viewCourseDetail(${course.id})">
                <i class="fas fa-info-circle"></i>
                查看详情
            </button>
            <button class="btn-primary" onclick="promptLogin()">
                <i class="fas fa-plus"></i>
                选修课程
            </button>
        </div>
    `;
    
    return card;
}

function getDepartmentName(dept) {
    const departments = {
        'cs': '计算机学院',
        'ee': '电子信息学院',
        'ma': '数学学院',
        'ph': '物理学院',
        'ch': '化学学院'
    };
    return departments[dept] || '其他学院';
}

function setupLoadMore(allCourses) {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (!loadMoreBtn) return;
    
    let currentIndex = 6;
    
    loadMoreBtn.addEventListener('click', function() {
        const remaining = allCourses.length - currentIndex;
        const toLoad = Math.min(3, remaining);
        
        if (toLoad > 0) {
            renderCourses(allCourses, currentIndex, toLoad);
            currentIndex += toLoad;
        }
        
        if (currentIndex >= allCourses.length) {
            loadMoreBtn.style.display = 'none';
            showMessage('info', '提示', '已加载所有课程');
        }
    });
}

// 搜索功能
function initSearch() {
    const searchInput = document.getElementById('courseSearch');
    const searchBtn = document.getElementById('searchBtn');
    const departmentFilter = document.getElementById('departmentFilter');
    const creditFilter = document.getElementById('creditFilter');
    const typeFilter = document.getElementById('typeFilter');
    
    if (!searchInput || !searchBtn) return;
    
    const performSearch = function() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const dept = departmentFilter.value;
        const credit = creditFilter.value;
        const type = typeFilter.value;
        
        // 重新加载课程数据并筛选
        loadFilteredCourses(searchTerm, dept, credit, type);
    };
    
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    departmentFilter?.addEventListener('change', performSearch);
    creditFilter?.addEventListener('change', performSearch);
    typeFilter?.addEventListener('change', performSearch);
}

function loadFilteredCourses(searchTerm, department, credits, type) {
    // 模拟筛选后的课程数据
    const allCourses = [
        {
            id: 1,
            code: 'CS101',
            title: '数据结构与算法',
            teacher: '王教授',
            department: 'cs',
            credits: 3,
            type: 'required',
            description: '学习基本的数据结构和算法，包括数组、链表、树、图等数据结构，以及排序、搜索等算法。',
            enrolled: 245,
            rating: 4.8
        },
        {
            id: 2,
            code: 'CS201',
            title: '计算机网络',
            teacher: '李教授',
            department: 'cs',
            credits: 3,
            type: 'required',
            description: '深入学习计算机网络的基本原理、协议和体系结构，包括TCP/IP、HTTP等协议。',
            enrolled: 189,
            rating: 4.6
        },
        {
            id: 3,
            code: 'CS301',
            title: '操作系统',
            teacher: '张教授',
            department: 'cs',
            credits: 4,
            type: 'core',
            description: '学习操作系统的基本概念和原理，包括进程管理、内存管理、文件系统等。',
            enrolled: 156,
            rating: 4.7
        },
        {
            id: 4,
            code: 'MA101',
            title: '高等数学',
            teacher: '刘教授',
            department: 'ma',
            credits: 4,
            type: 'required',
            description: '学习微积分、线性代数等高等数学基础知识，为后续专业课程打下基础。',
            enrolled: 312,
            rating: 4.5
        },
        {
            id: 5,
            code: 'EE201',
            title: '数字电路与逻辑设计',
            teacher: '陈教授',
            department: 'ee',
            credits: 3,
            type: 'core',
            description: '学习数字电路的基本原理和逻辑设计方法，包括组合逻辑和时序逻辑电路。',
            enrolled: 128,
            rating: 4.4
        },
        {
            id: 6,
            code: 'CS401',
            title: '人工智能基础',
            teacher: '赵教授',
            department: 'cs',
            credits: 3,
            type: 'elective',
            description: '介绍人工智能的基本概念、机器学习算法和深度学习技术。',
            enrolled: 267,
            rating: 4.9
        }
    ];
    
    const filteredCourses = allCourses.filter(course => {
        const matchesSearch = !searchTerm || 
            course.title.toLowerCase().includes(searchTerm) ||
            course.teacher.toLowerCase().includes(searchTerm) ||
            course.code.toLowerCase().includes(searchTerm);
        
        const matchesDepartment = !department || course.department === department;
        const matchesCredits = !credits || course.credits.toString() === credits;
        const matchesType = !type || course.type === type;
        
        return matchesSearch && matchesDepartment && matchesCredits && matchesType;
    });
    
    const coursesContainer = document.getElementById('coursesList');
    if (coursesContainer) {
        coursesContainer.innerHTML = '';
        
        if (filteredCourses.length === 0) {
            coursesContainer.innerHTML = '<div class="no-results">没有找到符合条件的课程</div>';
        } else {
            renderCourses(filteredCourses);
            
            // 隐藏加载更多按钮
            const loadMoreBtn = document.getElementById('loadMoreBtn');
            if (loadMoreBtn) {
                loadMoreBtn.style.display = 'none';
            }
        }
    }
    
    // 显示搜索结果提示
    if (searchTerm || department || credits || type) {
        showMessage('info', '搜索结果', `找到 ${filteredCourses.length} 门符合条件`);
    }
}

// 统计数字动画
function initCounterAnimation() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    });
    
    const counters = document.querySelectorAll('.stat-number');
    counters.forEach(counter => {
        observer.observe(counter);
    });
}

function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-count'));
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            element.textContent = target.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 16);
}

// 登录相关功能
function initLoginButton() {
    const loginBtn = document.getElementById('loginBtn');
    const loginPromptBtn = document.getElementById('loginPromptBtn');
    
    const openLoginModal = function() {
        showLoginModal();
    };
    
    loginBtn?.addEventListener('click', openLoginModal);
    loginPromptBtn?.addEventListener('click', openLoginModal);
    
    // 初始化登录弹窗表单
    initLoginModalForm();
    
    // 初始化忘记密码弹窗
    initForgotPasswordModal();
}

function checkLoginStatus() {
    const auth = getAuthInstance();
    if (!auth) return;

    // 使用 AuthManager 检查会话
    if (!auth.checkSession() || !auth.currentUser) {
        return;
    }

    const user = auth.currentUser;

    // 更新导航栏显示用户信息
    const navRight = document.querySelector('.guest-homepage .nav-right');
    if (navRight) {
        const displayName = user.name || user.username;
        const role = user.userType;

        navRight.innerHTML = `
            <div class="user-info">
                <img src="images/avatar.jpg" alt="用户头像" class="user-avatar" onerror="this.src='https://picsum.photos/seed/${user.username}/40/40.jpg'">
                <span class="user-name">${displayName}</span>
                <span class="user-type">${getUserTypeText(role)}</span>
            </div>
            <div class="nav-actions">
                <button class="dashboard-btn" onclick="goToDashboard()">
                    <i class="fas fa-tachometer-alt"></i>
                    控制台
                </button>
                <button class="notification-btn" onclick="showNotifications()">
                    <i class="fas fa-bell"></i>
                    <span class="badge">3</span>
                </button>
                <button class="logout-btn" onclick="logout()">
                    <i class="fas fa-sign-out-alt"></i>
                    退出
                </button>
            </div>
        `;
    }
}

function getUserTypeText(role) {
    const roleMap = {
        'student': '学生',
        'teacher': '教师',
        'academicAdmin': '教学管理员',
        'systemAdmin': '系统管理员'
    };
    return roleMap[role] || '用户';
}

function goToDashboard() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        
        if (user.role === 'student') {
            window.location.href = 'student-dashboard.html';
        } else if (user.role === 'teacher') {
            window.location.href = 'teacher-dashboard.html';
        } else if (user.role === 'academicAdmin') {
            window.location.href = 'academic-admin-dashboard.html';
        } else if (user.role === 'systemAdmin') {
            window.location.href = 'system-admin-dashboard.html';
        }
    }
}

// 登录弹窗功能
function showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // 重置表单
        resetLoginForm();
        
        // 聚焦到用户名输入框
        setTimeout(() => {
            document.getElementById('modalUsername')?.focus();
        }, 300);
    }
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        resetLoginForm();
    }
}

function resetLoginForm() {
    const form = document.getElementById('loginModalForm');
    if (form) {
        form.reset();
        
        // 清除错误状态
        const formGroups = form.querySelectorAll('.form-group');
        formGroups.forEach(group => {
            group.classList.remove('has-error', 'has-success');
        });
        
        // 隐藏错误消息
        const errorMessages = form.querySelectorAll('.error-message');
        errorMessages.forEach(msg => {
            msg.classList.remove('show');
        });
        
        // 重置登录按钮
        const loginBtn = document.getElementById('modalLoginBtn');
        const btnText = document.getElementById('loginBtnText');
        const btnIcon = document.getElementById('loginBtnIcon');
        const btnSpinner = document.getElementById('loginBtnSpinner');
        
        if (loginBtn) loginBtn.disabled = false;
        if (btnText) btnText.textContent = '登录';
        if (btnIcon) btnIcon.style.display = 'inline';
        if (btnSpinner) btnSpinner.style.display = 'none';
    }
}

function initLoginModalForm() {
    const form = document.getElementById('loginModalForm');
    const togglePassword = document.getElementById('modalTogglePassword');
    const passwordInput = document.getElementById('modalPassword');
    
    if (!form) {
        return;
    }
    
    // 密码显示/隐藏切换
    togglePassword?.addEventListener('click', function() {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        
        const icon = this.querySelector('i');
        if (icon) {
            icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
        }
    });
    
    // 表单验证
    form.addEventListener('input', function(e) {
        validateField(e.target);
    });
    
    // 表单提交
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        handleLoginSubmit();
    });
}

function validateField(field) {
    const formGroup = field.closest('.form-group');
    const errorMsg = formGroup?.querySelector('.error-message');
    
    if (!formGroup || !errorMsg) return;
    
    let isValid = true;
    let errorMessage = '';
    
    if (field.required && !field.value.trim()) {
        isValid = false;
        errorMessage = `请输入${field.previousElementSibling?.textContent?.replace(':', '') || '此字段'}`;
    } else if (field.type === 'email' && field.value && !isValidEmail(field.value)) {
        isValid = false;
        errorMessage = '请输入有效的邮箱地址';
    }
    
    if (isValid) {
        formGroup.classList.remove('has-error');
        formGroup.classList.add('has-success');
        errorMsg.classList.remove('show');
    } else {
        formGroup.classList.remove('has-success');
        formGroup.classList.add('has-error');
        errorMsg.querySelector('span').textContent = errorMessage;
        errorMsg.classList.add('show');
    }
    
    return isValid;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function handleLoginSubmit() {
    const form = document.getElementById('loginModalForm');
    if (!form) return;
    
    // 验证所有字段
    const fields = form.querySelectorAll('input[required], select[required]');
    let isFormValid = true;
    
    fields.forEach(field => {
        if (!validateField(field)) {
            isFormValid = false;
        }
    });
    
    if (!isFormValid) {
        showMessage('error', '验证失败', '请检查并填写所有必填字段');
        return;
    }
    
    // 显示加载状态
    const loginBtn = document.getElementById('modalLoginBtn');
    const btnText = document.getElementById('loginBtnText');
    const btnIcon = document.getElementById('loginBtnIcon');
    const btnSpinner = document.getElementById('loginBtnSpinner');
    
    if (loginBtn) loginBtn.disabled = true;
    if (btnText) btnText.textContent = '登录中...';
    if (btnIcon) btnIcon.style.display = 'none';
    if (btnSpinner) btnSpinner.style.display = 'inline';
    
    // 获取表单数据
    const formData = new FormData(form);
    const loginData = {
        username: formData.get('username'),
        password: formData.get('password'),
        userType: formData.get('userType'),
        remember: formData.get('remember') === 'on'
    };
    
    // 调用登录验证
    setTimeout(() => {
        performLogin(loginData);
    }, 500);
}

function performLogin(loginData) {
    const auth = getAuthInstance();
    
    if (!auth) {
        showMessage('error', '登录失败', '认证服务初始化失败，请刷新页面重试');
        resetLoginButton();
        return;
    }

    try {
        // 使用 AuthManager 和 DataManager 进行真实验证
        const result = auth.login(loginData.username, loginData.password, loginData.userType);

        if (result.success && result.user) {
            const user = result.user;

            // 可选：将基础用户信息存入 localStorage，便于首页展示
            const userData = {
                username: user.username,
                name: user.name,
                role: user.userType,
                loginTime: new Date().toISOString()
            };
            localStorage.setItem('currentUser', JSON.stringify(userData));

            if (loginData.remember) {
                localStorage.setItem('rememberUser', loginData.username);
            } else {
                localStorage.removeItem('rememberUser');
            }

            showMessage('success', '登录成功', `欢迎回来，${user.name}！`, function() {
                closeLoginModal();
                setTimeout(() => {
                    if (user.userType === 'student') {
                        window.location.href = 'student-dashboard.html';
                    } else if (user.userType === 'teacher') {
                        window.location.href = 'teacher-dashboard.html';
                    } else if (user.userType === 'academicAdmin') {
                        window.location.href = 'academic-admin-dashboard.html';
                    } else if (user.userType === 'systemAdmin') {
                        window.location.href = 'system-admin-dashboard.html';
                    }
                }, 500);
            });
        } else {
            // 登录失败
            showMessage('error', '登录失败', result.message || '用户名、密码或用户类型不正确');
            
            // 重置按钮状态
            resetLoginButton();
        }
    } catch (error) {
        console.error('登录过程中发生错误:', error);
        showMessage('error', '登录失败', '登录过程中发生错误，请重试');
        resetLoginButton();
        
        // 高亮错误字段
        const usernameField = document.getElementById('modalUsername');
        const passwordField = document.getElementById('modalPassword');
        const userTypeField = document.getElementById('modalUserType');
        
        [usernameField, passwordField, userTypeField].forEach(field => {
            if (field) {
                const formGroup = field.closest('.form-group');
                if (formGroup) {
                    formGroup.classList.add('has-error');
                    const errorMsg = formGroup.querySelector('.error-message');
                    if (errorMsg) {
                        errorMsg.querySelector('span').textContent = '请检查登录信息';
                        errorMsg.classList.add('show');
                    }
                }
            }
        });
    }
}

function resetLoginButton() {
    const loginBtn = document.getElementById('modalLoginBtn');
    const btnText = document.getElementById('loginBtnText');
    const btnIcon = document.getElementById('loginBtnIcon');
    const btnSpinner = document.getElementById('loginBtnSpinner');

    if (loginBtn) loginBtn.disabled = false;
    if (btnText) btnText.textContent = '登录';
    if (btnIcon) btnIcon.style.display = 'inline';
    if (btnSpinner) btnSpinner.style.display = 'none';
}

// 忘记密码弹窗功能
function initForgotPasswordModal() {
    const forgotPasswordLink = document.getElementById('modalForgotPassword');
    const cancelResetBtn = document.getElementById('cancelReset');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    
    forgotPasswordLink?.addEventListener('click', function(e) {
        e.preventDefault();
        closeLoginModal();
        showForgotPasswordModal();
    });
    
    cancelResetBtn?.addEventListener('click', closeForgotPasswordModal);
    
    forgotPasswordForm?.addEventListener('submit', function(e) {
        e.preventDefault();
        handleForgotPasswordSubmit();
    });
}

function showForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function handleForgotPasswordSubmit() {
    const form = document.getElementById('forgotPasswordForm');
    if (!form) return;
    
    const username = document.getElementById('resetUsername')?.value;
    const userType = document.getElementById('resetUserType')?.value;
    const email = document.getElementById('resetEmail')?.value;
    
    if (!username || !userType || !email) {
        showMessage('error', '表单错误', '请填写所有必填字段');
        return;
    }
    
    // 模拟发送重置链接
    showMessage('success', '发送成功', '重置链接已发送到您的邮箱，请查收');
    closeForgotPasswordModal();
}

function promptLogin() {
    showLoginModal();
}

function viewCourseDetail(courseId) {
    showMessage('info', '查看详情', `课程ID: ${courseId} 的详细功能需要登录后使用`, function() {
        showLoginModal();
    });
}

function showNotifications() {
    showMessage('info', '通知', '您有3条新通知');
}

function logout() {
    if (confirm('确定要退出登录吗？')) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        showMessage('success', '退出成功', '您已成功退出登录', function() {
            window.location.href = 'index.html';
        });
    }
}

// 消息提示功能
function showMessage(type, title, text, callback) {
    const messageContainer = document.getElementById('messageContainer');
    if (!messageContainer) return;
    
    const message = document.createElement('div');
    message.className = `message ${type}`;
    
    const iconMap = {
        'success': 'fas fa-check-circle',
        'error': 'fas fa-exclamation-circle',
        'warning': 'fas fa-exclamation-triangle',
        'info': 'fas fa-info-circle'
    };
    
    message.innerHTML = `
        <div class="message-icon">
            <i class="${iconMap[type] || iconMap.info}"></i>
        </div>
        <div class="message-content">
            <div class="message-title">${title}</div>
            <div class="message-text">${text}</div>
        </div>
        <button class="message-close" onclick="closeMessage(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    messageContainer.appendChild(message);
    
    // 自动关闭
    setTimeout(() => {
        if (message.parentNode) {
            message.remove();
        }
        if (callback) callback();
    }, 3000);
    
    // 点击关闭
    if (callback) {
        message.addEventListener('click', function(e) {
            if (e.target.closest('.message-close')) return;
            callback();
        });
    }
}

function closeMessage(button) {
    const message = button.closest('.message');
    if (message) {
        message.remove();
    }
}

// 全局函数（供HTML调用）
window.changeSlide = changeSlide;
window.goToSlide = goToSlide;
window.viewCourseDetail = viewCourseDetail;
window.promptLogin = promptLogin;
window.showNotifications = showNotifications;
window.logout = logout;
window.closeMessage = closeMessage;
window.showLoginModal = showLoginModal;
window.closeLoginModal = closeLoginModal;
window.closeForgotPasswordModal = closeForgotPasswordModal;
window.goToDashboard = goToDashboard;