@echo off
set GIT="C:\Program Files\Git\bin\git.exe"
%GIT% add .
%GIT% commit -m "fix: dynamic PORT for Railway, fix start script"
%GIT% push origin main
echo DONE
