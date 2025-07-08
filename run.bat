batch
@echo off
echo Đang khởi chạy ứng dụng...

:: Hiển thị thông tin địa chỉ IP của máy
for /f "tokens=2,3" %%A in ('ipconfig ^| findstr /i "IPv4"') do (
    echo Địa chỉ IP IPv4: %%B
)
echo.

:: Thêm các lệnh để khởi chạy ứng dụng của bạn tại đây
:: Ví dụ: node index.js (thay thế bằng lệnh khởi chạy ứng dụng của bạn)
:: npm start (nếu bạn sử dụng npm để khởi chạy)

:: Sử dụng lệnh của ứng dụng để lắng nghe trên tất cả các giao diện mạng (0.0.0.0)
:: Đảm bảo ứng dụng của bạn được cấu hình để lắng nghe trên 0.0.0.0
:: Nếu ứng dụng của bạn chỉ lắng nghe trên localhost (127.0.0.1) theo mặc định, bạn có thể cần thay đổi cấu hình ứng dụng.

:: Ví dụ cho một ứng dụng Node.js giả định
:: node server.js --host 0.0.0.0 --port 3000
:: Thay thế 'node server.js --host 0.0.0.0 --port 3000' bằng lệnh khởi chạy thực tế của bạn

echo Khởi động ứng dụng với tùy chọn lắng nghe trên 0.0.0.0...
:: CHENH_LENH_KHOI_CHAY_UNG_DUNG_CUA_BAN --host 0.0.0.0 --port PORT_CUA_UNG_DUNG
:: Ví dụ: npm start

echo Ứng dụng đã được khởi chạy.
echo.
echo Để truy cập từ máy này, mở trình duyệt và truy cập http://localhost:PORT_CUA_UNG_DUNG
echo Để truy cập từ các máy khác trong mạng LAN, mở trình duyệt và truy cập http://DIA_CHI_IP_CUA_MAY_CUA_BAN:PORT_CUA_UNG_DUNG
echo.
echo Nhấn Enter để đóng cửa sổ này khi bạn đã hoàn thành.
pause > nul