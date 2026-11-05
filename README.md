# StyleStock

StyleStock is a fashion and lifestyle inventory management application for tracking products, size and colour variants, stock, purchases, and sales. It helps retail teams monitor variant-level inventory and spot low or depleted stock. The application is built on the MERN stack and extends and customizes an existing open-source inventory system.

## Features

- **Authentication and profiles:** Register, sign in, and log out; protected application pages use JWT authentication. Manage your profile and password.
- **Product management:** Create, view, update, and delete products; organize them by category and brand; search, filter, and paginate the product list; and mark products active or inactive.
- **Variant inventory:** Track stock by size and colour, set a low-stock threshold per variant, and optionally enter an SKU. Total product stock is calculated from its variants. SKUs are saved when entered but are not generated automatically, and uniqueness is not enforced.
- **Product details:** Open a product details modal to view product and variant information, browse a gallery of up to 12 images, add images through Cloudinary, clone a product, review paginated stock movement history, and keep product notes.
- **Purchases and sales:** Add stock or record a sale for a selected variant. The API updates variant inventory transactionally and records stock movements; sales are rejected when stock is insufficient. Purchase and sale lists support search and pagination, and records can be deleted. Edit controls are present in the UI, but their forms do not currently save changes.
- **Dashboard:** View total stock, sales and revenue summaries, daily and monthly charts, and low-stock/out-of-stock variant alerts.

## Screenshots

The following screenshot files are **not present yet**. Capture the application and save your own screenshots at these paths:

- `asset/screenshots/dashboard.png`
- `asset/screenshots/products.png`
- `asset/screenshots/product-details.png`
- `asset/screenshots/sales.png`

Once the files exist, add them to the README with relative image links, for example:

```markdown
![StyleStock dashboard](asset/screenshots/dashboard.png)
![Product inventory](asset/screenshots/products.png)
![Product details](asset/screenshots/product-details.png)
![Sales management](asset/screenshots/sales.png)
```

## Technology

| Area              | Technologies                                                                |
| ----------------- | --------------------------------------------------------------------------- |
| Frontend          | React 18, TypeScript, Vite, Redux Toolkit / RTK Query, Ant Design, Recharts |
| Backend           | Node.js, Express, TypeScript, Mongoose, Zod                                 |
| Data and services | MongoDB, JWT, bcrypt, Cloudinary image uploads                              |

## Architecture

The React single-page application in `client/` calls the Express REST API in `server/` under `/api/v1`. RTK Query manages API requests and cache state; the API uses Mongoose to read and write MongoDB documents. JWTs are sent in the `Authorization` header for authenticated requests. Product images are uploaded directly from the browser to Cloudinary; the resulting image URLs are saved with the product through the API.

## Project structure

```text
.
├── asset/                    # Existing image assets
│   ├── 1.png ... 5.png
│   └── extends.md
├── client/                   # Main React + Vite frontend
│   ├── public/                # Static files and demo product images
│   │   └── demo-products/
│   └── src/
│       ├── components/        # UI, product details, tables, charts, modals
│       ├── pages/             # Dashboard, product, purchase, sale, profile, auth
│       ├── redux/             # Store, slices, and RTK Query services
│       ├── routes/
│       ├── types/
│       └── utils/
├── next-client/               # Separate Next.js frontend workspace
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── actions/
│   └── package.json
├── server/                    # Express + TypeScript API
│   └── src/
│       ├── config/
│       ├── middlewares/
│       ├── modules/            # User, product, category, brand, seller, purchase, sale
│       ├── routes/
│       └── scripts/
├── start.bat                  # Windows Command Prompt starter
├── start.ps1                  # PowerShell starter
└── start.sh                   # macOS/Linux starter
```

The Windows and shell starter scripts launch `client/` and `server/`; they do not configure environment variables. `next-client/` is a separate Next.js workspace and is not launched by these scripts.

## Prerequisites

- Node.js 18.x, 20.x, or 22+ (as allowed by the installed Vite version), plus npm
- MongoDB locally or a MongoDB Atlas database
- A Cloudinary account and an **unsigned upload preset** if you want to use product image uploads

The API uses MongoDB transactions for some inventory operations. A local MongoDB server must be configured as a replica set for those operations; MongoDB Atlas is another option.

## Installation and setup

### 1. Configure the backend

From the repository root, open PowerShell:

```powershell
Set-Location .\server
if (-not (Test-Path .env)) { Copy-Item .env.default .env }
notepad .env
```

Set the values using your own local database or Atlas connection string:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=mongodb://127.0.0.1:27017/stylestock
JWT_SECRET=replace-with-a-long-random-secret
```

Install dependencies and run the API in this terminal:

```powershell
npm install
npm run dev
```

The API listens on the configured `PORT` after it connects to MongoDB.

### 2. Configure and run the frontend

Open a second PowerShell window at the repository root:

```powershell
Set-Location .\client
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
notepad .env
```

Configure:

```env
VITE_BASE_URL=http://localhost:5000/api/v1
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

Image upload needs the Cloudinary settings described in [Environment variables](#environment-variables). Restart Vite after setting or changing them.

Then start the frontend:

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

### Optional startup scripts

After both environment files are configured, run `.\start.bat` from the repository root in Command Prompt or `.\start.ps1` in PowerShell. These scripts install dependencies when `node_modules` is absent and open separate terminals for the API and frontend.

## Environment variables

The backend reads `server/.env` and the Vite frontend reads `client/.env`. Example templates are provided at `server/.env.default` and `client/.env.example`.

### Backend

| Variable       | Purpose                                                 |
| -------------- | ------------------------------------------------------- |
| `NODE_ENV`     | Runtime environment label                               |
| `PORT`         | Port used by the API; the starter scripts expect `5000` |
| `DATABASE_URL` | MongoDB connection string                               |
| `JWT_SECRET`   | Private signing secret used to verify JWTs              |

Use your own local MongoDB or Atlas URI for `DATABASE_URL`, and a long random value for `JWT_SECRET`. Do not commit these values or share them publicly.

### Frontend

| Variable                        | Purpose                                       |
| ------------------------------- | --------------------------------------------- |
| `VITE_BASE_URL`                 | API root URL, including `/api/v1`             |
| `VITE_CLOUDINARY_CLOUD_NAME`    | Cloudinary cloud name used by browser uploads |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Name of the Cloudinary unsigned upload preset |

Frontend uploads require a Cloudinary account, its cloud name, and an unsigned upload preset configured in the Cloudinary dashboard. Set the preset name in `VITE_CLOUDINARY_UPLOAD_PRESET`. The app uploads image files directly to Cloudinary and saves the returned secure image URL with the product through the API. Client-side upload validation limits each file to 10 MB and each product to 12 images.

All `VITE_` values are included in browser code and are public configuration, not secrets. Never put a Cloudinary API secret in a frontend variable. Configure suitable format and size restrictions on the unsigned preset. Restart Vite after changing frontend environment variables.

## Available npm commands

Run each command from its package directory.

### `client/`

| Command           | Purpose                                           |
| ----------------- | ------------------------------------------------- |
| `npm run dev`     | Start the Vite development server                 |
| `npm run build`   | Type-check and create a production frontend build |
| `npm run preview` | Preview the production build locally              |
| `npm run lint`    | Run ESLint                                        |

### `server/`

| Command                            | Purpose                                      |
| ---------------------------------- | -------------------------------------------- |
| `npm run dev`                      | Start the TypeScript API in development      |
| `npm run build`                    | Compile TypeScript to `dist/`                |
| `npm start`                        | Run the compiled API (`npm run build` first) |
| `npm run lint`                     | Run ESLint                                   |
| `npm run lint:fix`                 | Apply ESLint fixes                           |
| `npm run format`                   | Format server source files                   |
| `npm run format:fix`               | Format the server source directory           |
| `npm run migrate:product-variants` | Build and run the product-variant migration  |
| `npm run seed:style-stock-demo`    | Build and run the StyleStock demo-data seed  |

The migration and seed commands connect to the database selected by `DATABASE_URL`; use them only when you intend to change that database. Automated tests are not currently configured in the client or server package, and no test/spec files are present. `next-client/` is a separate Next.js workspace, not used by the root startup scripts or the main setup above.

## How to use

1. Register an account from the application and sign in.
2. In product creation, add a seller and category if needed. A seller and category are required for each product; a brand is optional.
3. Enter product information and add one or more size/colour variants. Set each variant's starting stock and low-stock threshold; an SKU can be entered optionally.
4. Open the saved product's details modal and upload product images if Cloudinary is configured.
5. To receive stock, use the product management **Add stock** action on the relevant variant. This increases that variant's inventory and creates a purchase and stock-movement record.
6. To sell an item, use the product management **Sell** action and select the variant and quantity. The sale is rejected if the selected variant does not have enough stock.
7. Review purchase and sale records in their management pages. Deletion is available; editing controls are not fully wired to save changes.
8. Use the product details modal to review stock movement history, and check the dashboard for totals, charts, and low-stock or out-of-stock variants.

## Troubleshooting

- **API cannot connect to MongoDB:** Check that MongoDB is running and `server\.env` contains a valid `DATABASE_URL`. If a transaction-related error appears with local MongoDB, configure it as a replica set or use Atlas.
- **Frontend API requests fail:** Confirm the API is running and `VITE_BASE_URL` is `http://localhost:5000/api/v1` (or matches your configured API host and port). Restart the Vite process after editing `client\.env`.
- **Image upload is unavailable:** Confirm both Cloudinary frontend variables are set, the cloud name is correct, and the unsigned preset permits the selected image type and size. Restart Vite after changing the variables.
- **A port is already in use:** In PowerShell, identify the process ID with:

  ```powershell
  netstat -ano | findstr :5000
  netstat -ano | findstr :5173
  ```

  Stop only the process using the conflicting port, or change the backend `PORT` and corresponding frontend `VITE_BASE_URL`.

- **Dependencies are missing or inconsistent:** Run `npm install` again from the affected package directory (`server/` or `client/`).
- **API configuration appears ignored:** Confirm the backend file is `server\.env`, the frontend file is `client\.env`, and that each variable name matches the examples above. Stop and restart the relevant development process after changes.

## Security notes

- Passwords are hashed with bcrypt; authenticated API routes use JWT bearer tokens.
- The frontend sends JWTs in the `Authorization` header. The application does not implement HttpOnly-cookie authentication.
- Never commit `.env` files or share database credentials or `JWT_SECRET`. Keep all `VITE_` values public; they are bundled into frontend code.
- The API's CORS allowlist in `server/src/app.ts` currently permits `http://localhost:5173`, `http://localhost:3000`, and `https://inventory-navy.vercel.app`. Update the source allowlist when using another frontend origin.
- Cloudinary uploads use a browser-side unsigned preset. Configure that preset with appropriate upload restrictions; do not expose Cloudinary API secrets in the client.
- This README does not certify the project as production-hardened. Review authentication, CORS, secrets, upload restrictions, and database access for your deployment.

## Future improvements

- Add automated unit and integration tests.
- Document API request and response schemas.
- Complete the purchase and sale record editing workflows in the UI (API update routes exist, but the current edit forms do not submit changes).
- Add deployment-specific configuration and operational monitoring.
- Consider server-mediated, signed image uploads if the deployment requires them.

## Attribution and license

StyleStock extends and customizes the open-source [inventory-management-system by mhShohan](https://github.com/mhShohan/inventory-management-system). The upstream project is distributed under the **MIT License**, with the notice `Copyright (c) 2024 Mehdi Hasan Shohan`. See the [upstream MIT license](https://github.com/mhShohan/inventory-management-system/blob/main/LICENSE) and retain its notice and terms for reused portions.
