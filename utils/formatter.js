const Formatter = {
    formatPythonCode(code, indent = 4) {
        const lines = code.split('\n');
        let formatted = '';
        let currentIndent = 0;
        
        for (let line of lines) {
            const trimmed = line.trim();
            
            if (trimmed.length === 0) {
                formatted += '\n';
                continue;
            }
            
            if (trimmed.startsWith('return') || trimmed.startsWith('pass') || 
                trimmed.startsWith('break') || trimmed.startsWith('continue')) {
                currentIndent = Math.max(0, currentIndent - 1);
            }
            
            const indentSpaces = ' '.repeat(currentIndent * indent);
            formatted += indentSpaces + trimmed + '\n';
            
            if (trimmed.endsWith(':')) {
                currentIndent++;
            }
        }
        
        return formatted.trim();
    },

    highlightPython(code) {
        const keywords = [
            'def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while',
            'try', 'except', 'finally', 'with', 'as', 'import', 'from',
            'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is'
        ];
        
        const builtins = [
            'print', 'len', 'range', 'str', 'int', 'float', 'list', 'dict',
            'set', 'tuple', 'abs', 'sum', 'min', 'max', 'sorted', 'reversed'
        ];
        
        let highlighted = code;
        
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            highlighted = highlighted.replace(regex, `<span class="keyword">${keyword}</span>`);
        });
        
        builtins.forEach(func => {
            const regex = new RegExp(`\\b${func}\\(`, 'g');
            highlighted = highlighted.replace(regex, `<span class="builtin">${func}</span>(`);
        });
        
        highlighted = highlighted.replace(/(['"])(.*?)\1/g, '<span class="string">$1$2$1</span>');
        highlighted = highlighted.replace(/(#.*$)/gm, '<span class="comment">$1</span>');
        highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="number">$1</span>');
        
        return highlighted;
    },

    formatDuration(seconds) {
        if (seconds < 60) {
            return `${seconds} сек`;
        }
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (minutes < 60) {
            return `${minutes} мин ${remainingSeconds} сек`;
        }
        
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        
        return `${hours} ч ${remainingMinutes} мин`;
    },

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'сегодня';
        } else if (diffDays === 1) {
            return 'вчера';
        } else if (diffDays < 7) {
            return `${diffDays} дня назад`;
        } else {
            return date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
    },

    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    },

    truncateText(text, maxLength = 100) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    },

    createSlug(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/--+/g, '-')
            .trim();
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    markdownToHtml(markdown) {
        if (!markdown) return '';
        
        let html = markdown;
        
        html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
        
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        html = html.replace(/```python\n([\s\S]*?)```/g, '<pre><code class="python">$1</code></pre>');
        html = html.replace(/```\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        
        html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
        
        html = html.replace(/\n\n/g, '</p><p>');
        html = '<p>' + html + '</p>';
        
        html = html.replace(/<p><\/p>/g, '');
        
        return html;
    }
};

window.Formatter = Formatter;