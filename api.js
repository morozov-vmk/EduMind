const API = {
    async checkSolution({ code, answer, problemId, tag, taskNumber }) {
        try {
            const config = await DataLoader.loadConfig();
            const apiKey = config.api.deepseek.apiKey;
            
            if (!apiKey) {
                throw new Error('API ключ DeepSeek не установлен. Добавьте ключ в data/config.json');
            }
            
            const response = await fetch(`${config.api.deepseek.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: config.api.deepseek.model,
                    messages: [
                        {
                            role: 'system',
                            content: `Ты — эксперт по проверке решений задач по программированию для ЕГЭ по информатике.
                            Тема: ${tag}
                            Номер задания: ${taskNumber}
                            ID задачи: ${problemId}
                            
                            Проанализируй решение пользователя и дай развернутый фидбек.
                            Оцени по критериям:
                            1. Корректность синтаксиса (0-2 балла)
                            2. Логика решения (0-3 балла)
                            3. Эффективность алгоритма (0-3 балла)
                            4. Соответствие ответа (0-2 балла)
                            
                            В конце выведи общую оценку в формате: "Оценка: X/10"
                            Где X — сумма баллов по всем критериям.`
                        },
                        {
                            role: 'user',
                            content: `Код пользователя:
\`\`\`python
${code}
\`\`\`

Ответ пользователя: ${answer || 'Не предоставлен'}`
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 2000
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`DeepSeek API ошибка (${response.status}): ${errorText}`);
            }

            const data = await response.json();
            const llmResponse = data.choices[0].message.content;
            
            const score = this.extractScoreFromResponse(llmResponse);
            const success = score >= 7;

            return {
                success,
                score,
                response: this.formatLLMResponse(llmResponse, score),
                details: {
                    llmResponse,
                    timestamp: new Date().toISOString()
                }
            };
            
        } catch (error) {
            console.error('Ошибка проверки решения:', error);
            
            return {
                success: false,
                score: 0,
                response: `
                    <div class="error-message">
                        <h4>❌ Ошибка проверки</h4>
                        <p>${error.message}</p>
                        <p>Проверьте:
                        <ul>
                            <li>API ключ в data/config.json</li>
                            <li>Подключение к интернету</li>
                            <li>Баланс на счету DeepSeek</li>
                        </ul>
                        </p>
                    </div>
                `,
                details: { error: error.message }
            };
        }
    },

    async checkExamSolution({ taskNumber, code, answer, timeSpent }) {
        try {
            const examTask = await DataLoader.loadExamTask(taskNumber);
            const config = await DataLoader.loadConfig();
            const apiKey = config.api.deepseek.apiKey;
            
            if (!apiKey) {
                throw new Error('API ключ DeepSeek не установлен');
            }
            
            const response = await fetch(`${config.api.deepseek.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: config.api.deepseek.model,
                    messages: [
                        {
                            role: 'system',
                            content: `Ты проверяешь решение задачи ЕГЭ по информатике.
                            Задание №${taskNumber}: ${examTask.title}
                            Сложность: ${examTask.difficulty}
                            Правильный ответ: ${examTask.answer}
                            
                            Проанализируй решение пользователя и дай фидбек.
                            Учитывай:
                            1. Правильность алгоритма
                            2. Эффективность решения
                            3. Читаемость кода
                            4. Соответствие ответа
                            
                            Время решения: ${Math.floor(timeSpent / 60)}:${(timeSpent % 60).toString().padStart(2, '0')}
                            
                            В конце выведи оценку в формате: "Оценка ЕГЭ: X/10"`
                        },
                        {
                            role: 'user',
                            content: `Решение пользователя:
\`\`\`python
${code}
\`\`\`

Ответ пользователя: ${answer || 'Не предоставлен'}`
                        }
                    ],
                    temperature: 0.2,
                    max_tokens: 1500
                })
            });

            if (!response.ok) {
                throw new Error(`API ошибка: ${response.status}`);
            }

            const data = await response.json();
            const llmResponse = data.choices[0].message.content;
            
            const score = this.extractScoreFromResponse(llmResponse);
            const isAnswerCorrect = answer === examTask.answer;
            const success = isAnswerCorrect && score >= 8;

            return {
                success,
                score,
                response: this.formatExamResponse(llmResponse, score, isAnswerCorrect, examTask.answer),
                details: {
                    correctAnswer: examTask.answer,
                    userAnswer: answer,
                    timeSpent,
                    isCorrect: isAnswerCorrect
                }
            };
            
        } catch (error) {
            console.error('Ошибка проверки экзамена:', error);
            
            return {
                success: false,
                score: 0,
                response: `
                    <div class="error-message">
                        <h4>❌ Ошибка проверки</h4>
                        <p>${error.message}</p>
                    </div>
                `,
                details: { error: error.message }
            };
        }
    },

    async getHint(taskNumber) {
        try {
            const examTask = await DataLoader.loadExamTask(taskNumber);
            const config = await DataLoader.loadConfig();
            const apiKey = config.api.deepseek.apiKey;
            
            if (!apiKey) {
                return "Для получения подсказки добавьте API ключ в data/config.json";
            }
            
            const response = await fetch(`${config.api.deepseek.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: config.api.deepseek.model,
                    messages: [
                        {
                            role: 'system',
                            content: `Дай подсказку для решения задания ЕГЭ №${taskNumber}.
                            Не давай полное решение, только направляющую подсказку.
                            Подсказка должна быть краткой (1-2 предложения).`
                        },
                        {
                            role: 'user',
                            content: `Задание: ${examTask.title}\n\nУсловие: ${examTask.content.substring(0, 500)}...`
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 200
                })
            });

            if (!response.ok) {
                throw new Error(`API ошибка: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
            
        } catch (error) {
            console.error('Ошибка получения подсказки:', error);
            return "Не удалось получить подсказку. Проверьте подключение к интернету и API ключ.";
        }
    },

    async getSolution(taskNumber) {
        try {
            const examTask = await DataLoader.loadExamTask(taskNumber);
            
            return {
                code: examTask.solutionCode || '# Решение пока не добавлено',
                answer: examTask.answer || 'Неизвестно',
                explanation: examTask.explanation || 'Объяснение решения пока не добавлено.'
            };
            
        } catch (error) {
            console.error('Ошибка получения решения:', error);
            return {
                code: '# Ошибка загрузки решения',
                answer: 'Ошибка',
                explanation: 'Не удалось загрузить решение.'
            };
        }
    },

    extractScoreFromResponse(response) {
        const match = response.match(/(\d+)\/10/);
        return match ? parseInt(match[1]) : 5;
    },

    formatLLMResponse(llmResponse, score) {
        return `
            <div class="llm-response">
                <h4>Ответ DeepSeek (оценка ${score}/10)</h4>
                <div class="response-content">${llmResponse.replace(/\n/g, '<br>')}</div>
            </div>
        `;
    },

    formatExamResponse(llmResponse, score, isAnswerCorrect, correctAnswer) {
        let header = '';
        if (isAnswerCorrect && score >= 9) {
            header = '<h4>✅ Отличная работа!</h4>';
        } else if (isAnswerCorrect && score >= 7) {
            header = '<h4>✓ Задание решено верно</h4>';
        } else if (!isAnswerCorrect) {
            header = `<h4>❌ Ответ неверный</h4><p>Правильный ответ: <strong>${correctAnswer}</strong></p>`;
        } else {
            header = '<h4>⚠ Решение требует доработки</h4>';
        }
        
        return `
            <div class="exam-feedback">
                ${header}
                <p><strong>Оценка: ${score}/10</strong></p>
                <div class="response-content">${llmResponse.replace(/\n/g, '<br>')}</div>
            </div>
        `;
    },

    async checkApiStatus() {
        try {
            const config = await DataLoader.loadConfig();
            const apiKey = config.api.deepseek.apiKey;
            
            if (!apiKey) {
                return { available: false, message: 'API ключ не установлен' };
            }
            
            const response = await fetch(`${config.api.deepseek.baseUrl}/models`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });
            
            return {
                available: response.ok,
                message: response.ok ? 'API доступен' : `API недоступен: ${response.status}`
            };
            
        } catch (error) {
            return {
                available: false,
                message: `API недоступен: ${error.message}`
            };
        }
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const status = await API.checkApiStatus();
        if (!status.available) {
            console.warn('DeepSeek API недоступен:', status.message);
            
            if (!status.message.includes('ключ не установлен')) {
                App.showNotification('DeepSeek API временно недоступен. Используется локальная проверка.', 'warning');
            }
        }
    } catch (error) {
        console.error('Ошибка проверки API:', error);
    }
});

window.API = API;