// Логика отображения и обновления дашборда
export function updateDashboard(metrics, risks, dashboardData) {
    const summary = document.getElementById('dashboardSummary');
    const riskTable = document.getElementById('riskResultsTable');
    const recDiv = document.getElementById('recommendations');

    if (!metrics || !metrics[0]) {
        console.error("Метрики не найдены или результат пустой:", metrics);
        summary.innerHTML = "<p>Ошибка: Метрики не загружены.</p>";
        return;
    }

    summary.innerHTML = `
        <h3>Ключевые метрики</h3>
        <p>Общее время проекта: ${metrics[0]?.total_time ? metrics[0].total_time.toFixed(1) : 'N/A'} дней</p>
        <p>Общая стоимость проекта: $${metrics[0]?.total_cost ? metrics[0].total_cost.toFixed(0) : 'N/A'}</p>
        <p>Стратегия управления: ${metrics[0]?.mitigation_strategy || 'N/A'}</p>
        <p>Бюджет на управление: $${metrics[0]?.mitigation_budget ? metrics[0].mitigation_budget.toFixed(0) : 'N/A'}</p>
    `;

    while (riskTable.rows.length > 1) riskTable.deleteRow(1);
    if (risks) {
        risks.forEach(risk => {
            const row = riskTable.insertRow();
            row.insertCell().textContent = risk.name || 'N/A';
            row.insertCell().textContent = risk.mitigated ? "Да" : "Нет";
            row.insertCell().textContent = risk.impact_time || 0;
            row.insertCell().textContent = risk.impact_cost || 0;
            row.insertCell().textContent = risk.strategy || "Игнорировать (по умолчанию)";
        });
    }

    const recommendations = generateRecommendations(metrics, risks || []);
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