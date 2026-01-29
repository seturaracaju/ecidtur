
-- Criação do Bucket para Assets de Formulário (Logos e Backgrounds)
insert into storage.buckets (id, name, public)
values ('form-assets', 'form-assets', true)
on conflict (id) do nothing;

-- Política de Upload (Permitir qualquer usuário autenticado fazer upload)
create policy "Authenticated users can upload form assets"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'form-assets' );

-- Política de Leitura Pública (Para que o formulário público possa exibir as imagens)
create policy "Public access to form assets"
on storage.objects for select
to public
using ( bucket_id = 'form-assets' );
