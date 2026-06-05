Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $projectRoot "assets\icon-source.png"

if (-not (Test-Path $sourcePath)) {
  throw "Source icon not found: $sourcePath"
}

$sizes = @{
  "mipmap-mdpi"    = 48
  "mipmap-hdpi"    = 72
  "mipmap-xhdpi"   = 96
  "mipmap-xxhdpi"  = 144
  "mipmap-xxxhdpi" = 192
}

$sourceImage = [System.Drawing.Image]::FromFile($sourcePath)
try {
  foreach ($entry in $sizes.GetEnumerator()) {
    $densityDir = Join-Path $projectRoot "android\app\src\main\res\$($entry.Key)"
    if (-not (Test-Path $densityDir)) {
      New-Item -ItemType Directory -Path $densityDir | Out-Null
    }

    foreach ($fileName in @("alongdo_icon.png", "alongdo_icon_round.png")) {
      $targetPath = Join-Path $densityDir $fileName
      $bitmap = New-Object System.Drawing.Bitmap($entry.Value, $entry.Value)
      try {
        $bitmap.SetResolution($sourceImage.HorizontalResolution, $sourceImage.VerticalResolution)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        try {
          $graphics.Clear([System.Drawing.Color]::Transparent)
          $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
          $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
          $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
          $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

          $destRect = New-Object System.Drawing.Rectangle(0, 0, $entry.Value, $entry.Value)
          $srcRect = New-Object System.Drawing.Rectangle(0, 0, $sourceImage.Width, $sourceImage.Height)
          $graphics.DrawImage($sourceImage, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
        } finally {
          $graphics.Dispose()
        }

        $bitmap.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
        Write-Host "Generated $targetPath"
      } finally {
        $bitmap.Dispose()
      }
    }
  }
} finally {
  $sourceImage.Dispose()
}
