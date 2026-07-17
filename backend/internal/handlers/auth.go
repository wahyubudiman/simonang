package handlers

import (
	"net/http"
	"time"

	"simonang/internal/middleware"
	"simonang/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthHandler struct {
	DB        *gorm.DB
	JWTSecret string
}

type RegisterInput struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
	Role     string `json:"role" binding:"required"` // ADMIN, PERENCANAAN, KEUANGAN, MANAJER
	Name     string `json:"name" binding:"required"`
}

type LoginInput struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func NewAuthHandler(db *gorm.DB, jwtSecret string) *AuthHandler {
	return &AuthHandler{DB: db, JWTSecret: jwtSecret}
}

// Register handler
func (h *AuthHandler) Register(c *gin.Context) {
	var input RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate role values
	if input.Role != "ADMIN" && input.Role != "PERENCANAAN" && input.Role != "KEUANGAN" && input.Role != "MANAJER" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role value. Must be ADMIN, PERENCANAAN, KEUANGAN, or MANAJER"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	user := models.User{
		Username:     input.Username,
		PasswordHash: string(hashedPassword),
		Role:         input.Role,
		Name:         input.Name,
	}

	if err := h.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Username already exists"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "User registered successfully", "user": gin.H{
		"username": user.Username,
		"role":     user.Role,
		"name":     user.Name,
	}})
}

// Login handler
func (h *AuthHandler) Login(c *gin.Context) {
	var input LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := h.DB.Where("username = ?", input.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Create JWT token
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &middleware.Claims{
		UserID:   user.ID,
		Username: user.Username,
		Role:     user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(h.JWTSecret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate token"})
		return
	}

	// Fetch permissions associated with this role
	var permissions []string = []string{}
	if user.Role == "ADMIN" {
		// ADMIN is superadmin with all permissions by default
		permissions = []string{"prk:read", "prk:write", "contract:read", "contract:write", "user:manage", "rbac:manage"}
	} else {
		h.DB.Table("role_permissions").
			Where("role_name = ?", user.Role).
			Pluck("permission_code", &permissions)
	}

	c.JSON(http.StatusOK, gin.H{
		"token": tokenString,
		"user": gin.H{
			"username":    user.Username,
			"role":        user.Role,
			"name":        user.Name,
			"permissions": permissions,
		},
	})
}
