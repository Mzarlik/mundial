import os
import pandas as pd
import numpy as np

# =====================================================================
# ⚙️ CONFIGURACIÓN Y MAPEOS
# =====================================================================

# Nombres en el CSV -> Nombres oficiales en results.csv (Inglés)
CSV_TO_RESULTS = {
    'Czechia': 'Czech Republic',
    'Bosnia': 'Bosnia and Herzegovina',
    'USA': 'United States',
    'Turkiye': 'Turkey'
}

# Nombres en el CSV -> Nombres en Español para la UI
ENGLISH_TO_SPANISH = {
    'Mexico': 'México', 'South Africa': 'Sudáfrica', 'South Korea': 'Corea del Sur',
    'Czechia': 'Chequia', 'Canada': 'Canadá', 'Bosnia': 'Bosnia y Herzegovina',
    'Qatar': 'Catar', 'Switzerland': 'Suiza', 'Brazil': 'Brasil',
    'Morocco': 'Marruecos', 'Haiti': 'Haití', 'Scotland': 'Escocia',
    'USA': 'Estados Unidos', 'Paraguay': 'Paraguay', 'Australia': 'Australia',
    'Turkiye': 'Turquía', 'Germany': 'Alemania', 'Curaçao': 'Curazao',
    'Ivory Coast': 'Costa de Marfil', 'Ecuador': 'Ecuador', 'Netherlands': 'Países Bajos',
    'Japan': 'Japón', 'Sweden': 'Suecia', 'Tunisia': 'Túnez', 'Belgium': 'Bélgica',
    'Egypt': 'Egipto', 'Iran': 'Irán', 'New Zealand': 'Nueva Zelanda', 'Spain': 'España',
    'Cape Verde': 'Cabo Verde', 'Saudi Arabia': 'Arabia Saudita', 'Uruguay': 'Uruguay',
    'France': 'Francia', 'Senegal': 'Senegal', 'Iraq': 'Irak', 'Norway': 'Noruega',
    'Argentina': 'Argentina', 'Algeria': 'Argelia', 'Austria': 'Austria', 'Jordan': 'Jordania',
    'Portugal': 'Portugal', 'DR Congo': 'RD Congo', 'Uzbekistan': 'Uzbekistán',
    'Colombia': 'Colombia', 'England': 'Inglaterra', 'Croatia': 'Croacia',
    'Ghana': 'Ghana', 'Panama': 'Panamá'
}

# Nombres en Español -> Códigos de bandera (FlagCDN)
TEAM_TO_FLAG = {
    'Argentina': 'ar', 'Austria': 'at', 'Francia': 'fr', 'Irak': 'iq',
    'Noruega': 'no', 'Senegal': 'sn', 'Jordania': 'jo', 'Argelia': 'dz',
    'Portugal': 'pt', 'Uzbekistán': 'uz', 'Inglaterra': 'gb-eng', 'Ghana': 'gh',
    'Panamá': 'pa', 'Croacia': 'hr', 'Colombia': 'co', 'RD Congo': 'cd',
    'Suiza': 'ch', 'Canadá': 'ca', 'Bosnia y Herzegovina': 'ba', 'Catar': 'qa',
    'Escocia': 'gb-sct', 'Brasil': 'br', 'Marruecos': 'ma', 'Haití': 'ht',
    'Chequia': 'cz', 'México': 'mx', 'Sudáfrica': 'za', 'Corea del Sur': 'kr',
    'Ecuador': 'ec', 'Alemania': 'de', 'Curazao': 'cw', 'Costa de Marfil': 'ci',
    'Japón': 'jp', 'Suecia': 'se', 'Túnez': 'tn', 'Países Bajos': 'nl',
    'Turquía': 'tr', 'Estados Unidos': 'us', 'Paraguay': 'py', 'Australia': 'au',
    'Cabo Verde': 'cv', 'Arabia Saudita': 'sa', 'Uruguay': 'uy', 'España': 'es',
    'Egipto': 'eg', 'Irán': 'ir', 'Nueva Zelanda': 'nz', 'Bélgica': 'be'
}

# Nombre del equipo -> Abreviación de 3 letras para el ID del partido
TEAM_TO_ID_ABBR = {
    'Mexico': 'mex', 'South Africa': 'rsa', 'South Korea': 'kor', 'Czechia': 'cze',
    'Canada': 'can', 'Bosnia': 'bih', 'Qatar': 'qat', 'Switzerland': 'sui',
    'Brazil': 'bra', 'Morocco': 'mar', 'Haiti': 'hai', 'Scotland': 'sco', 'USA': 'usa',
    'Paraguay': 'par', 'Australia': 'aus', 'Turkiye': 'tur', 'Germany': 'ger', 'Curaçao': 'cur',
    'Ivory Coast': 'civ', 'Ecuador': 'ecu', 'Netherlands': 'ned', 'Japan': 'jpn', 'Sweden': 'swe', 'Tunisia': 'tun',
    'Belgium': 'bel', 'Egypt': 'egy', 'Iran': 'irn', 'New Zealand': 'nzl', 'Spain': 'esp', 'Cape Verde': 'cpv',
    'Saudi Arabia': 'sau', 'Uruguay': 'uru', 'France': 'fra', 'Senegal': 'sen', 'Iraq': 'irq', 'Norway': 'nor',
    'Argentina': 'arg', 'Algeria': 'alg', 'Austria': 'aut', 'Jordan': 'jor', 'Portugal': 'por', 'DR Congo': 'cod',
    'Uzbekistan': 'uzb', 'Colombia': 'col', 'England': 'eng', 'Croatia': 'cro', 'Ghana': 'gha', 'Panama': 'pan'
}

VENUES = [
    'MetLife Stadium, East Rutherford', 'SoFi Stadium, Inglewood', 'AT&T Stadium, Arlington',
    'Mercedes-Benz Stadium, Atlanta', 'NRG Stadium, Houston', 'Lincoln Financial Field, Filadelfia',
    'Lumen Field, Seattle', 'Levi\'s Stadium, Santa Clara', 'Gillette Stadium, Foxborough',
    'Hard Rock Stadium, Miami Gardens', 'Arrowhead Stadium, Kansas City', 'BMO Field, Toronto',
    'BC Place, Vancouver', 'Estadio Azteca, Ciudad de México', 'Estadio BBVA, Monterrey',
    'Estadio Akron, Zapopan'
]

TIMES = ['1:00 PM ET', '4:00 PM ET', '7:00 PM ET', '10:00 PM ET']

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    csv_sim_path = os.path.join(script_dir, 'partidos_simulados.csv')
    csv_results_path = os.path.join(script_dir, 'international_results-master', 'international_results-master', 'results.csv')
    js_matches_path = os.path.join(script_dir, 'src', 'config', 'matches.js')
    
    if not os.path.exists(csv_sim_path):
        print(f"[ERROR] No se encontró {csv_sim_path}")
        return
    
    # 1. Cargar partidos simulados
    df_sim = pd.read_csv(csv_sim_path)
    print(f"[INFO] Cargados {len(df_sim)} partidos desde partidos_simulados.csv")
    
    # 2. Cargar results.csv para sincronizar marcadores jugados
    if os.path.exists(csv_results_path):
        df_results = pd.read_csv(csv_results_path)
        print(f"[INFO] Historial results.csv cargado ({len(df_results)} registros)")
        
        updated_count = 0
        for idx, row in df_sim.iterrows():
            g_home = row['Goles Local']
            g_away = row['Goles Visitante']
            
            # Solo actualizar si el partido ya se jugó (goles no nulos/vacíos)
            if pd.notna(g_home) and pd.notna(g_away) and str(g_home).strip() != '' and str(g_away).strip() != '':
                hs = int(g_home)
                as_ = int(g_away)
                
                # Normalizar nombres para results.csv
                team_h = CSV_TO_RESULTS.get(row['Local'], row['Local'])
                team_a = CSV_TO_RESULTS.get(row['Visitante'], row['Visitante'])
                
                # Buscar fila en results.csv para 2026-06
                mask = df_results['date'].astype(str).str.startswith('2026-06') & (df_results['home_team'] == team_h) & (df_results['away_team'] == team_a)
                if mask.sum() > 0:
                    df_results.loc[mask, 'home_score'] = hs
                    df_results.loc[mask, 'away_score'] = as_
                    updated_count += 1
                else:
                    # Probar al revés por si acaso
                    mask_rev = df_results['date'].astype(str).str.startswith('2026-06') & (df_results['home_team'] == team_a) & (df_results['away_team'] == team_h)
                    if mask_rev.sum() > 0:
                        df_results.loc[mask_rev, 'home_score'] = as_
                        df_results.loc[mask_rev, 'away_score'] = hs
                        updated_count += 1
                    else:
                        # Si no existe, lo insertamos como fila nueva para asegurar que entre al set de entrenamiento
                        print(f"[WARNING] Partido no encontrado en results.csv, insertando nuevo: {team_h} vs {team_a}")
                        new_row = {
                            'date': '2026-06-15', # Fecha genérica
                            'home_team': team_h,
                            'away_team': team_a,
                            'home_score': hs,
                            'away_score': as_,
                            'tournament': 'FIFA World Cup',
                            'city': 'Dallas',
                            'country': 'United States',
                            'neutral': True
                        }
                        df_results = pd.concat([df_results, pd.DataFrame([new_row])], ignore_index=True)
                        updated_count += 1
                        
        df_results.to_csv(csv_results_path, index=False)
        print(f"[OK] Sincronizados y actualizados {updated_count} partidos jugados en results.csv")
    else:
        print(f"[WARNING] No se encontró {csv_results_path}, omitiendo sincronización de resultados.")
        
    # 3. Generar archivo matches.js con los 72 partidos organizados por Jornadas
    print("[INFO] Reconstruyendo src/config/matches.js...")
    
    js_content = """/* ARCHIVO AUTO-GENERADO POR sync_and_generate.py: edita equipos, jornadas y graficas desde partidos_simulados.csv */
export const DAYS = [
  { id: "jornada1", label: "Jornada 1", full: "Primera Jornada - Fase de Grupos" },
  { id: "jornada2", label: "Jornada 2", full: "Segunda Jornada - Fase de Grupos" },
  { id: "jornada3", label: "Jornada 3", full: "Tercera Jornada - Fase de Grupos" },
];

export function flagUrl(code) { return `https://flagcdn.com/w80/${code.toLowerCase()}.png`; }

export const MATCHES = [
"""
    
    for idx, row in df_sim.iterrows():
        loc = row['Local']
        vis = row['Visitante']
        
        # Mapear a Español
        loc_esp = ENGLISH_TO_SPANISH.get(loc, loc)
        vis_esp = ENGLISH_TO_SPANISH.get(vis, vis)
        
        # Mapear códigos de banderas
        flag_h = TEAM_TO_FLAG.get(loc_esp, 'default')
        flag_a = TEAM_TO_FLAG.get(vis_esp, 'default')
        
        # Mapear abreviaciones para ID
        abbr_h = TEAM_TO_ID_ABBR.get(loc, loc[:3].lower())
        abbr_a = TEAM_TO_ID_ABBR.get(vis, vis[:3].lower())
        match_id = f"{abbr_h}-{abbr_a}"
        
        # Calcular Grupo
        grp_idx = idx // 6
        grp_letter = chr(ord('A') + grp_idx)
        group_name = f"Grupo {grp_letter}"
        
        # Calcular Jornada (day)
        jornada_idx = (idx % 6) // 2 + 1
        day_id = f"jornada{jornada_idx}"
        
        # Rotar Estadios e Instantes
        venue = VENUES[idx % len(VENUES)]
        time = TIMES[idx % len(TIMES)]
        
        # Estructurar objetos gráficos usando comillas dobles para evitar conflictos de comillas simples
        graphs_str = (
            f'graphs:{{mcmc:"/graphs/{day_id}/{match_id}_mcmc.png", '
            f'xgboost:"/graphs/{day_id}/{match_id}_xgboost.png", '
            f'accuracy:"/graphs/{day_id}/{match_id}_accuracy.png", '
            f'Resumen:"/graphs/{day_id}/{match_id}_resumen.png", '
            f'mlp:"/graphs/{day_id}/{match_id}_mlp.png", '
            f'ensemble:"/graphs/{day_id}/{match_id}_ensemble.png", '
            f'catboost:"/graphs/{day_id}/{match_id}_catboost.png", '
            f'mfa:"/graphs/{day_id}/{match_id}_mfa.png"}}'
        )
        
        colab = "https://github.com/Malpi/mundial"
        
        js_content += f'  {{id:"{match_id}",day:"{day_id}",homeCode:"{flag_h}",awayCode:"{flag_a}",home:"{loc_esp}",away:"{vis_esp}",group:"{group_name}",time:"{time}",venue:"{venue}",\n   {graphs_str},colabLink:"{colab}"}},\n'
        
    js_content += """];

export function getMatchesByDay(dayId) { return MATCHES.filter(m => m.day === dayId); }
export function getMatchById(matchId) { return MATCHES.find(m => m.id === matchId); }
"""
    
    os.makedirs(os.path.dirname(js_matches_path), exist_ok=True)
    with open(js_matches_path, 'w', encoding='utf-8') as f:
        f.write(js_content)
        
    print(f"[OK] matches.js reescrito exitosamente en: {js_matches_path}")
    print(f"[INFO] Ahora puedes ejecutar predict_matches.py para re-entrenar y predecir los 72 partidos de forma nativa!")

if __name__ == '__main__':
    main()
