# Quick Migration Journal Update

# Usage: .\quick-journal.ps1

param([string]$Name)

if (-not $Name) {
    $files = Get-ChildItem drizzle\*.sql | Sort-Object LastWriteTime -Descending | Select-Object -First 5
    Write-Host "`nRecent migrations:"
    $i = 1
    $files | ForEach-Object { Write-Host "  [$i] $($_.BaseName)"; $i++ }
    $sel = Read-Host "`nSelect [1-$($files.Count)] or enter name"
    
    if ($sel -match "^\d+$") {
        $Name = $files[[int]$sel - 1].BaseName
    } else {
        $Name = $sel -replace "\.sql$", ""
    }
}

$journal = "drizzle\meta\_journal.json"
$content = Get-Content $journal | ConvertFrom-Json
$lastIdx = ($content.entries | Sort-Object idx -Descending | Select-Object -First 1).idx
$newIdx = $lastIdx + 1
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

$newEntry = @{
    idx = $newIdx
    version = "7"
    when = $timestamp
    tag = $Name
    breakpoints = $true
}

$content.entries += $newEntry
$content | ConvertTo-Json -Depth 10 | Set-Content $journal

Write-Host "`n✅ Added: idx=$newIdx, tag=$Name" -ForegroundColor Green
Write-Host "`nCommit? (y/n): " -NoNewline
if ((Read-Host) -eq "y") {
    git add $journal
    git add "drizzle\$Name.sql" -ErrorAction SilentlyContinue
    git commit -m "chore: update journal for $Name"
    Write-Host "Push? (y/n): " -NoNewline
    if ((Read-Host) -eq "y") {
        git push
        Write-Host "✅ Pushed!" -ForegroundColor Green
    }
}

