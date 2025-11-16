import { supabase } from '../../config/supabase';
import { Database, FamilyGroup, FamilyMember, FamilyMemberWithProfile, FamilyGroupWithMembers } from '../../types/database.types';

type FamilyGroupInsert = Database['public']['Tables']['family_groups']['Insert'];
type FamilyMemberInsert = Database['public']['Tables']['family_members']['Insert'];
type SymptomCheckup = Database['public']['Tables']['symptom_checkups']['Row'];

export interface FamilyResponse {
  ok: boolean;
  message?: string;
  data?: any;
}

/**
 * Gera um código de convite único de 8 caracteres
 */
const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Cria um novo grupo familiar
 */
export const createFamilyGroup = async (
  userId: string,
  groupName: string
): Promise<FamilyResponse> => {
  try {
    const inviteCode = generateInviteCode();

    const { data: group, error: groupError } = await supabase
      .from('family_groups')
      .insert({
        name: groupName,
        owner_id: userId,
        invite_code: inviteCode,
      })
      .select()
      .single();

    if (groupError) throw groupError;

    // Adiciona o criador como membro do grupo
    const { error: memberError } = await supabase
      .from('family_members')
      .insert({
        family_group_id: group.id,
        user_id: userId,
        can_view_history: true,
      });

    if (memberError) throw memberError;

    return {
      ok: true,
      message: 'Grupo familiar criado com sucesso!',
      data: group,
    };
  } catch (error: any) {
    console.error('Erro ao criar grupo familiar:', error);
    return {
      ok: false,
      message: error.message || 'Erro ao criar grupo familiar',
    };
  }
};

/**
 * Busca grupo familiar pelo código de convite
 */
export const findFamilyGroupByCode = async (
  inviteCode: string
): Promise<FamilyResponse> => {
  try {
    // 1. Busca o grupo
    const { data: groupData, error: groupError } = await supabase
      .from('family_groups')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase())
      .single();

    if (groupError) throw groupError;

    if (!groupData) {
      return {
        ok: false,
        message: 'Código de convite inválido',
      };
    }

    // 2. Busca membros do grupo
    const { data: membersData, error: membersError } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_group_id', groupData.id);

    if (membersError) throw membersError;

    // 3. Busca profiles dos membros (se houver)
    let membersWithProfiles = [];
    if (membersData && membersData.length > 0) {
      const userIds = membersData.map((m: any) => m.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds);

      membersWithProfiles = membersData.map((member: any) => ({
        ...member,
        profile: profilesData?.find((p: any) => p.id === member.user_id) || {
          username: 'Usuário',
          full_name: null,
          avatar_url: null,
        },
      }));
    }

    return {
      ok: true,
      data: {
        ...groupData,
        members: membersWithProfiles,
      },
    };
  } catch (error: any) {
    console.error('Erro ao buscar grupo:', error);
    return {
      ok: false,
      message: error.message || 'Código de convite inválido',
    };
  }
};

/**
 * Entra em um grupo familiar usando código de convite
 */
export const joinFamilyGroup = async (
  userId: string,
  inviteCode: string
): Promise<FamilyResponse> => {
  try {
    // Busca o grupo pelo código
    const groupResult = await findFamilyGroupByCode(inviteCode);
    if (!groupResult.ok || !groupResult.data) {
      return groupResult;
    }

    const group = groupResult.data;

    // Verifica se já é membro
    const { data: existingMember } = await supabase
      .from('family_members')
      .select('id')
      .eq('family_group_id', group.id)
      .eq('user_id', userId)
      .single();

    if (existingMember) {
      return {
        ok: false,
        message: 'Você já é membro deste grupo',
      };
    }

    // Adiciona como membro
    const { data: member, error } = await supabase
      .from('family_members')
      .insert({
        family_group_id: group.id,
        user_id: userId,
        can_view_history: true,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      ok: true,
      message: `Você entrou no grupo ${group.name}!`,
      data: member,
    };
  } catch (error: any) {
    console.error('Erro ao entrar no grupo:', error);
    return {
      ok: false,
      message: error.message || 'Erro ao entrar no grupo',
    };
  }
};

/**
 * Busca todos os grupos do usuário
 */
export const getUserFamilyGroups = async (
  userId: string
): Promise<FamilyResponse> => {
  try {
    // 1. Busca os grupos do usuário
    const { data: memberData, error: memberError } = await supabase
      .from('family_members')
      .select('family_group_id')
      .eq('user_id', userId);

    if (memberError) throw memberError;
    if (!memberData || memberData.length === 0) {
      return { ok: true, data: [] };
    }

    const groupIds = memberData.map((m: any) => m.family_group_id);

    // 2. Busca detalhes dos grupos
    const { data: groupsData, error: groupsError } = await supabase
      .from('family_groups')
      .select('*')
      .in('id', groupIds);

    if (groupsError) throw groupsError;

    // 3. Busca contagem de membros de cada grupo
    const groupsWithCount = await Promise.all(
      (groupsData || []).map(async (group: any) => {
        const { count } = await supabase
          .from('family_members')
          .select('id', { count: 'exact', head: true })
          .eq('family_group_id', group.id);
        
        return {
          ...group,
          member_count: count || 0,
        };
      })
    );

    return {
      ok: true,
      data: groupsWithCount,
    };
  } catch (error: any) {
    console.error('Erro ao buscar grupos:', error);
    return {
      ok: false,
      message: error.message || 'Erro ao buscar grupos',
      data: [],
    };
  }
};

/**
 * Busca membros de um grupo específico
 */
export const getFamilyMembers = async (
  familyGroupId: string
): Promise<FamilyResponse> => {
  try {
    // 1. Busca membros do grupo
    const { data: membersData, error: membersError } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_group_id', familyGroupId)
      .order('joined_at', { ascending: true });

    if (membersError) throw membersError;
    if (!membersData || membersData.length === 0) {
      return { ok: true, data: [] };
    }

    // 2. Busca profiles dos membros
    const userIds = membersData.map((m: any) => m.user_id);
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, age, gender')
      .in('id', userIds);

    if (profilesError) throw profilesError;

    // 3. Combina dados
    const membersWithProfiles = membersData.map((member: any) => ({
      ...member,
      profile: profilesData?.find((p: any) => p.id === member.user_id) || {
        username: 'Usuário',
        full_name: null,
        avatar_url: null,
      },
    }));

    return {
      ok: true,
      data: membersWithProfiles,
    };
  } catch (error: any) {
    console.error('Erro ao buscar membros:', error);
    return {
      ok: false,
      message: error.message || 'Erro ao buscar membros',
      data: [],
    };
  }
};

/**
 * Busca histórico de verificações de um membro da família
 */
export const getMemberCheckupHistory = async (
  memberId: string,
  familyGroupId: string,
  currentUserId: string,
  limit: number = 20
): Promise<FamilyResponse> => {
  try {
    // Verifica se o usuário atual tem permissão para ver o histórico
    const { data: currentMember, error: permissionError } = await supabase
      .from('family_members')
      .select('can_view_history')
      .eq('family_group_id', familyGroupId)
      .eq('user_id', currentUserId)
      .single();

    if (permissionError || !currentMember?.can_view_history) {
      return {
        ok: false,
        message: 'Você não tem permissão para ver o histórico',
        data: [],
      };
    }

    // Busca as verificações do membro
    const { data, error } = await supabase
      .from('symptom_checkups')
      .select('*')
      .eq('user_id', memberId)
      .order('checkup_date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return {
      ok: true,
      data,
    };
  } catch (error: any) {
    console.error('Erro ao buscar histórico:', error);
    return {
      ok: false,
      message: error.message || 'Erro ao buscar histórico',
      data: [],
    };
  }
};

/**
 * Remove um membro do grupo (apenas o dono pode remover)
 */
export const removeFamilyMember = async (
  familyGroupId: string,
  memberUserId: string,
  currentUserId: string
): Promise<FamilyResponse> => {
  try {
    // Verifica se o usuário atual é o dono do grupo
    const { data: group, error: groupError } = await supabase
      .from('family_groups')
      .select('owner_id')
      .eq('id', familyGroupId)
      .single();

    if (groupError) throw groupError;

    if (group.owner_id !== currentUserId) {
      return {
        ok: false,
        message: 'Apenas o criador do grupo pode remover membros',
      };
    }

    // Não permite remover o próprio dono
    if (memberUserId === currentUserId) {
      return {
        ok: false,
        message: 'Você não pode se remover do próprio grupo',
      };
    }

    // Remove o membro
    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('family_group_id', familyGroupId)
      .eq('user_id', memberUserId);

    if (error) throw error;

    return {
      ok: true,
      message: 'Membro removido com sucesso',
    };
  } catch (error: any) {
    console.error('Erro ao remover membro:', error);
    return {
      ok: false,
      message: error.message || 'Erro ao remover membro',
    };
  }
};

/**
 * Sair de um grupo familiar
 */
export const leaveFamilyGroup = async (
  familyGroupId: string,
  userId: string
): Promise<FamilyResponse> => {
  try {
    // Verifica se é o dono
    const { data: group } = await supabase
      .from('family_groups')
      .select('owner_id')
      .eq('id', familyGroupId)
      .single();

    if (group?.owner_id === userId) {
      return {
        ok: false,
        message: 'O criador do grupo não pode sair. Você deve deletar o grupo.',
      };
    }

    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('family_group_id', familyGroupId)
      .eq('user_id', userId);

    if (error) throw error;

    return {
      ok: true,
      message: 'Você saiu do grupo com sucesso',
    };
  } catch (error: any) {
    console.error('Erro ao sair do grupo:', error);
    return {
      ok: false,
      message: error.message || 'Erro ao sair do grupo',
    };
  }
};

/**
 * Deleta um grupo familiar (apenas o dono pode deletar)
 */
export const deleteFamilyGroup = async (
  familyGroupId: string,
  userId: string
): Promise<FamilyResponse> => {
  try {
    const { data: group, error: groupError } = await supabase
      .from('family_groups')
      .select('owner_id')
      .eq('id', familyGroupId)
      .single();

    if (groupError) throw groupError;

    if (group.owner_id !== userId) {
      return {
        ok: false,
        message: 'Apenas o criador pode deletar o grupo',
      };
    }

    // Deleta todos os membros primeiro
    await supabase
      .from('family_members')
      .delete()
      .eq('family_group_id', familyGroupId);

    // Deleta o grupo
    const { error } = await supabase
      .from('family_groups')
      .delete()
      .eq('id', familyGroupId);

    if (error) throw error;

    return {
      ok: true,
      message: 'Grupo deletado com sucesso',
    };
  } catch (error: any) {
    console.error('Erro ao deletar grupo:', error);
    return {
      ok: false,
      message: error.message || 'Erro ao deletar grupo',
    };
  }
};

/**
 * Atualiza permissões de um membro
 */
export const updateMemberPermissions = async (
  familyGroupId: string,
  memberUserId: string,
  currentUserId: string,
  canViewHistory: boolean
): Promise<FamilyResponse> => {
  try {
    // Verifica se o usuário atual é o dono
    const { data: group, error: groupError } = await supabase
      .from('family_groups')
      .select('owner_id')
      .eq('id', familyGroupId)
      .single();

    if (groupError) throw groupError;

    if (group.owner_id !== currentUserId) {
      return {
        ok: false,
        message: 'Apenas o criador pode alterar permissões',
      };
    }

    const { error } = await supabase
      .from('family_members')
      .update({ can_view_history: canViewHistory })
      .eq('family_group_id', familyGroupId)
      .eq('user_id', memberUserId);

    if (error) throw error;

    return {
      ok: true,
      message: 'Permissões atualizadas',
    };
  } catch (error: any) {
    console.error('Erro ao atualizar permissões:', error);
    return {
      ok: false,
      message: error.message || 'Erro ao atualizar permissões',
    };
  }
};

/**
 * Busca perfil público de usuário por username (para adicionar à família)
 */
export const searchUserByUsername = async (
  username: string
): Promise<FamilyResponse> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .ilike('username', `%${username}%`)
      .limit(10);

    if (error) throw error;

    return {
      ok: true,
      data,
    };
  } catch (error: any) {
    console.error('Erro ao buscar usuário:', error);
    return {
      ok: false,
      message: error.message || 'Erro ao buscar usuário',
      data: [],
    };
  }
};

/**
 * Tags predefinidas para relações familiares
 */
export const PREDEFINED_TAGS = [
  'Mãe',
  'Pai',
  'Filho',
  'Filha',
  'Irmão',
  'Irmã',
  'Avô',
  'Avó',
  'Tio',
  'Tia',
  'Primo',
  'Prima',
  'Sobrinho',
  'Sobrinha',
  'Neto',
  'Neta',
  'Cônjuge',
  'Companheiro(a)',
];

/**
 * Adiciona tags a um membro do grupo
 */
export const addMemberTags = async (
  memberId: string,
  tags: string[],
  currentUserId: string,
  familyGroupId: string
): Promise<FamilyResponse> => {
  try {
    // Verifica se o usuário é membro do grupo
    const { data: membership, error: membershipError } = await supabase
      .from('family_members')
      .select('id')
      .eq('family_group_id', familyGroupId)
      .eq('user_id', currentUserId)
      .single();

    if (membershipError || !membership) {
      return {
        ok: false,
        message: 'Você não tem permissão para editar tags neste grupo',
      };
    }

    // Busca as tags atuais do membro
    const { data: member, error: fetchError } = await supabase
      .from('family_members')
      .select('member_tags')
      .eq('id', memberId)
      .single();

    if (fetchError) throw fetchError;

    // Combina as tags existentes com as novas (sem duplicatas)
    const currentTags = member.member_tags || [];
    const uniqueTags = Array.from(new Set([...currentTags, ...tags]));

    // Atualiza as tags
    const { error: updateError } = await supabase
      .from('family_members')
      .update({ member_tags: uniqueTags })
      .eq('id', memberId);

    if (updateError) throw updateError;

    return {
      ok: true,
      message: 'Tags adicionadas com sucesso!',
      data: { member_tags: uniqueTags },
    };
  } catch (error: any) {
    console.error('Erro ao adicionar tags:', error);
    return {
      ok: false,
      message: error.message || 'Erro ao adicionar tags',
    };
  }
};

/**
 * Remove tags de um membro do grupo
 */
export const removeMemberTags = async (
  memberId: string,
  tagsToRemove: string[],
  currentUserId: string,
  familyGroupId: string
): Promise<FamilyResponse> => {
  try {
    // Verifica se o usuário é membro do grupo
    const { data: membership, error: membershipError } = await supabase
      .from('family_members')
      .select('id')
      .eq('family_group_id', familyGroupId)
      .eq('user_id', currentUserId)
      .single();

    if (membershipError || !membership) {
      return {
        ok: false,
        message: 'Você não tem permissão para editar tags neste grupo',
      };
    }

    // Busca as tags atuais do membro
    const { data: member, error: fetchError } = await supabase
      .from('family_members')
      .select('member_tags')
      .eq('id', memberId)
      .single();

    if (fetchError) throw fetchError;

    // Remove as tags especificadas
    const currentTags = member.member_tags || [];
    const updatedTags = currentTags.filter(
      (tag: string) => !tagsToRemove.includes(tag) && tag !== 'Dono'
    ); // Protege a tag "Dono"

    // Atualiza as tags
    const { error: updateError } = await supabase
      .from('family_members')
      .update({ member_tags: updatedTags })
      .eq('id', memberId);

    if (updateError) throw updateError;

    return {
      ok: true,
      message: 'Tags removidas com sucesso!',
      data: { member_tags: updatedTags },
    };
  } catch (error: any) {
    console.error('Erro ao remover tags:', error);
    return {
      ok: false,
      message: error.message || 'Erro ao remover tags',
    };
  }
};

/**
 * Atualiza todas as tags de um membro (substitui as existentes)
 */
export const updateMemberTags = async (
  memberId: string,
  tags: string[],
  currentUserId: string,
  familyGroupId: string
): Promise<FamilyResponse> => {
  try {
    // Verifica se o usuário é membro do grupo
    const { data: membership, error: membershipError } = await supabase
      .from('family_members')
      .select('id')
      .eq('family_group_id', familyGroupId)
      .eq('user_id', currentUserId)
      .single();

    if (membershipError || !membership) {
      return {
        ok: false,
        message: 'Você não tem permissão para editar tags neste grupo',
      };
    }

    // Busca as tags atuais para preservar "Dono" se existir
    const { data: member, error: fetchError } = await supabase
      .from('family_members')
      .select('member_tags')
      .eq('id', memberId)
      .single();

    if (fetchError) throw fetchError;

    const currentTags = member.member_tags || [];
    const hasDono = currentTags.includes('Dono');

    // Monta o array final de tags
    let finalTags = [...tags];
    if (hasDono && !finalTags.includes('Dono')) {
      finalTags = ['Dono', ...finalTags]; // Mantém "Dono" no início
    }

    // Atualiza as tags
    const { error: updateError } = await supabase
      .from('family_members')
      .update({ member_tags: finalTags })
      .eq('id', memberId);

    if (updateError) throw updateError;

    return {
      ok: true,
      message: 'Tags atualizadas com sucesso!',
      data: { member_tags: finalTags },
    };
  } catch (error: any) {
    console.error('Erro ao atualizar tags:', error);
    return {
      ok: false,
      message: error.message || 'Erro ao atualizar tags',
    };
  }
};
