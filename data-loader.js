const DataLoader = {
    basePath: './data',
    cache: {
        config: null,
        tasks: {},
        tags: {},
        examTasks: {}
    },

    async loadConfig() {
        if (this.cache.config) return this.cache.config;
        
        try {
            const response = await fetch(`${this.basePath}/config.json`);
            if (!response.ok) throw new Error('Не удалось загрузить конфигурацию');
            
            this.cache.config = await response.json();
            return this.cache.config;
        } catch (error) {
            console.error('Ошибка загрузки конфигурации:', error);
            return {
                api: { deepseek: { baseUrl: '', model: 'deepseek-chat', apiKey: '' } },
                availableTasks: [5],
                appName: 'Система подготовки к ЕГЭ'
            };
        }
    },

    async loadAllTasks() {
        try {
            const tasks = {};
            const config = await this.loadConfig();
            
            for (let i = 1; i <= 27; i++) {
                try {
                    const task = await this.loadTask(i);
                    task.available = config.availableTasks?.includes(i) || false;
                    tasks[i] = task;
                } catch (error) {
                    tasks[i] = {
                        number: i,
                        title: `Задание ${i}`,
                        available: config.availableTasks?.includes(i) || false,
                        difficulty: 'Не определена',
                        tags: []
                    };
                }
            }
            
            this.cache.tasks = tasks;
            return tasks;
        } catch (error) {
            console.error('Ошибка загрузки всех заданий:', error);
            return {};
        }
    },

    async loadTask(taskNumber) {
        if (this.cache.tasks[taskNumber]) return this.cache.tasks[taskNumber];
        
        try {
            const response = await fetch(`${this.basePath}/tasks/task${taskNumber}.json`);
            if (!response.ok) throw new Error(`Задание ${taskNumber} не найдено`);
            
            const task = await response.json();
            task.number = taskNumber;
            
            this.cache.tasks[taskNumber] = task;
            return task;
        } catch (error) {
            console.error(`Ошибка загрузки задания ${taskNumber}:`, error);
            throw error;
        }
    },

    async loadTag(tagId) {
        if (this.cache.tags[tagId]) return this.cache.tags[tagId];
        
        try {
            const [theory, problems, meta] = await Promise.all([
                this.loadTagTheory(tagId),
                this.loadTagProblems(tagId),
                this.loadTagMeta(tagId)
            ]);
            
            const tagData = {
                id: tagId,
                name: meta?.name || tagId,
                description: meta?.description || 'Изучите теорию и практикуйтесь',
                theory,
                problems,
                color: meta?.color || '#3498db',
                progress: this.getUserProgress(tagId)?.progress || 0
            };
            
            this.cache.tags[tagId] = tagData;
            return tagData;
        } catch (error) {
            console.error(`Ошибка загрузки тега ${tagId}:`, error);
            return {
                id: tagId,
                name: tagId,
                description: 'Тег в разработке',
                theory: 'Теория пока не добавлена.',
                problems: [],
                progress: 0
            };
        }
    },

    async loadTagTheory(tagId) {
        try {
            const response = await fetch(`${this.basePath}/tags/${tagId}/theory.md`);
            return response.ok ? await response.text() : 'Теория пока не добавлена.';
        } catch (error) {
            return 'Теория пока не добавлена.';
        }
    },

    async loadTagProblems(tagId) {
        try {
            const response = await fetch(`${this.basePath}/tags/${tagId}/problems.json`);
            return response.ok ? await response.json() : [];
        } catch (error) {
            return [];
        }
    },

    async loadTagMeta(tagId) {
        try {
            const response = await fetch(`${this.basePath}/tags/${tagId}/meta.json`);
            return response.ok ? await response.json() : null;
        } catch (error) {
            return null;
        }
    },

    async loadExamTask(taskNumber) {
        if (this.cache.examTasks[taskNumber]) return this.cache.examTasks[taskNumber];
        
        try {
            const response = await fetch(`${this.basePath}/exam/task${taskNumber}.json`);
            if (!response.ok) throw new Error(`Экзаменационное задание ${taskNumber} не найдено`);
            
            const examTask = await response.json();
            examTask.number = taskNumber;
            
            this.cache.examTasks[taskNumber] = examTask;
            return examTask;
        } catch (error) {
            console.error(`Ошибка загрузки экзаменационного задания ${taskNumber}:`, error);
            return {
                number: taskNumber,
                title: `Задание ${taskNumber}`,
                content: 'Содержание задания пока не добавлено.',
                difficulty: 'Не определена',
                tags: []
            };
        }
    },

    setCurrentTask(taskNumber) {
        localStorage.setItem('current_task', taskNumber);
    },

    getCurrentTask() {
        return parseInt(localStorage.getItem('current_task')) || 5;
    },

    setCurrentTag(tagId) {
        localStorage.setItem('current_tag', tagId);
    },

    getCurrentTag() {
        return localStorage.getItem('current_tag') || 'loops';
    },

    saveUserProgress(tagId, progress) {
        const userData = this.getUserData();
        userData.progress = userData.progress || {};
        userData.progress[tagId] = progress;
        this.saveUserData(userData);
    },

    getUserProgress(tagId) {
        const userData = this.getUserData();
        return userData.progress?.[tagId] || null;
    },

    saveExamResult(taskNumber, result) {
        const userData = this.getUserData();
        userData.examResults = userData.examResults || {};
        userData.examResults[taskNumber] = result;
        this.saveUserData(userData);
    },

    getExamResult(taskNumber) {
        const userData = this.getUserData();
        return userData.examResults?.[taskNumber] || null;
    },

    getUserStatistics() {
        const userData = this.getUserData();
        const examResults = userData.examResults || {};
        const progress = userData.progress || {};
        
        const completedTasks = Object.keys(examResults).length;
        const totalTasks = 27;
        
        const successfulTasks = Object.values(examResults).filter(r => r.success).length;
        const accuracy = completedTasks > 0 ? Math.round((successfulTasks / completedTasks) * 100) : 0;
        
        const totalTime = Object.values(examResults).reduce((sum, r) => sum + (r.timeSpent || 0), 0);
        const averageTime = completedTasks > 0 ? Math.round(totalTime / completedTasks) : 0;
        
        const totalScore = Object.values(examResults).reduce((sum, r) => sum + (r.score || 0), 0);
        
        const tagCount = Object.keys(progress).length;
        const progressPercent = Math.min(Math.round((completedTasks / totalTasks) * 100), 100);
        
        return {
            completedTasks,
            totalTasks,
            accuracy,
            averageTime: this.formatTime(averageTime),
            totalScore,
            tagCount,
            progress: progressPercent
        };
    },

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    },

    getUserData() {
        const saved = localStorage.getItem('user_data');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Ошибка загрузки пользовательских данных:', e);
            }
        }
        return {};
    },

    saveUserData(data) {
        localStorage.setItem('user_data', JSON.stringify(data));
    },

    getAllUserData() {
        return this.getUserData();
    },

    clearCache() {
        this.cache = {
            config: null,
            tasks: {},
            tags: {},
            examTasks: {}
        };
    },

    resetUserData() {
        localStorage.removeItem('user_data');
        localStorage.removeItem('current_task');
        localStorage.removeItem('current_tag');
        this.clearCache();
    }
};

window.DataLoader = DataLoader;