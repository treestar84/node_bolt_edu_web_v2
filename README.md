# Toddler Learning Web App

This project is an interactive web application designed to help toddlers learn words and read picture books. It is built primarily with Vue 3 and Supabase, and includes a supplementary backend server using Express.

## Key Features

- **Word Learning**: Learn words through interactive cards with images and native speaker pronunciation.
- **Picture Book Reading**: Read picture books that provide images, text, and audio for each page.
- **Quizzes and Puzzles**: Enjoy simple quizzes and puzzle games based on the learned content.
- **Learning Statistics and Achievements**: Track learning progress and earn badges.
- **Admin Page**: Provides functionality to manage content such as words, picture books, badges, and API keys.

## Tech Stack

- **Frontend**: Vue 3, Vite, TypeScript, Pinia, Tailwind CSS
- **Backend**:
    - **Primary Data and Authentication**: Supabase (PostgreSQL, Auth)
    - **Auxiliary Server (File Uploads, etc.)**: Node.js, Express
- **Database Migrations**: Supabase CLI

## Project Structure

```
/
├── server/              # Express backend (file uploads, API)
├── src/                 # Vue.js frontend source code
│   ├── components/      # Common components
│   ├── views/           # Page views
│   ├── stores/          # Pinia state management
│   ├── router/          # Vue Router configuration
│   ├── composables/     # Reusable logic
│   └── types/           # TypeScript type definitions
├── supabase/            # Supabase related files
│   └── migrations/      # DB schema migrations
├── public/              # Static files
├── package.json         # Project dependencies and scripts
└── vite.config.ts       # Vite configuration (including proxy)
```

## Architecture and Data Flow

This project utilizes a hybrid backend approach, combining Supabase for core data and authentication with a separate Express server for handling file uploads and specific API endpoints.

### Frontend Architecture

The frontend is built with Vue 3 and uses Pinia for state management, structured into several key stores:

- **`auth.ts`**: Manages user authentication, including registration, login, logout, and user profile data.
- **`app.ts`**: Handles global application state, such as language settings, and manages public content like words and books. It also contains the logic for admin functions and API key management.
- **`content.ts`**: Manages personalized content for authenticated users, including user-specific words, books, and badges.

### Data Models

The primary data models are defined in `src/types/index.ts` and include:

- `WordItem`: Represents a single word with its English and Korean names, image, audio files, and category.
- `Book`: Represents a picture book with a title, cover image, and a collection of `BookPage` objects.
- `UserProfile`: Stores user-specific information, such as user type, site name, and child's information.
- `UserProgress`: Tracks a user's learning progress, including quiz scores, puzzles completed, and words learned.
- `Badge`: Defines an achievement that can be unlocked by meeting certain criteria.

### Backend and API

The Express server, located in the `server/` directory, provides a RESTful API for content management and file uploads. Key routes include:

- `/api/auth`: Handles administrator login and token verification.
- `/api/keys`: Manages API keys for accessing content creation endpoints.
- `/api/words`: CRUD operations for words.
- `/api/books`: CRUD operations for books.
- `/api/upload`: Handles image, audio, and video file uploads.

For detailed information about the API, please refer to the [API Documentation](API_DOCS.md).

## Getting Started

### 1. Install Dependencies

Run the following command in the project root directory:

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the project root and configure the Supabase keys. Refer to the `.env.example` file for guidance. (You can find these keys in your Supabase project settings.)

```
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### 3. Configure Supabase Database

You need to apply the migration files to your local or remote Supabase project to set up the database schema. You can use the [Supabase CLI](https://supabase.com/docs/guides/cli) to run the following commands:

```bash
# Link to your Supabase project (one-time setup)
supabase link --project-ref <your-project-id>

# Apply migrations to the remote database
supabase db push

# Or start a local development environment
supabase start
```

### 4. Run the Development Servers

You need to run both the frontend development server and the backend API server concurrently.

- **Frontend (Vue)**:
  ```bash
  npm run dev
  ```
  > Runs on `http://localhost:5173` by default.

- **Backend (Express)**:
  Open a new terminal and run the following command:
  ```bash
  npm run api
  ```
  > Runs on `http://localhost:3001` by default.

Now you can access the application by navigating to `http://localhost:5173` in your browser.

## Key NPM Scripts

- `npm run dev`: Starts the frontend development server.
- `npm run build`: Builds the frontend for production.
- `npm run preview`: Previews the built application.
- `npm run api`: Starts the backend Express server.
