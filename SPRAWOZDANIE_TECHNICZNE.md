# Sprawozdanie techniczne — BoiskoPro

**Projekt:** BoiskoPro Shop (`boiskopro-shop` v1.0.0)  
**Typ:** Aplikacja webowa e-commerce (sklep piłkarski online)  
**Data dokumentu:** czerwiec 2026  
**Wersja dokumentu:** 2 (aktualizacja stanu repozytorium)  


---

## 1. Cel i zakres projektu

BoiskoPro to pełnofunkcyjny sklep internetowy z asortymentem piłkarskim (korki, piłki, stroje). System obejmuje:

- katalog produktów z filtrowaniem kategorii i zdjęciami,
- koszyk zakupów (stan po stronie klienta),
- rejestrację i logowanie użytkowników,
- składanie zamówień z adresem dostawy i wyborem metody płatności,
- opinie o produktach (dla zalogowanych),
- panel administratora: CRUD produktów (dodawanie, edycja, usuwanie, zdjęcia), zmiana statusów zamówień, przegląd i usuwanie kont użytkowników, podgląd zamówień klienta.

Architektura opiera się na **wzorcu klient–serwer**: React (SPA) komunikuje się z REST API (Express), które korzysta z **dwóch baz danych** — PostgreSQL (dane transakcyjne) i MongoDB (użytkownicy, recenzje, logi).

---

## 2. Architektura systemu

### 2.1. Diagram warstwowy

```
┌─────────────────────────────────────────────────────────────┐
│  Przeglądarka (React 19 + Vite)                             │
│  • Routing (React Router)                                   │
│  • Context: Auth, Cart (localStorage)                       │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP (JSON, JWT Bearer, multipart)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Express 4 API (:3000)                                      │
│  • Middleware: CORS, JSON, auth, error handler                │
│  • Statyczne: /uploads, client/dist (produkcja)             │
└──────────────┬──────────────────────────┬───────────────────┘
               │                          │
               ▼                          ▼
┌──────────────────────────┐  ┌──────────────────────────────┐
│  PostgreSQL (boiskopro)  │  │  MongoDB (boiskopro)         │
│  products, orders,       │  │  users, reviews,             │
│  order_items, payments   │  │  activity_logs               │
└──────────────────────────┘  └──────────────────────────────┘
```

### 2.2. Podział odpowiedzialności baz danych (polyglot persistence)

| Obszar | Baza | Uzasadnienie |
|--------|------|--------------|
| Produkty, zamówienia, pozycje, płatności | PostgreSQL | Relacyjna integralność, transakcje ACID, CHECK constraints |
| Konta, hasła, role | MongoDB | Elastyczny model dokumentowy, typowy dla profili użytkowników |
| Recenzje, logi aktywności | MongoDB | Powiązanie z `ObjectId` użytkownika, indeksy na `productId` |

Identyfikator użytkownika w zamówieniach (`orders.mongo_user_id`) to **most między systemami** — 24-znakowy string `ObjectId` z MongoDB.

### 2.3. Tryby uruchomienia

| Tryb | Frontend | API | Uwagi |
|------|----------|-----|--------|
| **Development** | `localhost:5173` (Vite) | `localhost:3000` | Proxy Vite: `/api`, `/uploads` → API |
| **Produkcja** | `client/dist` serwowany przez Express | ten sam port `:3000` | `npm run build` + `npm start` |

---

## 3. Stos technologiczny

### 3.1. Backend

| Technologia | Wersja | Zastosowanie |
|-------------|--------|--------------|
| Node.js | ≥18 | Runtime |
| TypeScript | 5.7 | Typowanie statyczne |
| Express | 4.21 | Serwer HTTP, routing |
| `pg` | 8.13 | Klient PostgreSQL (connection pool) |
| Mongoose | 8.9 | ODM MongoDB |
| Zod | 3.24 | Walidacja wejścia API |
| jsonwebtoken | 9.0 | Tokeny JWT (sesja 7 dni) |
| bcryptjs | 3.0 | Hashowanie haseł |
| multer | 2.1 | Upload zdjęć produktów (max 5 MB) |
| tsx | 4.19 | Uruchomienie TS w dev/seed |

### 3.2. Frontend

| Technologia | Wersja | Zastosowanie |
|-------------|--------|--------------|
| React | 19 | UI komponentowy |
| React Router | 7 | Routing SPA |
| Vite | 6 | Bundler, dev server, HMR |
| Tailwind CSS | 4 | Stylowanie (plugin `@tailwindcss/vite`) |

### 3.3. Narzędzia i infrastruktura lokalna

- PostgreSQL (`localhost:5432`, baza `boiskopro`)
- MongoDB (`mongodb://127.0.0.1:27017/boiskopro`)
- `concurrently` — równoległy start API i frontendu (`npm run dev`)
- Skrypty PowerShell: instalacja DB, opcjonalna zmiana nazwy folderu projektu

---

## 4. Model danych

### 4.1. PostgreSQL (`db/postgres/init.sql`)

**`products`**

| Kolumna | Typ | Opis |
|---------|-----|------|
| id | SERIAL PK | |
| sku | VARCHAR(50) UNIQUE | Kod magazynowy |
| name, description | VARCHAR/TEXT | |
| category | VARCHAR(100) | `korki`, `pilki`, `stroje` |
| price | NUMERIC(10,2) | Cena ≥ 0 |
| stock | INTEGER | Stan magazynowy |
| unit | VARCHAR(20) | np. `szt`, `para` |
| image_url | VARCHAR(500) | URL lub ścieżka `/uploads/...` |
| is_active | BOOLEAN | Widoczność w sklepie |
| created_at, updated_at | TIMESTAMPTZ | |

**`orders`**

| Kolumna | Typ | Opis |
|---------|-----|------|
| id | SERIAL PK | |
| order_number | VARCHAR(20) UNIQUE | Format `BP-YYYYMMDD-XXXX` |
| mongo_user_id | VARCHAR(24) | Referencja do MongoDB User |
| status | VARCHAR(30) | `pending`, `confirmed`, `shipped`, `delivered`, `cancelled` |
| total_amount | NUMERIC(10,2) | |
| shipping_address | JSONB | street, city, postalCode, country |

**`order_items`** — pozycje zamówienia (FK → orders, products; **bez** `ON DELETE CASCADE` na `product_id` — chroni historię zamówień przy próbie usunięcia produktu)  
**`payments`** — metoda (`card`, `blik`, `transfer`, `cash_on_delivery`), status płatności

Indeksy: `idx_products_category`, `idx_orders_user`, `idx_orders_status`, `idx_payments_order`.

Migracja runtime: przy starcie API dodawana jest kolumna `image_url`, jeśli brakuje jej w starszej instalacji (`src/db/postgres.ts`).

### 4.2. MongoDB

**Kolekcja `users`** (Mongoose `User`)

- `email` (unique, lowercase)
- `passwordHash` (bcrypt)
- `firstName`, `lastName`, `phone`
- `role`: `customer` | `admin` (domyślnie `customer`)
- `preferences`: newsletter, favoriteCategories

**Kolekcja `reviews`**

- `productId` (number — ID z PostgreSQL)
- `userId` (ObjectId → User)
- `rating` (1–5), `title`, `comment`
- `verifiedPurchase`
- Indeks unikalny `(productId, userId)` — jedna opinia na produkt na użytkownika

**Kolekcja `activity_logs`**

- `userId`, `action`, `entityType`, `entityId`, `metadata`, `ipAddress`
- Zapisy przy tworzeniu zamówień (`order.created`) i opinii (`review.created`)
- Model Mongoose `ActivityLog` wskazuje jawnie kolekcję **`activity_logs`** (uniknięcie duplikatu `activitylogs` z domyślnej pluralizacji Mongoose)
- Funkcja `getRecentActivity()` w repozytorium — **brak** endpointu API i widoku w aplikacji; podgląd wyłącznie w narzędziach zewnętrznych (np. MongoDB Compass)

---

## 5. Backend — struktura i API

### 5.1. Struktura katalogów `src/`

```
src/
├── index.ts              # Bootstrap Express, static, połączenia DB
├── config/index.ts       # Zmienne środowiskowe
├── db/
│   ├── postgres.ts       # Pool + migracje
│   ├── mongodb.ts        # Mongoose connect
│   └── initSchema.ts     # Skrypt inicjalizacji DB (npm run db:init)
├── middleware/
│   ├── auth.ts           # requireAuth, requireAdmin
│   └── errorHandler.ts   # Zod + błędy biznesowe
├── models/mongo/         # User, Review, ActivityLog
├── repositories/         # Warstwa dostępu do danych
├── routes/               # auth, products, orders, reviews, admin
├── utils/                # JWT, hasła, DTO użytkownika
└── seed/index.ts         # Dane demonstracyjne
```

### 5.2. Konwencja odpowiedzi API

- Sukces: `{ "data": <payload> }`
- Błąd: `{ "error": "<komunikat>" }` (+ opcjonalnie `details` przy walidacji Zod)
- Autoryzacja chronionych endpointów: nagłówek `Authorization: Bearer <JWT>`

### 5.3. Endpointy publiczne

| Metoda | Ścieżka | Opis |
|--------|---------|------|
| GET | `/api/health` | Status serwera |
| GET | `/api/products` | Aktywne produkty |
| GET | `/api/products/category/:category` | Filtr kategorii |
| GET | `/api/products/:id` | Szczegóły produktu |
| POST | `/api/auth/login` | Logowanie → token + user |
| POST | `/api/auth/register` | Rejestracja (zawsze `customer`) |
| GET | `/api/reviews/product/:productId` | Lista opinii |

### 5.4. Endpointy wymagające logowania (`requireAuth`)

| Metoda | Ścieżka | Opis |
|--------|---------|------|
| GET | `/api/auth/me` | Bieżący użytkownik |
| POST | `/api/orders` | Utworzenie zamówienia |
| GET | `/api/orders/mine` | Zamówienia użytkownika |
| GET | `/api/orders/:id` | Szczegóły (właściciel lub admin) |
| POST | `/api/reviews` | Dodanie opinii |

### 5.5. Endpointy administratora (`requireAdmin`)

| Metoda | Ścieżka | Opis |
|--------|---------|------|
| POST | `/api/admin/upload` | Upload zdjęcia (multipart `image`) |
| GET | `/api/admin/products` | Wszystkie produkty (także nieaktywne) |
| POST | `/api/admin/products` | Nowy produkt |
| PATCH | `/api/admin/products/:id` | Edycja produktu (w tym `isActive`, `imageUrl`) |
| DELETE | `/api/admin/products/:id` | Usunięcie produktu (z ograniczeniami — patrz §6.4) |
| GET | `/api/admin/orders` | Wszystkie zamówienia + pozycje |
| PATCH | `/api/admin/orders/:id/status` | Zmiana statusu |
| GET | `/api/admin/users` | Lista kont |
| GET | `/api/admin/users/:id/orders` | Zamówienia wybranego użytkownika |
| DELETE | `/api/admin/users/:id` | Usunięcie konta klienta |

**Ograniczenia usuwania użytkowników:** brak usuwania kont `admin`, brak samousunięcia przez zalogowanego admina.

### 5.6. Pliki statyczne

- Katalog `uploads/` w katalogu głównym projektu
- Serwowanie: `GET /uploads/<nazwa_pliku>`
- W dev: proxy Vite przekierowuje `/uploads` na port API (`client/vite.config.ts`)
- Routing SPA w produkcji **nie** przechwytuje `/uploads` (regex wyklucza `uploads` w `src/index.ts`)

## 6. Logika biznesowa — kluczowe przepływy

### 6.1. Składanie zamówienia (`createOrder`)

Proces w **jednej transakcji PostgreSQL** (`BEGIN` … `COMMIT`):

1. Walidacja produktów (istnieją, `is_active`, wystarczający `stock`).
2. Obliczenie `total_amount` i pozycji (`unit_price`, `subtotal`).
3. `INSERT` zamówienia ze statusem `pending`.
4. `INSERT` pozycji + `decrementStock` dla każdego produktu.
5. `INSERT` płatności ze statusem `completed` i `paid_at = NOW()`.
6. Aktualizacja zamówienia na `confirmed`.
7. Przy błędzie: `ROLLBACK`.

Numer zamówienia: `BP-<data>-<losowe 4 cyfry>`.

### 6.2. Uwierzytelnianie i autoryzacja

1. Hasło hashowane **bcrypt** przy rejestracji.
2. Po logowaniu/rejestracji: JWT z payload `{ userId, role }`, ważność **7 dni**.
3. `requireAuth` — weryfikacja tokenu, ustawienie `req.auth`.
4. `requireAdmin` — dodatkowy warunek `role === 'admin'`.
5. Frontend: token w `localStorage` (`boiskopro_token`), kontekst `AuthContext`.
6. Rejestracja **nie pozwala** na utworzenie konta admin — rola admin tylko przez seed lub ręczną zmianę w DB.

### 6.3. Koszyk

- Stan w **React Context** + persystencja w `localStorage` (bez synchronizacji z serwerem do momentu checkout).
- Checkout wymaga zalogowania; dane wysyłane do `POST /api/orders`.

### 6.4. Usuwanie produktu (admin)

Endpoint `DELETE /api/admin/products/:id`:

1. Sprawdzenie, czy produkt istnieje.
2. Sprawdzenie tabeli `order_items` — jeśli produkt występuje w jakimkolwiek zamówieniu → błąd **400** z komunikatem (nie można usunąć).
3. `DELETE` z PostgreSQL.
4. Usunięcie opinii w MongoDB (`deleteReviewsByProductId`).
5. Opcjonalne usunięcie pliku z `uploads/`, gdy `image_url` zaczyna się od `/uploads/`.

W panelu admina: przycisk **Usuń** przy produkcie + potwierdzenie w `confirm()`.

### 6.5. Logi aktywności

Zapis asynchroniczny przez `logActivity()` — nie blokuje odpowiedzi API przy zamówieniu/opinii. Przechowywanie w MongoDB umożliwia późniejszy audyt (kto, co, kiedy), bez wbudowanego UI w BoiskoPro.

---

## 7. Frontend — struktura i UX

### 7.1. Routing (`client/src/App.tsx`)

| Ścieżka | Komponent | Dostęp |
|---------|-----------|--------|
| `/` | HomePage | Publiczny |
| `/koszyk` | CartPage | Publiczny |
| `/zamowienie` | CheckoutPage | Wymaga logowania (przekierowanie) |
| `/zamowienia` | OrdersPage | Zalogowany |
| `/admin` | AdminPage | Tylko `role === 'admin'` |

Modal logowania (`AuthModal`) jest globalny — otwierany z nagłówka. **Nie zamyka się** po kliknięciu w tło; zamknięcie: przycisk ✕ lub Escape.

### 7.2. Główne moduły UI

| Moduł | Pliki | Funkcja |
|-------|-------|---------|
| Katalog | `HomePage`, `ProductCard`, `ProductModal`, `Hero` | Lista, filtr, szczegóły, opinie |
| Koszyk | `CartContext`, `CartPage` | Dodawanie, zmiana ilości |
| Zamówienie | `CheckoutPage` | Formularz adresu i płatności |
| Konto | `AuthContext`, `AuthModal` | Login, rejestracja, wylogowanie |
| Admin | `AdminPage` | Zakładki: zamówienia, produkty, użytkownicy |

**Panel administratora (`/admin`) — szczegóły:**

| Zakładka | Funkcje |
|----------|---------|
| **Zamówienia** | Lista wszystkich zamówień; select do zmiany statusu (`pending` → `delivered` / `cancelled`) |
| **Produkty** | Lista z miniaturą; **Dodaj produkt**; formularz edycji/tworzenia (upload pliku, URL zdjęcia, SKU, cena, stan, `is_active`); **Edytuj** / **Usuń** |
| **Użytkownicy** | Lista kont; kliknięcie → zamówienia użytkownika; **Usuń konto** (tylko klienci) |

Ochrona trasy: `Navigate` do `/`, gdy użytkownik nie ma roli `admin`.

### 7.3. Wyświetlanie zdjęć

- Pole `image_url` w produkcie (URL zewnętrzny lub `/uploads/...`).
- Helper `resolveImageUrl()` (`client/src/utils/imageUrl.ts`) — normalizacja ścieżek.
- W development proxy Vite dla `/uploads` jest **wymagane**, aby obrazy z API były widoczne na porcie 5173.

---

## 8. Bezpieczeństwo

| Obszar | Implementacja | Uwagi |
|--------|---------------|-------|
| Hasła | bcrypt | Hash nigdy nie trafia do API response |
| Sesja | JWT w nagłówku | Sekret: `JWT_SECRET` z `.env` |
| Walidacja | Zod na body requestów | Ograniczenie typów i długości |
| Upload | Multer: tylko `image/*`, 5 MB | Losowa nazwa pliku |
| Autoryzacja zasobów | Sprawdzenie właściciela zamówienia | Admin ma dostęp do wszystkich |
| CORS | Włączone globalnie | W produkcji warto zawęzić origin |
| Usuwanie adminów | Zablokowane w API | Ochrona przed utratą dostępu |
| Usuwanie produktów | Tylko jeśli brak w `order_items` | Chroni integralność historii zamówień |
| Usuwanie plików upload | Po usunięciu produktu | `fs.unlink` dla ścieżek `/uploads/...` |

**Rekomendacje produkcyjne (niezaimplementowane):** HTTPS, rate limiting, refresh tokenów, sanityzacja HTML w opiniach, skan antywirusowy uploadów, rotacja `JWT_SECRET`.

---

## 9. Konfiguracja środowiska

Plik `.env.example`:

```env
PORT=3000
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=boiskopro
MONGODB_URI=mongodb://127.0.0.1:27017/boiskopro
JWT_SECRET=zmien-na-losowy-ciag-w-produkcji
```

Skrypty npm:

| Skrypt | Działanie |
|--------|-----------|
| `npm run db:init` | Utworzenie bazy PG + schemat, indeksy Mongo |
| `npm run seed` / `seed:reset` | Dane demo (produkty, użytkownicy, zamówienia) |
| `npm run dev` | API + Vite równolegle |
| `npm run build` | `tsc` + `vite build` |
| `npm start` | Produkcja: `node dist/index.js` |

### Konta testowe (po `npm run seed:reset`)

| Rola | Email | Hasło |
|------|-------|-------|
| Administrator | admin@boiskopro.pl | admin123 |
| Klient | anna@example.com | haslo123 |
| Klient | piotr@example.com | haslo123 |

---

## 10. Diagram przepływu — ścieżka zakupowa

```
Użytkownik → Przeglądanie produktów (GET /api/products)
         → Dodanie do koszyka (localStorage)
         → Koszyk (/koszyk)
         → Logowanie (POST /api/auth/login) [jeśli niezalogowany]
         → Checkout (/zamowienie)
         → POST /api/orders
                → Transakcja PG: zamówienie + pozycje + płatność + stock
                → Log aktywności (MongoDB)
         → Podgląd zamówień (/zamowienia, GET /api/orders/mine)
```

**Ścieżka administratora:**

```
Admin → /admin
     → Produkty: upload (POST /admin/upload)
              POST /admin/products (nowy)
              PATCH /admin/products/:id (edycja, is_active)
              DELETE /admin/products/:id (usuń, jeśli nie w zamówieniach)
     → Zamówienia: PATCH /admin/orders/:id/status
     → Użytkownicy: GET /admin/users, GET .../orders, DELETE (klienci)
```

---

## 11. Ograniczenia i znane kompromisy

1. **Płatności symulowane** — po złożeniu zamówienia płatność od razu ma status `completed` (brak integracji z bramką płatniczą).
2. **Koszyk tylko lokalny** — brak synchronizacji między urządzeniami.
3. **Brak paginacji** — listy produktów, zamówień i użytkowników zwracane w całości.
4. **Usunięcie użytkownika** — zamówienia w PostgreSQL pozostają z `mongo_user_id` (dane osierocone, bez CASCADE do Mongo).
5. **Usunięcie produktu** — niemożliwe, gdy produkt występuje w `order_items`; alternatywa: ustawienie `is_active = false` w edycji.
6. **Recenzje** — `verifiedPurchase` ustawiane na `true` bez weryfikacji faktycznego zakupu; przy usunięciu produktu opinie w Mongo są kasowane.
7. **Logi aktywności** — zapis bez UI w aplikacji; w starszych instalacjach mógł powstać pusty duplikat kolekcji `activitylogs` (do ręcznego usunięcia w Compass).
8. **Brak testów automatycznych** — w repozytorium nie ma zestawów unit/e2e.
9. **Uploady na dysku lokalnym** — brak CDN/S3; folder `uploads/` poza repozytorium (`.gitignore`).

---

## 12. Możliwe kierunki rozwoju

- Integracja Stripe / Przelewy24 i webhooki statusu płatności.
- Email transakcyjny (potwierdzenie zamówienia).
- Paginacja, wyszukiwarka produktów, sortowanie.
- Panel magazynowy (alerty niskiego stanu).
- Zakładka **Logi** w panelu admina (`GET /api/admin/activity` + `getRecentActivity`).
- Testy: Vitest (frontend), Supertest (API).
- Konteneryzacja (Docker Compose: API + PG + Mongo) — plik `docker-compose.yml` w repo.
- OAuth (Google) obok logowania email/hasło.
- Miękkie usuwanie produktów (archiwum) zamiast twardego DELETE.

---

## 13. Podsumowanie

BoiskoPro jest **monorepo** łączącym frontend (React 19, Vite, Tailwind 4) z API TypeScript (Express) i **hybrydową warstwą danych** (PostgreSQL + MongoDB). Projekt obejmuje pełny cykl e-commerce oraz rozbudowany **panel administratora**: zarządzanie produktami ze zdjęciami (w tym usuwanie z walidacją zamówień), statusami zamówień i kontami użytkowników. Kod jest warstwowy (routes → repositories → bazy), z walidacją Zod, JWT i rozdzieleniem ról `customer` / `admin`.

---

*Wersja 2 — zaktualizowano: API admin (DELETE produktów), logi `activity_logs`, UX modala logowania, proxy `/uploads`, opis panelu admina. Przy kolejnych zmianach w kodzie aktualizuj sekcje 5 (API), 6 (przepływy) i 7 (frontend).*
