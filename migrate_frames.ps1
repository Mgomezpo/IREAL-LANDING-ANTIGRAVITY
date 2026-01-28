
$dest = "notebook-frames"
$src = "New SM frames\check_hd_new"

# Ensure destination exists and is empty
if (Test-Path $dest) {
    Remove-Item "$dest\*" -Force
} else {
    New-Item -ItemType Directory -Path $dest
}

if (Test-Path $src) {
    $files = Get-ChildItem -Path $src -Filter "*.jpg" | Sort-Object Name
    $count = $files.Count
    Write-Host "Processing source: $count files, starting at index 1"
    
    $i = 1
    foreach ($file in $files) {
        $newName = "frame_$i.jpg"
        Copy-Item $file.FullName -Destination (Join-Path $dest $newName)
        $i++
    }
    Write-Host "Total frames processed: $count"
} else {
    Write-Error "Source folder $src not found!"
}
