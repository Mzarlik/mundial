import pandas as pd
import os

csv_path = r"C:\Users\Malpi\Documents\GitHub\mundial\international_results-master\international_results-master\results.csv"

# Transcribed matches from the screenshots
updates = [
    # Group A
    ("2026-06-11", "Mexico", "South Africa", 2, 0),
    ("2026-06-12", "South Korea", "Czech Republic", 2, 1),
    ("2026-06-18", "Czech Republic", "South Africa", 1, 1),
    ("2026-06-19", "Mexico", "South Korea", 1, 0),
    # Group B
    ("2026-06-12", "Canada", "Bosnia and Herzegovina", 1, 1),
    ("2026-06-13", "Qatar", "Switzerland", 1, 1),
    ("2026-06-18", "Switzerland", "Bosnia and Herzegovina", 4, 1),
    ("2026-06-19", "Canada", "Qatar", 6, 0),
    # Group C
    ("2026-06-14", "Brazil", "Morocco", 1, 1),
    ("2026-06-14", "Haiti", "Scotland", 0, 1),
    ("2026-06-20", "Scotland", "Morocco", 0, 1),
    ("2026-06-20", "Brazil", "Haiti", 3, 0),
    # Group D
    ("2026-06-13", "United States", "Paraguay", 4, 1),
    ("2026-06-14", "Australia", "Turkey", 2, 0),
    ("2026-06-19", "United States", "Australia", 2, 0),
    ("2026-06-20", "Turkey", "Paraguay", 0, 1),
    # Group E
    ("2026-06-14", "Germany", "Curaçao", 7, 1),
    ("2026-06-15", "Ivory Coast", "Ecuador", 1, 0),
    ("2026-06-20", "Germany", "Ivory Coast", 2, 1),
    ("2026-06-21", "Ecuador", "Curaçao", 0, 0),
    # Group F
    ("2026-06-14", "Netherlands", "Japan", 2, 2),
    ("2026-06-15", "Sweden", "Tunisia", 5, 1),
    ("2026-06-20", "Netherlands", "Sweden", 5, 1),
    ("2026-06-21", "Tunisia", "Japan", 0, 4),
    # Group G
    ("2026-06-15", "Belgium", "Egypt", 1, 1),
    ("2026-06-16", "Iran", "New Zealand", 2, 2),
    ("2026-06-21", "Belgium", "Iran", 0, 0),
    ("2026-06-22", "New Zealand", "Egypt", 1, 3),
    # Group H
    ("2026-06-15", "Spain", "Cape Verde", 0, 0),
    ("2026-06-16", "Saudi Arabia", "Uruguay", 1, 1),
    ("2026-06-21", "Spain", "Saudi Arabia", 4, 0),
    ("2026-06-22", "Uruguay", "Cape Verde", 2, 2),
    # Group I
    ("2026-06-16", "France", "Senegal", 3, 1),
    ("2026-06-17", "Iraq", "Norway", 1, 4),
    ("2026-06-22", "France", "Iraq", 3, 0),
    ("2026-06-23", "Norway", "Senegal", 3, 2),
    # Group J
    ("2026-06-17", "Argentina", "Algeria", 3, 0),
    ("2026-06-17", "Austria", "Jordan", 3, 1),
    ("2026-06-22", "Argentina", "Austria", 2, 0),
    ("2026-06-23", "Jordan", "Algeria", 1, 2),
    # Group K
    ("2026-06-17", "Portugal", "DR Congo", 1, 1),
    ("2026-06-18", "Uzbekistan", "Colombia", 1, 3),
    ("2026-06-23", "Portugal", "Uzbekistan", 5, 0),
    # Group L
    ("2026-06-17", "England", "Croatia", 4, 2),
    ("2026-06-18", "Ghana", "Panama", 1, 0),
    ("2026-06-23", "England", "Ghana", 0, 0),
    # 16avos de Final
    ("2026-07-01", "England", "DR Congo", 2, 1),
    # Semifinal
    ("2026-07-14", "France", "Spain", 0, 2)
]

print("Reading CSV...")
df = pd.read_csv(csv_path)

updated_count = 0
for _, home, away, hs, as_ in updates:
    mask = df['date'].str.startswith('2026-') & (df['home_team'] == home) & (df['away_team'] == away)
    if mask.sum() > 0:
      df.loc[mask, 'home_score'] = hs
      df.loc[mask, 'away_score'] = as_
      updated_count += 1
    else:
        mask_reverse = df['date'].str.startswith('2026-') & (df['home_team'] == away) & (df['away_team'] == home)
        if mask_reverse.sum() > 0:
            df.loc[mask_reverse, 'home_score'] = as_
            df.loc[mask_reverse, 'away_score'] = hs
            updated_count += 1
        else:
            print(f"Match not found: {home} vs {away}")

print(f"Updated {updated_count} matches.")
df.to_csv(csv_path, index=False)
print("Saved CSV successfully.")
