# Live Site: https://mhs-inventory.netlify.app

## Backend Server: https://inventory-420.vercel.app

# Features

1. Authentication - Register new account and login into existing account
2. Create Product - Create new product with various information
3. Manage product -
   - View All Product of login user
   - filter and search using different fields
   - pagination
   - update existing product
   - delete existing product
   - create new variant of product
   - sell that product
4. Manage sale -
   - View all sale with pagination
   - update sale data
   - delete sale data
5. Sale history - View sales history categorized by:
   - Yearly
   - Monthly
   - Weekly
   - Daily

## Instruction to run the application local

- Step 1: create a `.env` file at root of the directory and include the environment variables as following bellow

  ```bash
    NODE_ENV=dev
    PORT=5000
    DATABASE_URL=
    JWT_SECRET=your_jwt_secret
  ```

- Step 2: install all the dependencies using the command
  ```bash
    npm install 
    #or 
    yarn
    #or
    pnpm instal
  ```
- Step 3: run the development server using the command

  ```bash
    npm run dev
  ```

  or run the production server using the commands

  ```bash
    # at first build the production server
    npm run build

    #then
    npm start
  ```

## Optional fashion demo catalog

The idempotent demo seed adds the following 10 products (40 variants) to an existing StyleStock account:

- Men's Oversized T-shirt — Nike — Men's Clothing — ₹799
- Men's Slim Fit Jeans — Levi's — Men's Clothing — ₹1,499
- Women's Floral Summer Dress — H&M — Women's Clothing — ₹1,299
- Women's Casual Hoodie — Zara — Women's Clothing — ₹1,599
- Women's Running Sneakers — Adidas — Footwear — ₹2,499
- Men's Sports Shoes — Puma — Footwear — ₹2,199
- Women's Classic Handbag — Zara — Bags & Backpacks — ₹1,899
- Urban Travel Backpack — Skybags — Bags & Backpacks — ₹1,499
- Classic Analog Watch — Fastrack — Watches — ₹1,799
- Premium Leather Belt — Woodland — Fashion Accessories — ₹899

The images are original local SVG illustrations served by the client from `client/public/demo-products`. Product/category/brand/seller records are scoped to the requested existing user. The script reuses categories and brands case-insensitively, reuses that user's first seller (creating a compatible demo supplier only if needed), skips existing products without overwriting them, and reports inserted/skipped names, variant counts, and stock totals. It creates opening-stock movement records only; it does not create purchase or sale transactions and never deletes database records.

From PowerShell, run from the project root:

```powershell
cd server
$env:DEMO_USER_ID = "<existing-user-object-id>"
npm run seed:style-stock-demo
```

`DEMO_USER_ID` must be the MongoDB `_id` of an existing StyleStock user. The script uses the existing `DATABASE_URL` from the server `.env`; review the summary printed by the command to see exactly which products were inserted and skipped.

To verify in MongoDB, connect with the same `DATABASE_URL` using `mongosh` and run the following query, replacing the user ID:

```javascript
const userId = ObjectId("<existing-user-object-id>");
const names = [
  "Men's Oversized T-shirt",
  "Men's Slim Fit Jeans",
  "Women's Floral Summer Dress",
  "Women's Casual Hoodie",
  "Women's Running Sneakers",
  "Men's Sports Shoes",
  "Women's Classic Handbag",
  "Urban Travel Backpack",
  "Classic Analog Watch",
  "Premium Leather Belt"
];

db.products.countDocuments({ user: userId, name: { $in: names } });
db.products.aggregate([
  { $match: { user: userId, name: { $in: names } } },
  {
    $project: {
      name: 1,
      price: 1,
      stock: 1,
      variantCount: { $size: "$variants" },
      variantStock: {
        $reduce: {
          input: "$variants",
          initialValue: 0,
          in: { $add: ["$$value", "$$this.stock"] }
        }
      },
      images: 1
    }
  },
  { $sort: { name: 1 } }
]);
```

The count should be `10` after all ten exist; each product should show four variants, `stock` should match `variantStock`, and images should point to `/demo-products/...`. To verify in the frontend, sign in as the same user, open **Manage Products**, search/filter for each name, and open a product row to inspect its image, variants, stock, category, brand, and selling price.
