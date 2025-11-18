import React, { useState, useEffect } from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, RefreshControl, StatusBar, Image} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome6, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../../contexts/AuthContext';
import { getUserFamilyGroups, createFamilyGroup, joinFamilyGroup, getFamilyMembers, getMemberCheckupHistory, leaveFamilyGroup, deleteFamilyGroup, removeFamilyMember, PREDEFINED_TAGS, updateMemberTags } from '../../services/supabase/family.service';
import { FamilyGroup, FamilyMemberWithProfile } from '../../types/database.types';
import { Colors, Spacing, Shadows, BorderRadius, ComponentStyles } from '../../styles';
import { useNotifications, ToastComponent } from '../../config/notifications';


const FamilyTab = () => {
  const { user } = useAuth();
  const { notify } = useNotifications();
  const isMountedRef = React.useRef(true);
  const timeoutRefs = React.useRef<NodeJS.Timeout[]>([]);
  const [groups, setGroups] = useState<FamilyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<FamilyGroup | null>(null);
  const [members, setMembers] = useState<FamilyMemberWithProfile[]>([]);
  const [memberHistory, setMemberHistory] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<FamilyMemberWithProfile | null>(null);

  // Modais
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);

  // Inputs
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');

  useEffect(() => {
    isMountedRef.current = true;
    loadGroups();
    return () => {
      isMountedRef.current = false;
      // Limpar todos os timeouts pendentes
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current = [];
    };
  }, []);

  // useEffect de debug removido para evitar overhead
  // useEffect(() => {
  //   console.log('🎨 Estado atualizado - showMembersModal:', showMembersModal, 'loadingMembers:', loadingMembers, 'members.length:', members.length);
  // }, [showMembersModal, loadingMembers, members]);

  const loadGroups = async () => {
    if (!user) return;
    setLoading(true);
    const result = await getUserFamilyGroups(user.id);
    if (result.ok && isMountedRef.current) {
      setGroups(result.data || []);
    }
    if (isMountedRef.current) {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  };

  const handleCreateGroup = async () => {
    if (!user || !groupName.trim()) {
      Alert.alert('Erro', 'Digite um nome para o grupo');
      return;
    }

    const result = await createFamilyGroup(user.id, groupName.trim());
    if (result.ok) {
      Alert.alert(
        'Sucesso!',
        `Grupo criado!\n\nCódigo de convite: ${result.data.invite_code}\n\nCompartilhe este código com sua família.`,
        [{ text: 'OK' }]
      );
      setGroupName('');
      setShowCreateModal(false);
      loadGroups();
    } else {
      Alert.alert('Erro', result.message);
    }
  };

  const handleJoinGroup = async () => {
    if (!user || !inviteCode.trim()) {
      Alert.alert('Erro', 'Digite o código de convite');
      return;
    }

    const result = await joinFamilyGroup(user.id, inviteCode.trim());
    if (result.ok) {
      Alert.alert('Sucesso! 🎉', result.message);
      setInviteCode('');
      setShowJoinModal(false);
      loadGroups();
    } else {
      Alert.alert('Erro', result.message);
    }
  };

  const handleOpenGroup = async (group: FamilyGroup) => {
    console.log('🔵 handleOpenGroup chamado para:', group.name);
    setSelectedGroup(group);
    setMembers([]); // Limpa a lista anterior
    setLoadingMembers(true);
    setShowMembersModal(true);
    
    console.log('🔵 Buscando membros do grupo ID:', group.id);
    const result = await getFamilyMembers(group.id);
    
    setLoadingMembers(false);
    
    console.log('🔵 Resultado:', result);
    
    if (result.ok) {
      const membersList = result.data || [];
      console.log('✅ Membros carregados:', membersList.length);
      // JSON.stringify removido para evitar overhead
      if (isMountedRef.current) {
        setMembers(membersList);
      }
    } else {
      console.error('❌ Erro ao carregar membros:', result.message);
      Alert.alert('Erro ao carregar membros', result.message || 'Não foi possível carregar os membros do grupo');
      setShowMembersModal(false);
    }
  };

  const handleViewMemberHistory = async (member: FamilyMemberWithProfile) => {
    if (!user || !selectedGroup) return;
    setSelectedMember(member);
    
    const result = await getMemberCheckupHistory(
      member.user_id,
      selectedGroup.id,
      user.id
    );
    
    if (result.ok) {
      setMemberHistory(result.data || []);
      setShowHistoryModal(true);
    } else {
      Alert.alert('Erro', result.message);
    }
  };

  const handleLeaveGroup = async (group: FamilyGroup) => {
    if (!user) return;

    Alert.alert(
      'Sair do Grupo',
      `Tem certeza que deseja sair de "${group.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            const result = await leaveFamilyGroup(group.id, user.id);
            if (result.ok) {
              Alert.alert('Sucesso', result.message);
              loadGroups();
            } else {
              Alert.alert('Erro', result.message);
            }
          },
        },
      ]
    );
  };

  const handleDeleteGroup = async (group: FamilyGroup) => {
    if (!user) return;

    Alert.alert(
      'Deletar Grupo',
      `Tem certeza que deseja deletar "${group.name}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteFamilyGroup(group.id, user.id);
            if (result.ok) {
              Alert.alert('Sucesso', result.message);
              setShowMembersModal(false);
              loadGroups();
            } else {
              Alert.alert('Erro', result.message);
            }
          },
        },
      ]
    );
  };

  const handleRemoveMember = async (member: FamilyMemberWithProfile) => {
    if (!user || !selectedGroup) return;

    Alert.alert(
      'Remover Membro',
      `Remover ${member.profile.username} do grupo?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            const result = await removeFamilyMember(
              selectedGroup.id,
              member.user_id,
              user.id
            );
            if (result.ok) {
              Alert.alert('Sucesso', result.message);
              handleOpenGroup(selectedGroup);
            } else {
              Alert.alert('Erro', result.message);
            }
          },
        },
      ]
    );
  };

  const handleOpenTagsModal = (member: FamilyMemberWithProfile) => {
    console.log('🏷️ Abrindo modal de tags para:', member.profile.username);
    console.log('🏷️ Tags atuais:', member.member_tags);
    
    // Define os dados primeiro
    setSelectedMember(member);
    setSelectedTags(member.member_tags || []);
    setCustomTag('');
    
    // Fecha o modal de membros e abre o de tags com um pequeno delay
    setShowMembersModal(false);
    const timeoutId = setTimeout(() => {
      if (isMountedRef.current) {
        setShowTagsModal(true);
        console.log('🏷️ Modal de tags aberto');
      }
    }, 300);
    timeoutRefs.current.push(timeoutId);
  };

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    const trimmedTag = customTag.trim();
    if (!trimmedTag) {
      Alert.alert('Erro', 'Digite o nome da tag');
      return;
    }

    if (selectedTags.includes(trimmedTag)) {
      Alert.alert('Erro', 'Esta tag já está adicionada');
      return;
    }

    setSelectedTags([...selectedTags, trimmedTag]);
    setCustomTag('');
  };

  const handleSaveTags = async () => {
    if (!user || !selectedMember || !selectedGroup) return;

    const result = await updateMemberTags(
      selectedMember.id,
      selectedTags,
      user.id,
      selectedGroup.id
    );

    if (result.ok) {
      Alert.alert('Sucesso! 🎉', result.message);
      setShowTagsModal(false);
      // Reabre o modal de membros após um pequeno delay
      const timeoutId = setTimeout(() => {
        if (!isMountedRef.current) return;
        handleOpenGroup(selectedGroup); // Recarrega os membros e reabre o modal
      }, 300);
      timeoutRefs.current.push(timeoutId);
    } else {
      Alert.alert('Erro', result.message);
    }
  };

  const handleCopyInviteCode = async (code: string) => {
    try {
      await Clipboard.setStringAsync(code);
      notify('success', {
        params: {
          title: 'Código Copiado!',
          description: 'O código foi copiado para a área de transferência',
        },
      });
    } catch (error) {
      notify('error', {
        params: {
          title: 'Erro ao Copiar',
          description: 'Não foi possível copiar o código',
        },
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Action Buttons */}
        <View style={styles.container}>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add-circle-outline" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Criar Grupo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => setShowJoinModal(true)}
          >
            <Ionicons name="enter-outline" size={24} color={Colors.primary} />
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
              Entrar em Grupo
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info Text */}
        {groups.length > 0 && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={Colors.primary} />
            <Text style={styles.infoText}>
              Toque em um grupo para ver os membros e gerenciar tags
            </Text>
          </View>
        )}

        {/* Groups List */}
        {groups.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={Colors.textLight} />
            <Text style={styles.emptyStateText}>
              Você ainda não faz parte de nenhum grupo familiar
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Crie um grupo ou entre usando um código de convite
            </Text>
            
            {/* Tutorial Steps */}
            <View style={styles.tutorialContainer}>
              <View style={styles.tutorialStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Criar ou Entrar</Text>
                  <Text style={styles.stepDescription}>
                    Use os botões acima para criar um novo grupo ou entrar em um existente
                  </Text>
                </View>
              </View>
              
              <View style={styles.tutorialStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Visualizar Membros</Text>
                  <Text style={styles.stepDescription}>
                    Toque no card do grupo para ver todos os membros
                  </Text>
                </View>
              </View>
              
              <View style={styles.tutorialStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Adicionar Tags</Text>
                  <Text style={styles.stepDescription}>
                    Clique no ícone 🏷️ ao lado de cada membro para adicionar tags como Mãe, Pai, Filho, etc
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.groupsList}>
            {groups.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={styles.groupCard}
                onPress={() => {
                  console.log('Abrindo grupo:', group.name);
                  handleOpenGroup(group);
                }}
              >
                <View style={styles.groupIcon}>
                  <Ionicons name="people" size={28} color={Colors.primary} />
                </View>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupDetails}>
                    {(group as any).member_count || 0} membros • Código: {group.invite_code}
                  </Text>
                  <Text style={styles.groupHint}>Toque para ver membros</Text>
                  {group.owner_id === user?.id && (
                    <View style={styles.ownerBadge}>
                      <Text style={styles.ownerBadgeText}>Você é o dono</Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={28} color={Colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        )}
        </View>
      </ScrollView>

      {/* Create Group Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Criar Grupo Familiar</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={28} color={Colors.textDark} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Nome do grupo (ex: Família Silva)"
              value={groupName}
              onChangeText={setGroupName}
              maxLength={50}
            />

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleCreateGroup}
            >
              <Text style={styles.modalButtonText}>Criar Grupo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Join Group Modal */}
      <Modal
        visible={showJoinModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Entrar em Grupo</Text>
              <TouchableOpacity onPress={() => setShowJoinModal(false)}>
                <Ionicons name="close" size={28} color={Colors.textDark} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Digite o código de 8 caracteres compartilhado pelo criador do grupo
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Código de convite"
              value={inviteCode}
              onChangeText={(text) => setInviteCode(text.toUpperCase())}
              maxLength={8}
              autoCapitalize="characters"
            />

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleJoinGroup}
            >
              <Text style={styles.modalButtonText}>Entrar no Grupo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Members Modal */}
      <Modal
        visible={showMembersModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMembersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedGroup?.name}</Text>
              <TouchableOpacity onPress={() => {
                setShowMembersModal(false);
                // Pequeno delay antes de limpar para garantir animação suave
                const timeoutId = setTimeout(() => {
                  if (!isMountedRef.current) return;
                  setSelectedGroup(null);
                  setMembers([]);
                }, 300);
                timeoutRefs.current.push(timeoutId);
              }}>
                <Ionicons name="close" size={28} color={Colors.textDark} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.inviteCodeBox}
              onPress={() => selectedGroup && handleCopyInviteCode(selectedGroup.invite_code)}
              activeOpacity={0.7}
            >
              <Text style={styles.inviteCodeLabel}>Código de Convite:</Text>
              <Text style={styles.inviteCodeText}>
                {selectedGroup?.invite_code}
              </Text>
            </TouchableOpacity>

            <ScrollView 
              style={styles.membersList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
            >
              {loadingMembers ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.loadingText}>Carregando membros...</Text>
                </View>
              ) : members.length === 0 ? (
                <View style={styles.emptyMembersList}>
                  <Ionicons name="people-outline" size={48} color={Colors.textLight} />
                  <Text style={styles.emptyMembersText}>
                    Nenhum membro encontrado
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.membersListTitle}>
                    {members.length} {members.length === 1 ? 'Membro' : 'Membros'}
                  </Text>
                  
                  {members.map((member) => (
                    <View key={member.id} style={styles.memberCard}>
                      <View style={styles.memberAvatar}>
                        {member.profile?.avatar_url ? (
                          <Image 
                            source={{ uri: member.profile.avatar_url, cache: 'force-cache' }} 
                            style={styles.avatarImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <Ionicons name="person" size={32} color={Colors.primary} />
                        )}
                      </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                      {member.profile.full_name || member.profile.username}
                    </Text>
                    <Text style={styles.memberUsername}>
                      @{member.profile.username}
                    </Text>
                    
                    {/* Tags do membro */}
                    {member.member_tags && member.member_tags.length > 0 && (
                      <View style={styles.tagsContainer}>
                        {member.member_tags.map((tag, index) => (
                          <View 
                            key={index} 
                            style={[
                              styles.tag,
                              tag === 'Dono' && styles.ownerTag
                            ]}
                          >
                            <Text style={[
                              styles.tagText,
                              tag === 'Dono' && styles.ownerTagText
                            ]}>
                              {tag === 'Dono' ? '' : ''}{tag}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                    
                    {member.user_id === user?.id && !member.member_tags?.includes('Dono') && (
                      <Text style={styles.memberRole}>✓ Você</Text>
                    )}
                  </View>
                  <View style={styles.memberActions}>
                    {/* Botão de editar tags - Todos podem editar tags de qualquer membro */}
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => handleOpenTagsModal(member)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="tag" size={30} color={Colors.primary} />
                    </TouchableOpacity>
                    
                    {/* Todos podem ver histórico */}
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => handleViewMemberHistory(member)}
                      disabled={member.user_id === user?.id}
                    >
                      <MaterialCommunityIcons 
                        name="chart-timeline-variant" 
                        size={30} 
                        color={member.user_id === user?.id ? Colors.textLight : Colors.primary} 
                      />
                    </TouchableOpacity>
                    
                    {/* Apenas o dono pode remover outros membros */}
                    {selectedGroup?.owner_id === user?.id &&
                      user && member.user_id !== user.id && (
                        <TouchableOpacity
                          style={styles.iconButton}
                          onPress={() => handleRemoveMember(member)}
                        >
                          <Ionicons name="trash-outline" size={24} color={Colors.error} />
                        </TouchableOpacity>
                      )}
                  </View>
                </View>
                  ))}
                </>
              )}
            </ScrollView>

            {selectedGroup && (
              <View style={styles.modalFooter}>
                {selectedGroup.owner_id === user?.id ? (
                  <TouchableOpacity
                    style={[styles.modalButton, styles.dangerButton]}
                    onPress={() => handleDeleteGroup(selectedGroup)}
                  >
                    <Text style={styles.modalButtonText}>Deletar Grupo</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.modalButton, styles.warningButton]}
                    onPress={() => handleLeaveGroup(selectedGroup)}
                  >
                    <Text style={styles.modalButtonText}>Sair do Grupo</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999 }} pointerEvents="box-none">
            <ToastComponent />
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal
        visible={showHistoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.largeModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Histórico de {selectedMember?.profile.username}
              </Text>
              <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                <Ionicons name="close" size={28} color={Colors.textDark} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.historyList}>
              {memberHistory.length === 0 ? (
                <View style={styles.emptyHistory}>
                  <Ionicons name="document-outline" size={48} color={Colors.textLight} />
                  <Text style={styles.emptyHistoryText}>
                    Nenhuma verificação encontrada
                  </Text>
                </View>
              ) : (
                memberHistory.map((checkup) => (
                  <View key={checkup.id} style={styles.historyCard}>
                    <View style={styles.historyHeader}>
                      <Text style={styles.historyDate}>
                        {formatDate(checkup.checkup_date)}
                      </Text>
                    </View>
                    <Text style={styles.historySymptoms}>
                      {Array.isArray(checkup.symptoms) &&
                        checkup.symptoms.map((s: any) => s.symptom_key).join(', ')}
                    </Text>
                    {checkup.notes && (
                      <Text style={styles.historyNotes}>{checkup.notes}</Text>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Tags Modal */}
      <Modal
        visible={showTagsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTagsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.largeModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Editar Tags - {selectedMember?.profile.username}
              </Text>
              <TouchableOpacity onPress={() => {
                setShowTagsModal(false);
                // Reabre o modal de membros após fechar
                if (selectedGroup) {
                  const timeoutId = setTimeout(() => {
                    if (!isMountedRef.current) return;
                    setShowMembersModal(true);
                  }, 300);
                  timeoutRefs.current.push(timeoutId);
                }
              }}>
                <Ionicons name="close" size={28} color={Colors.textDark} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.tagsModalContent}>
              {/* Tags predefinidas */}
              <Text style={styles.sectionTitle}>Tags Predefinidas</Text>
              <View style={styles.tagsGrid}>
                {PREDEFINED_TAGS.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.tagButton,
                      selectedTags.includes(tag) && styles.tagButtonSelected,
                    ]}
                    onPress={() => handleToggleTag(tag)}
                  >
                    <Text
                      style={[
                        styles.tagButtonText,
                        selectedTags.includes(tag) && styles.tagButtonTextSelected,
                      ]}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Tag customizada */}
              <Text style={styles.sectionTitle}>Criar tag personalizada</Text>
              <View style={styles.customTagRow}>
                <TextInput
                  style={[styles.input, styles.customTagInput]}
                  placeholder="Digite o nome da tag"
                  value={customTag}
                  onChangeText={setCustomTag}
                  maxLength={20}
                />
                <TouchableOpacity
                  style={styles.addTagButton}
                  onPress={handleAddCustomTag}
                >
                  <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              {/* Tags selecionadas */}
              {selectedTags.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Tags selecionadas</Text>
                  <View style={styles.selectedTagsContainer}>
                    {selectedTags.map((tag, index) => (
                      <View key={index} style={styles.selectedTag}>
                        <Text style={styles.selectedTagText}>{tag}</Text>
                        {tag !== 'Dono' && (
                          <TouchableOpacity onPress={() => handleToggleTag(tag)}>
                            <Ionicons
                              name="close-circle"
                              size={20}
                              color={Colors.textWhite}
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleSaveTags}
            >
              <Text style={styles.modalButtonText}>Salvar Tags</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.accent,
  },
  container: {
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.accent,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButtonText: {
    color: Colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textDark,
    textAlign: 'center',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 8,
  },
  tutorialContainer: {
    marginTop: 32,
    width: '100%',
    paddingHorizontal: 16,
  },
  tutorialStep: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
  },
  groupsList: {
    padding: 16,
    gap: 12,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 4,
  },
  groupDetails: {
    fontSize: 14,
    color: Colors.textLight,
  },
  groupHint: {
    fontSize: 16,
    color: Colors.primary,
    marginTop: 4,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentLight,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: Spacing.xs,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },
  ownerBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ownerBadgeText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalContentLarge: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '90%',
    display: 'flex',
    flexDirection: 'column',
  },
  largeModal: {
    maxHeight: '90%',
    flex: 1,
    marginTop: 'auto',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.textDark,
  },
  modalDescription: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: Colors.error,
  },
  warningButton: {
    backgroundColor: Colors.primary,
  },
  inviteCodeBox: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  inviteCodeLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 4,
    textAlign: 'center',
  },
  inviteCodeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    letterSpacing: 2,
    textAlign: 'center',
  },
  membersList: {
    flex: 1,
    flexGrow: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textLight,
  },
  membersListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  emptyMembersList: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyMembersText: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 12,
    textAlign: 'center',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 8,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
  },
  memberUsername: {
    fontSize: 14,
    color: Colors.textLight,
  },
  memberRole: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 4,
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  modalFooter: {
    marginTop: 16,
  },
  historyList: {
    flex: 1,
  },
  historyCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
  },
  historySymptoms: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 8,
  },
  historyNotes: {
    fontSize: 13,
    color: Colors.textLight,
    fontStyle: 'italic',
  },
  emptyHistory: {
    alignItems: 'center',
    padding: 40,
  },
  emptyHistoryText: {
    fontSize: 16,
    color: Colors.textLight,
    marginTop: 12,
  },
  // Estilos de Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  tag: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 4,
    marginBottom: 4,
  },
  ownerTag: {
    backgroundColor: '#FFD700',
  },
  tagText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  ownerTagText: {
    color: '#B8860B',
  },
  // Estilos do Modal de Tags
  tagsModalContent: {
    flex: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
    marginTop: 16,
    marginBottom: 12,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tagButtonSelected: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  tagButtonText: {
    fontSize: 14,
    color: Colors.textDark,
    fontWeight: '500',
  },
  tagButtonTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  customTagRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  customTagInput: {
    flex: 1,
    marginBottom: 0,
  },
  addTagButton: {
    backgroundColor: Colors.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  selectedTagText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
});

export default FamilyTab;