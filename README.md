# Tokyo Neighborhood Agents 🗾

A fleet of Copilot agents that find the best food, coffee, attractions, and shops near any Tokyo location.

## Agents

Located in `.github/agents/` — no scripts needed, Copilot does everything.

| Agent | Invoke with | What it does |
|---|---|---|
| **neighborhood-finder** | `@neighborhood-finder` | 🎯 Orchestrator — coordinates category agents, handles all plumbing |
| **ramen** | `@ramen` | 🍜 Ramen & tsukemen specialist |
| **sushi** | `@sushi` | 🍣 Sushi specialist (omakase, kaiten, standing) |
| **yakiniku** | `@yakiniku` | 🍖 Yakiniku & BBQ specialist |
| **tempura-tonkatsu** | `@tempura-tonkatsu` | 🍤 Tempura & tonkatsu specialist |
| **thai** | `@thai` | 🥡 Thai food specialist |
| **coffee** | `@coffee` | ☕ Coffee, kissaten & third-wave specialist |
| **attractions** | `@attractions` | 🏯 Sightseeing, temples, museums, gardens |
| **stationery** | `@stationery` | ✏️ Stationery & paper goods shops |

## Usage

In Copilot Chat:

```
@neighborhood-finder Find me ramen and coffee near Ebisu, rated 3.6+ on Tabelog

@neighborhood-finder What's worth seeing within walking distance of Kuramae?

@ramen Best tsukemen near Shinjuku?

@stationery Where can I buy fountain pens in Ginza?

@coffee Find me a kissaten near Jimbocho
```

## How it works

```
User request
     │
     ▼
@neighborhood-finder (orchestrator)
     │
     ├── delegates to category agents (@ramen, @coffee, @stationery, etc.)
     │   for search terms, known spots, and tips
     │
     ├── searches candidates (maps, Tabelog, web)
     │
     ├── filters by distance, rating, price
     │
     └── outputs results (cards, tables, or KML map file)
```
