package utils

import (

	"database/sql"

	"errors"
	"slices"
	"strconv"

	"reflect"
	
	"math/rand"
	
	"Backend/db"

	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"

	"golang.org/x/crypto/bcrypt"
)


func DeferTransaction(tx *sqlx.Tx, ctx *gin.Context, err *error) {
	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback() // Rollback on panic
			log.Printf("Transaction rolled back due to panic: %v", p)
			panic(p)
		} else if *err != nil {
			_ = tx.Rollback() // Rollback on error
			log.Printf("Transaction rolled back due to error: %v", *err)
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "An error occurred while processing the transaction"})
		} else {
			if commitErr := tx.Commit(); commitErr != nil {
				log.Printf("Failed to commit transaction: %v", commitErr)
				ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
			} else {
				log.Println("Transaction committed successfully")
			}
		}
	}()
}
func SettingData(slice interface{}, mappings map[string]string) {
    sliceVal := reflect.ValueOf(slice)

    if sliceVal.Kind() != reflect.Ptr || sliceVal.Elem().Kind() != reflect.Slice {
        panic("Expected a pointer to a slice")
    }

    sliceElem := sliceVal.Elem()

    for i := 0; i < sliceElem.Len(); i++ {
        item := sliceElem.Index(i)

        for targetField, sourceField := range mappings {
            target := item.FieldByName(targetField)
            source := item.FieldByName(sourceField)

            // Check if fields exist and are settable
            if !target.IsValid() || !source.IsValid() || !target.CanSet() {
                continue
            }

            // Ensure types match before setting the value
            if target.Type() == source.Type() {
                target.Set(source)
            }
        }
    }
}
func HandleError(ctx *gin.Context, err error, message string, statusCode ...int) {
	if err != nil {
		// Default status code is 500 (Internal Server Error)
		code := http.StatusInternalServerError
		if len(statusCode) > 0 {
			code = statusCode[0] // Allow custom status codes
		}

		// Log error details (with message & error stack)
		log.Printf("ERROR: %s | %v", message, err)

		// Handle SQL Errors (MySQL example)
		if sqlErr, ok := err.(*mysql.MySQLError); ok {
			code = http.StatusInternalServerError
			switch sqlErr.Number {
			case 1062: // Duplicate entry
				code = http.StatusConflict
			case 1048: // Column cannot be null
				code = http.StatusBadRequest
			}
		}

		// Return JSON response
		ctx.AbortWithStatusJSON(code, gin.H{
			"error":   message,
			"details": err.Error(),
		})
	}
}
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}
func VerifyPassword(password, hash string) bool {
	if hash == "" {
		log.Println("Error: Empty password hash provided.")
		return false
	}

	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	if err != nil {
		log.Println("Password verification failed:", err) // Log the error for debugging
		return false
	}

	return true
}
func SanitizeDatabaseName(input string) string {
	// Allow only alphanumeric characters and underscores
	validName := ""
	for _, ch := range input {
		if (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9') || ch == '_' {
			validName += string(ch)
		}
	}
	if validName == "" {
		validName = "default_table" // Prevent empty table names
	}
	return validName
}
func ParsePostgresArray(arrayStr string) ([]int, error) {
	arrayStr = strings.Trim(arrayStr, "{}") // Remove `{}` brackets
	stringItems := strings.Split(arrayStr, ",") // Split by comma

	var result []int
	for _, s := range stringItems {
		num, err := strconv.Atoi(s)
		if err != nil {
			return nil, err
		}
		result = append(result, num)
	}

	return result, nil
}
func RemoveIndexFromAnArray(slice []int, i int) []int {
	if i < 0 || i >= len(slice) {
		return slice // Return original if index is out of range
	}
	return slices.Delete(slice, i, i+1) // Merge before and after index
}
func HandlePhoneValidation(ctx *gin.Context, phone string) (status int) {
	// Query the database for the phone number
	var phoneExists string
	err := db.DB.QueryRow("SELECT phone_number FROM admin_account WHERE phone_number = $1 LIMIT 1", phone).Scan(&phoneExists)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			ctx.JSON(http.StatusAccepted, gin.H{"message": "Phone number not found", "status": http.StatusAccepted})
			return http.StatusAccepted
		} else {
			HandleError(ctx, err, "Database query failed", http.StatusInternalServerError)
			return http.StatusInternalServerError
		}
	}

	// If no error, phone number exists
	ctx.JSON(http.StatusOK, gin.H{"message": "Phone number already exists", "status": http.StatusNotAcceptable})
	return http.StatusNotAcceptable
	
}
func GenerateSalt() ([]byte, error) {
	salt := make([]byte, 16) // 16 bytes is recommended
	_, err := rand.Read(salt)
	if err != nil {
		return nil, err
	}
	return salt, nil
}

