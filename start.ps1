$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\server'; node index.js"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\ai-service'; python app.py"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\client'; npm run dev"

Write-Host "Started Express (:5000), Flask (:5001), and React (:5173)."
Write-Host "Open http://localhost:5173/ in your browser."
