param(
    [string]$Owner = "True-Good-Craft",
    [string]$Repo = "TGC-BUS-Core",
    [int]$Limit = 10,
    [string]$OutputPath = "assets/data/releases.json",
    [switch]$ExcludePrerelease
)

$ErrorActionPreference = "Stop"

if ($Limit -lt 1) {
    throw "Limit must be at least 1."
}

$repoSlug = "$Owner/$Repo"
$apiUrl = "https://api.github.com/repos/$repoSlug/releases?per_page=100"
$headers = @{
    "Accept" = "application/vnd.github+json"
    "User-Agent" = "buscore-site-release-sync"
}

$releases = Invoke-RestMethod -Uri $apiUrl -Headers $headers -Method Get

$filtered = $releases | Where-Object {
    -not $_.draft -and (-not $ExcludePrerelease -or -not $_.prerelease)
}

$sorted = $filtered | Sort-Object @(
    @{ Expression = { [datetime]($_.published_at ?? $_.created_at) }; Descending = $true },
    @{ Expression = { $_.tag_name }; Descending = $true }
)

$selected = $sorted | Select-Object -First $Limit

$normalized = foreach ($release in $selected) {
    $publishedAtSource = $release.published_at
    if ([string]::IsNullOrWhiteSpace($publishedAtSource)) {
        $publishedAtSource = $release.created_at
    }

    $publishedAt = ""
    $publishedDate = ""
    if (-not [string]::IsNullOrWhiteSpace($publishedAtSource)) {
        $publishedAtUtc = ([datetime]$publishedAtSource).ToUniversalTime()
        $publishedAt = $publishedAtUtc.ToString("yyyy-MM-ddTHH:mm:ssZ")
        $publishedDate = $publishedAtUtc.ToString("yyyy-MM-dd")
    }

    [ordered]@{
        tag = [string]$release.tag_name
        version = [string]$release.tag_name
        title = if ([string]::IsNullOrWhiteSpace([string]$release.name)) { [string]$release.tag_name } else { [string]$release.name }
        published_at = $publishedAt
        published_date = $publishedDate
        url = [string]$release.html_url
        notes = [string]($release.body ?? "")
    }
}

$payload = [ordered]@{
    source = [ordered]@{
        type = "github-releases"
        repo = $repoSlug
        api_url = $apiUrl
    }
    generated_at_utc = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    release_count = @($normalized).Count
    releases = @($normalized)
}

$outputFullPath = Join-Path $PSScriptRoot "..\$OutputPath"
$outputDir = Split-Path -Path $outputFullPath -Parent
if (-not (Test-Path -LiteralPath $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

$json = $payload | ConvertTo-Json -Depth 10
Set-Content -LiteralPath $outputFullPath -Value $json -Encoding UTF8

Write-Host "Wrote $($payload.release_count) releases to $outputFullPath"
