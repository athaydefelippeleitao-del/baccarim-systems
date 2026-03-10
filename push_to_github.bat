@echo off
set GIT="C:\Program Files\Git\bin\git.exe"
%GIT% init
%GIT% config user.email "bot@baccarim.com"
%GIT% config user.name "Baccarim Bot"
%GIT% add .
%GIT% commit -m "Initial commit - Baccarim Systems"
%GIT% branch -M main
%GIT% remote add origin https://github.com/athaydefelippeleitao-del/baccarim-systems.git
%GIT% push -u origin main
echo DONE
