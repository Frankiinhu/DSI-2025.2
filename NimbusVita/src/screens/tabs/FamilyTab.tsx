import React, { useState, useEffect } from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, RefreshControl, Image, LayoutAnimation, Platform, UIManager} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../../contexts/AuthContext';
import { getUserFamilyGroups, createFamilyGroup, joinFamilyGroup, getFamilyMembers, getMemberCheckupHistory, leaveFamilyGroup, deleteFamilyGroup, removeFamilyMember, PREDEFINED_TAGS, updateMemberTags } from '../../services/supabase/family.service';
import { FamilyGroup, FamilyMemberWithProfile } from '../../types/database.types';
import { Colors, Spacing } from '../../styles';
import { useNotifications, ToastComponent } from '../../config/notifications';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FamilyTab = () => {
  const { user } = useAuth();
  const { notify } = useNotifications();
  const isMountedRef = React.useRef(true);
  const [groups, setGroups] = useState<FamilyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados de expansão inline
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [members, setMembers] = useState<FamilyMemberWithProfile[]>([]);
  
  const [showHistoryForMember, setShowHistoryForMember] = useState<string | null>(null);
  const [memberHistory, setMemberHistory] = useState<any[]>([]);
  const [selectedMemberName, setSelectedMemberName] = useState('');
  
  const [showTagsForMember, setShowTagsForMember] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  // Formulários
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    loadGroups();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadGroups = async () => {
    if (!user || !isMountedRef.current) return;
    if (isMountedRef.current) setLoading(true);
    const result = await getUserFamilyGroups(user.id);
    if (!isMountedRef.current) return;
    if (result.ok) {
      setGroups(result.data || []);
    }
    if (isMountedRef.current) setLoading(false);
  };

  const onRefresh = async () => {
    if (!isMountedRef.current) return;
    if (isMountedRef.current) setRefreshing(true);
    await loadGroups();
    if (isMountedRef.current) setRefreshing(false);
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
      setShowCreateForm(false);
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
      setShowJoinForm(false);
      loadGroups();
    } else {
      Alert.alert('Erro', result.message);
    }
  };

  const handleToggleGroup = async (group: FamilyGroup) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    if (expandedGroupId === group.id) {
      setExpandedGroupId(null);
      setMembers([]);
      setShowHistoryForMember(null);
      setShowTagsForMember(null);
    } else {
      setExpandedGroupId(group.id);
      setShowHistoryForMember(null);
      setShowTagsForMember(null);
      if (isMountedRef.current) setLoadingMembers(true);
      
      const result = await getFamilyMembers(group.id);
      if (!isMountedRef.current) return;
      
      if (isMountedRef.current) setLoadingMembers(false);
      
      if (result.ok) {
        setMembers(result.data || []);
      } else {
        Alert.alert('Erro', result.message);
        setExpandedGroupId(null);
      }
    }
  };

  const handleViewMemberHistory = async (member: FamilyMemberWithProfile) => {
    if (!user || !expandedGroupId) return;
    
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowTagsForMember(null);
    
    if (showHistoryForMember === member.id) {
      setShowHistoryForMember(null);
    } else {
      const result = await getMemberCheckupHistory(
        member.user_id,
        expandedGroupId,
        user.id
      );
      
      if (!isMountedRef.current) return;
      
      if (result.ok) {
        setMemberHistory(result.data || []);
        setSelectedMemberName(member.profile.full_name || member.profile.username);
        setShowHistoryForMember(member.id);
      } else {
        Alert.alert('Erro', result.message);
      }
    }
  };

  const handleOpenTagsEditor = (member: FamilyMemberWithProfile) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowHistoryForMember(null);
    
    if (showTagsForMember === member.id) {
      setShowTagsForMember(null);
    } else {
      setSelectedTags(member.member_tags || []);
      setCustomTag('');
      setEditingMemberId(member.id);
      setShowTagsForMember(member.id);
    }
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
    if (!user || !editingMemberId || !expandedGroupId) return;

    const result = await updateMemberTags(
      editingMemberId,
      selectedTags,
      user.id,
      expandedGroupId
    );

    if (!isMountedRef.current) return;

    if (result.ok) {
      notify('success', {
        params: {
          title: 'Tags Atualizadas!',
          description: result.message || 'Tags atualizadas com sucesso',
        },
      });
      if (isMountedRef.current) setShowTagsForMember(null);
      // Recarrega membros
      const membersResult = await getFamilyMembers(expandedGroupId);
      if (!isMountedRef.current) return;
      if (membersResult.ok) {
        setMembers(membersResult.data || []);
      }
    } else {
      Alert.alert('Erro', result.message);
    }
  };

  const handleRemoveMember = async (member: FamilyMemberWithProfile, groupId: string) => {
    if (!user) return;

    Alert.alert(
      'Remover Membro',
      `Remover ${member.profile.username} do grupo?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            const result = await removeFamilyMember(groupId, member.user_id, user.id);
            if (!isMountedRef.current) return;
            if (result.ok) {
              notify('success', { params: { title: 'Membro Removido', description: result.message || 'Membro removido com sucesso' } });
              const membersResult = await getFamilyMembers(groupId);
              if (!isMountedRef.current) return;
              if (membersResult.ok) {
                setMembers(membersResult.data || []);
              }
            } else {
              Alert.alert('Erro', result.message);
            }
          },
        },
      ]
    );
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
              notify('success', { params: { title: 'Saiu do Grupo', description: result.message || 'Você saiu do grupo' } });
              setExpandedGroupId(null);
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
              notify('success', { params: { title: 'Grupo Deletado', description: result.message || 'Grupo deletado com sucesso' } });
              setExpandedGroupId(null);
              loadGroups();
            } else {
              Alert.alert('Erro', result.message);
            }
          },
        },
      ]
    );
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
      <ToastComponent />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.container}>
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setShowCreateForm(!showCreateForm);
                setShowJoinForm(false);
              }}
            >
              <Ionicons name="add-circle-outline" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Criar Grupo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setShowJoinForm(!showJoinForm);
                setShowCreateForm(false);
              }}
            >
              <Ionicons name="enter-outline" size={24} color={Colors.primary} />
              <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
                Entrar em Grupo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Create Form */}
          {showCreateForm && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Criar Novo Grupo</Text>
              <TextInput
                style={styles.input}
                placeholder="Nome do grupo (ex: Família Silva)"
                value={groupName}
                onChangeText={setGroupName}
                maxLength={50}
              />
              <TouchableOpacity style={styles.submitButton} onPress={handleCreateGroup}>
                <Text style={styles.submitButtonText}>Criar</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Join Form */}
          {showJoinForm && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Entrar em Grupo</Text>
              <Text style={styles.formDescription}>
                Digite o código de 8 caracteres compartilhado pelo criador
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Código de convite"
                value={inviteCode}
                onChangeText={(text) => setInviteCode(text.toUpperCase())}
                maxLength={8}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={styles.submitButton} onPress={handleJoinGroup}>
                <Text style={styles.submitButtonText}>Entrar</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Info Text */}
          {groups.length > 0 && !showCreateForm && !showJoinForm && (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color={Colors.primary} />
              <Text style={styles.infoText}>
                Toque em um grupo para expandir e ver os membros
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
            </View>
          ) : (
            <View style={styles.groupsList}>
              {groups.map((group) => (
                <View key={group.id} style={styles.groupWrapper}>
                  {/* Group Header */}
                  <TouchableOpacity
                    style={[
                      styles.groupCard,
                      expandedGroupId === group.id && styles.groupCardExpanded
                    ]}
                    onPress={() => handleToggleGroup(group)}
                  >
                    <View style={styles.groupIcon}>
                      <Ionicons name="people" size={28} color={Colors.primary} />
                    </View>
                    <View style={styles.groupInfo}>
                      <Text style={styles.groupName}>{group.name}</Text>
                      <Text style={styles.groupDetails}>
                        {(group as any).member_count || 0} membros
                      </Text>
                      {group.owner_id === user?.id && (
                        <View style={styles.ownerBadge}>
                          <Text style={styles.ownerBadgeText}>Você é o dono</Text>
                        </View>
                      )}
                    </View>
                    <Ionicons 
                      name={expandedGroupId === group.id ? "chevron-up" : "chevron-down"} 
                      size={28} 
                      color={Colors.primary} 
                    />
                  </TouchableOpacity>

                  {/* Expanded Content */}
                  {expandedGroupId === group.id && (
                    <View style={styles.expandedContent}>
                      {/* Invite Code */}
                      <TouchableOpacity 
                        style={styles.inviteCodeBox}
                        onPress={() => handleCopyInviteCode(group.invite_code)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.inviteCodeLabel}>Código de Convite (toque para copiar):</Text>
                        <Text style={styles.inviteCodeText}>{group.invite_code}</Text>
                      </TouchableOpacity>

                      {/* Members List */}
                      {loadingMembers ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="large" color={Colors.primary} />
                          <Text style={styles.loadingText}>Carregando membros...</Text>
                        </View>
                      ) : members.length === 0 ? (
                        <View style={styles.emptyMembers}>
                          <Ionicons name="people-outline" size={48} color={Colors.textLight} />
                          <Text style={styles.emptyMembersText}>Nenhum membro encontrado</Text>
                        </View>
                      ) : (
                        <>
                          <Text style={styles.membersTitle}>
                            {members.length} {members.length === 1 ? 'Membro' : 'Membros'}
                          </Text>
                          
                          {members.map((member) => (
                            <View key={member.id}>
                              {/* Member Card */}
                              <View style={styles.memberCard}>
                                <View style={styles.memberAvatar}>
                                  {member.profile?.avatar_url ? (
                                    <Image 
                                      source={{ uri: member.profile.avatar_url }} 
                                      style={styles.avatarImage}
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
                                  
                                  {member.member_tags && member.member_tags.length > 0 && (
                                    <View style={styles.tagsContainer}>
                                      {member.member_tags.map((tag, index) => (
                                        <View key={index} style={[styles.tag, tag === 'Dono' && styles.ownerTag]}>
                                          <Text style={[styles.tagText, tag === 'Dono' && styles.ownerTagText]}>
                                            {tag}
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
                                  <TouchableOpacity
                                    style={styles.iconButton}
                                    onPress={() => handleOpenTagsEditor(member)}
                                  >
                                    <MaterialCommunityIcons name="tag" size={26} color={Colors.primary} />
                                  </TouchableOpacity>
                                  
                                  {member.user_id !== user?.id && (
                                    <TouchableOpacity
                                      style={styles.iconButton}
                                      onPress={() => handleViewMemberHistory(member)}
                                    >
                                      <MaterialCommunityIcons 
                                        name="chart-timeline-variant" 
                                        size={26} 
                                        color={Colors.primary} 
                                      />
                                    </TouchableOpacity>
                                  )}
                                  
                                  {group.owner_id === user?.id && member.user_id !== user?.id && (
                                    <TouchableOpacity
                                      style={styles.iconButton}
                                      onPress={() => handleRemoveMember(member, group.id)}
                                    >
                                      <Ionicons name="trash-outline" size={22} color={Colors.error} />
                                    </TouchableOpacity>
                                  )}
                                </View>
                              </View>

                              {/* Tags Editor */}
                              {showTagsForMember === member.id && (
                                <View style={styles.tagsEditor}>
                                  <Text style={styles.editorTitle}>Editar Tags</Text>
                                  
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

                                  <Text style={styles.sectionTitle}>Tag Personalizada</Text>
                                  <View style={styles.customTagRow}>
                                    <TextInput
                                      style={styles.customTagInput}
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

                                  {selectedTags.length > 0 && (
                                    <>
                                      <Text style={styles.sectionTitle}>Tags Selecionadas</Text>
                                      <View style={styles.selectedTagsContainer}>
                                        {selectedTags.map((tag, index) => (
                                          <View key={index} style={styles.selectedTag}>
                                            <Text style={styles.selectedTagText}>{tag}</Text>
                                            {tag !== 'Dono' && (
                                              <TouchableOpacity onPress={() => handleToggleTag(tag)}>
                                                <Ionicons name="close-circle" size={18} color="#fff" />
                                              </TouchableOpacity>
                                            )}
                                          </View>
                                        ))}
                                      </View>
                                    </>
                                  )}

                                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveTags}>
                                    <Text style={styles.saveButtonText}>Salvar Tags</Text>
                                  </TouchableOpacity>
                                </View>
                              )}

                              {/* History */}
                              {showHistoryForMember === member.id && (
                                <View style={styles.historySection}>
                                  <Text style={styles.editorTitle}>
                                    Histórico de {selectedMemberName}
                                  </Text>
                                  
                                  {memberHistory.length === 0 ? (
                                    <View style={styles.emptyHistory}>
                                      <Ionicons name="document-outline" size={48} color={Colors.textLight} />
                                      <Text style={styles.emptyHistoryText}>
                                        Nenhuma verificação encontrada
                                      </Text>
                                    </View>
                                  ) : (
                                    <ScrollView style={styles.historyList} nestedScrollEnabled>
                                      {memberHistory.map((checkup: any) => {
                                        let predictions: any = {};
                                        if (checkup.predictions) {
                                          if (typeof checkup.predictions === 'string') {
                                            try {
                                              predictions = JSON.parse(checkup.predictions);
                                            } catch (e) {
                                              console.error('Erro ao parsear predictions:', e);
                                            }
                                          } else if (typeof checkup.predictions === 'object') {
                                            predictions = checkup.predictions;
                                          }
                                        }

                                        let symptoms = checkup.symptoms;
                                        if (typeof symptoms === 'string') {
                                          try {
                                            symptoms = JSON.parse(symptoms);
                                          } catch {
                                            symptoms = [];
                                          }
                                        }
                                        
                                        const riskLevel = predictions.risk_level || 'low';
                                        const diseasePredictions = predictions.disease_predictions || predictions;
                                        
                                        const riskColor = 
                                          riskLevel === 'high' ? Colors.danger :
                                          riskLevel === 'moderate' ? Colors.warning :
                                          Colors.success;
                                        
                                        const riskLabel = 
                                          riskLevel === 'high' ? 'Alto Risco' :
                                          riskLevel === 'moderate' ? 'Risco Moderado' :
                                          'Baixo Risco';

                                        return (
                                          <View key={checkup.id} style={styles.historyCard}>
                                            <View style={styles.historyHeader}>
                                              <View style={styles.historyDateContainer}>
                                                <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
                                                <Text style={styles.historyDate}>
                                                  {formatDate(checkup.checkup_date)}
                                                </Text>
                                              </View>
                                              <View style={[styles.riskBadge, { backgroundColor: riskColor + '20' }]}>
                                                <Text style={[styles.riskBadgeText, { color: riskColor }]}>
                                                  {riskLabel}
                                                </Text>
                                              </View>
                                            </View>

                                            {symptoms && Array.isArray(symptoms) && symptoms.length > 0 && (
                                              <View style={styles.symptomsList}>
                                                <Text style={styles.symptomsLabel}>Sintomas:</Text>
                                                <View style={styles.symptomsContainer}>
                                                  {symptoms.map((symptom: any, index: number) => (
                                                    <View key={index} style={styles.symptomTag}>
                                                      <Text style={styles.symptomTagText}>
                                                        {symptom.symptom_name || symptom.symptom_key || symptom}
                                                      </Text>
                                                    </View>
                                                  ))}
                                                </View>
                                              </View>
                                            )}

                                            {diseasePredictions && typeof diseasePredictions === 'object' && Object.keys(diseasePredictions).length > 0 && (
                                              <View style={styles.predictionsContainer}>
                                                <Text style={styles.predictionsLabel}>Prognóstico:</Text>
                                                {Object.entries(diseasePredictions)
                                                  .filter(([key]) => !['risk_level', 'explanation', 'recommendations'].includes(key))
                                                  .sort((a: any, b: any) => b[1] - a[1])
                                                  .slice(0, 5)
                                                  .map(([disease, probability]: [string, any], index: number) => {
                                                    const percentage = parseFloat(probability).toFixed(1);
                                                    const probabilityValue = parseFloat(probability) / 100;
                                                    const barColor = 
                                                      probabilityValue > 0.7 ? Colors.danger :
                                                      probabilityValue > 0.4 ? Colors.warning :
                                                      Colors.success;
                                                    
                                                    return (
                                                      <View key={index} style={styles.predictionItem}>
                                                        <View style={styles.predictionInfo}>
                                                          <Text style={styles.predictionDisease}>{disease}</Text>
                                                          <Text style={[styles.predictionPercentage, { color: barColor }]}>
                                                            {percentage}%
                                                          </Text>
                                                        </View>
                                                        <View style={styles.predictionBarBackground}>
                                                          <View 
                                                            style={[
                                                              styles.predictionBar, 
                                                              { width: `${Math.min(parseFloat(percentage), 100)}%` as any, backgroundColor: barColor }
                                                            ]} 
                                                          />
                                                        </View>
                                                      </View>
                                                    );
                                                  })}
                                              </View>
                                            )}

                                            {predictions.explanation && (
                                              <View style={styles.analysisContainer}>
                                                <Text style={styles.analysisText}>
                                                  {predictions.explanation}
                                                </Text>
                                              </View>
                                            )}

                                            {checkup.notes && (
                                              <View style={styles.notesContainer}>
                                                <Text style={styles.notesText}>{checkup.notes}</Text>
                                              </View>
                                            )}
                                          </View>
                                        );
                                      })}
                                    </ScrollView>
                                  )}
                                </View>
                              )}
                            </View>
                          ))}
                        </>
                      )}

                      {/* Group Actions */}
                      <View style={styles.groupActions}>
                        {group.owner_id === user?.id ? (
                          <TouchableOpacity
                            style={[styles.actionButton, styles.dangerButton]}
                            onPress={() => handleDeleteGroup(group)}
                          >
                            <Ionicons name="trash-outline" size={20} color="#fff" />
                            <Text style={styles.actionButtonText}>Deletar Grupo</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={[styles.actionButton, styles.warningButton]}
                            onPress={() => handleLeaveGroup(group)}
                          >
                            <Ionicons name="exit-outline" size={20} color="#fff" />
                            <Text style={styles.actionButtonText}>Sair do Grupo</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.accent,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  dangerButton: {
    backgroundColor: Colors.error,
  },
  warningButton: {
    backgroundColor: Colors.warning,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButtonText: {
    color: Colors.primary,
  },
  formCard: {
    backgroundColor: '#fff',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textDark,
    marginBottom: Spacing.sm,
  },
  formDescription: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: Spacing.sm,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentLight,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
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
  groupsList: {
    padding: Spacing.md,
    gap: 12,
  },
  groupWrapper: {
    marginBottom: 8,
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
  groupCardExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
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
  expandedContent: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inviteCodeBox: {
    backgroundColor: Colors.primary + '10',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  inviteCodeLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginBottom: 4,
  },
  inviteCodeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    letterSpacing: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textLight,
  },
  emptyMembers: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyMembersText: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 12,
  },
  membersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 12,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
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
  memberActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  tagsEditor: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  editorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textDark,
    marginTop: 12,
    marginBottom: 8,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tagButtonSelected: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  tagButtonText: {
    fontSize: 13,
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
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  addTagButton: {
    backgroundColor: Colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
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
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  selectedTagText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  historySection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
    maxHeight: 500,
  },
  historyList: {
    maxHeight: 400,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 12,
    textAlign: 'center',
  },
  historyCard: {
    backgroundColor: '#f9f9f9',
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  historyDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyDate: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textDark,
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  symptomsList: {
    marginTop: 8,
  },
  symptomsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 6,
  },
  symptomsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  symptomTag: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  symptomTagText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500',
  },
  predictionsContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f8f9ff',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  predictionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textDark,
    marginBottom: 8,
  },
  predictionItem: {
    marginBottom: 8,
  },
  predictionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  predictionDisease: {
    fontSize: 12,
    color: Colors.textDark,
    fontWeight: '500',
    flex: 1,
  },
  predictionPercentage: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
  },
  predictionBarBackground: {
    height: 5,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  predictionBar: {
    height: '100%',
    borderRadius: 3,
  },
  analysisContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: Colors.primary + '10',
    borderRadius: 6,
  },
  analysisText: {
    fontSize: 12,
    color: Colors.textDark,
    lineHeight: 16,
  },
  notesContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  notesText: {
    fontSize: 12,
    color: Colors.textLight,
    fontStyle: 'italic',
  },
  groupActions: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});

export default FamilyTab;
