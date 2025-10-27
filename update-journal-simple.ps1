# ============================================================================
# Simple Drizzle Journal Updater
# ============================================================================
# Updates the Drizzle migration journal after a direct SQL migration.
#
# Usage: .\update-journal-simple.ps1
# ============================================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$Tag
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Colors
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }

# Get paths
$projectRoot = $PSScriptRoot
$journalPath = Join-Path $projectRoot "drizzle\meta\_journal.json"
$drizzlePath = Join-Path $projectRoot "drizzle"

Write-Info "`n📝 Drizzle Journal Updater`n"

# If no tag provided, show recent migrations
if (-not $Tag) {
    Write-Info "Recent migration files:"
    $recentFiles = Get-ChildItem -Path $drizzlePath -Filter "*.sql" | 
                   Sort-Object Name -Descending | 
                   Select-Object -First 5
    
    $index = 1
    foreach ($file in $recentFiles) {
        $baseName = $file.BaseName
        Write-Host "  [$index] $baseName"
        $index++
    }
    
    Write-Host ""
    $selection = Read-Host "Select migration [1-5] or type tag"
    
    if ($selection -match '^\d+$') {
        $selNum = [int]$selection
        if ($selNum -ge 1 -and $selNum -le $recentFiles.Count) {
            $Tag = $recentFiles[$selNum - 1].BaseName
        } else {
            Write-Host "Invalid selection"
            exit 1
        }
    } else {
        $Tag = $selection
    }
}

Write-Info "Using tag: $Tag"

# Read journal
if (-not (Test-Path $journalPath)) {
    Write-Host "❌ Journal not found: $journalPath" -ForegroundColor Red
    exit 1
}

$journal = Get-Content $journalPath -Raw | ConvertFrom-Json

# Check if already exists
$existing = $journal.entries | Where-Object { $_.tag -eq $Tag }
if ($existing) {
    Write-Warning "⚠️  Tag '$Tag' already exists (idx: $($existing.idx))"
    $confirm = Read-Host "Update timestamp? (y/n)"
    if ($confirm -ne 'y') {
        Write-Info "Aborted"
        exit 0
    }
    # Remove old entry
    $journal.entries = @($journal.entries | Where-Object { $_.tag -ne $Tag })
}

# Get next index
$maxIdx = -1
foreach ($entry in $journal.entries) {
    if ($entry.idx -gt $maxIdx) {
        $maxIdx = $entry.idx
    }
}
$nextIdx = $maxIdx + 1

# Create new entry
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$newEntry = @{
    idx = $nextIdx
    version = "7"
    when = $timestamp
    tag = $Tag
    breakpoints = $true
}

# Add to journal
$journal.entries += $newEntry

# Save
$jsonOutput = $journal | ConvertTo-Json -Depth 10
Set-Content -Path $journalPath -Value $jsonOutput -Encoding UTF8

Write-Success "`nJournal updated successfully!`n"
Write-Host "  idx: $nextIdx"
Write-Host "  tag: $Tag"
Write-Host "  when: $timestamp"

# Commit?
Write-Host ""
$commit = Read-Host "Commit to git? (y/n)"
if ($commit -eq 'y') {
    git add $journalPath
    
    $migrationFile = Join-Path $drizzlePath "$Tag.sql"
    if (Test-Path $migrationFile) {
        git add $migrationFile
    }
    
    git commit -m "chore: update Drizzle journal for $Tag"
    Write-Success "Committed successfully!"
    
    $push = Read-Host "Push to GitHub? (y/n)"
    if ($push -eq 'y') {
        $branch = git rev-parse --abbrev-ref HEAD
        git push origin $branch
        Write-Success "Pushed to GitHub successfully!"
    }
}

Write-Success "`nDone!`n"

