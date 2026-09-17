# Hub klasowy - lokalny serwer (Windows PowerShell 5.1+, nic nie trzeba instalowac).
# Serwuje folder "aplikacja", pliki z folderu "relaks" (lista: /relaks/lista.json)
# i zapisuje dane klas w folderze "dane" (API: /api/dane/, zdjecia galerii: /api/galeria/<klasa>/),
# z codzienna kopia w dane\kopie (usuwana po 30 dniach).
# Dziala tylko na tym komputerze (http://localhost:8080).

param([int]$Port = 8080)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$appDir = Join-Path $root 'aplikacja'
$relaxDir = Join-Path $root 'relaks'
$dataDir = Join-Path $root 'dane'
$keepBackupDays = 30

[void][System.IO.Directory]::CreateDirectory((Join-Path $dataDir 'kopie'))
# Usuwa codzienne kopie starsze niz $keepBackupDays dni.
Get-ChildItem -LiteralPath (Join-Path $dataDir 'kopie') -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    $day = [datetime]::MinValue
    if ([datetime]::TryParseExact($_.Name, 'yyyy-MM-dd', $null, 'None', [ref]$day) -and $day -lt (Get-Date).AddDays(-$keepBackupDays)) {
        Remove-Item -LiteralPath $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
    }
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
try {
    $listener.Start()
} catch {
    Write-Host "Nie mozna uruchomic serwera na porcie $Port (moze juz dziala)."
    exit 1
}
Write-Host "Hub klasowy dziala: http://localhost:$Port/  (zamknij to okno, aby zatrzymac)"

$handler = {
    param($context, $appDir, $relaxDir, $dataDir)

    $mimeTypes = @{
        '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.css' = 'text/css; charset=utf-8'
        '.json' = 'application/json; charset=utf-8'; '.svg' = 'image/svg+xml'; '.ico' = 'image/x-icon'
        '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'; '.webp' = 'image/webp'; '.avif' = 'image/avif'; '.gif' = 'image/gif'
        '.woff' = 'font/woff'; '.woff2' = 'font/woff2'
        '.mp3' = 'audio/mpeg'; '.m4a' = 'audio/mp4'; '.aac' = 'audio/aac'; '.ogg' = 'audio/ogg'; '.oga' = 'audio/ogg'; '.opus' = 'audio/ogg'
        '.wav' = 'audio/wav'; '.flac' = 'audio/flac'
    }
    $relaxFolders = @{
        'obrazy' = @('.jpg', '.jpeg', '.png', '.webp', '.avif')
        'muzyka' = @('.mp3', '.m4a', '.aac', '.ogg', '.oga', '.opus', '.wav', '.flac')
        'natura' = @('.mp3', '.m4a', '.aac', '.ogg', '.oga', '.opus', '.wav', '.flac')
    }

    $request = $context.Request
    $response = $context.Response

    function Send-Text([int]$status, [string]$contentType, [string]$text) {
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($text)
        $response.StatusCode = $status
        $response.ContentType = $contentType
        $response.AddHeader('Cache-Control', 'no-store')
        $response.ContentLength64 = $bytes.Length
        if ($request.HttpMethod -ne 'HEAD') { $response.OutputStream.Write($bytes, 0, $bytes.Length) }
    }

    function ConvertTo-JsonString([string]$value) {
        $escaped = $value.Replace('\', '\\').Replace('"', '\"').Replace("`r", '\r').Replace("`n", '\n').Replace("`t", '\t')
        return '"' + $escaped + '"'
    }

    # Zwraca pelna sciezke tylko wtedy, gdy plik lezy wewnatrz folderu $baseDir.
    function Resolve-SafePath([string]$baseDir, [string]$relative) {
        $separator = [System.IO.Path]::DirectorySeparatorChar
        $base = [System.IO.Path]::GetFullPath($baseDir).TrimEnd($separator) + $separator
        $full = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($baseDir, $relative.Replace('/', $separator)))
        if ($full.StartsWith($base, [System.StringComparison]::OrdinalIgnoreCase) -and (Test-Path -LiteralPath $full -PathType Leaf)) { return $full }
        return $null
    }

    function Send-File([string]$file, [bool]$cacheForever) {
        $extension = [System.IO.Path]::GetExtension($file).ToLowerInvariant()
        $contentType = $mimeTypes[$extension]
        if (-not $contentType) { $contentType = 'application/octet-stream' }
        $length = (Get-Item -LiteralPath $file).Length
        $start = [int64]0
        $end = [int64]($length - 1)

        $range = $request.Headers['Range']
        if ($range -and $range -match '^bytes=(\d*)-(\d*)$') {
            if ($Matches[1] -ne '') {
                $start = [int64]$Matches[1]
                if ($Matches[2] -ne '') { $end = [Math]::Min([int64]$Matches[2], $length - 1) }
            } elseif ($Matches[2] -ne '') {
                $start = [Math]::Max([int64]0, $length - [int64]$Matches[2])
            }
            if ($start -gt $end -or $start -ge $length) {
                $response.StatusCode = 416
                $response.AddHeader('Content-Range', "bytes */$length")
                return
            }
            $response.StatusCode = 206
            $response.AddHeader('Content-Range', "bytes $start-$end/$length")
        }

        $response.ContentType = $contentType
        $response.AddHeader('Accept-Ranges', 'bytes')
        if ($cacheForever) { $response.AddHeader('Cache-Control', 'public, max-age=31536000, immutable') }
        else { $response.AddHeader('Cache-Control', 'no-cache') }
        $response.ContentLength64 = $end - $start + 1
        if ($request.HttpMethod -eq 'HEAD') { return }

        $stream = [System.IO.File]::Open($file, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
        try {
            [void]$stream.Seek($start, [System.IO.SeekOrigin]::Begin)
            $buffer = New-Object byte[] 65536
            $remaining = $end - $start + 1
            while ($remaining -gt 0) {
                $read = $stream.Read($buffer, 0, [int][Math]::Min([int64]$buffer.Length, $remaining))
                if ($read -le 0) { break }
                $response.OutputStream.Write($buffer, 0, $read)
                $remaining -= $read
            }
        } finally {
            $stream.Dispose()
        }
    }

    $imagePattern = '^(?!\.)[^\\/:*?"<>|]+\.(jpe?g|png|webp)$'

    function Remove-OldSnapshots {
        Get-ChildItem -LiteralPath (Join-Path $dataDir 'kopie') -Directory -ErrorAction SilentlyContinue | ForEach-Object {
            $day = [datetime]::MinValue
            if ([datetime]::TryParseExact($_.Name, 'yyyy-MM-dd', $null, 'None', [ref]$day) -and $day -lt (Get-Date).AddDays(-30)) {
                Remove-Item -LiteralPath $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
            }
        }
    }

    # Przed pierwsza zmiana pliku danego dnia odklada jego kopie do dane\kopie\RRRR-MM-DD.
    function Save-DailySnapshot([string]$name) {
        $source = Join-Path $dataDir $name
        if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { return }
        $dayDir = Join-Path (Join-Path $dataDir 'kopie') (Get-Date -Format 'yyyy-MM-dd')
        $target = Join-Path $dayDir $name
        if (Test-Path -LiteralPath $target) { return }
        $newDay = -not (Test-Path -LiteralPath $dayDir)
        [void][System.IO.Directory]::CreateDirectory($dayDir)
        Copy-Item -LiteralPath $source -Destination $target -Force
        if ($newDay) { Remove-OldSnapshots }
    }

    # Usuwane zdjecia i galerie klas trafiaja do dane\kopie\RRRR-MM-DD\galeria (nie nadpisujemy tego, co juz tam jest).
    function Move-ToSnapshot([string]$path, [string]$relative) {
        $target = Join-Path (Join-Path (Join-Path (Join-Path $dataDir 'kopie') (Get-Date -Format 'yyyy-MM-dd')) 'galeria') $relative
        if (Test-Path -LiteralPath $target) {
            $extension = [System.IO.Path]::GetExtension($target)
            $target = $target.Substring(0, $target.Length - $extension.Length) + '-' + [DateTimeOffset]::Now.ToUnixTimeMilliseconds() + $extension
        }
        [void][System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($target))
        Move-Item -LiteralPath $path -Destination $target -Force
    }

    function Invoke-GalleryRequest([string]$rest) {
        $parts = @($rest.Split('/') | Where-Object { $_ -ne '' })
        $classId = ''
        $name = ''
        if ($parts.Count -ge 1) { $classId = $parts[0] }
        if ($parts.Count -ge 2) { $name = $parts[1] }
        if ($classId -notmatch '^[A-Za-z0-9_-]+$' -or $parts.Count -gt 2 -or ($name -ne '' -and $name -notmatch $imagePattern)) {
            Send-Text 400 'text/plain; charset=utf-8' 'Zla sciezka.'
            return
        }
        $dir = Join-Path (Join-Path $dataDir 'galeria') $classId

        if ($name -eq '') {
            if ($request.HttpMethod -eq 'DELETE') {
                if (Test-Path -LiteralPath $dir) { Move-ToSnapshot $dir $classId }
                $response.StatusCode = 204
                return
            }
            [void][System.IO.Directory]::CreateDirectory($dir)
            $items = @(Get-ChildItem -LiteralPath $dir -File | Where-Object { $_.Name -match $imagePattern } | ForEach-Object {
                '{"name":' + (ConvertTo-JsonString $_.Name) + ',"size":' + $_.Length + ',"modified":' + (ConvertTo-JsonString $_.LastWriteTimeUtc.ToString('o')) + '}'
            })
            Send-Text 200 'application/json; charset=utf-8' ('{"files":[' + ($items -join ',') + ']}')
            return
        }

        $file = Join-Path $dir $name
        switch ($request.HttpMethod) {
            'GET' {
                if (Test-Path -LiteralPath $file -PathType Leaf) { Send-File $file $false }
                else { Send-Text 404 'text/plain; charset=utf-8' 'Brak zdjecia.' }
            }
            'PUT' {
                [void][System.IO.Directory]::CreateDirectory($dir)
                $temp = "$file.$([guid]::NewGuid().ToString('N')).tmp"
                try {
                    $output = [System.IO.File]::Create($temp)
                    try { $request.InputStream.CopyTo($output) } finally { $output.Dispose() }
                    if (Test-Path -LiteralPath $file -PathType Leaf) { [System.IO.File]::Replace($temp, $file, [NullString]::Value) }
                    else { [System.IO.File]::Move($temp, $file) }
                } finally {
                    if (Test-Path -LiteralPath $temp) { Remove-Item -LiteralPath $temp -Force -ErrorAction SilentlyContinue }
                }
                $response.StatusCode = 204
            }
            'DELETE' {
                if (Test-Path -LiteralPath $file -PathType Leaf) { Move-ToSnapshot $file (Join-Path $classId $name) }
                $response.StatusCode = 204
            }
            default { Send-Text 405 'text/plain; charset=utf-8' 'Nieobslugiwana metoda.' }
        }
    }

    function Invoke-DataRequest([string]$name) {
        if ($name -eq '') {
            Send-Text 200 'application/json; charset=utf-8' ('{"ok":true,"folder":' + (ConvertTo-JsonString $dataDir) + '}')
            return
        }
        if ($name -notmatch '^[A-Za-z0-9_.-]+\.json$') { Send-Text 400 'text/plain; charset=utf-8' 'Zla nazwa pliku.'; return }
        $file = Join-Path $dataDir $name

        switch ($request.HttpMethod) {
            'GET' {
                if (Test-Path -LiteralPath $file -PathType Leaf) {
                    $bytes = [System.IO.File]::ReadAllBytes($file)
                    $response.ContentType = 'application/json; charset=utf-8'
                    $response.AddHeader('Cache-Control', 'no-store')
                    $response.ContentLength64 = $bytes.Length
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                } else {
                    Send-Text 404 'text/plain; charset=utf-8' 'Brak pliku.'
                }
            }
            'PUT' {
                $temp = "$file.$([guid]::NewGuid().ToString('N')).tmp"
                $output = [System.IO.File]::Create($temp)
                try { $request.InputStream.CopyTo($output) } finally { $output.Dispose() }
                # Szybkie sprawdzenie, czy to JSON (pelne parsowanie duzych plikow ze zdjeciami trwaloby za dlugo).
                $reader = [System.IO.StreamReader]::new($temp)
                try { $firstChar = [char]$reader.Read() } finally { $reader.Dispose() }
                if ($firstChar -ne '{' -and $firstChar -ne '[') {
                    Remove-Item -LiteralPath $temp -Force
                    Send-Text 400 'text/plain; charset=utf-8' 'To nie jest JSON.'
                    return
                }
                try {
                    Save-DailySnapshot $name
                    # [NullString]::Value - bez tego PowerShell przekazalby pusty napis zamiast null (brak pliku kopii).
                    if (Test-Path -LiteralPath $file -PathType Leaf) { [System.IO.File]::Replace($temp, $file, [NullString]::Value) }
                    else { [System.IO.File]::Move($temp, $file) }
                } finally {
                    if (Test-Path -LiteralPath $temp) { Remove-Item -LiteralPath $temp -Force -ErrorAction SilentlyContinue }
                }
                $response.StatusCode = 204
            }
            'DELETE' {
                Save-DailySnapshot $name
                if (Test-Path -LiteralPath $file -PathType Leaf) { Remove-Item -LiteralPath $file -Force }
                $response.StatusCode = 204
            }
            default { Send-Text 405 'text/plain; charset=utf-8' 'Nieobslugiwana metoda.' }
        }
    }

    try {
        $path = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath)

        if ($path -eq '/api/dane' -or $path.StartsWith('/api/dane/')) {
            Invoke-DataRequest ($path -replace '^/api/dane/?', '')
        } elseif ($path.StartsWith('/api/galeria/')) {
            Invoke-GalleryRequest $path.Substring('/api/galeria/'.Length)
        } elseif ($path -eq '/relaks/lista.json') {
            $parts = @()
            foreach ($folder in @('obrazy', 'muzyka', 'natura')) {
                $dir = Join-Path $relaxDir $folder
                $names = @()
                if (Test-Path -LiteralPath $dir) {
                    $names = @(Get-ChildItem -LiteralPath $dir -File | Where-Object { $relaxFolders[$folder] -contains $_.Extension.ToLowerInvariant() } | ForEach-Object { ConvertTo-JsonString $_.Name })
                }
                $parts += ('"' + $folder + '":[' + ($names -join ',') + ']')
            }
            Send-Text 200 'application/json; charset=utf-8' ('{' + ($parts -join ',') + '}')
        } elseif ($path.StartsWith('/relaks/')) {
            $file = Resolve-SafePath $relaxDir $path.Substring(8)
            if ($file) { Send-File $file $false } else { Send-Text 404 'text/plain; charset=utf-8' 'Nie znaleziono pliku.' }
        } else {
            $relative = $path.TrimStart('/')
            if ($relative -eq '') { $relative = 'index.html' }
            $file = Resolve-SafePath $appDir $relative
            if (-not $file -and -not [System.IO.Path]::HasExtension($relative)) { $file = Join-Path $appDir 'index.html' }
            if ($file) { Send-File $file $relative.StartsWith('assets/') } else { Send-Text 404 'text/plain; charset=utf-8' 'Nie znaleziono pliku.' }
        }
    } catch {
        # Przegladarka czesto przerywa pobieranie muzyki w polowie (przewijanie) - to nie jest blad.
        try { $response.StatusCode = 500 } catch { }
    } finally {
        try { $response.OutputStream.Close() } catch { }
    }
}

$pool = [System.Management.Automation.Runspaces.RunspaceFactory]::CreateRunspacePool(1, 8)
$pool.Open()
$jobs = New-Object System.Collections.ArrayList

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $shell = [System.Management.Automation.PowerShell]::Create()
        $shell.RunspacePool = $pool
        [void]$shell.AddScript($handler).AddArgument($context).AddArgument($appDir).AddArgument($relaxDir).AddArgument($dataDir)
        [void]$jobs.Add(@{ Shell = $shell; Handle = $shell.BeginInvoke() })

        foreach ($job in @($jobs)) {
            if ($job.Handle.IsCompleted) {
                try { [void]$job.Shell.EndInvoke($job.Handle) } catch { }
                $job.Shell.Dispose()
                $jobs.Remove($job)
            }
        }
    }
} finally {
    $listener.Stop()
    $pool.Close()
}
