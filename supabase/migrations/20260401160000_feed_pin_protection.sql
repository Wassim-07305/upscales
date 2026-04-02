-- Empeche les non-staff de modifier is_pinned sur feed_posts
-- Seuls admin et coach peuvent epingler/desepingler

CREATE OR REPLACE FUNCTION public.prevent_non_staff_pin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_pinned IS DISTINCT FROM OLD.is_pinned THEN
    IF public.get_my_role() NOT IN ('admin', 'coach') THEN
      RAISE EXCEPTION 'Seul le staff peut epingler/desepingler un post';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_non_staff_pin ON public.feed_posts;
CREATE TRIGGER trg_prevent_non_staff_pin
  BEFORE UPDATE ON public.feed_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_non_staff_pin();

-- Nettoyage : mettre a jour le CHECK constraint post_type pour retirer les types supprimes
ALTER TABLE public.feed_posts DROP CONSTRAINT IF EXISTS feed_posts_post_type_check;
ALTER TABLE public.feed_posts ADD CONSTRAINT feed_posts_post_type_check
  CHECK (post_type IN ('victory', 'question', 'general'));

-- Migrer les anciens posts avec des types supprimes vers 'general'
UPDATE public.feed_posts
SET post_type = 'general'
WHERE post_type NOT IN ('victory', 'question', 'general');

-- Fix: le trigger likes_count doit etre SECURITY DEFINER pour bypasser RLS
-- Sans ca, quand user B like le post de user A, l'UPDATE sur feed_posts
-- est bloque par la policy "Authors can update own posts"
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feed_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feed_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Meme fix pour le trigger comments_count s'il existe
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feed_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feed_posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recalculer les likes_count depuis les donnees reelles
UPDATE public.feed_posts fp
SET likes_count = (SELECT count(*) FROM public.feed_likes fl WHERE fl.post_id = fp.id);
