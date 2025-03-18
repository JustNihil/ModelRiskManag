// Логика отображения и обновления дашборда
export function updateDashboard(metrics, risks, dashboardData) {
    const summary = document.getElementById('dashboardSummary');
    const riskTable = document.getElementById('riskResultsTable');
    const recDiv = document.getElementById('recommendations');

    if (!metrics || (!Array.isArray(metrics) && typeof metrics !== 'object')) {
        console.error("Метрики не найдены или результат пустой:", metrics);
        summary.innerHTML = "<p>Ошибка: Метрики не загружены.</p>";
        return;
    }

    const metricsArray = Array.isArray(metrics) ? metrics : [metrics];
    summary.innerHTML = `
        <h3>Ключевые метрики</h3>
        <p>Общее время проекта: ${metricsArray[0]?.total_time ? metricsArray[0].total_time.toFixed(1) : 'N/A'} дней</p>
        <p>Общая стоимость проекта: $${metricsArray[0]?.total_cost ? metricsArray[0].total_cost.toFixed(0) : 'N/A'}</p>
        <p>Стратегия управления: ${metricsArray[0]?.mitigation_strategy || 'N/A'}</p>
        <p>Бюджет на управление: $${metricsArray[0]?.mitigation_budget ? metricsArray[0].mitigation_budget.toFixed(0) : 'N/A'}</p>
    `;

    // Чарт для метрик
    const metricsCtx = document.getElementById('metricsChart').getContext('2d');
    new Chart(metricsCtx, {
        type: 'bar',
        data: {
            labels: ['Время (дни)', 'Стоимость', 'Бюджет на управление'],
            datasets: [{
                label: 'Метрики проекта',
                data: [
                    metricsArray[0]?.total_time || 0,
                    metricsArray[0]?.total_cost || 0,
                    metricsArray[0]?.mitigation_budget || 0
                ],
                backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56']
            }]
        },
        options: { scales: { y: { beginAtZero: true } } }
    });

    // Чарт для рисков
    const risksCtx = document.getElementById('risksChart').getContext('2d');
    new Chart(risksCtx, {
        type: 'bar',
        data: {
            labels: risks ? risks.map(r => r.name) : [],
            datasets: [{
                label: 'Влияние на стоимость',
                data: risks ? risks.map(r => r.impact_cost || 0) : [],
                backgroundColor: '#FF6384'
            }, {
                label: 'Влияние на время (дни)',
                data: risks ? risks.map(r => r.impact_time || 0) : [],
                backgroundColor: '#36A2EB'
            }]
        },
        options: { scales: { y: { beginAtZero: true } } }
    });

    while (riskTable.rows.length > 1) riskTable.deleteRow(1);
    if (risks && Array.isArray(risks)) {
        risks.forEach(risk => {
            const row = riskTable.insertRow();
            row.insertCell().textContent = risk.name || 'N/A';
            row.insertCell().textContent = risk.mitigated ? "Да" : "Нет";
            row.insertCell().textContent = risk.impact_time || 0;
            row.insertCell().textContent = risk.impact_cost || 0;
            row.insertCell().textContent = risk.strategy || "Игнорировать (по умолчанию)";
        });
    }

    const recommendations = generateRecommendations(metricsArray, risks || []);
    recDiv.innerHTML = `
        <h3>Рекомендации и прогнозы</h3>
        ${recommendations.map(rec => `<p>${rec}</p>`).join('')}
    `;
}

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