
(function () {

    async function request(url, options = {}) {
        const response = await fetch(url, {
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            ...options
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || "Server error");
        }

        return response.json();
    }

    window.API = {

        async loadConfig() {
            return request("/api/config.json");
        },

        async checkSolution({
            code,
            answer,
            problemId,
            tag,
            taskNumber
        }) {
            return request("/api/check-solution", {
                method: "POST",
                body: JSON.stringify({
                    code,
                    answer,
                    problemId,
                    tag,
                    taskNumber
                })
            });
        },

        async checkExamSolution({
            taskNumber,
            code,
            answer,
            timeSpent
        }) {
            return request("/api/check-exam", {
                method: "POST",
                body: JSON.stringify({
                    taskNumber,
                    code,
                    answer,
                    timeSpent
                })
            });
        },

        async getHint(taskNumber) {
            return request(`/api/hint/${taskNumber}`);
        }
    };

})();
