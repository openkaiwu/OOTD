[CmdletBinding()]
param(
    [string]$ResourceRoot = ""
)

$ErrorActionPreference = "Stop"
if ([string]::IsNullOrWhiteSpace($ResourceRoot)) {
    $ResourceRoot = Join-Path $PSScriptRoot "..\res"
}
Add-Type -AssemblyName System.Drawing

$sizes = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}

function New-LauncherBitmap([int]$size) {
    $bitmap = [System.Drawing.Bitmap]::new($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

        # An opaque square field prevents launchers from supplying a second
        # compatibility background around this icon.
        $rect = [System.Drawing.Rectangle]::new(0, 0, $size, $size)
        $base = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
            $rect,
            [System.Drawing.Color]::FromArgb(255, 255, 251, 246),
            [System.Drawing.Color]::FromArgb(255, 232, 225, 255),
            45.0
        )
        $g.FillRectangle($base, $rect)
        $base.Dispose()

        $pink = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(55, 255, 203, 220))
        $lavender = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(64, 202, 187, 255))
        $g.FillEllipse($pink, [System.Drawing.Rectangle]::new([int](-0.22 * $size), [int](-0.16 * $size), [int](0.9 * $size), [int](0.78 * $size)))
        $g.FillEllipse($lavender, [System.Drawing.Rectangle]::new([int](0.35 * $size), [int](0.42 * $size), [int](0.8 * $size), [int](0.72 * $size)))
        $pink.Dispose(); $lavender.Dispose()

        # The mark occupies 54/108dp vertically: smaller than before and wholly
        # inside Android's safe area even after circle/squircle normalisation.
        $scale = $size / 108.0
        $pen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(255, 246, 170, 189), [single](2.45 * $scale))
        $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
        $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
        $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
        function P([double]$x, [double]$y) { [System.Drawing.PointF]::new([single]($x * $scale), [single]($y * $scale)) }

        $g.DrawBezier($pen, (P 54 28), (P 54 23.2), (P 61.6 23.2), (P 61.6 28))
        $g.DrawBezier($pen, (P 61.6 28), (P 61.6 31.4), (P 58.2 32), (P 57.4 34.5))
        $g.DrawLine($pen, (P 57.4 34.5), (P 57.4 39.1))
        $g.DrawLine($pen, (P 57.4 39.1), (P 31.5 51.2))
        $g.DrawBezier($pen, (P 31.5 51.2), (P 29.4 52.2), (P 29.8 55.4), (P 32.4 55.4))
        $g.DrawLine($pen, (P 32.4 55.4), (P 75.4 55.4))
        $g.DrawBezier($pen, (P 75.4 55.4), (P 78 55.4), (P 78.4 52.2), (P 76.3 51.2))
        $g.DrawLine($pen, (P 76.3 51.2), (P 57.4 39.1))
        $g.DrawLine($pen, (P 41 47), (P 45.6 59.5))
        $g.DrawLine($pen, (P 70.1 47), (P 62.4 59.5))
        $g.DrawBezier($pen, (P 45.6 59.5), (P 48.4 56.2), (P 51.8 58.1), (P 54 60.6))
        $g.DrawBezier($pen, (P 54 60.6), (P 56.2 58.1), (P 59.6 56.2), (P 62.4 59.5))
        $g.DrawLine($pen, (P 45.6 59.5), (P 40.4 77.4))
        $g.DrawBezier($pen, (P 40.4 77.4), (P 39.7 79.9), (P 41.4 81.8), (P 44 81.8))
        $g.DrawLine($pen, (P 44 81.8), (P 64 81.8))
        $g.DrawBezier($pen, (P 64 81.8), (P 66.6 81.8), (P 68.3 79.9), (P 67.6 77.4))
        $g.DrawLine($pen, (P 67.6 77.4), (P 62.4 59.5))
        $pen.Dispose()

        $star = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(230, 255, 255, 255))
        $g.FillPolygon($star, @((P 79.5 73.3), (P 80.7 77.1), (P 84.5 78.3), (P 80.7 79.5), (P 79.5 83.3), (P 78.3 79.5), (P 74.5 78.3), (P 78.3 77.1)))
        $g.FillPolygon($star, @((P 85.5 81.2), (P 86.1 83.1), (P 88 83.7), (P 86.1 84.3), (P 85.5 86.2), (P 84.9 84.3), (P 83 83.7), (P 84.9 83.1)))
        $star.Dispose()
        return $bitmap
    } finally {
        $g.Dispose()
    }
}

foreach ($entry in $sizes.GetEnumerator()) {
    $targetDirectory = Join-Path $ResourceRoot $entry.Key
    New-Item -ItemType Directory -Force -Path $targetDirectory | Out-Null
    $target = Join-Path $targetDirectory "ic_launcher.png"
    $image = New-LauncherBitmap $entry.Value
    try {
        $image.Save($target, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
        $image.Dispose()
    }
    Write-Host "Generated $target"
}
