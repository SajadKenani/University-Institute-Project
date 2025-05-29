package handlers

type AdminAccount struct {
	ID          int    `json:"id,omitempty" db:"id"`
	Name        string `json:"name" validate:"required" db:"name"`
	Password    string `json:"password" validate:"required,min=8" db:"password"`
	Salt        string `json:"salt" db:"salt"`
	Role        string `json:"role" validate:"required" db:"role"`
	GenID       string `json:"gen_id" db:"gen_id"`
	PhoneNumber string `json:"phone_number" validate:"required" db:"phone_number"`
	Limits      int    `json:"limits" db:"limits"`
	Status      string `json:"status" db:"status"`
	Action_date string `json:"action_date" db:"action_date"`
	Is_active   bool   `json:"is_active" db:"is_active"`
}

type Announcement struct {
	ID         int    `json:"id,omitempty" db:"id"`
	Title      string `json:"title" validate:"required" db:"title"`
	Content    string `json:"content" validate:"required" db:"content"`
	Date       string `json:"date" validate:"required" db:"date"`
	AuthorID   int    `json:"author_id" db:"author_id"`
	AuthorName string `json:"author_name" db:"author_name"`
	Image      string `json:"image" db:"image"`
	Loved      bool   `json:"loved" db:"loved"`
}

type Student struct {
	ID                 int      `json:"id,omitempty" db:"id"`
	Name               string   `json:"name" validate:"required" db:"name"`
	Email              string   `json:"email" validate:"required,email" db:"email"`
	Password           string   `json:"password" validate:"required,min=8" db:"password"`
	Salt               string   `json:"salt" db:"salt"`
	GenID              string   `json:"gen_id" db:"gen_id"`
	AuthorID           int      `json:"author_id" db:"author_id"`
	StudentIDs         []int    `json:"subject_ids" db:"subject_ids"`
	ClassID            *int     `json:"class_id" db:"class_id"`
	Grade              string   `json:"grade" db:"grade"`
	Subjects           []string `json:"subjects" db:"subjects"`
	LovedAnnouncements []int    `json:"loved_announcements" db:"loved_announcements"`
}

type Subject struct {
	ID       int    `json:"id,omitempty" db:"id"`
	Name     string `json:"name" validate:"required" db:"name"`
	AuthorID int    `json:"author_id" db:"author_id"`
	Degree   int    `json:"degree" db:"degree"`
}

type Video struct {
	ID            int    `json:"id,omitempty" db:"id"`
	AuthorID      int    `json:"author_id" db:"author_id"`
	URL           string `json:"url" db:"url"`
	CompressedURL string `json:"compressed_url" db:"compressed_url"`
	GenID         string `json:"gen_id" db:"gen_id"`
	ThumbNail     string `json:"thumbnail" db:"thumbnail"`
	Title         string `json:"title" db:"title"`
	Description   string `json:"description" db:"description"`
	LectureID     int    `json:"lecture_id" db:"lecture_id"`
	CreateAt      string `json:"create_at" db:"create_at"`
}

type Season struct {
	ID           int    `json:"id,omitempty" db:"id"`
	Name         string `json:"name" db:"name"`
	AuthorID     int    `json:"author_id" db:"author_id"`
	Subject      string `json:"subject" db:"subject"`
	SeasonNumber int    `json:"season_number" db:"season_number"`
}

type Lecture struct {
	ID                  int    `json:"id,omitempty" db:"id"`
	Name                string `json:"name" validate:"required" db:"name"`
	AuthorID            int    `json:"author_id" db:"author_id"`
	SeasonID            int    `json:"season_id" db:"season_id"`
	SecretNumber        int    `json:"secret_number" db:"secret_number"`
	Description         string `json:"description" db:"description"`
	AttendenceValitaion int    `json:"is_attendence_valid" db:"is_attendence_valid"`
	StartValidation     string `json:"start_validation" db:"start_validation"`
	EndValidation       string `json:"end_validation" db:"end_validation"`
}

type Class struct {
	ID       int    `json:"id,omitempty" db:"id"`
	Name     string `json:"name" validate:"required" db:"name"`
	AuthorID int    `json:"author_id" db:"author_id"`
}

type Attendence struct {
	ID           int    `json:"id,omitempty" db:"id"`
	AuthorID     int    `json:"author_id" db:"author_id"`
	LectureID    int    `json:"lecture_id" db:"lecture_id"`
	StudentID    int    `json:"student_id" db:"student_id"`
	SecretNumber int    `json:"secret_number" db:"secret_number"`
	SignDate     string `json:"sign_date"`
	LectureName  string `json:"lecture_name"`
	Date         string `json:"date" db:"date"`
}

type Playlist struct {
	ID        int    `json:"id,omitempty" db:"id"`
	AuthorID  int    `json:"author_id" db:"author_id"`
	CreatedAt string `json:"created_at" db:"created_at"`
	Title     string `json:"title" validate:"required" db:"title"`
	Thumbnail string `json:"thumbnail" db:"thumbnail"`
}

type PlaylistVideo struct {
	ID         int `json:"id,omitempty" db:"id"`
	PlaylistID int `json:"playlist_id" db:"playlist_id"`
	VideoID    int `json:"video_id" db:"video_id"`
}
