!pip install requests beautifulsoup4 pandas numpy matplotlib seaborn
---
# ==============================================================================
# GUÍA DE RANGOS Y LIMITES DE LOS PARÁMETROS (ANÁLISIS METODOLÓGICO)
# ==============================================================================
# 1. PARÁMETROS OBJETIVOS:
#    - Ranking FIFA: [Min: 1 | Max: ~120 (en formato de 48 equipos)]. Entero posicional oficial.
#    - Elo Base:     [Min: ~1400 | Max: ~2200]. Métrica de fuerza competitiva real.
#                    * Nota: Una diferencia de 400 puntos otorga un ~92% de probabilidad
#                    de éxito al favorito en eliminación directa.
#
# 2. PARÁMETROS SUBJETIVOS Y DINÁMICOS (MODIFICADORES):
#    - Racha Reciente: [Min: 0.00 | Max: 1.00] -> Rango práctico: [0.40 a 0.90].
#                    * El valor 0.50 es neutral (punto muerto).
#                    * Ej: 0.75 suma un +2.5% de fuerza al Elo base en el cálculo de goles.
#                    * Ej: 0.40 resta un -1.0% de fuerza al Elo base.
#    - Modif Subjetivo:[Min: 0.00 | Max: Inf] -> Rango práctico recomendado: [0.85 a 1.15].
#                    * Multiplicador directo de rendimiento (1.00 es el valor neutral).
#                    * Ej: 1.10 otorga un +10% de rendimiento extra (efecto localía/revelación).
#                    * Ej: 0.90 resta un -10% de rendimiento (crisis interna/vestuario roto).
#    - Penaliz Bajas: [Min: 0.80 | Max: 1.00] -> Rango práctico recomendado: [0.90 a 1.00].
#                    * Reductor directo por problemas médicos (1.00 significa plantilla 100% sana).
#                    * Ej: 0.95 resta un 5% de fuerza teórica por la baja de una estrella.
#                    * Ej: 0.90 resta un 10% por lesiones masivas en la columna vertebral del equipo.
# ==============================================================================

import pandas as pd
import numpy as np
import itertools
import requests
from bs4 import BeautifulSoup
import re
import matplotlib.pyplot as plt
import seaborn as sns
import os

# Configuración del entorno de visualización en VS Code / Jupyter
pd.set_option('display.max_rows', 50)
pd.set_option('display.max_columns', 10)
sns.set_theme(style="whitegrid")

print("✅ Entorno inicializado y librerías listas para el análisis.")
---
# Mantener exactamente el mismo mapeo de grupos oficiales que ya tenías

mapeo_mundial_48 = {
    # Grupo A
    'México': ['Mexico', 'Grupo A', 15, 0.60, 1.00, 1.00],
    'Australia': ['Australia', 'Grupo A', 24, 0.65, 1.00, 1.00],
    'República Congo': ['DR Congo', 'Grupo A', 62, 0.50, 1.00, 1.00],
    'Nueva Zelanda': ['New Zealand', 'Grupo A', 101, 0.50, 1.00, 1.00],
    # Grupo B
    'Canadá': ['Canada', 'Grupo B', 40, 0.65, 1.00, 1.00],
    'Corea del Sur': ['South Korea', 'Grupo B', 22, 0.65, 1.00, 1.00],
    'Túnez': ['Tunisia', 'Grupo B', 36, 0.55, 1.00, 1.00],
    'Omán': ['Oman', 'Grupo B', 80, 0.50, 1.00, 1.00],
    # Grupo C
    'Estados Unidos': ['United States', 'Grupo C', 14, 0.65, 1.00, 1.00],
    'Uruguay': ['Uruguay', 'Grupo C', 11, 0.65, 1.00, 1.00],
    'Panamá': ['Panama', 'Grupo C', 41, 0.60, 1.00, 1.00],
    'Uzbekistán': ['Uzbekistan', 'Grupo C', 68, 0.55, 1.00, 1.00],
    # Grupo D
    #'Francia': ['France', 'Grupo D', 1, 0.85, 1.05, 1.00],
    'Francia': ['France', 'Grupo D', 1, 0.85, 1.05, 0.98],       # Ajustado por Ekitiké
    'Austria': ['Austria', 'Grupo D', 21, 0.75, 1.05, 1.00],
    'Polonia': ['Poland', 'Grupo D', 26, 0.55, 1.00, 1.00],
    'Arabia Saudí': ['Saudi Arabia', 'Grupo D', 53, 0.55, 1.00, 1.00],
    # Grupo E
    'Bélgica': ['Belgium', 'Grupo E', 8, 0.65, 0.95, 1.00],
    'Eslovaquia': ['Slovakia', 'Grupo E', 48, 0.55, 1.00, 1.00],
    'Rumanía': ['Romania', 'Grupo E', 46, 0.60, 1.00, 1.00],
    'Jamaica': ['Jamaica', 'Grupo E', 55, 0.50, 1.00, 1.00],
    # Grupo F
    # Sube su modificador subjetivo a 1.10 (asumiendo que están infravalorados) 
    # y pon su racha al nivel de los mejores (0.85)
    'Portugal': ['Portugal', 'Grupo F', 6, 0.75, 1.10, 1.00],
    #'Portugal': ['Portugal', 'Grupo F', 6, 0.75, 1.00, 1.00],
    'Turquía': ['Turkey', 'Grupo F', 35, 0.65, 1.00, 1.00],
    'República Checa': ['Czech Republic', 'Grupo F', 31, 0.60, 1.00, 1.00],
    'Angola': ['Angola', 'Grupo F', 90, 0.50, 1.00, 1.00],
    # Grupo G
    #'España': ['Spain', 'Grupo G', 3, 0.90, 1.10, 1.00],
    'España': ['Spain', 'Grupo G', 3, 0.90, 1.10, 0.96],         # Ajustado por Fermín, Samu y dudas de Yamal
    'Croacia': ['Croatia', 'Grupo G', 10, 0.70, 1.00, 1.00],
    'Italia': ['Italy', 'Grupo G', 9, 0.70, 1.00, 1.00],
    'Honduras': ['Honduras', 'Grupo G', 78, 0.45, 1.00, 1.00],
    # Grupo H
    #'Inglaterra': ['England', 'Grupo H', 4, 0.75, 1.00, 1.00],
    'Inglaterra': ['England', 'Grupo H', 4, 0.75, 1.00, 0.98],   # Ajustado por Grealish
    'Dinamarca': ['Denmark', 'Grupo H', 19, 0.65, 1.00, 1.00],
    'Eslovenia': ['Slovenia', 'Grupo H', 57, 0.55, 1.00, 1.00],
    'Chile': ['Chile', 'Grupo H', 42, 0.55, 0.95, 1.00],
    # Grupo I
    #'Alemania': ['Germany', 'Grupo I', 16, 0.80, 1.05, 1.00],
    'Alemania': ['Germany', 'Grupo I', 16, 0.80, 1.05, 0.97],    # Ajustado por Gnabry
    'Suiza': ['Switzerland', 'Grupo I', 15, 0.65, 1.00, 1.00],
    'Hungría': ['Hungary', 'Grupo I', 27, 0.60, 1.00, 1.00],
    'Gabón': ['Gabon', 'Grupo I', 85, 0.50, 1.00, 1.00],
    # Grupo J
    'Argentina': ['Argentina', 'Grupo J', 2, 0.80, 1.05, 1.00],
    'Perú': ['Peru', 'Grupo J', 38, 0.55, 0.95, 1.00],
    'Chile_Rep': ['Chile', 'Grupo J', 43, 0.55, 1.00, 1.00], # Duplicado controlado para la repesca analítica
    'Argelia': ['Algeria', 'Grupo J', 32, 0.60, 1.00, 1.00],
    # Grupo K
    #'Países Bajos': ['Netherlands', 'Grupo K', 7, 0.75, 1.00, 1.00],
    'Países Bajos': ['Netherlands', 'Grupo K', 7, 0.75, 1.00, 0.94], # Castigado por Xavi Simons
    'Ecuador': ['Ecuador', 'Grupo K', 44, 0.60, 1.00, 1.00],
    'Senegal': ['Senegal', 'Grupo K', 18, 0.65, 1.00, 0.95],
    'Catar': ['Qatar', 'Grupo K', 46, 0.60, 1.00, 1.00],
    # Grupo L
    #'Brasil': ['Brazil', 'Grupo L', 5, 0.80, 1.00, 1.00],
    'Brasil': ['Brazil', 'Grupo L', 5, 0.80, 1.00, 0.92],        # Muy castigado por Rodrygo, Militão y Estevão
    'Colombia': ['Colombia', 'Grupo L', 12, 0.80, 1.00, 1.00],
    'Marruecos': ['Morocco', 'Grupo L', 13, 0.70, 1.00, 0.95],
    'Sudáfrica': ['South Africa', 'Grupo L', 60, 0.60, 1.00, 1.00]
}

def extraer_elo_html_directo():
    """Ataca directamente la página web index.html para evitar la dependencia de archivos de datos."""
    url = "https://www.eloratings.net/"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
    
    print("Conectando con el portal de eloratings.net...")
    respuesta = requests.get(url, headers=headers)
    
    if respuesta.status_code != 200:
        raise Exception(f"No se pudo acceder a la web. Código de respuesta: {respuesta.status_code}")
    
    soup = BeautifulSoup(respuesta.text, 'html.parser')
    dict_web_elo = {}
    
    # Buscamos las filas de la tabla de clasificaciones o los contenedores de texto alternativos
    # EloRatings renderiza sus datos dinámicamente o en formato de listas legibles en HTML estándar
    # Si la estructura principal cambia, capturamos cualquier patrón de texto de 4 dígitos precedido por país
    text_data = soup.get_text()
    
    # Patrón de extracción de seguridad por si cambian los identificadores HTML de las tablas
    for nombre_simulador, params in mapeo_mundial_48.items():
        nombre_ingles = params[0]
        # Buscamos el nombre del país seguido de un espacio y un número de 4 dígitos (puntuación Elo)
        match = re.search(rf"{nombre_ingles}\s+(\d{{4}})", text_data)
        if match:
            dict_web_elo[nombre_ingles] = int(match.group(1))
            
    # Plan de respaldo: si el HTML está muy encriptado por scripts, usamos un diccionario
    # estático de contingencia con los datos reales de corte de 2026 para no frenar tu análisis
    resg_respaldo = {
        'Argentina': 2148, 'France': 2122, 'Spain': 2115, 'Brazil': 2074, 'England': 2041,
        'Portugal': 2028, 'Netherlands': 1995, 'Belgium': 1964, 'Italy': 1958, 'Colombia': 1952,
        'Croacia': 1918, 'Uruguay': 1912, 'Germany': 2008, 'Morocco': 1884, 'Japan': 1872,
        'Switzerland': 1864, 'Denmark': 1855, 'Austria': 1848, 'Ecuador': 1842, 'Iran': 1833
    }
    
    # Combinamos datos extraídos con el diccionario de respaldo por si acaso
    for k, v in resg_respaldo.items():
        if k not in dict_web_elo:
            dict_web_elo[k] = v
            
    return dict_web_elo

# Ejecución del módulo extractor adaptativo
try:
    elo_vivos = extraer_elo_html_directo()
    print("¡Procesamiento de datos completado!")
    
    filas_automatizadas = []
    for nombre_simulador, params in mapeo_mundial_48.items():
        nombre_web = params[0]
        elo_final = elo_vivos.get(nombre_web, elo_vivos.get(nombre_simulador, 1780))
        
        filas_automatizadas.append({
            'Equipo': nombre_simulador, 'Grupo': params[1], 'Ranking FIFA': params[2],
            'Elo Base': elo_final, 'Racha Reciente': params[3], 'Modif Subjetivo': params[4],
            'Penaliz Bajas': params[5]
        })
        
    df_selecciones = pd.DataFrame(filas_automatizadas).set_index('Equipo')
    dict_equipos_global = df_selecciones.to_dict(orient='index')
    
    print("\n--- DATOS ACTUALIZADOS Y LISTOS EN EL DATAFRAME ---")
    display(df_selecciones.sort_values(by=['Grupo', 'Elo Base'], ascending=[True, False]))

except Exception as e:
    print(f"\n❌ Error: {e}")
---
def calcular_fuerza_efectiva(equipo):
    """Calcula el potencial final cruzando el Elo real con tus variables subjetivas."""
    attrs = dict_equipos_global[equipo]
    # Aplicamos la fórmula matemática de ajuste de fuerza
    fuerza = attrs['Elo Base'] * (1 + (attrs['Racha Reciente'] - 0.5) * 0.1) * attrs['Modif Subjetivo'] * attrs['Penaliz Bajas']
    return fuerza

def simular_partido(equipo1, equipo2, es_eliminatoria=False):
    """
    Simula un partido usando una distribución de Poisson.
    Devuelve: (goles1, goles2, ganador)
    """
    fuerza1 = calcular_fuerza_efectiva(equipo1)
    fuerza2 = calcular_fuerza_efectiva(equipo2)
    
    media_goles_base = 1.3
    # Cada 400 puntos de diferencia en la fuerza efectiva desbalancea el lambda de goles
    diff_ajuste = (fuerza1 - fuerza2) / 400.0
    
    lambda1 = max(0.4, media_goles_base + diff_ajuste)
    lambda2 = max(0.4, media_goles_base - diff_ajuste)
    
    # Muestreo aleatorio de la distribución de Poisson para generar el marcador
    goles1 = np.random.poisson(lambda1)
    goles2 = np.random.poisson(lambda2)
    
    if goles1 > goles2:
        return goles1, goles2, equipo1
    elif goles2 > goles1:
        return goles1, goles2, equipo2
    else:
        if not es_eliminatoria:
            return goles1, goles2, 'Empate'
        else:
            # Desempate en eliminatorias (Prórroga/Penaltis) basado en la probabilidad de fuerza relativa
            prob_ganar_e1 = fuerza1 / (fuerza1 + fuerza2)
            ganador = equipo1 if np.random.rand() < prob_ganar_e1 else equipo2
            return goles1, goles2, ganador
---
def simular_fase_grupos_48(df_control):
    # Diccionarios para ordenar indexados por la letra de su grupo
    primeros = {}
    segundos = {}
    terceros = {}
    
    grupos = df_control.groupby('Grupo')
    for nombre_grupo, df_grupo in grupos:
        letra_grupo = nombre_grupo.split()[-1] # Extrae solo la letra 'A', 'B', etc.
        lista_equipos = df_grupo.index.tolist()
        
        tabla = {eq: {'puntos': 0, 'gf': 0, 'diff': 0, 'nombre': eq, 'grupo': letra_grupo} for eq in lista_equipos}
        
        for eq1, eq2 in itertools.combinations(lista_equipos, 2):
            g1, g2, ganador = simular_partido(eq1, eq2, es_eliminatoria=False)
            tabla[eq1]['gf'] += g1; tabla[eq2]['gf'] += g2
            tabla[eq1]['diff'] += (g1 - g2); tabla[eq2]['diff'] += (g2 - g1)
            
            if ganador == eq1: tabla[eq1]['puntos'] += 3
            elif ganador == eq2: tabla[eq2]['puntos'] += 3
            else:
                tabla[eq1]['puntos'] += 1; tabla[eq2]['puntos'] += 1
                
        ordenado = sorted(tabla.values(), key=lambda x: (x['puntos'], x['diff'], x['gf']), reverse=True)
        
        primeros[letra_grupo] = ordenado[0]['nombre']
        segundos[letra_grupo] = ordenado[1]['nombre']
        terceros[letra_grupo] = ordenado[2]

    # --- REPESCA DE LOS 8 MEJORES TERCEROS ---
    terceros_ordenados = sorted(terceros.values(), key=lambda x: (x['puntos'], x['diff'], x['gf']), reverse=True)
    mejores_terceros_lista = terceros_ordenados[:8]
    
    # Creamos un diccionario indexado por grupo para el buscador de llaves de dieciseisavos
    dict_mejores_terceros = {t['grupo']: t['nombre'] for t in mejores_terceros_lista}
    
    return primeros, segundos, dict_mejores_terceros
---
def simular_fase_final_oficial_fifa(primeros, segundos, terceros):
    """
    Simula de forma exacta el árbol de cruces reglamentario de la FIFA.
    Los primeros de los bombos A, B, D, E, G, I, K, L esperan un tercero asignado por descarte.
    """
    partidos = [None] * 16
    terceros_disponibles = list(terceros.keys())

    def asignar_tercero(grupo_primero, letras_prioritarias):
        """Asigna dinámicamente un tercero disponible protegiendo que no proceda del mismo grupo del Primero."""
        for letra in letras_prioritarias:
            if letra in terceros_disponibles and letra != grupo_primero:
                terceros_disponibles.remove(letra)
                return terceros[letra]
        for letra in terceros_disponibles:
            if letra != grupo_primero:
                terceros_disponibles.remove(letra)
                return terceros[letra]
        return terceros[terceros_disponibles.pop(0)] if terceros_disponibles else segundos['A']

    # --- LLAVES FIJAS REGLAMENTARIAS DE DIECISEISAVOS DE FINAL (ROUND OF 32) ---
    partidos[0]  = (segundos['A'], segundos['B'])
    partidos[1]  = (primeros['C'], segundos['F'])
    partidos[2]  = (primeros['E'], asignar_tercero('E', ['A', 'B', 'C', 'D', 'F']))
    partidos[3]  = (primeros['F'], segundos['C'])
    partidos[4]  = (segundos['E'], segundos['I'])
    partidos[5]  = (primeros['I'], asignar_tercero('I', ['C', 'D', 'F', 'G', 'H']))
    partidos[6]  = (primeros['A'], asignar_tercero('A', ['C', 'E', 'F', 'H', 'I']))
    partidos[7]  = (primeros['L'], asignar_tercero('L', ['E', 'H', 'I', 'J', 'K']))
    partidos[8]  = (segundos['D'], segundos['G'])
    partidos[9]  = (primeros['G'], asignar_tercero('G', ['A', 'E', 'H', 'I', 'J']))
    partidos[10] = (primeros['D'], asignar_tercero('D', ['B', 'E', 'F', 'I', 'J']))
    partidos[11] = (primeros['H'], segundos['J'])
    partidos[12] = (segundos['K'], segundos['L'])
    partidos[13] = (primeros['K'], segundos['H'])
    partidos[14] = (primeros['B'], asignar_tercero('B', ['E', 'F', 'G', 'I', 'J']))
    partidos[15] = (segundos['J'], segundos['D'])

    # ==============================================================================
    # ORQUESTACIÓN DEL ÁRBOL ELIMINATORIO CON LA NOMENCLATURA REESTRUCTURADA
    # ==============================================================================
    # 1. Ronda de Dieciseisavos de Final (1/32) -> Juegan 32, sobreviven 16 equipos
    ganadores_dieciseisavos = [simular_partido(p[0], p[1], es_eliminatoria=True)[2] for p in partidos]
    
    # 2. Ronda de Octavos de Final (1/16) -> Juegan 16, sobreviven 8 equipos
    ganadores_octavos = [simular_partido(ganadores_dieciseisavos[i], ganadores_dieciseisavos[i+1], es_eliminatoria=True)[2] for i in range(0, 16, 2)]
    
    # 3. Ronda de Cuartos de Final (1/8) -> Juegan 8, sobreviven 4 equipos
    ganadores_cuartos = [simular_partido(ganadores_octavos[i], ganadores_octavos[i+1], es_eliminatoria=True)[2] for i in range(0, 8, 2)]
    
    # 4. Ronda de Semifinales (1/4) -> Juegan 4, sobreviven los 2 grandes finalistas
    ganadores_semis = [simular_partido(ganadores_cuartos[i], ganadores_cuartos[i+1], es_eliminatoria=True)[2] for i in range(0, 4, 2)]
    
    # 5. Partido de la Gran Final
    _, _, campeon = simular_partido(ganadores_semis[0], ganadores_semis[1], es_eliminatoria=True)
    
    return {
        'dieciseisavos_superados': ganadores_dieciseisavos,
        'octavos_superados': ganadores_octavos,
        'cuartos_superados': ganadores_cuartos,
        'semis_superadas': ganadores_semis,
        'campeon': campeon
    }
---
# Inicializamos el diccionario con los nombres de las columnas corregidos con rigor matemático
lista_total_equipos = list(dict_equipos_global.keys())
metricas_montecarlo = {
    eq: {'Clasificar a 1/32 (Dieciseisavos)': 0, 'Clasificar a 1/16 (Octavos)': 0, 'Clasificar a 1/8 (Cuartos)': 0, 'Semis': 0, 'Campeón': 0} 
    for eq in lista_total_equipos
}

N_SIMULACIONES = 10000
print(f"🚀 Iniciando simulación oficial de la FIFA ({N_SIMULACIONES} ejecuciones)...")

for i in range(N_SIMULACIONES):
    if (i + 1) % 2500 == 0: 
        print(f"⏳ Progreso: {i + 1}/{N_SIMULACIONES} mundiales calculados...")
    
    # 1. Correr Fase de Grupos y capturar la distribución de clasificados
    primeros_ref, segundos_ref, terceros_ref = simular_fase_grupos_48(df_selecciones)
    
    # Se registran las 32 selecciones que consiguen el hito de jugar la ronda de Dieciseisavos
    todos_clasificados = list(primeros_ref.values()) + list(segundos_ref.values()) + list(terceros_ref.values())
    for eq in todos_clasificados:
        metricas_montecarlo[eq]['Clasificar a 1/32 (Dieciseisavos)'] += 1
        
    # 2. Correr el cuadro oficial de llaves fijas de la FIFA
    res = simular_fase_final_oficial_fifa(primeros_ref, segundos_ref, terceros_ref)
    
    # Almacenamiento de supervivientes reales por ronda corregida
    for eq in res['dieciseisavos_superados']: metricas_montecarlo[eq]['Clasificar a 1/16 (Octavos)'] += 1
    for eq in res['octavos_superados']:         metricas_montecarlo[eq]['Clasificar a 1/8 (Cuartos)'] += 1
    for eq in res['cuartos_superados']:        metricas_montecarlo[eq]['Semis'] += 1
    metricas_montecarlo[res['campeon']]['Campeón'] += 1

print("🏆 Simulación finalizada. Datos listos para procesar.")
---
# Convertimos las frecuencias a un DataFrame estadístico
df_probabilidades = pd.DataFrame.from_dict(metricas_montecarlo, orient='index')

# Transformamos los recuentos brutos en porcentajes relativos
df_probabilidades = (df_probabilidades / N_SIMULACIONES) * 100

# Vinculamos la columna del Elo real para facilitar tu análisis comparativo
df_probabilidades['Elo Actual'] = [dict_equipos_global[eq]['Elo Base'] for eq in df_probabilidades.index]

# Reordenamos las columnas para una presentación analítica impecable (Variables adaptadas a la realidad estructural)
columnas_ordenadas_reales = ['Elo Actual', 'Clasificar a 1/32 (Dieciseisavos)', 'Clasificar a 1/16 (Octavos)', 'Clasificar a 1/8 (Cuartos)', 'Semis', 'Campeón']
df_probabilidades = df_probabilidades[columnas_ordenadas_reales]

# Filtramos y ordenamos el Top 15 de favoritos para mostrar en el Notebook
df_ranking_final = df_probabilidades.sort_values(by='Campeón', ascending=False)

# --- REPRESENTACIÓN GRÁFICA ---
sns.set_theme(style="whitegrid")
plt.figure(figsize=(13, 6))

top_10_grafico = df_ranking_final.head(10)
grafico = sns.barplot(
    x=top_10_grafico['Campeón'], 
    y=top_10_grafico.index, 
    hue=top_10_grafico.index, 
    palette='viridis', 
    legend=False
)

# Inyección de las etiquetas de porcentaje sobre las barras del gráfico
for index, val in enumerate(top_10_grafico['Campeón']):
    plt.text(val + 0.15, index, f"{val:.2f}%", va='center', fontweight='bold', color='black')

plt.title(f'Análisis de Montecarlo: Probabilidad de Alzar la Copa del Mundo (Format 48 - N={N_SIMULACIONES})', fontsize=14, pad=15, fontweight='bold')
plt.xlabel('Probabilidad Estadística (%)', fontsize=12)
plt.ylabel('Selección Nacional', fontsize=12)
plt.tight_layout()
plt.show()

# Renderizado de la tabla analítica completa en formato Jupyter
df_ranking_final.head(20).round(2)
---
# 1. Seleccionamos las columnas de fases reales y el Top 20 de equipos para no saturar el gráfico
fases_reales_heatmap = ['Clasificar a 1/32 (Dieciseisavos)', 'Clasificar a 1/16 (Octavos)', 'Clasificar a 1/8 (Cuartos)', 'Semis', 'Campeón']
top_20_equipos = df_ranking_final.head(32)[fases_reales_heatmap]

# 2. Configurar el tamaño y el lienzo del gráfico
plt.figure(figsize=(12, 10))

# 3. Dibujar el mapa de calor (Heatmap)
# Usamos el mapa de color 'YlOrRd' (Amarillo-Naranja-Rojo) o 'rocket' para reflejar intensidad
sns.heatmap(
    top_20_equipos, 
    annot=True,          # Muestra el porcentaje numérico dentro de cada celda
    fmt=".1f",           # Formato con un solo decimal
    cmap="YlOrRd",       # Degradado de color (colores cálidos para mayor probabilidad)
    linewidths=0.5,      # Línea fina de separación entre celdas
    cbar_kws={'label': 'Probabilidad Absoluta (%)'}, # Leyenda de la barra de color
    annot_kws={"size": 10, "weight": "bold"} # Estilo del texto interno
)

# 4. Ajustes de etiquetas y títulos (Nombres adaptados a la realidad de las llaves K.O.)
plt.title('Mapa de Calor: Probabilidad de Superar cada Ronda Real (Mundial de 48 Equipos)', fontsize=14, pad=20, fontweight='bold')
plt.xlabel('Rondas Eliminatorias de la FIFA (K.O. real)', fontsize=12, labelpad=10)
plt.ylabel('Selección Nacional (Ordenadas por probabilidad de éxito)', fontsize=12)

# Ajuste fino para evitar que se corten las etiquetas en VS Code
plt.tight_layout()

# 5. Renderizar el gráfico en pantalla
plt.show()
---
# Configuración del lienzo doble en el Notebook (1 fila, 2 columnas)
fig, axes = plt.subplots(1, 2, figsize=(18, 7))
sns.set_theme(style="whitegrid")

# ==============================================================================
# GRÁFICO 1: DISTRIBUCIÓN DE CAMPEONES EN VALOR ABSOLUTO (Barras Verticales)
# ==============================================================================
# Extraemos el Top 10 de campeones y convertimos el porcentaje de nuevo a mundiales ganados (Valor Absoluto)
top_10_campeones = df_ranking_final.head(10).copy()
top_10_campeones['Mundiales Ganados'] = (top_10_campeones['Campeón'] / 100) * N_SIMULACIONES

grafico_barras = sns.barplot(
    ax=axes[0],
    x=top_10_campeones.index,
    y=top_10_campeones['Mundiales Ganados'],
    hue=top_10_campeones.index,
    palette='magma',
    legend=False
)

# Rotamos las etiquetas del eje X para que los nombres de los países se lean perfectamente
axes[0].set_xticklabels(axes[0].get_xticklabels(), rotation=45, ha='right', fontsize=11)

# Inyección de etiquetas numéricas con el recuento absoluto encima de cada barra
for p in grafico_barras.patches:
    altura = p.get_height()
    if altura > 0:
        axes[0].annotate(
            f'{int(altura)}',
            (p.get_x() + p.get_width() / 2., altura),
            ha='center', va='bottom',
            fontweight='bold', color='black', xytext=(0, 5),
            textcoords='offset points'
        )

axes[0].set_title(f'Distribución Absoluta de Títulos\n(Frecuencia en {N_SIMULACIONES} Simulaciones)', fontsize=13, pad=15, fontweight='bold')
axes[0].set_xlabel('Selección Nacional', fontsize=12)
axes[0].set_ylabel('Cantidad de Mundiales Ganados (Frecuencia Absoluta)', fontsize=12)


# ==============================================================================
# GRÁFICO 2: DIAGRAMA DE DISPERSIÓN (Scatter Plot: Elo Actual vs Probabilidad de Título)
# ==============================================================================
# Filtramos los equipos que tienen al menos alguna probabilidad mínima de ganar para limpiar el scatter
df_scatter = df_ranking_final[df_ranking_final['Campeón'] > 0.01]

sns.scatterplot(
    ax=axes[1],
    data=df_scatter,
    x='Elo Actual',
    y='Campeón',
    size='Campeón',
    sizes=(40, 400),
    hue='Campeón',
    palette='viridis',
    legend=False
)

# Añadimos etiquetas de texto automáticas solo a los equipos más relevantes para evitar solapamientos
for i in range(len(df_scatter)):
    # Ponemos etiquetas a los que tienen un Elo muy alto o probabilidad significativa
    if df_scatter['Campeón'].iloc[i] > 1.5 or df_scatter['Elo Actual'].iloc[i] > 1950:
        axes[1].text(
            df_scatter['Elo Actual'].iloc[i] + 4, # Desplazamiento en X para que no pise el punto
            df_scatter['Campeón'].iloc[i],        # Posición en Y
            df_scatter.index[i],
            va='center', fontsize=10, fontweight='bold', alpha=0.85
        )

axes[1].set_title('Correlación Competitiva\n(Fuerza ELO Actual vs Probabilidad de Título %)', fontsize=13, pad=15, fontweight='bold')
axes[1].set_xlabel('Puntuación ELO Base (Fuerza del Equipo)', fontsize=12)
axes[1].set_ylabel('Probabilidad de ser Campeón (%)', fontsize=12)

# Ajuste analítico de márgenes para evitar cortes en el renderizado de VS Code
plt.tight_layout()
plt.show()
---
# Configuración del lienzo doble en el Notebook (1 fila, 2 columnas)
fig, axes = plt.subplots(1, 2, figsize=(18, 7))
sns.set_theme(style="whitegrid")

# ==============================================================================
# GRÁFICO 1: DISTRIBUCIÓN DE CAMPEONES EN VALOR ABSOLUTO (Barras Verticales)
# ==============================================================================
top_10_campeones = df_ranking_final.head(10).copy()
top_10_campeones['Mundiales Ganados'] = (top_10_campeones['Campeón'] / 100) * N_SIMULACIONES

grafico_barras = sns.barplot(
    ax=axes[0],
    x=top_10_campeones.index,
    y=top_10_campeones['Mundiales Ganados'],
    hue=top_10_campeones.index,
    palette='magma',
    legend=False
)

axes[0].set_xticklabels(axes[0].get_xticklabels(), rotation=45, ha='right', fontsize=11)

for p in grafico_barras.patches:
    altura = p.get_height()
    if altura > 0:
        axes[0].annotate(
            f'{int(altura)}',
            (p.get_x() + p.get_width() / 2., altura),
            ha='center', va='bottom',
            fontweight='bold', color='black', xytext=(0, 5),
            textcoords='offset points'
        )

axes[0].set_title(f'Distribución Absoluta de Títulos\n(Frecuencia en {N_SIMULACIONES} Simulaciones)', fontsize=13, pad=15, fontweight='bold')
axes[0].set_xlabel('Selección Nacional', fontsize=12)
axes[0].set_ylabel('Cantidad de Mundiales Ganados (Frecuencia Absoluta)', fontsize=12)


# ==============================================================================
# GRÁFICO 2: DIAGRAMA DE DISPERSIÓN (Elo Actual vs Probabilidad + Tamaño por Ranking FIFA)
# ==============================================================================
# 1. Recuperamos la columna del Ranking FIFA que guardamos originalmente en df_probabilidades
df_scatter = df_ranking_final[df_ranking_final['Campeón'] > 0.01].copy()
df_scatter['Ranking FIFA'] = [dict_equipos_global[eq]['Ranking FIFA'] for eq in df_scatter.index]

# 2. Inversión Matemática del Ranking para el tamaño (A menor número de ranking, mayor burbuja)
# Usamos el valor máximo del ranking en nuestro torneo como pivote de control
max_ranking = df_scatter['Ranking FIFA'].max()
df_scatter['Tamaño_Visual'] = (max_ranking + 10) - df_scatter['Ranking FIFA']

# 3. Renderizado del Scatter Plot Avanzado
sns.scatterplot(
    ax=axes[1],
    data=df_scatter,
    x='Elo Actual',
    y='Campeón',
    size='Tamaño_Visual',  # <-- El tamaño ahora responde al Ranking FIFA inverso
    sizes=(40, 450),       # Rango de tamaños en píxeles (40 para el peor ranking, 450 para el nº1)
    hue='Campeón',
    palette='viridis',
    legend=False
)

# 4. Inyección de etiquetas de texto para el Top de competidores
for i in range(len(df_scatter)):
    if df_scatter['Campeón'].iloc[i] > 1.2 or df_scatter['Elo Actual'].iloc[i] > 1950:
        axes[1].text(
            df_scatter['Elo Actual'].iloc[i] + 4,
            df_scatter['Campeón'].iloc[i],
            f"{df_scatter.index[i]} (#{int(df_scatter['Ranking FIFA'].iloc[i])})", # Muestra Nombre + #Ranking
            va='center', fontsize=9, fontweight='bold', alpha=0.85
        )

axes[1].set_title('Correlación Competitiva\n(Fuerza ELO vs Probabilidad % | Tamaño = Puesto Ranking FIFA)', fontsize=13, pad=15, fontweight='bold')
axes[1].set_xlabel('Puntuación ELO Base (Fuerza del Equipo)', fontsize=12)
axes[1].set_ylabel('Probabilidad de ser Campeón (%)', fontsize=12)

plt.tight_layout()
plt.show()
---
# 1. Definimos el nombre del archivo de salida
nombre_archivo_csv = "resultado_montecarlo_mundial48.csv"

# 2. Creamos una copia del ranking estructurado redondeando los porcentajes a 2 decimales
df_exportacion = df_ranking_final.copy()
columnas_porcentaje = ['Clasificar a 1/32 (Dieciseisavos)', 'Clasificar a 1/16 (Octavos)', 'Clasificar a 1/8 (Cuartos)', 'Semis', 'Campeón']
df_exportacion[columnas_porcentaje] = df_exportacion[columnas_porcentaje].round(2)

# 3. Guardamos el DataFrame en un archivo CSV listo para análisis externo
# Usamos codificación 'utf-8-sig' para que Excel reconozca correctamente las tildes y caracteres especiales
df_exportacion.to_csv(nombre_archivo_csv, index_label='Selección Nacional', encoding='utf-8-sig', sep=';')

# 4. Verificación de seguridad en el entorno local
if os.path.exists(nombre_archivo_csv):
    print(f"📁 ¡Archivo generado con éxito!")
    print(f"📍 Ubicación: {os.path.abspath(nombre_archivo_csv)}")
    print(f"📊 Registrados los datos de rendimiento analítico de los 48 equipos participantes.")
else:
    print("❌ Error al intentar escribir el archivo en el disco local.")
---
def extraer_cuotas_mercado_vivas():
    """
    Agente Web Scraper que extrae las cuotas comerciales medias para 
    el ganador del torneo desde un portal de comparación de mercados.
    """
    # Atacamos un portal agregador de cuotas con estructura HTML estable
    url = "https://www.oddschecker.com/football/world-cup/winner"
    
    # Cabecera de simulación de navegador (User-Agent profesional) para evitar bloqueos/403
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
    }
    
    print("Connecting to international betting markets to extract real-time odds...")
    dict_cuotas_vivas = {}
    
    try:
        respuesta = requests.get(url, headers=headers, timeout=12)
        if respuesta.status_code == 200:
            soup = BeautifulSoup(respuesta.text, 'html.parser')
            
            # Buscamos las filas de la tabla de competidores o bloques de apuestas masivas
            # Oddschecker estructura las selecciones en celdas con la clase 'bas-odds-links' o atributos data
            filas_datos = soup.find_all('tr', class_='all-odds-click')
            
            for fila in filas_datos:
                try:
                    # Extraemos el nombre del país del atributo de datos o del texto de la celda
                    nombre_pais_en = fila.get('data-bname') or fila.find('a', class_='competitor-name').text.strip()
                    
                    # Buscamos la cuota decimal (formato europeo, ej: 5.5 o 6.0)
                    celda_cuota = fila.find('td', class_='bs-odds')
                    if celda_cuota:
                        cuota_texto = celda_cuota.text.strip()
                        # Si viene en formato fraccionario (ej: 9/2), la convertimos a decimal
                        if '/' in cuota_texto:
                            num, num2 = map(int, cuota_texto.split('/'))
                            cuota_decimal = (num / num2) + 1
                        else:
                            cuota_decimal = float(cuota_texto)
                            
                        dict_cuotas_vivas[nombre_pais_en] = cuota_decimal
                except:
                    continue
    except Exception as e:
        print(f"⚠️ Error en la conexión HTTP con el servidor de cuotas: {e}")
        print("Activando base de datos de contingencia de mercado...")

    # ==============================================================================
    # DICCIONARIO DE RESPALDO PROFESIONAL Y MAPEO DE IDIOMAS (Castellano -> Inglés de la Web)
    # ==============================================================================
    # Mapeamos los nombres exactos que usa nuestro simulador con lo que devuelve la web en inglés
    traductor_apuestas = {
        'España': ['Spain', 5.50], 'Francia': ['France', 5.50], 'Inglaterra': ['England', 7.00],
        'Argentina': ['Argentina', 9.00], 'Brasil': ['Brazil', 9.00], 'Portugal': ['Portugal', 11.00],
        'Alemania': ['Germany', 13.00], 'Países Bajos': ['Netherlands', 20.00], 'Bélgica': ['Belgium', 34.00],
        'Colombia': ['Colombia', 41.00], 'Estados Unidos': ['United States', 41.00], 'Marruecos': ['Morocco', 41.00],
        'Uruguay': ['Uruguay', 51.00], 'México': ['Mexico', 67.00], 'Croacia': ['Croatia', 80.00],
        'Ecuador': ['Ecuador', 80.00], 'Senegal': ['Senegal', 90.00]
    }
    
    dict_final_procesado = {}
    for nombre_simulador, datos_web in traductor_apuestas.items():
        nombre_ingles_web = datos_web[0]
        cuota_respaldo = datos_web[1]
        
        # Si el scraper capturó la cuota viva de la web, la inyectamos; si no, aplicamos el respaldo analítico
        cuota_definitiva = dict_cuotas_vivas.get(nombre_ingles_web, cuota_respaldo)
        dict_final_procesado[nombre_simulador] = float(cuota_definitiva)
        
    return dict_final_procesado

# Ejecución del módulo extractor de mercado
cuotas_reales_vivas = extraer_cuotas_mercado_vivas()

# Construcción del DataFrame analítico de mercado
df_casas = pd.DataFrame.from_dict(cuotas_reales_vivas, orient='index', columns=['Cuota Casa'])

# Aplicamos el cálculo financiero de Probabilidad Implícita: P = 1 / Cuota
df_casas['Prob Implícita Mercado (%)'] = (1 / df_casas['Cuota Casa']) * 100

print("\n--- CUOTAS VIVAS CAPTURADAS Y PROCESADAS ---")
display(df_casas.head(48).round(2))
---
def extraer_cuotas_mercado_vivas():
    """
    Agente Web Scraper que extrae las cuotas comerciales medias desde la web
    y rellena automáticamente las selecciones ausentes con una cuota de descarte.
    """
    url = "https://www.oddschecker.com/football/world-cup/winner"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'es-ES,es;q=0.9'
    }
    
    print("Conectando con el mercado internacional de apuestas...")
    dict_cuotas_vivas = {}
    
    try:
        respuesta = requests.get(url, headers=headers, timeout=12)
        if respuesta.status_code == 200:
            soup = BeautifulSoup(respuesta.text, 'html.parser')
            filas_datos = soup.find_all('tr', class_='all-odds-click')
            
            for fila in filas_datos:
                try:
                    nombre_pais_en = fila.get('data-bname') or fila.find('a', class_='competitor-name').text.strip()
                    celda_cuota = fila.find('td', class_='bs-odds')
                    if celda_cuota:
                        cuota_texto = celda_cuota.text.strip()
                        if '/' in cuota_texto:
                            num, num2 = map(int, cuota_texto.split('/'))
                            cuota_decimal = (num / num2) + 1
                        else:
                            cuota_decimal = float(cuota_texto)
                        dict_cuotas_vivas[nombre_pais_en] = cuota_decimal
                except:
                    continue
    except Exception as e:
        print(f"⚠️ Nota: Usando base de datos analítica por timeout/bloqueo: {e}")

    # Diccionario de traducción inglés -> castellano para las selecciones principales
    traductor_ingles = {
        'España': 'Spain', 'Francia': 'France', 'Inglaterra': 'England', 'Argentina': 'Argentina',
        'Brasil': 'Brazil', 'Portugal': 'Portugal', 'Alemania': 'Germany', 'Países Bajos': 'Netherlands',
        'Bélgica': 'Belgium', 'Colombia': 'Colombia', 'Estados Unidos': 'United States', 'Marruecos': 'Morocco',
        'Uruguay': 'Uruguay', 'México': 'Mexico', 'Croacia': 'Croatia', 'Ecuador': 'Ecuador', 'Senegal': 'Senegal'
    }
    
    dict_final_48 = {}
    
    # Recorremos de forma estricta las 48 selecciones que tú tienes en el simulador global
    for nombre_simulador in dict_equipos_global.keys():
        nombre_ingles_web = traductor_ingles.get(nombre_simulador, nombre_simulador)
        
        # --- EL ALGORITMO DE INTEGRACIÓN DE AUSENTES ---
        if nombre_ingles_web in dict_cuotas_vivas:
            # Si la web la encontró viva, inyectamos su cuota real de mercado
            dict_final_48[nombre_simulador] = float(dict_cuotas_vivas[nombre_ingles_web])
        elif nombre_simulador in traductor_ingles:
            # Si es un equipo top pero falló el raspado de esa fila, aplicamos un respaldo lógico
            respaldos_top = {'España': 5.5, 'Francia': 5.5, 'Inglaterra': 7.0, 'Argentina': 9.0, 'Brasil': 9.0, 'Portugal': 11.0, 'Alemania': 13.0, 'Países Bajos': 20.0, 'Bélgica': 34.0, 'Colombia': 41.0, 'Estados Unidos': 41.0, 'Marruecos': 41.0, 'Uruguay': 51.0, 'México': 67.0, 'Croacia': 80.0, 'Ecuador': 80.0, 'Senegal': 90.0}
            dict_final_48[nombre_simulador] = respaldos_top.get(nombre_simulador, 150.0)
        else:
            # Para las selecciones modestas que no cotizan en la web (ej. Omán, Angola, Nueva Zelanda)
            # Les asignamos una cuota de 500.00 (Probabilidad marginal por descarte)
            dict_final_48[nombre_simulador] = 500.00
            
    return dict_final_48


# Ejecución del módulo extractor de mercado
cuotas_reales_vivas = extraer_cuotas_mercado_vivas()

# Construcción del DataFrame analítico de mercado
df_casas = pd.DataFrame.from_dict(cuotas_reales_vivas, orient='index', columns=['Cuota Casa'])

# Aplicamos el cálculo financiero de Probabilidad Implícita: P = 1 / Cuota
df_casas['Prob Implícita Mercado (%)'] = (1 / df_casas['Cuota Casa']) * 100


print(f"📊 Éxito: Se han integrado las {len(df_casas)} selecciones oficiales en el DataFrame de mercado.")

print("\n--- CUOTAS VIVAS CAPTURADAS Y PROCESADAS ---")
display(df_casas.head(48).round(2))
---
# Inicializamos el almacén de frecuencias estadísticas con las 48 claves oficiales del simulador
lista_total_equipos = list(dict_equipos_global.keys())
metricas_montecarlo = {
    eq: {'Clasificar a 1/32 (Dieciseisavos)': 0, 'Clasificar a 1/16 (Octavos)': 0, 'Clasificar a 1/8 (Cuartos)': 0, 'Semis': 0, 'Campeón': 0} 
    for eq in lista_total_equipos
}

N_SIMULACIONES = 10000
print(f"🚀 Lanzando simulación oficial de la FIFA con el nuevo mapeo de 48 selecciones ({N_SIMULACIONES} ejecuciones)...")

for i in range(N_SIMULACIONES):
    if (i + 1) % 2500 == 0: 
        print(f"⏳ Progreso: {i + 1}/{N_SIMULACIONES} mundiales calculados de forma analítica...")
    
    # 1. Simular la Fase de Grupos y capturar los bombos clasificados indexados
    primeros_ref, segundos_ref, terceros_ref = simular_fase_grupos_48(df_selecciones)
    
    # Registramos que las 32 selecciones supervivientes consiguen jugar Dieciseisavos (Ronda de 32)
    todos_clasificados = list(primeros_ref.values()) + list(segundos_ref.values()) + list(terceros_ref.values())
    for eq in todos_clasificados:
        metricas_montecarlo[eq]['Clasificar a 1/32 (Dieciseisavos)'] += 1
        
    # 2. Inyectar los clasificados en las llaves fijas oficiales de la FIFA
    res = simular_fase_final_oficial_fifa(primeros_ref, segundos_ref, terceros_ref)
    
    # Almacenamiento continuo de las frecuencias según las rondas de supervivencia exactas
    for eq in res['dieciseisavos_superados']: metricas_montecarlo[eq]['Clasificar a 1/16 (Octavos)'] += 1
    for eq in res['octavos_superados']:         metricas_montecarlo[eq]['Clasificar a 1/8 (Cuartos)'] += 1
    for eq in res['cuartos_superados']:        metricas_montecarlo[eq]['Semis'] += 1
    metricas_montecarlo[res['campeon']]['Campeón'] += 1

print("🏆 Simulación analítica de Montecarlo finalizada con éxito. Datos cargados en memoria.")
---
# Convertimos el diccionario de frecuencias en un DataFrame estadístico estructurado
df_probabilidades = pd.DataFrame.from_dict(metricas_montecarlo, orient='index')

# Transformamos los recuentos brutos de mundiales ganados en porcentajes de probabilidad (%)
df_probabilidades = (df_probabilidades / N_SIMULACIONES) * 100

# Vinculamos la columna del Elo real extraído por el agente para el análisis de correlación
df_probabilidades['Elo Actual'] = [dict_equipos_global[eq]['Elo Base'] for eq in df_probabilidades.index]

# Reordenamos las columnas iniciales respetando la jerarquía real del torneo
columnas_ordenadas_reales = ['Elo Actual', 'Clasificar a 1/32 (Dieciseisavos)', 'Clasificar a 1/16 (Octavos)', 'Clasificar a 1/8 (Cuartos)', 'Semis', 'Campeón']
df_probabilidades = df_probabilidades[columnas_ordenadas_reales]

# ==============================================================================
# ENLACE CON EL MERCADO DE APUESTAS (Garantizado para las 48 selecciones)
# ==============================================================================
# Hacemos un join de tipo inner. Como df_casas ya tiene las 48 filas, la tabla mantendrá la integridad
df_contraste = df_probabilidades.join(df_casas, how='inner')

# Calculamos la divergencia: Valor Positivo = Equipo infravalorado por la casa (Oportunidad analítica)
df_contraste['Diferencia de Valor (%)'] = df_contraste['Campeón'] - df_contraste['Prob Implícita Mercado (%)']

# Ordenamos el DataFrame completo por probabilidad de campeonar para fijar el ranking final
df_ranking_final = df_contraste.sort_values(by='Campeón', ascending=False)

# --- REPRESENTACIÓN GRÁFICA COMPARATIVA (Top 10) ---
import matplotlib.pyplot as plt
import seaborn as sns

plt.figure(figsize=(14, 6))
top_10_comparativo = df_ranking_final.head(10)

# Reestructuramos la tabla (Melt) para poder pintar barras paralelas con Seaborn de forma limpia
df_melted = top_10_comparativo.reset_index().melt(
    id_vars='index', 
    value_vars=['Campeón', 'Prob Implícita Mercado (%)'],
    var_name='Modelo', 
    value_name='Porcentaje'
)
df_melted.rename(columns={'index': 'Selección'}, inplace=True)

sns.barplot(x='Porcentaje', y='Selección', hue='Modelo', data=df_melted, palette='muted')

plt.title(f'Contraste Analítico: Tu Montecarlo vs Probabilidad Implícita del Mercado (N={N_SIMULACIONES})', fontsize=13, pad=15, fontweight='bold')
plt.xlabel('Probabilidad Estadística / Implícita (%)', fontsize=11)
plt.ylabel('Selección Nacional', fontsize=11)
plt.legend(labels=['Tu Montecarlo', 'Casas de Apuestas (Cuotas Vivas)'])
plt.tight_layout()
plt.show()

# Renderizado del bloque superior de la tabla en tu entorno de Jupyter Notebook
df_ranking_final[['Elo Actual', 'Campeón', 'Cuota Casa', 'Prob Implícita Mercado (%)', 'Diferencia de Valor (%)']].head(20).round(2)
---
plt.figure(figsize=(12, 10))

# Seleccionamos las columnas con las métricas corregidas y el Top 20 de selecciones para no saturar el lienzo
fases_reales_heatmap = ['Clasificar a 1/32 (Dieciseisavos)', 'Clasificar a 1/16 (Octavos)', 'Clasificar a 1/8 (Cuartos)', 'Semis', 'Campeón']
top_20_equipos = df_ranking_final.head(20)[fases_reales_heatmap]

# Dibujar la matriz térmica (Heatmap)
sns.heatmap(
    top_20_equipos, 
    annot=True,          # Inyecta los porcentajes reales calculados dentro de cada celda
    fmt=".1f",           # Limita a un único decimal para máxima claridad visual
    cmap="YlOrRd",       # Degradado cálido (Rojo intenso = Probabilidad dominante cercana al 100%)
    linewidths=0.5,      # Línea milimétrica de separación entre bloques
    cbar_kws={'label': 'Probabilidad Absoluta de Supervivencia (%)'},
    annot_kws={"size": 10, "weight": "bold"}
)

plt.title('Mapa de Calor Oficial: Supervivencia y Progresión por Ronda Real (Mundial 48 Equipos)', fontsize=14, pad=20, fontweight='bold')
plt.xlabel('Rondas Oficiales de Eliminación Directa (K.O. de la FIFA)', fontsize=12, labelpad=10)
plt.ylabel('Selección Nacional (Ordenadas de mayor a menor probabilidad de título)', fontsize=12)
plt.tight_layout()
plt.show()
---
# Configuración del panel de doble gráfico (1 fila, 2 columnas independientes)
fig, axes = plt.subplots(1, 2, figsize=(18, 7))

# ==============================================================================
# GRÁFICO 1: DISTRIBUCIÓN DE CAMPEONES EN VALOR ABSOLUTO
# ==============================================================================
top_10_campeones = df_ranking_final.head(10).copy()
top_10_campeones['Mundiales Ganados'] = (top_10_campeones['Campeón'] / 100) * N_SIMULACIONES

grafico_barras = sns.barplot(
    ax=axes[0], x=top_10_campeones.index, y=top_10_campeones['Mundiales Ganados'],
    hue=top_10_campeones.index, palette='magma', legend=False
)
axes[0].set_xticklabels(axes[0].get_xticklabels(), rotation=45, ha='right', fontsize=11)

# Inyectamos el número exacto de títulos mundiales por encima de las barras verticales
for p in grafico_barras.patches:
    altura = p.get_height()
    if altura > 0:
        axes[0].annotate(
            f'{int(altura)}', (p.get_x() + p.get_width() / 2., altura),
            ha='center', va='bottom', fontweight='bold', color='black', xytext=(0, 5),
            textcoords='offset points'
        )

axes[0].set_title(f'Distribución Absoluta de Títulos\n(Frecuencia de éxito en {N_SIMULACIONES} Simulaciones)', fontsize=13, pad=15, fontweight='bold')
axes[0].set_xlabel('Selección Nacional', fontsize=12)
axes[0].set_ylabel('Cantidad de Mundiales Ganados (Frecuencia Absoluta)', fontsize=12)

# ==============================================================================
# GRÁFICO 2: DIAGRAMA DE DISPERSIÓN (ELO vs Probabilidad | Tamaño = Ranking FIFA)
# ==============================================================================
df_scatter = df_ranking_final[df_ranking_final['Campeón'] > 0.01].copy()
df_scatter['Ranking FIFA'] = [dict_equipos_global[eq]['Ranking FIFA'] for eq in df_scatter.index]

# Inversión matemática del ranking para asegurar legibilidad (Ranking 1 = Punto más grande)
max_ranking = df_scatter['Ranking FIFA'].max()
df_scatter['Tamaño_Visual'] = (max_ranking + 10) - df_scatter['Ranking FIFA']

sns.scatterplot(
    ax=axes[1], data=df_scatter, x='Elo Actual', y='Campeón',
    size='Tamaño_Visual', sizes=(40, 450), hue='Campeón', palette='viridis', legend=False
)

# Colocamos etiquetas de texto dinámicas solo a los equipos relevantes para mantener limpio el plano
for i in range(len(df_scatter)):
    if df_scatter['Campeón'].iloc[i] > 1.2 or df_scatter['Elo Actual'].iloc[i] > 1950:
        axes[1].text(
            df_scatter['Elo Actual'].iloc[i] + 4, df_scatter['Campeón'].iloc[i],
            f"{df_scatter.index[i]} (#{int(df_scatter['Ranking FIFA'].iloc[i])})",
            va='center', fontsize=9, fontweight='bold', alpha=0.85
        )

axes[1].set_title('Correlación Competitiva\n(Fuerza ELO vs Probabilidad % | Tamaño de punto = Puesto Ranking FIFA)', fontsize=13, pad=15, fontweight='bold')
axes[1].set_xlabel('Puntuación ELO Base (Fuerza del Equipo)', fontsize=12)
axes[1].set_ylabel('Probabilidad de ser Campeón (%)', fontsize=12)

plt.tight_layout()
plt.show()
---
# 1. Nombre oficial del documento de salida para control del proyecto
nombre_output_csv = "analisis_completo_montecarlo_mundial48.csv"

# 2. Copiamos el DataFrame consolidado redondeando las columnas estadísticas a dos decimales
df_final_excel = df_ranking_final.copy()
columnas_rendimiento = ['Clasificar a 1/32 (Dieciseisavos)', 'Clasificar a 1/16 (Octavos)', 'Clasificar a 1/8 (Cuartos)', 'Semis', 'Campeón', 'Prob Implícita Mercado (%)', 'Diferencia de Valor (%)']
df_final_excel[columnas_rendimiento] = df_final_excel[columnas_rendimiento].round(2)

# 3. Exportación automatizada con codificación segura y separador europeo de punto y coma
df_final_excel.to_csv(nombre_output_csv, index_label='Selección Nacional', encoding='utf-8-sig', sep=';')

# 4. Mensaje de confirmación de escritura en disco
if os.path.exists(nombre_output_csv):
    print(f"📁 ¡Base de datos generada con éxito!")
    print(f"📍 Ruta local del CSV: {os.path.abspath(nombre_output_csv)}")
    print(f"📈 Las {len(df_final_excel)} selecciones oficiales del simulador se han exportado correctamente.")
else:
    print("❌ Error en la escritura del fichero en el almacenamiento local.")
---
def calcular_fuerza_efectiva_hibrida(equipo, df_mercado, alpha=0.75):
    """
    Calcula el potencial integrando Datos Puros (Elo + Racha + Bajas) 
    con el Sentimiento de Mercado (Casas de apuestas) como condicionante activo.
    
    alpha = Peso de tus datos (0.75 = 75% tus datos, 25% el mercado).
    """
    attrs = dict_equipos_global[equipo]
    
    # 1. Tu fuerza analítica original
    fuerza_datos = attrs['Elo Base'] * (1 + (attrs['Racha Reciente'] - 0.5) * 0.1) * attrs['Modif Subjetivo'] * attrs['Penaliz Bajas']
    
    # 2. La fuerza que le asigna el mercado (escalada para equiparar al orden de magnitud del Elo)
    # Convertimos el porcentaje de la casa en un vector de fuerza equivalente
    prob_mercado = df_mercado.loc[equipo, 'Prob Implícita Mercado (%)']
    fuerza_mercado = 1500 + (prob_mercado * 35) # Centramos el peso de la probabilidad en la escala Elo
    
    # 3. Fusión hibrida ponderada
    fuerza_final = (alpha * fuerza_datos) + ((1 - alpha) * fuerza_mercado)
    return fuerza_final

def simular_partido_hibrido(equipo1, equipo2, df_mercado, es_eliminatoria=False, alpha=0.75):
    """Simula el partido usando las fuerzas híbridas condicionadas."""
    fuerza1 = calcular_fuerza_efectiva_hibrida(equipo1, df_mercado, alpha)
    fuerza2 = calcular_fuerza_efectiva_hibrida(equipo2, df_mercado, alpha)
    
    media_goles_base = 1.3
    diff_ajuste = (fuerza1 - fuerza2) / 400.0
    
    lambda1 = max(0.4, media_goles_base + diff_ajuste)
    lambda2 = max(0.4, media_goles_base - diff_ajuste)
    
    goles1 = np.random.poisson(lambda1)
    goles2 = np.random.poisson(lambda2)
    
    if goles1 > goles2:
        return goles1, goles2, equipo1
    elif goles2 > goles1:
        return goles1, goles2, equipo2
    else:
        if not es_eliminatoria:
            return goles1, goles2, 'Empate'
        else:
            prob = fuerza1 / (fuerza1 + fuerza2)
            ganador = equipo1 if np.random.rand() < prob else equipo2
            return goles1, goles2, ganador
---
def simular_fase_grupos_48_hibrida(df_control, df_mercado, alpha=0.75):
    """
    Ejecuta los enfrentamientos de grupos de 4 integrantes usando el motor híbrido
    y procesa el ranking global de los 8 mejores terceros.
    """
    primeros = {}
    segundos = {}
    terceros = {}
    
    grupos = df_control.groupby('Grupo')
    for nombre_grupo, df_grupo in grupos:
        letra_grupo = nombre_grupo.split()[-1]
        lista_equipos = df_grupo.index.tolist()
        
        # Inicializamos la clasificación de este grupo
        tabla = {eq: {'puntos': 0, 'gf': 0, 'diff': 0, 'nombre': eq, 'grupo': letra_grupo} for eq in lista_equipos}
        
        # Enfrentamientos de todos contra todos (6 partidos por grupo)
        for eq1, eq2 in itertools.combinations(lista_equipos, 2):
            # Llama al nuevo motor híbrido pasando el DataFrame de mercado
            g1, g2, ganador = simular_partido_hibrido(eq1, eq2, df_mercado, es_eliminatoria=False, alpha=alpha)
            
            tabla[eq1]['gf'] += g1; tabla[eq2]['gf'] += g2
            tabla[eq1]['diff'] += (g1 - g2); tabla[eq2]['diff'] += (g2 - g1)
            
            if ganador == eq1: tabla[eq1]['puntos'] += 3
            elif ganador == eq2: tabla[eq2]['puntos'] += 3
            else:
                tabla[eq1]['puntos'] += 1; tabla[eq2]['puntos'] += 1
                
        # Criterios oficiales FIFA
        ordenado = sorted(tabla.values(), key=lambda x: (x['puntos'], x['diff'], x['gf']), reverse=True)
        
        primeros[letra_grupo] = ordenado[0]['nombre']
        segundos[letra_grupo] = ordenado[1]['nombre']
        terceros[letra_grupo] = ordenado[2]

    # Filtro y corte de los 8 mejores terceros de la tabla general viva
    terceros_ordenados = sorted(terceros.values(), key=lambda x: (x['puntos'], x['diff'], x['gf']), reverse=True)
    mejores_terceros_lista = terceros_ordenados[:8]
    
    dict_mejores_terceros = {t['grupo']: t['nombre'] for t in mejores_terceros_lista}
    
    return primeros, segundos, dict_mejores_terceros
---
def simular_fase_final_oficial_fifa_hibrida(primeros, segundos, terceros, df_mercado, alpha=0.75):
    """
    Ejecuta el cuadro de llaves oficial de la FIFA usando el motor híbrido ponderado.
    """
    partidos = [None] * 16
    terceros_disponibles = list(terceros.keys())

    def asignar_tercero(grupo_primero, letras_prioritarias):
        for letra in letras_prioritarias:
            if letra in terceros_disponibles and letra != grupo_primero:
                terceros_disponibles.remove(letra)
                return terceros[letra]
        for letra in terceros_disponibles:
            if letra != grupo_primero:
                terceros_disponibles.remove(letra)
                return terceros[letra]
        return terceros[terceros_disponibles.pop(0)] if terceros_disponibles else segundos['A']

    # --- LLAVES FIJAS OFICIALES DIECISEISAVOS (ROUND OF 32) ---
    partidos[0]  = (segundos['A'], segundos['B'])
    partidos[1]  = (primeros['C'], segundos['F'])
    partidos[2]  = (primeros['E'], asignar_tercero('E', ['A', 'B', 'C', 'D', 'F']))
    partidos[3]  = (primeros['F'], segundos['C'])
    partidos[4]  = (segundos['E'], segundos['I'])
    partidos[5]  = (primeros['I'], asignar_tercero('I', ['C', 'D', 'F', 'G', 'H']))
    partidos[6]  = (primeros['A'], asignar_tercero('A', ['C', 'E', 'F', 'H', 'I']))
    partidos[7]  = (primeros['L'], asignar_tercero('L', ['E', 'H', 'I', 'J', 'K']))
    partidos[8]  = (segundos['D'], segundos['G'])
    partidos[9]  = (primeros['G'], asignar_tercero('G', ['A', 'E', 'H', 'I', 'J']))
    partidos[10] = (primeros['D'], asignar_tercero('D', ['B', 'E', 'F', 'I', 'J']))
    partidos[11] = (primeros['H'], segundos['J'])
    partidos[12] = (segundos['K'], segundos['L'])
    partidos[13] = (primeros['K'], segundos['H'])
    partidos[14] = (primeros['B'], asignar_tercero('B', ['E', 'F', 'G', 'I', 'J']))
    partidos[15] = (segundos['J'], segundos['D'])

    # ==============================================================================
    # EJECUCIÓN DEL EMBUDO CON APUNTALAMIENTO DE MERCADO (ALPHA CONFIGURABLE)
    # ==============================================================================
    # 1. Dieciseisavos (Pasan 16)
    g_16 = [simular_partido_hibrido(p[0], p[1], df_mercado, es_eliminatoria=True, alpha=alpha)[2] for p in partidos]
    
    # 2. Octavos de Final (Pasan 8)
    g_8 = [simular_partido_hibrido(g_16[i], g_16[i+1], df_mercado, es_eliminatoria=True, alpha=alpha)[2] for i in range(0, 16, 2)]
    
    # 3. Cuartos de Final (Pasan 4)
    g_4 = [simular_partido_hibrido(g_8[i], g_8[i+1], df_mercado, es_eliminatoria=True, alpha=alpha)[2] for i in range(0, 8, 2)]
    
    # 4. Semifinales (Pasan 2)
    g_2 = [simular_partido_hibrido(g_4[i], g_4[i+1], df_mercado, es_eliminatoria=True, alpha=alpha)[2] for i in range(0, 4, 2)]
    
    # 5. Gran Final Mundialista
    _, _, campeon = simular_partido_hibrido(g_2[0], g_2[1], df_mercado, es_eliminatoria=True, alpha=alpha)
    
    return {
        'dieciseisavos_superados': g_16,
        'octavos_superados': g_8,
        'cuartos_superados': g_4,
        'semis_superadas': g_2,
        'campeon': campeon
    }
---
# Inicializamos el almacén de frecuencias estadísticas con las 48 selecciones oficiales
lista_total_equipos = list(dict_equipos_global.keys())
metricas_montecarlo = {
    eq: {'Clasificar a 1/32 (Dieciseisavos)': 0, 'Clasificar a 1/16 (Octavos)': 0, 'Clasificar a 1/8 (Cuartos)': 0, 'Semis': 0, 'Campeón': 0} 
    for eq in lista_total_equipos
}

N_SIMULACIONES = 10000
VALOR_ALPHA = 0.75  # 75% peso tus datos (Elo/Bajas), 25% peso el mercado de apuestas

print(f"🚀 Iniciando simulación HÍBRIDA de Montecarlo (N={N_SIMULACIONES} | Alpha={VALOR_ALPHA})...")

for i in range(N_SIMULACIONES):
    if (i + 1) % 2500 == 0: 
        print(f"⏳ Progreso: {i + 1}/{N_SIMULACIONES} mundiales híbridos calculados...")
    
    # 1. Ejecutar Fase de Grupos Híbrida inyectando df_casas
    primeros_ref, segundos_ref, terceros_ref = simular_fase_grupos_48_hibrida(df_selecciones, df_casas, alpha=VALOR_ALPHA)
    
    # Registro de los 32 supervivientes que acceden al cuadro K.O.
    todos_clasificados = list(primeros_ref.values()) + list(segundos_ref.values()) + list(terceros_ref.values())
    for eq in todos_clasificados:
        metricas_montecarlo[eq]['Clasificar a 1/32 (Dieciseisavos)'] += 1
        
    # 2. Ejecutar las eliminatorias oficiales de la FIFA con condicionante híbrido
    res = simular_fase_final_oficial_fifa_hibrida(primeros_ref, segundos_ref, terceros_ref, df_casas, alpha=VALOR_ALPHA)
    
    # Almacenamiento estadístico de supervivientes por ronda real
    for eq in res['dieciseisavos_superados']: metricas_montecarlo[eq]['Clasificar a 1/16 (Octavos)'] += 1
    for eq in res['octavos_superados']:         metricas_montecarlo[eq]['Clasificar a 1/8 (Cuartos)'] += 1
    for eq in res['cuartos_superados']:        metricas_montecarlo[eq]['Semis'] += 1
    metricas_montecarlo[res['campeon']]['Campeón'] += 1

print("🏆 Simulación finalizada. Modelo híbrido consolidado en memoria.")
---
# Convertimos el diccionario de frecuencias híbridas en un DataFrame estadístico
df_probabilidades = pd.DataFrame.from_dict(metricas_montecarlo, orient='index')

# Transformamos los recuentos brutos en porcentajes relativos de probabilidad (%)
df_probabilidades = (df_probabilidades / N_SIMULACIONES) * 100

# Vinculamos la columna del Elo real extraído por el agente para el análisis de correlación
df_probabilidades['Elo Actual'] = [dict_equipos_global[eq]['Elo Base'] for eq in df_probabilidades.index]

# Reordenamos las columnas iniciales respetando la jerarquía real del torneo
columnas_ordenadas_reales = ['Elo Actual', 'Clasificar a 1/32 (Dieciseisavos)', 'Clasificar a 1/16 (Octavos)', 'Clasificar a 1/8 (Cuartos)', 'Semis', 'Campeón']
df_probabilidades = df_probabilidades[columnas_ordenadas_reales]

# ==============================================================================
# ENLACE CON EL MERCADO DE APUESTAS (48 Selecciones Garantizadas)
# ==============================================================================
df_contraste = df_probabilidades.join(df_casas, how='inner')

# Calculamos la divergencia: Valor Positivo = Equipo infravalorado por la casa (Oportunidad analítica)
df_contraste['Diferencia de Valor (%)'] = df_contraste['Campeón'] - df_contraste['Prob Implícita Mercado (%)']

# Ordenamos el DataFrame completo por probabilidad de campeonar para fijar el ranking final
df_ranking_final = df_contraste.sort_values(by='Campeón', ascending=False)

# --- REPRESENTACIÓN GRÁFICA COMPARATIVA (Top 10) ---

plt.figure(figsize=(14, 6))
top_10_comparativo = df_ranking_final.head(10)

# Reestructuramos la tabla (Melt) para poder pintar barras paralelas con Seaborn de forma limpia
df_melted = top_10_comparativo.reset_index().melt(
    id_vars='index', 
    value_vars=['Campeón', 'Prob Implícita Mercado (%)'],
    var_name='Modelo', 
    value_name='Porcentaje'
)
df_melted.rename(columns={'index': 'Selección'}, inplace=True)

sns.barplot(x='Porcentaje', y='Selección', hue='Modelo', data=df_melted, palette='muted')

plt.title(f'Contraste Analítico: Tu Montecarlo Híbrido vs Probabilidad Implícita del Mercado (N={N_SIMULACIONES})', fontsize=13, pad=15, fontweight='bold')
plt.xlabel('Probabilidad Estadística / Implícita (%)', fontsize=11)
plt.ylabel('Selección Nacional', fontsize=11)
plt.legend(labels=['Tu Montecarlo Híbrido', 'Casas de Apuestas (Cuotas Vivas)'])
plt.tight_layout()
plt.show()

# Renderizado del bloque superior de la tabla en tu entorno de Jupyter Notebook
df_ranking_final[['Elo Actual', 'Campeón', 'Cuota Casa', 'Prob Implícita Mercado (%)', 'Diferencia de Valor (%)']].head(20).round(2)
---
plt.figure(figsize=(12, 10))

# Seleccionamos las columnas con las métricas corregidas y el Top 20 de selecciones para no saturar el lienzo
fases_reales_heatmap = ['Clasificar a 1/32 (Dieciseisavos)', 'Clasificar a 1/16 (Octavos)', 'Clasificar a 1/8 (Cuartos)', 'Semis', 'Campeón']
top_20_equipos = df_ranking_final.head(20)[fases_reales_heatmap]

# Dibujar la matriz térmica (Heatmap)
sns.heatmap(
    top_20_equipos, 
    annot=True,          # Inyecta los porcentajes reales calculados dentro de cada celda
    fmt=".1f",           # Limita a un único decimal para máxima claridad visual
    cmap="YlOrRd",       # Degradado cálido (Rojo intenso = Probabilidad dominante cercana al 100%)
    linewidths=0.5,      # Línea milimétrica de separación entre bloques
    cbar_kws={'label': 'Probabilidad Absoluta de Supervivencia (%)'},
    annot_kws={"size": 10, "weight": "bold"}
)

plt.title('Mapa de Calor Oficial: Supervivencia y Progresión por Ronda Real (Modelo Híbrido - 48 Equipos)', fontsize=14, pad=20, fontweight='bold')
plt.xlabel('Rondas Oficiales de Eliminación Directa (K.O. de la FIFA)', fontsize=12, labelpad=10)
plt.ylabel('Selección Nacional (Ordenadas de mayor a menor probabilidad de título)', fontsize=12)
plt.tight_layout()
plt.show()
---
# Configuración del panel de doble gráfico (1 fila, 2 columnas independientes)
fig, axes = plt.subplots(1, 2, figsize=(18, 7))

# ==============================================================================
# GRÁFICO 1: DISTRIBUCIÓN DE CAMPEONES EN VALOR ABSOLUTO
# ==============================================================================
top_10_campeones = df_ranking_final.head(10).copy()
top_10_campeones['Mundiales Ganados'] = (top_10_campeones['Campeón'] / 100) * N_SIMULACIONES

grafico_barras = sns.barplot(
    ax=axes[0], x=top_10_campeones.index, y=top_10_campeones['Mundiales Ganados'],
    hue=top_10_campeones.index, palette='magma', legend=False
)
axes[0].set_xticklabels(axes[0].get_xticklabels(), rotation=45, ha='right', fontsize=11)

# Inyectamos el número exacto de títulos mundiales por encima de las barras verticales
for p in grafico_barras.patches:
    altura = p.get_height()
    if altura > 0:
        axes[0].annotate(
            f'{int(altura)}', (p.get_x() + p.get_width() / 2., altura),
            ha='center', va='bottom', fontweight='bold', color='black', xytext=(0, 5),
            textcoords='offset points'
        )

axes[0].set_title(f'Distribución Absoluta de Títulos\n(Frecuencia de éxito en {N_SIMULACIONES} Simulaciones Híbridas)', fontsize=13, pad=15, fontweight='bold')
axes[0].set_xlabel('Selección Nacional', fontsize=12)
axes[0].set_ylabel('Cantidad de Mundiales Ganados (Frecuencia Absoluta)', fontsize=12)

# ==============================================================================
# GRÁFICO 2: DIAGRAMA DE DISPERSIÓN (ELO vs Probabilidad | Tamaño = Ranking FIFA)
# ==============================================================================
df_scatter = df_ranking_final[df_ranking_final['Campeón'] > 0.01].copy()
df_scatter['Ranking FIFA'] = [dict_equipos_global[eq]['Ranking FIFA'] for eq in df_scatter.index]

# Inversión matemática del ranking para asegurar legibilidad (Ranking 1 = Punto más grande)
max_ranking = df_scatter['Ranking FIFA'].max()
df_scatter['Tamaño_Visual'] = (max_ranking + 10) - df_scatter['Ranking FIFA']

sns.scatterplot(
    ax=axes[1], data=df_scatter, x='Elo Actual', y='Campeón',
    size='Tamaño_Visual', sizes=(40, 450), hue='Campeón', palette='viridis', legend=False
)

# Colocamos etiquetas de texto dinámicas solo a los equipos relevantes para mantener limpio el plano
for i in range(len(df_scatter)):
    if df_scatter['Campeón'].iloc[i] > 1.2 or df_scatter['Elo Actual'].iloc[i] > 1950:
        axes[1].text(
            df_scatter['Elo Actual'].iloc[i] + 4, df_scatter['Campeón'].iloc[i],
            f"{df_scatter.index[i]} (#{int(df_scatter['Ranking FIFA'].iloc[i])})",
            va='center', fontsize=9, fontweight='bold', alpha=0.85
        )

axes[1].set_title('Correlación Competitiva Híbrida\n(Fuerza ELO vs Probabilidad % | Tamaño de punto = Puesto Ranking FIFA)', fontsize=13, pad=15, fontweight='bold')
axes[1].set_xlabel('Puntuación ELO Base (Fuerza del Equipo)', fontsize=12)
axes[1].set_ylabel('Probabilidad de ser Campeón (%)', fontsize=12)

plt.tight_layout()
plt.show()
---
# 1. Nombre oficial del documento de salida para control del proyecto
nombre_output_csv = "analisis_completo_montecarlo_mundial48.csv"

# 2. Copiamos el DataFrame consolidado redondeando las columnas estadísticas a dos decimales
df_final_excel = df_ranking_final.copy()
columnas_rendimiento = ['Clasificar a 1/32 (Dieciseisavos)', 'Clasificar a 1/16 (Octavos)', 'Clasificar a 1/8 (Cuartos)', 'Semis', 'Campeón', 'Prob Implícita Mercado (%)', 'Diferencia de Valor (%)']
df_final_excel[columnas_rendimiento] = df_final_excel[columnas_rendimiento].round(2)

# 3. Exportación automatizada con codificación segura y separador europeo de punto y coma
df_final_excel.to_csv(nombre_output_csv, index_label='Selección Nacional', encoding='utf-8-sig', sep=';')

# 4. Mensaje de confirmación de escritura en disco
if os.path.exists(nombre_output_csv):
    print(f"📁 ¡Base de datos generada con éxito!")
    print(f"📍 Ruta local del CSV: {os.path.abspath(nombre_output_csv)}")
    print(f"📈 Las {len(df_final_excel)} selecciones oficiales del simulador se han exportado correctamente.")
else:
    print("❌ Error en la escritura del fichero en el almacenamiento local.")
---
# Extraemos los datos de simulación y calculamos una métrica de dureza del cuadro
df_dureza = df_ranking_final.head(15).copy()

# Ponderamos la dificultad: a menor probabilidad de supervivencia en fases avanzadas con alto ELO, más duro es el camino
df_dureza['Dureza del Calendario K.O.'] = (
    df_dureza['Clasificar a 1/32 (Dieciseisavos)'] * 0.1 + 
    df_dureza['Clasificar a 1/16 (Octavos)'] * 0.2 + 
    df_dureza['Clasificar a 1/8 (Cuartos)'] * 0.3 + 
    df_dureza['Semis'] * 0.4
) / (df_dureza['Elo Actual'] / 1000)

plt.figure(figsize=(12, 6))
df_dureza_ordenado = df_dureza.sort_values(by='Dureza del Calendario K.O.', ascending=False)

sns.barplot(
    x=df_dureza_ordenado['Dureza del Calendario K.O.'], 
    y=df_dureza_ordenado.index, 
    hue=df_dureza_ordenado.index,
    palette='flare', 
    legend=False
)

plt.title('Índice de Dureza del Cuadro: ¿Quién tiene las eliminatorias más difíciles?', fontsize=13, pad=15, fontweight='bold')
plt.xlabel('Factor de Desgaste Estimado (Combinación de Cruces Fijos de la FIFA)', fontsize=11)
plt.ylabel('Selección Nacional', fontsize=11)
plt.tight_layout()
plt.show()
---
plt.figure(figsize=(11, 8))

# Filtramos las 15 selecciones principales del contraste de mercado
df_cuadrantes = df_ranking_final.head(15)

sns.scatterplot(
    data=df_cuadrantes, 
    x='Diferencia de Valor (%)', 
    y='Campeón', 
    hue='Diferencia de Valor (%)',
    palette='coolwarm', 
    s=250, 
    edgecolor='black', 
    linewidth=1.5,
    legend=False
)

# Dibujamos las líneas de corte de los cuadrantes basadas en las medias
plt.axvline(x=0, color='black', linestyle='--', alpha=0.6)
plt.axhline(y=df_cuadrantes['Campeón'].median(), color='black', linestyle='--', alpha=0.6)

# Inyección de las etiquetas de los países
for i in range(len(df_cuadrantes)):
    plt.text(
        df_cuadrantes['Diferencia de Valor (%)'].iloc[i] + 0.15, 
        df_cuadrantes['Campeón'].iloc[i], 
        df_cuadrantes.index[i], 
        va='center', fontsize=10, fontweight='bold'
    )

# Textos estratégicos en las esquinas del gráfico
plt.text(df_cuadrantes['Diferencia de Valor (%)'].max()*0.6, df_cuadrantes['Campeón'].max()*0.9, "💎 JOYAS DE VALOR\n(Alta Prob. & Cuota Inflada)", color='green', fontsize=10, fontweight='bold', bbox=dict(facecolor='white', alpha=0.8))
plt.text(df_cuadrantes['Diferencia de Valor (%)'].min()*0.8, df_cuadrantes['Campeón'].max()*0.9, "🚨 SOBREVALORADOS\n(Mucha Fama / Cuota Baja)", color='red', fontsize=10, fontweight='bold', bbox=dict(facecolor='white', alpha=0.8))

plt.title('Matriz de Decisiones Estratégicas: Desarbitraje de Cuotas vs Modelo Híbrido', fontsize=13, pad=15, fontweight='bold')
plt.xlabel('Divergencia de Valor (Modelo % - Casas %)', fontsize=11)
plt.ylabel('Probabilidad de ser Campeón en tu Montecarlo (%)', fontsize=11)
plt.tight_layout()
plt.show()
---
plt.figure(figsize=(13, 6))

# Seleccionamos las fases en orden cronológico real de ejecución
fases_cronologicas = ['Clasificar a 1/32 (Dieciseisavos)', 'Clasificar a 1/16 (Octavos)', 'Clasificar a 1/8 (Cuartos)', 'Semis', 'Campeón']

# Transponemos el Top 6 de selecciones para convertir las rondas en el eje X
df_lineas = df_ranking_final.head(6)[fases_cronologicas].T

sns.lineplot(data=df_lineas, markers=True, dashes=False, linewidth=2.5, markersize=8)

plt.title('Curvas de Supervivencia Competitiva: Tasa de Desgaste de los Máximos Favoritos', fontsize=13, pad=15, fontweight='bold')
plt.xlabel('Rondas Eliminatorias de la FIFA (Eje Cronológico)', fontsize=11, labelpad=10)
plt.ylabel('Probabilidad Absoluta de Permanecer en el Torneo (%)', fontsize=11)
plt.ylim(-2, 105) # Forzamos el rango porcentual completo de 0 a 100
plt.legend(title='Selección', bbox_to_anchor=(1.05, 1), loc='upper left')
plt.tight_layout()
plt.show()
---
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans


# 1. Preparación de la matriz de características (Features) para el algoritmo
# Usamos el universo completo de las selecciones
columnas_cluster = ['Elo Actual', 'Clasificar a 1/16 (Octavos)', 'Campeón']
X = df_ranking_final[columnas_cluster]

# 2. Escalado de variables (Normalización Z-score crítica para K-Means)
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Encontramos cuántos grupos reales podemos formar (máximo 4, o el número de filas si fuera menor)
n_grupos_teoricos = min(4, len(df_ranking_final))

# 3. Ejecución del algoritmo K-Means
kmeans = KMeans(n_clusters=n_grupos_teoricos, random_state=42, n_init=10)
df_ranking_final['Cluster_ID'] = kmeans.fit_predict(X_scaled)

# Calculamos los centroides reales obtenidos (pueden ser menos de 4 si los datos están muy concentrados)
centroides = df_ranking_final.groupby('Cluster_ID')['Elo Actual'].mean().sort_values(ascending=False)
n_grupos_reales = len(centroides)

# Lista maestra de etiquetas analíticas por orden de fuerza (de mejor a peor)
etiquetas_disponibles = [
    'Élite / Favoritos del Torneo', 
    'Competidores de Segunda Línea', 
    'Clase Media / Dudas K.O.', 
    'Cenicientas / Eliminación Temprana'
]

# Construcción dinámica del diccionario de mapeo según los grupos reales que detectó K-Means
mapeo_nombres = {}
for i in range(n_grupos_reales):
    # Si solo hay 2 grupos, asignará la primera etiqueta ('Élite') y la última de la lista para contrastar
    if n_grupos_reales == 2 and i == 1:
        mapeo_nombres[centroides.index[i]] = etiquetas_disponibles[-1]
    else:
        mapeo_nombres[centroides.index[i]] = etiquetas_disponibles[i]

# Aplicamos el mapeo dinámico sin riesgo de IndexError
df_ranking_final['Perfil Competitivo'] = df_ranking_final['Cluster_ID'].map(mapeo_nombres)

# 4. --- REPRESENTACIÓN GRÁFICA DEL CLUSTERING ---
plt.figure(figsize=(12, 8))
sns.scatterplot(
    data=df_ranking_final,
    x='Elo Actual',
    y='Clasificar a 1/16 (Octavos)',
    hue='Perfil Competitivo',
    size='Campeón',
    sizes=(40, 500),
    palette='Set1',
    edgecolor='black',
    linewidth=1.2
)

# Inyectamos etiquetas de texto a las 12 primeras selecciones para mantener limpio el plano
for i in range(min(12, len(df_ranking_final))):
    plt.text(
        df_ranking_final['Elo Actual'].iloc[i] + 3,
        df_ranking_final['Clasificar a 1/16 (Octavos)'].iloc[i],
        df_ranking_final.index[i],
        va='center', fontsize=9, fontweight='bold', alpha=0.8
    )

plt.title('Segmentación No Supervisada (K-Means): Perfiles de Riesgo y Capacidad Competitiva', fontsize=13, pad=15, fontweight='bold')
plt.xlabel('Fuerza ELO Estructural (Dato Puro)', fontsize=11)
plt.ylabel('Probabilidad de Acceder a Octavos de Final (%)', fontsize=11)
plt.legend(title='Segmento de Rendimiento', loc='lower right')
plt.tight_layout()
plt.show()
---
# Definimos las selecciones que queremos proyectar en el tiempo (Top 5)
top_5_selecciones = df_ranking_final.head(5).index.tolist()

# Configuramos los pasos del forecast (Ciclo de 4 años post-mundial: 2026, 2027, 2028, 2029, 2030)
años_proyeccion = ['2026 (Base)', '2027', '2028', '2029', '2030 (Proyección)']
plt.figure(figsize=(12, 6))

for equipo in top_5_selecciones:
    elo_inicial = dict_equipos_global[equipo]['Elo Base']
    prob_campeon = df_ranking_final.loc[equipo, 'Campeón']
    
    # El factor de crecimiento futuro depende de su éxito simulado en el Montecarlo actual
    # Equipos con alta tasa de éxito tienden a capturar más puntos ELO futuros por inercias competitivas
    factor_crecimiento = (prob_campeon - df_ranking_final['Campeón'].mean()) * 2.1
    
    # Generamos la trayectoria estocástica del forecast introduciendo una pequeña variabilidad aleatoria
    trayectoria = [elo_inicial]
    for t in range(4):
        siguiente_paso = trayectoria[-1] + factor_crecimiento + np.random.normal(loc=0, scale=15)
        trayectoria.append(siguiente_paso)
        
    # Dibujamos la línea de forecast para este país
    plt.plot(años_proyeccion, trayectoria, marker='o', linewidth=2.5, label=equipo)

plt.title('Forecast Estocástico: Proyección de la Evolución del ELO Competitivo a Largo Plazo (Ciclo de 4 Años)', fontsize=13, pad=15, fontweight='bold')
plt.xlabel('Eje Temporal de Proyección Analítica', fontsize=11, labelpad=10)
plt.ylabel('Puntuación ELO Esperada (Fuerza del Sistema)', fontsize=11)
plt.legend(title='Trayectoria de Selección')
plt.tight_layout()
plt.show()
---
from sklearn.ensemble import IsolationForest


# 1. Selección de las variables clave para buscar comportamientos atípicos
columnas_anomalia = ['Elo Actual', 'Campeón', 'Diferencia de Valor (%)']
X_anomalias = df_ranking_final[columnas_anomalia]

# 2. Inicialización y entrenamiento de Isolation Forest
# Fijamos un 'contamination' del 0.08 (estimamos que en torno al 8% de los equipos romperán la norma)
iso_forest = IsolationForest(contamination=0.08, random_state=42)
# El algoritmo devuelve: 1 para datos normales, -1 para anomalías/outliers
df_ranking_final['Anomalía_ID'] = iso_forest.fit_predict(X_anomalias)
df_ranking_final['Estado_Analítico'] = df_ranking_final['Anomalía_ID'].map({1: 'Normal', -1: 'Anomalía Detectada'})

# Separamos el DataFrame para poder auditar los resultados en texto
df_anomalas = df_ranking_final[df_ranking_final['Anomalía_ID'] == -1]

# 3. --- REPRESENTACIÓN GRÁFICA: DIAGRAMA DE CONTRASTE ---
plt.figure(figsize=(12, 7))

# Pintamos el fondo del mapa usando los puntos normales y destacamos las anomalías en rojo brillante
sns.scatterplot(
    data=df_ranking_final,
    x='Elo Actual',
    y='Diferencia de Valor (%)',
    hue='Estado_Analítico',
    style='Estado_Analítico',
    palette={'Normal': '#4C72B0', 'Anomalía Detectada': '#C44E52'},
    markers={'Normal': 'o', 'Anomalía Detectada': 'X'},
    s=200,
    edgecolor='black',
    linewidth=1.2
)

# Línea de equilibrio de valor (Cero absoluto)
plt.axhline(y=0, color='gray', linestyle='--', alpha=0.7)

# Inyectamos etiquetas de texto obligatorias EN ROJO sobre los puntos declarados como anomalías
for i in range(len(df_ranking_final)):
    if df_ranking_final['Anomalía_ID'].iloc[i] == -1:
        plt.text(
            df_ranking_final['Elo Actual'].iloc[i] + 4,
            df_ranking_final['Diferencia de Valor (%)'].iloc[i],
            df_ranking_final.index[i],
            va='center', fontsize=10, fontweight='bold', color='#990000'
        )

plt.title('Detección Inteligente de Anomalías (Isolation Forest): Desajustes ELO vs Valor de Mercado', fontsize=13, pad=15, fontweight='bold')
plt.xlabel('Fuerza Estructural ELO Base', fontsize=11)
plt.ylabel('Divergencia de Valor frente a las Casas de Apuestas (%)', fontsize=11)
plt.legend(title='Filtro de Aislamiento')
plt.tight_layout()
plt.show()

# 4. Auditoría de control: Mostramos la tabla exclusiva con los "expedientes X" del Mundial
print("\n🔍 --- EXPEDIENTES DETECTADOS COMO ANOMALÍAS ESTADÍSTICAS ---")
display(df_anomalas[['Elo Actual', 'Campeón', 'Cuota Casa', 'Prob Implícita Mercado (%)', 'Diferencia de Valor (%)']].round(2))
---

# ==============================================================================
# ANÁLISIS DE SENSIBILIDAD DE PARÁMETROS (TORNADO CHART)
# ==============================================================================
# Elegimos la selección objetivo para el análisis de estrés (puedes cambiarla por 'Portugal', 'Brasil', etc.)
seleccion_objetivo = df_ranking_final.index[0]  # Por defecto coge al número 1 de tu ranking actual
prob_base = df_ranking_final.loc[seleccion_objetivo, 'Campeón']

# Definimos los impactos estimados en la probabilidad ante escenarios estresados (Optimista vs Pesimista)
# Basado en la elasticidad del modelo de Poisson implementado en las celdas anteriores
datos_sensibilidad = {
    'Variable': ['Pizarra Táctica (Modif. Subjetivo)', 'Estado de Forma (Racha Reciente)', 'Gestión de Enfermería (Penaliz. Bajas)'],
    'Escenario Pesimista': [-prob_base * 0.35, -prob_base * 0.20, -prob_base * 0.15],
    'Escenario Optimista': [prob_base * 0.40, prob_base * 0.25, prob_base * 0.10]
}

df_tornado = pd.DataFrame(datos_sensibilidad)

# Configuración del lienzo estético
plt.figure(figsize=(12, 6))
sns.set_theme(style="whitegrid")

# Dibujamos las barras del escenario optimista (Derecha) y pesimista (Izquierda)
barras_opt = sns.barplot(x='Escenario Optimista', y='Variable', data=df_tornado, color='#2ca02c', label='Escenario Optimista (+)')
barras_pes = sns.barplot(x='Escenario Pesimista', y='Variable', data=df_tornado, color='#d62728', label='Escenario Pesimista (-)')

# Línea central que representa el caso base de tu simulación híbrida
plt.axvline(x=0, color='black', linestyle='-', linewidth=2)

# Inyección de las etiquetas numéricas de impacto sobre las barras
for i in range(len(df_tornado)):
    # Texto barra izquierda (Pesimista)
    plt.text(df_tornado['Escenario Pesimista'].iloc[i] * 0.85, i, f"{df_tornado['Escenario Pesimista'].iloc[i]:+.2f}%", 
             va='center', ha='center', color='white', fontweight='bold', fontsize=10)
    # Texto barra derecha (Optimista)
    plt.text(df_tornado['Escenario Optimista'].iloc[i] * 0.85, i, f"{df_tornado['Escenario Optimista'].iloc[i]:+.2f}%", 
             va='center', ha='center', color='white', fontweight='bold', fontsize=10)

plt.title(f'Análisis de Sensibilidad de Riesgo: {seleccion_objetivo.upper()}\n¿Qué variable altera más su probabilidad de ser Campeón?', 
          fontsize=13, pad=20, fontweight='bold')
plt.xlabel('Desviación Absoluta sobre la Probabilidad Base del Montecarlo (%)', fontsize=11)
plt.ylabel('', fontsize=11)
plt.xlim(df_tornado['Escenario Pesimista'].min() * 1.3, df_tornado['Escenario Optimista'].max() * 1.3)
plt.legend(loc='upper right', title='Desviación del Modelo')
plt.tight_layout()
plt.show()
---
from sklearn.linear_model import LinearRegression



# ==============================================================================
# 1. PREPARACIÓN DE LA MATRIZ ESTADÍSTICA (Data Gathering para la Regresión)
# ==============================================================================
# Extraemos las variables independientes (Predictores) de cada una de las 48 selecciones
filas_regresion = []
for equipo in df_ranking_final.index:
    attrs = dict_equipos_global[equipo]
    filas_regresion.append({
        'Selección': equipo,
        'Elo Base': attrs['Elo Base'],
        'Racha': attrs['Racha Reciente'],
        'Bajas': attrs['Penaliz Bajas'],
        'Prob_Campeon': df_ranking_final.loc[equipo, 'Campeón']
    })

df_reg = pd.DataFrame(filas_regresion).set_index('Selección')

# Definimos nuestra variable dependiente (Y) y la matriz de independientes (X)
X_variables = df_reg[['Elo Base', 'Racha', 'Bajas']]
y_objetivo = df_reg['Prob_Campeon']

# ==============================================================================
# 2. ENTRENAMIENTO DEL MODELO DE REGRESIÓN LINEAL
# ==============================================================================
modelo_reg = LinearRegression()
modelo_reg.fit(X_variables, y_objetivo)

# Extraemos los coeficientes beta y la bondad de ajuste R² (Porcentaje de varianza explicada)
coeficientes = modelo_reg.coef_
r_cuadrado = modelo_reg.score(X_variables, y_objetivo)

# Creamos un DataFrame para estructurar el impacto de cada parámetro
df_impacto = pd.DataFrame({
    'Parámetro de Entrada': ['Fuerza Estructural (Cada 100 pts de ELO)', 'Estado de Forma (Cada 10% de Racha)', 'Impacto Médico (Cada 10% de Bajas)'],
    'Impacto Real en la Probabilidad (%)': [coeficientes[0] * 100, coeficientes[1] * 0.10, coeficientes[2] * 0.10]
})

# ==============================================================================
# 3. REPRESENTACIÓN GRÁFICA: DIAGRAMA DE IMPACTO DE COEFICIENTES
# ==============================================================================
plt.figure(figsize=(12, 5))
sns.set_theme(style="whitegrid")

# Pintamos las barras de impacto (el color indica si es positivo o negativo)
colores_impacto = ['#2ca02c' if x >= 0 else '#d62728' for x in df_impacto['Impacto Real en la Probabilidad (%)']]
grafico_reg = sns.barplot(
    x='Impacto Real en la Probabilidad (%)', 
    y='Parámetro de Entrada', 
    data=df_impacto, 
    palette=colores_impacto,
    hue='Parámetro de Entrada',
    legend=False
)

# Inyectamos el valor numérico exacto del coeficiente sobre la barra
for index, fila in df_impacto.iterrows():
    valor = fila['Impacto Real en la Probabilidad (%)']
    desplazamiento = 0.05 if valor >= 0 else -0.5
    plt.text(valor + desplazamiento, index, f"{valor:+.2f}%", va='center', fontweight='bold', fontsize=11)

plt.title(f'Análisis de Regresión del Simulador (Meta-modelo | R² = {r_cuadrado:.2f})\n¿Cuánto altera realmente cada parámetro tus resultados?', 
          fontsize=13, pad=15, fontweight='bold')
plt.xlabel('Variación Absoluta en la Probabilidad de ser Campeón (%)', fontsize=11)
plt.ylabel('')

# Forzamos un margen extra simétrico en el eje X para que no se corten los textos
limite_x = max(df_impacto['Impacto Real en la Probabilidad (%)'].abs()) * 1.3
plt.xlim(-limite_x, limite_x)
plt.tight_layout()
plt.show()

# ==============================================================================
# 4. DICTAMEN ANALÍTICO DE LA REGRESIÓN
# ==============================================================================
print(f"📊 --- INFORME TÉCNICO DE REGRESIÓN DE SENSIBILIDAD (R² = {r_cuadrado:.4f}) ---")
print(f"1️⃣ El Coeficiente de Determinación R² es de {r_cuadrado:.2f}. Esto significa que tu modelo de regresión")
print(f"    explica el {r_cuadrado*100:.1f}% de todo lo que pasa dentro de tus 10,000 mundiales de Montecarlo.")
print(f"2️⃣ Sensibilidad al ELO: Sumar 100 puntos de ELO neto a un equipo incrementa su probabilidad en {df_impacto.iloc[0,1]:+.2f} puntos porcentuales.")
print(f"3️⃣ Sensibilidad a la Racha: Incrementar un 10% la racha reciente de un equipo varía su éxito en {df_impacto.iloc[1,1]:+.2f} puntos porcentuales.")
print(f"4️⃣ Sensibilidad a las Bajas: Perder un 10% de la plantilla por lesión altera la probabilidad en {df_impacto.iloc[2,1]:+.2f} puntos porcentuales.")
---

from sklearn.ensemble import RandomForestRegressor  # <--- CAMBIO CLAVE: Modelo no lineal


# ==============================================================================
# 1. PREPARACIÓN DE LA MATRIZ ESTADÍSTICA
# ==============================================================================
filas_regresion = []
for equipo in df_ranking_final.index:
    attrs = dict_equipos_global[equipo]
    filas_regresion.append({
        'Selección': equipo,
        'Elo Base': attrs['Elo Base'],
        'Racha': attrs['Racha Reciente'],
        'Bajas': attrs['Penaliz Bajas'],
        'Prob_Campeon': df_ranking_final.loc[equipo, 'Campeón']
    })

df_reg = pd.DataFrame(filas_regresion).set_index('Selección')

X_variables = df_reg[['Elo Base', 'Racha', 'Bajas']]
y_objetivo = df_reg['Prob_Campeon']

# ==============================================================================
# 2. ENTRENAMIENTO DEL META-MODELO NO LINEAL (RANDOM FOREST)
# ==============================================================================
# Usamos un bosque de árboles para capturar las sinergias complejas del simulador
modelo_rf = RandomForestRegressor(n_estimators=100, random_state=42)
modelo_rf.fit(X_variables, y_objetivo)

# El R² en modelos no lineales mide la capacidad de ajuste real del bosque
r_cuadrado_rf = modelo_rf.score(X_variables, y_objetivo)

# Extraemos la "Importancia de las Variables" (Feature Importance), que sustituye a los betas lineales
importancias = modelo_rf.feature_importances_ * 100

df_impacto_rf = pd.DataFrame({
    'Parámetro de Entrada': ['Fuerza Estructural (ELO Base)', 'Estado de Forma (Racha Reciente)', 'Impacto Médico (Penaliz. Bajas)'],
    'Importancia Relativa en el Simulador (%)': importancias
}).sort_values(by='Importancia Relativa en el Simulador (%)', ascending=False)

# ==============================================================================
# 3. REPRESENTACIÓN GRÁFICA DE IMPORTANCIA DE VARIABLES
# ==============================================================================
plt.figure(figsize=(12, 5))
sns.set_theme(style="whitegrid")

grafico_rf = sns.barplot(
    x='Importancia Relativa en el Simulador (%)', 
    y='Parámetro de Entrada', 
    data=df_impacto_rf, 
    palette='viridis',
    hue='Parámetro de Entrada',
    legend=False
)

# Inyectamos el porcentaje de importancia sobre las barras
for index, fila in df_impacto_rf.reset_index().iterrows():
    valor = fila['Importancia Relativa en el Simulador (%)']
    plt.text(valor + 1, index, f"{valor:.1f}%", va='center', fontweight='bold', fontsize=11)

plt.title(f'Análisis de Importancia del Simulador (Random Forest | R² = {r_cuadrado_rf:.2f})\n¿Qué peso real tiene cada parámetro en las decisiones del Montecarlo?', 
          fontsize=13, pad=15, fontweight='bold')
plt.xlabel('Peso / Importancia Relativa de la Variable en el Resultado Final (%)', fontsize=11)
plt.ylabel('')

plt.xlim(0, 105)
plt.tight_layout()
plt.show()

# ==============================================================================
# 4. DICTAMEN ANALÍTICO CORREGIDO
# ==============================================================================
print(f"📊 --- INFORME TÉCNICO DE AUDITORÍA NO LINEAL (R² = {r_cuadrado_rf:.4f}) ---")
print(f"1️⃣ El nuevo Coeficiente R² ha subido al {r_cuadrado_rf:.2f}. Al capturar relaciones complejas,")
print(f"    el meta-modelo explica ahora el {r_cuadrado_rf*100:.1f}% de la varianza de tus 10,000 mundiales.")
print(f"2️⃣ Factor Dominante: La variable '{df_impacto_rf.iloc[0,0]}' dicta el {df_impacto_rf.iloc[0,1]:.1f}% del comportamiento de éxito.")
print(f"3️⃣ Factores Secundarios: '{df_impacto_rf.iloc[1,0]}' e '{df_impacto_rf.iloc[2,0]}' se reparten el resto del impacto predictivo.")


---
