package middleware

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

// Claims represents the JWT claims
type Claims struct {
	UserID   uint   `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

// AuthMiddleware validates JWT and sets user details in Gin context
func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header must be Bearer token"})
			c.Abort()
			return
		}

		tokenString := parts[1]
		claims := &Claims{}

		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return []byte(jwtSecret), nil
		})

		if err != nil {
			if errors.Is(err, jwt.ErrTokenExpired) {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Token has expired"})
			} else {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			}
			c.Abort()
			return
		}

		if !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Store user info in context
		c.Set("userID", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("role", claims.Role)

		c.Next()
	}
}

// RoleMiddleware restricts endpoints based on user roles
func RoleMiddleware(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleVal, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied: role not found in context"})
			c.Abort()
			return
		}

		role, ok := roleVal.(string)
		if !ok {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied: invalid role format"})
			c.Abort()
			return
		}

		isAllowed := false
		for _, allowedRole := range allowedRoles {
			if role == allowedRole {
				isAllowed = true
				break
			}
		}

		if !isAllowed {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied: insufficient permissions"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// PermissionMiddleware restricts endpoints based on dynamic permissions from database
func PermissionMiddleware(db *gorm.DB, requiredPermission string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleVal, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak: role tidak ditemukan"})
			c.Abort()
			return
		}

		role, ok := roleVal.(string)
		if !ok {
			c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak: format role tidak valid"})
			c.Abort()
			return
		}

		// Superadmin ("ADMIN") bypassing permission checks to prevent locking out admin
		if role == "ADMIN" {
			c.Next()
			return
		}

		// Check database if this role has the required permission
		var count int64
		err := db.Table("role_permissions").
			Where("role_name = ? AND permission_code = ?", role, requiredPermission).
			Count(&count).Error

		if err != nil || count == 0 {
			c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak: Anda tidak memiliki hak akses untuk tindakan ini (" + requiredPermission + ")"})
			c.Abort()
			return
		}

		c.Next()
	}
}
