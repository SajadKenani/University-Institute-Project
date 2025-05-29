package endpoints

import (
	"Backend/db"
	"Backend/handlers"
	"Backend/utils"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
	"github.com/microcosm-cc/bluemonday"
)

func HandleAnnouncementCreation(ctx *gin.Context) {
	var announcement handlers.Announcement

	if err := ctx.ShouldBindJSON(&announcement); err != nil {
		utils.HandleError(ctx, err, "Invalid request data", http.StatusBadRequest)
		return
	}

	// Prevent empty inputs
	if strings.TrimSpace(announcement.Title) == "" || strings.TrimSpace(announcement.Content) == "" {
		utils.HandleError(ctx, nil, "Title and content cannot be empty", http.StatusBadRequest)
		return
	}

	// Sanitize input to prevent XSS
	p := bluemonday.StrictPolicy()
	announcement.Title = p.Sanitize(announcement.Title)
	announcement.Content = p.Sanitize(announcement.Content)

	// === Thumbnail generation ===
	imageGeneration, err := utils.HandleThumbnailGeneration(ctx)
	if err != nil {
		log.Printf("Error generating thumbnail: %v", err)
		utils.HandleError(ctx, nil, "Error generating thumbnail", http.StatusInternalServerError)
		return
	}
	announcement.Image = imageGeneration

	// Get the current date
	currentDate := time.Now().Format("2006-01-02")

	// Insert into database
	err = db.DB.QueryRow(`
		INSERT INTO announcement (title, content, date, author_id, image) 
		VALUES ($1, $2, $3::DATE, $4, $5) RETURNING id`,
		announcement.Title, announcement.Content, currentDate, announcement.AuthorID, announcement.Image).Scan(&announcement.ID)

	if err != nil {
		log.Println("Database Error:", err) // Logs full error for debugging

		// Hide specific database error details from users
		if strings.Contains(err.Error(), "foreign key") {
			utils.HandleError(ctx, nil, "Invalid author", http.StatusConflict)
			return
		}
		utils.HandleError(ctx, nil, "An error occurred", http.StatusInternalServerError)
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"message": "Announcement created successfully", "announcement_id": announcement.ID})
}
func HandleSpecifiedAnnouncementFetching(ctx *gin.Context) {
	announcementID := ctx.Param("id")
	if _, err := strconv.Atoi(announcementID); err != nil {
		utils.HandleError(ctx, nil, "Invalid announcement ID", http.StatusBadRequest)
		return
	}

	var announcement handlers.Announcement
	err := db.DB.Get(&announcement, "SELECT * FROM announcement WHERE id = $1", announcementID)
	if err != nil {
		log.Println("Database Error:", err) // Logs full error for debugging
		utils.HandleError(ctx, nil, "An error occurred", http.StatusInternalServerError)
		return
	}

	// Sanitize announcement data to prevent XSS
	p := bluemonday.StrictPolicy()
	announcement.Title = p.Sanitize(announcement.Title)
	announcement.Content = p.Sanitize(announcement.Content)

	ctx.JSON(http.StatusOK, gin.H{"data": announcement})
}
func HandleFetchAccordingToAuthorID(ctx *gin.Context) {
	var requestedBody struct {
		AuthorID int `json:"author_id"`
	}

	err := ctx.ShouldBindJSON(&requestedBody)
	if err != nil {
		log.Println("Binding Error:", err) // Logs full error for debugging
		utils.HandleError(ctx, nil, "An error occurred", http.StatusInternalServerError)
		return
	}

	var announcement []handlers.Announcement
	err = db.DB.Select(&announcement, "SELECT * FROM announcement WHERE author_id = $1",
		requestedBody.AuthorID)
	if err != nil {
		log.Println("Database Error:", err) // Logs full error for debugging
		utils.HandleError(ctx, nil, "An error occurred", http.StatusInternalServerError)
		return
	}

	var Authors []handlers.AdminAccount

	// Fetch authors from the database
	err = db.DB.Select(&Authors, "SELECT id, name FROM admin_account")
	if err != nil {
		log.Println("Database Error:", err) // Logs full error for debugging
		utils.HandleError(ctx, nil, "An error occurred", http.StatusInternalServerError)
		return
	}

	// Build class map
	classMap := make(map[int]string)
	for _, author := range Authors {
		classMap[author.ID] = author.Name
	}

	// Build a response struct that uses class name instead of ID
	type AnnouncementWithAuthorName struct {
		ID         int    `json:"id"`
		Title      string `json:"title"`
		Content    string `json:"content"`
		AuthorID   int    `json:"author_id"`
		Date       string `json:"date"`
		AuthorName string `json:"author_name"`
	}

	var accouncementWithAuthorName []AnnouncementWithAuthorName
	for _, announce := range announcement {
		authorName := classMap[announce.AuthorID]

		accouncementWithAuthorName = append(accouncementWithAuthorName, AnnouncementWithAuthorName{
			ID:         announce.ID,
			Title:      announce.Title,
			Content:    announce.Content,
			AuthorID:   announce.AuthorID,
			Date:       announce.Date,
			AuthorName: authorName,
		})
	}

	log.Print(accouncementWithAuthorName)

	ctx.JSON(http.StatusOK, gin.H{"data": accouncementWithAuthorName})
}
func HandleAnnouncementDeletion(ctx *gin.Context) {
	announcementID := ctx.Param("id")

	// Delete from database
	result, err := db.DB.Exec("DELETE FROM announcement WHERE id = $1", announcementID)
	if err != nil {
		log.Println("Database Error:", err) // Logs full error for debugging
		utils.HandleError(ctx, nil, "An error occurred", http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		utils.HandleError(ctx, nil, "Announcement not found", http.StatusNotFound)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Announcement deleted successfully"})
}
func HandleAnnouncementsFetching(ctx *gin.Context) {
	var announcements []handlers.Announcement
	err := db.DB.Select(&announcements, "SELECT * FROM announcement")
	if err != nil {
		log.Println("Database Error:", err)
		utils.HandleError(ctx, nil, "An error occurred", http.StatusInternalServerError)
		return
	}

	// Get student loved announcements
	var lovedAnnouncementIDs pq.Int64Array
	err = db.DB.Get(&lovedAnnouncementIDs, `
		SELECT lovedannouncements 
		FROM student_account 
		WHERE id = $1
	`, ctx.Param("student_id"))
	if err != nil {
		log.Println("Database Error:", err)
		utils.HandleError(ctx, nil, "An error occurred", http.StatusInternalServerError)
		return
	}

	// Build a lookup map for fast checking
	lovedMap := make(map[int64]bool)
	for _, id := range lovedAnnouncementIDs {
		lovedMap[id] = true
	}

	// Set the Loved flag based on the lookup map
	for i := range announcements {
		if lovedMap[int64(announcements[i].ID)] {
			announcements[i].Loved = true
		} else {
			announcements[i].Loved = false
		}
	}

	ctx.JSON(http.StatusOK, gin.H{"data": announcements})
}

func HandleLovingAnnouncement(ctx *gin.Context) {
	announcementID := ctx.Param("announcement_id")
	studentID := ctx.Param("student_id")

	if announcementID == "" || studentID == "" {
		utils.HandleError(ctx, nil, "Announcement ID is required", http.StatusBadRequest)
		return
	}

	announcementIDInt, err := strconv.Atoi(announcementID)
	if err != nil {
		utils.HandleError(ctx, nil, "Failed to convert to number", http.StatusInternalServerError)
		return
	}
	studentIDInt, err := strconv.Atoi(studentID)
	if err != nil {
		utils.HandleError(ctx, nil, "Failed to convert to number", http.StatusInternalServerError)
		return
	}

	_, err = db.DB.Exec(`
		UPDATE student_account
		SET lovedannouncements = 
			CASE 
				WHEN COALESCE(lovedannouncements, '{}') @> ARRAY[$1::int] THEN array_remove(COALESCE(lovedannouncements, '{}'), $1::int)
				ELSE COALESCE(lovedannouncements, '{}') || $1::int
			END
		WHERE id = $2
	`, strconv.Itoa(announcementIDInt), studentIDInt)
	if err != nil {
		utils.HandleError(ctx, nil, "Database update error", http.StatusInternalServerError)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Toggled announcement in favorites successfully"})
}
