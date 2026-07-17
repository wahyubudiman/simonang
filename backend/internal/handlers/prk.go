package handlers

import (
	"net/http"
	"strconv"

	"simonang/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type PRKHandler struct {
	DB *gorm.DB
}

func NewPRKHandler(db *gorm.DB) *PRKHandler {
	return &PRKHandler{DB: db}
}

type PRKCreateInput struct {
	NomorPRK      string  `json:"nomor_prk" binding:"required"`
	UraianPRK     string  `json:"uraian_prk" binding:"required"`
	JenisAnggaran string  `json:"jenis_anggaran" binding:"required"` // 'OPERASI' atau 'INVESTASI'
	Tahun         int     `json:"tahun" binding:"required"`
	NilaiPagu     float64 `json:"nilai_pagu" binding:"required,gt=0"`
}

type PRKUpdateInput struct {
	NomorPRK      string  `json:"nomor_prk"`
	UraianPRK     string  `json:"uraian_prk"`
	JenisAnggaran string  `json:"jenis_anggaran"`
	Tahun         int     `json:"tahun"`
	NilaiPagu     float64 `json:"nilai_pagu"`
}

// GetPRKs returns all PRKs with calculations
func (h *PRKHandler) GetPRKs(c *gin.Context) {
	var prks []models.PRK
	if err := h.DB.Preload("Pagus").Preload("Contracts").Order("id desc").Find(&prks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load PRK data"})
		return
	}

	type PRKResponse struct {
		ID            uint    `json:"id"`
		NomorPRK      string  `json:"nomor_prk"`
		UraianPRK     string  `json:"uraian_prk"`
		JenisAnggaran string  `json:"jenis_anggaran"`
		Tahun         int     `json:"tahun"`
		PaguTotal     float64 `json:"pagu_total"`
		KontrakTotal  float64 `json:"kontrak_total"`
		SisaPagu      float64 `json:"sisa_pagu"`
	}

	var response []PRKResponse = []PRKResponse{}
	for _, prk := range prks {
		var paguTotal float64
		for _, pagu := range prk.Pagus {
			paguTotal += pagu.NilaiPagu
		}

		var kontrakTotal float64
		for _, contract := range prk.Contracts {
			kontrakTotal += contract.NilaiKontrak
		}

		response = append(response, PRKResponse{
			ID:            prk.ID,
			NomorPRK:      prk.NomorPRK,
			UraianPRK:     prk.UraianPRK,
			JenisAnggaran: prk.JenisAnggaran,
			Tahun:         prk.Tahun,
			PaguTotal:     paguTotal,
			KontrakTotal:  kontrakTotal,
			SisaPagu:      paguTotal - kontrakTotal,
		})
	}

	c.JSON(http.StatusOK, response)
}

// CreatePRK creates a new PRK and initial Pagu
func (h *PRKHandler) CreatePRK(c *gin.Context) {
	var input PRKCreateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.JenisAnggaran != "OPERASI" && input.JenisAnggaran != "INVESTASI" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Jenis anggaran harus OPERASI atau INVESTASI"})
		return
	}

	tx := h.DB.Begin()

	// Check unique nomor PRK
	var existing models.PRK
	if err := tx.Where("nomor_prk = ?", input.NomorPRK).First(&existing).Error; err == nil {
		tx.Rollback()
		c.JSON(http.StatusConflict, gin.H{"error": "Nomor PRK sudah digunakan"})
		return
	}

	prk := models.PRK{
		NomorPRK:      input.NomorPRK,
		UraianPRK:     input.UraianPRK,
		JenisAnggaran: input.JenisAnggaran,
		Tahun:         input.Tahun,
	}

	if err := tx.Create(&prk).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create PRK"})
		return
	}

	pagu := models.Pagu{
		PRKID:     prk.ID,
		NilaiPagu: input.NilaiPagu,
	}

	if err := tx.Create(&pagu).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create Pagu quota"})
		return
	}

	tx.Commit()

	c.JSON(http.StatusCreated, gin.H{
		"message": "PRK dan Pagu berhasil ditambahkan",
		"prk":     prk,
		"pagu":    pagu,
	})
}

// UpdatePRK updates existing PRK details and verifies budget constraints
func (h *PRKHandler) UpdatePRK(c *gin.Context) {
	idParam := c.Param("id")
	prkID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID PRK tidak valid"})
		return
	}

	tx := h.DB.Begin()

	var prk models.PRK
	if err := tx.Preload("Pagus").Preload("Contracts").First(&prk, prkID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "PRK tidak ditemukan"})
		return
	}

	var input PRKUpdateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.NomorPRK != "" {
		// Check unique nomor PRK
		var existing models.PRK
		if err := tx.Where("nomor_prk = ? AND id != ?", input.NomorPRK, prkID).First(&existing).Error; err == nil {
			tx.Rollback()
			c.JSON(http.StatusConflict, gin.H{"error": "Nomor PRK sudah digunakan oleh program lain"})
			return
		}
		prk.NomorPRK = input.NomorPRK
	}
	if input.UraianPRK != "" {
		prk.UraianPRK = input.UraianPRK
	}
	if input.JenisAnggaran != "" {
		if input.JenisAnggaran != "OPERASI" && input.JenisAnggaran != "INVESTASI" {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Jenis anggaran harus OPERASI atau INVESTASI"})
			return
		}
		prk.JenisAnggaran = input.JenisAnggaran
	}
	if input.Tahun != 0 {
		prk.Tahun = input.Tahun
	}

	// Update PRK details
	if err := tx.Save(&prk).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui data PRK"})
		return
	}

	// Handle Pagu Update and check Lock Pagu constraint
	if input.NilaiPagu > 0 {
		// Sum all existing contracts for this PRK
		var kontrakTotal float64
		for _, contract := range prk.Contracts {
			kontrakTotal += contract.NilaiKontrak
		}

		// Validation check: New pagu must be greater than or equal to total contracts already committed
		if input.NilaiPagu < kontrakTotal {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Fitur Lock Pagu Aktif: Nilai pagu baru tidak boleh lebih kecil dari total nilai kontrak terdaftar!",
				"details": gin.H{
					"kontrak_terdaftar": kontrakTotal,
					"nilai_pagu_input":  input.NilaiPagu,
				},
			})
			return
		}

		// Update or create Pagu record
		if len(prk.Pagus) > 0 {
			pagu := prk.Pagus[0]
			pagu.NilaiPagu = input.NilaiPagu
			if err := tx.Save(&pagu).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui nilai Pagu"})
				return
			}
		} else {
			pagu := models.Pagu{
				PRKID:     prk.ID,
				NilaiPagu: input.NilaiPagu,
			}
			if err := tx.Create(&pagu).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat Pagu"})
				return
			}
		}
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"message": "PRK dan Pagu berhasil diperbarui",
	})
}

// DeletePRK deletes a PRK and GORM CASCADE will delete pagu & contracts
func (h *PRKHandler) DeletePRK(c *gin.Context) {
	idParam := c.Param("id")
	prkID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID PRK tidak valid"})
		return
	}

	var prk models.PRK
	if err := h.DB.First(&prk, prkID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "PRK tidak ditemukan"})
		return
	}

	// Perform Delete (Cascade rules in models.go will delete Pagus and Contracts)
	if err := h.DB.Delete(&prk).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete PRK"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "PRK dan semua data terkait berhasil dihapus"})
}
