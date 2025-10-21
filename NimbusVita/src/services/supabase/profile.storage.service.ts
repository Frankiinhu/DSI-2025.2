/**
 * Serviço para gerenciar fotos de perfil no Supabase Storage
 */

import { supabase } from '../../config/supabase';

const BUCKET_NAME = 'profile-pictures';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

/**
 * Faz upload de uma foto de perfil
 * @param userId - ID do usuário
 * @param fileUri - URI local do arquivo de imagem
 * @returns URL pública da imagem ou null em caso de erro
 */
export async function uploadProfilePicture(
  userId: string,
  fileUri: string
): Promise<{ ok: boolean; url?: string; error?: string }> {
  try {
    // Criar nome único para o arquivo
    const fileExtension = fileUri.split('.').pop() || 'jpg';
    const fileName = `${userId}_${Date.now()}.${fileExtension}`;
    const filePath = `${userId}/${fileName}`;

    // Ler o arquivo usando FormData (compatível com React Native)
    const formData = new FormData();
    
    // @ts-ignore - React Native FormData aceita objetos com uri, type e name
    formData.append('file', {
      uri: fileUri,
      type: `image/${fileExtension}`,
      name: fileName,
    });

    // Fazer upload usando fetch diretamente
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { ok: false, error: 'Usuário não autenticado' };
    }

    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${filePath}`;
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Erro no upload:', error);
      return { ok: false, error: 'Erro ao fazer upload' };
    }

    // Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return { ok: true, url: publicUrlData.publicUrl };
  } catch (error: any) {
    console.error('Erro ao fazer upload da foto:', error);
    return { ok: false, error: error.message };
  }
}

/**
 * Deleta a foto de perfil atual
 * @param userId - ID do usuário
 * @param fileUrl - URL da foto a ser deletada
 */
export async function deleteProfilePicture(
  userId: string,
  fileUrl: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    // Extrair caminho do arquivo da URL
    const urlParts = fileUrl.split('/');
    const filePath = `${userId}/${urlParts[urlParts.length - 1]}`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Erro ao deletar foto:', error);
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (error: any) {
    console.error('Erro ao deletar foto:', error);
    return { ok: false, error: error.message };
  }
}

/**
 * Atualiza a URL da foto de perfil no banco de dados
 * @param userId - ID do usuário
 * @param avatarUrl - Nova URL da foto
 */
export async function updateProfilePictureUrl(
  userId: string,
  avatarUrl: string | null
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);

    if (error) {
      console.error('Erro ao atualizar URL da foto:', error);
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (error: any) {
    console.error('Erro ao atualizar URL:', error);
    return { ok: false, error: error.message };
  }
}
