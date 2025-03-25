import os
import subprocess
import json
import psycopg2
from psycopg2.extras import RealDictCursor

SUPERSET_CONFIG_PATH = "/app/pythonpath_dev/superset_config.py"
os.environ["SUPERSET_CONFIG_PATH"] = SUPERSET_CONFIG_PATH

DB_CONFIG = {
    "dbname": "risk_db",
    "user": "risk_user",
    "password": "235521",
    "host": "localhost",
    "port": "5435"
}

def run_docker_command(container, cmd):
    full_cmd = ['docker', 'exec', container] + cmd
    result = subprocess.run(full_cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise Exception(f"Ошибка команды {cmd}: {result.stderr}")
    return result.stdout

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)

def export_dashboards(output_file="/app/models/dashboards.yaml"):
    try:
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        run_docker_command("superset_app", ["superset", "export-dashboards", "-f", output_file])
        return {"status": "success", "file": output_file}
    except Exception as e:
        return {"error": f"Ошибка экспорта дашбордов: {str(e)}"}

def export_metrics(output_file="metrics.json"):
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT total_time, total_cost, mitigation_strategy, mitigation_budget,
                           time_results, cost_results, time_90th_percentile, cost_90th_percentile,
                           time_threshold, cost_threshold, time_exceed_probability, cost_exceed_probability,
                           time_std_dev, cost_std_dev, time_confidence_lower, time_confidence_upper,
                           cost_confidence_lower, cost_confidence_upper, target_time, target_cost,
                           time_target_probability, cost_target_probability, base_cost, contingency_reserve,
                           contingency_reserve_used, schedule_variance, cost_variance
                    FROM project_metrics
                    ORDER BY created_at DESC
                    LIMIT 1
                """)
                metrics = cur.fetchone() or {
                    "total_time": 0.0, "total_cost": 0.0, "mitigation_strategy": "N/A", "mitigation_budget": 0.0,
                    "time_results": [], "cost_results": [], "time_90th_percentile": 0.0, "cost_90th_percentile": 0.0,
                    "time_threshold": 150.0, "cost_threshold": 75000.0, "time_exceed_probability": 0.0,
                    "cost_exceed_probability": 0.0, "time_std_dev": 0.0, "cost_std_dev": 0.0,
                    "time_confidence_lower": 0.0, "time_confidence_upper": 0.0, "cost_confidence_lower": 0.0,
                    "cost_confidence_upper": 0.0, "target_time": 120.0, "target_cost": 60000.0,
                    "time_target_probability": 0.0, "cost_target_probability": 0.0,
                    "base_cost": 0.0, "contingency_reserve": 5000.0, "contingency_reserve_used": 0.0,
                    "schedule_variance": 0.0, "cost_variance": 0.0
                }
                with open(output_file, "w", encoding="utf-8") as f:
                    json.dump(metrics, f)
                return metrics
    except Exception as e:
        return {"error": f"Ошибка экспорта метрик: {str(e)}"}

def export_risks(output_file="risks.json"):
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT name, probability, impact_time, impact_cost, mitigated, strategy, category, priority, mitigation_cost
                    FROM risks
                """)
                risks = cur.fetchall()
                risks_list = [{
                    "name": r["name"],
                    "probability": float(r["probability"] or 0.0),
                    "impactTime": float(r["impact_time"] or 0.0),
                    "impactCost": float(r["impact_cost"] or 0.0),
                    "mitigated": bool(r["mitigated"]),
                    "strategy": r["strategy"] or "Ignore",
                    "category": r["category"] or "Не указано",
                    "priority": float(r["priority"] or 0.0),
                    "mitigationCost": float(r["mitigation_cost"] or 0.0)  # Добавляем mitigation_cost
                } for r in risks]
                with open(output_file, "w", encoding="utf-8") as f:
                    json.dump(risks_list, f)
                return risks_list
    except Exception as e:
        return {"error": f"Ошибка экспорта рисков: {str(e)}"}

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Не указана команда"}))
        sys.exit(1)
    command = sys.argv[1]
    if command == "export_metrics":
        print(json.dumps(export_metrics()))
    elif command == "export_risks":
        print(json.dumps(export_risks()))
    elif command == "export_dashboards":
        print(json.dumps(export_dashboards()))
    else:
        print(json.dumps({"error": f"Неизвестная команда: {command}"}))