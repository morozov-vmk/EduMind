const SystemUtils = {
    saveUserProgress: function(taskId, score, timeSpent) {
      const progress = JSON.parse(localStorage.getItem('userProgress') || '{}');
      progress[taskId] = {
        score,
        timeSpent,
        completed: true,
        lastAttempt: new Date().toISOString()
      };
      localStorage.setItem('userProgress', JSON.stringify(progress));
    },
    
    getUserProgress: function() {
      return JSON.parse(localStorage.getItem('userProgress') || '{}');
    },
    
    isTaskAvailable: function(taskId) {
      return taskId === 5;
    },
    
    getNextAvailableTask: function(currentTaskId) {
      return currentTaskId + 1 <= 27 ? currentTaskId + 1 : null;
    },
    
    formatTime: function(seconds) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    
    loadTaskData: function(taskId) {
      const mockData = {
        5: {
          title: "Анализ алгоритмов",
          description: "Работа с двоичными числами и алгоритмами",
          difficulty: "medium",
          points: 1
        }
      };
      
      return mockData[taskId] || null;
    },
    
    loadTagsForTask: function(taskId) {
      const mockTags = {
        5: [
          { id: 'loops', name: 'Циклы', completed: false },
          { id: 'arrays', name: 'Массивы', completed: false },
          { id: 'functions', name: 'Функции', completed: true },
          { id: 'complexity', name: 'Сложность', completed: false }
        ]
      };
      
      return mockTags[taskId] || [];
    },
    
    simulateCodeCheck: function(code, expectedOutput) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const success = Math.random() > 0.3;
          resolve({
            success,
            message: success ? 
              "✅ Код выполняется корректно и выдает правильный результат" :
              "❌ Обнаружены ошибки в выполнении кода",
            details: success ? 
              "Все тесты пройдены успешно" :
              "Проверьте логику алгоритма и граничные случаи"
          });
        }, 1500);
      });
    }
  };
  
  document.addEventListener('DOMContentLoaded', function() {
    initGlobalHandlers();
    checkAuthStatus();
  });
  
  function initGlobalHandlers() {
    document.addEventListener('keydown', function(e) {
      if (e.ctrlKey && e.key === 'Enter') {
        const submitBtn = document.querySelector('.submit-btn:not(:disabled)');
        if (submitBtn) {
          submitBtn.click();
        }
      }
    });
  }
  
  function checkAuthStatus() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      localStorage.setItem('userId', 'demo_' + Date.now());
    }
  }
  
  window.SystemUtils = SystemUtils;