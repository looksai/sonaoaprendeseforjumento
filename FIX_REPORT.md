# FIX REPORT — realtime-connect final patch

## O que foi corrigido

1. **Supabase client SSR/Lovable-safe**
   - `src/integrations/supabase/client.ts` foi refeito para evitar erro no preview do Lovable com `navigator.locks` / `LockManager.request`.
   - Adicionado `inMemoryLock` compatível com iframe/preview.
   - Adicionado guard para `localStorage` em SSR (`typeof window !== 'undefined'`).

2. **Migração base mais robusta**
   - A migration base agora usa `DROP POLICY IF EXISTS` antes de recriar policies.
   - Isso reduz erro quando o Supabase/Lovable já criou parte das policies em tentativa anterior.

3. **Social alinhado ao produto**
   - Removida a sala `Séries e música` do Social, mantendo o Social focado em:
     - `Bate-papo Geral`
     - `Pronúncia sem vergonha`
     - `MSN da Galera` privado
   - A feature de séries continua existindo na rota `/series`, fora do Social.

4. **Phase 2.5 preparada**
   - Adicionada migration nova:
     - `message_reactions`
     - enum `reaction_target`
     - cleanup triggers para reações órfãs
     - bucket `stickers`
     - `sticker_packs`
     - `stickers`
     - storage policies para uploads em `users/{auth.uid()}/...`
   - Atualizado `src/integrations/supabase/types.ts` para refletir as novas tabelas/enums.

## Importante

Não foi possível rodar `npm install`/`vite build` localmente porque a instalação das dependências excedeu o tempo do ambiente. A auditoria foi feita por inspeção estática e os pontos conhecidos de erro foram corrigidos diretamente no código e nas migrations.

## Como subir

1. Suba este ZIP no projeto Lovable correto / repo TanStack Start.
2. Deixe o Lovable instalar dependências.
3. Rode migrations no Lovable Cloud/Supabase.
4. Teste:
   - `/welcome`
   - `/auth`
   - `/social`
   - `/conversar`
   - `/series`
   - `/perfil`

