$ErrorActionPreference = 'Stop'
$root = Join-Path $PSScriptRoot 'uah-guides'
[IO.Directory]::CreateDirectory($root) | Out-Null
$codes = @('780007','780009','780011','340014','340011','342003','780023','780020','340003','780010','780014','780017','340018')
$index = (Invoke-WebRequest -Uri 'https://www.uah.es/es/estudios/estudios-oficiales/grados/asignaturas/index.html?codPlan=G782' -UseBasicParsing).Content
foreach ($code in $codes) {
  $m = [regex]::Match($index, 'href="(?<href>[^\"]*/asignatura/[^\"]*' + $code + '/)"')
  if (-not $m.Success) { Write-Warning "Sin página para $code"; continue }
  $url = if ($m.Groups['href'].Value.StartsWith('http')) { $m.Groups['href'].Value } else { 'https://www.uah.es' + $m.Groups['href'].Value }
  $html = (Invoke-WebRequest -Uri $url -UseBasicParsing).Content
  $b = [regex]::Match($html, "openBase64InNewTab\('(?<data>[^']+)'")
  if (-not $b.Success) { Write-Warning "Sin guía para $code"; continue }
  $pdf = Join-Path $root "$code.pdf"
  [IO.File]::WriteAllBytes($pdf, [Convert]::FromBase64String($b.Groups['data'].Value))
  Write-Output "$code $url"
}
