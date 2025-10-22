# Fix Commented Braces in JSON.stringify
# Fixes cases where closing braces inside JSON.stringify got commented

$files = @(
    "src\components\ai\tabs\assistant\EmailQuickActions.tsx",
    "src\components\email\EmailComposer.tsx",
    "src\app\dashboard\settings\email\imap-setup\page.tsx"
)

$fixed = 0

foreach ($filePath in $files) {
    $fullPath = Join-Path $PWD $filePath
    if (Test-Path $fullPath) {
        try {
            $lines = [System.IO.File]::ReadAllLines($fullPath)
            $modified = $false
            
            for ($i = 0; $i -lt $lines.Count; $i++) {
                # Check if line is `        // }),` or similar
                if ($lines[$i] -match '^\s*// \}\),?\s*$') {
                    # Replace with uncommented version
                    $lines[$i] = $lines[$i] -replace '^\s*// (\}\),?)\s*$', '        $1'
                    $modified = $true
                }
            }
            
            if ($modified) {
                [System.IO.File]::WriteAllLines($fullPath, $lines)
                $fixed++
                Write-Host "Fixed: $filePath"
            }
        } catch {
            Write-Host "Error processing ${filePath}: $_"
        }
    }
}

Write-Host ""
Write-Host "Fixed $fixed files"

