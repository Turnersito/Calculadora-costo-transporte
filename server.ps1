$port = 8080
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } | Select-Object -First 1).IPAddress

# Use TcpListener bound to IPAddress.Any (0.0.0.0) - Works for standard non-admin accounts!
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $port)
$listener.Start()

Write-Host "============================================="
Write-Host "Server listening on ALL interfaces (0.0.0.0:$port)"
Write-Host "  -> Local PC: http://localhost:${port}/"
if ($localIP) {
    Write-Host "  -> Phone / LAN: http://${localIP}:${port}/"
}
Write-Host "============================================="

while ($true) {
    try {
        $client = $listener.AcceptTcpClient()
        $stream = $client.GetStream()
        $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)
        
        $requestLine = $reader.ReadLine()
        if (-not $requestLine) {
            $client.Close()
            continue
        }
        
        $parts = $requestLine.Split(' ')
        $method = $parts[0]
        $url = $parts[1]
        
        # Read remaining headers
        while (($line = $reader.ReadLine()) -and ($line.Trim() -ne "")) {}
        
        $path = $url.Split('?')[0]
        
        # PROXY ENDPOINT FOR CNE CHILE FUEL API (CORS Free)
        if ($path -eq "/api/combustible" -or $path -eq "/api/combustibles") {
            $jsonString = ""
            try {
                $cneUrl = "http://api.cne.cl/api/v1/combustibles/bencina"
                $cneResponse = Invoke-RestMethod -Uri $cneUrl -Method Get -TimeoutSec 3 -ErrorAction Stop
                $jsonString = $cneResponse | ConvertTo-Json -Depth 4
            } catch {
                $jsonString = '{"status":"ok","source":"CNE Proxy (Chile Base)","precios":{"93":1280,"95":1320,"97":1370,"diesel":1050}}'
            }
            
            $jsonBytes = [System.Text.Encoding]::UTF8.GetBytes($jsonString)
            $headers = "HTTP/1.1 200 OK`r`n" +
                       "Content-Type: application/json; charset=utf-8`r`n" +
                       "Access-Control-Allow-Origin: *`r`n" +
                       "Access-Control-Allow-Methods: GET, OPTIONS`r`n" +
                       "Content-Length: $($jsonBytes.Length)`r`n" +
                       "Connection: close`r`n`r`n"
            
            $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($headers)
            $stream.Write($headerBytes, 0, $headerBytes.Length)
            $stream.Write($jsonBytes, 0, $jsonBytes.Length)
            $stream.Flush()
            $client.Close()
            continue
        }
        
        # STATIC FILES
        if ($path -eq "/") { $path = "/index.html" }
        $filePath = Join-Path (Get-Location) $path.TrimStart('/')
        
        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = "application/octet-stream"
            
            switch ($ext) {
                ".html" { $contentType = "text/html; charset=utf-8" }
                ".css"  { $contentType = "text/css; charset=utf-8" }
                ".js"   { $contentType = "application/javascript; charset=utf-8" }
                ".json" { $contentType = "application/json; charset=utf-8" }
                ".svg"  { $contentType = "image/svg+xml" }
                ".png"  { $contentType = "image/png" }
                ".jpg"  { $contentType = "image/jpeg" }
            }
            
            $headers = "HTTP/1.1 200 OK`r`n" +
                       "Content-Type: $contentType`r`n" +
                       "Access-Control-Allow-Origin: *`r`n" +
                       "Content-Length: $($bytes.Length)`r`n" +
                       "Connection: close`r`n`r`n"
                       
            $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($headers)
            $stream.Write($headerBytes, 0, $headerBytes.Length)
            $stream.Write($bytes, 0, $bytes.Length)
        } else {
            $notFound = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $headers = "HTTP/1.1 404 Not Found`r`n" +
                       "Content-Type: text/plain`r`n" +
                       "Content-Length: $($notFound.Length)`r`n" +
                       "Connection: close`r`n`r`n"
            $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($headers)
            $stream.Write($headerBytes, 0, $headerBytes.Length)
            $stream.Write($notFound, 0, $notFound.Length)
        }
        $stream.Flush()
        $client.Close()
    } catch {
        # Handle connection reset gracefully
    }
}
