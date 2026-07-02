import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';

type User = {
  id: number; username: string; email: string; balance: number;
  xp: number; level: number; vip_tier: string; is_admin: boolean;
  is_banned: boolean; created_at: string; last_seen: string;
};
type Stats = {
  total_users: number; online: number; paid_today: number;
  active_tournaments: number; total_pzc: number;
};
type Tournament = {
  id: number; name: string; tier: string; prize_pool: number;
  entry_fee: number; max_players: number; status: string;
  starts_at: string; ends_at: string;
};
type Tx = {
  id: number; user_id: number; type: string; amount: number;
  balance_before: number; balance_after: number; description: string; created_at: string;
};

const TABS = [
  { id: 'stats', label: 'Статистика', icon: 'BarChart3' },
  { id: 'users', label: 'Пользователи', icon: 'Users' },
  { id: 'transactions', label: 'Транзакции', icon: 'ArrowLeftRight' },
  { id: 'tournaments', label: 'Турниры', icon: 'Trophy' },
];

const VIP_TIERS = ['none', 'Bronze', 'Silver', 'Gold', 'Plazma'];

export default function Admin() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [balanceDelta, setBalanceDelta] = useState('');
  const [balanceReason, setBalanceReason] = useState('');
  const [txs, setTxs] = useState<Tx[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tournamentForm, setTournamentForm] = useState<Partial<Tournament> | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // Auth guard
  useEffect(() => {
    if (!localStorage.getItem('session_id') || localStorage.getItem('is_admin') !== '1') {
      navigate('/auth');
    }
  }, [navigate]);

  const loadStats = useCallback(async () => {
    const res = await api.adminStats();
    if (!res.error) setStats(res);
  }, []);

  const loadUsers = useCallback(async (search = '') => {
    const res = await api.adminUsers(search);
    if (!res.error) { setUsers(res.users); setUsersTotal(res.total); }
  }, []);

  const loadTxs = useCallback(async () => {
    const res = await api.adminTransactions();
    if (!res.error) setTxs(res.transactions);
  }, []);

  const loadTournaments = useCallback(async () => {
    const res = await api.adminTournaments();
    if (!res.error) setTournaments(res.tournaments);
  }, []);

  useEffect(() => {
    if (tab === 'stats') loadStats();
    if (tab === 'users') loadUsers();
    if (tab === 'transactions') loadTxs();
    if (tab === 'tournaments') loadTournaments();
  }, [tab, loadStats, loadUsers, loadTxs, loadTournaments]);

  async function applyBalance() {
    if (!selectedUser || !balanceDelta) return;
    setSaving(true);
    const res = await api.adminUserUpdate({
      user_id: selectedUser.id,
      balance_delta: parseInt(balanceDelta),
      reason: balanceReason || 'Корректировка администратором',
    });
    setSaving(false);
    if (res.error) { setMsg(res.error); return; }
    setMsg('Баланс обновлён');
    setBalanceDelta(''); setBalanceReason('');
    loadUsers(userSearch);
    setSelectedUser(null);
  }

  async function toggleBan(u: User) {
    await api.adminUserUpdate({ user_id: u.id, is_banned: !u.is_banned });
    loadUsers(userSearch);
  }

  async function setVip(u: User, vip_tier: string) {
    await api.adminUserUpdate({ user_id: u.id, vip_tier });
    loadUsers(userSearch);
  }

  async function saveTournament() {
    if (!tournamentForm) return;
    setSaving(true);
    await api.adminTournamentSave(tournamentForm);
    setSaving(false);
    setTournamentForm(null);
    loadTournaments();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="glass border-b border-border sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg plasma-gradient flex items-center justify-center">
              <Icon name="Shield" size={16} className="text-background" />
            </div>
            <span className="font-display text-lg font-bold">
              ADMIN <span className="text-plasma">PANEL</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            {msg && <span className="text-xs text-neon-cyan animate-rise">{msg}</span>}
            <Button size="sm" variant="outline" onClick={() => navigate('/')}
              className="neon-border text-sm">
              <Icon name="ArrowLeft" size={14} className="mr-1" /> На сайт
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); setMsg(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                tab === t.id
                  ? 'plasma-gradient text-background box-glow'
                  : 'glass neon-border text-muted-foreground hover:text-foreground'
              }`}>
              <Icon name={t.icon} size={16} /> {t.label}
            </button>
          ))}
        </div>

        {/* STATS */}
        {tab === 'stats' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: 'Всего игроков', value: stats.total_users, icon: 'Users', color: 'text-neon-cyan' },
                { label: 'Онлайн (15 мин)', value: stats.online, icon: 'Wifi', color: 'text-neon-cyan' },
                { label: 'Выплачено сегодня', value: `${stats.paid_today.toLocaleString()} PZC`, icon: 'Coins', color: 'text-neon-purple' },
                { label: 'Турниров активных', value: stats.active_tournaments, icon: 'Trophy', color: 'text-neon-pink' },
                { label: 'PZC в обороте', value: `${stats.total_pzc.toLocaleString()}`, icon: 'Gem', color: 'text-neon-purple' },
              ].map((s) => (
                <div key={s.label} className="glass rounded-2xl p-5 border border-border">
                  <Icon name={s.icon} size={20} className={`${s.color} mb-3`} />
                  <div className="font-display text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* USERS */}
        {tab === 'users' && (
          <div className="space-y-4">
            <div className="flex gap-3 items-center">
              <div className="relative flex-1 max-w-sm">
                <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); loadUsers(e.target.value); }}
                  placeholder="Поиск по нику или email..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/60" />
              </div>
              <span className="text-xs text-muted-foreground">{usersTotal} игроков</span>
            </div>

            <div className="glass rounded-2xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['ID', 'Никнейм', 'Email', 'Баланс PZC', 'VIP', 'Статус', 'Действия'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">Пользователей нет</td></tr>
                  )}
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/40 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{u.id}</td>
                      <td className="px-4 py-3 font-medium">
                        {u.username}
                        {u.is_admin && <span className="ml-1 text-[10px] text-neon-purple">ADMIN</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{u.email}</td>
                      <td className="px-4 py-3 font-semibold text-neon-cyan">{u.balance.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <select value={u.vip_tier}
                          onChange={(e) => setVip(u, e.target.value)}
                          className="bg-secondary border border-border rounded-lg px-2 py-1 text-xs">
                          {VIP_TIERS.map((v) => <option key={v}>{v}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${u.is_banned ? 'bg-destructive/20 text-destructive' : 'bg-neon-cyan/10 text-neon-cyan'}`}>
                          {u.is_banned ? 'Забанен' : 'Активен'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => setSelectedUser(u)}
                            className="text-xs px-2 py-1 rounded-lg glass neon-border hover:text-neon-cyan transition-colors">
                            Баланс
                          </button>
                          <button onClick={() => toggleBan(u)}
                            className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                              u.is_banned
                                ? 'bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20'
                                : 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                            }`}>
                            {u.is_banned ? 'Разбанить' : 'Забанить'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Balance modal */}
            {selectedUser && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                <div className="glass rounded-2xl border border-border p-6 w-full max-w-md box-glow">
                  <h3 className="font-display text-lg font-bold mb-1">Изменить баланс</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {selectedUser.username} · текущий баланс: <span className="text-neon-cyan font-semibold">{selectedUser.balance.toLocaleString()} PZC</span>
                  </p>
                  <div className="space-y-3">
                    <input type="number" value={balanceDelta} onChange={(e) => setBalanceDelta(e.target.value)}
                      placeholder="Сумма (+ начислить / - списать)"
                      className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/60" />
                    <input type="text" value={balanceReason} onChange={(e) => setBalanceReason(e.target.value)}
                      placeholder="Причина (необязательно)"
                      className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/60" />
                  </div>
                  <div className="flex gap-3 mt-4">
                    <Button onClick={applyBalance} disabled={saving}
                      className="flex-1 plasma-gradient text-background font-semibold">
                      {saving ? <Icon name="Loader" size={16} className="animate-spin" /> : 'Применить'}
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedUser(null)} className="flex-1 neon-border">
                      Отмена
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TRANSACTIONS */}
        {tab === 'transactions' && (
          <div className="glass rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['ID', 'User ID', 'Тип', 'Сумма', 'До', 'После', 'Описание', 'Дата'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {txs.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">Транзакций нет</td></tr>
                )}
                {txs.map((t) => (
                  <tr key={t.id} className="border-b border-border/50 hover:bg-secondary/40 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{t.id}</td>
                    <td className="px-4 py-3">{t.user_id}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        t.type === 'deposit' ? 'bg-neon-cyan/10 text-neon-cyan'
                        : t.type === 'admin_adjust' && t.amount > 0 ? 'bg-neon-purple/10 text-neon-purple'
                        : 'bg-destructive/10 text-destructive'
                      }`}>{t.type}</span>
                    </td>
                    <td className={`px-4 py-3 font-semibold ${t.amount > 0 ? 'text-neon-cyan' : 'text-destructive'}`}>
                      {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{t.balance_before.toLocaleString()}</td>
                    <td className="px-4 py-3">{t.balance_after.toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-[160px] truncate">{t.description}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(t.created_at).toLocaleString('ru')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TOURNAMENTS */}
        {tab === 'tournaments' && (
          <div className="space-y-4">
            <Button onClick={() => setTournamentForm({ name: '', tier: 'Про', prize_pool: 0, entry_fee: 0, max_players: 100, status: 'upcoming' })}
              className="plasma-gradient text-background font-semibold hover:opacity-90">
              <Icon name="Plus" size={16} className="mr-1" /> Создать турнир
            </Button>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tournaments.length === 0 && (
                <div className="col-span-3 text-center py-12 text-muted-foreground">
                  <Icon name="Trophy" size={32} className="mx-auto mb-3 opacity-30" />
                  <p>Турниров пока нет</p>
                </div>
              )}
              {tournaments.map((t) => (
                <div key={t.id} className="glass rounded-2xl p-5 border border-border hover:neon-border transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-display text-base font-semibold">{t.name}</h3>
                      <span className="text-xs text-neon-cyan">{t.tier}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                      t.status === 'active' ? 'bg-neon-cyan/10 text-neon-cyan'
                      : t.status === 'upcoming' ? 'bg-neon-purple/10 text-neon-purple'
                      : 'bg-muted text-muted-foreground'
                    }`}>{t.status}</span>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between"><span>Призовой фонд</span><span className="text-neon-cyan font-semibold">{t.prize_pool.toLocaleString()} PZC</span></div>
                    <div className="flex justify-between"><span>Взнос</span><span>{t.entry_fee.toLocaleString()} PZC</span></div>
                    <div className="flex justify-between"><span>Мест</span><span>{t.max_players}</span></div>
                  </div>
                  <Button size="sm" variant="outline" className="w-full mt-4 neon-border text-xs"
                    onClick={() => setTournamentForm({ ...t })}>
                    <Icon name="Pencil" size={13} className="mr-1" /> Редактировать
                  </Button>
                </div>
              ))}
            </div>

            {/* Tournament form modal */}
            {tournamentForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                <div className="glass rounded-2xl border border-border p-6 w-full max-w-md box-glow">
                  <h3 className="font-display text-lg font-bold mb-4">
                    {tournamentForm.id ? 'Редактировать турнир' : 'Новый турнир'}
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Название', key: 'name', type: 'text' },
                      { label: 'Призовой фонд (PZC)', key: 'prize_pool', type: 'number' },
                      { label: 'Взнос (PZC)', key: 'entry_fee', type: 'number' },
                      { label: 'Максимум игроков', key: 'max_players', type: 'number' },
                    ].map((f) => (
                      <div key={f.key}>
                        <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
                        <input type={f.type}
                          value={(tournamentForm as Record<string, unknown>)[f.key] as string ?? ''}
                          onChange={(e) => setTournamentForm((prev) => ({ ...prev, [f.key]: f.type === 'number' ? +e.target.value : e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/60" />
                      </div>
                    ))}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Уровень</label>
                      <select value={tournamentForm.tier || 'Про'}
                        onChange={(e) => setTournamentForm((p) => ({ ...p, tier: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm">
                        {['Новичок', 'Про', 'Элита', 'Легенда'].map((v) => <option key={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Статус</label>
                      <select value={tournamentForm.status || 'upcoming'}
                        onChange={(e) => setTournamentForm((p) => ({ ...p, status: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm">
                        {['upcoming', 'active', 'finished'].map((v) => <option key={v}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-5">
                    <Button onClick={saveTournament} disabled={saving}
                      className="flex-1 plasma-gradient text-background font-semibold">
                      {saving ? <Icon name="Loader" size={16} className="animate-spin" /> : 'Сохранить'}
                    </Button>
                    <Button variant="outline" onClick={() => setTournamentForm(null)} className="flex-1 neon-border">
                      Отмена
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
