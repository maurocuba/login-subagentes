# Deja la demo como al inicio: solo el contrato y los subagentes, sin código generado.
$raiz = $PSScriptRoot
Remove-Item "$raiz\app\db" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$raiz\app\backend" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$raiz\app\frontend" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "Demo reiniciada. Solo quedan CONTRATO.md, app/package.json y .claude/."
