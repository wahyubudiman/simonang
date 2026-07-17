package handlers

import (
	"fmt"
	"log"
	"time"

	"simonang/internal/models"
	"gorm.io/gorm"
)

// StartEWSEngine launches the background worker for Early Warning System scanning
func StartEWSEngine(db *gorm.DB) {
	ticker := time.NewTicker(10 * time.Second) // Scan every 10 seconds for instant developer feedback

	go func() {
		for range ticker.C {
			log.Println("[EWS Engine] Running periodic budget & backlog scan...")
			
			// 1. Scan Backlog Nota Dinas (>30 days)
			scanNotaDinasBacklogs(db)

			// 2. Scan PRK Budget Critical (<10% remaining)
			scanBudgetQuotas(db)
		}
	}()
}

func scanNotaDinasBacklogs(db *gorm.DB) {
	var contracts []models.Contract
	// Scan active contracts that have an ND date
	err := db.Where("status_proses = ? AND tgl_nd != ?", "PROSES", "").Find(&contracts).Error
	if err != nil {
		log.Printf("[EWS Engine] Error loading contracts: %v", err)
		return
	}

	for _, c := range contracts {
		parsedTime, err := time.Parse("2006-01-02", c.TglND)
		if err != nil {
			// Try secondary standard format just in case
			parsedTime, err = time.Parse("02 Jan 2006", c.TglND)
			if err != nil {
				continue // Skip unparseable dates
			}
		}

		duration := time.Since(parsedTime)
		isBacklog := duration > 30 * 24 * time.Hour

		var existingAlerts []models.Alert
		db.Where("contract_id = ? AND tipe = ?", c.ID, "BACKLOG").Limit(1).Find(&existingAlerts)
		alertExists := len(existingAlerts) > 0
		var existingAlert models.Alert
		if alertExists {
			existingAlert = existingAlerts[0]
		}

		if isBacklog {
			if !alertExists {
				// Create new backlog alert
				alert := models.Alert{
					ContractID: &c.ID,
					Tipe:       "BACKLOG",
					Pesan:      fmt.Sprintf("Kontrak %s (%s) melebihi batas waktu administrasi Nota Dinas 30 hari! (Tanggal ND: %s)", c.NomorKontrak, c.Vendor, c.TglND),
					CreatedAt:  time.Now(),
				}
				db.Create(&alert)
				log.Printf("[EWS Engine] Alert Created: Backlog detected for contract %s", c.NomorKontrak)
			}
		} else {
			if alertExists {
				// Self-heal: delete alert if no longer backlog
				db.Delete(&existingAlert)
				log.Printf("[EWS Engine] Alert Cleared: Contract %s is no longer backlog", c.NomorKontrak)
			}
		}
	}

	// Clean up alerts for contracts that are now completed (SELESAI) or deleted
	var activeBacklogAlerts []models.Alert
	if err := db.Where("tipe = ?", "BACKLOG").Find(&activeBacklogAlerts).Error; err == nil {
		for _, alert := range activeBacklogAlerts {
			if alert.ContractID != nil {
				var checkContracts []models.Contract
				db.Limit(1).Find(&checkContracts, *alert.ContractID)
				if len(checkContracts) == 0 || checkContracts[0].StatusProses == "SELESAI" || checkContracts[0].StatusProses == "DRAFT" {
					db.Delete(&alert)
					log.Printf("[EWS Engine] Alert Cleared: Contract ID %d completed or removed", *alert.ContractID)
				}
			}
		}
	}
}

func scanBudgetQuotas(db *gorm.DB) {
	var prks []models.PRK
	if err := db.Preload("Pagus").Preload("Contracts").Find(&prks).Error; err != nil {
		log.Printf("[EWS Engine] Error loading PRKs: %v", err)
		return
	}

	for _, prk := range prks {
		var paguTotal float64
		for _, p := range prk.Pagus {
			paguTotal += p.NilaiPagu
		}

		var kontrakTotal float64
		for _, c := range prk.Contracts {
			kontrakTotal += c.NilaiKontrak
		}

		sisaPagu := paguTotal - kontrakTotal
		isCritical := false
		if paguTotal > 0 {
			isCritical = sisaPagu < (0.10 * paguTotal)
		}

		var existingAlerts []models.Alert
		db.Where("prk_id = ? AND tipe = ?", prk.ID, "BUDGET_CRITICAL").Limit(1).Find(&existingAlerts)
		alertExists := len(existingAlerts) > 0
		var existingAlert models.Alert
		if alertExists {
			existingAlert = existingAlerts[0]
		}

		if isCritical {
			if !alertExists {
				alert := models.Alert{
					PRKID:     &prk.ID,
					Tipe:      "BUDGET_CRITICAL",
					Pesan:     fmt.Sprintf("Sisa pagu anggaran PRK %s kritis di bawah 10%%! (Tersisa: Rp %.0f dari Pagu: Rp %.0f)", prk.NomorPRK, sisaPagu, paguTotal),
					CreatedAt: time.Now(),
				}
				db.Create(&alert)
				log.Printf("[EWS Engine] Alert Created: Budget critical (<10%%) for PRK %s", prk.NomorPRK)
			} else {
				// Update existing alert message in case numbers changed
				existingAlert.Pesan = fmt.Sprintf("Sisa pagu anggaran PRK %s kritis di bawah 10%%! (Tersisa: Rp %.0f dari Pagu: Rp %.0f)", prk.NomorPRK, sisaPagu, paguTotal)
				db.Save(&existingAlert)
			}
		} else {
			if alertExists {
				db.Delete(&existingAlert)
				log.Printf("[EWS Engine] Alert Cleared: Budget of PRK %s is back to safe level", prk.NomorPRK)
			}
		}
	}

	// Clean up alerts for PRKs that were deleted
	var activeBudgetAlerts []models.Alert
	if err := db.Where("tipe = ?", "BUDGET_CRITICAL").Find(&activeBudgetAlerts).Error; err == nil {
		for _, alert := range activeBudgetAlerts {
			if alert.PRKID != nil {
				var checkPRKs []models.PRK
				db.Limit(1).Find(&checkPRKs, *alert.PRKID)
				if len(checkPRKs) == 0 {
					db.Delete(&alert)
					log.Printf("[EWS Engine] Alert Cleared: PRK ID %d removed", *alert.PRKID)
				}
			}
		}
	}
}
