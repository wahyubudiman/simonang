package handlers

import (
	"net/http"
	"strconv"

	"simonang/internal/models"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserHandler struct {
	DB *gorm.DB
}

func NewUserHandler(db *gorm.DB) *UserHandler {
	return &UserHandler{DB: db}
}

type UserCreateInput struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
	Role     string `json:"role" binding:"required"` // ADMIN, PERENCANAAN, KEUANGAN, MANAJER
	Name     string `json:"name" binding:"required"`
}

type UserUpdateInput struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Role     string `json:"role"`
	Name     string `json:"name"`
}

// GetUsers lists all users
func (h *UserHandler) GetUsers(c *gin.Context) {
	var users []models.User
	if err := h.DB.Order("id desc").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}
	c.JSON(http.StatusOK, users)
}

// CreateUser registers a new user by Admin
func (h *UserHandler) CreateUser(c *gin.Context) {
	var input UserCreateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate role values
	if input.Role != "ADMIN" && input.Role != "PERENCANAAN" && input.Role != "KEUANGAN" && input.Role != "MANAJER" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role. Role must be ADMIN, PERENCANAAN, KEUANGAN, or MANAJER"})
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

	c.JSON(http.StatusCreated, user)
}

// UpdateUser edits existing user
func (h *UserHandler) UpdateUser(c *gin.Context) {
	idParam := c.Param("id")
	userID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var user models.User
	if err := h.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var input UserUpdateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.Username != "" {
		user.Username = input.Username
	}
	if input.Name != "" {
		user.Name = input.Name
	}
	if input.Role != "" {
		if input.Role != "ADMIN" && input.Role != "PERENCANAAN" && input.Role != "KEUANGAN" && input.Role != "MANAJER" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role"})
			return
		}
		user.Role = input.Role
	}
	if input.Password != "" {
		if len(input.Password) < 6 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 6 characters"})
			return
		}
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}
		user.PasswordHash = string(hashedPassword)
	}

	if err := h.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Username might already be taken"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// DeleteUser deletes user
func (h *UserHandler) DeleteUser(c *gin.Context) {
	idParam := c.Param("id")
	userID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// Prevent admin from deleting their own account
	currentUserIDClaim, exists := c.Get("userID")
	if exists {
		if uID, ok := currentUserIDClaim.(uint); ok && uID == uint(userID) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Anda tidak bisa menghapus akun Anda sendiri!"})
			return
		}
	}

	var user models.User
	if err := h.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if err := h.DB.Delete(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}
