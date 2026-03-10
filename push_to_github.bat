@echo off
set GIT="C:\Program Files\Git\bin\git.exe"
%GIT% add .
%GIT% commit -m "feat: Gemini AI via server-side API routes, fix PORT for Railway"
%GIT% push origin main
echo DONE
