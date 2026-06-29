import os
import json
import time
import requests

# Coordenadas exactas de los 16 estadios del Mundial 2026
STADIUMS_COORDS = {
    "MetLife Stadium, East Rutherford": {"lat": 40.8136, "lon": -74.0744, "roof_ac": False},
    "SoFi Stadium, Inglewood": {"lat": 33.9534, "lon": -118.3387, "roof_ac": True},
    "AT&T Stadium, Arlington": {"lat": 32.7473, "lon": -97.0945, "roof_ac": True},
    "Mercedes-Benz Stadium, Atlanta": {"lat": 33.7573, "lon": -84.4010, "roof_ac": True},
    "NRG Stadium, Houston": {"lat": 29.6847, "lon": -95.4078, "roof_ac": True},
    "Lincoln Financial Field, Filadelfia": {"lat": 39.9008, "lon": -75.1675, "roof_ac": False},
    "Lumen Field, Seattle": {"lat": 47.5952, "lon": -122.3316, "roof_ac": False},
    "Levi's Stadium, Santa Clara": {"lat": 37.4033, "lon": -121.9694, "roof_ac": False},
    "Gillette Stadium, Foxborough": {"lat": 42.0909, "lon": -71.2643, "roof_ac": False},
    "Hard Rock Stadium, Miami Gardens": {"lat": 25.9580, "lon": -80.2389, "roof_ac": False},
    "Arrowhead Stadium, Kansas City": {"lat": 39.0489, "lon": -94.4839, "roof_ac": False},
    "BMO Field, Toronto": {"lat": 43.6328, "lon": -79.4186, "roof_ac": False},
    "BC Place, Vancouver": {"lat": 49.2768, "lon": -123.1120, "roof_ac": True},
    "Estadio Azteca, Ciudad de México": {"lat": 19.3030, "lon": -99.1506, "roof_ac": False},
    "Estadio BBVA, Monterrey": {"lat": 25.6691, "lon": -100.2449, "roof_ac": False},
    "Estadio Akron, Zapopan": {"lat": 20.6811, "lon": -103.4627, "roof_ac": False}
}

def scrape_stadium_data():
    results = {}
    print("[INFO] Iniciando scrapeo de datos climáticos e históricos para estadios...")
    
    for name, info in STADIUMS_COORDS.items():
        lat = info["lat"]
        lon = info["lon"]
        roof_ac = info["roof_ac"]
        
        # 1. Obtener Altitud (Elevation API de Open-Meteo)
        elevation = 0.0
        try:
            elev_url = f"https://api.open-meteo.com/v1/elevation?latitude={lat}&longitude={lon}"
            res = requests.get(elev_url, timeout=10)
            if res.status_code == 200:
                data = res.json()
                elevation = data.get("elevation", [0.0])[0]
        except Exception as e:
            print(f"[WARNING] Error obteniendo altitud para {name}: {e}")
            
        # 2. Obtener Clima de Junio (Archive API para Junio 2024 para promediar temperaturas reales)
        temp = 25.0
        humidity = 60.0
        try:
            # Consultamos la semana del 15 al 22 de junio de 2024
            archive_url = f"https://archive-api.open-meteo.com/v1/archive?latitude={lat}&longitude={lon}&start_date=2024-06-15&end_date=2024-06-22&daily=temperature_2m_max,relative_humidity_2m_mean&timezone=auto"
            res = requests.get(archive_url, timeout=10)
            if res.status_code == 200:
                data = res.json()
                temps = data.get("daily", {}).get("temperature_2m_max", [])
                hums = data.get("daily", {}).get("relative_humidity_2m_mean", [])
                
                # Promediar
                temps = [t for t in temps if t is not None]
                hums = [h for h in hums if h is not None]
                if temps:
                    temp = sum(temps) / len(temps)
                if hums:
                    humidity = sum(hums) / len(hums)
        except Exception as e:
            print(f"[WARNING] Error obteniendo clima para {name}: {e}")
            
        # Ajuste de Climatización (Estadios con techo cerrado y Aire Acondicionado)
        eff_temp = temp
        eff_humidity = humidity
        if roof_ac:
            eff_temp = 21.5 # Temperatura interna de confort estándar
            eff_humidity = 50.0 # Humedad interna controlada
            
        # Calcular un Índice de Estrés Físico (Taxing Score) entre 0.0 y 1.0
        # Basado en Altitud (mayor de 1000m penaliza), calor (>27°C) y humedad (>65%)
        alt_penalty = max(0.0, (elevation - 1000) / 1500) # Azteca (2240m) da ~0.82
        heat_penalty = max(0.0, (eff_temp - 24) / 12)     # BBVA (35°C) da ~0.91
        hum_penalty = max(0.0, (eff_humidity - 55) / 35)  # Hard Rock (75%) da ~0.57
        
        taxing_score = min(1.0, max(0.0, (alt_penalty * 0.5 + heat_penalty * 0.35 + hum_penalty * 0.15)))
        if roof_ac:
            taxing_score = 0.05 # Muy bajo estrés en ambiente controlado
            
        results[name] = {
            "latitude": lat,
            "longitude": lon,
            "altitude_m": elevation,
            "avg_temp_june_c": temp,
            "avg_humidity_june_pct": humidity,
            "effective_temp_c": eff_temp,
            "effective_humidity_pct": eff_humidity,
            "roof_ac": roof_ac,
            "taxing_score": taxing_score
        }
        
        print(f"  [OK] {name} -> Altitud: {elevation:.0f}m | Temp: {eff_temp:.1f}°C | Hum: {eff_humidity:.0f}% | Stress: {taxing_score:.2f}")
        
        # Pausa cortés entre peticiones para evitar cualquier bloqueo de IP
        time.sleep(1.0)
        
    # Guardar en JSON en el directorio público
    script_dir = os.path.dirname(os.path.abspath(__file__))
    out_path = os.path.join(script_dir, "public", "data", "stadiums_climate.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=4)
        
    print(f"\n[INFO] Completado. Datos de clima guardados en: {out_path}")

if __name__ == "__main__":
    scrape_stadium_data()
