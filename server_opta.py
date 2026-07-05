import os
import sys
import re
import json
import time
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth
from bs4 import BeautifulSoup

def scrape_match_html(url):
    """
    Usa Playwright con Stealth para cargar la página de Opta y extraer el HTML renderizado.
    """
    print(f"[INFO] Iniciando navegador Playwright Chromium (Modo Visible para pasar retos)...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            viewport={'width': 1366, 'height': 768},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        
        # Ocultar firmas de automatización (stealth)
        Stealth().apply_stealth_sync(page)
        
        print(f"[INFO] Navegando de forma sigilosa a: {url}")
        page.goto(url, wait_until="domcontentloaded")
        
        # Esperar a que la tabla se cargue en el DOM dinámicamente
        print("[INFO] Esperando a que se renderice la tabla de estadísticas de Opta...")
        try:
            page.wait_for_selector("table", timeout=25000)
            time.sleep(3.5) # Espera técnica para que los datos reactivos del DOM se asienten
        except Exception:
            print("[WARNING] La tabla de estadísticas de Opta no apareció a tiempo o hay un reto Cloudflare.")
            
        html = page.content()
        browser.close()
        return html

def parse_html_content(html):
    """
    Parsea las estadísticas de Opta desde el HTML y retorna los equipos y jugadores.
    """
    soup = BeautifulSoup(html, 'html.parser')
    
    # 1. Detectar equipos
    title_text = soup.title.text if soup.title else ""
    print(f"[DEBUG] Título de la página: {title_text}")
    
    teams = []
    team_elements = soup.find_all(class_=re.compile(r'team-name|teamName|fixture__team', re.I))
    for el in team_elements:
        name = el.text.strip()
        if name and name not in teams:
            teams.append(name)
            
    if len(teams) < 2:
        match = re.search(r'([A-Za-záéíóúÁÉÍÓÚ\s]+)\s+\d+\s*-\s*\d+\s+([A-Za-záéíóúÁÉÍÓÚ\s]+)', title_text)
        if match:
            teams = [match.group(1).strip(), match.group(2).strip()]
            
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
        
    print(f"[INFO] Equipos identificados: {teams[0]} vs {teams[1] if len(teams) > 1 else 'TBD'}")
    
    # 2. Buscar tabla de Opta
    tables = soup.find_all('table')
    player_data = []
    
    for table in tables:
        thead = table.find('thead')
        if thead:
            first_header_tr = thead.find('tr')
            headers = [th.text.strip() for th in first_header_tr.find_all(['th', 'td'])] if first_header_tr else [th.text.strip() for th in thead.find_all(['th', 'td'])]
        else:
            first_tr = table.find('tr')
            headers = [td.text.strip() for td in first_tr.find_all(['td', 'th'])] if first_tr else []
            
        key_columns = ['AP', 'xG', 'SCA', 'Pos.']
        if not any(col in headers for col in key_columns):
            continue
            
        print(f"[INFO] Tabla de Opta encontrada con columnas: {headers}")
        col_map = {col: headers.index(col) for col in headers if col}
        
        tbody = table.find('tbody')
        rows = tbody.find_all('tr') if tbody else table.find_all('tr')[1:]
        
        for row in rows:
            cols = row.find_all(['td', 'th'])
            if len(cols) < len(headers):
                continue
                
            player_name = cols[0].text.strip()
            player_name = re.sub(r'\s+', ' ', player_name).strip()
            player_name = re.sub(r'^(Starter|Substitute)\s*', '', player_name).strip()
            if not player_name or player_name in ["Pos.", "Player", "Jugador"] or len(player_name) < 3:
                continue
                
            stats = {}
            for col_name, idx in col_map.items():
                if idx < len(cols):
                    stats[col_name] = cols[idx].text.strip()
            
            try:
                # Detectar el equipo del jugador por la clase de la fila
                row_classes = row.get('class', [])
                player_team = "Unknown"
                if 'side-home' in row_classes:
                    player_team = teams[0]
                elif 'side-away' in row_classes:
                    player_team = teams[1]
                
                player_entry = {
                    "name": player_name,
                    "team": player_team,
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
                pass
        break
        
    return teams, player_data

class RequestHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        if parsed_url.path == '/scrape':
            query = urllib.parse.parse_qs(parsed_url.query)
            opta_url = query.get('url', [None])[0]
            
            if not opta_url:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self._send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": "Falta la URL de Opta en la peticion."}).encode('utf-8'))
                return

            try:
                # 1. Scrapear e intentar parsear
                html = scrape_match_html(opta_url)
                if not html:
                    raise Exception("No se pudo obtener el HTML de la pagina.")
                
                teams, players = parse_html_content(html)
                if not players:
                    raise Exception("No se extrajeron estadisticas de la tabla de Opta.")

                # 2. Guardar respaldo HTML
                script_dir = os.path.dirname(os.path.abspath(__file__))
                opta_dir = os.path.join(script_dir, 'opta_html')
                os.makedirs(opta_dir, exist_ok=True)
                
                match_key = f"{teams[0]} vs {teams[1]}".lower().replace(" ", "_")
                html_backup_path = os.path.join(opta_dir, f"{match_key}.html")
                with open(html_backup_path, 'w', encoding='utf-8') as f:
                    f.write(html)

                # 3. Guardar en player_stats.json
                output_path = os.path.join(script_dir, 'public', 'data', 'player_stats.json')
                all_stats = {}
                if os.path.exists(output_path):
                    try:
                        with open(output_path, 'r', encoding='utf-8') as f:
                            all_stats = json.load(f)
                    except Exception:
                        pass
                        
                all_stats[match_key] = {
                    "teams": teams,
                    "players": players
                }
                
                with open(output_path, 'w', encoding='utf-8') as out:
                    json.dump(all_stats, out, indent=4, ensure_ascii=False)

                # 4. Exito
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self._send_cors_headers()
                self.end_headers()
                response = {
                    "status": "success",
                    "message": f"Scrapeado correctamente: {teams[0]} vs {teams[1]} ({len(players)} jugadores)",
                    "teams": teams
                }
                self.wfile.write(json.dumps(response).encode('utf-8'))
                
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self._send_cors_headers()
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
        else:
            self.send_response(404)
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(b"Not Found")

def run(port=5000):
    server_address = ('', port)
    httpd = HTTPServer(server_address, RequestHandler)
    print(f"[INFO] Servidor Opta corriendo en el puerto {port}...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    print("[INFO] Deteniendo servidor...")
    httpd.server_close()

if __name__ == '__main__':
    run()
