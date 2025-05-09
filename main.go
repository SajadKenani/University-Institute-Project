package main

import (
	"Backend/db" 
	"Backend/endpoints"
	"Backend/utils"

	"fmt"
	"log"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv" 
)

func RecoveryWithLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("🔥 Panic recovered: %v", r)
				c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
					"error":   "Internal server error",
					"details": fmt.Sprintf("%v", r),
					"status":  false,
				})
			}
		}()
		c.Next()
	}
}

func main() {
	// Load .env file
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file")
	}
	
	utils.InitS3()
	// Initialize the product and department database connections
	db.InitDB()
	r := gin.Default()
	r.Use(gin.Logger(), gin.Recovery(), RecoveryWithLogger())
	r.Use(func(c *gin.Context) {
		log.Printf("→ [%s] %s", c.Request.Method, c.Request.URL.Path)
		c.Next()
		log.Printf("← %d %s", c.Writer.Status(), c.FullPath())
	})
	
	r.Static("/uploads", "./uploads")

	// Enable CORS with specific configurations
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"}, // it should accept everything
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Public route for login
	r.POST("/login", utils.LoginHandler)

	// Routes for Products (protected by JWT authentication)
	auth := r.Group("/").Use(utils.AuthenticateMiddleware())
	{
		auth.POST("/api/create-admin-account", endpoints.HandleAccountCreation)
		auth.GET("/api/fetch-accounts", endpoints.HandleAccountsFetching)
		auth.POST("/api/sign-in", endpoints.HandleUserSignInProcess)
		auth.DELETE("/api/delete-account/:id", endpoints.HandleAccountDeletion)
		auth.POST("/api/handle-account-fetching", endpoints.HandleGettingUserAccount)
		auth.POST("/api/update-status", endpoints.HandleStatusUpdate)

		auth.POST("/api/create-announcement", endpoints.HandleAnnouncementCreation)
		auth.GET("/api/announcements/:id", endpoints.HandleSpecifiedAnnouncementFetching)
		auth.DELETE("/api/delete-announcement/:id", endpoints.HandleAnnouncementDeletion)
		auth.POST("/api/fetch-announcements", endpoints.HandleFetchAccordingToAuthorID)

		auth.POST("/api/create-student-account", endpoints.HandleStudentCreation)
		auth.POST("/api/sign-in-student", endpoints.HandleStudentSignInProcess)
		auth.GET("/api/fetch-student-accounts/:id", endpoints.HandleStudentsFetching)
		auth.PUT("/api/update-class/:id/:class_id", endpoints.HandleClassAdjustment)
		auth.GET("/api/fetch-students-registrations/:id", endpoints.HandleStudentsRegesrationsFetching)
		auth.DELETE("/api/delete-student/:id", endpoints.HandleStudentDeletion)
		auth.POST("/api/insert-via-csv/:author_id", endpoints.UploadViaCSV)

		auth.POST("/api/insert-subject", endpoints.HandleSubjectInsertion)
		auth.POST("/api/fetch-subjects", endpoints.HandleSubjectFetching)
		auth.DELETE("/api/delete-subject/:id", endpoints.HandleSubjectDeletion)

		auth.POST("/api/fetch-videos", endpoints.HandleVideosFetching)
		auth.GET("/api/stream-video/:id", endpoints.StreamVideo)
		auth.POST("/api/upload-video", endpoints.UploadVideo)
		auth.DELETE("/api/delete-video/:id", endpoints.HandleVideoRemoving)

		auth.POST("/api/create-season", endpoints.HandleSeasonCreation)
		auth.GET("/api/fetch-seasons/:id", endpoints.HandleSeasonsFetching)
		auth.DELETE("/api/delete-season/:id", endpoints.HandleSeasonRemoving)

		auth.POST("/api/create-lecture", endpoints.HandleLectureCreation)
		auth.GET("/api/fetch-lectures/:id", endpoints.HandleLecturesFetching)
		auth.GET("/api/fetch-all-lectures", endpoints.HandleAllLecturesFetching)
		auth.DELETE("/api/delete-lecture/:id", endpoints.HandleLectureDeletion)
		auth.GET("/api/fetch-specified-lecture/:id", endpoints.HandleFetchingSpecifiedLecture)

		auth.GET("/api/fetch-classes/:id", endpoints.HandleClassesFetching)
		auth.POST("/api/insert-class", endpoints.HandleClassInsertion)
		auth.DELETE("/api/delete-class/:id", endpoints.HandleClassDeletion)
		auth.POST("/api/set-students-to-classes/:counter", endpoints.SettingStudentsToClasses)

		auth.GET("/api/fetch-attendence/:lecture_id", endpoints.HandleAttendenceFetching)
		auth.POST("/api/sign-for-attendence", endpoints.HandleAttendenceProcess)
		auth.POST("/api/sign-manually-for-attendence", endpoints.HandleManuallyAttendenceProcess)
		auth.POST("/api/lecture-statues-change/:id", endpoints.HandleSettingAttendanceValidation)
		auth.DELETE("/api/cancel-attendance/:id", endpoints.HandleRegistrationCancelling)
	}

	fmt.Println("Server running at http://localhost:8080")
	if err := http.ListenAndServe(":8080", r); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
