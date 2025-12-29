import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));



function extractScore(text) {
    const m = text.match(/(\d+)\/10/);
    return m ? parseInt(m[1], 10) : 5;
}

function formatLLMResponse(htmlTitle, llmResponse, score) {
    return `
        <div class="llm-response">
            <h4>${htmlTitle} (${score}/10)</h4>
            <div class="response-content">
                ${llmResponse.replace(/\n/g, "<br>")}
            </div>
        </div>
    `;
}

function loadExamTask(taskNumber) {
    const file = path.join(__dirname, "data", "exam", `task${taskNumber}.json`);
    if (!fs.existsSync(file)) {
        throw new Error(`Экзаменационное задание ${taskNumber} не найдено`);
    }
    return JSON.parse(fs.readFileSync(file, "utf8"));
}


app.post("/api/check-solution", async (req, res) => {
    console.log('run_deepseek');
    const { code, answer, problemId, tag, taskNumber } = req.body;

    if (!code || !problemId || !tag || !taskNumber) {
        return res.status(400).json({
            success: false,
            score: 0,
            response: `<div class="error-message">Некорректные данные</div>`
        });
    }

    try {
        const r = await fetch("https://api.deepseek.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                temperature: 0.3,
                max_tokens: 2000,
                messages: [
                    {
                        role: "system",
                        content: `
Ты — эксперт по проверке решений задач по программированию для ЕГЭ по информатике.
Тема: ${tag}
Номер задания: ${taskNumber}
ID задачи: ${problemId}

Проанализируй решение пользователя и дай развернутый фидбек.
Оцени по критериям:
1. Корректность синтаксиса (0-2)
2. Логика решения (0-3)
3. Эффективность (0-3)
4. Соответствие ответа (0-2)

В конце: "Оценка: X/10"
`
                    },
                    {
                        role: "user",
                        content: `
\`\`\`python
${code}
\`\`\`

Ответ: ${answer || "не указан"}
`
                    }
                ]
            })
        });

        const data = await r.json();
        const llm = data.choices?.[0]?.message?.content || "";
        const score = extractScore(llm);

        res.json({
            success: score >= 7,
            score,
            response: formatLLMResponse("Ответ DeepSeek", llm, score),
            details: { llm }
        });

    } catch (e) {
        res.status(500).json({
            success: false,
            score: 0,
            response: `<div class="error-message">${e.message}</div>`
        });
    }
});


app.post("/api/check-exam", async (req, res) => {
    const { taskNumber, code, answer, timeSpent } = req.body;

    try {
        const examTask = loadExamTask(taskNumber);

        const r = await fetch("https://api.deepseek.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                temperature: 0.2,
                max_tokens: 1500,
                messages: [
                    {
                        role: "system",
                        content: `
Ты проверяешь решение задачи ЕГЭ №${taskNumber}.
Правильный ответ: ${examTask.answer}
Время решения: ${timeSpent} сек.

В конце: "Оценка ЕГЭ: X/10"
`
                    },
                    {
                        role: "user",
                        content: `
\`\`\`python
${code}
\`\`\`

Ответ пользователя: ${answer}
`
                    }
                ]
            })
        });

        const data = await r.json();
        const llm = data.choices?.[0]?.message?.content || "";
        const score = extractScore(llm);
        const correct = answer === examTask.answer;

        res.json({
            success: correct && score >= 8,
            score,
            response: formatLLMResponse("Экзамен", llm, score),
            details: { correct, examTask }
        });

    } catch (e) {
        res.status(500).json({
            success: false,
            score: 0,
            response: `<div class="error-message">${e.message}</div>`
        });
    }
});


app.get("/api/hint/:taskNumber", async (req, res) => {
    try {
        const examTask = loadExamTask(req.params.taskNumber);

        const r = await fetch("https://api.deepseek.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                temperature: 0.7,
                max_tokens: 200,
                messages: [
                    {
                        role: "system",
                        content: "Дай краткую подсказку, без решения."
                    },
                    {
                        role: "user",
                        content: examTask.title
                    }
                ]
            })
        });

        const data = await r.json();
        res.send(data.choices?.[0]?.message?.content || "!Нет подсказки");

    } catch (e) {
        res.send("Подсказка недоступна");
    }
});

app.get("/api/config.json", (req, res) => {
    try {
      const configPath = path.join(__dirname, "data", "config.json");
      if (!fs.existsSync(configPath)) return res.status(404).json({ error: "!Конфигурация не найдена" });
      const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      res.json(config);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  
  app.get("/api/tasks/:taskNumber", (req, res) => {
    try {
      const taskPath = path.join(__dirname, "data", "tasks", `${req.params.taskNumber}.json`);
      if (!fs.existsSync(taskPath)) return res.status(404).json({ error: `!Задание ${req.params.taskNumber} не найдено` });
      const task = JSON.parse(fs.readFileSync(taskPath, "utf8"));
      res.json(task);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  
  app.get("/api/exam/:taskNumber", (req, res) => {
    try {
      const examPath = path.join(__dirname, "data", "exam", `${req.params.taskNumber}.json`);
      console.log(examPath)
      if (!fs.existsSync(examPath)) return res.status(404).json({ error: `!Экзаменационное задание ${req.params.taskNumber} не найдено` });
      const examTask = JSON.parse(fs.readFileSync(examPath, "utf8"));
      res.json(examTask);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  
  app.get("/api/tags/:tagId/:file", (req, res) => {
    try {
      const filePath = path.join(__dirname, "data", "tags", req.params.tagId, req.params.file);
      if (!fs.existsSync(filePath)) return res.status(404).json({ error: "!Файл не найден" });
  
      if (req.params.file.endsWith(".json")) {
        const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
        res.json(content);
      } else {
        const content = fs.readFileSync(filePath, "utf8");
        res.send(content);
      }
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/list-folder', (req, res) => {
    const folderPath = path.join(__dirname, 'data');
    fs.readdir(folderPath, { withFileTypes: true }, (err, files) => {
      if (err) return res.status(500).json({ error: err.message });
  
      const result = files.map(f => ({
        name: f.name,
        type: f.isDirectory() ? 'dir' : 'file',
      }));
      res.json(result);
    });
  });
  

app.listen(3000, () => {
    console.log("http://localhost:3000");
});
