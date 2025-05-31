Write-Output "Running neu build..."
& neu build

if (Test-Path -Path ".\build.bat") {
    Write-Output "Running build.bat..."
    & .\build.bat
} else {
    Write-Output "Error: build.bat not found."
}
