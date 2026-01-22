/**
 * Serviço para gerenciar fotos de perfil no Supabase Storage
 */

import { supabase } from '../../config/supabase';
import { logger } from '../../utils/logger';

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
      logger.error('Profile picture upload failed', { error, userId });
      return { ok: false, error: 'Erro ao fazer upload' };
    }

    // Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    logger.info('Profile picture uploaded successfully', { userId, url: publicUrlData.publicUrl });
    return { ok: true, url: publicUrlData.publicUrl };
  } catch (error) {
    logger.error('Error uploading profile picture', { error, userId });
    return { ok: false, error: error instanceof Error ? error.message : 'Upload error' };
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

    logger.info('Deleting profile picture', { userId, filePath });

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      logger.error('Error deleting profile picture from storage', { error, userId });
      return { ok: false, error: error.message };
    }

    logger.info('Profile picture deleted successfully', { userId });
    return { ok: true };
  } catch (error) {
    logger.error('Failed to delete profile picture', { error, userId });
    return { ok: false, error: error instanceof Error ? error.message : 'Delete error' };
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
    logger.info('Updating profile picture URL in database', { userId, hasAvatar: !!avatarUrl });

    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);

    if (error) {
      logger.error('Error updating profile picture URL', { error, userId });
      return { ok: false, error: error.message };
    }

    logger.info('Profile picture URL updated successfully', { userId });
    return { ok: true };
  } catch (error) {
    logger.error('Failed to update profile picture URL', { error, userId });
    return { ok: false, error: error instanceof Error ? error.message : 'Update error' };
  }
}
