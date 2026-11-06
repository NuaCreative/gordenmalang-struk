$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$toolRoot = Join-Path $env:LOCALAPPDATA 'gm-apk-build'

if (-not $env:JAVA_HOME) {
    $bundledJava = Join-Path $toolRoot 'jdk21\jdk-21.0.13+9'
    if (Test-Path -LiteralPath (Join-Path $bundledJava 'bin\java.exe')) {
        $env:JAVA_HOME = $bundledJava
    }
}

if (-not $env:ANDROID_HOME) {
    $standardSdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
    $taskSdk = Join-Path $toolRoot 'android-sdk'
    if (Test-Path -LiteralPath $standardSdk) {
        $env:ANDROID_HOME = $standardSdk
    } elseif (Test-Path -LiteralPath (Join-Path $taskSdk 'platforms\android-36')) {
        $env:ANDROID_HOME = $taskSdk
    }
}

if ($env:ANDROID_HOME) {
    $env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
    $env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"
}

Push-Location $projectRoot
try {
    npm run android:sync
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    Push-Location (Join-Path $projectRoot 'android')
    try {
        & .\gradlew.bat assembleDebug
        $buildExitCode = $LASTEXITCODE
    } finally {
        Pop-Location
    }

    if ($buildExitCode -ne 0) { exit $buildExitCode }

    $builtApk = Join-Path $projectRoot 'android\app\build\outputs\apk\debug\app-debug.apk'
    $deliveryApk = Join-Path $projectRoot 'Gorden-Malang.apk'
    Copy-Item -LiteralPath $builtApk -Destination $deliveryApk -Force
    Write-Host "Installable APK: $deliveryApk"
} finally {
    Pop-Location
}
