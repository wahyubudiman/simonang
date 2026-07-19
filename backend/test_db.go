package main

import (
	"fmt"
	"net"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	fmt.Println("==================================================")
	fmt.Println("  SI MONANG - POSTGRES DB CONNECTION TESTER v8")
	fmt.Println("==================================================")

	ipv6Host := getEnv("DB_IPV6", "fdca:9d69:d79f:5302:fcb6:5fff:fee1:bf75")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "secretpassword")
	dbName := getEnv("DB_NAME", "simonang")

	target := fmt.Sprintf("[%s]:%s", ipv6Host, dbPort)
	fmt.Printf("Menguji TCP Socket IPv6 ke [%s]... ", target)

	conn, err := net.DialTimeout("tcp", target, 3*time.Second)
	if err != nil {
		fmt.Printf("❌ GAGAL (%v)\n", err)
		os.Exit(1)
	}
	conn.Close()
	fmt.Printf("✅ SOCKET TCP IPV6 TERBUKA SANGAT SUKSES!\n")

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Jakarta", ipv6Host, dbUser, dbPassword, dbName, dbPort)
	fmt.Printf("\nMenguji Koneksi GORM via IPv6 DSN (%s)... ", dsn)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		fmt.Printf("❌ GORM OPEN GAGAL (%v)\n", err)
		os.Exit(1)
	}

	sqlDB, err := db.DB()
	if err != nil || sqlDB.Ping() != nil {
		fmt.Printf("❌ PING GAGAL (%v)\n", err)
		os.Exit(1)
	}

	fmt.Printf("✅ BERHASIL SANGAT LANCAR!\n")

	var currentDB, currentUser, version string
	db.Raw("SELECT current_database()").Scan(&currentDB)
	db.Raw("SELECT current_user").Scan(&currentUser)
	db.Raw("SELECT version()").Scan(&version)

	fmt.Printf("\n🎉 KONEKSI DB SUKSES SEPENUHNYA!\n")
	fmt.Printf("Database: %s | User: %s\nPostgreSQL Version: %s\n", currentDB, currentUser, version)
}

func getEnv(key, defaultValue string) string {
	val := os.Getenv(key)
	if val == "" {
		return defaultValue
	}
	return val
}
