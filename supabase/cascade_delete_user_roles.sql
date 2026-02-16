BEGIN;

-- 1. Drop the existing foreign key constraint
ALTER TABLE public.user_roles
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- 2. Recreate it with ON DELETE CASCADE
ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

COMMIT;

-- Verification Query
SELECT
    conname AS constraint_name,
    CASE confdeltype
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT'
        WHEN 'r' THEN 'RESTRICT'
        WHEN 'a' THEN 'NO ACTION'
    END AS on_delete_action
FROM pg_constraint
WHERE conname = 'user_roles_user_id_fkey';
