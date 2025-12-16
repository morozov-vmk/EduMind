const Navigation = {
    saveState: function(page, data) {
      const state = {
        page: page,
        data: data,
        timestamp: Date.now()
      };
      localStorage.setItem('navigationState', JSON.stringify(state));
    },
    
    restoreState: function() {
      const saved = localStorage.getItem('navigationState');
      return saved ? JSON.parse(saved) : null;
    },
    
    goToPage: function(pageUrl, data = {}) {
      this.saveState(pageUrl, data);
      window.location.href = pageUrl;
    },
    
    goBack: function() {
      const state = this.restoreState();
      if (state && state.page) {
        window.location.href = state.page;
      } else {
        window.history.back();
      }
    },
    
    initBackButtons: function() {
      document.querySelectorAll('[data-nav-back]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.goBack();
        });
      });
    }
  };
  
  document.addEventListener('DOMContentLoaded', function() {
    Navigation.initBackButtons();
    
    window.addEventListener('beforeunload', function() {
      Navigation.saveState(window.location.pathname, {});
    });
  });
  
  window.Navigation = Navigation;