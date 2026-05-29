@echo off
title QMF2026 - Actualizacion Administrativa

echo.
echo ==========================================
echo      QMF2026 - ACTUALIZACION ADMIN
echo ==========================================
echo.

echo [1/6] Actualizando repositorio...
git pull
if errorlevel 1 goto ERROR

echo.
echo [2/6] Procesando Fixture Master...
node scripts\ingest_fixture_master.js
if errorlevel 1 goto ERROR

echo.
echo [3/6] Ejecutando pipeline...
node run_pipeline.js
if errorlevel 1 goto ERROR

echo.
echo [4/6] Agregando cambios...
git add .

echo.
echo [5/6] Creando commit...
git commit -m "Resultados actualizados"

echo.
echo [6/6] Publicando en GitHub...
git push
if errorlevel 1 goto ERROR

echo.
echo ==========================================
echo ACTUALIZACION COMPLETADA EXITOSAMENTE
echo ==========================================
pause
exit

:ERROR
echo.
echo ==========================================
echo ERROR EN EL PROCESO
echo REVISA LOS MENSAJES ANTERIORES
echo ==========================================
pause
exit /b 1