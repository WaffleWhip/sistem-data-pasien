# HealthCure - One-Click Deployment

## Quick Start

### Windows Users
```powershell
# Just run:
.\deploy.ps1
```

### Linux/Mac/WSL Users
```bash
# Just run:
./deploy.sh
```

## What It Does

The script automatically:
1. ✅ Installs all required tools (SSH, sshpass)
2. ✅ Configures the deployment
3. ✅ Deploys to Azure VM
4. ✅ Installs Docker on the VM
5. ✅ Starts all services
6. ✅ Cleans up temporary files

## Prerequisites

- **vm-config.env** file with your Azure VM credentials

That's it! Everything else is automatic.

## Setup vm-config.env

Edit `vm-config.env` with your Azure VM details:

```ini
VM_USERNAME=your_username
VM_PASSWORD=your_password
VM_PUBLIC_IP=your_vm_ip
VM_SSH_PORT=22
ADMIN_EMAIL=admin@healthcure.com
ADMIN_PASSWORD=admin123
```

## Troubleshooting

### Windows: Script won't run
- Allow script execution: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

### Connection refused
- Verify SSH port (22) is open in Azure VM security group
- Check credentials in vm-config.env

### Services not starting
- Wait 60 seconds for initialization
- Check VM has enough resources (2 vCPU, 4GB RAM recommended)

## Support

All deployment is automated. Just run the script and follow the prompts!

---

**Status:** Production Ready ✅
