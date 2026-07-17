package handlers

import (
	"net/http"

	"simonang/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AlertHandler struct {
	DB *gorm.DB
}

func NewAlertHandler(db *gorm.DB) *AlertHandler {
	return &AlertHandler{DB: db}
}

// GetAlerts returns all active alerts from the database
func (h *AlertHandler) GetAlerts(c *gin.Context) {
	var alerts []models.Alert
	if err := h.DB.Order("created_at desc").Find(&alerts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch alerts"})
		return
	}
	c.JSON(http.StatusOK, alerts)
}
