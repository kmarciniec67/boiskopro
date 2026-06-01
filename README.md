# BoiskoPro

Sklep piłkarski online — korki, piłki, stroje. Pełny frontend z koszykiem, logowaniem, zamówieniami i panelem administratora.

## Funkcje sklepu

- Przeglądanie produktów i filtrowanie kategorii
- Koszyk (zapis w przeglądarce)
- Rejestracja i logowanie
- Składanie zamówień
- Opinie o produktach (po zalogowaniu)
- **Panel admina** — dodawanie produktów, podgląd wszystkich zamówień

## Konta testowe (po `npm run seed:reset`)

| Rola | Email | Hasło |
|------|-------|-------|
| Administrator | `admin@boiskopro.pl` | `admin123` |
| Klient | `anna@example.com` | `haslo123` |
| Klient | `piotr@example.com` | `haslo123` |

## Szybki start

```powershell
cd C:\Users\kacper\Projects\BoiskoPro

npm install
cd client && npm install && cd ..
copy .env.example .env

npm run db:init
npm run seed:reset
npm run dev
```

| Usługa | URL |
|--------|-----|
| **Sklep (frontend)** | http://localhost:5173 |
| **API** | http://localhost:3000 |

Po `npm run build` + `npm start` — wszystko pod http://localhost:3000

## Skrypty

| Skrypt | Opis |
|--------|------|
| `npm run dev` | API + frontend |
| `npm run dev:api` | Tylko backend |
| `npm run dev:client` | Tylko frontend |
| `npm run build` | Build produkcyjny |
| `npm run start` | Serwer z wbudowanym frontendem |
| `npm run seed:reset` | Reset danych demo |

## Bazy danych (dla developera)

Nazwa bazy: **`boiskopro`** (PostgreSQL + MongoDB)

| Parametr | Wartość |
|----------|---------|
| PostgreSQL | `localhost:5432`, user `postgres`, hasło z `.env` |
| MongoDB | `mongodb://127.0.0.1:27017/boiskopro` |

**GUI:** MongoDB Compass, pgAdmin lub DBeaver — szczegóły w sekcji połączeń poniżej.

### MongoDB Compass

```
mongodb://127.0.0.1:27017/boiskopro
```

### pgAdmin

Host `localhost`, port `5432`, database `boiskopro`, user `postgres`.

### Wiersz poleceń

```powershell
net start postgresql-x64-17
net start MongoDB
```

## Architektura (techniczna)

- **PostgreSQL** — produkty, zamówienia, płatności
- **MongoDB** — użytkownicy, recenzje, logi
- **Express + JWT** — API
- **React + Vite** — frontend (`client/`)
