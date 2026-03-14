@echo off

echo 🚀 Iniciando deploy...

git add .

set DATA=%date% %time%

git commit -m "update automatico %DATA%"

git push origin main

echo ✅ Deploy concluido!

pause
