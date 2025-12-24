# GitHub Actions Setup - Azure Deployment

Untuk mengaktifkan otomatis build & deploy ke Azure, ikuti langkah ini:

## Step 1: Generate Azure Service Principal

Di Azure Cloud Shell:

```bash
az ad sp create-for-rbac --name "healthcure-deploy" --role contributor --scopes /subscriptions/c2e3c72b-2414-4b5e-be50-f2b87dd4061d
```

Copy output JSON-nya.

## Step 2: Add GitHub Secrets

1. Buka GitHub repo: https://github.com/WaffleWhip/sistem-data-pasien
2. Settings → Secrets and variables → Actions
3. Tambah 2 secrets:

### Secret 1: AZURE_CREDENTIALS
- Name: `AZURE_CREDENTIALS`
- Value: (paste output JSON dari step 1)

### Secret 2: ACR Credentials
- Name: `ACR_USERNAME`
- Value: (dari `az acr credential show --name healthcure6546788 --query username -o tsv`)

- Name: `ACR_PASSWORD`
- Value: (dari `az acr credential show --name healthcure6546788 --query 'passwords[0].value' -o tsv`)

## Step 3: Trigger Deployment

Push code ke GitHub:

```bash
git push origin main
```

GitHub Actions akan otomatis:
1. Build Docker images
2. Push ke ACR
3. Deploy ke Container Apps

Monitor di: GitHub → Actions tab

## Done!

Aplikasi live di Azure secara otomatis setiap kali ada push!

Frontend URL: https://healthcure-frontend.azurewebsites.net

Admin:
- Email: admin@healthcure.com
- Password: admin123
