# Get the directory containing this script
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# Function to check if we're in the project directory or its subdirectories
function Test-ProjectDirectory {
    $currentPath = Get-Location
    while ($currentPath -ne "") {
        if (Test-Path (Join-Path $currentPath ".venv")) {
            return $true
        }
        $currentPath = Split-Path -Parent $currentPath
    }
    return $false
}

# If we're in the project directory, activate the virtual environment
if (Test-ProjectDirectory) {
    if (Test-Path ".venv\Scripts\Activate.ps1") {
        .\.venv\Scripts\Activate.ps1
    }
    elseif (Test-Path "..\venv\Scripts\Activate.ps1") {
        .\..\venv\Scripts\Activate.ps1
    }
}