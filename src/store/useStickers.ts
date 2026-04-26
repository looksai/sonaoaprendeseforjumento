import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";

export type StickerItem = {
  id: string;
  packId: string;
  url: string;
  alt: string;
  sortOrder: number;
};

type StickerState = {
  stickers: StickerItem[];
  loading: boolean;
  hydrate: () => Promise<void>;
  uploadSticker: (file: File) => Promise<StickerItem | null>;
};

type StickerRow = {
  id: string;
  pack_id: string;
  storage_path: string;
  alt: string | null;
  sort_order: number;
};

const MAX_STICKER_BYTES = 520 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/webp", "image/gif", "image/jpeg"]);

function publicUrl(path: string) {
  const { data } = supabase.storage.from("stickers").getPublicUrl(path);
  return data.publicUrl;
}

function rowToSticker(row: StickerRow): StickerItem {
  return {
    id: row.id,
    packId: row.pack_id,
    url: publicUrl(row.storage_path),
    alt: row.alt ?? "sticker",
    sortOrder: row.sort_order,
  };
}

async function ensureUserPack(userId: string) {
  const packId = `user-${userId}`;
  await supabase.from("sticker_packs").upsert({
    id: packId,
    name: "Minhas figurinhas",
    owner_id: userId,
    is_public: true,
  });
  return packId;
}

export const useStickers = create<StickerState>()((set, get) => ({
  stickers: [],
  loading: false,
  hydrate: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from("stickers")
        .select("id, pack_id, storage_path, alt, sort_order")
        .order("sort_order", { ascending: true })
        .limit(300);
      if (error) {
        console.warn("[useStickers] hydrate failed", error);
        return;
      }
      set({ stickers: ((data ?? []) as StickerRow[]).map(rowToSticker) });
    } catch (err) {
      console.warn("[useStickers] hydrate exception", err);
    } finally {
      set({ loading: false });
    }
  },
  uploadSticker: async (file) => {
    if (!ALLOWED_TYPES.has(file.type)) {
      window.alert("Use PNG, WEBP, GIF ou JPG para a figurinha.");
      return null;
    }
    if (file.size > MAX_STICKER_BYTES) {
      window.alert("Essa figurinha está pesada. Use uma imagem com até 500KB.");
      return null;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) return null;
    try {
      const packId = await ensureUserPack(userId);
      const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
      const path = `users/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const upload = await supabase.storage.from("stickers").upload(path, file, {
        cacheControl: "31536000",
        upsert: false,
        contentType: file.type,
      });
      if (upload.error) throw upload.error;
      const { data, error } = await supabase
        .from("stickers")
        .insert({
          pack_id: packId,
          storage_path: path,
          alt: file.name.replace(/\.[^.]+$/, "") || "Minha figurinha",
          sort_order: Date.now(),
        })
        .select("id, pack_id, storage_path, alt, sort_order")
        .single();
      if (error) throw error;
      const sticker = rowToSticker(data as StickerRow);
      set({ stickers: [sticker, ...get().stickers] });
      return sticker;
    } catch (err) {
      console.warn("[useStickers] upload failed", err);
      window.alert("Não consegui salvar a figurinha agora. Tenta novamente em instantes.");
      return null;
    }
  },
}));

if (typeof window !== "undefined") {
  void useStickers.getState().hydrate();
  supabase.auth.onAuthStateChange((event) => {
    if (event !== "SIGNED_OUT") void useStickers.getState().hydrate();
  });
}
