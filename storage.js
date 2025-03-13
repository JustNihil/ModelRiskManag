import { stages, updateStagesTable } from './stages.js';
import { risks, updateRisksTable } from './risks.js';

// Сохранение и загрузка данных
export function saveData() {
    const data = { stages, risks };
    localStorage.setItem('itRiskData', JSON.stringify(data));
    alert("Данные сохранены в localStorage");
}

export function loadData() {
    const savedData = localStorage.getItem('itRiskData');
    if (savedData) {
        const data = JSON.parse(savedData);
        stages.length = 0;
        risks.length = 0;
        stages.push(...(data.stages || []));
        risks.push(...(data.risks || []));
        updateStagesTable();
        updateRisksTable();
        alert("Данные загружены из localStorage");
    } else {
        alert("Нет сохранённых данных");
    }
}