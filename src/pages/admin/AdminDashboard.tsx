import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  TrendingUp,
  Calendar,
  CreditCard,
  LogOut,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Download,
  Settings,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getAllUsers,
  getUserMetrics,
  updateUserSubscription,
  formatDate,
  formatFullDate,
  formatTokens,
  formatCost,
  calculateTokenCost,
  setBulkTokenLimits,
  adminLogout,
} from '@/lib/admin';
import type { UserMetrics, AdminUser } from '@/lib/admin';
import { EditUserModal } from '@/components/admin/EditUserModal';
import { BulkTokenEditModal } from '@/components/admin/BulkTokenEditModal';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
  const [tokenFilter, setTokenFilter] = useState<'all' | 'with-limit' | 'no-limit' | 'over-limit'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const allUsers = await getAllUsers();
      const userMetrics = await getUserMetrics();
      setUsers(allUsers);
      setMetrics(userMetrics);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = () => {
    adminLogout();
    toast.success('Logout realizado');
    navigate('/admin/login');
  };

  const handleToggleSubscription = async (userId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const expiresAt = newStatus
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias
      : undefined;

    const success = await updateUserSubscription(userId, newStatus, expiresAt);
    if (success) {
      toast.success(`Assinatura ${newStatus ? 'ativada' : 'desativada'} com sucesso`);
      loadData();
    } else {
      toast.error('Erro ao atualizar assinatura');
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'active' && user.subscriptionStatus === 'active') ||
      (filterStatus === 'inactive' && user.subscriptionStatus === 'inactive') ||
      (filterStatus === 'expired' && user.subscriptionStatus === 'expired');

    const matchesTokenFilter =
      tokenFilter === 'all' ||
      (tokenFilter === 'with-limit' && user.tokenLimit && user.tokenLimit > 0) ||
      (tokenFilter === 'no-limit' && (!user.tokenLimit || user.tokenLimit === 0)) ||
      (tokenFilter === 'over-limit' && 
        user.tokenLimit && 
        user.tokenLimit > 0 && 
        (user.totalTokensUsed || 0) >= user.tokenLimit);

    return matchesSearch && matchesFilter && matchesTokenFilter;
  });

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleExportCSV = () => {
    const headers = [
      'Nome',
      'Email',
      'Data de Cadastro',
      'Último Acesso',
      'Status Assinatura',
      'Tokens Usados',
      'Limite de Tokens',
      'Custo Estimado (USD)',
      'Percentual de Uso',
    ];

    const rows = users.map(user => {
      const cost = calculateTokenCost(user.inputTokensUsed || 0, user.outputTokensUsed || 0);
      const usagePercent = user.tokenLimit && user.tokenLimit > 0
        ? Math.round(((user.totalTokensUsed || 0) / user.tokenLimit) * 100)
        : 0;

      return [
        user.name,
        user.email,
        formatFullDate(user.registrationDate),
        formatDate(user.lastAccess),
        user.subscriptionStatus,
        (user.totalTokensUsed || 0).toString(),
        user.tokenLimit ? user.tokenLimit.toString() : 'Ilimitado',
        cost.toFixed(4),
        user.tokenLimit && user.tokenLimit > 0 ? `${usagePercent}%` : 'N/A',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `usuarios_amparo_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('CSV exportado com sucesso!');
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-700 border-green-200',
      inactive: 'bg-gray-100 text-gray-700 border-gray-200',
      expired: 'bg-red-100 text-red-700 border-red-200',
    };

    const labels = {
      active: 'Ativa',
      inactive: 'Inativa',
      expired: 'Expirada',
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || styles.inactive}`}
      >
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-warmth flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warmth p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold text-foreground">
              Painel Administrativo
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerenciamento de usuários e métricas
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>

        {/* Metrics Cards */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card variant="elevated">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Usuários</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {metrics.totalUsers}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Assinaturas Ativas</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {metrics.activeSubscriptions}
                    </p>
                  </div>
                  <CreditCard className="w-8 h-8 text-green-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Hoje</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {metrics.newUsersToday}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Esta Semana</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {metrics.newUsersThisWeek}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Este Mês</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {metrics.newUsersThisMonth}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-600 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Token Metrics */}
        {metrics && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card variant="elevated">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Tokens</p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {metrics.totalTokensUsed.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTokens(metrics.inputTokensUsed)} input / {formatTokens(metrics.outputTokensUsed)} output
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-lg">T</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Custo Total</p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {formatCost(metrics.totalCost)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatCost(metrics.inputCost)} input / {formatCost(metrics.outputCost)} output
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Média de Tokens</p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {metrics.averageTokensPerUser.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        tokens/usuário
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Custo por Usuário</p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {formatCost(metrics.averageCostPerUser)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        USD/usuário
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                      <Users className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Users Table */}
        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Usuários Cadastrados</CardTitle>
              <Button variant="outline" size="sm" onClick={loadData}>
                <RefreshCw className="w-4 h-4" />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters and Actions */}
            <div className="space-y-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-gentle text-foreground"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={filterStatus === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('all')}
                  >
                    Todos
                  </Button>
                  <Button
                    variant={filterStatus === 'active' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('active')}
                  >
                    Ativos
                  </Button>
                  <Button
                    variant={filterStatus === 'inactive' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('inactive')}
                  >
                    Inativos
                  </Button>
                  <Button
                    variant={filterStatus === 'expired' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('expired')}
                  >
                    Expirados
                  </Button>
                </div>
              </div>

              {/* Token Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Filtrar por tokens:</span>
                <Button
                  variant={tokenFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTokenFilter('all')}
                >
                  Todos
                </Button>
                <Button
                  variant={tokenFilter === 'with-limit' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTokenFilter('with-limit')}
                >
                  Com Limite
                </Button>
                <Button
                  variant={tokenFilter === 'no-limit' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTokenFilter('no-limit')}
                >
                  Ilimitados
                </Button>
                <Button
                  variant={tokenFilter === 'over-limit' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTokenFilter('over-limit')}
                >
                  Limite Excedido
                </Button>
              </div>

              {/* Bulk Actions */}
              {selectedUsers.size > 0 && (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      {selectedUsers.size} usuário(s) selecionado(s)
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsBulkEditOpen(true)}
                    >
                      <Settings className="w-4 h-4" />
                      Editar Limite
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedUsers(new Set())}
                    >
                      <X className="w-4 h-4" />
                      Limpar
                    </Button>
                  </div>
                </div>
              )}

              {/* Export Button */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                >
                  <Download className="w-4 h-4" />
                  Exportar CSV
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-12">
                      <input
                        type="checkbox"
                        checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-border"
                      />
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Nome
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Cadastro
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Último Acesso
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Assinatura
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Tokens Usados
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhum usuário encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border-b border-border/50 hover:bg-muted/30 transition-gentle"
                      >
                        <td className="py-4 px-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.id)}
                            onChange={() => handleSelectUser(user.id)}
                            className="w-4 h-4 rounded border-border"
                          />
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-foreground">{user.name}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-foreground">
                            {formatFullDate(user.registrationDate)}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-foreground">
                            {formatDate(user.lastAccess)}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(user.subscriptionStatus)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm">
                            <div className="font-medium text-foreground">
                              {formatTokens(user.totalTokensUsed)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                              <div>
                                Input: {formatTokens(user.inputTokensUsed || 0)} ({formatCost((user.inputTokensUsed || 0) / 1_000_000 * 0.15)})
                              </div>
                              <div>
                                Output: {formatTokens(user.outputTokensUsed || 0)} ({formatCost((user.outputTokensUsed || 0) / 1_000_000 * 0.60)})
                              </div>
                              <div className="mt-1 font-medium">
                                Total: {formatCost(calculateTokenCost(user.inputTokensUsed || 0, user.outputTokensUsed || 0))}
                              </div>
                            </div>
                            {user.tokenLimit && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Limite: {formatTokens(user.tokenLimit)}
                                {' '}
                                ({Math.round(((user.totalTokensUsed || 0) / user.tokenLimit) * 100)}%)
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingUser(user);
                                setIsEditModalOpen(true);
                              }}
                              className="text-primary border-primary/20 hover:bg-primary/10"
                            >
                              <Edit className="w-4 h-4" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleToggleSubscription(
                                  user.id,
                                  user.subscriptionStatus === 'active'
                                )
                              }
                              className={
                                user.subscriptionStatus === 'active'
                                  ? 'text-red-600 border-red-200 hover:bg-red-50'
                                  : 'text-green-600 border-green-200 hover:bg-green-50'
                              }
                            >
                              {user.subscriptionStatus === 'active' ? (
                                <>
                                  <XCircle className="w-4 h-4" />
                                  Desativar
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  Ativar
                                </>
                              )}
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              Mostrando {filteredUsers.length} de {users.length} usuários
            </div>
          </CardContent>
        </Card>

        {/* Edit User Modal */}
        <EditUserModal
          user={editingUser}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingUser(null);
          }}
          onUpdate={loadData}
        />

        {/* Bulk Edit Modal */}
        <BulkTokenEditModal
          isOpen={isBulkEditOpen}
          onClose={() => {
            setIsBulkEditOpen(false);
          }}
          selectedUserIds={Array.from(selectedUsers)}
          selectedCount={selectedUsers.size}
          onUpdate={() => {
            loadData();
            setSelectedUsers(new Set());
          }}
        />
      </div>
    </div>
  );
}
