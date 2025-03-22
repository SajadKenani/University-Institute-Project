BEGIN;

CREATE TABLE public.admin_account (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    gen_id UUID NOT NULL,
    phone_number TEXT NOT NULL,
    salt TEXT NOT NULL
);

CREATE TABLE public.announcement (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    date DATE NOT NULL,
    author_id INT NOT NULL REFERENCES public.admin_account(id) ON DELETE CASCADE
);

-- Add an index for better query performance on author_id
CREATE INDEX idx_announcement_author ON public.announcement (author_id);

COMMIT;
