package endpoints

import (
	"Backend/db"
	"Backend/handlers"
	"Backend/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

func HandleSeasonCreation(ctx *gin.Context) {
	var season handlers.Season
	err := ctx.ShouldBindJSON(&season)
	if err != nil {
		utils.HandleError(ctx, err, "Invalid request format", http.StatusBadRequest)
		return
	}

	_, err = db.DB.Exec(`INSERT INTO season (name, author_id, subject, season_number) VALUES ($1, $2, $3, $4)`,
	season.Name, season.AuthorID, season.Subject, season.SeasonNumber)
	if err != nil {
		utils.HandleError(ctx, err, "Failed to insert the data", http.StatusBadRequest)
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"message": "Season created successfully"})
}

func HandleSeasonsFetching(ctx *gin.Context) {
	var seasons []handlers.Season

	err := db.DB.Select(&seasons, `SELECT id, name, author_id, subject, season_number FROM season WHERE author_id = $1`,
		ctx.Param("id"))
	if err != nil {
		utils.HandleError(ctx, err, "Failed to fetch from the database", http.StatusBadRequest)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": seasons})

}

func HandleSeasonRemoving(ctx *gin.Context) {
	id := ctx.Param("id")
	if id == "" {
		utils.HandleError(ctx, nil, "Invalid season ID", http.StatusBadRequest)
		return
	}

	result, err := db.DB.Exec("DELETE FROM season WHERE id = $1", id)
	if err != nil {
		utils.HandleError(ctx, err, "Failed to delete the season", http.StatusInternalServerError)
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		utils.HandleError(ctx, err, "Failed to verify deletion", http.StatusInternalServerError)
		return
	}

	if rowsAffected == 0 {
		utils.HandleError(ctx, nil, "No season found with the given ID", http.StatusNotFound)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Season deleted successfully"})
}