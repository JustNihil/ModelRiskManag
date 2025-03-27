import { stages, updateStagesTable } from './stages.js';
import { risks, updateRisksTable } from './risks.js';

export async function loadData() {
    try {
        const response = await fetch('http://localhost:8089/loadLatestData', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            throw new Error(`Ошибка: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        // Очищаем текущие данные
        stages.length = 0;
        risks.length = 0;

        // Загружаем новые данные
        if (data.stages && Array.isArray(data.stages)) {
            stages.push(...data.stages);
        }
        if (data.risks && Array.isArray(data.risks)) {
            risks.push(...data.risks);
        }

        // Обновляем таблицы
        updateStagesTable();
        updateRisksTable();
        window.updateProgressStagesTable();
        window.updateProgressForm();

        alert("Последние данные успешно загружены из базы данных.");
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        alert("Ошибка загрузки данных: " + error.message);
    }
}