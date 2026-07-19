package handlers

import (
	"net/http"
	"strconv"
	"time"

	"simonang/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AuditHandler struct {
	DB *gorm.DB
}

func NewAuditHandler(db *gorm.DB) *AuditHandler {
	return &AuditHandler{DB: db}
}

// RecordAuditLog is a helper to save immutable audit log records in a transaction or DB connection
func RecordAuditLog(db *gorm.DB, c *gin.Context, action string, entity string, entityID string, oldValue string, newValue string) {
	var userID uint = 0
	var username string = "SYSTEM"
	var role string = "SYSTEM"

	if c != nil {
		if uid, exists := c.Get("userID"); exists {
			if u, ok := uid.(uint); ok {
				userID = u
			}
		}
		if uname, exists := c.Get("username"); exists {
			if u, ok := uname.(string); ok {
				username = u
			}
		}
		if r, exists := c.Get("role"); exists {
			if rName, ok := r.(string); ok {
				role = rName
			}
		}
	}

	ipAddress := ""
	if c != nil {
		ipAddress = c.ClientIP()
	}

	log := models.AuditLog{
		UserID:    userID,
		Username:  username,
		UserRole:  role,
		Action:    action,
		Entity:    entity,
		EntityID:  entityID,
		OldValue:  oldValue,
		NewValue:  newValue,
		IPAddress: ipAddress,
		CreatedAt: time.Now(),
	}

	_ = db.Create(&log).Error
}

// GetAuditLogs returns list of audit logs with optional pagination
func (h *AuditHandler) GetAuditLogs(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "100")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit > 500 {
		limit = 100
	}

	var logs []models.AuditLog
	if err := h.DB.Order("id desc").Limit(limit).Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memuat log audit"})
		return
	}

	c.JSON(http.StatusOK, logs)
}
