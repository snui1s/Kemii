@echo off
cd ..
set /p msg="Enter migration message: "
alembic revision --autogenerate -m "%msg%"
alembic upgrade head
echo.
echo Done! Database updated.
pause