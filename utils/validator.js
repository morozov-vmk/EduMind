const Validator = {
    validatePythonCode(code) {
        const errors = [];
        const warnings = [];
        
        if (!code || code.trim().length === 0) {
            errors.push('Код не может быть пустым');
            return { isValid: false, errors, warnings };
        }
        
        const lines = code.split('\n');
        let hasIndentation = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            
            if (trimmed.length === 0) continue;
            
            if (trimmed.endsWith(':') && i < lines.length - 1) {
                const nextLine = lines[i + 1];
                if (nextLine && !nextLine.startsWith(' ') && !nextLine.startsWith('\t')) {
                    warnings.push(`Строка ${i + 2}: ожидается отступ после двоеточия`);
                }
            }
            
            if (line.startsWith(' ') || line.startsWith('\t')) {
                hasIndentation = true;
            }
        }
        
        if (!hasIndentation && lines.length > 1) {
            warnings.push('Код не содержит отступов. Используйте отступы для повышения читаемости.');
        }
        
        const errorPatterns = [
            { pattern: /print\s*\([^)]*\)\s*;/, message: 'Использование точки с запятой в Python не рекомендуется' },
            { pattern: /==\s*True/, message: 'Вместо "== True" используйте просто условие' },
            { pattern: /==\s*False/, message: 'Вместо "== False" используйте "not условие"' },
            { pattern: /for\s+[a-z]\s+in/, message: 'Использование однобуквенных переменных в циклах снижает читаемость' }
        ];
        
        errorPatterns.forEach(pattern => {
            if (pattern.pattern.test(code)) {
                warnings.push(pattern.message);
            }
        });
        
        if (code.includes('while True:') && !code.includes('break')) {
            warnings.push('Потенциально бесконечный цикл. Убедитесь, что есть условие выхода.');
        }
        
        if (code.includes('input(') && !code.includes('int(') && !code.includes('float(')) {
            warnings.push('Ввод пользователя обрабатывается как строка. Проверьте необходимость преобразования типов.');
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            lineCount: lines.length,
            charCount: code.length
        };
    },

    validateAnswer(answer, expectedType = 'any') {
        const result = {
            isValid: true,
            type: typeof answer,
            normalized: answer,
            error: null
        };
        
        if (answer === null || answer === undefined || answer === '') {
            result.isValid = false;
            result.error = 'Ответ не может быть пустым';
            return result;
        }
        
        switch (expectedType) {
            case 'number':
                const num = Number(answer);
                if (isNaN(num)) {
                    result.isValid = false;
                    result.error = 'Ответ должен быть числом';
                } else {
                    result.normalized = num;
                }
                break;
                
            case 'integer':
                const int = parseInt(answer);
                if (isNaN(int) || !Number.isInteger(int)) {
                    result.isValid = false;
                    result.error = 'Ответ должен быть целым числом';
                } else {
                    result.normalized = int;
                }
                break;
                
            case 'float':
                const float = parseFloat(answer);
                if (isNaN(float)) {
                    result.isValid = false;
                    result.error = 'Ответ должен быть числом с плавающей точкой';
                } else {
                    result.normalized = float;
                }
                break;
                
            case 'boolean':
                if (typeof answer === 'string') {
                    const lower = answer.toLowerCase();
                    if (lower === 'true' || lower === '1' || lower === 'да') {
                        result.normalized = true;
                    } else if (lower === 'false' || lower === '0' || lower === 'нет') {
                        result.normalized = false;
                    } else {
                        result.isValid = false;
                        result.error = 'Ответ должен быть логическим значением (true/false)';
                    }
                }
                break;
                
            case 'array':
                try {
                    if (typeof answer === 'string') {
                        const parsed = JSON.parse(answer);
                        if (!Array.isArray(parsed)) {
                            throw new Error('Не массив');
                        }
                        result.normalized = parsed;
                    } else if (!Array.isArray(answer)) {
                        result.isValid = false;
                        result.error = 'Ответ должен быть массивом';
                    }
                } catch (e) {
                    result.isValid = false;
                    result.error = 'Неверный формат массива';
                }
                break;
        }
        
        return result;
    },

    validateFileName(filename, allowedExtensions = ['.py', '.txt']) {
        const errors = [];
        
        if (!filename) {
            errors.push('Имя файла не может быть пустым');
            return { isValid: false, errors };
        }
        
        if (filename.length > 255) {
            errors.push('Имя файла слишком длинное (максимум 255 символов)');
        }
        
        const forbiddenChars = /[<>:"/\\|?*\x00-\x1F]/;
        if (forbiddenChars.test(filename)) {
            errors.push('Имя файла содержит запрещенные символы');
        }
        
        const hasValidExtension = allowedExtensions.some(ext => 
            filename.toLowerCase().endsWith(ext.toLowerCase())
        );
        
        if (!hasValidExtension) {
            errors.push(`Разрешение файла должно быть одним из: ${allowedExtensions.join(', ')}`);
        }
        
        const reservedNames = [
            'CON', 'PRN', 'AUX', 'NUL',
            'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
            'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
        ];
        
        const nameWithoutExt = filename.split('.')[0].toUpperCase();
        if (reservedNames.includes(nameWithoutExt)) {
            errors.push('Имя файла зарезервировано системой');
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            filename,
            extension: filename.split('.').pop().toLowerCase()
        };
    },

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(email);
        
        return {
            isValid,
            error: isValid ? null : 'Неверный формат email'
        };
    },

    validatePassword(password, options = {}) {
        const {
            minLength = 8,
            requireUppercase = true,
            requireLowercase = true,
            requireNumbers = true,
            requireSpecialChars = false
        } = options;
        
        const errors = [];
        
        if (!password) {
            errors.push('Пароль не может быть пустым');
            return { isValid: false, errors };
        }
        
        if (password.length < minLength) {
            errors.push(`Пароль должен содержать минимум ${minLength} символов`);
        }
        
        if (requireUppercase && !/[A-ZА-Я]/.test(password)) {
            errors.push('Пароль должен содержать хотя бы одну заглавную букву');
        }
        
        if (requireLowercase && !/[a-zа-я]/.test(password)) {
            errors.push('Пароль должен содержать хотя бы одну строчную букву');
        }
        
        if (requireNumbers && !/\d/.test(password)) {
            errors.push('Пароль должен содержать хотя бы одну цифру');
        }
        
        if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Пароль должен содержать хотя бы один специальный символ');
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            strength: this.calculatePasswordStrength(password)
        };
    },

    calculatePasswordStrength(password) {
        if (!password) return 0;
        
        let score = 0;
        
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;
        if (password.length >= 16) score += 1;
        
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/\d/.test(password)) score += 1;
        if (/[^a-zA-Z0-9]/.test(password)) score += 1;
        
        const maxScore = 7;
        const percentage = Math.round((score / maxScore) * 100);
        
        let level = 'слабый';
        if (percentage >= 60) level = 'средний';
        if (percentage >= 80) level = 'сильный';
        if (percentage >= 95) level = 'очень сильный';
        
        return {
            score: percentage,
            level,
            feedback: this.getPasswordFeedback(percentage)
        };
    },

    getPasswordFeedback(score) {
        if (score < 40) {
            return 'Пароль очень слабый. Добавьте больше символов разных типов.';
        } else if (score < 60) {
            return 'Пароль слабый. Попробуйте добавить заглавные буквы и цифры.';
        } else if (score < 80) {
            return 'Пароль средний. Добавьте специальные символы для усиления.';
        } else if (score < 95) {
            return 'Пароль сильный. Хорошая работа!';
        } else {
            return 'Пароль очень сильный. Отличная защита!';
        }
    },

    validateJSON(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            return {
                isValid: true,
                parsed,
                error: null
            };
        } catch (error) {
            return {
                isValid: false,
                parsed: null,
                error: error.message
            };
        }
    },

    validateURL(url) {
        try {
            new URL(url);
            return {
                isValid: true,
                error: null
            };
        } catch (error) {
            return {
                isValid: false,
                error: 'Неверный формат URL'
            };
        }
    },

    validatePhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        
        let isValid = false;
        let formatted = phone;
        
        if (cleaned.length === 11 && (cleaned.startsWith('7') || cleaned.startsWith('8'))) {
            isValid = true;
            formatted = `+7 (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7, 9)}-${cleaned.substring(9, 11)}`;
        } else if (cleaned.length === 10 && cleaned.startsWith('9')) {
            isValid = true;
            formatted = `+7 (${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 8)}-${cleaned.substring(8, 10)}`;
        }
        
        return {
            isValid,
            formatted: isValid ? formatted : phone,
            error: isValid ? null : 'Неверный формат номера телефона'
        };
    }
};

window.Validator = Validator;