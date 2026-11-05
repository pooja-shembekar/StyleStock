# 🔧 Setup & Troubleshooting Guide

## Prerequisites Checklist

Before starting, make sure you have:

- [ ] **Node.js** installed (v16+): `node --version`
- [ ] **npm** installed (v8+): `npm --version`
- [ ] **MongoDB** account (local or Atlas): https://mongodb.com
- [ ] **Internet connection** for initial setup

---

## ✅ Verification Steps

### Check Node.js Installation
```bash
node --version      # Should show v16.0.0 or higher
npm --version       # Should show v8.0.0 or higher
```

### Check Port Availability
```bash
# Windows
netstat -ano | findstr "5000\|5173"

# Mac/Linux
lsof -i :5000
lsof -i :5173
```

If ports are in use, change them in the scripts or `.env` files.

---

## 🐛 Common Issues & Solutions

### Issue 1: "Node.js is not installed or not in PATH"

**Solution:**
1. Download and install Node.js from https://nodejs.org/
2. Make sure to check "Add to PATH" during installation
3. Restart your terminal/command prompt
4. Verify: `node --version`

---

### Issue 2: "Cannot find module errors"

**Solution:**
```bash
# Clear cache and reinstall
npm cache clean --force

# Navigate to server directory
cd server
rm -rf node_modules package-lock.json
npm install

# Navigate to client directory
cd ../client
rm -rf node_modules package-lock.json
npm install
```

---

### Issue 3: Port 5000 or 5173 already in use

**Windows:**
```bash
# Find process using port 5000
netstat -ano | findstr "5000"

# Kill the process (replace PID with the actual number)
taskkill /PID <PID> /F /T
```

**Mac/Linux:**
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process (replace PID with the actual number)
kill -9 <PID>
```

**Alternative:** Change port in `.env` file:
```env
PORT=5001  # Server
# For client, modify vite.config.ts
```

---

### Issue 4: MongoDB connection failed

**Check Connection String:**
```bash
# Windows/PowerShell
$env:DATABASE_URL  # Check if set

# Mac/Linux
echo $DATABASE_URL
```

**Fix MongoDB Connection:**

1. **For MongoDB Atlas:**
   - Go to https://cloud.mongodb.com/
   - Create cluster if not already done
   - Click "Connect" → "Drivers" → Copy connection string
   - Replace `<password>` with your password
   - Update `.env` file

2. **For Local MongoDB:**
   ```env
   DATABASE_URL=mongodb://localhost:27017/inventory
   ```
   - Make sure MongoDB is running locally

---

### Issue 5: "Permission denied" on Mac/Linux startup script

**Solution:**
```bash
# Make script executable
chmod +x start.sh

# Run it
./start.sh
```

---

### Issue 6: Startup script doesn't work

**Manual Alternative:**

Open 2 terminal windows:

**Terminal 1 (Backend):**
```bash
cd server
npm install  # if needed
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm install  # if needed
npm run dev
```

---

### Issue 7: "Cannot GET /" when visiting http://localhost:5173

**Solutions:**
1. Make sure client terminal shows "Local: http://localhost:5173"
2. Wait 10-15 seconds for client to fully compile
3. Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
4. Clear browser cache

---

### Issue 8: API calls return 404 or connection refused

**Checklist:**
1. ✅ Backend server is running (check terminal output)
2. ✅ `.env` file in client has correct `VITE_BASE_URL=http://localhost:5000`
3. ✅ Backend is running on port 5000
4. ✅ Reload frontend after backend is running

See if you see this in backend terminal:
```
Server running on port 5000
Connected to MongoDB
```

---

### Issue 9: Login doesn't work with provided credentials

**Try these:**
1. Clear browser cache and cookies
2. Make sure backend is running
3. Check MongoDB is connected
4. Try creating a new account instead

---

### Issue 10: "EADDRINUSE: address already in use" error

**Windows:**
```bash
# Find and kill process
for /f "tokens=5" %a in ('netstat -ano ^| findstr ":5000"') do taskkill /PID %a /F
```

**Mac/Linux:**
```bash
# For port 5000
kill -9 $(lsof -t -i:5000)

# For port 5173
kill -9 $(lsof -t -i:5173)
```

---

## 🚨 Advanced Troubleshooting

### Enable Debug Mode

**Backend:**
```bash
cd server
DEBUG=* npm run dev
```

**Frontend:**
```bash
cd client
VITE_DEBUG=true npm run dev
```

### Check Network Connectivity

```bash
# Verify backend is responding
curl http://localhost:5000/api/v1/health

# Should return something like:
# {"status":"ok"}
```

### Clear All Cache and Reinstall

**Complete Nuclear Option:**
```bash
# Client
cd client
rm -rf node_modules dist package-lock.json
npm cache clean --force
npm install

# Server
cd ../server
rm -rf node_modules dist package-lock.json
npm cache clean --force
npm install
```

---

## 📚 Logs & Debugging

### View Server Logs
```bash
# Keep logs clean
cd server
npm run dev 2>&1 | tee server.log
```

### View Client Logs
```bash
# Check browser console
# Open DevTools: F12 (Windows/Linux) or Cmd+Option+I (Mac)
# Go to Console tab
```

### Access Error Details
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try the action that fails
4. Look for failed requests (red X)
5. Click on the request and see error message

---

## ✨ Performance Tips

1. **Close unnecessary applications** to free up memory
2. **Use SSD** for better compilation speed
3. **Increase Node.js memory** if you get out of memory errors:
   ```bash
   export NODE_OPTIONS=--max-old-space-size=4096
   ```
4. **Use `npm ci`** for faster installation:
   ```bash
   npm ci  # instead of npm install
   ```

---

## 🔄 Restart Everything

When in doubt, restart everything:

```bash
# Stop all services (Ctrl+C in each terminal)

# Clear everything
rm -rf server/node_modules client/node_modules
rm -f server/package-lock.json client/package-lock.json

# Fresh install
cd server
npm install
npm run dev

# New terminal
cd client
npm install
npm run dev
```

---

## 📞 When Nothing Works

1. **Uninstall Node.js** completely
2. **Restart your computer**
3. **Reinstall Node.js** from https://nodejs.org/
4. **Clone the repo fresh** or delete and re-extract
5. **Run startup script again**

---

## 🎯 Still Stuck?

1. Check you can run Node.js programs at all:
   ```bash
   node -e "console.log('Node.js works!')"
   ```

2. Check npm works:
   ```bash
   npm --version
   ```

3. Try in a different directory to rule out path issues

4. Check file permissions:
   ```bash
   # Mac/Linux
   ls -la start.sh
   ```

5. Try updating npm:
   ```bash
   npm install -g npm@latest
   ```

---

## 📝 Useful Commands Reference

```bash
# Node/npm
node --version          # Check Node version
npm --version          # Check npm version
npm cache clean        # Clear npm cache
npm update -g npm      # Update npm

# Git
git status             # Check git status
git log --oneline      # View commit history
git clone <url>        # Clone repository

# Terminal
cd <path>              # Change directory
pwd                    # Print working directory (Mac/Linux)
dir                    # List directory (Windows)
ls                     # List directory (Mac/Linux)
rm -rf <dir>          # Remove directory (careful!)
```

---

## 💡 Pro Tips

1. **Keep two terminals open** for server and client
2. **Use VS Code** - It's amazing and free
3. **Install Thunder Client** or **Postman** - Test APIs easily
4. **Read server logs carefully** - They usually tell you what's wrong
5. **Restart before you panic** - Often fixes weird issues
6. **Update Node.js regularly** - Stay on the latest LTS version

---

**Remember: Most issues are just small configuration problems. Take a deep breath and check the checklist!** 🚀

## Fashion variants and stock migration

Existing products without variants need a one-time migration before using variant-specific
purchases and sales. It adds variant data and synchronizes total stock without deleting products
or transaction records. Legacy products retain their stock and receive their existing size (or
`One Size`) and existing colour when present (otherwise `Unspecified`). The migration is safe to run again.

Run this in PowerShell from the repository root, with the backend `.env` configured:

```powershell
Set-Location .\server
npm run migrate:product-variants
```

Inventory changes use MongoDB transactions. Use MongoDB Atlas or a local MongoDB replica set;
standalone MongoDB servers do not support transactions.

The fashion category and brand defaults are added per account when the existing management lists
are loaded. Existing names are matched case-insensitively and retained.
