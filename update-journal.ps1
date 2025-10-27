# ============================================================================
# Update Drizzle Journal Script
# ============================================================================
# This script updates the Drizzle migration journal after running a direct
# SQL migration in Supabase.
#
# Usage:
#   .\update-journal.ps1 -MigrationFile "0010_add_feature.sql"
#   .\update-journal.ps1 -MigrationName "0010_add_feature"
# ============================================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$MigrationFile,
    
    [Parameter(Mandatory=$false)]
    [string]$MigrationName
)

# Set strict mode
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Colors for output
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error-Custom { Write-Host $args -ForegroundColor Red }

# Get project root
$projectRoot = $PSScriptRoot
$journalPath = Join-Path $projectRoot "drizzle\meta\_journal.json"
$drizzlePath = Join-Path $projectRoot "drizzle"

Write-Info "`n📝 Drizzle Journal Updater`n"

# Step 1: Determine migration name
if ($MigrationFile) {
    if ($MigrationFile -match "(\d{4}_[\w_]+)\.sql") {
        $MigrationName = $matches[1]
    } else {
        Write-Error-Custom "❌ Invalid migration file format. Expected format: 0010_migration_name.sql"
        exit 1
    }
} elseif (-not $MigrationName) {
    # List recent .sql files in drizzle folder
    Write-Info "Recent migration files in drizzle folder:"
    $recentFiles = Get-ChildItem -Path $drizzlePath -Filter "*.sql" | 
                   Sort-Object LastWriteTime -Descending | 
                   Select-Object -First 5
    
    $index = 1
    $recentFiles | ForEach-Object {
        Write-Host "  [$index] $($_.Name) (modified: $($_.LastWriteTime.ToString('yyyy-MM-dd HH:mm')))"
        $index++
    }
    
    Write-Host ""
    $selection = Read-Host "Select a migration file [1-$($recentFiles.Count)] or enter migration name"
    
    if ($selection -match "^\d+$" -and [int]$selection -le $recentFiles.Count -and [int]$selection -gt 0) {
        $selectedFile = $recentFiles[[int]$selection - 1]
        if ($selectedFile.BaseName -match "(\d{4}_[\w_]+)") {
            $MigrationName = $matches[1]
        }
    } else {
        $MigrationName = $selection -replace "\.sql$", ""
    }
}

# Validate migration name format
if ($MigrationName -notmatch "^\d{4}_[\w_]+$") {
    Write-Error-Custom "❌ Invalid migration name format. Expected format: 0010_migration_name"
    Write-Info "Example: 0010_add_notification_system"
    exit 1
}

Write-Info "Selected migration: $MigrationName"

# Step 2: Check if migration file exists
$migrationFilePath = Join-Path $drizzlePath "$MigrationName.sql"
if (-not (Test-Path $migrationFilePath)) {
    Write-Warning "⚠️  Migration file not found: $migrationFilePath"
    $create = Read-Host "Continue anyway? (y/n)"
    if ($create -ne "y") {
        Write-Info "Aborted."
        exit 0
    }
}

# Step 3: Read current journal
if (-not (Test-Path $journalPath)) {
    Write-Error-Custom "❌ Journal file not found: $journalPath"
    exit 1
}

Write-Info "Reading journal file..."
$journalContent = Get-Content $journalPath -Raw | ConvertFrom-Json

# Step 4: Check if migration already exists
$existingEntry = $journalContent.entries | Where-Object { $_.tag -eq $MigrationName }
if ($existingEntry) {
    Write-Warning "⚠️  Migration '$MigrationName' already exists in journal!"
    Write-Host "   idx: $($existingEntry.idx)"
    Write-Host "   when: $($existingEntry.when)"
    $overwrite = Read-Host "Overwrite? (y/n)"
    if ($overwrite -ne "y") {
        Write-Info "Aborted."
        exit 0
    }
    # Remove existing entry
    $journalContent.entries = $journalContent.entries | Where-Object { $_.tag -ne $MigrationName }
}

# Step 5: Get next index
$lastEntry = $journalContent.entries | Sort-Object idx -Descending | Select-Object -First 1
$nextIdx = if ($lastEntry) { $lastEntry.idx + 1 } else { 0 }

# Step 6: Get current timestamp in milliseconds
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

# Step 7: Create new entry
$newEntry = [PSCustomObject]@{
    idx = $nextIdx
    version = "7"
    when = $timestamp
    tag = $MigrationName
    breakpoints = $true
}

# Step 8: Add to journal
$journalContent.entries += $newEntry

# Step 9: Save updated journal
Write-Info "Updating journal file..."
$journalJson = $journalContent | ConvertTo-Json -Depth 10
Set-Content -Path $journalPath -Value $journalJson -Encoding UTF8

Write-Success "`n✅ Journal updated successfully!`n"
Write-Host "Added entry:"
Write-Host "  idx: $nextIdx"
Write-Host "  version: 7"
Write-Host "  when: $timestamp"
Write-Host "  tag: $MigrationName"
Write-Host "  breakpoints: true"

# Step 10: Ask if user wants to commit
Write-Host ""
$commit = Read-Host "Commit changes to git? (y/n)"

if ($commit -eq "y") {
    Write-Info "`nStaging files..."
    git add $journalPath
    
    if (Test-Path $migrationFilePath) {
        git add $migrationFilePath
    }
    
    $commitMsg = "chore: update Drizzle journal for $MigrationName migration"
    
    Write-Info "Committing..."
    git commit -m $commitMsg
    
    Write-Success "✅ Committed!"
    
    $push = Read-Host "Push to GitHub? (y/n)"
    if ($push -eq "y") {
        $branch = git rev-parse --abbrev-ref HEAD
        Write-Info "Pushing to $branch..."
        git push origin $branch
        Write-Success "✅ Pushed to GitHub!"
    }
}

Write-Info "`n📋 Next steps:"
Write-Host "  1. Verify the journal entry is correct"
Write-Host "  2. Test the Vercel deployment"
Write-Host "  3. Check that the migration doesn't run again"
Write-Success "`nDone! 🎉`n"

