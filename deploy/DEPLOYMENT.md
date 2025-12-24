# HealthCure - Deployment Guide

## Quick Deploy (One Command)

### From Your Local Machine

**Windows PowerShell:**
```powershell
ssh waf@40.81.25.253 'bash -s' < deploy\setup.sh
```

**Linux/Mac/WSL:**
```bash
ssh waf@40.81.25.253 'bash -s' < deploy/setup.sh
```

When prompted, enter your VM password - that's it!

### What Happens:
1. Script uploads to VM
2. Automatically installs Docker
3. Automatically installs Docker Compose
4. Automatically clones application
5. Automatically starts all services
6. Shows access information

## Manual Steps (Alternative)

If one-command doesn't work:

```bash
# 1. From local machine - upload script
scp deploy/setup.sh waf@40.81.25.253:~/

# 2. SSH to VM
ssh waf@40.81.25.253

# 3. Inside VM - run setup
bash setup.sh

# 4. Done!
```

## Access Application

After deployment completes:
- **URL:** `http://VM_PUBLIC_IP:3000`
- **Email:** `admin@healthcure.com`
- **Password:** `admin123`

Replace `VM_PUBLIC_IP` with your actual Azure VM public IP address (40.81.25.253 in this example).

---

**Status:** Production Ready ✅

