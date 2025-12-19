// 数据管理器 - 成绩管理教学平台
class DataManager {
    constructor() {
        this.initializeData();
    }

    // 初始化数据
    initializeData() {
         const savedData = this.loadData();
        if (savedData) {
            this.data = savedData; // 使用本地数据
            this.ensureDataCompatibility(); // 兼容性检查
        } else {
            this.data = this.generateMockData(); // 首次生成
            this.saveData();
        }
    }

    // 生成模拟数据
    generateMockData() {
        return {
            users: [
                {
                    id: 'sysadmin',
                    username: 'admin',
                    password: this.hashPassword('admin123', 'sysadmin'),
                    salt: 'sysadmin',
                    name: '系统管理员',
                    userType: 'systemAdmin',
                    email: 'admin@system.com',
                    phone: '13800000000',
                    status: 'active',
                    requirePasswordChange: false
                },
                // 学生用户
                {
                    id: 's001',
                    username: 'student',
                    password: this.hashPassword('student123', 'student1'),
                    salt: 'student1',
                    name: '张三',
                    userType: 'student',
                    email: 'zhangsan@university.edu.cn',
                    phone: '13812345678',
                    status: 'active',
                    classId: 'c001',
                    grade: '2021',
                    major: '计算机科学与技术',
                    requirePasswordChange: false
                },
                {
                    id: 's002',
                    username: '2021001002',
                    password: this.hashPassword('123456', 'student2'),
                    salt: 'student2',
                    name: '李四',
                    userType: 'student',
                    email: 'lisi@university.edu.cn',
                    phone: '13812345679',
                    status: 'active',
                    classId: 'c001',
                    grade: '2021',
                    major: '计算机科学与技术',
                    requirePasswordChange: false
                },
                {
                    id: 's003',
                    username: '2021001003',
                    password: this.hashPassword('123456', 'student3'),
                    salt: 'student3',
                    name: '王五',
                    userType: 'student',
                    email: 'wangwu@university.edu.cn',
                    phone: '13812345680',
                    status: 'active',
                    classId: 'c002',
                    grade: '2021',
                    major: '软件工程',
                    requirePasswordChange: false
                },
                // 教师用户
                {
                    id: 't001',
                    username: 'teacher',
                    password: this.hashPassword('teacher123', 'teacher1'),
                    salt: 'teacher1',
                    name: '王教授',
                    userType: 'teacher',
                    email: 'wang@university.edu.cn',
                    phone: '13912345678',
                    status: 'active',
                    title: '教授',
                    departmentId: 'd001',
                    office: '计算机楼 A301',
                    requirePasswordChange: false
                },
                {
                    id: 't002',
                    username: 'teacher002',
                    password: this.hashPassword('123456', 'teacher2'),
                    salt: 'teacher2',
                    name: '李教授',
                    userType: 'teacher',
                    email: 'li@university.edu.cn',
                    phone: '13912345679',
                    status: 'active',
                    title: '副教授',
                    departmentId: 'd001',
                    office: '计算机楼 A302',
                    requirePasswordChange: false
                },
                {
                    id: 't003',
                    username: 'teacher003',
                    password: this.hashPassword('123456', 'teacher3'),
                    salt: 'teacher3',
                    name: '张教授',
                    userType: 'teacher',
                    email: 'zhang@university.edu.cn',
                    phone: '13912345680',
                    status: 'active',
                    title: '讲师',
                    departmentId: 'd001',
                    office: '计算机楼 A303',
                    requirePasswordChange: false
                },
                // 教学管理员
                {
                    id: 'a001',
                    username: 'academic',
                    password: this.hashPassword('academic123', 'admin1'),
                    salt: 'admin1',
                    name: '李教务',
                    userType: 'academicAdmin',
                    email: 'li.admin@university.edu.cn',
                    phone: '13712345678',
                    status: 'active',
                    office: '行政楼 B201',
                    requirePasswordChange: false
                },
                // 系统管理员
                {
                    id: 'sys001',
                    username: 'sysadmin',
                    password: this.hashPassword('admin123', 'sys001'),
                    salt: 'sys001',
                    name: '张系统',
                    userType: 'systemAdmin',
                    email: 'zhang.admin@university.edu.cn',
                    phone: '13612345678',
                    status: 'active',
                    office: '信息中心 C302',
                    requirePasswordChange: false
                }
            ],
            departments: [
                {
                    id: 'd001',
                    departmentName: '计算机学院',
                    dean: '王院长',
                    phone: '010-12345678',
                    description: '负责计算机科学与技术、软件工程等专业的人才培养'
                },
                {
                    id: 'd002',
                    departmentName: '电子信息学院',
                    dean: '李院长',
                    phone: '010-12345679',
                    description: '负责电子信息工程、通信工程等专业的人才培养'
                },
                {
                    id: 'd003',
                    departmentName: '数学学院',
                    dean: '张院长',
                    phone: '010-12345680',
                    description: '负责数学与应用数学、统计学等专业的人才培养'
                }
            ],
            classes: [
                {
                    id: 'c001',
                    className: '计算机科学与技术21-1班',
                    departmentId: 'd001',
                    grade: '2021',
                    major: '计算机科学与技术',
                    headTeacher: '王老师',
                    studentCount: 45
                },
                {
                    id: 'c002',
                    className: '软件工程21-1班',
                    departmentId: 'd001',
                    grade: '2021',
                    major: '软件工程',
                    headTeacher: '李老师',
                    studentCount: 42
                },
                {
                    id: 'c003',
                    className: '计算机科学与技术22-1班',
                    departmentId: 'd001',
                    grade: '2022',
                    major: '计算机科学与技术',
                    headTeacher: '张老师',
                    studentCount: 48
                }
            ],
            courses: [
                {
                    id: 'course002',
                    courseCode: 'CS102',
                    courseName: '计算机网络',
                    credits: 3,
                    teacherId: 't002',
                    departmentId: 'd001',
                    description: '学习计算机网络的基本原理、协议和应用',
                    maxStudents: 40,
                    currentStudents: 32,
                    category: 'required',
                    status: 'published'
                },
                {
                    id: 'course003',
                    courseCode: 'CS103',
                    courseName: '操作系统',
                    credits: 4,
                    teacherId: 't003',
                    departmentId: 'd001',
                    description: '学习操作系统的基本原理和实现技术',
                    maxStudents: 45,
                    currentStudents: 28,
                    category: 'required',
                    status: 'published'
                },
                {
                    id: 'course004',
                    courseCode: 'CS104',
                    courseName: '数据库原理',
                    credits: 3,
                    teacherId: 't001',
                    departmentId: 'd001',
                    description: '学习数据库系统的基本原理和设计方法',
                    maxStudents: 40,
                    currentStudents: 25,
                    category: 'elective',
                    status: 'published'
                },
                {
                    id: 'course005',
                    courseCode: 'CS105',
                    courseName: '算法设计与分析',
                    credits: 3,
                    teacherId: 't002',
                    departmentId: 'd001',
                    description: '学习算法设计的基本方法和分析技术',
                    maxStudents: 35,
                    currentStudents: 20,
                    category: 'elective',
                    status: 'published'
                }
            ],
            enrollments: [
                {
                    id: 'en002',
                    studentId: 's001',
                    courseId: 'course002',
                    enrollmentTime: '2024-09-01T00:00:00Z',
                    status: 'active',
                    type: 'enrolled' // 正式选修
                },
                {
                    id: 'en004',
                    studentId: 's003',
                    courseId: 'course003',
                    enrollmentTime: '2024-09-01T00:00:00Z',
                    status: 'active',
                    type: 'enrolled' // 正式选修
                }
            ],
            assignments: [],
            submissions: [],
            grades: [],
            materials: [],
            logs: [],
            backups: [],
            settings: {
                systemName: '成绩管理教学平台',
                version: '2.0.1',
                adminEmail: 'admin@university.edu.cn',
                maxLoginAttempts: 5,
                sessionTimeout: 120,
                passwordPolicy: {
                    minLength: 6,
                    requireUppercase: false,
                    requireNumbers: true,
                    requireSpecialChars: false
                }
            }
        };
    }

    // 哈希密码 - 改进的哈希算法
    hashPassword(password, salt) {
        // 使用多次迭代的改进哈希算法
        let hash = 0;
        const combined = password + salt + 'teachManager2024';
        
        for (let iteration = 0; iteration < 1000; iteration++) {
            const str = combined + iteration;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char + iteration;
                hash = hash & hash;
            }
        }
        
        // 添加校验位提高安全性
        const checkDigit = (hash % 1000).toString().padStart(3, '0');
        return Math.abs(hash).toString(16) + checkDigit;
    }

    // 从本地存储加载数据
    loadData() {
        try {
            const savedData = localStorage.getItem('teachManagerData');
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                // 验证数据完整性
                if (parsedData && typeof parsedData === 'object' && parsedData.users) {
                    return parsedData;
                }
            }
        } catch (error) {
            console.error('加载本地数据失败:', error);
        }
        return null;
    }

    // 确保数据兼容性（版本升级时使用）
    ensureDataCompatibility() {
        // 检查必要字段是否存在
        if (!this.data.users) this.data.users = [];
        if (!this.data.courses) this.data.courses = [];
        if (!this.data.enrollments) this.data.enrollments = [];
        if (!this.data.assignments) this.data.assignments = [];
        if (!this.data.submissions) this.data.submissions = [];
        if (!this.data.grades) this.data.grades = [];
        if (!this.data.departments) this.data.departments = [];
        if (!this.data.classes) this.data.classes = [];
        if (!this.data.materials) this.data.materials = [];
        if (!this.data.logs) this.data.logs = [];
        if (!this.data.backups) this.data.backups = [];
        if (!this.data.settings) {
            this.data.settings = {
                systemName: '成绩管理教学平台',
                version: '2.0.1',
                adminEmail: 'admin@university.edu.cn',
                maxLoginAttempts: 5,
                sessionTimeout: 120,
                passwordPolicy: {
                    minLength: 6,
                    requireUppercase: false,
                    requireNumbers: true,
                    requireSpecialChars: false
                }
            };
        }
        
        // 为现有用户添加缺失字段
        this.data.users.forEach(user => {
            if (!user.requirePasswordChange) user.requirePasswordChange = false;
            if (!user.status) user.status = 'active';
        });
        
        // 为现有选课记录添加type字段
        this.data.enrollments.forEach(enrollment => {
            if (!enrollment.type) enrollment.type = 'enrolled'; // 默认为正式选修
        });
        
        console.log('数据兼容性检查完成');
        this.saveData();
    }

    // 保存数据到本地存储
    saveData() {
        try {
            localStorage.setItem('teachManagerData', JSON.stringify(this.data));
            console.log('数据已保存到本地存储');
        } catch (error) {
            console.error('保存数据到本地存储失败:', error);
            // 处理存储空间不足的情况
            if (error.name === 'QuotaExceededError') {
                alert('本地存储空间不足，请清理浏览器数据');
            }
        }
    }

    // 获取数据
    getData(type = null) {
        if (type) {
            return this.data[type] || [];
        }
        return this.data;
    }

    // 根据用户名和用户类型获取用户
    getUserByUsername(username, userType) {
        return this.data.users.find(user => 
            user.username === username && user.userType === userType
        );
    }

    // 根据用户ID获取用户
    getUserById(userId) {
        return this.data.users.find(user => user.id === userId);
    }

    // 更新用户密码
    updateUserPassword(userId, password, salt) {
        const userIndex = this.data.users.findIndex(user => user.id === userId);
        if (userIndex !== -1) {
            this.data.users[userIndex].password = password;
            this.data.users[userIndex].salt = salt;
            this.data.users[userIndex].requirePasswordChange = false;
            this.saveData();
            return true;
        }
        return false;
    }

    // 添加日志
    addLog(userId, action, description) {
        const log = {
            id: this.generateId(),
            userId: userId,
            action: action,
            description: description,
            timestamp: new Date().toISOString(),
            ip: '127.0.0.1', // 实际应用中应获取真实IP
            userAgent: navigator.userAgent
        };
        
        this.data.logs.push(log);
        
        // 保持日志数量在合理范围内
        if (this.data.logs.length > 10000) {
            this.data.logs = this.data.logs.slice(-5000);
        }
        
        this.saveData();
        return log;
    }

    // 获取日志
    getLogs(filters = {}) {
        let logs = [...this.data.logs];
        
        if (filters.userId) {
            logs = logs.filter(log => log.userId === filters.userId);
        }
        
        if (filters.action) {
            logs = logs.filter(log => log.action === filters.action);
        }
        
        if (filters.startDate) {
            logs = logs.filter(log => new Date(log.timestamp) >= new Date(filters.startDate));
        }
        
        if (filters.endDate) {
            logs = logs.filter(log => new Date(log.timestamp) <= new Date(filters.endDate));
        }
        
        return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    // 搜索课程
    searchCourses(searchTerm) {
        if (!searchTerm || typeof searchTerm !== 'string') {
            return this.data.courses;
        }
        
        const searchLower = searchTerm.toLowerCase().trim();
        return this.data.courses.filter(course => {
            return (
                (course.courseName && course.courseName.toLowerCase().includes(searchLower)) ||
                (course.courseCode && course.courseCode.toLowerCase().includes(searchLower)) ||
                (course.description && course.description.toLowerCase().includes(searchLower))
            );
        });
    }

    // 搜索用户
    searchUsers(searchTerm, userType = null) {
        if (!searchTerm || typeof searchTerm !== 'string') {
            let users = this.data.users;
            if (userType) {
                users = users.filter(user => user.userType === userType);
            }
            return users;
        }
        
        let users = this.data.users;
        if (userType) {
            users = users.filter(user => user.userType === userType);
        }
        
        const searchLower = searchTerm.toLowerCase().trim();
        return users.filter(user => {
            return (
                (user.name && user.name.toLowerCase().includes(searchLower)) ||
                (user.username && user.username.toLowerCase().includes(searchLower)) ||
                (user.email && user.email.toLowerCase().includes(searchLower))
            );
        });
    }

    // 获取学生的选课记录
    getStudentEnrollments(studentId) {
        return this.data.enrollments.filter(enrollment => 
            enrollment.studentId === studentId && enrollment.status === 'active'
        );
    }

    // 获取课程的学生列表
    getCourseStudents(courseId) {
        const enrollments = this.data.enrollments.filter(enrollment => 
            enrollment.courseId === courseId && enrollment.status === 'active'
        );
        
        return enrollments.map(enrollment => {
            const student = this.getUserById(enrollment.studentId);
            return {
                ...student,
                enrollmentTime: enrollment.enrollmentTime
            };
        }).filter(student => student);
    }

    // 获取教师的课程列表
    getTeacherCourses(teacherId) {
        return this.data.courses.filter(course => 
            course.teacherId === teacherId
        );
    }

    // 获取课程的作业列表
    getCourseAssignments(courseId) {
        return this.data.assignments.filter(assignment => 
            assignment.courseId === courseId
        );
    }

    // 获取学生的作业提交记录
    getStudentSubmissions(studentId, assignmentId = null) {
        let submissions = this.data.submissions.filter(submission => 
            submission.studentId === studentId
        );
        
        if (assignmentId) {
            submissions = submissions.filter(submission => 
                submission.assignmentId === assignmentId
            );
        }
        
        return submissions;
    }

    // 获取学生成绩
    getStudentGrades(studentId, semester = null) {
        let grades = this.data.grades.filter(grade => 
            grade.studentId === studentId
        );
        
        if (semester) {
            grades = grades.filter(grade => grade.semester === semester);
        }
        
        return grades;
    }

    // 获取课程成绩统计
    getCourseGradeStats(courseId) {
        const grades = this.data.grades.filter(grade => {
            // 检查是否包含该课程的作业或考试成绩
            return grade.assignmentScores.some(score => {
                const assignment = this.data.assignments.find(a => a.id === score.assignmentId);
                return assignment && assignment.courseId === courseId;
            });
        });
        
        if (grades.length === 0) {
            return null;
        }
        
        const totalScores = grades.map(g => g.totalScore);
        const average = totalScores.reduce((a, b) => a + b, 0) / totalScores.length;
        const max = Math.max(...totalScores);
        const min = Math.min(...totalScores);
        
        // 计算优秀率和及格率
        const excellentCount = totalScores.filter(score => score >= 90).length;
        const passCount = totalScores.filter(score => score >= 60).length;
        
        return {
            totalStudents: grades.length,
            average: average.toFixed(1),
            max: max,
            min: min,
            excellentRate: ((excellentCount / grades.length) * 100).toFixed(1),
            passRate: ((passCount / grades.length) * 100).toFixed(1)
        };
    }

    // 生成唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    // 创建备份
    createBackup() {
        const backup = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            data: JSON.parse(JSON.stringify(this.data)),
            size: JSON.stringify(this.data).length
        };
        
        this.data.backups.push(backup);
        this.saveData();
        return backup;
    }

    // 恢复备份
    restoreBackup(backupId) {
        const backup = this.data.backups.find(b => b.id === backupId);
        if (backup) {
            this.data = JSON.parse(JSON.stringify(backup.data));
            this.saveData();
            return true;
        }
        return false;
    }

    // 获取备份列表
    getBackups() {
        return this.data.backups.sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );
    }

    // 导出数据
    exportData(type = 'all') {
        if (type === 'all') {
            return JSON.stringify(this.data, null, 2);
        } else if (this.data[type]) {
            return JSON.stringify(this.data[type], null, 2);
        }
        return null;
    }

    // 导入数据
    importData(jsonData, type = 'all') {
        try {
            const data = JSON.parse(jsonData);
            if (type === 'all') {
                this.data = data;
            } else {
                this.data[type] = data;
            }
            this.saveData();
            return true;
        } catch (error) {
            console.error('导入数据失败:', error);
            return false;
        }
    }

    // 获取系统设置
    getSettings() {
        return this.data.settings || {};
    }

    // 更新系统设置
    updateSettings(newSettings) {
        this.data.settings = { ...this.data.settings, ...newSettings };
        this.saveData();
        return true;
    }

    // 获取统计数据
    getStatistics() {
        const stats = {
            totalUsers: this.data.users.length,
            totalStudents: this.data.users.filter(u => u.userType === 'student').length,
            totalTeachers: this.data.users.filter(u => u.userType === 'teacher').length,
            totalCourses: this.data.courses.length,
            totalEnrollments: this.data.enrollments.length,
            totalAssignments: this.data.assignments.length,
            totalSubmissions: this.data.submissions.length,
            departments: this.data.departments.length,
            classes: this.data.classes.length
        };
        
        // 按状态统计用户
        stats.activeUsers = this.data.users.filter(u => u.status === 'active').length;
        stats.inactiveUsers = this.data.users.filter(u => u.status === 'inactive').length;
        stats.lockedUsers = this.data.users.filter(u => u.status === 'locked').length;
        
        // 按状态统计课程
        stats.publishedCourses = this.data.courses.filter(c => c.status === 'published').length;
        stats.draftCourses = this.data.courses.filter(c => c.status === 'draft').length;
        
        return stats;
    }
}

// 创建全局数据管理器实例
const dataManager = new DataManager();

// 设置为全局变量，供auth.js使用
window.dataManager = dataManager;