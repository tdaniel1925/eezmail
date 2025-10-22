# Fix Commented Closing Braces
# This fixes cases where `});` got partially commented as `// });`

$files = Get-ChildItem -Path "src" -Include "*.tsx","*.ts" -Recurse | Where-Object { $_.FullName -notlike "*node_modules*" }

$fixed = 0

foreach ($file in $files) {
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        $originalContent = $content
        
        # Fix pattern: line with just `// });` should be `});`
        $content = $content -replace '(?m)^(\s*)// \}\);?\s*$', '$1});'
        
        if ($content -ne $originalContent) {
            [System.IO.File]::WriteAllText($file.FullName, $content)
            $fixed++
            Write-Host "Fixed: $($file.Name)"
        }
    } catch {
        Write-Host "Error processing $($file.Name): $_"
    }
}

Write-Host ""
Write-Host "Fixed $fixed files with commented closing braces"

