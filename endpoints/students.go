package endpoints

import (
	"Backend/db"
	"Backend/handlers"
	"Backend/utils"
	"database/sql"
	"encoding/base64"
	"encoding/csv"
	"errors"
	"strconv"

	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
	"golang.org/x/crypto/scrypt"
)

func HandleStudentCreation(ctx *gin.Context) {
	var Student handlers.Student
	err := ctx.ShouldBindJSON(&Student)
	if err != nil {
		log.Println("Binding Error:", err) // Logs full error for debugging
		utils.HandleError(ctx, nil, "An error occurred", http.StatusInternalServerError)
		return
	}

	// Generate salt and hash password
	salt, err := utils.GenerateSalt()
	if err != nil {
		utils.HandleError(ctx, err, "Failed to generate salt", http.StatusInternalServerError)
		return
	}

	hashedPassword, err := scrypt.Key([]byte(Student.Password), salt, 16384, 8, 1, 32)
	if err != nil {
		utils.HandleError(ctx, err, "Failed to hash password", http.StatusInternalServerError)
		return
	}

	// Encode salt and password
	saltBase64 := base64.StdEncoding.EncodeToString(salt)
	hashedPasswordBase64 := base64.StdEncoding.EncodeToString(hashedPassword)
	genID := uuid.New().String()

	_, err = db.DB.Exec(`INSERT INTO student_account 
	(name, email, password, salt, gen_id, author_id) VALUES ($1, $2, $3, $4, $5, $6)`,
		Student.Name, Student.Email, hashedPasswordBase64, saltBase64, genID, Student.AuthorID)
	if err != nil {
		log.Println("Database Error:", err) // Logs full error for debugging
		utils.HandleError(ctx, nil, "An error occurred", http.StatusInternalServerError)
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"message": "Student accound was created successfully"})
}
func HandleStudentsFetching(ctx *gin.Context) {
	author_id := ctx.Param("id")

	var Students []handlers.Student
	err := db.DB.Select(&Students, "SELECT id, name, email, class_id FROM student_account WHERE author_id = $1", author_id)
	if err != nil {
		utils.HandleError(ctx, err, "Failed to fetch the data", http.StatusInternalServerError)
		return
	}

	var Classes []handlers.Class
	err = db.DB.Select(&Classes, `SELECT id, name FROM class WHERE author_id = $1`, author_id)
	if err != nil {
		utils.HandleError(ctx, err, "Failed to fetch the data", http.StatusInternalServerError)
		return
	}

	// Build class map
	classMap := make(map[int]string)
	for _, class := range Classes {
		classMap[class.ID] = class.Name
	}

	// Build a response struct that uses class name instead of ID
	type StudentWithClassName struct {
		ID    int    `json:"id"`
		Name  string `json:"name"`
		Email string `json:"email"`
		Class string `json:"class"`
	}

	var studentsWithNames []StudentWithClassName
	for _, student := range Students {

		className := ""
		if student.ClassID != nil {
			if name, ok := classMap[*student.ClassID]; ok {
				className = name
			}
		}

		studentsWithNames = append(studentsWithNames, StudentWithClassName{
			ID:    student.ID,
			Name:  student.Name,
			Email: student.Email,
			Class: className,
		})
	}

	ctx.JSON(http.StatusOK, gin.H{"data": studentsWithNames})
}
func HandleStudentSignInProcess(ctx *gin.Context) {
	var requestBody struct {
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required"`
	}

	// Parse and validate input
	if err := ctx.ShouldBindJSON(&requestBody); err != nil {
		utils.HandleError(ctx, err, "Invalid request format", http.StatusBadRequest)
		return
	}

	var storedAccount struct {
		ID          string
		PhoneNumber string
		Password    string
		Name        string
		Salt        string
		Limits      int
		Status      string
		Action_date string
		Is_active   bool
		Email       string
	}

	// Query the database
	query := `
		SELECT id, email, password, salt, name, limits, status, action_date, is_active
		FROM student_account
		WHERE email = $1
		LIMIT 1
	`
	err := db.DB.QueryRow(query, requestBody.Email).Scan(
		&storedAccount.ID,
		&storedAccount.Email,
		&storedAccount.Password,
		&storedAccount.Salt,
		&storedAccount.Name,
		&storedAccount.Limits,
		&storedAccount.Status,
		&storedAccount.Action_date,
		&storedAccount.Is_active,
	)

	// Handle DB errors
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		} else {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		}
		return
	}

	// Apply cooldown handling
	utils.HandleCooldown(ctx, storedAccount, "student_account")
	// Account status checks
	if !storedAccount.Is_active {
		switch storedAccount.Status {
		case "suspect":
			ctx.JSON(http.StatusForbidden, gin.H{"limit_issue_one_hour": "يجب ان تنتظر لمدة ساعة للمحاولة مرة اخرة"})
		case "danger":
			ctx.JSON(http.StatusForbidden, gin.H{"limit_issue_five_hours": "يجب ان تنتظر لمدة 5 ساعات للمحاولة مرة اخرة"})
		default:
			ctx.JSON(http.StatusForbidden, gin.H{"limit_issue": "لقد تم قفل حسابك، الرجاء التواصل مع الدعم الفني"})
		}
		return
	}

	// Decode stored salt
	saltBytes, err := base64.StdEncoding.DecodeString(storedAccount.Salt)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid salt format"})
		return
	}

	// Hash input password
	hashedInput, err := scrypt.Key([]byte(requestBody.Password), saltBytes, 16384, 8, 1, 32)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Password hashing error"})
		return
	}

	// Compare passwords
	if storedAccount.Password != base64.StdEncoding.EncodeToString(hashedInput) {
		utils.HandleLimitAndStatus(ctx, storedAccount, "student_account")
		ctx.JSON(http.StatusUnauthorized, gin.H{"password_issue": "كلمة المرور غير صحيحة"})
		return
	}

	// Generate JWT token
	token, err := utils.GenerateJWT(storedAccount.Email)
	if err != nil {
		utils.HandleError(ctx, err, "Failed to generate the Token", http.StatusInternalServerError)
		return
	}

	// Success response
	ctx.JSON(http.StatusOK, gin.H{
		"status":  true,
		"message": "Sign-in successful",
		"value":   storedAccount.ID,
		"token":   token,
	})
}

func HandleStudentsRegesrationsFetching(ctx *gin.Context) {
	studentID, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		utils.HandleError(ctx, err, "Invalid student ID", http.StatusBadRequest)
		return
	}

	type StudentAttendanceWithLecture struct {
		LectureID   int    `db:"lecture_id" json:"lecture_id"`
		StudentID   int    `db:"student_id" json:"student_id"`
		LectureName string `db:"lecture_name" json:"lecture_name"`
	}

	var results []StudentAttendanceWithLecture
	err = db.DB.Select(&results, `
		SELECT 
			a.student_id, a.lecture_id, l.name AS lecture_name
		FROM 
			attendence a
		JOIN 
			lecture l ON a.lecture_id = l.id
		WHERE 
			a.student_id = $1
	`, studentID)
	if err != nil {
		utils.HandleError(ctx, err, "Failed to fetch the attendance", http.StatusBadRequest)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": results})
}
func HandleStudentDeletion(ctx *gin.Context) {
	studentID := ctx.Param("id")

	// Delete student account from the database
	_, err := db.DB.Exec("DELETE FROM student_account WHERE id = $1", studentID)
	if err != nil {
		utils.HandleError(ctx, err, "Failed to delete the student account", http.StatusBadRequest)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Student account was successfully deleted"})
}
func HandleSubjectInsertion(ctx *gin.Context) {
	var requestBody struct {
		Name      string `json:"name"`
		Degree    int    `json:"degree"`
		AuthorID  int    `json:"author_id"`
		StudentID int    `json:"student_id"`
	}

	// Bind JSON body to requestBody
	if err := ctx.ShouldBindJSON(&requestBody); err != nil {
		utils.HandleError(ctx, err, "Invalid request format", http.StatusBadRequest)
		return
	}

	// Start a transaction
	tx, err := db.DB.Beginx()
	if err != nil {
		utils.HandleError(ctx, err, "Failed to start transaction", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback() // Ensure rollback if not committed

	// Insert into subject and retrieve the subject ID
	var subjectID int
	err = tx.QueryRow(`INSERT INTO subject (name, degree, author_id) VALUES ($1, $2, $3) RETURNING id`,
		requestBody.Name, requestBody.Degree, requestBody.AuthorID).Scan(&subjectID)
	if err != nil {
		utils.HandleError(ctx, err, "Failed to insert subject", http.StatusInternalServerError)
		return
	}

	// Fetch current subject IDs from student account
	var subjectIDsStr string
	err = tx.Get(&subjectIDsStr, `SELECT subject_ids FROM student_account WHERE id = $1`, requestBody.StudentID)
	if err != nil {
		utils.HandleError(ctx, err, "Failed to retrieve current subject IDs", http.StatusInternalServerError)
		return
	}

	// Parse existing subject IDs
	var currentSubjectIDs pq.Int64Array
	if subjectIDsStr != "" {
		currentSubjectIDs, err = utils.ParseSubjectIDs(subjectIDsStr)
		if err != nil {
			utils.HandleError(ctx, err, "Failed to parse subject IDs", http.StatusInternalServerError)
			return
		}
	}

	// Append new subject ID to the current subject IDs
	newSubjectIDs := append(currentSubjectIDs, int64(subjectID))

	// Update subject IDs in student account
	_, err = tx.Exec(`UPDATE student_account SET subject_ids = $1 WHERE id = $2`,
		pq.Array(newSubjectIDs), requestBody.StudentID)
	if err != nil {
		utils.HandleError(ctx, err, "Failed to update student account subject IDs", http.StatusInternalServerError)
		return
	}

	// Commit the transaction
	err = tx.Commit()
	if err != nil {
		utils.HandleError(ctx, err, "Failed to commit transaction", http.StatusInternalServerError)
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message":     "Subject was successfully added",
		"status":      http.StatusCreated,
		"subject_id":  subjectID,
		"subject_ids": newSubjectIDs,
	})
}
func HandleSubjectFetching(ctx *gin.Context) {
	var requestedBody struct {
		ID int `json:"id"`
	}

	err := ctx.ShouldBindJSON(&requestedBody)
	if err != nil {
		utils.HandleError(ctx, err, "Invalid request format", http.StatusBadRequest)
		return
	}

	type StudentSubjects struct {
		SubjectIDs pq.Int64Array `db:"subject_ids" json:"subject_ids"`
	}

	var studentSubjects StudentSubjects
	err = db.DB.Get(&studentSubjects, "SELECT subject_ids FROM student_account WHERE id = $1", requestedBody.ID)
	if err != nil {
		utils.HandleError(ctx, err, "Failed to fetch subject IDs", http.StatusInternalServerError)
		return
	}

	// Convert pq.Int64Array to []int
	subjectIDs := make([]int, len(studentSubjects.SubjectIDs))
	for i, id := range studentSubjects.SubjectIDs {
		subjectIDs[i] = int(id)
	}

	// Fetch subjects for the given IDs
	var SubjectData []handlers.Subject
	query, args, err := sqlx.In("SELECT id, name, degree, author_id FROM subject WHERE id IN (?)", subjectIDs)
	if err != nil {
		utils.HandleError(ctx, err, "Failed to prepare subject query", http.StatusInternalServerError)
		return
	}
	query = db.DB.Rebind(query)

	err = db.DB.Select(&SubjectData, query, args...)
	if err != nil {
		utils.HandleError(ctx, err, "Failed to fetch subjects", http.StatusInternalServerError)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data":  SubjectData,
		"count": len(SubjectData),
	})
}
func HandleSubjectDeletion(ctx *gin.Context) {
	SubjectID := ctx.Param("id")

	_, err := db.DB.Exec("DELETE FROM subject WHERE id = $1", SubjectID)
	if err != nil {
		utils.HandleError(ctx, err, "Failed to remove the subject", http.StatusBadRequest)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Subject was successfully removed"})
}
func HandleClassAdjustment(ctx *gin.Context) {
	StudentID := ctx.Param("id")
	ClassID := ctx.Param("class_id")

	_, err := db.DB.Exec(`UPDATE student_account SET class_id = $1 WHERE id = $2`, ClassID, StudentID)
	if err != nil {
		utils.HandleError(ctx, err, "Failed to change the class", http.StatusBadRequest)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Class was successfully updated"})
}
func UploadViaCSV(ctx *gin.Context) {
	err := ctx.Request.ParseMultipartForm(10 << 20) // Max file size of 10MB
	if err != nil {
		utils.HandleError(ctx, err, "Failed to parse form", http.StatusBadRequest)
		return
	}

	fileHeader, err := ctx.FormFile("file")
	if err != nil {
		utils.HandleError(ctx, err, "Failed to get the file", http.StatusBadRequest)
		return
	}

	file, err := fileHeader.Open()
	if err != nil {
		utils.HandleError(ctx, err, "Failed to open the file", http.StatusInternalServerError)
		return
	}
	defer file.Close()

	reader := csv.NewReader(file)
	records, err := reader.ReadAll()

	if err != nil {
		utils.HandleError(ctx, err, "Failed to read the CSV", http.StatusInternalServerError)
		return
	}

	// Define the expected CSV columns
	keys := []string{
		"name", "email", "author_id",
	}

	var data []map[string]string

	// Process CSV records
	for _, record := range records {
		if len(record) < len(keys) {
			continue // Skip invalid records
		}

		row := make(map[string]string)
		for i, key := range keys {
			row[key] = record[i]
		}
		data = append(data, row)

	}

	salt, err := utils.GenerateSalt()
	if err != nil {
		utils.HandleError(ctx, err, "Failed to generate salt", http.StatusInternalServerError)
		return
	}

	// Insert students into the database
	var insertCount int
	for _, row := range data {
		hashedPassword, err := scrypt.Key([]byte(row["password"]), salt, 16384, 8, 1, 32)
		if err != nil {
			utils.HandleError(ctx, err, "Failed to hash password", http.StatusInternalServerError)
			return
		}

		// Encode salt and password
		saltBase64 := base64.StdEncoding.EncodeToString(salt)
		hashedPasswordBase64 := base64.StdEncoding.EncodeToString(hashedPassword)
		genID := uuid.New().String()

		authorID, err := strconv.Atoi(ctx.Param("author_id"))
		if err != nil {
			utils.HandleError(ctx, err, "Invalid author ID format", http.StatusBadRequest)
			return
		}

		_, err = db.DB.Exec(`INSERT INTO student_account (name, email, password, salt, gen_id, author_id) 
			VALUES ($1, $2, $3, $4, $5, $6)`,
			row["name"], row["email"], hashedPasswordBase64, saltBase64, genID, authorID)

		if err != nil {
			log.Printf("Database Error: %v\n", err)
			utils.HandleError(ctx, nil, "An error occurred while inserting into the database", http.StatusInternalServerError)
			return
		}
		insertCount++
	}

	// Send response back to the client
	ctx.JSON(http.StatusOK, gin.H{"message": "CSV uploaded and parsed successfully", "count": insertCount})
}
