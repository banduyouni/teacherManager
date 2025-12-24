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
                    id: 'course001',
                    courseCode: 'CS101',
                    courseName: '数据结构与算法',
                    credits: 4,
                    teacherId: 't001',
                    departmentId: 'd001',
                    description: '本课程深入讲解数据结构的基本概念、算法设计与分析方法。内容包括线性表、栈、队列、树、图等基本数据结构，以及排序、搜索等核心算法。通过理论学习和实践编程，培养学生分析和解决复杂问题的能力。',
                    maxStudents: 50,
                    currentStudents: 38,
                    category: 'required',
                    status: 'published',
                    createdAt: '2024-01-15T08:00:00Z',
                    updatedAt: '2024-01-20T14:30:00Z'
                },
                {
                    id: 'course002',
                    courseCode: 'CS102',
                    courseName: '计算机网络',
                    credits: 3,
                    teacherId: 't002',
                    departmentId: 'd001',
                    description: '学习计算机网络的基本原理、协议和应用。涵盖OSI七层模型、TCP/IP协议栈、网络编程、网络安全等内容。通过实验课程，学生将掌握网络配置、故障排除和应用开发的基本技能。',
                    maxStudents: 40,
                    currentStudents: 1,
                    category: 'required',
                    status: 'published',
                    createdAt: '2024-01-10T09:00:00Z',
                    updatedAt: '2024-01-18T16:20:00Z'
                },
                {
                    id: 'course003',
                    courseCode: 'CS103',
                    courseName: '操作系统',
                    credits: 4,
                    teacherId: 't003',
                    departmentId: 'd001',
                    description: '学习操作系统的基本原理和实现技术。包括进程管理、内存管理、文件系统、设备管理等核心概念。通过实际项目，学生将理解操作系统设计的复杂性，并能进行简单的系统级编程。',
                    maxStudents: 45,
                    currentStudents: 28,
                    category: 'required',
                    status: 'published',
                    createdAt: '2024-01-12T10:30:00Z',
                    updatedAt: '2024-01-22T11:45:00Z'
                },
                {
                    id: 'course004',
                    courseCode: 'CS104',
                    courseName: '数据库原理',
                    credits: 3,
                    teacherId: 't001',
                    departmentId: 'd001',
                    description: '学习数据库系统的基本原理和设计方法。内容包括关系模型、SQL语言、数据库设计、事务处理、并发控制等。通过实际案例，学生将掌握数据库应用系统的设计和开发能力。',
                    maxStudents: 40,
                    currentStudents: 25,
                    category: 'elective',
                    status: 'published',
                    createdAt: '2024-01-08T13:15:00Z',
                    updatedAt: '2024-01-25T15:30:00Z'
                },
                {
                    id: 'course005',
                    courseCode: 'CS105',
                    courseName: '算法设计与分析',
                    credits: 3,
                    teacherId: 't002',
                    departmentId: 'd001',
                    description: '学习算法设计的基本方法和分析技术。涵盖贪心算法、动态规划、分治策略、图算法等经典算法。通过大量编程练习，培养学生设计高效算法和分析算法性能的能力。',
                    maxStudents: 35,
                    currentStudents: 20,
                    category: 'elective',
                    status: 'published',
                    createdAt: '2024-01-05T14:00:00Z',
                    updatedAt: '2024-01-28T09:20:00Z'
                },
                {
                    id: 'course006',
                    courseCode: 'CS106',
                    courseName: 'Web开发实战',
                    credits: 3,
                    teacherId: 't001',
                    departmentId: 'd001',
                    description: '本课程为草稿状态，正在完善中。将涵盖前端开发、后端开发、数据库设计等全栈开发技术，通过实际项目让学生掌握现代Web应用的开发流程。',
                    maxStudents: 30,
                    currentStudents: 0,
                    category: 'practical',
                    status: 'draft',
                    createdAt: '2024-01-30T16:45:00Z',
                    updatedAt: '2024-01-30T16:45:00Z'
                }
            ],
            enrollments: [
                {
                    id: 'en001',
                    studentId: 's001',
                    courseId: 'course001',
                    enrollmentTime: '2024-09-01T00:00:00Z',
                    status: 'active',
                    type: 'enrolled'
                },
                {
                    id: 'en002',
                    studentId: 's002',
                    courseId: 'course001',
                    enrollmentTime: '2024-09-01T00:00:00Z',
                    status: 'active',
                    type: 'enrolled'
                },
                {
                    id: 'en003',
                    studentId: 's003',
                    courseId: 'course001',
                    enrollmentTime: '2024-09-02T00:00:00Z',
                    status: 'active',
                    type: 'enrolled'
                },
                {
                    id: 'en004',
                    studentId: 's001',
                    courseId: 'course002',
                    enrollmentTime: '2024-09-01T00:00:00Z',
                    status: 'active',
                    type: 'enrolled'
                },
                {
                    id: 'en005',
                    studentId: 's003',
                    courseId: 'course003',
                    enrollmentTime: '2024-09-01T00:00:00Z',
                    status: 'active',
                    type: 'enrolled'
                },
                {
                    id: 'en006',
                    studentId: 's002',
                    courseId: 'course004',
                    enrollmentTime: '2024-09-03T00:00:00Z',
                    status: 'active',
                    type: 'enrolled'
                },
                {
                    id: 'en007',
                    studentId: 's003',
                    courseId: 'course004',
                    enrollmentTime: '2024-09-03T00:00:00Z',
                    status: 'active',
                    type: 'enrolled'
                },
                {
                    id: 'en008',
                    studentId: 's001',
                    courseId: 'course005',
                    enrollmentTime: '2024-09-04T00:00:00Z',
                    status: 'active',
                    type: 'enrolled'
                }
            ],
            assignments: [
                {
                    id: 'assign001',
                    title: '线性表实现',
                    description: '实现顺序表和链表的基本操作，包括插入、删除、查找等。',
                    type: 'assignment',
                    courseId: 'course001',
                    maxScore: 100,
                    startTime: '2024-02-01T00:00:00Z',
                    endTime: '2024-02-15T23:59:59Z',
                    createdAt: '2024-01-28T10:00:00Z',
                    updatedAt: '2024-01-28T10:00:00Z'
                },
                {
                    id: 'assign002',
                    title: '二叉树遍历',
                    description: '实现二叉树的前序、中序、后序遍历算法。',
                    type: 'assignment',
                    courseId: 'course001',
                    maxScore: 100,
                    startTime: '2024-02-16T00:00:00Z',
                    endTime: '2024-03-01T23:59:59Z',
                    createdAt: '2024-02-10T14:30:00Z',
                    updatedAt: '2024-02-10T14:30:00Z'
                },
                {
                    id: 'assign003',
                    title: '期中考试',
                    description: '涵盖前半学期所有内容的综合性考试。',
                    type: 'exam',
                    courseId: 'course001',
                    maxScore: 150,
                    startTime: '2024-03-15T09:00:00Z',
                    endTime: '2024-03-15T11:30:00Z',
                    createdAt: '2024-02-20T16:00:00Z',
                    updatedAt: '2024-02-20T16:00:00Z'
                },
                {
                    id: 'assign004',
                    title: '网络编程基础',
                    description: '使用Socket API实现简单的客户端服务器通信程序。',
                    type: 'assignment',
                    courseId: 'course002',
                    maxScore: 100,
                    startTime: '2024-02-05T00:00:00Z',
                    endTime: '2024-02-20T23:59:59Z',
                    createdAt: '2024-02-01T11:00:00Z',
                    updatedAt: '2024-02-01T11:00:00Z'
                },
                {
                    id: 'assign005',
                    title: '数据库设计',
                    description: '为一个简单的图书管理系统设计数据库模式并实现。',
                    type: 'assignment',
                    courseId: 'course004',
                    maxScore: 100,
                    startTime: '2024-02-10T00:00:00Z',
                    endTime: '2024-02-25T23:59:59Z',
                    createdAt: '2024-02-05T15:30:00Z',
                    updatedAt: '2024-02-05T15:30:00Z'
                }
            ],
            submissions: [
                {
                    id: 'sub001',
                    assignmentId: 'assign001',
                    studentId: 's001',
                    submittedTime: '2024-02-12T14:30:00Z',
                    content: '线性表作业完成，包含完整的代码和测试用例。',
                    files: ['linkedlist.cpp', 'testlist.cpp', 'README.md'],
                    status: 'graded',
                    score: 92,
                    feedback: '代码结构清晰，逻辑正确，测试用例完善。',
                    gradedTime: '2024-02-14T10:00:00Z'
                },
                {
                    id: 'sub002',
                    assignmentId: 'assign001',
                    studentId: 's002',
                    submittedTime: '2024-02-13T16:45:00Z',
                    content: '完成了顺序表和链表的实现，代码运行正常。',
                    files: ['seqlist.c', 'linkedlist.c'],
                    status: 'graded',
                    score: 85,
                    feedback: '实现基本正确，建议优化代码注释和错误处理。',
                    gradedTime: '2024-02-14T11:30:00Z'
                },
                {
                    id: 'sub003',
                    assignmentId: 'assign001',
                    studentId: 's003',
                    submittedTime: '2024-02-14T20:15:00Z',
                    content: '线性表作业实现，包含所有要求的功能。',
                    files: ['list.cpp', 'main.cpp'],
                    status: 'pending',
                    score: null,
                    feedback: null,
                    gradedTime: null
                },
                {
                    id: 'sub004',
                    assignmentId: 'assign002',
                    studentId: 's001',
                    submittedTime: '2024-02-25T18:20:00Z',
                    content: '二叉树遍历实现完成，包含递归和非递归版本。',
                    files: ['tree.cpp', 'traversal.cpp'],
                    status: 'pending',
                    score: null,
                    feedback: null,
                    gradedTime: null
                },
                {
                    id: 'sub005',
                    assignmentId: 'assign004',
                    studentId: 's001',
                    submittedTime: '2024-02-18T22:30:00Z',
                    content: 'Socket编程作业，实现了客户端服务器聊天程序。',
                    files: ['client.c', 'server.c', 'protocol.h'],
                    status: 'graded',
                    score: 88,
                    feedback: '功能实现完整，网络协议设计合理。',
                    gradedTime: '2024-02-20T09:00:00Z'
                }
            ],
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

    // 更新数据
    updateData(collection, id, newData) {
        if (!this.data[collection]) {
            console.error(`Collection ${collection} not found`);
            return false;
        }
        
        const index = this.data[collection].findIndex(item => item.id === id);
        if (index === -1) {
            console.error(`Item with id ${id} not found in ${collection}`);
            return false;
        }
        
        // 更新数据，保留原有字段
        this.data[collection][index] = {
            ...this.data[collection][index],
            ...newData,
            updatedAt: new Date().toISOString()
        };
        
        this.saveData();
        return true;
    }

    // 删除数据
    deleteData(collection, id) {
        if (!this.data[collection]) {
            console.error(`Collection ${collection} not found`);
            return false;
        }
        
        const index = this.data[collection].findIndex(item => item.id === id);
        if (index === -1) {
            console.error(`Item with id ${id} not found in ${collection}`);
            return false;
        }
        
        this.data[collection].splice(index, 1);
        this.saveData();
        return true;
    }
}

// 创建全局数据管理器实例
const dataManager = new DataManager();

// 设置为全局变量，供auth.js使用
window.dataManager = dataManager;