// Общие утилиты для системы
const SystemUtils = {
    // Сохранение состояния пользователя
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
    
    // Получение прогресса пользователя
    getUserProgress: function() {
      return JSON.parse(localStorage.getItem('userProgress') || '{}');
    },
    
    // Проверка, доступно ли задание
    isTaskAvailable: function(taskId) {
      // Пока доступно только задание 5
      return taskId === 5;
    },
    
    // Получение следующего доступного задания
    getNextAvailableTask: function(currentTaskId) {
      // В будущем здесь будет логика определения следующего задания
      return currentTaskId + 1 <= 27 ? currentTaskId + 1 : null;
    },
    
    // Форматирование времени
    formatTime: function(seconds) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    
    // Загрузка данных задания
    loadTaskData: function(taskId) {
      // В будущем здесь будет загрузка с сервера
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
    
    // Загрузка тегов для задания
    loadTagsForTask: function(taskId) {
      // В будущем здесь будет загрузка с сервера
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
    
    // Имитация проверки кода
    simulateCodeCheck: function(code, expectedOutput) {
      // В реальной системе здесь будет вызов API проверки
      return new Promise((resolve) => {
        setTimeout(() => {
          const success = Math.random() > 0.3; // 70% успеха для демо
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
  
  // Инициализация системы
  document.addEventListener('DOMContentLoaded', function() {
    // Инициализация глобальных обработчиков
    initGlobalHandlers();
    
    // Проверка аутентификации (в будущем)
    checkAuthStatus();
  });
  
  function initGlobalHandlers() {
    // Глобальные обработчики клавиш
    document.addEventListener('keydown', function(e) {
      // Ctrl+Enter для отправки формы
      if (e.ctrlKey && e.key === 'Enter') {
        const submitBtn = document.querySelector('.submit-btn:not(:disabled)');
        if (submitBtn) {
          submitBtn.click();
        }
      }
    });
  }
  
  function checkAuthStatus() {
    // В будущем здесь будет проверка авторизации
    const userId = localStorage.getItem('userId');
    if (!userId) {
      // Генерация временного ID для демо
      localStorage.setItem('userId', 'demo_' + Date.now());
    }
  }
  
  // Экспорт утилит для использования в других файлах
  window.SystemUtils = SystemUtils;