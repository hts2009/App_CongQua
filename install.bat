batch
@echo off
echo Dang bat dau cai dat cac thu vien va cau hinh...
echo.

echo Cai dat Node.js va npm (neu chua co)...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Vui long cai dat Node.js va npm truoc khi chay script nay.
    echo Tai tai: https://nodejs.org/
    goto end
) else (
    echo Node.js va npm da co. Bo qua buoc cai dat.
)
echo.

echo Cai dat cac phu thuoc tu package.json...
npm install
if %errorlevel% neq 0 (
    echo Da xay ra loi trong qua trinh cai dat phu thuoc.
    goto end
)
echo Cai dat phu thuoc thanh cong.
echo.

echo Buoc cau hinh khac (neu co)
REM Them cac lenh cau hinh khac cua ban vao day
REM Vi du: copy file cau hinh, thiet lap bien moi truong, ...
echo.

echo Qua trinh cai dat hoan tat.
echo Ban co the kiem tra cac thong bao loi ben tren neu co.

:end
echo.
echo Nhap bat ky phim nao de thoat...
pause >nul