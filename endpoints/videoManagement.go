package endpoints

import (
	"Backend/db"
	"Backend/handlers"
	"Backend/utils"

	"io"
	"log"
	"net/http"
	"os"

	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func UploadVideo(ctx *gin.Context) {
	if !strings.HasPrefix(ctx.ContentType(), "multipart/form-data") {
		utils.HandleError(ctx, nil, "Invalid content type", http.StatusBadRequest)
		return
	}

	// === Get video file ===
	videoFile, videoHeader, err := ctx.Request.FormFile("video")
	if err != nil {
		utils.HandleError(ctx, nil, "Unable to retrieve video file", http.StatusInternalServerError)
		return
	}
	defer videoFile.Close()

	log.Printf("Received video file: %v", videoHeader.Filename)

	// === Ensure uploads directory exists ===
	if err := os.MkdirAll("./uploads", os.ModePerm); err != nil {
		utils.HandleError(ctx, nil, "Failed to create upload directory", http.StatusInternalServerError)
		return
	}

	// === Save uploaded video locally ===
	tempID := uuid.New().String()
	localPath := "./uploads/" + tempID + "_" + videoHeader.Filename
	out, err := os.Create(localPath)
	if err != nil {
		utils.HandleError(ctx, nil, "Failed to save uploaded video", http.StatusInternalServerError)
		return
	}
	defer out.Close()

	log.Printf("Received path: %v", localPath)

	if _, err = io.Copy(out, videoFile); err != nil {
		utils.HandleError(ctx, nil, "Failed to write video file", http.StatusInternalServerError)
		return
	}

	// === Upload original to S3 ===
	originalS3Key := tempID + ".mp4"
	originalFile, err := os.Open(localPath)
	if err != nil {
		utils.HandleError(ctx, nil, "Failed to open saved video", http.StatusInternalServerError)
		return
	}
	defer originalFile.Close()

	log.Printf("Received path: %v", localPath)

	if err = utils.UploadToS3(originalFile, originalS3Key); err != nil {
		utils.HandleError(ctx, nil, "Failed to upload original video", http.StatusInternalServerError)
		return
	}

	// === Compress to 360p and upload compressed version ===
	compressedPath := localPath + "_compressed.mp4"
	compressedS3Key, err := utils.UploadCompressedVideo(ctx, localPath, compressedPath)
	if err != nil {
		utils.HandleError(ctx, nil, "Failed to compress or upload video", http.StatusInternalServerError)
		return
	}

	log.Printf("Received compressedS3Key: %v", compressedS3Key)

	// === Get form fields ===
	var video handlers.Video
	video.AuthorID, err = strconv.Atoi(ctx.PostForm("author_id"))
	if err != nil {
		utils.HandleError(ctx, nil, "Invalid author_id format", http.StatusBadRequest)
		return
	}

	video.LectureID, err = strconv.Atoi(ctx.PostForm("lecture_id"))
	if err != nil {
		utils.HandleError(ctx, nil, "Invalid lecture_id format", http.StatusBadRequest)
		return
	}

	video.Title = ctx.PostForm("title")
	video.Description = ctx.PostForm("desc")
	video.GenID = tempID
	video.CreateAt = time.Now().Format("2006-01-02 15:04:05")
	video.URL = originalS3Key

	// === Thumbnail generation ===
	thumbnailPath, err := utils.HandleThumbnailGeneration(ctx, video)
	if err != nil {
		log.Printf("Error generating thumbnail: %v", err)
		utils.HandleError(ctx, nil, "Error generating thumbnail", http.StatusInternalServerError)
		return
	}
	video.ThumbNail = thumbnailPath

	// === Insert into DB ===
	_, err = db.DB.Exec(`
		INSERT INTO videos 
		(url, author_id, gen_id, thumbnail, title, description, lecture_id, create_at, compressed_url)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		video.URL, video.AuthorID, video.GenID, video.ThumbNail,
		video.Title, video.Description, video.LectureID, video.CreateAt, compressedS3Key,
	)
	if err != nil {
		log.Printf("Failed to insert into the database: %v", err)
		utils.HandleError(ctx, nil, "Failed to insert into the database", http.StatusInternalServerError)
		return
	}

	// Success response
	ctx.JSON(http.StatusOK, gin.H{"message": "Video was uploaded and compressed successfully"})
}
func HandleVideosFetching(ctx *gin.Context) {
	var videoRequest handlers.Video

	err := ctx.ShouldBindJSON(&videoRequest)
	if err != nil {
		utils.HandleError(ctx, nil, "Failed to bind with JSON", http.StatusInternalServerError)
		return
	}
	var videos []handlers.Video
	err = db.DB.Select(&videos, "SELECT id, author_id, thumbnail, url, compressed_url, title, create_at from videos WHERE author_id = $1",
		videoRequest.AuthorID)
	if err != nil {
		utils.HandleError(ctx, nil, "Failed to fetch videos from the database", http.StatusInternalServerError)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"videos": videos})

}
func StreamVideo(ctx *gin.Context) {
	videoID := ctx.Param("id")
	// Call GeneratePreSignedURL to get the pre-signed URL
	url, err := utils.GeneratePreSignedURL(videoID)
	if err != nil {
		// Log the error and respond with an appropriate error message
		log.Printf("Error generating pre-signed URL: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate pre-signed URL",
		})
		return
	}

	log.Print(url)

	// Send the pre-signed URL as a JSON response
	ctx.JSON(http.StatusOK, gin.H{
		"url": url,
	})
}
func HandleVideoRemoving(ctx *gin.Context) {
	videoID := ctx.Param("id")

	var video handlers.Video
	err := db.DB.Get(&video, "SELECT url, compressed_url from videos WHERE id = $1", videoID)
	if err != nil {
		utils.HandleError(ctx, nil, "Failed to fetch videos from the database", http.StatusInternalServerError)
		return
	}

	err = utils.HandleVideoRemovingFromAWS(ctx, video.URL, video.CompressedURL)
	if err != nil {
		utils.HandleError(ctx, nil, "Failed to delete the video from AWS", http.StatusInternalServerError)
		return
	}

	_, err = db.DB.Exec(`DELETE FROM videos WHERE id = $1`, videoID)
	if err != nil {
		utils.HandleError(ctx, nil, "Failed to remove from the database", http.StatusInternalServerError)
		return
	}

	ctx.JSON(http.StatusAccepted, gin.H{"message": "Video was removed successfully"})
}

// Playlist Section
func HandlePlaylistCreation(ctx *gin.Context) {
	var playlist handlers.Playlist
	playlist.CreatedAt = time.Now().Format("2006-01-02 15:04:05")

	// === Thumbnail generation ===
	thumbnailPath, err := utils.HandleThumbnailGeneration(ctx, playlist)
	if err != nil {
		log.Printf("Error generating thumbnail: %v", err)
		utils.HandleError(ctx, nil, "Error generating thumbnail", http.StatusInternalServerError)
		return
	}
	playlist.Thumbnail = thumbnailPath

	_, err = db.DB.Exec("INSERT INTO playlist (author_id, title, thumbnail, created_at) VALUES ($1, $2, $3, $4)", 
	ctx.PostForm("author_id"), ctx.PostForm("title"), playlist.Thumbnail, playlist.CreatedAt)
	if err != nil {
		utils.HandleError(ctx, err, "Failed to insert the video into the database", http.StatusInternalServerError)
		return
	}

	ctx.JSON(http.StatusAccepted, gin.H{"message": "Playlist was created successfully!"})
}
func HandlePlaylistsFetching(ctx *gin.Context) {
	var Playlists []handlers.Playlist

	err := db.DB.Select(&Playlists, "SELECT id, author_id, title, thumbnail, created_at FROM playlist WHERE author_id = $1", ctx.Param("author_id"))
	if err != nil {
		utils.HandleError(ctx, err, "Failed to fetch playlists from the database", http.StatusInternalServerError)
		return
	}

	// If no playlists are found for the given author_id
	if len(Playlists) == 0 {
		utils.HandleError(ctx, err, "No playlists found for this author", http.StatusNotFound)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": Playlists})
}
func HandlePlaylistRemoving(ctx *gin.Context) {
	result, err := db.DB.Exec("DELETE FROM playlist WHERE id = $1", ctx.Param("id"))
	if err != nil {
		utils.HandleError(ctx, err, "Failed to delete the playlist from the database", http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		utils.HandleError(ctx, nil, "Announcement not found", http.StatusNotFound)
		return
	}

	ctx.JSON(http.StatusAccepted, gin.H{"message": "Playlist was deleted successfully!"})
}