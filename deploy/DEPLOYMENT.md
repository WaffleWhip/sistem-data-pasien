# HealthCure - One-Click Deployment

## Ultra Simple Setup

### Step 1: Edit Configuration
```bash
# Edit vm-config.env with your Azure VM details
VM_USERNAME=your_username
VM_PASSWORD=your_password
VM_PUBLIC_IP=your_vm_ip
```

### Step 2: Deploy (One Command)
```bash
# From your local machine
ssh waf@40.81.25.253 'bash -s' < setup.sh
```

When prompted, enter your VM password - that's it!

### What happens:
1. ✅ Installs Docker
2. ✅ Installs Docker Compose
3. ✅ Clones application
4. ✅ Starts all services
5. ✅ Shows access info

### Access Application
After deployment completes:
- Open browser: `http://VM_PUBLIC_IP:3000`
- Email: `admin@healthcure.com`
- Password: `admin123`

## Manual Steps (if needed)

```bash
# 1. SSH to VM
ssh username@vm_ip

# 2. Upload setup script
# (from your local machine)
scp setup.sh username@vm_ip:~/

# 3. Run setup
bash ~/setup.sh

# 4. Done! Application running
```

---

**Status:** Production Ready ✅

