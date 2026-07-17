package handlers

import (
	"net/http"

	"simonang/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type RBACHandler struct {
	DB *gorm.DB
}

func NewRBACHandler(db *gorm.DB) *RBACHandler {
	return &RBACHandler{DB: db}
}

// GetPermissions returns list of all available permissions
func (h *RBACHandler) GetPermissions(c *gin.Context) {
	var permissions []models.Permission
	if err := h.DB.Order("kategori asc, code asc").Find(&permissions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memuat daftar permission"})
		return
	}
	c.JSON(http.StatusOK, permissions)
}

// GetRBACMatrix returns current mappings of role_permissions
func (h *RBACHandler) GetRBACMatrix(c *gin.Context) {
	var matrix []models.RolePermission
	if err := h.DB.Find(&matrix).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memuat matriks RBAC"})
		return
	}
	c.JSON(http.StatusOK, matrix)
}

type UpdateRBACMatrixInput struct {
	Mappings []models.RolePermission `json:"mappings"`
}

// UpdateRBACMatrix overrides the entire role_permissions mapping table with new setup
func (h *RBACHandler) UpdateRBACMatrix(c *gin.Context) {
	var input UpdateRBACMatrixInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := h.DB.Begin()

	// Clear current mappings
	if err := tx.Exec("DELETE FROM role_permissions").Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mereset matriks lama"})
		return
	}

	// Insert new mappings
	if len(input.Mappings) > 0 {
		if err := tx.Create(&input.Mappings).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan matriks baru"})
			return
		}
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "Matriks RBAC berhasil diperbarui"})
}

// GetRoles returns all active roles
func (h *RBACHandler) GetRoles(c *gin.Context) {
	var roles []models.Role
	if err := h.DB.Order("name asc").Find(&roles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memuat daftar role"})
		return
	}
	c.JSON(http.StatusOK, roles)
}

type CreateRoleInput struct {
	Name      string `json:"name" binding:"required"`
	Deskripsi string `json:"deskripsi"`
}

// CreateRole adds a new role to the database
func (h *RBACHandler) CreateRole(c *gin.Context) {
	var input CreateRoleInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	role := models.Role{
		Name:      input.Name,
		Deskripsi: input.Deskripsi,
	}

	if err := h.DB.Create(&role).Error; err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Role dengan nama tersebut sudah ada"})
		return
	}

	c.JSON(http.StatusCreated, role)
}

type UpdateRoleInput struct {
	Name      string `json:"name" binding:"required"`
	Deskripsi string `json:"deskripsi"`
}

// UpdateRole updates role name or description transationally
func (h *RBACHandler) UpdateRole(c *gin.Context) {
	oldName := c.Param("name")
	var input UpdateRoleInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := h.DB.Begin()

	var existing models.Role
	if err := tx.Where("name = ?", oldName).First(&existing).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Role tidak ditemukan"})
		return
	}

	if oldName != input.Name {
		// 1. Check if new name already exists
		var check int64
		tx.Model(&models.Role{}).Where("name = ?", input.Name).Count(&check)
		if check > 0 {
			tx.Rollback()
			c.JSON(http.StatusConflict, gin.H{"error": "Nama role baru sudah digunakan"})
			return
		}

		// 2. Insert new role
		newRole := models.Role{
			Name:      input.Name,
			Deskripsi: input.Deskripsi,
		}
		if err := tx.Create(&newRole).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat role baru"})
			return
		}

		// 3. Update users' role referencing this
		if err := tx.Exec("UPDATE users SET role = ? WHERE role = ?", input.Name, oldName).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal merelasikan user ke role baru"})
			return
		}

		// 4. Update role_permissions mapping referencing this
		if err := tx.Exec("UPDATE role_permissions SET role_name = ? WHERE role_name = ?", input.Name, oldName).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal merelasikan permission ke role baru"})
			return
		}

		// 5. Delete old role
		if err := tx.Delete(&existing).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus role lama"})
			return
		}
	} else {
		// Just update description
		existing.Deskripsi = input.Deskripsi
		if err := tx.Save(&existing).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui deskripsi role"})
			return
		}
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "Role berhasil diperbarui"})
}

// DeleteRole deletes a role and removes all associated mappings
func (h *RBACHandler) DeleteRole(c *gin.Context) {
	name := c.Param("name")
	if name == "ADMIN" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Role ADMIN tidak dapat dihapus"})
		return
	}

	tx := h.DB.Begin()

	// 1. Check if users are still assigned to this role
	var userCount int64
	tx.Table("users").Where("role = ?", name).Count(&userCount)
	if userCount > 0 {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Role tidak dapat dihapus karena masih digunakan oleh beberapa user"})
		return
	}

	// 2. Delete from role_permissions
	if err := tx.Exec("DELETE FROM role_permissions WHERE role_name = ?", name).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus relasi permission"})
		return
	}

	// 3. Delete role
	if err := tx.Exec("DELETE FROM roles WHERE name = ?", name).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus role"})
		return
	}

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "Role berhasil dihapus"})
}
