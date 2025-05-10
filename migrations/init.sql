BEGIN;

-- Custom type (if needed)
-- CREATE TYPE user_role AS ENUM ('admin', 'editor', 'viewer');

CREATE TABLE public.admin_account (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL, -- user_role if ENUM is used
    gen_id UUID NOT NULL UNIQUE,
    phone_number TEXT NOT NULL,
    salt TEXT NOT NULL,
    limits INT NOT NULL DEFAULT 10 CHECK (limits >= 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspect', 'danger', 'inactive')),
    action_date TIMESTAMP NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE public.subject (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    degree INT NOT NULL,
    author_id INT NOT NULL REFERENCES public.admin_account(id) ON DELETE CASCADE
);

CREATE TABLE public.season (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    season_number INT NOT NULL,
    author_id INT NOT NULL REFERENCES public.admin_account(id) ON DELETE CASCADE
);

CREATE TABLE public.lecture (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    author_id INT NOT NULL REFERENCES public.admin_account(id) ON DELETE CASCADE,
    season_id INT NOT NULL REFERENCES public.season(id) ON DELETE CASCADE,
    secret_number INT NOT NULL UNIQUE,
    is_attendence_valid INT NOT NULL DEFAULT 0 CHECK (is_attendence_valid IN (0, 1)),
    start_validation TIMESTAMP NOT NULL,
    end_validation TIMESTAMP NOT NULL
);

CREATE TABLE public.videos (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    compressed_url TEXT NOT NULL,
    author_id INT NOT NULL REFERENCES public.admin_account(id) ON DELETE CASCADE,
    gen_id UUID NOT NULL,
    thumbnail TEXT NOT NULL,
    description TEXT NOT NULL,
    lecture_id INT NOT NULL REFERENCES public.lecture(id) ON DELETE CASCADE
);

CREATE TABLE public.announcement (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    date DATE NOT NULL,
    author_id INT NOT NULL REFERENCES public.admin_account(id) ON DELETE CASCADE
);

CREATE TABLE public.class (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    author_id INT NOT NULL REFERENCES public.admin_account(id) ON DELETE CASCADE
)

CREATE TABLE public.student_account (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    gen_id UUID NOT NULL UNIQUE,
    phone_number TEXT NOT NULL,
    salt TEXT NOT NULL,
    author_id INT NOT NULL REFERENCES public.admin_account(id) ON DELETE CASCADE,
    class_id INT NULL REFERENCES public.class(id) ON DELETE CASCADE,
    subject_ids INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
    limits INT NOT NULL DEFAULT 10 CHECK (limits >= 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspect', 'danger', 'inactive')),
    action_date TIMESTAMP NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE public.attendence (
    id SERIAL PRIMARY KEY,
    author_id INT NOT NULL REFERENCES public.admin_account(id) ON DELETE CASCADE,
    lecture_id INT NOT NULL REFERENCES public.lecture(id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES public.student_account(id) ON DELETE CASCADE,
    date DATE NOT NULL
)

CREATE TABLE public.playlist (
    id SERIAL PRIMARY KEY,
    author_id INT NOT NULL REFERENCES public.admin_account(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    thumbnail TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE public.playlist_video (
    id SERIAL PRIMARY KEY,
    playlist_id INT NOT NULL REFERENCES public.playlist(id) ON DELETE CASCADE,
    video_id INT NOT NULL REFERENCES public.video(id) ON DELETE CASCADE,
    PRIMARY KEY (playlist_id, video_id)
);

-- Indexes
CREATE INDEX idx_announcement_author ON public.announcement (author_id);
CREATE INDEX idx_student_author ON public.student_account (author_id);
CREATE INDEX idx_lecture_season ON public.lecture (season_id);
CREATE INDEX idx_videos_lecture ON public.videos (lecture_id);

COMMIT;
