#!/bin/bash

echo "=== Menghentikan Lingkungan Si Monang ==="

container stop simonang-frontend simonang-backend simonang-db
container rm simonang-frontend simonang-backend simonang-db

echo "Semua kontainer berhasil dihentikan dan dibersihkan."
