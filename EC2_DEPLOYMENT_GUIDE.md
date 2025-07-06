# EC2 Deployment Guide - CORS Fix

## Problem
When deploying to EC2, you get CORS errors because:
1. Backend only allows localhost origins
2. Frontend is hardcoded to localhost:8000

## Solution Applied

### 1. Backend CORS Configuration (Fixed)
✅ Updated `.env` file with EC2 CORS origins:
```
ALLOWED_ORIGINS=http://100.29.4.72,http://100.29.4.72:80,http://100.29.4.72:3000,http://100.29.4.72:5173,http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173
```

### 2. Frontend Environment Configuration (Fixed)
✅ Created environment-specific configuration:
- `.env.local` - For local development (localhost:8000)
- `.env.production` - For EC2 deployment (100.29.4.72:8000)

✅ Updated API configuration files to use environment variables

### 3. Easy Deployment

#### Option A: Use the PowerShell script
```powershell
.\deploy-to-ec2.ps1
```

#### Option B: Use the batch file
```batch
build-for-ec2.bat
```

#### Option C: Manual build
```bash
# Copy production config
copy .env.production .env

# Build frontend
npm run build

# Clean up
del .env
```

## Next Steps

1. **Restart your backend** to apply CORS changes:
   ```bash
   # Stop current backend and restart
   python main.py
   ```

2. **Deploy frontend**:
   - Copy `dist` folder contents to your web server
   - Or serve directly: `cd dist && python -m http.server 80`

3. **Test the connection**:
   - Frontend should now connect to `http://100.29.4.72:8000`
   - No more CORS errors!

## Troubleshooting

If you still get CORS errors:
1. Check that backend is running on port 8000
2. Verify `.env` file has correct ALLOWED_ORIGINS
3. Make sure you restarted the backend after changing .env
4. Check browser console for the exact origin being used

## For Different IP Addresses

If your EC2 IP changes, update:
1. `.env` - ALLOWED_ORIGINS
2. `.env.production` - VITE_API_BASE_URL 