# Troubleshooting HTTP 530 Error với local.goouty.com

## Hiểu lỗi HTTP 530

HTTP 530 thường xảy ra khi:
- Reverse proxy (nginx/Caddy/Cloudflare) không thể kết nối đến origin server (Vite dev server)
- Origin server không chạy hoặc không accessible
- SSL/TLS certificate có vấn đề
- Cấu hình reverse proxy sai

## Các bước kiểm tra

### 1. Kiểm tra Vite dev server có đang chạy không

```bash
# Kiểm tra port 8080 có process nào đang chạy không
lsof -i :8080

# Hoặc
netstat -an | grep 8080

# Hoặc trên macOS
lsof -nP -iTCP:8080 | grep LISTEN
```

**Nếu không có process nào:**
```bash
cd frontend
npm run dev
```

### 2. Kiểm tra Vite dev server có accessible không

```bash
# Test trực tiếp Vite server
curl http://localhost:8080

# Hoặc mở browser
open http://localhost:8080
```

**Nếu `http://localhost:8080` hoạt động nhưng `https://local.goouty.com` không:**
→ Vấn đề ở reverse proxy configuration

### 3. Kiểm tra reverse proxy configuration

#### Nếu dùng Nginx:

Kiểm tra file config (thường ở `/etc/nginx/sites-available/` hoặc `/usr/local/etc/nginx/servers/`):

```nginx
server {
    listen 443 ssl http2;
    server_name local.goouty.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Kiểm tra và reload nginx:**
```bash
# Test config
sudo nginx -t

# Reload nginx
sudo nginx -s reload

# Hoặc restart
sudo brew services restart nginx  # macOS với Homebrew
```

#### Nếu dùng Caddy:

Kiểm tra `Caddyfile`:

```
local.goouty.com {
    reverse_proxy localhost:8080
}
```

**Reload Caddy:**
```bash
caddy reload
```

#### Nếu dùng Cloudflare Tunnel:

Kiểm tra tunnel config trong `~/.cloudflared/config.yml`:

```yaml
tunnel: your-tunnel-id
credentials-file: /path/to/credentials.json

ingress:
  - hostname: local.goouty.com
    service: http://localhost:8080
  - service: http_status:404
```

**Restart Cloudflare tunnel:**
```bash
cloudflared tunnel restart
```

### 4. Kiểm tra hosts file

Đảm bảo `local.goouty.com` trỏ về localhost:

```bash
# macOS/Linux
sudo nano /etc/hosts

# Thêm dòng:
127.0.0.1 local.goouty.com
```

### 5. Kiểm tra SSL certificate

```bash
# Test SSL connection
openssl s_client -connect local.goouty.com:443 -servername local.goouty.com

# Hoặc
curl -vI https://local.goouty.com
```

**Nếu certificate lỗi:**
- Tạo lại self-signed certificate cho local development
- Hoặc sử dụng mkcert để tạo trusted local certificates

### 6. Kiểm tra firewall

```bash
# macOS - Kiểm tra firewall settings
# System Preferences > Security & Privacy > Firewall

# Hoặc kiểm tra port có bị block không
sudo lsof -i :8080
```

## Giải pháp nhanh

### Option 1: Chạy trực tiếp qua localhost (không dùng reverse proxy)

```bash
# Chỉnh sửa vite.config.ts để thêm HTTPS
# Hoặc đơn giản dùng:
npm run dev

# Truy cập: http://localhost:8080
```

### Option 2: Sử dụng mkcert cho local SSL

```bash
# Cài đặt mkcert
brew install mkcert  # macOS
# hoặc
sudo apt install mkcert  # Linux

# Tạo local CA
mkcert -install

# Tạo certificate cho local.goouty.com
mkcert local.goouty.com

# Cấu hình nginx/Caddy để dùng certificate này
```

### Option 3: Kiểm tra logs

```bash
# Nginx logs
tail -f /var/log/nginx/error.log

# Caddy logs
caddy logs

# Cloudflare tunnel logs
cloudflared tunnel info

# Vite dev server logs
# Xem terminal nơi chạy `npm run dev`
```

## Quick Fix Checklist

- [ ] Vite dev server đang chạy trên port 8080
- [ ] `http://localhost:8080` hoạt động
- [ ] Reverse proxy đang chạy
- [ ] Reverse proxy config đúng (proxy_pass đến localhost:8080)
- [ ] `/etc/hosts` có entry cho local.goouty.com
- [ ] SSL certificate hợp lệ
- [ ] Firewall không block port 8080
- [ ] Không có process khác đang dùng port 443

## Debug Commands

```bash
# 1. Kiểm tra tất cả services
ps aux | grep -E "vite|nginx|caddy|cloudflared"

# 2. Kiểm tra ports
lsof -i :8080
lsof -i :443

# 3. Test connection
curl -v http://localhost:8080
curl -v https://local.goouty.com

# 4. Kiểm tra DNS
nslookup local.goouty.com
dig local.goouty.com

# 5. Kiểm tra network
ping local.goouty.com
```

## Nếu vẫn không được

1. **Restart tất cả services:**
   ```bash
   # Stop tất cả
   pkill -f vite
   sudo nginx -s stop  # hoặc caddy stop
   
   # Start lại
   cd frontend && npm run dev &
   sudo nginx  # hoặc caddy start
   ```

2. **Kiểm tra logs chi tiết:**
   - Vite: Xem terminal output
   - Nginx: `tail -f /var/log/nginx/error.log`
   - Browser: Mở DevTools > Network tab

3. **Thử với HTTP thay vì HTTPS:**
   - Cấu hình reverse proxy để chấp nhận HTTP
   - Hoặc tạm thời dùng `http://local.goouty.com` (nếu reverse proxy cho phép)

