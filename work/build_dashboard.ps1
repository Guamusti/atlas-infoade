$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $root 'deploy\index.html'
$templatePath = Join-Path $PSScriptRoot 'dashboard_template.html'
$outputPath = Join-Path $root 'outputs\dashboard_academico_3ero.html'
$deployPath = Join-Path $root 'deploy\index.html'

$source = [IO.File]::ReadAllText($sourcePath, [Text.Encoding]::UTF8)
$match = [regex]::Match($source, 'const SUBJECTS = \[(?s:.*?)\n\];')
if (-not $match.Success) { throw 'No se pudo extraer el bloque SUBJECTS del archivo original.' }

$template = [IO.File]::ReadAllText($templatePath, [Text.Encoding]::UTF8)
$result = $template.Replace('/*__SUBJECTS__*/', $match.Value)
[IO.File]::WriteAllText($outputPath, $result, [Text.UTF8Encoding]::new($false))
[IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($deployPath)) | Out-Null
[IO.File]::WriteAllText($deployPath, $result, [Text.UTF8Encoding]::new($false))
Write-Output $outputPath
