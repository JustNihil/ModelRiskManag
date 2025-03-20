import { fetchRiskLogs } from './api.js';

export function createHistogramLabels(data, bins) {
    if (!data || data.length === 0) return [];
    const min = Math.min(...data);
    const max = Math.max(...data);
    const binSize = (max - min) / bins;
    return Array.from({ length: bins }, (_, i) => (min + i * binSize).toFixed(1));
}

export function createHistogramData(data, bins) {
    if (!data || data.length === 0) return [];
    const min = Math.min(...data);
    const max = Math.max(...data);
    const binSize = (max - min) / bins;
    const histogram = Array(bins).fill(0);
    data.forEach(value => {
        const binIndex = Math.min(Math.floor((value - min) / binSize), bins - 1);
        histogram[binIndex]++;
    });
    return histogram;
}

export function generateRecommendations(metrics, risks, dashboardData) {
    const recs = [];

    if (metrics.total_time > 100) {
        recs.push("Ожидаемое время проекта превышает 100 дней. Рассмотрите возможность ускорения этапов.");
    }
    if (dashboardData?.timeStdDev > 10) {
        recs.push(`Высокая неопределённость по времени: стандартное отклонение составляет ${dashboardData.timeStdDev.toFixed(1)} дней. Сфокусируйтесь на снижении неопределённости в критических этапах.`);
    }
    if (dashboardData?.timeTargetProbability < 0.5) {
        recs.push(`Низкая вероятность уложиться в целевое время (${dashboardData.targetTime.toFixed(1)} дней): ${(dashboardData.timeTargetProbability * 100).toFixed(1)}%. Добавьте буфер времени или пересмотрите этапы.`);
    }
    if (dashboardData?.timeExceedProbability > 0.2) {
        recs.push(`Высокий риск задержки: вероятность превышения ${dashboardData.timeThreshold.toFixed(1)} дней составляет ${(dashboardData.timeExceedProbability * 100).toFixed(1)}%. Рассмотрите меры по ускорению критических этапов.`);
    }
    if (dashboardData?.criticalStages && dashboardData.criticalStages.length > 0) {
        const criticalStageNames = dashboardData.criticalStages.map(stage => stage.name).join(', ');
        recs.push(`Критические этапы, вносящие наибольшую неопределённость: ${criticalStageNames}. Проверьте возможность оптимизации этих этапов.`);
    }

    if (metrics.total_cost > 50000) {
        recs.push("Ожидаемая стоимость проекта превышает 50,000$. Рассмотрите оптимизацию бюджета.");
    }
    if (dashboardData?.costStdDev > 5000) {
        recs.push(`Высокая неопределённость по стоимости: стандартное отклонение составляет $${dashboardData.costStdDev.toFixed(0)}. Сфокусируйтесь на снижении неопределённости в критических рисках.`);
    }
    if (dashboardData?.costTargetProbability < 0.5) {
        recs.push(`Низкая вероятность уложиться в целевой бюджет ($${dashboardData.targetCost.toFixed(0)}): ${(dashboardData.costTargetProbability * 100).toFixed(1)}%. Добавьте финансовый буфер или пересмотрите затраты.`);
    }
    if (dashboardData?.costExceedProbability > 0.2) {
        recs.push(`Высокий риск превышения бюджета: вероятность превышения $${dashboardData.costThreshold.toFixed(0)} составляет ${(dashboardData.costExceedProbability * 100).toFixed(1)}%. Рассмотрите меры по снижению затрат.`);
    }

    if (risks.some(r => r.priority > 10)) {
        const highPriorityRisks = risks.filter(r => r.priority > 10).map(r => r.name).join(', ');
        recs.push(`Обратите внимание на риски с высоким приоритетом (>10): ${highPriorityRisks}. Разработайте стратегии их снижения.`);
    }
    if (dashboardData?.criticalRisks && dashboardData.criticalRisks.length > 0) {
        const criticalRiskNames = dashboardData.criticalRisks.map(risk => risk.name).join(', ');
        recs.push(`Критические риски, вносящие наибольшую неопределённость: ${criticalRiskNames}. Приоритетно разработайте меры по их управлению.`);
    }

    if (dashboardData?.timeConfidenceUpper > dashboardData?.timeThreshold) {
        recs.push(`Верхняя граница доверительного интервала времени (${dashboardData.timeConfidenceUpper.toFixed(1)} дней) превышает пороговое значение (${dashboardData.timeThreshold.toFixed(1)} дней). Увеличьте буфер времени или пересмотрите риски.`);
    }
    if (dashboardData?.costConfidenceUpper > dashboardData?.costThreshold) {
        recs.push(`Верхняя граница доверительного интервала стоимости ($${dashboardData.costConfidenceUpper.toFixed(0)}) превышает пороговое значение ($${dashboardData.costThreshold.toFixed(0)}). Увеличьте бюджетный резерв или пересмотрите затраты.`);
    }

    if (metrics.mitigation_budget < 5000 && (dashboardData?.costExceedProbability > 0.2 || dashboardData?.timeExceedProbability > 0.2)) {
        recs.push(`Бюджет на управление рисками ($${metrics.mitigation_budget.toFixed(0)}) может быть недостаточным. Рассмотрите его увеличение для снижения рисков.`);
    }
    if (risks.some(r => r.strategy === "Ignore" && r.priority > 5)) {
        const ignoredRisks = risks.filter(r => r.strategy === "Ignore" && r.priority > 5).map(r => r.name).join(', ');
        recs.push(`Риски с приоритетом выше 5 игнорируются: ${ignoredRisks}. Рекомендуется разработать стратегии управления для этих рисков.`);
    }

    return recs.length ? recs : ["Нет критических рекомендаций на данный момент."];
}

export function updateDashboard(metrics, risks, dashboardData) {
    const summary = document.getElementById('dashboardSummary');
    const riskTable = document.getElementById('riskResultsTable');
    const recDiv = document.getElementById('recommendations');

    console.log("Полученные метрики:", metrics);
    console.log("Полученные риски:", risks);
    console.log("Данные дашборда:", dashboardData);

    if (!metrics || typeof metrics !== 'object') {
        console.error("Метрики не найдены или результат пустой:", metrics);
        summary.innerHTML = "<p>Ошибка: Метрики не загружены.</p>";
        return;
    }

    summary.innerHTML = `
        <h3>Ключевые метрики</h3>
        <p>Ожидаемое время проекта: ${metrics.total_time ? metrics.total_time.toFixed(1) : 'N/A'} дней</p>
        <p>Стандартное отклонение времени: ${dashboardData?.timeStdDev ? dashboardData.timeStdDev.toFixed(1) : 'N/A'} дней</p>
        <p>95% доверительный интервал времени: от ${dashboardData?.timeConfidenceLower ? dashboardData.timeConfidenceLower.toFixed(1) : 'N/A'} до ${dashboardData?.timeConfidenceUpper ? dashboardData.timeConfidenceUpper.toFixed(1) : 'N/A'} дней</p>
        <p>Вероятность уложиться в ${dashboardData?.targetTime ? dashboardData.targetTime.toFixed(1) : 'N/A'} дней: ${(dashboardData?.timeTargetProbability * 100).toFixed(1)}%</p>
        <p>Вероятность превышения ${dashboardData?.timeThreshold ? dashboardData.timeThreshold.toFixed(1) : 'N/A'} дней: ${(dashboardData?.timeExceedProbability * 100).toFixed(1)}%</p>
        <p>Ожидаемая стоимость проекта: $${metrics.total_cost ? metrics.total_cost.toFixed(0) : 'N/A'}</p>
        <p>Стандартное отклонение стоимости: $${dashboardData?.costStdDev ? dashboardData.costStdDev.toFixed(0) : 'N/A'}</p>
        <p>95% доверительный интервал стоимости: от $${dashboardData?.costConfidenceLower ? dashboardData.costConfidenceLower.toFixed(0) : 'N/A'} до $${dashboardData?.costConfidenceUpper ? dashboardData.costConfidenceUpper.toFixed(0) : 'N/A'}</p>
        <p>Вероятность уложиться в $${dashboardData?.targetCost ? dashboardData.targetCost.toFixed(0) : 'N/A'}: ${(dashboardData?.costTargetProbability * 100).toFixed(1)}%</p>
        <p>Вероятность превышения $${dashboardData?.costThreshold ? dashboardData.costThreshold.toFixed(0) : 'N/A'}: ${(dashboardData?.costExceedProbability * 100).toFixed(1)}%</p>
        <p>Стратегия управления: ${metrics.mitigation_strategy || 'N/A'}</p>
        <p>Бюджет на управление: $${metrics.mitigation_budget ? metrics.mitigation_budget.toFixed(0) : 'N/A'}</p>
        <h4>Критические риски:</h4>
        <ul>
            ${dashboardData?.criticalRisks && dashboardData.criticalRisks.length > 0 ? dashboardData.criticalRisks.map(risk => `<li>${risk.name} (Приоритет: ${risk.priority.toFixed(2)})</li>`).join('') : '<li>Критические риски отсутствуют</li>'}
        </ul>
        <h4>Критические этапы:</h4>
        <ul>
            ${dashboardData?.criticalStages && dashboardData.criticalStages.length > 0 ? dashboardData.criticalStages.map(stage => `<li>${stage.name} (Длительность: ${stage.duration}, Стоимость: $${stage.cost})</li>`).join('') : '<li>Критические этапы отсутствуют</li>'}
        </ul>
    `;

    const metricsCtx = document.getElementById('metricsChart').getContext('2d');
    new Chart(metricsCtx, {
        type: 'bar',
        data: {
            labels: ['Время (дни)', 'Стоимость', 'Бюджет на управление'],
            datasets: [{
                label: 'Метрики проекта',
                data: [
                    metrics.total_time || 0,
                    metrics.total_cost || 0,
                    metrics.mitigation_budget || 0
                ],
                backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56']
            }]
        },
        options: { scales: { y: { beginAtZero: true } } }
    });

    const risksCtx = document.getElementById('risksChart').getContext('2d');
    new Chart(risksCtx, {
        type: 'bar',
        data: {
            labels: risks ? risks.map(r => r.name) : [],
            datasets: [{
                label: 'Влияние на стоимость',
                data: risks ? risks.map(r => r.impactCost || 0) : [],
                backgroundColor: '#FF6384'
            }, {
                label: 'Влияние на время (дни)',
                data: risks ? risks.map(r => r.impactTime || 0) : [],
                backgroundColor: '#36A2EB'
            }]
        },
        options: { scales: { y: { beginAtZero: true } } }
    });

    const timeDistCtx = document.getElementById('timeDistributionChart').getContext('2d');
    new Chart(timeDistCtx, {
        type: 'bar',
        data: {
            labels: createHistogramLabels(dashboardData?.timeResults || [], 20),
            datasets: [
                {
                    label: 'Распределение времени',
                    data: createHistogramData(dashboardData?.timeResults || [], 20),
                    backgroundColor: '#36A2EB'
                },
                {
                    label: '95% доверительный интервал',
                    type: 'line',
                    data: [
                        { x: dashboardData?.timeConfidenceLower, y: 0 },
                        { x: dashboardData?.timeConfidenceLower, y: 100 },
                        { x: dashboardData?.timeConfidenceUpper, y: 100 },
                        { x: dashboardData?.timeConfidenceUpper, y: 0 }
                    ],
                    borderColor: '#FF0000',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0
                }
            ]
        },
        options: {
            scales: {
                x: { title: { display: true, text: 'Время (дни)' } },
                y: { title: { display: true, text: 'Частота' } }
            }
        }
    });

    const costDistCtx = document.getElementById('costDistributionChart').getContext('2d');
    new Chart(costDistCtx, {
        type: 'bar',
        data: {
            labels: createHistogramLabels(dashboardData?.costResults || [], 20),
            datasets: [
                {
                    label: 'Распределение стоимости',
                    data: createHistogramData(dashboardData?.costResults || [], 20),
                    backgroundColor: '#FF6384'
                },
                {
                    label: '95% доверительный интервал',
                    type: 'line',
                    data: [
                        { x: dashboardData?.costConfidenceLower, y: 0 },
                        { x: dashboardData?.costConfidenceLower, y: 100 },
                        { x: dashboardData?.costConfidenceUpper, y: 100 },
                        { x: dashboardData?.costConfidenceUpper, y: 0 }
                    ],
                    borderColor: '#FF0000',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0
                }
            ]
        },
        options: {
            scales: {
                x: { title: { display: true, text: 'Стоимость ($)' } },
                y: { title: { display: true, text: 'Частота' } }
            }
        }
    });

    while (riskTable.rows.length > 1) riskTable.deleteRow(1);
    if (risks && Array.isArray(risks) && risks.length > 0) {
        risks.forEach(risk => {
            const row = riskTable.insertRow();
            row.insertCell().textContent = risk.name || 'N/A';
            row.insertCell().textContent = risk.mitigated ? "Да" : "Нет";
            row.insertCell().textContent = risk.impactTime || 0;
            row.insertCell().textContent = risk.impactCost || 0;
            row.insertCell().textContent = risk.strategy || "Игнорировать (по умолчанию)";
            row.insertCell().textContent = risk.category || "Не указано";
            row.insertCell().textContent = risk.priority ? risk.priority.toFixed(2) : "N/A";
        });
    } else {
        console.warn("Риски не найдены или массив пуст:", risks);
        const row = riskTable.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 7;
        cell.textContent = "Риски отсутствуют";
    }

    const recommendations = generateRecommendations(metrics, risks || [], dashboardData);
    recDiv.innerHTML = `
        <h3>Рекомендации и прогнозы</h3>
        ${recommendations.map(rec => `<p>${rec}</p>`).join('')}
    `;

    fetchRiskLogs().then(logs => {
        const logsDiv = document.getElementById('riskLogs');
        if (logs && logs.length > 0) {
            logsDiv.innerHTML = `
                <h3>Логи изменений рисков</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Риск</th>
                            <th>Действие</th>
                            <th>Время</th>
                            <th>Детали</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${logs.map(log => `
                            <tr>
                                <td>${log.risk_name}</td>
                                <td>${log.action}</td>
                                <td>${log.timestamp}</td>
                                <td>${log.details}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            logsDiv.innerHTML = "<p>Логи отсутствуют.</p>";
        }
    });
}