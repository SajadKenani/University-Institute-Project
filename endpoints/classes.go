package endpoints

import (
	"Backend/db"
	"Backend/handlers"
	"Backend/utils"

	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func HandleClassInsertion(ctx *gin.Context) {
	var class handlers.Class
	err := ctx.ShouldBindJSON(&class)
	if err != nil {
		utils.HandleError(ctx, err, "Invalid request format", http.StatusBadRequest)
		return
	}

	_, err = db.DB.Exec(`INSERT INTO class (name, author_id) VALUES ($1, $2)`, class.Name, class.AuthorID)
	if err != nil {
		utils.HandleError(ctx, err, "Failed to insert the data", http.StatusBadRequest)
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"message": "Class created successfully"})
}
func HandleClassesFetching(ctx *gin.Context) {
	var classes []handlers.Class

	err := db.DB.Select(&classes, `SELECT id, name FROM class`)
	if err != nil {
		utils.HandleError(ctx, err, "Failed to fetch from the database", http.StatusBadRequest)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": classes})
}
func HandleClassDeletion(ctx *gin.Context) {
	_, err := db.DB.Exec("DELETE FROM class WHERE id = $1", ctx.Param("id"))
	if err != nil {
		utils.HandleError(ctx, err, "Failed to fetch from the database", http.StatusBadRequest)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Class deleted successfully"})
}
func SettingStudentsToClasses(ctx *gin.Context) {
	var students []handlers.Student
	if err := db.DB.Select(&students, "SELECT id, name FROM student_account"); err != nil {
		utils.HandleError(ctx, err, "Failed to fetch students", http.StatusBadRequest)
		return
	}

	var classIDs []int
	if err := db.DB.Select(&classIDs, "SELECT id FROM class"); err != nil {
		utils.HandleError(ctx, err, "Failed to fetch classes", http.StatusBadRequest)
		return
	}

	batchSize, err := strconv.Atoi(ctx.Param("counter"))
	if err != nil || batchSize <= 0 {
		utils.HandleError(ctx, err, "Invalid counter parameter", http.StatusBadRequest)
		return
	}

	classIndex := 0
	for i, student := range students {
		// Increase classIndex every batchSize students
		if i > 0 && i%batchSize == 0 {
			classIndex++
		}

		classID := classIDs[classIndex % len(classIDs)]

		_, err := db.DB.Exec(`UPDATE student_account SET class_id = $1 WHERE id = $2`, classID, student.ID)
		if err != nil {
			utils.HandleError(ctx, err, "Failed to update student", http.StatusBadRequest)
			return
		}
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Students assigned in batches to classes"})
}
