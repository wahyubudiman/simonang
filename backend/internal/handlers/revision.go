package handlers

import (
	"fmt"
	"net/http"

	"simonang/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type RevisionHandler struct {
	DB *gorm.DB
}

func NewRevisionHandler(db *gorm.DB) *RevisionHandler {
	return &RevisionHandler{DB: db}
}

type RevisePaguInput struct {
	NilaiPaguBaru float64 `json:"nilai_pagu_baru" binding:"required,gt=0"`
	NomorRevisi   string  `json:"nomor_revisi" binding:"required"`
	AlasanRevisi  string  `json:"alasan_revisi" binding:"required"`
}

// RevisePagu processes budget revisions (Adendum/APBD-P), creates a snapshot, updates current pagu, and logs audit
func (h *RevisionHandler) RevisePagu(c *gin.Context) {
	prkID := c.Param("id")
	var input RevisePaguInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := h.DB.Begin()

	var prk models.PRK
	if err := tx.First(&prk, prkID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "PRK tidak ditemukan"})
		return
	}

	// Retrieve current Pagu value
	var currentPagu models.Pagu
	err := tx.Where("prk_id = ?", prk.ID).First(&currentPagu).Error
	nilaiLama := 0.0
	if err == nil {
		nilaiLama = currentPagu.NilaiPagu
	}

	// Calculate existing committed/completed contracts for this PRK to prevent lowering below committed contracts
	var existingContractsSum float64
	_ = tx.Model(&models.Contract{}).
		Where("prk_id = ?", prk.ID).
		Select("COALESCE(SUM(nilai_kontrak), 0)").
		Scan(&existingContractsSum).Error

	if input.NilaiPaguBaru < existingContractsSum {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("Nilai pagu baru (Rp %.0f) tidak boleh lebih kecil dari total nilai kontrak terikat saat ini (Rp %.0f)", input.NilaiPaguBaru, existingContractsSum),
		})
		return
	}

	username, _ := c.Get("username")
	usernameStr, _ := username.(string)

	// Save snapshot revision record
	revision := models.PaguRevision{
		PRKID:         prk.ID,
		NomorRevisi:   input.NomorRevisi,
		NilaiPaguLama: nilaiLama,
		NilaiPaguBaru: input.NilaiPaguBaru,
		AlasanRevisi:  input.AlasanRevisi,
		CreatedBy:     usernameStr,
	}

	if err := tx.Create(&revision).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan catatan revisi pagu"})
		return
	}

	// Update or Create Pagu record
	if currentPagu.ID > 0 {
		currentPagu.NilaiPagu = input.NilaiPaguBaru
		if err := tx.Save(&currentPagu).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui nilai pagu"})
			return
		}
	} else {
		newPagu := models.Pagu{
			PRKID:     prk.ID,
			NilaiPagu: input.NilaiPaguBaru,
		}
		if err := tx.Create(&newPagu).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat nilai pagu baru"})
			return
		}
	}

	// Record Audit Log
	oldValStr := fmt.Sprintf("Rp %.0f", nilaiLama)
	newValStr := fmt.Sprintf("Rp %.0f (SK: %s - Alasan: %s)", input.NilaiPaguBaru, input.NomorRevisi, input.AlasanRevisi)
	RecordAuditLog(tx, c, "REVISE_PAGU", "PRK", fmt.Sprintf("%d", prk.ID), oldValStr, newValStr)

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{
		"message":  "Revisi pagu anggaran berhasil disimpan",
		"revision": revision,
	})
}

// GetPaguRevisions returns snapshot history of revisions for a given PRK
func (h *RevisionHandler) GetPaguRevisions(c *gin.Context) {
	prkID := c.Param("id")
	var revisions []models.PaguRevision
	if err := h.DB.Where("prk_id = ?", prkID).Order("id desc").Find(&revisions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memuat riwayat revisi pagu"})
		return
	}

	c.JSON(http.StatusOK, revisions)
}
