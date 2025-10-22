# Fix Multi-Line Commented Toast Calls
# This script will find and fix all partially commented toast calls

$files = Get-ChildItem -Path "src" -Include "*.tsx","*.ts" -Recurse | Where-Object { $_.FullName -notlike "*node_modules*" }

$fixed = 0

foreach ($file in $files) {
    try {
        $lines = [System.IO.File]::ReadAllLines($file.FullName)
        $modified = $false
        
        for ($i = 0; $i -lt $lines.Count; $i++) {
            $line = $lines[$i]
            
            # Check if this line starts a commented toast call
            if ($line -match '^\s*// toast\.(success|info|loading|warning)\(') {
                # Check following lines for uncommented closing parts
                $j = $i + 1
                while ($j -lt $lines.Count) {
                    $nextLine = $lines[$j]
                    
                    # If line is not already commented and contains relevant code
                    if ($nextLine -notmatch '^\s*//' -and $nextLine -match '^\s*(id:|duration:|description:|}\)|;|\{)') {
                        # Comment it out
                        $lines[$j] = $nextLine -replace '(^\s*)', '$1// '
                        $modified = $true
                    }
                    
                    # Stop if we hit the closing of the toast call
                    if ($nextLine -match '^\s*(//\s*)?\);' -or $nextLine -match '^\s*(//\s*)?}?\);') {
                        break
                    }
                    
                    $j++
                }
            }
        }
        
        if ($modified) {
            [System.IO.File]::WriteAllLines($file.FullName, $lines)
            $fixed++
            Write-Host "Fixed: $($file.Name)"
        }
    } catch {
        Write-Host "Error processing $($file.Name): $_"
    }
}

Write-Host ""
Write-Host "Fixed $fixed files with partially commented toasts"

