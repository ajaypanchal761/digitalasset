# Digital Asset Backend

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
3. Update the `MONGODB_URI` in `.env` to point to your MongoDB instance.
4. Add your Cloudinary credentials to `.env`:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
4. Start the development server:
   ```bash
   npm run dev
   ```

The server listens on the port defined in the `.env` file (defaults to `5000`). A basic health check is available at `GET /api/health`. Upload images by sending a `multipart/form-data` request with an `image` field to `POST /api/uploads`.

## Available Scripts

- `npm run dev`: Start the server with hot reload using `nodemon`.
- `npm start`: Start the server in production mode.

