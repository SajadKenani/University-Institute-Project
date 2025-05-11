package endpoints

import (
	"Backend/db"
	"Backend/handlers"

	"database/sql"

	"Backend/utils"
	"encoding/base64"

	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"golang.org/x/crypto/scrypt"
)

func HandleAccountCreation(ctx *gin.Context) {
	var Acocount handlers.AdminAccount

	// Bind JSON body to requestBody
	if err := ctx.ShouldBindJSON(&Acocount); err != nil {
		utils.HandleError(ctx, err, "Invalid request data", http.StatusBadRequest)
		return
	}

	status := utils.HandlePhoneValidation(ctx, Acocount.PhoneNumber)
	if status != http.StatusAccepted {
		utils.HandleError(ctx, nil, "Phone number already exist", http.StatusBadRequest)
		return
	}

	// Generate salt and hash password
	salt, err := utils.GenerateSalt()
	if err != nil {
		utils.HandleError(ctx, err, "Failed to generate salt", http.StatusInternalServerError)
		return
	}

	hashedPassword, err := scrypt.Key([]byte(Acocount.Password), salt, 16384, 8, 1, 32)
	if err != nil {
		utils.HandleError(ctx, err, "Failed to hash password", http.StatusInternalServerError)
		return
	}

	// Encode salt and password
	saltBase64 := base64.StdEncoding.EncodeToString(salt)
	hashedPasswordBase64 := base64.StdEncoding.EncodeToString(hashedPassword)
	genID := uuid.New().String()

	var id int
	// Insert into database
	err = db.DB.QueryRow(`
		INSERT INTO admin_account (name, password, phone_number, role, salt, gen_id)
		VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
		Acocount.Name, hashedPasswordBase64, Acocount.PhoneNumber, Acocount.Role, saltBase64, genID).Scan(&id)
	if err != nil {
		utils.HandleError(ctx, err, "Database insertion error", http.StatusInternalServerError)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"status": true, "message": "Sign-in successful", "value": id})
}
func HandleAccountsFetching(ctx *gin.Context) {
	var Acocount []handlers.AdminAccount

	err := db.DB.Select(&Acocount, "SELECT id, name, phone_number, role, gen_id, is_active FROM admin_account")

	if err != nil {
		utils.HandleError(ctx, err, "Database query failed", http.StatusInternalServerError)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "acccount data was fetched", "data": Acocount})
}
func HandleUserSignInProcess(ctx *gin.Context) {
	var requestBody struct {
		Phone    string `json:"phone_number"`
		Password string `json:"password"`
	}

	// Bind JSON body to requestBody
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
		Is_active  bool
		Email    string
	}
	

	// Query the database for user credentials
	err := db.DB.QueryRow(`SELECT id, phone_number, password, salt, name, limits, status, action_date, is_active 
	FROM admin_account WHERE phone_number = $1 LIMIT 1`,
		requestBody.Phone).Scan(&storedAccount.ID, &storedAccount.PhoneNumber, &storedAccount.Password,
		&storedAccount.Salt, &storedAccount.Name, &storedAccount.Limits, &storedAccount.Status, 
		&storedAccount.Action_date, &storedAccount.Is_active)

	utils.HandleCooldown(ctx, storedAccount, "admin_account")
	

	if !storedAccount.Is_active {
		if storedAccount.Status == "suspect"{
			ctx.JSON(http.StatusInternalServerError, 
				gin.H{"limit_issue_one_hour": "يجب ان تنتظر لمدة ساعة للمحاولة مرة اخرة"})
		} else if storedAccount.Status == "danger" {
			ctx.JSON(http.StatusInternalServerError, 
				gin.H{"limit_issue_five_hours": "يجب ان تنتظر لمدة 5 ساعات للمحاولة مرة اخرة"})
		} else {ctx.JSON(http.StatusInternalServerError,
				gin.H{"limit_issue": "لقد تم قفل حسابك، الرجاء التواصل مع الدعم الفني"})}
		return
	}

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		} else {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		}
		return
	}

	// Decode the stored salt from Base64
	storedSalt, err := base64.StdEncoding.DecodeString(storedAccount.Salt)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid salt format"})
		return
	}

	// Hash input password using decoded salt
	inputHash, err := scrypt.Key([]byte(requestBody.Password), storedSalt, 16384, 8, 1, 32)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Password hashing error"})
		return
	}

	// Convert input hash to Base64
	inputHashBase64 := base64.StdEncoding.EncodeToString(inputHash)

	// Compare the hashed passwords
	if storedAccount.Password != inputHashBase64 {
		leftAttempts := utils.HandleLimitAndStatus(ctx, storedAccount, "admin_account")
		ctx.JSON(http.StatusInternalServerError, gin.H{"password_issue": "كلمة المرور غير صحيحة", "leftAttempts": leftAttempts, "error": "err"})

		return
	}

	token, err := utils.GenerateJWT(storedAccount.PhoneNumber)
	if err != nil {
		utils.HandleError(ctx, err, "Failed to generate the Token", http.StatusBadRequest)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"status": true, "message": "Sign-in successful", "value": storedAccount.ID, "token": token})
}
func HandleGettingUserAccount(ctx *gin.Context) {
	var requestBody struct {
		ID int `json:"id"`
	}

	// Bind JSON body to requestBody
	if err := ctx.ShouldBindJSON(&requestBody); err != nil {
		utils.HandleError(ctx, err, "Invalid request format", http.StatusBadRequest)
		return
	}

	var Acocount []handlers.AdminAccount

	err := db.DB.Select(&Acocount, "SELECT id, name, phone_number, role FROM admin_account WHERE id = $1 LIMIT 1", requestBody.ID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			ctx.JSON(http.StatusNotFound, gin.H{"message": "User not fount"})
		} else {
			utils.HandleError(ctx, err, "Database query failed", http.StatusInternalServerError)
		}
		return
	}

	token, err := utils.GenerateJWT(Acocount[0].PhoneNumber)
	if err != nil {
		utils.HandleError(ctx, err, "Failed to generate the Token", http.StatusBadRequest)
		return
	}

	// If no error, phone number exists
	ctx.JSON(http.StatusOK, gin.H{"message": "acccount data was fetched", "data": Acocount, "token": token})
}
func HandleStatusUpdate(ctx *gin.Context) {
	var requestBody struct {
		ID int `json:"id"`
	}

	// Parse and validate request body
	if err := ctx.ShouldBindJSON(&requestBody); err != nil {
		utils.HandleError(ctx, err, "Invalid request format", http.StatusBadRequest)
		return
	}

	// Fetch current status from the database
	var currentStatus bool
	err := db.DB.Get(&currentStatus, "SELECT is_active FROM admin_account WHERE id = $1", requestBody.ID)
	if err != nil {
		utils.HandleError(ctx, err, "Failed to retrieve current is_active", http.StatusInternalServerError)
		return
	}

	// Flip the status
	newStatus := !currentStatus

	// Update the status in the database
	result, err := db.DB.Exec("UPDATE admin_account SET is_active = $1 WHERE id = $2", newStatus, requestBody.ID)
	if err != nil {
		utils.HandleError(ctx, err, "Failed to update is_active", http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		utils.HandleError(ctx, errors.New("no rows affected"), "Account not found", http.StatusNotFound)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message":    "Status successfully toggled!",
		"new_status": newStatus,
		"account_id": requestBody.ID,
		"status": 200,
	})
}
func HandleAccountDeletion(ctx *gin.Context) {
	ID := ctx.Param("id")

	_, err := db.DB.Exec("DELETE FROM admin_account WHERE id = $1", ID)
	if err != nil {
		utils.HandleError(ctx, err, "Invalid request format", http.StatusBadRequest)
		return
	}

	ctx.JSON(http.StatusAccepted, gin.H{"message": "Account was successfully deleted!"})
}
