#!/bin/bash

# Script to run Si Monang containers using Apple's native 'container' CLI tool
# This replaces docker-compose for environments without compose support.

echo "=== Memulai Lingkungan Si Monang via Apple Container ==="

# 1. Hentikan dan hapus kontainer lama jika ada
echo "Menghentikan kontainer lama (jika ada)..."
container stop simonang-frontend simonang-backend simonang-db 2>/dev/null
container rm simonang-frontend simonang-backend simonang-db 2>/dev/null

# 2. Buat jaringan kontainer baru jika belum ada
echo "Membuat jaringan 'simonang-net'..."
container network create simonang-net 2>/dev/null || true

# 3. Jalankan Database PostgreSQL
echo "Menjalankan database PostgreSQL..."
container run -d \
  --name simonang-db \
  --network simonang-net \
  --publish 5432:5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=secretpassword \
  -e POSTGRES_DB=simonang \
  postgres:17-alpine

echo "Menunggu database melakukan inisialisasi awal (5 detik)..."
sleep 5

# 4. Bangun & Jalankan Backend Go
echo "Membangun image backend Go..."
cd backend
container build -t simonang-backend -f Dockerfile.dev .
cd ..

echo "Menjalankan kontainer backend Go..."
container run -d \
  --name simonang-backend \
  --network simonang-net \
  --publish 8080:8080 \
  --volume "$(pwd)/backend:/app" \
  -e DB_HOST=simonang-db \
  -e DB_USER=postgres \
  -e DB_PASSWORD=secretpassword \
  -e DB_NAME=simonang \
  -e DB_PORT=5432 \
  -e JWT_SECRET=simonangsupersecretjwtkey123! \
  -e PORT=8080 \
  simonang-backend

# 5. Bangun & Jalankan Frontend React
echo "Membangun image frontend React..."
cd frontend
container build -t simonang-frontend -f Dockerfile.dev .
cd ..

echo "Menjalankan kontainer frontend React..."
container run -d \
  --name simonang-frontend \
  --network simonang-net \
  --publish 5173:5173 \
  --volume "$(pwd)/frontend:/app" \
  -e VITE_API_URL=http://localhost:8080 \
  simonang-frontend

echo "========================================================"
echo " Aplikasi Si Monang berhasil dijalankan!"
echo " Frontend: http://localhost:5173"
echo " Backend API: http://localhost:8080"
echo "========================================================"
echo "Untuk mematikan aplikasi, jalankan: ./stop_containers.sh"
