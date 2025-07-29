# API Documentation

This document provides a detailed overview of the API endpoints available in this project.

## Authentication

Two types of authentication are used:

1.  **Admin Token (JWT):** Required for administrative actions like managing API keys. Obtained by logging in via the `/api/auth/login` endpoint. The token must be included in the `Authorization` header as a Bearer token.
2.  **API Key:** Required for content management endpoints (words, books). The key must be included in the `X-API-Key` header.

---

## Endpoints

### Authentication (`/api/auth`)

| Method | Path          | Description                  | Authentication | Request Body              | Response Body (Success)                               |
| :----- | :------------ | :--------------------------- | :------------- | :------------------------ | :---------------------------------------------------- |
| `POST` | `/login`      | Logs in an administrator.    | None           | `{ "password": "..." }`   | `{ "success": true, "token": "...", "expiresIn": "24h" }` |
| `GET`  | `/verify`     | Verifies an admin token.     | Admin Token    | -                         | `{ "success": true, "admin": { ... } }`               |
| `POST` | `/logout`     | Logs out an administrator.   | Admin Token    | -                         | `{ "success": true, "message": "Logged out" }`        |

### API Keys (`/api/keys`)

| Method   | Path    | Description              | Authentication | Request Body                      | Response Body (Success)                                |
| :------- | :------ | :----------------------- | :------------- | :-------------------------------- | :----------------------------------------------------- |
| `GET`    | `/`     | Get all API keys.        | Admin Token    | -                                 | `{ "success": true, "data": [ ... ], "count": ... }`   |
| `POST`   | `/`     | Create a new API key.    | Admin Token    | `{ "name": "...", "desc": "..." }` | `{ "success": true, "data": { ... } }`                 |
| `DELETE` | `/:id`  | Delete an API key.       | Admin Token    | -                                 | `{ "success": true, "message": "Key deleted" }`        |

### Words (`/api/words`)

| Method   | Path       | Description                | Authentication | Request Body (POST/PUT)                               | Response Body (Success)                                |
| :------- | :--------- | :------------------------- | :------------- | :---------------------------------------------------- | :----------------------------------------------------- |
| `GET`    | `/`        | Get all words.             | None           | -                                                     | `{ "success": true, "data": [ ... ], "count": ... }`   |
| `GET`    | `/:id`     | Get a single word by ID.   | None           | -                                                     | `{ "success": true, "data": { ... } }`                 |
| `POST`   | `/`        | Create a new word.         | API Key        | `{ "name": "...", "nameEn": "...", ... }`             | `{ "success": true, "data": { ... } }`                 |
| `POST`   | `/batch`   | Create multiple words.     | API Key        | `{ "words": [ ... ] }`                                | `{ "success": true, "data": { "created": [], "errors": [] } }` |
| `PUT`    | `/:id`     | Update a word.             | API Key        | `{ "name": "...", ... }` (partial updates allowed)    | `{ "success": true, "data": { ... } }`                 |
| `DELETE` | `/:id`     | Delete a word.             | API Key        | -                                                     | `{ "success": true, "message": "Word deleted" }`       |

### Books (`/api/books`)

| Method   | Path          | Description                 | Authentication | Request Body (POST/PUT)                               | Response Body (Success)                                |
| :------- | :------------ | :-------------------------- | :------------- | :---------------------------------------------------- | :----------------------------------------------------- |
| `GET`    | `/`           | Get all books.              | None           | -                                                     | `{ "success": true, "data": [ ... ], "count": ... }`   |
| `GET`    | `/:id`        | Get a single book by ID.    | None           | -                                                     | `{ "success": true, "data": { ... } }`                 |
| `POST`   | `/`           | Create a new book.          | API Key        | `{ "title": "...", "pages": [ ... ], ... }`           | `{ "success": true, "data": { ... } }`                 |
| `POST`   | `/complete`   | Create a book with 4 pages. | API Key        | `{ "title": "...", "page1Image": "...", ... }`        | `{ "success": true, "data": { ... } }`                 |
| `PUT`    | `/:id`        | Update a book.              | API Key        | `{ "title": "...", ... }` (partial updates allowed)   | `{ "success": true, "data": { ... } }`                 |
| `DELETE` | `/:id`        | Delete a book.              | API Key        | -                                                     | `{ "success": true, "message": "Book deleted" }`       |

### File Uploads (`/api/upload`)

| Method | Path      | Description              | Authentication | Request Body (form-data) | Response Body (Success)                                |
| :----- | :-------- | :----------------------- | :------------- | :----------------------- | :----------------------------------------------------- |
| `POST` | `/image`  | Upload a single image.   | None           | `image`: (file)          | `{ "success": true, "data": { "url": "..." } }`        |
| `POST` | `/audio`  | Upload a single audio.   | None           | `audio`: (file)          | `{ "success": true, "data": { "url": "..." } }`        |
| `POST` | `/video`  | Upload a single video.   | None           | `video`: (file)          | `{ "success": true, "data": { "url": "..." } }`        |
| `POST` | `/batch`  | Upload multiple files.   | None           | `images`: (files), `audio`: (files) | `{ "success": true, "data": { "images": [], "audio": [] } }` |

---

## Data Models

### Word

```json
{
  "id": "string",
  "name": "string",
  "nameEn": "string",
  "imageUrl": "string (URL)",
  "audioKo": "string (URL)",
  "audioEn": "string (URL)",
  "category": "string",
  "minAge": "number",
  "maxAge": "number",
  "ownerType": "'global' | 'user'",
  "ownerId": "string (optional)"
}
```

### Book

```json
{
  "id": "string",
  "title": "string",
  "coverImage": "string (URL)",
  "minAge": "number",
  "maxAge": "number",
  "ownerType": "'global' | 'user'",
  "ownerId": "string (optional)",
  "isVideoMode": "boolean",
  "videoUrl": "string (URL, optional)",
  "pages": [
    {
      "id": "string",
      "imageUrl": "string (URL)",
      "audioUrl": "string (URL)",
      "textContent": "string (optional)"
    }
  ]
}
```
