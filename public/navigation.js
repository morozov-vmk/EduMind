const Navigation = {
    history: [],

    init() {
        this.loadHistory();
        this.setupNavigation();
    },

    setupNavigation() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[data-nav]');
            if (link) {
                e.preventDefault();
                this.navigateTo(link.getAttribute('href'));
            }
        });

        window.addEventListener('popstate', () => {
            this.loadPage(window.location.pathname);
        });
    },

    navigateTo(url, data = {}) {
        this.saveState(url, data);
        window.history.pushState(data, '', url);
        this.loadPage(url);
    },

    loadPage(url) {
        fetch(url)
            .then(response => response.text())
            .then(html => {
                document.documentElement.innerHTML = html;
                this.history.push({ url, timestamp: Date.now() });
                this.saveHistory();
            })
            .catch(error => {
                console.error('Ошибка загрузки страницы:', error);
                App.showNotification('Ошибка загрузки страницы', 'error');
            });
    },

    saveState(url, data) {
        const state = {
            url,
            data,
            timestamp: Date.now()
        };
        sessionStorage.setItem('nav_state', JSON.stringify(state));
    },

    loadState() {
        const saved = sessionStorage.getItem('nav_state');
        return saved ? JSON.parse(saved) : null;
    },

    saveHistory() {
        localStorage.setItem('nav_history', JSON.stringify(this.history.slice(-10)));
    },

    loadHistory() {
        const saved = localStorage.getItem('nav_history');
        this.history = saved ? JSON.parse(saved) : [];
    },

    goBack() {
        if (this.history.length > 1) {
            this.history.pop();
            const prevPage = this.history[this.history.length - 1];
            if (prevPage) {
                window.location.href = prevPage.url;
            }
        } else {
            window.history.back();
        }
    },

    getCurrentPage() {
        return window.location.pathname;
    },

    isCurrentPage(url) {
        return this.getCurrentPage() === url;
    },

    updateNavButtons() {
        const currentPage = this.getCurrentPage();
        const navButtons = document.querySelectorAll('[data-nav-current]');
        
        navButtons.forEach(button => {
            const targetPage = button.getAttribute('data-nav-current');
            if (this.isCurrentPage(targetPage)) {
                button.classList.add('active');
                button.disabled = true;
            } else {
                button.classList.remove('active');
                button.disabled = false;
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => Navigation.init());

window.Navigation = Navigation;