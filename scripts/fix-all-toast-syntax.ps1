# Comprehensive Fix for All Toast Comment Issues
# Fixes all orphaned closing braces and parentheses from commented toasts

$files = Get-ChildItem -Path "src" -Include "*.tsx","*.ts" -Recurse | Where-Object { $_.FullName -notlike "*node_modules*" }

$patterns = @(
    # Pattern 1: Orphaned }); after commented toast with options
    @{
        Pattern = '(?m)(//\s*toast\.(success|info|loading|warning)\([^\r\n]+\{[^\r\n]*\r?\n)((?:\s*//[^\r\n]*\r?\n)+)(\s*}\);)'
        Replacement = '$1$2$3        // });'
    },
    # Pattern 2: Orphaned }); at start of line after commented lines
    @{
        Pattern = '(?m)(//\s*duration:\s*\d+,?\r?\n)(\s*}\);)'
        Replacement = '$1        // });'
    },
    # Pattern 3: Orphaned } after multi-line commented toast
    @{
        Pattern = '(?m)(//\s*id:\s*[^\r\n]+\r?\n)(\s*}\)'  
        Replacement = '$1        // }'
    },
    # Pattern 4: Fix toast.error with commented id
    @{
        Pattern = '(?m)(toast\.error\([^\{]+\{\r?\n\s*)//\s*(id:[^\r\n]+\r?\n\s*}\);)'
        Replacement = '$1$2'
    }
)

$fixed = 0
$totalChanges = 0

foreach ($file in $files) {
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        $originalContent = $content
        $fileChanged = $false
        
        # Apply each pattern
        foreach ($pattern in $patterns) {
            $newContent = $content -replace $pattern.Pattern, $pattern.Replacement
            if ($newContent -ne $content) {
                $content = $newContent
                $fileChanged = $true
                $totalChanges++
            }
        }
        
        # Manual fixes for specific known issues
        # Fix: orphaned }); after fully commented toast
        $content = $content -replace '(?m)^(\s*)//\s*toast\.success\([^\)]+\), \{[^\r\n]*\r?\n(\s*//[^\r\n]*\r?\n)*\s*}\);', '$1// toast.success(...); // [commented]'
        
        # Fix: orphaned closing for toast.success with multiline params
        $content = $content -replace '(?m)(//\s*toast\.(success|info|warning|loading)\([^\r\n]+\{[^\r\n]*\r?\n\s*//[^\r\n]+\r?\n\s*//[^\r\n]+\r?\n)\s*}\);', '$1        // });'
        
        if ($content -ne $originalContent) {
            [System.IO.File]::WriteAllText($file.FullName, $content)
            $fixed++
            Write-Host "Fixed: $($file.Name)"
        }
    } catch {
        Write-Host "Error processing $($file.Name): $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Fixed $fixed files with $totalChanges pattern matches" -ForegroundColor Green

