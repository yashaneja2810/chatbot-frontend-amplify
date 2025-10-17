# Installation steps
Write-Host "Setting up the development environment..." -ForegroundColor Green

# 1. Remove existing virtual environment if it exists
if (Test-Path ".venv") {
    Write-Host "Removing existing virtual environment..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force .venv
}

# 2. Create new virtual environment
Write-Host "Creating new virtual environment..." -ForegroundColor Yellow
python -m venv .venv

# 3. Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
.\.venv\Scripts\Activate

# 4. Upgrade pip and install wheel
Write-Host "Upgrading pip and installing wheel..." -ForegroundColor Yellow
python -m pip install --upgrade pip
pip install wheel setuptools --upgrade

# 5. Install numpy first (to avoid dependency issues)
Write-Host "Installing numpy..." -ForegroundColor Yellow
pip install numpy==1.24.3

# 6. Install torch (CPU version for lighter installation)
Write-Host "Installing PyTorch..." -ForegroundColor Yellow
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# 7. Install remaining requirements
Write-Host "Installing other requirements..." -ForegroundColor Yellow
pip install -r backend\requirements.txt

# 8. Verify critical packages
Write-Host "Verifying installations..." -ForegroundColor Yellow
python -c "import numpy; import torch; import fastapi; import uvicorn; import supabase; print('All critical packages verified!')"

Write-Host "`nSetup complete!" -ForegroundColor Green
Write-Host "To start the server, run: cd backend && uvicorn app.main:app --reload" -ForegroundColor Cyan