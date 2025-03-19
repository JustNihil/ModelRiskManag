import os
import subprocess
import json
import yaml
import psycopg2
from psycopg2.extras import RealDictCursor

# Настройка окружения
SUPERSET_CONFIG_PATH = "/app/pythonpath_dev/superset_config.py"  # Путь внутри контейнера
os.environ["SUPERSET_CONFIG_PATH"] = SUPERSET_CONFIG_PATH

# Подключение к базе метаданных
DB_CONFIG = {
    "dbname": "risk_db",
    "user": "risk_user",
    "password": "235521",
    "host": "localhost",
    "port": "5435"
}

def run_docker_command(container, cmd):
    full_cmd = ['docker', 'exec', container] + cmd
    print(f"Команда: {full_cmd}")
    result = subprocess.run(full_cmd, capture_output=True, text=True)
    if result.returncode != 0:
        error_msg = result.stderr or result.stdout
        raise Exception(f"Ошибка выполнения команды {cmd}: {error_msg}")
    return result.stdout

def get_db_connection():
    """Создаёт подключение к базе данных."""
    try:
        return psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)
    except Exception as e:
        raise Exception(f"Ошибка подключения к базе данных: {e}")

def export_dashboards(output_file="/app/models/dashboards.yaml"):
    try:
        # Создаём директорию, если её нет
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        run_docker_command("superset_app", ["mkdir", "-p", os.path.dirname(output_file)])
        run_docker_command("superset_app", ["superset", "export-dashboards", "-f", output_file])
        if os.path.exists(output_file):
            return {"status": "success", "file": output_file}
        else:
            raise Exception(f"Файл {output_file} не создан после экспорта")
    except Exception as e:
        return {"error": f"Ошибка экспорта дашбордов: {str(e)}"}

def export_metrics(output_file="metrics.json"):
    """Получает метрики из базы данных."""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT total_time, total_cost, mitigation_strategy, mitigation_budget
                    FROM project_metrics
                    ORDER BY created_at DESC
                    LIMIT 1
                """)
                metrics = cur.fetchone() or {
                    "total_time": 0.0,
                    "total_cost": 0.0,
                    "mitigation_strategy": "N/A",
                    "mitigation_budget": 0.0
                }
                with open(output_file, "w", encoding="utf-8") as f:
                    json.dump(metrics, f)
                return metrics
    except Exception as e:
        raise Exception(f"Ошибка экспорта метрик: {e}")

def export_risks(output_file="risks.json"):
    """Получает риски из базы данных."""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT name, probability, impact_time, impact_cost, mitigated, strategy
                    FROM risks
                """)
                risks = cur.fetchall()
                # Преобразуем RealDictRow в обычный словарь
                risks_list = [
                    {
                        "name": risk["name"],
                        "probability": float(risk["probability"]),
                        "impact_time": float(risk["impact_time"]),
                        "impact_cost": float(risk["impact_cost"]),
                        "mitigated": bool(risk["mitigated"]),
                        "strategy": risk["strategy"]
                    } for risk in risks
                ]
                with open(output_file, "w", encoding="utf-8") as f:
                    json.dump(risks_list, f)
                return risks_list
    except Exception as e:
        raise Exception(f"Ошибка экспорта рисков: {e}")

if __name__ == "__main__":
    import sys
    action = sys.argv[1] if len(sys.argv) > 1 else None
    try:
        if action == "export_dashboards":
            result = export_dashboards()
        elif action == "export_metrics":
            result = export_metrics()
        elif action == "export_risks":
            result = export_risks()
        else:
            result = {"error": "Неизвестная команда"}
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))