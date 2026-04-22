$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 8942
$prefix = "http://127.0.0.1:$port/"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)

$contentTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".js" = "application/javascript; charset=utf-8"
  ".css" = "text/css; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".png" = "image/png"
  ".jpg" = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".gif" = "image/gif"
  ".svg" = "image/svg+xml"
  ".ico" = "image/x-icon"
}

function Get-ContentType($path) {
  $extension = [System.IO.Path]::GetExtension($path).ToLowerInvariant()
  if ($contentTypes.ContainsKey($extension)) {
    return $contentTypes[$extension]
  }

  return "application/octet-stream"
}

function Resolve-RequestPath($basePath, $requestPath) {
  $relative = [System.Uri]::UnescapeDataString($requestPath.TrimStart("/"))

  if ([string]::IsNullOrWhiteSpace($relative)) {
    $relative = "index.html"
  }

  $candidate = Join-Path $basePath $relative
  $fullPath = [System.IO.Path]::GetFullPath($candidate)

  if (-not $fullPath.StartsWith($basePath, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Ruta fuera del proyecto."
  }

  if ((Test-Path $fullPath) -and (Get-Item $fullPath).PSIsContainer) {
    $fullPath = Join-Path $fullPath "index.html"
  }

  return $fullPath
}

try {
  $listener.Start()
  Start-Process $prefix
  Write-Host ""
  Write-Host "IPAY offline listo en $prefix"
  Write-Host "Mantén esta ventana abierta mientras uses la app."
  Write-Host "Presiona Ctrl+C para cerrar el servidor."
  Write-Host ""

  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $response = $context.Response

    try {
      $path = Resolve-RequestPath -basePath $root -requestPath $context.Request.Url.AbsolutePath

      if (-not (Test-Path $path) -or (Get-Item $path).PSIsContainer) {
        $response.StatusCode = 404
        $buffer = [System.Text.Encoding]::UTF8.GetBytes("404 - Archivo no encontrado")
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
      } else {
        $bytes = [System.IO.File]::ReadAllBytes($path)
        $response.StatusCode = 200
        $response.ContentType = Get-ContentType $path
        $response.ContentLength64 = $bytes.Length
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
      }
    } catch {
      $response.StatusCode = 500
      $buffer = [System.Text.Encoding]::UTF8.GetBytes("500 - Error interno")
      $response.OutputStream.Write($buffer, 0, $buffer.Length)
    } finally {
      $response.OutputStream.Close()
    }
  }
} finally {
  if ($listener.IsListening) {
    $listener.Stop()
  }
  $listener.Close()
}
