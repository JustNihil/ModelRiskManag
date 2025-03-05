// Убедимся, что скрипт запускается после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log("Script loaded, checking functions:");
    console.log("addStage defined:", typeof addStage === 'function' ? 'yes' : 'no');
    console.log("addRisk defined:", typeof addRisk === 'function' ? 'yes' : 'no');
    console.log("addTypicalRisk defined:", typeof addTypicalRisk === 'function' ? 'yes' : 'no');
    console.log("createModel defined:", typeof createModel === 'function' ? 'yes' : 'no');
    console.log("setMitigation defined:", typeof setMitigation === 'function' ? 'yes' : 'no');
    console.log("runSimulation defined:", typeof runSimulation === 'function' ? 'yes' : 'no');
    console.log("saveData defined:", typeof saveData === 'function' ? 'yes' : 'no');
    console.log("loadData defined:", typeof loadData === 'function' ? 'yes' : 'no');

    let stages = [];
    let risks = [];

    const typicalRisks = [
        { name: "Задержка в разработке", probability: 0.4, impactTime: 10, impactCost: 5000, strategy: "Mitigate" },
        { name: "Отсутствие сотрудников", probability: 0.3, impactTime: 30, impactCost: 10000, strategy: "Eliminate" },
        { name: "Задержка поставки оборудования", probability: 0.3, impactTime: 15, impactCost: 7000, strategy: "Mitigate" },
        { name: "Неправильное планирование", probability: 0.5, impactTime: 20, impactCost: 15000, strategy: "Mitigate" },
        { name: "Кибератака", probability: 0.2, impactTime: 15, impactCost: 20000, strategy: "Eliminate" }
    ];

    window.addStage = function() {
        console.log("addStage called");
        const stageName = document.getElementById('stageName');
        const stageDuration = document.getElementById('stageDuration');
        const stageCost = document.getElementById('stageCost');
        if (!stageName || !stageDuration || !stageCost) {
            console.error("DOM elements not found:", { stageName, stageDuration, stageCost });
            alert("Ошибка: Элементы формы не найдены. Перезагрузите страницу.");
            return;
        }
        const name = stageName.value;
        const duration = parseFloat(stageDuration.value);
        const cost = parseFloat(stageCost.value);
        console.log("Attempting to add stage:", { name, duration, cost });
        if (name && !isNaN(duration) && !isNaN(cost)) {
            stages.push({ name, duration, cost });
            console.log("Stage added to stages array:", stages[stages.length - 1], "Current stages:", stages);
            updateStagesTable();
            stageName.value = '';
            stageDuration.value = '';
            stageCost.value = '';
        } else {
            console.error("Invalid stage data:", { name, duration, cost });
            alert("Пожалуйста, заполните все поля корректно (продолжительность и стоимость должны быть числами)");
        }
    };

    function updateStagesTable() {
        const table = document.getElementById('stagesTable');
        if (!table) {
            console.error("Stages table not found");
            return;
        }
        console.log("Updating stages table with data:", stages);
        while (table.rows.length > 1) table.deleteRow(1);
        stages.forEach(stage => {
            const row = table.insertRow();
            row.insertCell().textContent = stage.name;
            row.insertCell().textContent = stage.duration;
            row.insertCell().textContent = stage.cost;
        });
    }

    window.addRisk = function() {
        console.log("addRisk called");
        const riskName = document.getElementById('riskName');
        const riskProb = document.getElementById('riskProb');
        const riskTime = document.getElementById('riskTime');
        const riskCost = document.getElementById('riskCost');
        const riskStrategy = document.getElementById('riskStrategy');
        if (!riskName || !riskProb || !riskTime || !riskCost || !riskStrategy) {
            console.error("DOM elements not found:", { riskName, riskProb, riskTime, riskCost, riskStrategy });
            alert("Ошибка: Элементы формы не найдены. Перезагрузите страницу.");
            return;
        }
        const name = riskName.value;
        const probability = parseFloat(riskProb.value);
        const impactTime = parseFloat(riskTime.value);
        const impactCost = parseFloat(riskCost.value);
        const strategy = riskStrategy.value;
        console.log("Attempting to add risk:", { name, probability, impactTime, impactCost, strategy });
        if (name && !isNaN(probability) && !isNaN(impactTime) && !isNaN(impactCost)) {
            risks.push({ name, probability, impactTime, impactCost, strategy });
            console.log("Risk added to risks array:", risks[risks.length - 1], "Current risks:", risks);
            fetch('http://localhost:8080/addRisk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, probability, impactTime, impactCost, strategy })
            }).then(response => {
                console.log("Fetch response status:", response.status);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.text();
            }).then(text => {
                console.log("Server response:", text);
                alert(text);
                updateRisksTable();
                riskName.value = '';
                riskProb.value = '';
                riskTime.value = '';
                riskCost.value = '';
            }).catch(error => {
                console.error("Error adding risk:", error);
                alert("Ошибка добавления риска: " + error.message);
            });
        } else {
            console.error("Invalid risk data:", { name, probability, impactTime, impactCost, strategy });
            alert("Пожалуйста, заполните все поля корректно (вероятность, время и стоимость должны быть числами)");
        }
    };

    function updateRisksTable() {
        const table = document.getElementById('risksTable');
        if (!table) {
            console.error("Risks table not found");
            return;
        }
        console.log("Updating risks table with data:", risks);
        while (table.rows.length > 1) table.deleteRow(1);
        risks.forEach(risk => {
            const row = table.insertRow();
            row.insertCell().textContent = risk.name;
            row.insertCell().textContent = risk.probability;
            row.insertCell().textContent = risk.impactTime;
            row.insertCell().textContent = risk.impactCost;
            row.insertCell().textContent = risk.strategy || "Не указано";
        });
    }

    window.createModel = function() {
        console.log("createModel called");
        console.log("Creating model with stages:", stages);
        fetch('http://localhost:8080/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(stages)
        }).then(response => {
            console.log("Response status:", response.status);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.text();
        }).then(text => {
            console.log("Server response:", text);
            alert(text);
        }).catch(error => {
            console.error("Error creating model:", error);
            alert("Ошибка создания модели: " + error.message);
        });
    };

    window.setMitigation = function() {
        console.log("setMitigation called");
        const strategy = document.getElementById('mitigationStrategy').value;
        const budget = parseFloat(document.getElementById('mitigationBudget').value);
        console.log("Setting mitigation:", { strategy, budget });
        fetch('http://localhost:8080/mitigation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ strategy, budget })
        }).then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.text();
        }).then(text => {
            console.log("Mitigation set response:", text);
            alert(text);
        }).catch(error => {
            console.error("Error setting mitigation:", error);
            alert("Ошибка установки стратегии: " + error.message);
        });
    };

    window.runSimulation = function() {
        console.log("runSimulation called");
        console.log("Running simulation...");
        fetch('http://localhost:8080/run')
            .then(() => fetch('http://localhost:8080/results'))
            .then(response => {
                console.log("Results response status:", response.status);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            }).then(data => {
                console.log("Results data:", data);
                document.getElementById('resultsText').textContent = 
                    `Общее время: ${data.totalTime} дней, Общая стоимость: $${data.totalCost}`;
                updateChart(data);
                updateRiskResults(data.risks);
            }).catch(error => {
                console.error("Error running simulation:", error);
                alert("Ошибка запуска симуляции: " + error.message);
            });
    };

    window.saveData = function() {
        console.log("saveData called");
        const data = { stages, risks };
        console.log("Saving data:", data);
        localStorage.setItem('itRiskData', JSON.stringify(data));
        alert("Данные сохранены в localStorage");
    };

    window.loadData = function() {
        console.log("loadData called");
        const savedData = localStorage.getItem('itRiskData');
        console.log("Loading data from localStorage:", savedData);
        if (savedData) {
            const data = JSON.parse(savedData);
            stages = data.stages || [];
            risks = data.risks || [];
            updateStagesTable();
            updateRisksTable();
            console.log("Loaded stages:", stages, "Loaded risks:", risks);
            alert("Данные загружены из localStorage");
        } else {
            alert("Нет сохранённых данных");
        }
    };

    window.addTypicalRisk = function(riskName) {
        console.log("addTypicalRisk called with:", riskName);
        const risk = typicalRisks.find(r => r.name === riskName);
        if (risk) {
            risks.push(risk);
            console.log("Adding typical risk:", risk);
            fetch('http://localhost:8080/addRisk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(risk)
            }).then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.text();
            }).then(text => {
                console.log("Typical risk added response:", text);
                alert(text);
                updateRisksTable();
            }).catch(error => {
                console.error("Error adding typical risk:", error);
                alert("Ошибка добавления типичного риска: " + error.message);
            });
        }
    };

    function updateChart(data) {
        const ctx = document.getElementById('resultsChart').getContext('2d');
        if (chart) chart.destroy();
        chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Общее время', 'Общая стоимость'],
                datasets: [{
                    label: 'Метрики проекта',
                    data: [data.totalTime, data.totalCost],
                    backgroundColor: ['#36A2EB', '#FF6384']
                }]
            },
            options: { scales: { y: { beginAtZero: true } } }
        });
    }

    function updateRiskResults(risks) {
        const table = document.getElementById('riskResultsTable');
        if (!table) {
            console.error("Risk results table not found");
            return;
        }
        console.log("Updating risk results table with data:", risks);
        while (table.rows.length > 1) table.deleteRow(1);
        risks.forEach(risk => {
            const row = table.insertRow();
            row.insertCell().textContent = risk.name;
            row.insertCell().textContent = risk.mitigated ? "Да" : "Нет";
            row.insertCell().textContent = risk.impactTime;
            row.insertCell().textContent = risk.impactCost;
            row.insertCell().textContent = risk.strategy || "Не указано";
        });
    }
});