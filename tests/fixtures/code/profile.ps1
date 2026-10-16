param(
	[string]$Path = ".",
	[switch]$Recurse
)

$files = Get-ChildItem -Path $Path -Recurse:$Recurse -Filter *.log
foreach ($file in $files) {
	if ($file.Length -gt 1MB) { Write-Host "Large: $($file.Name)" -ForegroundColor Red }
}
