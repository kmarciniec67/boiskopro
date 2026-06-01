# Opis plików projektu BoiskoPro

Krótki opis do czego służy każdy plik w repozytorium (bez `node_modules`, `dist` i wygenerowanych buildów).

---

## Katalog główny

| Plik | Do czego służy |
|------|----------------|
| `package.json` | Zależności i skrypty backendu (dev, build, seed, start). |
| `package-lock.json` | Zablokowane wersje paczek npm — generowany automatycznie. |
| `tsconfig.json` | Ustawienia kompilacji TypeScript dla API. |
| `README.md` | Instrukcja uruchomienia projektu i konta testowe. |
| `SPRAWOZDANIE_TECHNICZNE.md` | Pełne sprawozdanie techniczne projektu. |
| `SPRAWOZDANIE_TECHNICZNE.docx` | Ta sama treść w formacie Word. |
| `OPIS_PLIKOW.md` | Ten plik — opis ról plików w projekcie. |
| `.env` | Lokalna konfiguracja (hasła DB, port, JWT) — nie commituj. |
| `.env.example` | Wzór zmiennych środowiskowych do skopiowania jako `.env`. |
| `.gitignore` | Lista plików ignorowanych przez Git (np. `node_modules`, `.env`, `uploads`). |
| `docker-compose.yml` | Uruchomienie PostgreSQL i MongoDB w Dockerze (opcjonalnie). |

---

## `src/` — backend (API)

| Plik | Do czego służy |
|------|----------------|
| `src/index.ts` | Start serwera Express, podpięcie tras, statycznych plików i baz. |
| `src/config/index.ts` | Wczytanie konfiguracji z `.env` (port, PostgreSQL, MongoDB). |

### `src/db/`

| Plik | Do czego służy |
|------|----------------|
| `postgres.ts` | Połączenie z PostgreSQL i migracja kolumny `image_url`. |
| `mongodb.ts` | Połączenie z MongoDB przez Mongoose. |
| `initSchema.ts` | Skrypt `npm run db:init` — tworzy bazę i schemat. |

### `src/middleware/`

| Plik | Do czego służy |
|------|----------------|
| `auth.ts` | Sprawdza JWT — wymaga logowania lub roli admina. |
| `errorHandler.ts` | Obsługa błędów API (walidacja Zod, komunikaty). |

### `src/models/mongo/`

| Plik | Do czego służy |
|------|----------------|
| `User.ts` | Model użytkownika (email, hasło, rola). |
| `Review.ts` | Model opinii o produkcie. |
| `ActivityLog.ts` | Model logów aktywności (np. nowe zamówienie). |

### `src/repositories/`

| Plik | Do czego służy |
|------|----------------|
| `productRepository.ts` | Zapytania do tabeli produktów (lista, tworzenie, edycja, stan). |
| `orderRepository.ts` | Zamówienia — tworzenie w transakcji, lista, zmiana statusu. |
| `userRepository.ts` | Użytkownicy, opinie, logi, usuwanie kont. |

### `src/routes/`

| Plik | Do czego służy |
|------|----------------|
| `auth.ts` | Logowanie, rejestracja, endpoint `/me`. |
| `products.ts` | Publiczny katalog produktów. |
| `orders.ts` | Składanie i podgląd zamówień (dla klienta). |
| `reviews.ts` | Pobieranie i dodawanie opinii. |
| `admin.ts` | Panel admina — produkty, zamówienia, użytkownicy, upload zdjęć. |

### `src/utils/`

| Plik | Do czego służy |
|------|----------------|
| `authToken.ts` | Tworzenie i weryfikacja tokenów JWT. |
| `password.ts` | Hashowanie i porównywanie haseł (bcrypt). |
| `userDto.ts` | Mapowanie użytkownika z bazy na bezpieczny JSON (bez hasła). |
| `params.ts` | Pomocnik — parametry URL z Express jako pojedynczy string. |

### `src/types/`

| Plik | Do czego służy |
|------|----------------|
| `postgres.ts` | Typy TypeScript dla tabel PostgreSQL. |

### `src/seed/`

| Plik | Do czego służy |
|------|----------------|
| `index.ts` | Wypełnienie bazy danymi demo (`npm run seed` / `seed:reset`). |

---

## `client/` — frontend

| Plik | Do czego służy |
|------|----------------|
| `client/package.json` | Zależności i skrypty frontendu (Vite, React). |
| `client/package-lock.json` | Zablokowane wersje paczek frontendu. |
| `client/index.html` | Szablon HTML — punkt wejścia aplikacji React. |
| `client/vite.config.ts` | Konfiguracja Vite (port 5173, proxy do API). |
| `client/tsconfig.json` | TypeScript dla kodu React. |
| `client/tsconfig.node.json` | TypeScript dla plików konfiguracyjnych Vite. |

### `client/src/`

| Plik | Do czego służy |
|------|----------------|
| `main.tsx` | Uruchomienie React, router i providery (auth, koszyk). |
| `App.tsx` | Główny layout, trasy stron i modal logowania. |
| `index.css` | Globalne style i Tailwind. |
| `api.ts` | Funkcje wywołujące API (fetch + token JWT). |
| `types.ts` | Typy danych po stronie klienta (produkt, zamówienie, user). |

### `client/src/pages/`

| Plik | Do czego służy |
|------|----------------|
| `HomePage.tsx` | Strona główna — katalog produktów i filtry kategorii. |
| `CartPage.tsx` | Koszyk zakupów. |
| `CheckoutPage.tsx` | Formularz zamówienia i płatności. |
| `OrdersPage.tsx` | Lista zamówień zalogowanego użytkownika. |
| `AdminPage.tsx` | Panel administratora (produkty, zamówienia, użytkownicy). |

### `client/src/components/`

| Plik | Do czego służy |
|------|----------------|
| `Header.tsx` | Górny pasek nawigacji i przycisk logowania. |
| `Footer.tsx` | Stopka strony. |
| `Hero.tsx` | Baner na stronie głównej. |
| `ProductCard.tsx` | Kafelek produktu na liście. |
| `ProductModal.tsx` | Okno szczegółów produktu i opinie. |
| `AuthModal.tsx` | Modal logowania, rejestracji i konta. |

### `client/src/context/`

| Plik | Do czego służy |
|------|----------------|
| `AuthContext.tsx` | Stan zalogowanego użytkownika i funkcje login/logout. |
| `CartContext.tsx` | Koszyk w pamięci + zapis w `localStorage`. |

### `client/src/utils/`

| Plik | Do czego służy |
|------|----------------|
| `imageUrl.ts` | Poprawne adresy URL zdjęć produktów (`/uploads/...`). |

---

## `db/` — schematy baz

| Plik | Do czego służy |
|------|----------------|
| `db/postgres/init.sql` | Definicja tabel PostgreSQL (produkty, zamówienia, płatności). |
| `db/mongo/init.js` | Inicjalizacja kolekcji i indeksów MongoDB. |

---

## `scripts/` — skrypty pomocnicze

| Plik | Do czego służy |
|------|----------------|
| `install-databases.ps1` | Instalacja PostgreSQL i MongoDB na Windows. |
| `set-postgres-password.ps1` | Ustawienie hasła użytkownika PostgreSQL. |
| `rename-project-folder.ps1` | Zmiana nazwy folderu projektu (migracja ze starej nazwy). |

---

## Katalogi tworzone w runtime (nie w repo)

| Katalog | Do czego służy |
|---------|----------------|
| `uploads/` | Przechowywanie wgranych zdjęć produktów. |
| `dist/` | Skompilowany backend po `npm run build`. |
| `client/dist/` | Zbudowany frontend do serwowania w produkcji. |
