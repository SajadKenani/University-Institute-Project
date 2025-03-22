package handlers

type AdminAccount struct {
	ID       int    `json:"id,omitempty" db:"id"`
	Name     string `json:"name" validate:"required" db:"name"`
	Password string `json:"password" validate:"required,min=8" db:"password"`
	Salt     string `json:"salt" db:"salt"`
	Role     string `json:"role" validate:"required" db:"role"`
	GenID    string `json:"gen_id" db:"gen_id"`
	PhoneNumber string `json:"phone_number" validate:"required" db:"phone_number"`
}

type Announcement struct {
	ID          int    `json:"id,omitempty" db:"id"`
	Title       string `json:"title" validate:"required" db:"title"`
	Content     string `json:"content" validate:"required" db:"content"`
	Date        string `json:"date" validate:"required" db:"date"`
	AuthorID    int    `json:"author_id" db:"author_id"`
}
