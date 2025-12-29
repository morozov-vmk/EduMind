const App = {
    config: null,
    userData: null,

    async init() {
        try {
            this.config = await DataLoader.loadConfig();
            this.userData = DataLoader.getUserData();
            
            this.setupEventListeners();
            this.loadUserPreferences();
            
            console.log('Система подготовки к ЕГЭ инициализирована');
        } catch (error) {
            console.error('Ошибка инициализации приложения:', error);
            this.showNotification('Ошибка загрузки конфигурации', 'error');
        }
    },

    setupEventListeners() {
        window.addEventListener('error', this.handleGlobalError.bind(this));
        window.addEventListener('beforeunload', this.saveAppState.bind(this));
        
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveCurrentCode();
            }
            
            if (e.ctrlKey && e.shiftKey && e.key === 'H') {
                e.preventDefault();
                this.toggleHint();
            }
        });
    },

    handleGlobalError(error) {
        console.error('Глобальная ошибка:', error);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'global-error';
        errorDiv.innerHTML = `
            <div class="error-content">
                <h4>Произошла ошибка</h4>
                <p>${error.message || 'Пожалуйста, обновите страницу или попробуйте позже.'}</p>
                <button onclick="this.parentElement.parentElement.remove()">Закрыть</button>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
    },

    saveCurrentCode() {
        const codeInput = document.getElementById('codeInput') || document.getElementById('examCodeInput');
        if (codeInput && codeInput.value) {
            const taskId = DataLoader.getCurrentTask() || 'unsaved';
            localStorage.setItem(`code_${taskId}`, codeInput.value);
            this.showNotification('Код сохранен локально', 'success');
        }
    },

    loadSavedCode(taskId) {
        const savedCode = localStorage.getItem(`code_${taskId}`);
        const codeInput = document.getElementById('codeInput') || document.getElementById('examCodeInput');
        
        if (codeInput && savedCode) {
            codeInput.value = savedCode;
            this.showNotification('Код загружен из сохранения', 'info');
        }
    },

    toggleHint() {
        const hintElement = document.querySelector('.hint-content');
        if (hintElement) {
            hintElement.style.display = hintElement.style.display === 'none' ? 'block' : 'none';
        }
    },

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    },

    saveAppState() {
        const state = {
            timestamp: new Date().toISOString(),
            currentTask: DataLoader.getCurrentTask(),
            currentTag: DataLoader.getCurrentTag(),
            userData: this.userData
        };
        
        localStorage.setItem('app_state', JSON.stringify(state));
    },

    loadAppState() {
        const saved = localStorage.getItem('app_state');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Ошибка загрузки состояния:', e);
            }
        }
        return null;
    },

    loadUserPreferences() {
        const prefs = localStorage.getItem('user_preferences');
        if (prefs) {
            try {
                const preferences = JSON.parse(prefs);
                this.applyPreferences(preferences);
            } catch (e) {
                console.error('Ошибка загрузки настроек:', e);
            }
        }
    },

    applyPreferences(prefs) {
        if (prefs.theme === 'dark') {
            document.body.classList.add('dark-theme');
        }
        
        if (prefs.fontSize) {
            document.documentElement.style.fontSize = prefs.fontSize;
        }
    },

    saveUserPreferences(prefs) {
        const current = JSON.parse(localStorage.getItem('user_preferences') || '{}');
        const updated = { ...current, ...prefs };
        localStorage.setItem('user_preferences', JSON.stringify(updated));
        this.applyPreferences(updated);
    },

    checkBrowserSupport() {
        const requiredFeatures = ['localStorage', 'fetch', 'Promise', 'FileReader'];
        const unsupported = requiredFeatures.filter(feature => !window[feature]);
        
        if (unsupported.length > 0) {
            console.warn('Не поддерживаемые функции:', unsupported);
            return false;
        }
        
        return true;
    },

    onPageLoad() {
        if (!this.checkBrowserSupport()) {
            this.showNotification('Ваш браузер устарел. Некоторые функции могут не работать.', 'warning');
        }
        
        this.init();
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.onPageLoad());
} else {
    App.onPageLoad();
}

window.App = App;