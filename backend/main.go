package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"simonang/internal/handlers"
	"simonang/internal/middleware"
	"simonang/internal/models"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// 1. Database Connection Setup
	dbHost := getEnv("DB_HOST", "localhost")
	dbUser := getEnv("DB_USER", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "secretpassword")
	dbName := getEnv("DB_NAME", "simonang")
	dbPort := getEnv("DB_PORT", "5432")

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Jakarta",
		dbHost, dbUser, dbPassword, dbName, dbPort)

	var db *gorm.DB
	var err error
	
	// Wait and retry for DB connection (useful for docker-compose startup timing)
	for i := 0; i < 10; i++ {
		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
		if err == nil {
			break
		}
		log.Printf("Waiting for database connection... (Attempt %d/10)", i+1)
		time.Sleep(3 * time.Second)
	}

	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	log.Println("Database connection established successfully.")

	// 2. Database Auto-Migration
	err = db.AutoMigrate(&models.User{}, &models.PRK{}, &models.Pagu{}, &models.Contract{}, &models.Alert{}, &models.Permission{}, &models.RolePermission{}, &models.Role{})
	if err != nil {
		log.Fatalf("Failed to run database migrations: %v", err)
	}
	log.Println("Database migrations run successfully.")

	// 3. Database Seeding
	seedMockData(db)

	// 4. Gin Engine Initialization
	port := getEnv("PORT", "8080")
	jwtSecret := getEnv("JWT_SECRET", "simonangsupersecretjwtkey123!")

	r := gin.Default()

	// CORS Configuration
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Handlers Instantiation
	authHandler := handlers.NewAuthHandler(db, jwtSecret)
	contractHandler := handlers.NewContractHandler(db)
	userHandler := handlers.NewUserHandler(db)
	prkHandler := handlers.NewPRKHandler(db)
	alertHandler := handlers.NewAlertHandler(db)
	rbacHandler := handlers.NewRBACHandler(db)

	// Start EWS Goroutine Engine
	handlers.StartEWSEngine(db)

	// API Routing
	api := r.Group("/api")
	{
		// Public Auth Endpoints
		authGroup := api.Group("/auth")
		{
			authGroup.POST("/register", authHandler.Register)
			authGroup.POST("/login", authHandler.Login)
		}

		// Protected Endpoints (Requires Valid JWT)
		protected := api.Group("")
		protected.Use(middleware.AuthMiddleware(jwtSecret))
		{
			// PRK Summary (legacy endpoint compatibility)
			protected.GET("/prk-summary", contractHandler.GetPRKSummary)

			// GET Alerts (EWS alerts for all authenticated users)
			protected.GET("/alerts", alertHandler.GetAlerts)

			// PRK CRUD (Protected by dynamic PermissionMiddleware)
			protected.GET("/prks", 
				middleware.PermissionMiddleware(db, "prk:read"), 
				prkHandler.GetPRKs,
			)
			protected.POST("/prks", 
				middleware.PermissionMiddleware(db, "prk:write"), 
				prkHandler.CreatePRK,
			)
			protected.PUT("/prks/:id", 
				middleware.PermissionMiddleware(db, "prk:write"), 
				prkHandler.UpdatePRK,
			)
			protected.DELETE("/prks/:id", 
				middleware.PermissionMiddleware(db, "prk:write"), 
				prkHandler.DeletePRK,
			)

			// Contracts CRUD (Protected by dynamic PermissionMiddleware)
			protected.GET("/contracts", 
				middleware.PermissionMiddleware(db, "contract:read"), 
				contractHandler.GetContracts,
			)
			protected.POST("/contracts", 
				middleware.PermissionMiddleware(db, "contract:write"), 
				contractHandler.CreateContract,
			)
			protected.PUT("/contracts/:id", 
				middleware.PermissionMiddleware(db, "contract:write"), 
				contractHandler.UpdateContract,
			)
			protected.DELETE("/contracts/:id", 
				middleware.PermissionMiddleware(db, "contract:write"), 
				contractHandler.DeleteContract,
			)

			// Users CRUD (Protected by dynamic PermissionMiddleware)
			protected.GET("/users", 
				middleware.PermissionMiddleware(db, "user:manage"), 
				userHandler.GetUsers,
			)
			protected.POST("/users", 
				middleware.PermissionMiddleware(db, "user:manage"), 
				userHandler.CreateUser,
			)
			protected.PUT("/users/:id", 
				middleware.PermissionMiddleware(db, "user:manage"), 
				userHandler.UpdateUser,
			)
			protected.DELETE("/users/:id", 
				middleware.PermissionMiddleware(db, "user:manage"), 
				userHandler.DeleteUser,
			)

			// RBAC Matrix Management Endpoints (Admin / rbac:manage)
			protected.GET("/rbac/permissions", 
				middleware.PermissionMiddleware(db, "rbac:manage"), 
				rbacHandler.GetPermissions,
			)
			protected.GET("/rbac/matrix", 
				middleware.PermissionMiddleware(db, "rbac:manage"), 
				rbacHandler.GetRBACMatrix,
			)
			protected.POST("/rbac/matrix", 
				middleware.PermissionMiddleware(db, "rbac:manage"), 
				rbacHandler.UpdateRBACMatrix,
			)

			// Role Management Endpoints (Admin / rbac:manage)
			protected.GET("/rbac/roles", 
				middleware.PermissionMiddleware(db, "rbac:manage"), 
				rbacHandler.GetRoles,
			)
			protected.POST("/rbac/roles", 
				middleware.PermissionMiddleware(db, "rbac:manage"), 
				rbacHandler.CreateRole,
			)
			protected.PUT("/rbac/roles/:name", 
				middleware.PermissionMiddleware(db, "rbac:manage"), 
				rbacHandler.UpdateRole,
			)
			protected.DELETE("/rbac/roles/:name", 
				middleware.PermissionMiddleware(db, "rbac:manage"), 
				rbacHandler.DeleteRole,
			)
		}
	}

	log.Printf("Starting HTTP API Server on port %s...", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("HTTP API Server failed: %v", err)
	}
}

// helper to read env variable with default fallback
func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

// seedMockData inserts users and sample PRKs/Pagus
func seedMockData(db *gorm.DB) {
	// Seed Users
	var count int64
	db.Model(&models.User{}).Count(&count)
	if count == 0 {
		log.Println("Seeding default users...")
		users := []struct {
			username string
			password string
			role     string
			name     string
		}{
			{"admin", "admin123", "ADMIN", "Super Admin"},
			{"perencanaan", "ren123", "PERENCANAAN", "User Perencanaan"},
			{"keuangan", "keu123", "KEUANGAN", "User Keuangan"},
			{"manajer", "boss123", "MANAJER", "User Manajer"},
		}

		for _, u := range users {
			hashed, _ := bcrypt.GenerateFromPassword([]byte(u.password), bcrypt.DefaultCost)
			db.Create(&models.User{
				Username:     u.username,
				PasswordHash: string(hashed),
				Role:         u.role,
				Name:         u.name,
			})
		}
		log.Println("Seeded default users successfully.")
	}

	// Seed Roles if empty
	var rCount int64
	db.Model(&models.Role{}).Count(&rCount)
	if rCount == 0 {
		log.Println("Seeding default roles...")
		roles := []models.Role{
			{Name: "ADMIN", Deskripsi: "Super Admin dengan kontrol penuh"},
			{Name: "PERENCANAAN", Deskripsi: "Bagian Perencanaan Anggaran & PRK"},
			{Name: "KEUANGAN", Deskripsi: "Bagian Verifikasi Keuangan & Pembayaran"},
			{Name: "MANAJER", Deskripsi: "Manager / Supervisor Unit"},
		}
		db.Create(&roles)
		log.Println("Seeded default roles successfully.")
	}

	// Seed Permissions & Initial Role Mappings if empty
	var pCount int64
	db.Model(&models.Permission{}).Count(&pCount)
	if pCount == 0 {
		log.Println("Seeding default permissions & RBAC matrix...")
		permissions := []models.Permission{
			{"prk:read", "Membaca Rencana Kerja (PRK)", "PRK & Pagu"},
			{"prk:write", "Membuat/Mengubah/Menghapus PRK", "PRK & Pagu"},
			{"contract:read", "Membaca Data Kontrak Kerja", "Kontrak"},
			{"contract:write", "Membuat/Mengubah/Menghapus Kontrak", "Kontrak"},
			{"user:manage", "Mengelola Data User (RBAC)", "Pengaturan"},
			{"rbac:manage", "Mengelola Matriks RBAC", "Pengaturan"},
		}
		db.Create(&permissions)

		rolePermissions := []models.RolePermission{
			// PERENCANAAN
			{"PERENCANAAN", "prk:read"},
			{"PERENCANAAN", "prk:write"},
			{"PERENCANAAN", "contract:read"},
			{"PERENCANAAN", "contract:write"},
			// KEUANGAN
			{"KEUANGAN", "prk:read"},
			{"KEUANGAN", "contract:read"},
			// MANAJER
			{"MANAJER", "prk:read"},
			{"MANAJER", "contract:read"},
		}
		db.Create(&rolePermissions)
		log.Println("Seeded default permissions & RBAC matrix successfully.")
	}

	// Seed PRKs and Pagus if empty
	db.Model(&models.PRK{}).Count(&count)
	if count == 0 {
		log.Println("Seeding default PRK and Pagu mock data...")
		mockPRKs := []struct {
			nomor     string
			uraian    string
			jenis     string
			tahun     int
			nilaiPagu float64
		}{
			{"53 Biaya Pemeliharaan TU", "Har K3LH - Pemeliharaan K3, Keamanan, Lingkungan Hidup, Gedung & Kantor", "OPERASI", 2026, 1494670330.00},
			{"2026.DRKR.4.001", "Pemasangan Keypoint Zona Tanjung Pinang, Rengat, & Bangkinang", "INVESTASI", 2026, 2926556982.00},
			{"Jaringan Komunikasi SCADA", "Pemeliharaan preventif gardu & jaringan telekomunikasi SCADA", "OPERASI", 2026, 850000000.00},
		}

		for _, mock := range mockPRKs {
			tx := db.Begin()
			prk := models.PRK{
				NomorPRK:      mock.nomor,
				UraianPRK:     mock.uraian,
				JenisAnggaran: mock.jenis,
				Tahun:         mock.tahun,
			}
			tx.Create(&prk)

			pagu := models.Pagu{
				PRKID:     prk.ID,
				NilaiPagu: mock.nilaiPagu,
			}
			tx.Create(&pagu)
			tx.Commit()
		}
		log.Println("Seeded default PRK and Pagu successfully.")
	}
}
