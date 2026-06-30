import os
import re
import json
from bs4 import BeautifulSoup

def parse_html_file(file_path):
    print(f"[INFO] Procesando {os.path.basename(file_path)}...")
    with open(file_path, 'r', encoding='utf-8') as f:
        html = f.read()
        
    soup = BeautifulSoup(html, 'html.parser')
    
    # 1. Intentar identificar los equipos del partido
    title_text = soup.title.text if soup.title else ""
    print(f"[DEBUG] Título de la página: {title_text}")
    
    teams = []
    
    # Intento 1: buscar textos de cabecera de equipos
    team_elements = soup.find_all(class_=re.compile(r'team-name|teamName|fixture__team', re.I))
    for el in team_elements:
        name = el.text.strip()
        if name and name not in teams:
            teams.append(name)
            
    # Intento 2: si no se encuentran, parsear del título
    if len(teams) < 2:
        # Ejemplo: "Ecuador 2 - 1 Germany | Opta"
        match = re.search(r'([A-Za-záéíóúÁÉÍÓÚ\s]+)\s+\d+\s*-\s*\d+\s+([A-Za-záéíóúÁÉÍÓÚ\s]+)', title_text)
        if match:
            teams = [match.group(1).strip(), match.group(2).strip()]
            
    # Intento 3: buscar textos en las pestañas del detalle
    if len(teams) < 2:
        all_tabs = soup.find_all(class_=re.compile(r'tab|button', re.I))
        for t in all_tabs:
            txt = t.text.strip()
            if txt and len(txt) > 2 and txt not in ["All", "Summary", "Details", "Points", "Match Summary", "Opta Points", "Match Details"] and txt not in teams:
                teams.append(txt)
                if len(teams) == 2:
                    break
                    
    if len(teams) < 2:
        teams = ["Equipo A", "Equipo B"]
        
    print(f"[INFO] Equipos detectados: {teams[0]} vs {teams[1] if len(teams) > 1 else 'TBD'}")
    
    # 2. Buscar las tablas de estadísticas
    tables = soup.find_all('table')
    player_data = []
    
    for idx_table, table in enumerate(tables):
        thead = table.find('thead')
        if thead:
            first_header_tr = thead.find('tr')
            if first_header_tr:
                headers = [th.text.strip() for th in first_header_tr.find_all(['th', 'td'])]
            else:
                headers = [th.text.strip() for th in thead.find_all(['th', 'td'])]
        else:
            first_tr = table.find('tr')
            if first_tr:
                headers = [td.text.strip() for td in first_tr.find_all(['td', 'th'])]
            else:
                headers = []
                
        key_columns = ['AP', 'xG', 'SCA', 'Pos.']
        is_opta_table = any(col in headers for col in key_columns)
        
        if not is_opta_table:
            continue
            
        print(f"[INFO] ¡Tabla de estadísticas de Opta encontrada! Columnas: {headers}")
        
        col_map = {col: headers.index(col) for col in headers if col}
        
        tbody = table.find('tbody')
        rows = tbody.find_all('tr') if tbody else table.find_all('tr')[1:]
        
        for row in rows:
            cols = row.find_all(['td', 'th'])
            if len(cols) < len(headers):
                continue
                
            player_name = cols[0].text.strip()
            player_name = re.sub(r'\s+', ' ', player_name).strip()
            if not player_name or player_name in ["Pos.", "Player", "Jugador"] or len(player_name) < 3:
                continue
                
            stats = {}
            for col_name, idx in col_map.items():
                if idx < len(cols):
                    stats[col_name] = cols[idx].text.strip()
            
            try:
                # Intentar adivinar el equipo del jugador. 
                # A veces hay una columna con logo/nombre de equipo, o el HTML está agrupado.
                # Si no, guardamos todos y el frontend los dividirá.
                player_entry = {
                    "name": player_name,
                    "position": stats.get("Pos.", "MF"),
                    "accurate_passes": int(stats.get("AP", 0)) if stats.get("AP") else 0,
                    "duels_won": int(stats.get("HW", 0)) if stats.get("HW") else 0,
                    "shots_inside_box": int(stats.get("SIB", 0)) if stats.get("SIB") else 0,
                    "shots_outside_box": int(stats.get("SOB", 0)) if stats.get("SOB") else 0,
                    "expected_goals": float(stats.get("xG", 0.0)) if stats.get("xG") else 0.0,
                    "corner_kicks": int(stats.get("CK", 0)) if stats.get("CK") else 0,
                    "tackles": int(stats.get("Ti", 0)) if stats.get("Ti") else 0,
                    "shot_creating_actions": int(stats.get("SCA", 0)) if stats.get("SCA") else 0,
                    "fouls_against": int(stats.get("FaA", 0)) if stats.get("FaA") else 0,
                }
                player_data.append(player_entry)
            except Exception as e:
                print(f"[WARNING] Error al procesar fila de jugador: {e}")
                
        break
        
    return teams, player_data

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    opta_dir = os.path.join(script_dir, 'opta_html')
    
    if not os.path.exists(opta_dir):
        os.makedirs(opta_dir)
        print(f"[INFO] Creada la carpeta '{opta_dir}'. Coloca aquí los archivos HTML de Opta.")
        return
        
    html_files = [f for f in os.listdir(opta_dir) if f.endswith('.html')]
    if not html_files:
        print(f"[INFO] No se encontraron archivos HTML en '{opta_dir}'.")
        return
        
    all_stats = {}
    
    for f in html_files:
        path = os.path.join(opta_dir, f)
        teams, players = parse_html_file(path)
        
        if not players:
            print(f"[WARNING] No se pudieron extraer estadísticas de {f}")
            continue
            
        match_key = f"{teams[0]} vs {teams[1]}".lower().replace(" ", "_")
        all_stats[match_key] = {
            "teams": teams,
            "players": players
        }
        print(f"[OK] Extraídos {len(players)} jugadores del partido {teams[0]} vs {teams[1]}")
        
    output_path = os.path.join(script_dir, 'public', 'data', 'player_stats.json')
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as out:
        json.dump(all_stats, out, indent=4, ensure_ascii=False)
        
    print(f"\n[ÉXITO] Se procesaron {len(all_stats)} partidos. Datos guardados en {output_path}")

if __name__ == '__main__':
    main()
