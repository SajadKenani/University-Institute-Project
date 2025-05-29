package endpoints

import (
	"Backend/db"
	"Backend/handlers"
	"Backend/utils"
	"fmt"

	"math/rand"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func HandleLectureCreation(ctx *gin.Context) {
	var lecture handlers.Lecture
	if err := ctx.ShouldBindJSON(&lecture); err != nil {
		utils.HandleError(ctx, err, "Invalid request format", http.StatusBadRequest)
		return
	}

	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	genNumber := rng.Intn(900000) + 100000 // Ensures a 6-digit number (100000 to 999999)

	_, err := db.DB.Exec(`INSERT INTO lecture (name, author_id, season_id, secret_number, description) VALUES ($1, $2, $3, $4, $5)`,
		lecture.Name, lecture.AuthorID, lecture.SeasonID, genNumber, lecture.Description)
	if err != nil {
		utils.HandleError(ctx, err, "Failed to insert into the database", http.StatusBadRequest)
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"message": "Lecture created successfully"})
}
func HandleLecturesFetching(ctx *gin.Context) {
	var lectures []handlers.Lecture

	err := db.DB.Select(&lectures, `SELECT id, name FROM lecture WHERE season_id = $1`, ctx.Param("id"))
	if err != nil {
		utils.HandleError(ctx, err, "Failed to fetch from the database", http.StatusBadRequest)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": lectures})
}
func HandleAllLecturesFetching(ctx *gin.Context) {
	var lectures []handlers.Lecture

	err := db.DB.Select(&lectures, `SELECT id, name FROM lecture`)
	if err != nil {
		utils.HandleError(ctx, err, "Failed to fetch from the database", http.StatusBadRequest)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": lectures})
}
func HandleLectureDeletion(ctx *gin.Context) {
	_, err := db.DB.Exec("DELETE FROM lecture WHERE id = $1", ctx.Param("id"))
	if err != nil {
		utils.HandleError(ctx, err, "Failed to fetch from the database", http.StatusBadRequest)
		return
	}

	ctx.JSON(http.StatusAccepted, gin.H{"message": "Lecture was removed successfully"})
}
func HandleFetchingSpecifiedLecture(ctx *gin.Context) {
	var lecture handlers.Lecture
	err := db.DB.Get(&lecture, `SELECT id, name, secret_number, author_id, is_attendence_valid, description FROM lecture WHERE id = $1 LIMIT 1`, ctx.Param("id"))
	if err != nil {
		utils.HandleError(ctx, err, "Failed to fetch from the database", http.StatusBadRequest)
		return
	}

	var authorName string
	err = db.DB.Get(&authorName, `SELECT name FROM admin_account WHERE id = $1 LIMIT 1`, lecture.AuthorID)
	if err != nil {
		utils.HandleError(ctx, err, "Failed to fetch author info", http.StatusInternalServerError)
		return
	}

	// Build response with author's name
	type LectureWithAuthorName struct {
		ID                int    `json:"id"`
		Name              string `json:"name"`
		SecretNumber      int    `json:"secret_number"`
		AuthorID          int    `json:"author_id"`
		Description       string `json:"description"`
		AuthorName        string `json:"author_name"`
		IsAttendenceValid int    `json:"is_attendence_valid"`
	}

	response := LectureWithAuthorName{
		ID:                lecture.ID,
		Name:              lecture.Name,
		SecretNumber:      lecture.SecretNumber,
		AuthorID:          lecture.AuthorID,
		AuthorName:        authorName,
		Description:       lecture.Description,
		IsAttendenceValid: lecture.AttendenceValitaion,
	}

	ctx.JSON(http.StatusOK, gin.H{"data": response})
}

type AttendenceWithStudent struct {
	handlers.Attendence
	Student handlers.Student `json:"student"`
}

func HandleAttendenceFetching(ctx *gin.Context) {
	var attendenceRecords []handlers.Attendence

	err := db.DB.Select(&attendenceRecords, `SELECT * FROM attendence WHERE lecture_id = $1`, ctx.Param("lecture_id"))
	if err != nil {
		utils.HandleError(ctx, err, "Failed to fetch data from the database", http.StatusBadRequest)
		return
	}

	var fullData []AttendenceWithStudent

	for _, item := range attendenceRecords {
		var student handlers.Student
		err := db.DB.Get(&student, `SELECT id, name, email FROM student_account WHERE id = $1`, item.StudentID)
		if err != nil {
			utils.HandleError(ctx, err, "Failed to fetch student data", http.StatusBadRequest)
			return
		}

		fullData = append(fullData, AttendenceWithStudent{
			Attendence: item,
			Student:    student,
		})
	}

	ctx.JSON(http.StatusAccepted, gin.H{"data": fullData})
}
func HandleSettingAttendanceValidation(ctx *gin.Context) {
	lectureID := ctx.Param("id")

	var isValid int
	err := db.DB.Get(&isValid, `
		UPDATE lecture 
		SET is_attendence_valid = CASE WHEN is_attendence_valid = 1 THEN 0 ELSE 1 END 
		WHERE id = $1 
		RETURNING is_attendence_valid`, lectureID)
	if err != nil {
		utils.HandleError(ctx, err, "Failed to toggle attendance validation", http.StatusBadRequest)
		return
	}

	now := time.Now()
	var query string
	if isValid == 1 {
		query = `UPDATE lecture SET start_validation = $1 WHERE id = $2`
	} else {
		query = `UPDATE lecture SET end_validation = $1 WHERE id = $2`
	}

	result, err := db.DB.Exec(query, now, lectureID)
	if err != nil {
		utils.HandleError(ctx, err, "Failed to update attendance timestamp", http.StatusInternalServerError)
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil || rowsAffected == 0 {
		utils.HandleError(ctx, fmt.Errorf("no update"), "Lecture not found or timestamp not updated", http.StatusNotFound)
		return
	}

	ctx.JSON(http.StatusAccepted, gin.H{
		"message":             "Lecture attendance status updated",
		"is_attendence_valid": isValid,
		"timestamp_updated":   now.Format("2006-01-02 15:04:05"), // Optional: send formatted version to client
	})
}
func HandleManuallyAttendenceProcess(ctx *gin.Context) {
	var payload handlers.Attendence
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		utils.HandleError(ctx, err, "Failed to bind with JSON", http.StatusBadRequest)
		return
	}
	// Fetch lecture info using the secret number and ensure it’s active
	var lecture struct {
		ID int `db:"id"`
	}
	err := db.DB.Get(&lecture, `SELECT id FROM lecture WHERE secret_number = $1 LIMIT 1`, payload.SecretNumber)
	if err != nil {
		utils.HandleError(ctx, err, "Lecture not found", http.StatusNotFound)
		return
	}

	attendeDate := time.Now().Format("2006-01-02 15:04:05")

	// Insert the attendance record
	_, err = db.DB.Exec(`INSERT INTO attendence (author_id, student_id, lecture_id, date) 
	VALUES ($1, $2, $3, $4)`,
		payload.AuthorID, payload.StudentID, lecture.ID, attendeDate)
	if err != nil {
		utils.HandleError(ctx, err, "Failed to insert into the database",
			http.StatusInternalServerError)
		return
	}
	ctx.JSON(http.StatusCreated, gin.H{
		"message": "Attendance recorded successfully",
		"lecture": lecture.ID,
		"student": payload.StudentID,
		"author":  payload.AuthorID,
	})
}
func HandleAttendenceProcess(ctx *gin.Context) {
	var payload handlers.Attendence
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		utils.HandleError(ctx, err, "Failed to bind with JSON", http.StatusBadRequest)
		return
	}

	var Lecture handlers.Lecture
	err := db.DB.Get(&Lecture, `SELECT start_validation, end_validation FROM lecture where id = $1`, payload.LectureID)
	if err != nil {
		utils.HandleError(ctx, err, "Failed to fetch the validations", http.StatusBadRequest)
		return
	}

	// Make sure secret number is valid
	if payload.SecretNumber == 0 {
		utils.HandleError(ctx, fmt.Errorf("SecretNumber cannot be zero or SignDate is not within valid range"), "Invalid input", http.StatusBadRequest)
		return
	}

	// Fetch lecture info using the secret number and ensure it’s active
	var lecture struct {
		ID                int  `db:"id"`
		IsAttendenceValid bool `db:"is_attendence_valid"`
	}
	err = db.DB.Get(&lecture, `SELECT id, is_attendence_valid FROM lecture WHERE secret_number = $1 LIMIT 1`, payload.SecretNumber)
	if err != nil {
		utils.HandleError(ctx, err, "Lecture not found", http.StatusNotFound)
		return
	}

	if payload.SignDate < Lecture.StartValidation || payload.SignDate > Lecture.EndValidation {
		if !lecture.IsAttendenceValid {
			utils.HandleError(ctx, fmt.Errorf("attendance not open for this lecture"), "Validation failed", http.StatusForbidden)
			return
		}
	}

	attendeDate := time.Now().Format("2006-01-02")

	// Insert the attendance record
	_, err = db.DB.Exec(`INSERT INTO attendence (author_id, student_id, lecture_id, date) 
	VALUES ($1, $2, $3, $4)`,
		payload.AuthorID, payload.StudentID, lecture.ID, attendeDate)
	if err != nil {
		utils.HandleError(ctx, err, "Failed to insert into the database", http.StatusInternalServerError)
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message": "Attendance recorded successfully",
		"lecture": lecture.ID,
		"student": payload.StudentID,
		"author":  payload.AuthorID,
	})
}
func HandleRegistrationCancelling(ctx *gin.Context) {
	_, err := db.DB.Exec(`DELETE FROM attendence WHERE id = $1`, ctx.Param("id"))
	if err != nil {
		utils.HandleError(ctx, err, "Lecture not found", http.StatusNotFound)
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message": "Attendance was removed successfully",
	})
}
