# Remove All Non-Error Toast Notifications

$files = Get-ChildItem -Path "src" -Filter "*.tsx" -Recurse | Where-Object { $_.FullName -notlike "*node_modules*" -and $_.FullName -notlike "*.backup*" }

$successCount = 0
$infoCount = 0
$loadingCount = 0
$warningCount = 0
$filesModified = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    $modified = $false
    
    if ($content -match 'toast\.success') {
        $content = $content -replace '(\s*)toast\.success\(', '$1// toast.success('
        $successCount += ([regex]::Matches($content, '// toast\.success\(')).Count
        $modified = $true
    }
    
    if ($content -match 'toast\.info') {
        $content = $content -replace '(\s*)toast\.info\(', '$1// toast.info('
        $infoCount += ([regex]::Matches($content, '// toast\.info\(')).Count
        $modified = $true
    }
    
    if ($content -match 'toast\.loading') {
        $content = $content -replace '(\s*)toast\.loading\(', '$1// toast.loading('
        $loadingCount += ([regex]::Matches($content, '// toast\.loading\(')).Count
        $modified = $true
    }
    
    if ($content -match 'toast\.warning\(') {
        $content = $content -replace '(\s*)toast\.warning\(', '$1// toast.warning('
        $warningCount += ([regex]::Matches($content, '// toast\.warning\(')).Count
        $modified = $true
    }
    
    if ($modified -and $content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline -Encoding UTF8
        $filesModified++
        Write-Host "Modified: $($file.Name)"
    }
}

Write-Host ""
Write-Host "Toast Removal Complete"
Write-Host ""
Write-Host "Files modified: $filesModified"
Write-Host "toast.success commented: $successCount"
Write-Host "toast.info commented: $infoCount"
Write-Host "toast.loading commented: $loadingCount"
Write-Host "toast.warning commented: $warningCount"
Write-Host "Total removed: $($successCount + $infoCount + $loadingCount + $warningCount)"
Write-Host ""
