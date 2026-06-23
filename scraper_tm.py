import os
import time
import random
import requests
from bs4 import BeautifulSoup
import pandas as pd

USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0'
]

def get_soup(url):
    headers = {
        'User-Agent': random.choice(USER_AGENTS),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
    }
    print(f"[INFO] Descargando {url} ...")
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        return BeautifulSoup(response.content, 'html.parser')
    else:
        print(f"[ERROR] Código HTTP {response.status_code}")
        return None

def parse_market_value(val_str):
    """
    Convierte '€1.04bn' -> 1040000000.0
    Convierte '€850m' -> 850000000.0
    """
    val_str = val_str.lower().replace('€', '').strip()
    if not val_str or val_str == '-': return 0.0
    
    multiplier = 1.0
    if 'bn' in val_str:
        multiplier = 1e9
        val_str = val_str.replace('bn', '')
    elif 'm' in val_str:
        multiplier = 1e6
        val_str = val_str.replace('m', '')
    elif 'k' in val_str:
        multiplier = 1e3
        val_str = val_str.replace('k', '')
        
    try:
        return float(val_str) * multiplier
    except ValueError:
        return 0.0

def scrape_top_national_teams():
    # URL de los equipos nacionales más valiosos (página 1 de 4, usualmente trae 25 por página, así que buscaremos varias)
    base_url = "https://www.transfermarkt.com/vereins-statistik/wertvollstenationalmannschaften/marktwertetop"
    
    teams_data = []
    
    for page in range(1, 5):  # 100 selecciones
        url = f"{base_url}?page={page}"
        soup = get_soup(url)
        if not soup: break
        
        table = soup.find('table', class_='items')
        if not table:
            print("[ERROR] No se encontró la tabla de equipos en la página.")
            break
            
        tbody = table.find('tbody')
        rows = tbody.find_all('tr')
        
        for row in rows:
            cols = row.find_all('td')
            if len(cols) < 5: continue
            
            # Buscar el nombre del equipo en el tag <a>
            # Usualmente en cols[1] o cols[2] dependiendo del DOM exacto
            # Iteramos en las columnas buscando el link de la bandera
            team_name = ""
            for a_tag in row.find_all('a'):
                if a_tag.get('title') and 'National Team' not in a_tag.get('title'):
                    team_name = a_tag.get('title')
                    break
                    
            if not team_name:
                team_name = row.text.strip().split('\n')[1].strip() if len(row.text.strip().split('\n')) > 1 else "Unknown"
            
            try:
                squad_size = cols[3].text.strip()
                avg_age = cols[4].text.strip()
                market_val_str = cols[-1].text.strip() # Última columna
            except IndexError:
                continue
            
            market_val_num = parse_market_value(market_val_str)
            
            teams_data.append({
                'team': team_name,
                'squad_size': int(squad_size) if squad_size.isdigit() else 0,
                'avg_age': float(avg_age.replace(',', '.')) if avg_age.replace(',', '.').replace('.', '', 1).isdigit() else 0.0,
                'market_value_str': market_val_str,
                'market_value_num': market_val_num
            })
            
        time.sleep(random.uniform(1.5, 3.0)) # Retraso para no ser bloqueado
        
    return teams_data

if __name__ == "__main__":
    print("Iniciando Scraper de Transfermarkt...")
    data = scrape_top_national_teams()
    
    if data:
        df = pd.DataFrame(data)
        out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public', 'data')
        os.makedirs(out_dir, exist_ok=True)
        out_path = os.path.join(out_dir, 'market_values.csv')
        df.to_csv(out_path, index=False, encoding='utf-8')
        print(f"[OK] Extraídos {len(df)} países. Guardado en {out_path}")
        print(df.head(10))
    else:
        print("[FAIL] No se obtuvieron datos.")
