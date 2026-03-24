# Gen-Plasma Deployment Instructions

## 🚨 Node.js Installation Required

You need to install Node.js to compile and deploy the smart contract.

### Quick Install Steps:

1. **Download Node.js:**
   - Visit: https://nodejs.org/en/download/
   - Download "Windows Installer (.msi)" - LTS version
   - Run the installer with default settings

2. **Restart your computer** (important for PATH updates)

3. **Verify installation:**
   ```bash
   node --version
   npm --version
   ```

## 📝 Deployment Commands (After Node.js Install)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Compile Contract
```bash
npm run compile
```

### Step 3: Deploy to Plasma
```bash
npm run deploy
```

### Step 4: Copy Contract Address
From the deployment output, copy the contract address that looks like:
```
PlasmaNFT deployed to: 0x1234567890abcdef...
```

### Step 5: Update lib/contract.ts
Replace `PASTE_YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE` with your actual address.

### Step 6: Deploy to Vercel
```bash
# Option 1: Vercel CLI
npm i -g vercel
vercel --prod

# Option 2: GitHub Integration
# Push to GitHub and connect to Vercel dashboard
```

## 🔧 Alternative: Use Online IDE

If you can't install Node.js locally, you can use:

1. **GitHub Codespaces:**
   - Push your code to GitHub
   - Open in Codespaces
   - Run deployment commands there

2. **Replit:**
   - Import your project
   - Run commands in Replit terminal

## 🎯 Environment Variables for Vercel

Add these in your Vercel dashboard:

```
NEXT_PUBLIC_BASE_URL=https://gen-plasma.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=cd17e56538fbaa298a021029d599c493
```

⚠️ **DO NOT** add PRIVATE_KEY to Vercel - it's only needed for contract deployment.

## 🚀 Quick Deployment Checklist

- [ ] Install Node.js
- [ ] Run `npm install`
- [ ] Run `npm run compile`
- [ ] Run `npm run deploy`
- [ ] Copy contract address
- [ ] Update lib/contract.ts
- [ ] Deploy to Vercel
- [ ] Configure domain
- [ ] Activate minting
- [ ] Test live site

## 🆘 Need Help?

If you're still having issues:
1. Try different terminal (Git Bash, CMD, VS Code)
2. Check if Node.js is in your PATH
3. Restart computer after Node.js install
4. Use GitHub Codespaces as alternative
