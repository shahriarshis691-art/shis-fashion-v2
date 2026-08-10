$url1 = "https://www.shisfashion.com/assets/index-Cp4Yb1im.js"
$url2 = "https://shis-fashion-2.vercel.app/assets/index-IIYV4HIa.js"

Write-Host "Downloading $url1..."
$b1 = (Invoke-WebRequest -UseBasicParsing -Uri $url1).Content
Write-Host "Downloading $url2..."
$b2 = (Invoke-WebRequest -UseBasicParsing -Uri $url2).Content

$searchStrings = @(
    "meta-pixel-sdk",
    "__shisMetaPixelInitializedIds",
    'script[src*="connect.facebook.net/en_US/fbevents.js"]',
    "connect.facebook.net/en_US/fbevents.js",
    "VITE_META_PIXEL_ID"
)

Write-Host "--- Bundle 1 ($url1) ---"
foreach ($s in $searchStrings) {
    $has = $b1.Contains($s)
    Write-Host "$s : $has"
}

# Snippet search for bundle 1
$idx1 = $b1.IndexOf("connect.facebook.net/en_US/fbevents.js")
if ($idx1 -ge 0) {
    $start = [Math]::Max(0, $idx1 - 100)
    $len = [Math]::Min($b1.Length - $start, 250)
    Write-Host "Snippet Bundle 1:"
    Write-Host $b1.Substring($start, $len)
} else {
    Write-Host "Snippet Bundle 1: Not found"
}

Write-Host "`n--- Bundle 2 ($url2) ---"
foreach ($s in $searchStrings) {
    $has = $b2.Contains($s)
    Write-Host "$s : $has"
}

# Snippet search for bundle 2
$idx2 = $b2.IndexOf("connect.facebook.net/en_US/fbevents.js")
if ($idx2 -ge 0) {
    $start = [Math]::Max(0, $idx2 - 100)
    $len = [Math]::Min($b2.Length - $start, 250)
    Write-Host "Snippet Bundle 2:"
    Write-Host $b2.Substring($start, $len)
} else {
    Write-Host "Snippet Bundle 2: Not found"
}
