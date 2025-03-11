document.addEventListener('DOMContentLoaded', () => {
    let stages = [];
    let risks = [];
    let updateIntervalId = null;

    const typicalRisks = [
        { name: "Задержка в разработке", probability: 0.4, impactTime: 10, impactCost: 5000, strategy: "Mitigate" },
        { name: "Отсутствие сотрудников", probability: 0.3, impactTime: 30, impactCost: 10000, strategy: "Eliminate" },
        { name: "Задержка поставки оборудования", probability: 0.3, impactTime: 15, impactCost: 7000, strategy: "Mitigate" },
        { name: "Неправильное планирование", probability: 0.5, impactTime: 20, impactCost: 15000, strategy: "Mitigate" },
        { name: "Кибератака", probability: 0.2, impactTime: 15, impactCost: 20000, strategy: "Eliminate" }
    ];

    // Функция для получения токена авторизации
    async function fetchToken() {
        try {
            const response = await fetch('http://localhost:8088/api/v1/security/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: 'admin', // Проверьте логин
                    password: 'admin', // Проверьте пароль
                    provider: 'db'
                })
            });

            if (!response.ok) {
                throw new Error(`Ошибка получения токена: ${response.status} - ${response.statusText}`);
            }
            const data = await response.json();
            const token = data.access_token;
            if (!token) throw new Error('Токен не найден в ответе сервера');
            console.log('Новый токен получен:', token);
            localStorage.setItem('superset_token', token);
            return token;
        } catch (error) {
            console.error('Ошибка при получении токена:', error);
            return null;
        }
    }

    // Функция для загрузки данных дашборда
    function fetchDashboardData(maxAttempts = 3, attempt = 1) {
        let token = localStorage.getItem('superset_token');
        if (!token) {
            console.warn('Токен не найден в localStorage, запрашиваю новый...');
            fetchToken().then(newToken => {
                if (newToken) {
                    token = newToken;
                    localStorage.setItem('superset_token', token);
                    proceedWithFetch(token, maxAttempts, attempt);
                } else if (attempt < maxAttempts) {
                    console.log(`Попытка ${attempt + 1} из ${maxAttempts}...`);
                    setTimeout(() => fetchDashboardData(maxAttempts, attempt + 1), 2000); // Увеличим задержку до 2 секунд
                } else {
                    alert("Не удалось получить токен после " + maxAttempts + " попыток. Дашборд не обновлен.");
                }
            });
            return;
        }
        proceedWithFetch(token, maxAttempts, attempt);

        function proceedWithFetch(token, maxAttempts, attempt) {
            Promise.all([
                fetch('http://localhost:8088/api/v1/chart/121', { // Обновлен на 121
                    headers: { 'Authorization': `Bearer ${token}` },
                    signal: AbortSignal.timeout(5000)
                }).then(res => {
                    if (!res.ok) throw new Error(`Ошибка при получении метрик: ${res.status} - ${res.statusText}`);
                    return res.json();
                }),
                fetch('http://localhost:8088/api/v1/chart/122', { // Обновлен на 122
                    headers: { 'Authorization': `Bearer ${token}` },
                    signal: AbortSignal.timeout(5000)
                }).then(res => {
                    if (!res.ok) throw new Error(`Ошибка при получении рисков: ${res.status} - ${res.statusText}`);
                    return res.json();
                }),
                fetch('http://localhost:8088/api/v1/dashboard/13', {
                    headers: { 'Authorization': `Bearer ${token}` },
                    signal: AbortSignal.timeout(5000)
                }).then(res => {
                    if (!res.ok) throw new Error(`Ошибка при получении дашборда: ${res.status} - ${res.statusText}`);
                    return res.json();
                })
            ])
            .then(([metrics, risksData, dashboardData]) => {
                updateDashboard(metrics.result, risksData.result, dashboardData.result);
            })
            .catch(error => {
                console.error("Ошибка при загрузке данных дашборда:", error);
                if ((error.message.includes('422') || error.message.includes('401')) && attempt < maxAttempts) {
                    console.warn('Проблема с авторизацией, запрашиваю новый токен...');
                    fetchToken().then(newToken => {
                        if (newToken) {
                            localStorage.setItem('superset_token', newToken);
                            proceedWithFetch(newToken, maxAttempts, attempt + 1);
                        } else {
                            console.log(`Попытка ${attempt + 1} из ${maxAttempts} не удалась.`);
                            setTimeout(() => fetchDashboardData(maxAttempts, attempt + 1), 2000);
                        }
                    });
                } else {
                    alert("Невозможно получить данные дашборда: " + error.message);
                }
            });
        }
    }

    // Функция обновления дашборда
    function updateDashboard(metrics, risks, dashboardData) {
        const summary = document.getElementById('dashboardSummary');
        const riskTable = document.getElementById('riskResultsTable');
        const recDiv = document.getElementById('recommendations');

        if (!metrics?.result || !metrics.result[0]) {
            console.error("Метрики не найдены или результат пустой:", metrics);
            summary.innerHTML = "<p>Ошибка: Метрики не загружены.</p>";
            return;
        }

        summary.innerHTML = `
            <h3>Ключевые метрики</h3>
            <p>Общее время проекта: ${metrics.result[0]?.total_time ? metrics.result[0].total_time.toFixed(1) : 'N/A'} дней</p>
            <p>Общая стоимость проекта: $${metrics.result[0]?.total_cost ? metrics.result[0].total_cost.toFixed(0) : 'N/A'}</p>
            <p>Стратегия управления: ${metrics.result[0]?.mitigation_strategy || 'N/A'}</p>
            <p>Бюджет на управление: $${metrics.result[0]?.mitigation_budget ? metrics.result[0].mitigation_budget.toFixed(0) : 'N/A'}</p>
        `;

        while (riskTable.rows.length > 1) riskTable.deleteRow(1);
        if (risks?.result) {
            risks.result.forEach(risk => {
                const row = riskTable.insertRow();
                row.insertCell().textContent = risk.name || 'N/A';
                row.insertCell().textContent = risk.mitigated ? "Да" : "Нет";
                row.insertCell().textContent = risk.impact_time || 0;
                row.insertCell().textContent = risk.impact_cost || 0;
                row.insertCell().textContent = risk.strategy || "Игнорировать (по умолчанию)";
            });
        }

        const recommendations = generateRecommendations(metrics.result, risks?.result || []);
        recDiv.innerHTML = `
            <h3>Рекомендации и прогнозы</h3>
            ${recommendations.map(rec => `<p>${rec}</p>`).join('')}
        `;
    }

    // Генерация рекомендаций
    function generateRecommendations(metrics, risks) {
        const recs = [];
        if (metrics[0]?.total_cost > 50000) {
            recs.push("Рассмотрите оптимизацию бюджета: текущая стоимость превышает 50,000$.");
        }
        if (risks.some(r => r.probability > 0.4)) {
            recs.push("Обратите внимание на риски с высокой вероятностью (>0.4).");
        }
        if (metrics[0]?.total_time > 100) {
            recs.push("Проект может быть затянут (более 100 дней). Рассмотрите ускорение этапов.");
        }
        return recs.length ? recs : ["Нет критических рекомендаций на данный момент."];
    }

    // Запуск периодического обновления
    window.startUpdates = function() {
        const intervalInput = document.getElementById('updateInterval');
        const interval = parseInt(intervalInput.value) * 1000;
        if (interval < 10000) {
            alert("Интервал должен быть не менее 10 секунд.");
            return;
        }
        if (updateIntervalId) {
            clearInterval(updateIntervalId);
        }
        fetchDashboardData(); // Первоначальное обновление
        updateIntervalId = setInterval(fetchDashboardData, interval);
        alert(`Обновление запущено с интервалом ${interval / 1000} секунд.`);
    };

    // Остановка обновления
    window.stopUpdates = function() {
        if (updateIntervalId) {
            clearInterval(updateIntervalId);
            updateIntervalId = null;
            alert("Обновление остановлено.");
        } else {
            alert("Обновление не запущено.");
        }
    };

    // Добавление этапа
    window.addStage = function() {
        const stageName = document.getElementById('stageName');
        const stageDuration = document.getElementById('stageDuration');
        const stageCost = document.getElementById('stageCost');
        const name = stageName.value;
        const duration = parseFloat(stageDuration.value);
        const cost = parseFloat(stageCost.value);
        if (name && !isNaN(duration) && !isNaN(cost)) {
            stages.push({ name, duration, cost });
            updateStagesTable();
            stageName.value = '';
            stageDuration.value = '';
            stageCost.value = '';
        } else {
            alert("Пожалуйста, заполните все поля корректно (продолжительность и стоимость должны быть числами)");
        }
    };

    function updateStagesTable() {
        const table = document.getElementById('stagesTable');
        while (table.rows.length > 1) table.deleteRow(1);
        stages.forEach(stage => {
            const row = table.insertRow();
            row.insertCell().textContent = stage.name;
            row.insertCell().textContent = stage.duration;
            row.insertCell().textContent = stage.cost;
        });
    }

    // Добавление риска
    window.addRisk = function() {
        const riskName = document.getElementById('riskName');
        const riskProb = document.getElementById('riskProb');
        const riskTime = document.getElementById('riskTime');
        const riskCost = document.getElementById('riskCost');
        const riskStrategy = document.getElementById('riskStrategy');
        const name = riskName.value;
        const probability = parseFloat(riskProb.value);
        const impactTime = parseFloat(riskTime.value);
        const impactCost = parseFloat(riskCost.value);
        const strategy = riskStrategy.value || "Ignore";
        if (name && !isNaN(probability) && !isNaN(impactTime) && !isNaN(impactCost)) {
            risks.push({ name, probability, impactTime, impactCost, strategy });
            fetch('http://localhost:8080/addRisk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, probability, impactTime, impactCost, strategy })
            }).then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.text();
            }).then(text => {
                alert(text);
                updateRisksTable();
                riskName.value = '';
                riskProb.value = '';
                riskTime.value = '';
                riskCost.value = '';
            }).catch(error => {
                alert("Ошибка добавления риска: " + error.message);
            });
        } else {
            alert("Пожалуйста, заполните все поля корректно (вероятность, время и стоимость должны быть числами)");
        }
    };

    function updateRisksTable() {
        const table = document.getElementById('risksTable');
        while (table.rows.length > 1) table.deleteRow(1);
        risks.forEach(risk => {
            const row = table.insertRow();
            row.insertCell().textContent = risk.name;
            row.insertCell().textContent = risk.probability;
            row.insertCell().textContent = risk.impactTime;
            row.insertCell().textContent = risk.impactCost;
            row.insertCell().textContent = risk.strategy || "Игнорировать (по умолчанию)";
        });
    }

    // Создание модели
    window.createModel = async function() {
        const token = await fetchToken() || localStorage.getItem('superset_token');
        if (!token) {
            alert("Не удалось получить токен. Операция прервана.");
            return;
        }
        console.log('Токен:', token);
        console.log('Отправляемые stages:', stages);

        if (stages.length === 0) {
            alert("Добавьте хотя бы один этап перед созданием модели.");
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(stages)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}. Details: ${errorText}`);
            }

            const text = await response.text();
            console.log('Response text:', text);
            alert(text);
            fetchDashboardData(); // Обновляем дашборд после создания модели
        } catch (error) {
            console.error('Ошибка создания модели:', error);
            alert("Ошибка создания модели: " + error.message + ". Проверьте консоль для деталей.");
        }
    };

    // Установка стратегии управления рисками
    window.setMitigation = function() {
        const strategy = document.getElementById('mitigationStrategy').value;
        const budget = parseFloat(document.getElementById('mitigationBudget').value);
        if (!strategy || isNaN(budget) || budget < 0) {
            alert("Введите корректную стратегию и положительный бюджет.");
            return;
        }
        fetch('http://localhost:8080/mitigation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ strategy, budget })
        }).then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.text();
        }).then(text => {
            alert(text);
            fetchDashboardData(); // Обновляем дашборд после изменения стратегии
        }).catch(error => {
            alert("Ошибка установки стратегии: " + error.message);
        });
    };

    // Запуск симуляции
    window.runSimulation = async function() {
        const token = await fetchToken() || localStorage.getItem('superset_token');
        if (!token) return;

        fetch('http://localhost:8080/run', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        })
        .then(response => {
            if (!response.ok) throw new Error(`Ошибка запуска симуляции: ${response.status} - ${response.statusText}`);
            return response.text();
        })
        .then(text => {
            console.log("Симуляция завершена:", text);
            return fetch('http://localhost:8080/results', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
        })
        .then(response => {
            if (!response.ok) throw new Error(`Ошибка получения результатов: ${response.status} - ${response.statusText}`);
            return response.json();
        })
        .then(data => {
            console.log("Результаты симуляции:", data);
            fetchDashboardData();
        })
        .catch(error => {
            console.error("Ошибка:", error);
            alert("Ошибка: " + error.message);
        });
    };

    // Сохранение данных
    window.saveData = function() {
        const data = { stages, risks };
        localStorage.setItem('itRiskData', JSON.stringify(data));
        alert("Данные сохранены в localStorage");
    };

    // Загрузка данных
    window.loadData = function() {
        const savedData = localStorage.getItem('itRiskData');
        if (savedData) {
            const data = JSON.parse(savedData);
            stages = data.stages || [];
            risks = data.risks || [];
            updateStagesTable();
            updateRisksTable();
            alert("Данные загружены из localStorage");
        } else {
            alert("Нет сохранённых данных");
        }
    };

    // Добавление типичного риска
    window.addTypicalRisk = function(riskName) {
        const risk = typicalRisks.find(r => r.name === riskName);
        if (risk) {
            risks.push(risk);
            fetch('http://localhost:8080/addRisk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(risk)
            }).then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.text();
            }).then(text => {
                alert(text);
                updateRisksTable();
            }).catch(error => {
                alert("Ошибка добавления типичного риска: " + error.message);
            });
        }
    };

    // Инициализация при загрузке страницы
    fetchDashboardData(); // Загружаем данные дашборда при старте
});