# ============================================================
# Nate Audio - OneDrive Checkpoint Script
# ============================================================
#
# PURPOSE:
# Copies the current local Nate Audio project into OneDrive.
#
# The LOCAL repository is our real development workspace.
# The ONEDRIVE copy is a checkpoint/mirror that Copilot can
# inspect while we work together.
#
# IMPORTANT:
# This script copies FROM local TO OneDrive.
# It does not copy changes back into the local repository.
# ============================================================


# ------------------------------------------------------------
# 1. Define the source and destination folders.
# ------------------------------------------------------------

# This is the Git repository where we actually edit the site.
$Source = "C:\Users\nwn27\Documents\Projects\nateaudio.github.io"

# This is the OneDrive checkpoint that Copilot can inspect.
$Destination = "C:\Users\nwn27\OneDrive\Projects\nateaudio.github.io"


# ------------------------------------------------------------
# 2. Verify that the source repository exists.
# ------------------------------------------------------------

if (-not (Test-Path $Source)) {
    Write-Host ""
    Write-Host "ERROR: Nate Audio source folder was not found:" -ForegroundColor Red
    Write-Host $Source
    exit 1
}


# ------------------------------------------------------------
# 3. Make sure the OneDrive destination exists.
# ------------------------------------------------------------

if (-not (Test-Path $Destination)) {
    Write-Host "Creating OneDrive checkpoint folder..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $Destination -Force | Out-Null
}


# ------------------------------------------------------------
# 4. Copy the repository to OneDrive.
# ------------------------------------------------------------
#
# robocopy is Microsoft's robust directory-copying utility.
#
# /MIR
#   Makes the destination mirror the source. Files removed
#   locally will also be removed from the OneDrive checkpoint.
#
# /XD
#   Excludes directories we do not want in the checkpoint.
#
# We exclude .git because Git history already lives in the
# LOCAL repository and GitHub. Copilot needs the project files,
# not a duplicate Git database.
#
# _site is Jekyll's generated output directory. We care about
# the source code that creates it, so it does not need to be
# checkpointed.
#
# vendor and node_modules contain generated/downloaded
# dependencies rather than project source.
#
# /R:2 and /W:1
#   Keep robocopy from repeatedly retrying a locked file.
#
# /NFL and /NDL
#   Reduce unnecessary file/directory listing noise.
#
# /NP
#   Hides percentage-progress output.
# ------------------------------------------------------------

Write-Host ""
Write-Host "Syncing Nate Audio to OneDrive..." -ForegroundColor Cyan
Write-Host ""

robocopy `
    $Source `
    $Destination `
    /MIR `
    /XD ".git" "_site" "vendor" "node_modules" `
    /R:2 `
    /W:1 `
    /NFL `
    /NDL `
    /NP


# ------------------------------------------------------------
# 5. Interpret robocopy's exit code.
# ------------------------------------------------------------
#
# Robocopy is a little weird:
#
# Exit codes 0-7 generally mean the copy completed successfully.
# Exit codes 8+ indicate an actual failure.
# ------------------------------------------------------------

$RoboCopyExitCode = $LASTEXITCODE

Write-Host ""

if ($RoboCopyExitCode -lt 8) {

    Write-Host "========================================" -ForegroundColor Green
    Write-Host " Nate Audio OneDrive checkpoint complete" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green

    Write-Host ""
    Write-Host "Source:" -ForegroundColor DarkGray
    Write-Host $Source

    Write-Host ""
    Write-Host "Destination:" -ForegroundColor DarkGray
    Write-Host $Destination

    exit 0
}
else {

    Write-Host "========================================" -ForegroundColor Red
    Write-Host " OneDrive checkpoint FAILED" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red

    Write-Host ""
    Write-Host "Robocopy exit code: $RoboCopyExitCode" -ForegroundColor Red

    exit $RoboCopyExitCode
}