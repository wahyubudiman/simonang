package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"simonang/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ContractHandler struct {
	DB *gorm.DB
}

type CreateContractInput struct {
	PRKID          uint    `json:"prk_id" binding:"required"`
	NomorKontrak   string  `json:"nomor_kontrak" binding:"required"`
	JudulPekerjaan string  `json:"judul_pekerjaan" binding:"required"`
	Vendor         string  `json:"vendor" binding:"required"`
	NilaiKontrak   float64 `json:"nilai_kontrak" binding:"required,gt=0"`
	TglND          string  `json:"tgl_nd"`
	NoND           string  `json:"no_nd"`
	UserBidang     string  `json:"user_bidang"`
	HariKerja      int     `json:"hari_kerja"`
}

type UpdateContractInput struct {
	PRKID          uint    `json:"prk_id"`
	NomorKontrak   string  `json:"nomor_kontrak"`
	JudulPekerjaan string  `json:"judul_pekerjaan"`
	Vendor         string  `json:"vendor"`
	NilaiKontrak   float64 `json:"nilai_kontrak"`
	StatusProses   string  `json:"status_proses"` // 'DRAFT', 'PROSES', 'SELESAI'
	TglND          string  `json:"tgl_nd"`
	NoND           string  `json:"no_nd"`
	UserBidang     string  `json:"user_bidang"`
	HariKerja      int     `json:"hari_kerja"`
}

func NewContractHandler(db *gorm.DB) *ContractHandler {
	return &ContractHandler{DB: db}
}

// GetContracts returns all contracts
func (h *ContractHandler) GetContracts(c *gin.Context) {
	var contracts []models.Contract
	if err := h.DB.Order("id desc").Find(&contracts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load contracts"})
		return
	}
	c.JSON(http.StatusOK, contracts)
}

// CreateContract handles input contract with Lock Pagu constraint
func (h *ContractHandler) CreateContract(c *gin.Context) {
	var input CreateContractInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := h.DB.Begin()

	// Check if PRK exists
	var prk models.PRK
	if err := tx.First(&prk, input.PRKID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Program Rencana Kerja (PRK) tidak ditemukan"})
		return
	}

	// Calculate total existing contracts for this PRK
	var existingContractsSum float64
	err := tx.Model(&models.Contract{}).
		Where("prk_id = ?", input.PRKID).
		Select("COALESCE(SUM(nilai_kontrak), 0)").
		Scan(&existingContractsSum).Error

	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to calculate existing contracts"})
		return
	}

	// Calculate total pagu for this PRK
	var paguSum float64
	err = tx.Model(&models.Pagu{}).
		Where("prk_id = ?", input.PRKID).
		Select("COALESCE(SUM(nilai_pagu), 0)").
		Scan(&paguSum).Error

	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve budget quota (Pagu)"})
		return
	}

	sisaPagu := paguSum - existingContractsSum

	// Lock Pagu Validation
	if input.NilaiKontrak > sisaPagu {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Fitur Lock Pagu Aktif: Nilai kontrak melampaui sisa pagu anggaran!",
			"details": gin.H{
				"total_pagu":             paguSum,
				"total_kontrak_existing": existingContractsSum,
				"sisa_pagu":              sisaPagu,
				"nilai_kontrak_input":    input.NilaiKontrak,
			},
		})
		return
	}

	// Create new contract record
	contract := models.Contract{
		PRKID:             input.PRKID,
		NomorKontrak:      input.NomorKontrak,
		JudulPekerjaan:    input.JudulPekerjaan,
		Vendor:            input.Vendor,
		NilaiKontrak:      input.NilaiKontrak,
		StatusProses:      "PROSES", // Default status
		TglND:             input.TglND,
		NoND:              input.NoND,
		UserBidang:        input.UserBidang,
		HariKerja:         input.HariKerja,
		ApprovalStatus:    "DRAFT", // Multi-level approval starts at DRAFT
		ApprovalNotes:     "",
		ApprovedByFinance: "",
		ApprovedByManager: "",
	}

	if err := tx.Create(&contract).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusConflict, gin.H{"error": "Nomor Kontrak sudah terdaftar"})
		return
	}

	// Record Audit Log
	newValStr := fmt.Sprintf("Kontrak %s (Rp %.0f, Vendor: %s, Bidang: %s)", contract.NomorKontrak, contract.NilaiKontrak, contract.Vendor, contract.UserBidang)
	RecordAuditLog(tx, c, "CREATE_CONTRACT", "Contract", strconv.FormatUint(uint64(contract.ID), 10), "-", newValStr)

	tx.Commit()
	c.JSON(http.StatusCreated, contract)
}

// UpdateContract updates existing contract details and checks Lock Pagu
func (h *ContractHandler) UpdateContract(c *gin.Context) {
	idParam := c.Param("id")
	contractID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID Kontrak tidak valid"})
		return
	}

	tx := h.DB.Begin()

	var contract models.Contract
	if err := tx.First(&contract, contractID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Kontrak tidak ditemukan"})
		return
	}

	oldValStr := fmt.Sprintf("Kontrak %s (Rp %.0f, Status: %s, Approval: %s)", contract.NomorKontrak, contract.NilaiKontrak, contract.StatusProses, contract.ApprovalStatus)

	var input UpdateContractInput
	if err := c.ShouldBindJSON(&input); err != nil {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	targetPRKID := contract.PRKID
	if input.PRKID > 0 {
		targetPRKID = input.PRKID
	}

	targetNilai := contract.NilaiKontrak
	if input.NilaiKontrak > 0 {
		targetNilai = input.NilaiKontrak
	}

	// Lock Pagu Validation: only run if NilaiKontrak or PRKID is changed
	if input.NilaiKontrak > 0 || input.PRKID > 0 {
		// Calculate total pagu for target PRK
		var paguSum float64
		err = tx.Model(&models.Pagu{}).
			Where("prk_id = ?", targetPRKID).
			Select("COALESCE(SUM(nilai_pagu), 0)").
			Scan(&paguSum).Error

		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung pagu"})
			return
		}

		// Calculate total other contracts for target PRK
		var otherContractsSum float64
		query := tx.Model(&models.Contract{}).Where("prk_id = ?", targetPRKID)
		if targetPRKID == contract.PRKID {
			// Exclude current contract from sum if PRK is not changed
			query = query.Where("id != ?", contract.ID)
		}
		err = query.Select("COALESCE(SUM(nilai_kontrak), 0)").Scan(&otherContractsSum).Error

		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung kontrak terdaftar"})
			return
		}

		sisaPagu := paguSum - otherContractsSum

		if targetNilai > sisaPagu {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Fitur Lock Pagu Aktif: Nilai kontrak melampaui sisa pagu anggaran!",
				"details": gin.H{
					"total_pagu":           paguSum,
					"kontrak_lain":         otherContractsSum,
					"sisa_pagu":            sisaPagu,
					"nilai_kontrak_input":  targetNilai,
				},
			})
			return
		}
	}

	// Apply updates
	if input.PRKID > 0 {
		contract.PRKID = input.PRKID
	}
	if input.NomorKontrak != "" {
		// Check unique nomor kontrak
		var existing models.Contract
		if err := tx.Where("nomor_kontrak = ? AND id != ?", input.NomorKontrak, contractID).First(&existing).Error; err == nil {
			tx.Rollback()
			c.JSON(http.StatusConflict, gin.H{"error": "Nomor Kontrak sudah digunakan oleh kontrak lain"})
			return
		}
		contract.NomorKontrak = input.NomorKontrak
	}
	if input.JudulPekerjaan != "" {
		contract.JudulPekerjaan = input.JudulPekerjaan
	}
	if input.Vendor != "" {
		contract.Vendor = input.Vendor
	}
	if input.NilaiKontrak > 0 {
		contract.NilaiKontrak = input.NilaiKontrak
	}
	if input.StatusProses != "" {
		if input.StatusProses != "DRAFT" && input.StatusProses != "PROSES" && input.StatusProses != "SELESAI" {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Status harus DRAFT, PROSES, atau SELESAI"})
			return
		}
		contract.StatusProses = input.StatusProses
	}
	
	// Optional EWS / ND details fields
	contract.TglND = input.TglND
	contract.NoND = input.NoND
	contract.UserBidang = input.UserBidang
	if input.HariKerja >= 0 {
		contract.HariKerja = input.HariKerja
	}

	if err := tx.Save(&contract).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan perubahan kontrak"})
		return
	}

	// Record Audit Log
	newValStr := fmt.Sprintf("Kontrak %s (Rp %.0f, Status: %s, Approval: %s)", contract.NomorKontrak, contract.NilaiKontrak, contract.StatusProses, contract.ApprovalStatus)
	RecordAuditLog(tx, c, "UPDATE_CONTRACT", "Contract", strconv.FormatUint(uint64(contract.ID), 10), oldValStr, newValStr)

	tx.Commit()
	c.JSON(http.StatusOK, contract)
}

// DeleteContract deletes a contract
func (h *ContractHandler) DeleteContract(c *gin.Context) {
	idParam := c.Param("id")
	contractID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID Kontrak tidak valid"})
		return
	}

	tx := h.DB.Begin()

	var contract models.Contract
	if err := tx.First(&contract, contractID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Kontrak tidak ditemukan"})
		return
	}

	oldValStr := fmt.Sprintf("Kontrak %s (Rp %.0f, Vendor: %s)", contract.NomorKontrak, contract.NilaiKontrak, contract.Vendor)

	if err := tx.Delete(&contract).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus kontrak"})
		return
	}

	// Record Audit Log
	RecordAuditLog(tx, c, "DELETE_CONTRACT", "Contract", strconv.FormatUint(uint64(contract.ID), 10), oldValStr, "-")

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "Kontrak berhasil dihapus"})
}

type ProcessApprovalInput struct {
	Action string `json:"action" binding:"required"` // 'SUBMIT', 'VERIFY', 'APPROVE', 'REJECT'
	Notes  string `json:"notes"`
}

// ProcessApproval handles multi-level approval workflow state machine
func (h *ContractHandler) ProcessApproval(c *gin.Context) {
	idParam := c.Param("id")
	contractID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID Kontrak tidak valid"})
		return
	}

	var input ProcessApprovalInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := h.DB.Begin()

	var contract models.Contract
	if err := tx.First(&contract, contractID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Kontrak tidak ditemukan"})
		return
	}

	userRoleVal, _ := c.Get("role")
	userRoleStr, _ := userRoleVal.(string)
	username, _ := c.Get("username")
	usernameStr, _ := username.(string)
	oldApprovalStatus := contract.ApprovalStatus

	// Helper to verify dynamic RBAC permission for approval actions
	hasPermission := func(perm string) bool {
		if userRoleStr == "ADMIN" {
			return true
		}
		var count int64
		tx.Table("role_permissions").
			Where("role_name = ? AND permission_code = ?", userRoleStr, perm).
			Count(&count)
		return count > 0
	}

	switch input.Action {
	case "SUBMIT":
		// User Bidang / Perencanaan mengajukan draft kontrak
		if !hasPermission("contract:write") {
			tx.Rollback()
			c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak: Anda tidak memiliki izin untuk mengajukan persetujuan kontrak (contract:write)"})
			return
		}
		contract.ApprovalStatus = "PENDING_APPROVAL"
		contract.ApprovalNotes = input.Notes
	case "VERIFY":
		// Keuangan memverifikasi dokumen tagihan/nota dinas
		if !hasPermission("contract:approve_finance") {
			tx.Rollback()
			c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak: Hanya bagian Keuangan yang memiliki hak verifikasi (contract:approve_finance)"})
			return
		}
		if contract.ApprovalStatus != "PENDING_APPROVAL" {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kontrak harus dalam status PENDING_APPROVAL untuk diverifikasi Keuangan"})
			return
		}
		contract.ApprovalStatus = "VERIFIED_FINANCE"
		contract.ApprovedByFinance = usernameStr
		if input.Notes != "" {
			contract.ApprovalNotes = input.Notes
		}
	case "APPROVE":
		// Manajer menyetujui kontrak
		if !hasPermission("contract:approve_manager") {
			tx.Rollback()
			c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak: Hanya Manajer yang memiliki hak persetujuan final (contract:approve_manager)"})
			return
		}
		if contract.ApprovalStatus != "VERIFIED_FINANCE" {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kontrak harus dalam status VERIFIED_FINANCE untuk disetujui Manajer"})
			return
		}
		contract.ApprovalStatus = "APPROVED_MANAGER"
		contract.ApprovedByManager = usernameStr
		if input.Notes != "" {
			contract.ApprovalNotes = input.Notes
		}
	case "REJECT":
		// Penolakan oleh Keuangan atau Manajer dengan catatan
		if !hasPermission("contract:approve_finance") && !hasPermission("contract:approve_manager") {
			tx.Rollback()
			c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak: Anda tidak memiliki hak akses untuk menolak persetujuan kontrak"})
			return
		}
		contract.ApprovalStatus = "REJECTED"
		contract.ApprovalNotes = input.Notes
	default:
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Aksi approval tidak dikenal (Gunakan: SUBMIT, VERIFY, APPROVE, atau REJECT)"})
		return
	}

	if err := tx.Save(&contract).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan status approval"})
		return
	}

	// Record Audit Log
	newValStr := fmt.Sprintf("Status Approval: %s (Oleh: %s, Catatan: %s)", contract.ApprovalStatus, usernameStr, contract.ApprovalNotes)
	RecordAuditLog(tx, c, "APPROVAL_CONTRACT_"+input.Action, "Contract", strconv.FormatUint(uint64(contract.ID), 10), oldApprovalStatus, newValStr)

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{
		"message":  "Status persetujuan kontrak berhasil diperbarui",
		"contract": contract,
	})
}

// GetPRKSummary returns all PRKs with aggregation calculations (compatibility)
func (h *ContractHandler) GetPRKSummary(c *gin.Context) {
	var prks []models.PRK
	if err := h.DB.Preload("Pagus").Preload("Contracts").Find(&prks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load database content"})
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
