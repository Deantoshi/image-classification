@echo off
echo.
echo ==========================================================
echo =       Starting Image Processing Application          =
echo ==========================================================
echo.

:: Create input/output folders in the script's directory
if not exist "input" mkdir "input"
if not exist "output" mkdir "output"

echo IMPORTANT:
echo 1. Place your images in the 'input' folder that was just created.
echo 2. Results will appear in the 'output' folder.
echo.
pause

echo.
echo --- Checking for Updates and Running Analysis ---
echo.

:: This command downloads the latest version of your app from Docker Hub.
docker pull ai555/maskrcnn-app

:: THIS IS THE CORRECTED LINE:
:: It now correctly mounts the local 'input' and 'output' folders.
docker run --rm -it -v "%~dp0input:/app/input" -v "%~dp0output:/app/output" ai555/maskrcnn-app

echo.
echo ==========================================================
echo =                 Application Finished                   =
echo ==========================================================
echo.
pause