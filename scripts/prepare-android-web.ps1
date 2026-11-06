$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$webRoot = Join-Path $projectRoot 'www'

if (Test-Path -LiteralPath $webRoot) {
    $resolvedWebRoot = (Resolve-Path -LiteralPath $webRoot).Path
    $expectedPrefix = $projectRoot.TrimEnd('\') + '\'
    if (-not $resolvedWebRoot.StartsWith($expectedPrefix, [System.StringComparison]::OrdinalIgnoreCase) -or
        $resolvedWebRoot -eq $projectRoot) {
        throw "Refusing to replace an unexpected web assets path: $resolvedWebRoot"
    }

    Remove-Item -LiteralPath $resolvedWebRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $webRoot | Out-Null
Copy-Item -LiteralPath (Join-Path $projectRoot 'index.html') -Destination $webRoot
Copy-Item -LiteralPath (Join-Path $projectRoot 'auth.js') -Destination $webRoot
Copy-Item -LiteralPath (Join-Path $projectRoot 'config.js') -Destination $webRoot
Copy-Item -LiteralPath (Join-Path $projectRoot 'css') -Destination $webRoot -Recurse
Copy-Item -LiteralPath (Join-Path $projectRoot 'image') -Destination $webRoot -Recurse
Copy-Item -LiteralPath (Join-Path $projectRoot 'js') -Destination $webRoot -Recurse

Write-Host "Android web assets prepared in $webRoot"
