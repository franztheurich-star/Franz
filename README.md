# ABG Agentenbibliothek

Öffentliche, bereinigte und statische Agentenbibliothek für die ABG Marketing GmbH.

Die Website unterstützt bei der Auswahl eines passenden Agenten für die nächste Aufgabe. Nicht öffentlich bestätigte Konfigurationsdaten werden nicht erfunden, sondern als nicht verfügbar gekennzeichnet.

## Struktur

- `index.html` – Anwendungsshell, Startseite, Filter und Änderungsprotokoll
- `css/styles.css` – ABG-konformes, responsives Styling
- `js/app.js` – Suche, Aufgabenwahl, dedizierte Filter, Detailansichten, URL-Profile und Zustände
- `data/agents.json` – einzige redaktionelle Datenquelle
- `data/prompts/*.txt` – öffentliche, bereinigte Promptfassungen
- `assets/` – öffentliche Dashboard-Assets, einschließlich ABG-Logo

## Lokale Prüfung

Die Seite nutzt `fetch('data/agents.json')` und die öffentlichen Promptdateien. Für die lokale Prüfung deshalb einen kleinen HTTP-Server verwenden:

```bash
python3 -m http.server 8000
```

Danach `http://localhost:8000/` öffnen. Zu prüfen sind insbesondere Datenladung, Suche, Aufgabenwahl, Fachbereichs-, Status-, Modell-, Integrations- und Skillfilter, URL-Profile, Prompt-Laden, Kopierfunktion, Desktop-/Mobile-Darstellung sowie Fehlerzustände.

## Datenregeln

Die veröffentlichte Version enthält nur bereinigte und sichtbare Angaben. Nicht bestätigte Felder bleiben leer oder enthalten einen ausdrücklichen Hinweis wie `Nicht verfügbar`, `Noch zu bestätigen` oder `Nicht öffentlich dokumentiert`.

Nicht veröffentlichen:

- geheime Prompts,
- Tokens oder Zugangsdaten,
- private URLs,
- interne Wissensordner,
- nicht freigegebene Integrationsdetails,
- persönliche Kontaktdaten ohne Freigabe,
- vertrauliche Betriebs- oder Governance-Angaben.

Wenn die Bibliothek ausschließlich intern gedacht ist, ist eine öffentliche GitHub-Pages-Seite ohne Zugriffsschutz nicht als dauerhafter Zielhost geeignet.

## Pflegeprozess

1. Änderungen ausschließlich in `data/agents.json` redaktionell pflegen.
2. Nicht bestätigte Angaben nicht ergänzen, sondern klar kennzeichnen.
3. Promptdateien nur aus freigegebenen, bereinigten Quellen aktualisieren.
4. Desktop, Mobile, Tastaturbedienung, Suche, alle Filter, URL-Profile und Fehlerzustände prüfen.
5. Nach jeder Veröffentlichung die Katalogdateien, Promptpfade und Datenschutzmuster erneut prüfen.
6. Erst nach bestandener Prüfung veröffentlichen.

