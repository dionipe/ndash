# NDash - PowerDNS Admin Dashboard

![NDash Dashboard](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Built with](https://img.shields.io/badge/Built%20with-GitHub%20Copilot-000000.svg)

**Built with GitHub Copilot (Grok Code Fast 1)** - AI-assisted development for enhanced productivity and code quality.

**Copyright (c) 2025 NDash Project** - All rights reserved.

NDash adalah dashboard administrasi modern untuk PowerDNS yang dibangun dengan Express.js, EJS, Alpine.js, dan Shadcn UI components.

## ✨ Fitur

- 🎨 **Modern UI**: Menggunakan Tailwind CSS dengan komponen Shadcn UI
- ⚡ **Reactive**: Alpine.js untuk interaktivitas yang ringan
- 🔌 **PowerDNS API**: Integrasi lengkap dengan PowerDNS API
- 📊 **Dashboard**: Overview statistik dan monitoring
- 🌐 **Zone Management**: Kelola DNS zones dengan mudah
- 📝 **Record Management**: CRUD operations untuk DNS records
- 📈 **Statistics**: Visualisasi statistik server PowerDNS
- ⚠️ **Error Handling**: Banner notifikasi error dengan tombol retry otomatis
- 🔄 **Auto Refresh**: Refresh data secara manual dengan loading indicator

## 🎯 Error Handling

NDash dilengkapi dengan sistem error handling yang user-friendly:

- **Error Banner**: Muncul secara otomatis ketika ada masalah koneksi ke PowerDNS API
- **Detailed Messages**: Menampilkan pesan error yang jelas dan actionable
- **Retry Button**: Tombol retry untuk mencoba koneksi ulang
- **Visual Indicators**: Status server berubah warna (Online = hijau, Error/Offline = merah)
- **Graceful Degradation**: UI tetap stabil meskipun backend error

Contoh error yang ditangani:
- `ECONNRESET`: PowerDNS API tidak berjalan atau tidak dapat dijangkau
- `Network Error`: Masalah koneksi jaringan
- `HTTP 500`: Internal server error dari PowerDNS
- `Invalid Data`: Format data yang tidak sesuai dari API

## ⚡ Performance Optimizations

NDash dioptimasi untuk performa yang maksimal:

### Loading Strategy
- **Skeleton Loading**: UI skeleton ditampilkan saat data dimuat
- **Deferred Data Loading**: Data di-fetch setelah UI render selesai
- **Lazy Icon Creation**: Icons dibuat setelah data tersedia
- **Progressive Enhancement**: Fitur tambahan dimuat secara bertahap

### Performance Features
- **GPU Acceleration**: Transform dan opacity menggunakan hardware acceleration
- **Optimized Animations**: `will-change` properties untuk animasi yang smooth
- **Efficient Bindings**: Computed properties mengurangi Alpine.js re-evaluations
- **Resource Preloading**: Critical resources di-preload untuk loading yang lebih cepat

### Benchmarks (Local Development)
- **Server Response**: ~19ms
- **HTML Size**: ~23KB
- **API Response**: ~20ms
- **Alpine.js Bindings**: 76 (optimized)

### Further Optimizations
Untuk production deployment, jalankan:
```bash
./bundle-resources.sh  # Bundle CDN resources locally
```

Ini akan mengurangi external requests dan meningkatkan loading speed.

### Prerequisites

- Node.js v16 atau lebih tinggi
- PowerDNS server dengan API diaktifkan
- npm atau yarn

### Installation

1. Clone atau extract project ini:
```bash
cd /opt/ndash
```

2. Install dependencies:
```bash
npm install
```

3. Copy file konfigurasi dan edit sesuai kebutuhan:
```bash
cp .env.example .env
nano .env
```

4. Konfigurasi file `.env`:
```env
PORT=3000
NODE_ENV=development

# PowerDNS API Configuration
PDNS_API_URL=http://localhost:8081
PDNS_API_KEY=your-powerdns-api-key-here

# Session Secret
SESSION_SECRET=change-this-to-a-random-secret-key
```

5. Jalankan aplikasi:
```bash
# Development mode (dengan auto-reload)
npm run dev

# Production mode
npm start
```

6. Buka browser dan akses:
```
http://localhost:3000
```

## 🔧 Konfigurasi PowerDNS

Pastikan PowerDNS API sudah diaktifkan. Edit file konfigurasi PowerDNS (biasanya `/etc/powerdns/pdns.conf`):

```conf
# Enable API
api=yes
api-key=your-secure-api-key-here

# Bind API to localhost (atau IP tertentu)
webserver=yes
webserver-address=0.0.0.0
webserver-port=8081
webserver-allow-from=127.0.0.0/8,::1
```

Restart PowerDNS setelah mengubah konfigurasi:
```bash
systemctl restart pdns
```

### Troubleshooting Authentication

Jika mendapat error `Authentication by API Key failed`:

1. **Periksa API Key**: Pastikan `api-key` di PowerDNS config sama dengan `PDNS_API_KEY` di `.env`
2. **Periksa webserver-allow-from**: Konfigurasi ini harus mengizinkan akses dari IP NDash server
3. **Test Direct API**: `curl -H "X-API-Key: your-key" http://localhost:8081/api/v1/servers`
4. **Restart Services**: Restart PowerDNS dan NDash setelah perubahan config

### Environment Variables

```env
# PowerDNS API Configuration
PDNS_API_URL=http://localhost:8081
PDNS_API_KEY=your-powerdns-api-key

# NDash Configuration
PORT=3000
NODE_ENV=development
SESSION_SECRET=your-session-secret
```

## 📁 Struktur Project

```
ndash/
├── lib/
│   └── pdns-client.js      # PowerDNS API client
├── public/
│   ├── css/
│   │   └── style.css       # Custom styles
│   └── js/
│       └── app.js          # Frontend JavaScript
├── views/
│   ├── partials/
│   │   ├── header.ejs      # Header template
│   │   └── footer.ejs      # Footer template
│   ├── index.ejs           # Dashboard page
│   └── error.ejs           # Error page
├── .env.example            # Environment variables template
├── .gitignore             # Git ignore rules
├── package.json           # Project dependencies
└── server.js              # Main application file
```

## 🎯 API Endpoints

### Servers
- `GET /api/servers` - Get all servers
- `GET /api/servers/:serverId/statistics` - Get server statistics

### Zones
- `GET /api/servers/:serverId/zones` - Get all zones
- `GET /api/servers/:serverId/zones/:zoneId` - Get specific zone
- `POST /api/servers/:serverId/zones` - Create new zone
- `DELETE /api/servers/:serverId/zones/:zoneId` - Delete zone

### Records
- `PATCH /api/servers/:serverId/zones/:zoneId` - Update records

## 🛠️ Development

### Running in Development Mode

```bash
npm run dev
```

Ini akan menjalankan aplikasi dengan `nodemon` yang akan otomatis restart saat ada perubahan file.

### Technology Stack

- **Backend**: Express.js
- **View Engine**: EJS (Embedded JavaScript)
- **Frontend Framework**: Alpine.js
- **CSS Framework**: Tailwind CSS
- **UI Components**: Shadcn-inspired components
- **Icons**: Lucide Icons
- **HTTP Client**: Axios

## 🔒 Security

- Gunakan HTTPS di production
- Ubah `SESSION_SECRET` dengan nilai random yang aman
- Jangan expose PowerDNS API ke internet
- Implementasikan authentication jika diperlukan
- Batasi akses API PowerDNS dengan firewall

## 📝 TODO / Roadmap

- [ ] Authentication & Authorization
- [ ] Record editing interface
- [ ] Bulk operations
- [ ] Search functionality
- [ ] Export/Import zones
- [ ] Activity logs
- [ ] DNSSEC management
- [ ] Multi-server support
- [ ] Dark mode
- [ ] Responsive mobile view improvements

## 🤝 Contributing

Kontribusi sangat diterima! Silakan fork project ini dan submit pull request.

## 📄 License

MIT License - lihat file LICENSE untuk detail.

## 👨‍💻 Author

Created with ❤️ for the PowerDNS community

## 🐛 Bug Reports

Jika menemukan bug atau masalah, silakan buat issue di repository ini.

## 💡 Tips

1. **Backup**: Selalu backup konfigurasi PowerDNS sebelum melakukan perubahan
2. **Testing**: Test di environment development sebelum deploy ke production
3. **Monitoring**: Pantau log aplikasi untuk debugging
4. **Performance**: Gunakan reverse proxy (nginx/apache) di production

## 📚 Resources

- [PowerDNS Documentation](https://doc.powerdns.com/)
- [Express.js Guide](https://expressjs.com/)
- [Alpine.js Documentation](https://alpinejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**NDash** - Modern PowerDNS Administration Made Easy
