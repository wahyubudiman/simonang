import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Lock, 
  LogOut, 
  PlusCircle, 
  RefreshCw, 
  Database,
  Grid,
  FileText,
  Briefcase,
  AlertTriangle,
  UserCheck,
  Trash2,
  Edit,
  Settings,
  UserPlus,
  X,
  CheckSquare,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  History,
  CheckCircle2,
  XCircle,
  Send,
  Activity,
  Layers
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Area, AreaChart,
  CartesianGrid, XAxis, YAxis
} from 'recharts';
import Login from './components/Login';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [prks, setPrks] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [users, setUsers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  
  // Dynamic RBAC State
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [rbacMatrix, setRbacMatrix] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Navigation Routing State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Form Loading states
  const [formLoading, setFormLoading] = useState(false);

  // Modal Control States
  const [prkModalOpen, setPrkModalOpen] = useState(false);
  const [prkEditing, setPrkEditing] = useState(null);
  const [prkForm, setPrkForm] = useState({ nomor_prk: '', uraian_prk: '', jenis_anggaran: 'OPERASI', tahun: 2026, nilai_pagu: 0 });

  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [contractEditing, setContractEditing] = useState(null);
  const [contractForm, setContractForm] = useState({ 
    prk_id: '', 
    nomor_kontrak: '', 
    judul_pekerjaan: '', 
    vendor: '', 
    nilai_kontrak: 0, 
    status_proses: 'PROSES',
    tgl_nd: '',
    no_nd: '',
    user_bidang: 'PEMELIHARAAN',
    hari_kerja: 30
  });

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userEditing, setUserEditing] = useState(null);
  const [userForm, setUserForm] = useState({ name: '', username: '', password: '', role: '' });

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleEditing, setRoleEditing] = useState(null);
  const [roleForm, setRoleForm] = useState({ name: '', deskripsi: '' });

  // Audit Log State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditSearch, setAuditSearch] = useState('');

  // Revisi Pagu Modal States
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [revisionTargetPrk, setRevisionTargetPrk] = useState(null);
  const [revisionForm, setRevisionForm] = useState({ nilai_pagu_baru: 0, nomor_revisi: '', alasan_revisi: '' });
  const [revisionHistoryModalOpen, setRevisionHistoryModalOpen] = useState(false);
  const [revisionHistory, setRevisionHistory] = useState([]);

  // Multi-level Approval Modal States
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [approvalTargetContract, setApprovalTargetContract] = useState(null);
  const [approvalAction, setApprovalAction] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');

  // Dynamic permission verification utility
  const hasPermission = (permissionCode) => {
    if (currentUser?.role === 'ADMIN') return true; // Superadmin bypass
    return currentUser?.permissions?.includes(permissionCode) || false;
  };

  const hasPrkWriteAccess = hasPermission('prk:write');
  const hasContractWriteAccess = hasPermission('contract:write');
  const hasUserManageAccess = hasPermission('user:manage');
  const hasRbacManageAccess = hasPermission('rbac:manage');
  const hasAuditReadAccess = hasPermission('audit:read');
  const hasPaguReviseAccess = hasPermission('pagu:revise');
  const hasFinanceApproveAccess = hasPermission('contract:approve_finance');
  const hasManagerApproveAccess = hasPermission('contract:approve_manager');

  // Authenticate user check on mount
  useEffect(() => {
    const cachedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (cachedUser && token) {
      setCurrentUser(JSON.parse(cachedUser));
    }
  }, []);

  // Open User submenu automatically if active tab relates to user settings
  useEffect(() => {
    if (['users', 'rbac', 'roles', 'audit'].includes(activeTab)) {
      setUserMenuOpen(true);
    }
  }, [activeTab]);

  // Fetch PRK Data
  const fetchPRKData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/prks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleLogout();
          throw new Error('Sesi telah habis, silakan login kembali');
        }
        throw new Error('Gagal mengambil data PRK');
      }

      const data = await response.json();
      setPrks(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Contracts Data
  const fetchContractsData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/contracts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setContracts(data || []);
      }
    } catch (err) {
      console.error('Failed to load contracts:', err);
    }
  };

  // Fetch Users
  const fetchUsersData = async () => {
    const token = localStorage.getItem('token');
    if (!token || !hasUserManageAccess) return;

    try {
      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  // Fetch Alerts (EWS)
  const fetchAlertsData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/alerts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts(data || []);
      }
    } catch (err) {
      console.error('Failed to load alerts:', err);
    }
  };

  // Fetch Roles
  const fetchRolesData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/rbac/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(data || []);
      }
    } catch (err) {
      console.error('Failed to load roles:', err);
    }
  };

  // Fetch RBAC Matrix Definitions
  const fetchPermissionsData = async () => {
    const token = localStorage.getItem('token');
    if (!token || !hasRbacManageAccess) return;

    try {
      const response = await fetch(`${API_URL}/api/rbac/permissions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPermissions(data || []);
      }
    } catch (err) {
      console.error('Failed to load permissions:', err);
    }
  };

  const fetchRBACMatrixData = async () => {
    const token = localStorage.getItem('token');
    if (!token || !hasRbacManageAccess) return;

    try {
      const response = await fetch(`${API_URL}/api/rbac/matrix`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRbacMatrix(data || []);
      }
    } catch (err) {
      console.error('Failed to load RBAC matrix:', err);
    }
  };

  const fetchAuditLogsData = async () => {
    const token = localStorage.getItem('token');
    if (!token || (!hasAuditReadAccess && currentUser?.role !== 'ADMIN')) return;

    try {
      const response = await fetch(`${API_URL}/api/audit-logs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
  };

  // Sync / Refresh all data
  const refreshAllData = () => {
    fetchPRKData();
    fetchContractsData();
    fetchAlertsData();
    fetchRolesData();
    if (hasUserManageAccess) {
      fetchUsersData();
    }
    if (hasRbacManageAccess) {
      fetchPermissionsData();
      fetchRBACMatrixData();
    }
    if (hasAuditReadAccess || currentUser?.role === 'ADMIN') {
      fetchAuditLogsData();
    }
  };

  // Fetch data and setup polling every 10 seconds for real-time EWS
  useEffect(() => {
    if (currentUser) {
      refreshAllData();
      
      const interval = setInterval(() => {
        refreshAllData();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setPrks([]);
    setContracts([]);
    setUsers([]);
    setAlerts([]);
    setRoles([]);
    setPermissions([]);
    setRbacMatrix([]);
    setActiveTab('dashboard');
  };

  // ==========================================
  // PRK CRUD ACTIONS
  // ==========================================
  const handleOpenPrkModal = (prk = null) => {
    if (prk) {
      setPrkEditing(prk);
      setPrkForm({
        nomor_prk: prk.nomor_prk,
        uraian_prk: prk.uraian_prk,
        jenis_anggaran: prk.jenis_anggaran,
        tahun: prk.tahun,
        nilai_pagu: prk.pagu_total
      });
    } else {
      setPrkEditing(null);
      setPrkForm({
        nomor_prk: '',
        uraian_prk: '',
        jenis_anggaran: 'OPERASI',
        tahun: 2026,
        nilai_pagu: 0
      });
    }
    setPrkModalOpen(true);
  };

  const handleSavePrk = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');
    setSuccess('');

    const token = localStorage.getItem('token');
    const url = prkEditing ? `${API_URL}/api/prks/${prkEditing.id}` : `${API_URL}/api/prks`;
    const method = prkEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nomor_prk: prkForm.nomor_prk,
          uraian_prk: prkForm.uraian_prk,
          jenis_anggaran: prkForm.jenis_anggaran,
          tahun: parseInt(prkForm.tahun),
          nilai_pagu: parseFloat(prkForm.nilai_pagu)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menyimpan data PRK');
      }

      setSuccess(prkEditing ? 'PRK & Pagu berhasil diperbarui!' : 'PRK & Pagu baru berhasil dibuat!');
      setPrkModalOpen(false);
      refreshAllData();
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeletePrk = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus PRK ini? Seluruh data Pagu dan Kontrak di dalamnya akan terhapus secara permanen.')) return;

    setError('');
    setSuccess('');
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/api/prks/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal menghapus PRK');
      }

      setSuccess('PRK berhasil dihapus dari database.');
      refreshAllData();
    } catch (err) {
      setError(err.message);
    }
  };

  // ==========================================
  // CONTRACT CRUD ACTIONS
  // ==========================================
  const handleOpenContractModal = (contract = null) => {
    if (contract) {
      setContractEditing(contract);
      setContractForm({
        prk_id: contract.prk_id,
        nomor_kontrak: contract.nomor_kontrak,
        judul_pekerjaan: contract.judul_pekerjaan,
        vendor: contract.vendor,
        nilai_kontrak: contract.nilai_kontrak,
        status_proses: contract.status_proses,
        tgl_nd: contract.tgl_nd || '',
        no_nd: contract.no_nd || '',
        user_bidang: contract.user_bidang || 'PEMELIHARAAN',
        hari_kerja: contract.hari_kerja || 30
      });
    } else {
      setContractEditing(null);
      setContractForm({
        prk_id: prks.length > 0 ? prks[0].id : '',
        nomor_kontrak: '',
        judul_pekerjaan: '',
        vendor: '',
        nilai_kontrak: 0,
        status_proses: 'PROSES',
        tgl_nd: '',
        no_nd: '',
        user_bidang: 'PEMELIHARAAN',
        hari_kerja: 30
      });
    }
    setContractModalOpen(true);
  };

  const handleSaveContract = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');
    setSuccess('');

    const token = localStorage.getItem('token');
    const url = contractEditing ? `${API_URL}/api/contracts/${contractEditing.id}` : `${API_URL}/api/contracts`;
    const method = contractEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prk_id: parseInt(contractForm.prk_id),
          nomor_kontrak: contractForm.nomor_kontrak,
          judul_pekerjaan: contractForm.judul_pekerjaan,
          vendor: contractForm.vendor,
          nilai_kontrak: parseFloat(contractForm.nilai_kontrak),
          status_proses: contractForm.status_proses,
          tgl_nd: contractForm.tgl_nd,
          no_nd: contractForm.no_nd,
          user_bidang: contractForm.user_bidang,
          hari_kerja: parseInt(contractForm.hari_kerja || 0)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menyimpan kontrak');
      }

      setSuccess(contractEditing ? 'Kontrak berhasil diperbarui!' : 'Kontrak baru berhasil disimpan!');
      setContractModalOpen(false);
      refreshAllData();
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteContract = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus kontrak ini? Tindakan ini akan mengembalikan kapasitas sisa pagu PRK.')) return;

    setError('');
    setSuccess('');
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/api/contracts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal menghapus kontrak');
      }

      setSuccess('Kontrak berhasil dihapus.');
      refreshAllData();
    } catch (err) {
      setError(err.message);
    }
  };

  // ==========================================
  // REVISI PAGU (ADENDUM / APBD-P) ACTIONS
  // ==========================================
  const handleOpenRevisionModal = (prk) => {
    setRevisionTargetPrk(prk);
    setRevisionForm({
      nilai_pagu_baru: prk.pagu_total || 0,
      nomor_revisi: '',
      alasan_revisi: ''
    });
    setRevisionModalOpen(true);
  };

  const handleSaveRevision = async (e) => {
    e.preventDefault();
    if (!revisionTargetPrk) return;

    setFormLoading(true);
    setError('');
    setSuccess('');
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/api/prks/${revisionTargetPrk.id}/revise`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nilai_pagu_baru: parseFloat(revisionForm.nilai_pagu_baru),
          nomor_revisi: revisionForm.nomor_revisi,
          alasan_revisi: revisionForm.alasan_revisi
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal menyimpan revisi pagu');
      }

      setSuccess(`Revisi pagu (SK: ${revisionForm.nomor_revisi}) berhasil disimpan!`);
      setRevisionModalOpen(false);
      refreshAllData();
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleViewRevisionHistory = async (prk) => {
    setRevisionTargetPrk(prk);
    setRevisionHistory([]);
    setRevisionHistoryModalOpen(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/api/prks/${prk.id}/revisions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRevisionHistory(data || []);
      }
    } catch (err) {
      console.error('Failed to load revision history:', err);
    }
  };

  // ==========================================
  // MULTI-LEVEL APPROVAL WORKFLOW ACTIONS
  // ==========================================
  const handleOpenApprovalModal = (contract, action) => {
    setApprovalTargetContract(contract);
    setApprovalAction(action);
    setApprovalNotes('');
    setApprovalModalOpen(true);
  };

  const handleProcessApproval = async (e) => {
    e.preventDefault();
    if (!approvalTargetContract || !approvalAction) return;

    setFormLoading(true);
    setError('');
    setSuccess('');
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/api/contracts/${approvalTargetContract.id}/approval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: approvalAction,
          notes: approvalNotes
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal memproses persetujuan kontrak');
      }

      setSuccess(`Status persetujuan kontrak #${approvalTargetContract.nomor_kontrak} berhasil diperbarui!`);
      setApprovalModalOpen(false);
      refreshAllData();
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // ==========================================
  // USER CRUD ACTIONS
  // ==========================================
  const handleOpenUserModal = (user = null) => {
    if (user) {
      setUserEditing(user);
      setUserForm({
        name: user.name,
        username: user.username,
        password: '',
        role: user.role
      });
    } else {
      setUserEditing(null);
      setUserForm({
        name: '',
        username: '',
        password: '',
        role: roles.length > 0 ? roles[0].name : 'PERENCANAAN'
      });
    }
    setUserModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');
    setSuccess('');

    const token = localStorage.getItem('token');
    const url = userEditing ? `${API_URL}/api/users/${userEditing.id}` : `${API_URL}/api/users`;
    const method = userEditing ? 'PUT' : 'POST';

    const payload = {
      name: userForm.name,
      username: userForm.username,
      role: userForm.role
    };
    if (userForm.password || !userEditing) {
      payload.password = userForm.password;
    }

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menyimpan user');
      }

      setSuccess(userEditing ? 'User berhasil diperbarui!' : 'User baru berhasil didaftarkan!');
      setUserModalOpen(false);
      refreshAllData();
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus user ini?')) return;

    setError('');
    setSuccess('');
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal menghapus user');
      }

      setSuccess('User berhasil dihapus.');
      refreshAllData();
    } catch (err) {
      setError(err.message);
    }
  };

  // ==========================================
  // DYNAMIC RBAC MATRIX INTERACTION
  // ==========================================
  const handleTogglePermission = (role, permissionCode) => {
    if (role === 'ADMIN') return; // Superadmin bypass edit

    setRbacMatrix(prev => {
      const exists = prev.some(m => m.role_name === role && m.permission_code === permissionCode);
      if (exists) {
        return prev.filter(m => !(m.role_name === role && m.permission_code === permissionCode));
      } else {
        return [...prev, { role_name: role, permission_code: permissionCode }];
      }
    });
  };

  const handleSaveRBACMatrix = async () => {
    setFormLoading(true);
    setError('');
    setSuccess('');
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/api/rbac/matrix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mappings: rbacMatrix })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal memperbarui matriks RBAC');
      }

      setSuccess('Matriks RBAC berhasil diperbarui! Perubahan hak akses akan diterapkan saat pengguna melakukan login ulang.');
      refreshAllData();
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // ==========================================
  // ROLE CRUD ACTIONS
  // ==========================================
  const handleOpenRoleModal = (role = null) => {
    if (role) {
      setRoleEditing(role);
      setRoleForm({
        name: role.name,
        deskripsi: role.deskripsi
      });
    } else {
      setRoleEditing(null);
      setRoleForm({
        name: '',
        deskripsi: ''
      });
    }
    setRoleModalOpen(true);
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');
    setSuccess('');

    const token = localStorage.getItem('token');
    const url = roleEditing ? `${API_URL}/api/rbac/roles/${roleEditing.name}` : `${API_URL}/api/rbac/roles`;
    const method = roleEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(roleForm)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal menyimpan role');
      }

      setSuccess(roleEditing ? 'Peran berhasil diperbarui! Seluruh data user terkait telah dimigrasikan secara transaksional.' : 'Peran baru berhasil disimpan!');
      setRoleModalOpen(false);
      refreshAllData();
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteRole = async (name) => {
    if (name === 'ADMIN') {
      alert('Role ADMIN tidak dapat dihapus.');
      return;
    }
    if (!window.confirm(`Apakah Anda yakin ingin menghapus peran "${name}"? Seluruh konfigurasi matriks izin peran ini juga akan terhapus.`)) return;

    setError('');
    setSuccess('');
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/api/rbac/roles/${name}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal menghapus role');
      }

      setSuccess('Peran berhasil dihapus.');
      refreshAllData();
    } catch (err) {
      setError(err.message);
    }
  };

  // ==========================================
  // EXPORT TO EXCEL (CSV) METHODS
  // ==========================================
  const exportPRKToCSV = () => {
    if (prks.length === 0) return;
    
    let csvContent = 'Nomor PRK,Uraian Pekerjaan,Jenis Anggaran,Tahun,Pagu Total,Terkontrak,Sisa Pagu\r\n';
    
    prks.forEach((prk) => {
      const row = [
        `"${prk.nomor_prk}"`,
        `"${prk.uraian_prk.replace(/"/g, '""')}"`,
        `"${prk.jenis_anggaran}"`,
        prk.tahun,
        prk.pagu_total,
        prk.kontrak_total,
        prk.sisa_pagu
      ].join(',');
      csvContent += row + '\r\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'rekap_detail_prk_pagu.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportContractsToCSV = () => {
    if (contracts.length === 0) return;

    let csvContent = 'Nomor Kontrak,Judul Pekerjaan,Vendor,Nilai Kontrak,Nomor PRK,Nomor ND,Tanggal ND,User Bidang,Hari Kerja,Status\r\n';

    contracts.forEach((row) => {
      const associatedPRK = prks.find(p => p.id === row.prk_id);
      const prkNum = associatedPRK ? associatedPRK.nomor_prk : 'N/A';
      
      const csvRow = [
        `"${row.nomor_kontrak}"`,
        `"${row.judul_pekerjaan.replace(/"/g, '""')}"`,
        `"${row.vendor}"`,
        row.nilai_kontrak,
        `"${prkNum}"`,
        `"${row.no_nd || ''}"`,
        `"${row.tgl_nd || ''}"`,
        `"${row.user_bidang || ''}"`,
        row.hari_kerja || 0,
        `"${row.status_proses}"`
      ].join(',');
      csvContent += csvRow + '\r\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'monitoring_kontrak_proses.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate high-level KPIs
  const totalPagu = prks.reduce((sum, item) => sum + item.pagu_total, 0);
  const totalTerkontrak = contracts.reduce((sum, c) => sum + c.nilai_kontrak, 0);
  const totalRealisasi = contracts.filter(c => c.status_proses === 'SELESAI').reduce((sum, c) => sum + c.nilai_kontrak, 0);
  const totalProsesValue = contracts.filter(c => c.status_proses === 'PROSES').reduce((sum, c) => sum + c.nilai_kontrak, 0);
  const totalDraftValue = contracts.filter(c => c.status_proses === 'DRAFT').reduce((sum, c) => sum + c.nilai_kontrak, 0);
  const totalSisa = totalPagu - totalTerkontrak > 0 ? totalPagu - totalTerkontrak : 0;

  // Formatted currencies
  const formatIDR = (num) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  // Pie chart data
  const chartData = [
    { name: 'Realisasi (Selesai)', value: totalRealisasi, color: '#10b981' }, 
    { name: 'Komitmen (Proses)', value: totalProsesValue + totalDraftValue, color: '#06b6d4' }, 
    { name: 'Sisa Pagu (Bebas)', value: totalSisa, color: '#475569' }, 
  ];

  // S-Curve target vs actual
  const targetPercentages = [5, 12, 22, 35, 48, 62, 72, 80, 87, 92, 97, 100];
  const actualAccumulated = [
    totalRealisasi * 0.05,
    totalRealisasi * 0.12,
    totalRealisasi * 0.25,
    totalRealisasi * 0.42,
    totalRealisasi * 0.65,
    totalRealisasi * 0.85,
    totalRealisasi,
  ];

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const sCurveData = months.map((month, index) => {
    const plannedVal = totalPagu > 0 ? (targetPercentages[index] / 100) * totalPagu : 0;
    let realVal = null;
    if (index < actualAccumulated.length) {
      realVal = actualAccumulated[index];
    }
    return {
      month,
      'Target Prognosa': plannedVal,
      'Realisasi Pembayaran': realVal
    };
  });

  if (!currentUser) {
    return <Login onLoginSuccess={setCurrentUser} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#090d16] text-white">
      {/* Sidebar - HIDDEN DURING PRINT */}
      <aside className="w-64 glassmorphism-sidebar flex flex-col justify-between p-6 shrink-0 no-print">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-extrabold text-sm">
              ⚡
            </div>
            <div>
              <h1 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 leading-none">
                Si Monang
              </h1>
              <span className="text-[9px] tracking-wider text-cyan-400/80 font-bold uppercase">
                Sistem Informasi Anggaran
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-r-lg text-sm font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-500/10 border-l-2 border-cyan-500 text-cyan-400'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Grid size={18} />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('rekap')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-r-lg text-sm font-semibold transition-all ${
                activeTab === 'rekap'
                  ? 'bg-cyan-500/10 border-l-2 border-cyan-500 text-cyan-400'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText size={18} />
              Rekap PRK
            </button>
            <button
              onClick={() => setActiveTab('monitoring')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-r-lg text-sm font-semibold transition-all ${
                activeTab === 'monitoring'
                  ? 'bg-cyan-500/10 border-l-2 border-cyan-500 text-cyan-400'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Briefcase size={18} />
              Monitoring
            </button>

            {/* Collapsible Dropdown "Konfigurasi Akses" */}
            {(hasUserManageAccess || hasRbacManageAccess || hasAuditReadAccess || currentUser?.role === 'ADMIN') && (
              <div className="space-y-0.5">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-r-lg text-sm font-semibold transition-all ${
                    ['users', 'rbac', 'roles', 'audit'].includes(activeTab)
                      ? 'bg-cyan-500/5 text-cyan-400'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Settings size={18} />
                    <span>Konfigurasi Akses</span>
                  </div>
                  {userMenuOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {/* Sub-menu panel */}
                {userMenuOpen && (
                  <div className="pl-6 border-l border-white/5 mt-0.5 space-y-0.5">
                    {hasUserManageAccess && (
                      <button
                        onClick={() => setActiveTab('users')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                          activeTab === 'users'
                            ? 'bg-cyan-500/10 text-cyan-400 font-bold'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <UserCheck size={14} />
                        Daftar Pengguna
                      </button>
                    )}
                    
                    {hasRbacManageAccess && (
                      <button
                        onClick={() => setActiveTab('rbac')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                          activeTab === 'rbac'
                            ? 'bg-cyan-500/10 text-cyan-400 font-bold'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Lock size={14} />
                        Matriks RBAC
                      </button>
                    )}

                    {hasRbacManageAccess && (
                      <button
                        onClick={() => setActiveTab('roles')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                          activeTab === 'roles'
                            ? 'bg-cyan-500/10 text-cyan-400 font-bold'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <ShieldAlert size={14} />
                        Pengaturan Peran
                      </button>
                    )}

                    {(hasAuditReadAccess || currentUser?.role === 'ADMIN') && (
                      <button
                        onClick={() => setActiveTab('audit')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                          activeTab === 'audit'
                            ? 'bg-cyan-500/10 text-cyan-400 font-bold'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <History size={14} />
                        Log Audit Transaksi
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>

        {/* User Card */}
        <div className="border-t border-white/5 pt-4">
          <div className="flex items-center gap-3 mb-4 p-2 bg-white/5 rounded-xl border border-white/5">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400">
              <UserCheck size={20} />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-200 truncate">{currentUser.name}</p>
              <span className="inline-block px-1.5 py-0.5 mt-0.5 text-[8px] font-black uppercase rounded bg-cyan-500/20 text-cyan-400 tracking-wider truncate max-w-[120px]">
                {currentUser.role}
              </span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-xs font-bold rounded-xl transition-all"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              {activeTab === 'dashboard' && 'Dashboard Anggaran 2026'}
              {activeTab === 'rekap' && 'Rekap Detail PRK & Pagu'}
              {activeTab === 'monitoring' && 'Monitoring Kontrak & Proses'}
              {activeTab === 'users' && 'Manajemen Pengguna'}
              {activeTab === 'rbac' && 'Matriks Hak Akses (RBAC)'}
              {activeTab === 'roles' && 'Pengaturan Peran (Role)'}
              {activeTab === 'audit' && 'Log Audit Transaksi (Immutable Audit Trail)'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {activeTab === 'dashboard' && 'Pemetaan, monitoring, dan perlindungan pagu secara real-time.'}
              {activeTab === 'rekap' && 'Informasi alokasi pagu total, jumlah nilai terkontrak, dan sisa pagu anggaran.'}
              {activeTab === 'monitoring' && 'Daftar kontrak berjalan beserta progress administrasi nota dinas.'}
              {activeTab === 'users' && 'Kelola akun user internal PLN.'}
              {activeTab === 'rbac' && 'Kelola matriks pemetaan peran (role) ke dalam izin aksi dinamis.'}
              {activeTab === 'roles' && 'Kelola dan ubah nama peran user secara dinamis beserta deskripsinya.'}
              {activeTab === 'audit' && 'Jejak audit permanen pencatatan mutasi anggaran, pengguna, dan transaksi.'}
            </p>
          </div>
          
          <div className="flex items-center gap-3 no-print">
            {activeTab === 'dashboard' && (
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-xs font-bold transition-all shadow-md"
                title="Ekspor Laporan Dashboard ke PDF"
              >
                <Printer size={14} />
                Ekspor PDF
              </button>
            )}
            <button 
              onClick={refreshAllData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold tracking-wide transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Sync Data
            </button>
          </div>
        </header>

        {/* EWS Engine Active Alerts Warning Banner */}
        {Array.isArray(alerts) && alerts.length > 0 && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-start gap-4 animate-pulse relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
            <AlertTriangle className="text-red-500 shrink-0 w-6 h-6 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-black text-red-200 uppercase tracking-wide flex items-center gap-2">
                ⚠️ Early Warning System (EWS) - {alerts.length} Deteksi Kritikal
              </h4>
              <div className="mt-2 space-y-1.5 text-xs text-red-300">
                {Array.isArray(alerts) && alerts.map((alert) => (
                  <div key={alert.id} className="flex items-center gap-2 bg-red-500/5 p-2 rounded-lg border border-red-500/10">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                    <span className="font-semibold text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded tracking-widest">{alert.tipe}</span>
                    <span>{alert.pesan}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Action Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 no-print">
            <AlertTriangle className="text-red-400 shrink-0 w-6 h-6" />
            <div>
              <h4 className="text-sm font-bold text-red-200">Gagal Memproses Aksi</h4>
              <p className="text-xs text-red-300/80 mt-1">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3 no-print">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold shrink-0">✓</div>
            <div>
              <h4 className="text-sm font-bold text-emerald-200">Aksi Berhasil</h4>
              <p className="text-xs text-emerald-300/80 mt-1">{success}</p>
            </div>
          </div>
        )}

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <>
            {/* KPI Row - 4 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {/* Card 1: Pagu Terbit */}
              <div className="glassmorphism glow-card p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pagu Terbit</span>
                  <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-400">
                    <Database size={16} />
                  </div>
                </div>
                <h3 className="text-xl font-black text-white">{formatIDR(totalPagu)}</h3>
                <p className="text-[9px] text-blue-400/80 font-bold tracking-wide uppercase mt-2">TOTAL ANGGARAN PLOT</p>
              </div>

              {/* Card 2: Terkontrak (Komitmen) */}
              <div className="glassmorphism glow-card p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl"></div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Terkontrak</span>
                  <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20 text-cyan-400">
                    <TrendingUp size={16} />
                  </div>
                </div>
                <h3 className="text-xl font-black text-white">{formatIDR(totalTerkontrak)}</h3>
                <p className="text-[9px] text-cyan-400/80 font-bold tracking-wide uppercase mt-2">
                  {totalPagu > 0 ? `${((totalTerkontrak / totalPagu) * 100).toFixed(1)}%` : '0%'} DARI KOMITMEN PAGU
                </p>
              </div>

              {/* Card 3: Realisasi Pembayaran */}
              <div className="glassmorphism glow-card p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Realisasi</span>
                  <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
                    <CheckSquare size={16} />
                  </div>
                </div>
                <h3 className="text-xl font-black text-white">{formatIDR(totalRealisasi)}</h3>
                <p className="text-[9px] text-emerald-400/80 font-bold tracking-wide uppercase mt-2">
                  {totalTerkontrak > 0 ? `${((totalRealisasi / totalTerkontrak) * 100).toFixed(1)}%` : '0%'} PENYERAPAN KONTRAK
                </p>
              </div>

              {/* Card 4: Sisa Pagu Anggaran */}
              <div className="glassmorphism glow-card p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl"></div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sisa Pagu</span>
                  <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-400">
                    <DollarSign size={16} />
                  </div>
                </div>
                <h3 className="text-xl font-black text-white">{formatIDR(totalSisa)}</h3>
                <p className="text-[9px] text-amber-400/80 font-bold tracking-wide uppercase mt-2">DANA AMAN BEBAS LOCK</p>
              </div>
            </div>

            {/* Charts Area Grid - Left Large: S-Curve, Right Small: Donut */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* S-Curve (Prognosa vs Realisasi) Chart */}
              <div className="glassmorphism p-6 rounded-2xl lg:col-span-2">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-base font-bold">Kurva S Prognosa Penyerapan Anggaran</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Analisis perbandingan antara akumulasi target prognosa dan realisasi bayar.</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg text-[10px] font-black uppercase tracking-wider no-print">
                    Smooth S-Curve
                  </div>
                </div>
                
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sCurveData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                      <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `${(val / 1e6).toFixed(0)}M`} />
                      <Tooltip formatter={(value) => formatIDR(value)} contentStyle={{ backgroundColor: '#0d1527', borderColor: '#ffffff10', borderRadius: '12px' }} />
                      <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                      <Area type="monotone" dataKey="Target Prognosa" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorTarget)" />
                      <Area type="monotone" dataKey="Realisasi Pembayaran" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReal)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Donut Chart: Distribusi Penyerapan */}
              <div className="glassmorphism p-6 rounded-2xl lg:col-span-1 flex flex-col justify-between min-h-[350px]">
                <div>
                  <h3 className="text-base font-bold mb-2">Donut Chart</h3>
                  <p className="text-xs text-slate-400 mb-6">Porsi realisasi riil terhadap komitmen kontrak kerja.</p>
                  
                  <div className="h-44 flex items-center justify-center">
                    {totalPagu === 0 ? (
                      <div className="text-xs text-slate-500">Tidak ada data visualisasi</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatIDR(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2.5 border-t border-white/5 pt-4">
                  {chartData.map((entry, index) => (
                    <div key={index} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-slate-400">{entry.name}</span>
                      </div>
                      <span className="font-semibold text-slate-200">
                        {totalPagu > 0 ? `${((entry.value / totalPagu) * 100).toFixed(1)}%` : '0%'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Heatmap Penyerapan Per Bidang / Satker */}
            <div className="glassmorphism p-6 rounded-2xl mb-8">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <Activity size={18} className="text-cyan-400" />
                    Heatmap Penyerapan Anggaran Per Bidang / Satker
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Pemeriksaan rasio penyerapan dana riil per unit pengusul (Bidang) secara real-time.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {['PEMELIHARAAN', 'SCADA', 'KKU', 'TRANSAKSI ENERGI', 'K3 & LINGKUNGAN'].map((bidang) => {
                  const bidangContracts = contracts.filter(c => (c.user_bidang || '').toUpperCase() === bidang || (bidang === 'K3 & LINGKUNGAN' && (c.user_bidang || '').toUpperCase().includes('K3')));
                  const totalNilai = bidangContracts.reduce((sum, c) => sum + c.nilai_kontrak, 0);
                  const realisasiNilai = bidangContracts.filter(c => c.status_proses === 'SELESAI').reduce((sum, c) => sum + c.nilai_kontrak, 0);
                  const ratio = totalNilai > 0 ? (realisasiNilai / totalNilai) * 100 : 0;

                  let statusColor = 'border-red-500/30 bg-red-500/5 text-red-400';
                  let badgeText = 'KRITIS / LAMBAT';
                  let barColor = 'bg-red-500';

                  if (ratio >= 80) {
                    statusColor = 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400';
                    badgeText = 'OPTIMAL';
                    barColor = 'bg-emerald-500';
                  } else if (ratio >= 50) {
                    statusColor = 'border-amber-500/30 bg-amber-500/5 text-amber-400';
                    badgeText = 'MODERAT';
                    barColor = 'bg-amber-500';
                  }

                  return (
                    <div key={bidang} className={`p-4 rounded-xl border ${statusColor} relative overflow-hidden transition-all hover:scale-[1.02]`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black tracking-wider uppercase text-slate-300 truncate">{bidang}</span>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${statusColor}`}>{badgeText}</span>
                      </div>
                      <h4 className="text-lg font-black text-white">{ratio.toFixed(1)}%</h4>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden my-2">
                        <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${Math.min(ratio, 100)}%` }}></div>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2">
                        <span>Realisasi:</span>
                        <span className="font-bold text-slate-200">{formatIDR(realisasiNilai)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-0.5">
                        <span>Total Komitmen:</span>
                        <span className="font-semibold text-slate-300">{formatIDR(totalNilai)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Section: Recent Activities / Latest Contracts */}
            <div className="glassmorphism p-6 rounded-2xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-base font-bold">Aktivitas Kontrak Terbaru</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Daftar kontrak yang baru saja diinput atau divalidasi sistem.</p>
                </div>
                {hasContractWriteAccess && (
                  <button 
                    onClick={() => handleOpenContractModal()}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#06b6d4]/10 hover:bg-[#06b6d4]/20 border border-[#06b6d4]/20 text-[#06b6d4] rounded-lg text-xs font-bold transition-all no-print"
                  >
                    <PlusCircle size={14} />
                    Kontrak Baru
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-400 text-[10px] uppercase tracking-wider">
                      <th className="py-2.5 px-4 font-bold">Nomor Kontrak</th>
                      <th className="py-2.5 px-4 font-bold">Pekerjaan</th>
                      <th className="py-2.5 px-4 font-bold">Vendor</th>
                      <th className="py-2.5 px-4 font-bold">Nilai</th>
                      <th className="py-2.5 px-4 text-center font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {contracts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-slate-500">Belum ada kontrak pengadaan terdaftar.</td>
                      </tr>
                    ) : (
                      contracts.slice(0, 4).map((c) => (
                        <tr key={c.id} className="hover:bg-white/5 transition-all">
                          <td className="py-3 px-4 font-mono font-semibold text-slate-200">{c.nomor_kontrak}</td>
                          <td className="py-3 px-4 truncate max-w-[200px]" title={c.judul_pekerjaan}>{c.judul_pekerjaan}</td>
                          <td className="py-3 px-4 font-medium text-slate-400">{c.vendor}</td>
                          <td className="py-3 px-4 font-mono font-bold text-cyan-400">{formatIDR(c.nilai_kontrak)}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-2 py-0.5 text-[8px] font-black rounded ${
                              c.status_proses === 'SELESAI'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : c.status_proses === 'PROSES'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                            }`}>
                              {c.status_proses}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: REKAP PRK */}
        {activeTab === 'rekap' && (
          <div className="glassmorphism p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-base font-bold">Rekap Detail PRK & Pagu</h3>
                <p className="text-xs text-slate-400 mt-0.5">Pemantauan realisasi pagu terhadap jumlah kontrak.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={exportPRKToCSV}
                  className="flex items-center gap-2 px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold transition-all"
                  title="Ekspor Rekap PRK ke file Excel (CSV)"
                >
                  <FileSpreadsheet size={14} />
                  Ekspor Excel
                </button>
                {hasPrkWriteAccess && (
                  <button 
                    onClick={() => handleOpenPrkModal()}
                    className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-500/10"
                  >
                    <PlusCircle size={14} />
                    Tambah PRK Baru
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="py-3 px-4 font-bold">Nomor PRK</th>
                    <th className="py-3 px-4 font-bold">Uraian Pekerjaan</th>
                    <th className="py-3 px-4 font-bold">Jenis</th>
                    <th className="py-3 px-4 font-bold">Pagu Total</th>
                    <th className="py-3 px-4 font-bold">Terkontrak</th>
                    <th className="py-3 px-4 font-bold">Sisa Pagu</th>
                    <th className="py-3 px-4 font-bold text-center">Status</th>
                    {hasPrkWriteAccess && <th className="py-3 px-4 text-center font-bold">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading && prks.length === 0 ? (
                    <tr>
                      <td colSpan={hasPrkWriteAccess ? 8 : 7} className="text-center py-8 text-xs text-slate-500">
                        Memuat data anggaran...
                      </td>
                    </tr>
                  ) : prks.length === 0 ? (
                    <tr>
                      <td colSpan={hasPrkWriteAccess ? 8 : 7} className="text-center py-8 text-xs text-slate-500">
                        Belum ada data anggaran di database.
                      </td>
                    </tr>
                  ) : (
                    prks.map((prk) => {
                      const isCritical = Array.isArray(alerts) && alerts.some(a => a.prk_id === prk.id && a.tipe === 'BUDGET_CRITICAL');
                      return (
                        <tr key={prk.id} className={`transition-all hover:bg-white/5 ${
                          isCritical ? 'bg-red-500/5 border-l-2 border-l-red-500 animate-pulse' : ''
                        }`}>
                          <td className="py-4 px-4 font-bold text-cyan-400 font-mono">{prk.nomor_prk}</td>
                          <td className="py-4 px-4 text-xs max-w-xs truncate text-slate-300" title={prk.uraian_prk}>
                            {prk.uraian_prk}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded ${
                              prk.jenis_anggaran === 'OPERASI' 
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                                : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            }`}>
                              {prk.jenis_anggaran}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-semibold font-mono text-slate-200">{formatIDR(prk.pagu_total)}</td>
                          <td className="py-4 px-4 font-semibold font-mono text-cyan-400">{formatIDR(prk.kontrak_total)}</td>
                          <td className={`py-4 px-4 font-semibold font-mono ${
                            prk.sisa_pagu <= 0 ? 'text-red-400' : 'text-emerald-400'
                          }`}>{formatIDR(prk.sisa_pagu)}</td>
                          <td className="py-4 px-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-black rounded-lg ${
                              prk.sisa_pagu <= 0 || isCritical
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                                : prk.sisa_pagu < (prk.pagu_total * 0.1)
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {prk.sisa_pagu <= 0 || isCritical ? 'KRITIS' : prk.sisa_pagu < (prk.pagu_total * 0.1) ? 'WARNING' : 'AMAN'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {(hasPaguReviseAccess || hasPrkWriteAccess) && (
                                <button
                                  onClick={() => handleOpenRevisionModal(prk)}
                                  className="px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 rounded-lg transition-all text-[10px] font-bold flex items-center gap-1"
                                  title="Revisi Pagu Anggaran (Adendum/APBD-P)"
                                >
                                  <RefreshCw size={12} />
                                  Revisi
                                </button>
                              )}
                              <button
                                onClick={() => handleViewRevisionHistory(prk)}
                                className="px-2 py-1 bg-slate-500/10 hover:bg-slate-500/20 border border-slate-500/20 text-slate-300 rounded-lg transition-all text-[10px] font-bold flex items-center gap-1"
                                title="Lihat Riwayat Revisi Pagu"
                              >
                                <History size={12} />
                                Histori
                              </button>
                              {hasPrkWriteAccess && (
                                <>
                                  <button
                                    onClick={() => handleOpenPrkModal(prk)}
                                    className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-lg transition-all"
                                    title="Edit PRK & Pagu"
                                  >
                                    <Edit size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePrk(prk.id)}
                                    className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg transition-all"
                                    title="Hapus PRK"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: MONITORING KONTRAK */}
        {activeTab === 'monitoring' && (
          <div className="glassmorphism p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-base font-bold">Daftar Kontrak & Status Kerja</h3>
                <p className="text-xs text-slate-400 mt-0.5">Pemantauan progres dan detail nilai kontrak yang mengikat pagu.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={exportContractsToCSV}
                  className="flex items-center gap-2 px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold transition-all"
                  title="Ekspor Data Monitoring Kontrak ke Excel (CSV)"
                >
                  <FileSpreadsheet size={14} />
                  Ekspor Excel
                </button>
                {hasContractWriteAccess && (
                  <button 
                    onClick={() => handleOpenContractModal()}
                    className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-500/10"
                  >
                    <PlusCircle size={14} />
                    Tambah Kontrak Baru
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="py-3 px-4 font-bold">Nomor Kontrak</th>
                    <th className="py-3 px-4 font-bold">Judul Pekerjaan</th>
                    <th className="py-3 px-4">Vendor</th>
                    <th className="py-3 px-4">Nilai</th>
                    <th className="py-3 px-4">PRK Terkait</th>
                    <th className="py-3 px-4">Detail ND</th>
                    <th className="py-3 px-4 text-center font-bold">Status Realisasi</th>
                    <th className="py-3 px-4 text-center font-bold">Workflow Approval</th>
                    <th className="py-3 px-4 text-center font-bold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                  {contracts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-xs text-slate-500">
                        Belum ada kontrak terdaftar di database.
                      </td>
                    </tr>
                  ) : (
                    contracts.map((row) => {
                      const associatedPRK = prks.find(p => p.id === row.prk_id);
                      const isCritical = Array.isArray(alerts) && alerts.some(a => a.contract_id === row.id && a.tipe === 'BACKLOG');
                      return (
                        <tr key={row.id} className={`transition-all hover:bg-white/5 ${
                          isCritical ? 'bg-red-500/5 border-l-2 border-l-red-500 animate-pulse' : ''
                        }`}>
                          <td className="py-4 px-4 font-mono font-bold text-slate-100">{row.nomor_kontrak}</td>
                          <td className="py-4 px-4 max-w-xs truncate text-slate-200" title={row.judul_pekerjaan}>
                            {row.judul_pekerjaan}
                          </td>
                          <td className="py-4 px-4 font-medium text-slate-300">{row.vendor}</td>
                          <td className="py-4 px-4 font-mono font-bold text-cyan-400">{formatIDR(row.nilai_kontrak)}</td>
                          <td className="py-4 px-4 font-semibold text-slate-400">
                            {associatedPRK ? (
                              <div>
                                <div className="text-[11px] text-slate-200">{associatedPRK.nomor_prk}</div>
                                <span className="text-[9px] text-cyan-500/80">{associatedPRK.jenis_anggaran}</span>
                              </div>
                            ) : (
                              <span className="text-red-400">PRK tidak dikenal</span>
                            )}
                          </td>
                          <td className="py-4 px-4 font-semibold text-slate-400">
                            {row.no_nd ? (
                              <div className="space-y-0.5">
                                <div className="text-[10px] text-slate-200 font-mono" title={row.no_nd}>ND: {row.no_nd.substring(0, 15)}...</div>
                                <div className="text-[9px] text-slate-400 flex items-center gap-1.5">
                                  <span>Tgl: {row.tgl_nd}</span>
                                  <span className="px-1 bg-white/5 rounded text-[8px] text-cyan-400 font-bold uppercase">{row.user_bidang}</span>
                                </div>
                                <div className="text-[8px] text-slate-500">{row.hari_kerja} Hari Target</div>
                              </div>
                            ) : (
                              <span className="text-slate-600 font-normal italic">Belum diisi</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`inline-block px-2.5 py-1 text-[9px] font-black rounded-lg ${
                              row.status_proses === 'SELESAI'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : isCritical || row.status_proses === 'PROSES'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                            }`}>
                              {row.status_proses} {isCritical && ' (BACKLOG)'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="space-y-1">
                              <span className={`inline-block px-2 py-0.5 text-[8px] font-black rounded uppercase ${
                                row.approval_status === 'APPROVED_MANAGER'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : row.approval_status === 'VERIFIED_FINANCE'
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  : row.approval_status === 'PENDING_APPROVAL'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : row.approval_status === 'REJECTED'
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                  : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                              }`}>
                                {row.approval_status === 'APPROVED_MANAGER' ? '✓ SETUJU MANAJER'
                                 : row.approval_status === 'VERIFIED_FINANCE' ? 'VERIFIKASI KEU'
                                 : row.approval_status === 'PENDING_APPROVAL' ? 'DIAJUKAN BIDANG'
                                 : row.approval_status === 'REJECTED' ? '✕ DITOLAK'
                                 : 'DRAFT'}
                              </span>
                              {row.approval_notes && (
                                <div className="text-[8px] text-amber-300/80 italic max-w-[120px] truncate" title={row.approval_notes}>
                                  Catatan: {row.approval_notes}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex flex-wrap items-center justify-center gap-1.5">
                              {(row.approval_status === 'DRAFT' || row.approval_status === 'REJECTED' || !row.approval_status) && (hasContractWriteAccess || currentUser?.role === 'PERENCANAAN' || currentUser?.role === 'ADMIN') && (
                                <button
                                  onClick={() => handleOpenApprovalModal(row, 'SUBMIT')}
                                  className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                                  title="Ajukan Persetujuan Workflow"
                                >
                                  <Send size={11} /> Ajukan
                                </button>
                              )}

                              {row.approval_status === 'PENDING_APPROVAL' && (hasFinanceApproveAccess || currentUser?.role === 'KEUANGAN' || currentUser?.role === 'ADMIN') && (
                                <>
                                  <button
                                    onClick={() => handleOpenApprovalModal(row, 'VERIFY')}
                                    className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                                    title="Verifikasi Dokumen Keuangan"
                                  >
                                    <CheckCircle2 size={11} /> Verifikasi
                                  </button>
                                  <button
                                    onClick={() => handleOpenApprovalModal(row, 'REJECT')}
                                    className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                                    title="Tolak Pengajuan Kontrak"
                                  >
                                    <XCircle size={11} /> Tolak
                                  </button>
                                </>
                              )}

                              {row.approval_status === 'VERIFIED_FINANCE' && (hasManagerApproveAccess || currentUser?.role === 'MANAJER' || currentUser?.role === 'ADMIN') && (
                                <>
                                  <button
                                    onClick={() => handleOpenApprovalModal(row, 'APPROVE')}
                                    className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                                    title="Persetujuan Final Manajer"
                                  >
                                    <CheckCircle2 size={11} /> Setujui
                                  </button>
                                  <button
                                    onClick={() => handleOpenApprovalModal(row, 'REJECT')}
                                    className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                                    title="Tolak Pengajuan Kontrak"
                                  >
                                    <XCircle size={11} /> Tolak
                                  </button>
                                </>
                              )}

                              {hasContractWriteAccess && (
                                <>
                                  <button
                                    onClick={() => handleOpenContractModal(row)}
                                    className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-lg transition-all"
                                    title="Edit Kontrak"
                                  >
                                    <Edit size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteContract(row.id)}
                                    className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg transition-all"
                                    title="Hapus Kontrak"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: USER MANAGEMENT */}
        {activeTab === 'users' && hasUserManageAccess && (
          <div className="glassmorphism p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-base font-bold">Daftar Pengguna Aplikasi</h3>
                <p className="text-xs text-slate-400 mt-0.5">Kelola otorisasi akun pegawai internal PLN.</p>
              </div>
              <button 
                onClick={() => handleOpenUserModal()}
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-500/10"
              >
                <UserPlus size={14} />
                Daftarkan User Baru
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="py-3 px-4 font-bold">Nama Lengkap</th>
                    <th className="py-3 px-4 font-bold">Username</th>
                    <th className="py-3 px-4 font-bold">Role Otorisasi</th>
                    <th className="py-3 px-4 font-bold">Terdaftar</th>
                    <th className="py-3 px-4 text-center font-bold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/5 transition-all">
                      <td className="py-4 px-4 font-bold text-slate-100">{u.name}</td>
                      <td className="py-4 px-4 font-mono text-cyan-400">{u.username}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-block px-2 py-0.5 text-[9px] font-black rounded ${
                          u.role === 'ADMIN'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : u.role === 'PERENCANAAN'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : u.role === 'KEUANGAN'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-500/10 text-slate-300 border border-white/10'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-400">{new Date(u.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenUserModal(u)}
                            className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-lg transition-all"
                            title="Edit User"
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={currentUser.username === u.username}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            title={currentUser.username === u.username ? "Anda tidak bisa menghapus diri sendiri" : "Hapus User"}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: RBAC MATRIX MANAGEMENT */}
        {activeTab === 'rbac' && hasRbacManageAccess && (
          <div className="glassmorphism p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-base font-bold">Matriks Hak Akses (RBAC)</h3>
                <p className="text-xs text-slate-400 mt-0.5">Kelola izin aksi/fitur untuk setiap jabatan secara dinamis.</p>
              </div>
              <button 
                onClick={handleSaveRBACMatrix}
                disabled={formLoading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-500/10"
              >
                {formLoading ? 'Menyimpan...' : 'Simpan Matriks'}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-bold">Kategori & Hak Akses</th>
                    <th className="py-3.5 px-4 font-bold">Kode Izin</th>
                    {roles.map(r => (
                      <th key={r.name} className="py-3.5 px-4 text-center font-bold">{r.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                  {permissions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-500">Memuat data permission...</td>
                    </tr>
                  ) : (
                    permissions.map(perm => (
                      <tr key={perm.code} className="hover:bg-white/5 transition-all">
                        <td className="py-4 px-4 font-medium">
                          <span className="block text-slate-200">{perm.nama}</span>
                          <span className="inline-block mt-1 px-1.5 py-0.5 text-[8px] font-bold uppercase rounded bg-slate-800 text-slate-400">
                            {perm.kategori}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-mono text-cyan-400/80">{perm.code}</td>
                        {roles.map(r => {
                          const isAssigned = r.name === 'ADMIN' || rbacMatrix.some(m => m.role_name === r.name && m.permission_code === perm.code);
                          const isDisabled = r.name === 'ADMIN'; 
                          return (
                            <td key={r.name} className="py-4 px-4 text-center">
                              <input 
                                type="checkbox"
                                checked={isAssigned}
                                disabled={isDisabled}
                                onChange={() => handleTogglePermission(r.name, perm.code)}
                                className="w-4 h-4 rounded bg-[#0d1527] border-white/10 text-cyan-500 focus:ring-cyan-500/20 focus:ring-opacity-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: DYNAMIC ROLES SETTINGS */}
        {activeTab === 'roles' && hasRbacManageAccess && (
          <div className="glassmorphism p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-base font-bold">Daftar Peran (Role) Pengguna</h3>
                <p className="text-xs text-slate-400 mt-0.5">Kelola nama peran dan jabatan pengguna di aplikasi Si Monang secara dinamis.</p>
              </div>
              <button 
                onClick={() => handleOpenRoleModal()}
                className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-500/10"
              >
                <PlusCircle size={14} />
                Tambah Peran Baru
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="py-3 px-4 font-bold">Nama Peran</th>
                    <th className="py-3 px-4 font-bold">Deskripsi Tugas</th>
                    <th className="py-3 px-4 font-bold">Terdaftar</th>
                    <th className="py-3 px-4 text-center font-bold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                  {roles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-slate-500">Memuat data peran...</td>
                    </tr>
                  ) : (
                    roles.map((role) => (
                      <tr key={role.name} className="hover:bg-white/5 transition-all">
                        <td className="py-4 px-4">
                          <span className="font-bold text-slate-100">{role.name}</span>
                        </td>
                        <td className="py-4 px-4 text-slate-300">
                          {role.deskripsi || <span className="text-slate-600 italic">Tidak ada deskripsi</span>}
                        </td>
                        <td className="py-4 px-4 text-slate-400 font-mono">
                          {role.created_at ? new Date(role.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenRoleModal(role)}
                              className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-lg transition-all"
                              title="Edit Nama/Deskripsi Peran"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteRole(role.name)}
                              disabled={role.name === 'ADMIN'}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                              title={role.name === 'ADMIN' ? 'Role ADMIN tidak dapat dihapus' : 'Hapus Peran'}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: LOG AUDIT TRANSAKSI */}
        {activeTab === 'audit' && (hasAuditReadAccess || currentUser?.role === 'ADMIN') && (
          <div className="glassmorphism p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <History size={18} className="text-cyan-400" />
                  Jejak Audit Mutasi Anggaran & Transaksi (Immutable Audit Trail)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Catatan permanen perubahan data PRK, Pagu, Kontrak, dan Otentikasi untuk akuntabilitas & kepatuhan audit.</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Cari user, aksi, atau entitas..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="px-3 py-1.5 bg-[#0d1527] border border-white/10 rounded-xl text-xs text-white outline-none focus:border-cyan-500/50 w-64"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400 text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-4 font-bold">Waktu</th>
                    <th className="py-3 px-4 font-bold">Pengguna</th>
                    <th className="py-3 px-4 font-bold">Peran</th>
                    <th className="py-3 px-4 font-bold">Aksi (Action)</th>
                    <th className="py-3 px-4 font-bold">Entitas Target</th>
                    <th className="py-3 px-4 font-bold">Nilai Lama (Before)</th>
                    <th className="py-3 px-4 font-bold">Nilai Baru (After)</th>
                    <th className="py-3 px-4 font-bold text-center">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-500">Belum ada catatan log audit di database.</td>
                    </tr>
                  ) : (
                    auditLogs
                      .filter(log => 
                        (log.username || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
                        (log.action || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
                        (log.entity || '').toLowerCase().includes(auditSearch.toLowerCase()) ||
                        (log.new_value || '').toLowerCase().includes(auditSearch.toLowerCase())
                      )
                      .map((log) => (
                        <tr key={log.id} className="hover:bg-white/5 transition-all">
                          <td className="py-3 px-4 text-slate-400 font-mono text-[10px]">
                            {log.created_at ? new Date(log.created_at).toLocaleString('id-ID') : '-'}
                          </td>
                          <td className="py-3 px-4 font-bold text-cyan-400">{log.username}</td>
                          <td className="py-3 px-4">
                            <span className="px-1.5 py-0.5 text-[8px] font-black rounded bg-cyan-500/10 text-cyan-400 uppercase">
                              {log.user_role}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${
                              log.action.includes('CREATE') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              log.action.includes('REVISE') || log.action.includes('UPDATE') ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                              log.action.includes('DELETE') || log.action.includes('REJECT') ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-200">
                            {log.entity} #{log.entity_id}
                          </td>
                          <td className="py-3 px-4 font-mono text-[10px] text-slate-400 truncate max-w-[150px]" title={log.old_value}>
                            {log.old_value || '-'}
                          </td>
                          <td className="py-3 px-4 font-mono text-[10px] text-emerald-300 truncate max-w-[200px]" title={log.new_value}>
                            {log.new_value || '-'}
                          </td>
                          <td className="py-3 px-4 font-mono text-[10px] text-slate-500 text-center">
                            {log.ip_address || '127.0.0.1'}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ==========================================
          MODAL DIALOGS (GLASSMORPHIC BACKDROP)
         ========================================== */}
      
      {/* 5. REVISI PAGU MODAL */}
      {revisionModalOpen && revisionTargetPrk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn no-print">
          <div className="w-full max-w-md glassmorphism p-8 rounded-2xl relative border border-white/10">
            <button 
              onClick={() => setRevisionModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg transition-all"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 flex items-center gap-2">
              <RefreshCw className="text-cyan-400" size={20} />
              Revisi Pagu Anggaran (Adendum / APBD-P)
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              PRK: <strong className="text-cyan-400 font-mono">{revisionTargetPrk.nomor_prk}</strong> ({revisionTargetPrk.uraian_prk})
            </p>

            <form onSubmit={handleSaveRevision} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nilai Pagu Saat Ini
                </label>
                <div className="px-3 py-2 bg-slate-800/50 border border-white/5 rounded-xl text-slate-400 text-sm font-mono font-bold">
                  {formatIDR(revisionTargetPrk.pagu_total || 0)}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nilai Pagu Baru (Rp) *
                </label>
                <input
                  type="number"
                  step="any"
                  value={revisionForm.nilai_pagu_baru}
                  onChange={(e) => setRevisionForm({...revisionForm, nilai_pagu_baru: e.target.value})}
                  className="w-full px-3 py-2 bg-[#0d1527] border border-white/10 rounded-xl text-white text-sm outline-none focus:border-cyan-500/50 font-mono font-bold"
                  placeholder="Masukkan nilai pagu hasil revisi/adendum..."
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nomor SK / Adendum *
                </label>
                <input
                  type="text"
                  value={revisionForm.nomor_revisi}
                  onChange={(e) => setRevisionForm({...revisionForm, nomor_revisi: e.target.value})}
                  className="w-full px-3 py-2 bg-[#0d1527] border border-white/10 rounded-xl text-white text-sm outline-none focus:border-cyan-500/50 font-mono"
                  placeholder="Contoh: SK-012/ADENDUM-PLN/2026"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Alasan Pergeseran / Revisi *
                </label>
                <textarea
                  value={revisionForm.alasan_revisi}
                  onChange={(e) => setRevisionForm({...revisionForm, alasan_revisi: e.target.value})}
                  className="w-full px-3 py-2 bg-[#0d1527] border border-white/10 rounded-xl text-white text-sm outline-none focus:border-cyan-500/50 h-20 resize-none"
                  placeholder="Jelaskan dasar pertimbangan pergeseran pagu anggaran ini..."
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setRevisionModalOpen(false)}
                  className="w-1/2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-1/2 py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
                >
                  {formLoading ? 'Simpan...' : 'Simpan Revisi Pagu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. RIWAYAT REVISI PAGU MODAL */}
      {revisionHistoryModalOpen && revisionTargetPrk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn no-print">
          <div className="w-full max-w-2xl glassmorphism p-8 rounded-2xl relative border border-white/10">
            <button 
              onClick={() => setRevisionHistoryModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg transition-all"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold mb-1 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 flex items-center gap-2">
              <History className="text-cyan-400" size={20} />
              Riwayat Revisi Pagu & Snapshot Adendum
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              PRK: <strong className="text-cyan-400 font-mono">{revisionTargetPrk.nomor_prk}</strong> ({revisionTargetPrk.uraian_prk})
            </p>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-slate-400 text-[10px] uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-bold">Waktu & SK</th>
                    <th className="py-2.5 px-4 font-bold">Pagu Sebelum</th>
                    <th className="py-2.5 px-4 font-bold">Pagu Setelah</th>
                    <th className="py-2.5 px-4 font-bold">Alasan Revisi</th>
                    <th className="py-2.5 px-4 font-bold">Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {revisionHistory.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-500">Belum ada catatan revisi pagu untuk PRK ini.</td>
                    </tr>
                  ) : (
                    revisionHistory.map((rev) => (
                      <tr key={rev.id} className="hover:bg-white/5">
                        <td className="py-3 px-4">
                          <div className="font-bold text-cyan-400 font-mono">{rev.nomor_revisi}</div>
                          <div className="text-[9px] text-slate-400">
                            {rev.created_at ? new Date(rev.created_at).toLocaleString('id-ID') : '-'}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400 line-through">
                          {formatIDR(rev.nilai_pagu_lama)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                          {formatIDR(rev.nilai_pagu_baru)}
                        </td>
                        <td className="py-3 px-4 text-slate-300 max-w-xs">{rev.alasan_revisi}</td>
                        <td className="py-3 px-4 font-semibold text-slate-400">{rev.created_by}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. APPROVAL WORKFLOW MODAL */}
      {approvalModalOpen && approvalTargetContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn no-print">
          <div className="w-full max-w-md glassmorphism p-8 rounded-2xl relative border border-white/10">
            <button 
              onClick={() => setApprovalModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg transition-all"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 flex items-center gap-2">
              <CheckCircle2 className="text-cyan-400" size={20} />
              Persetujuan Workflow Kontrak
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Kontrak: <strong className="text-cyan-400 font-mono">#{approvalTargetContract.nomor_kontrak}</strong> ({approvalTargetContract.judul_pekerjaan})
            </p>

            <form onSubmit={handleProcessApproval} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Aksi Persetujuan
                </label>
                <div className={`p-3 rounded-xl border text-xs font-bold uppercase tracking-wider ${
                  approvalAction === 'APPROVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  approvalAction === 'VERIFY' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                  approvalAction === 'SUBMIT' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                  {approvalAction === 'APPROVE' && '✓ PERSETUJUAN FINAL MANAJER'}
                  {approvalAction === 'VERIFY' && '✓ VERIFIKASI DOKUMEN KEUANGAN'}
                  {approvalAction === 'SUBMIT' && '🚀 PENGAJUAN PERSETUJUAN KONTRAK'}
                  {approvalAction === 'REJECT' && '✕ PENOLAKAN PENGAJUAN KONTRAK'}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Catatan / Tanggapan {approvalAction === 'REJECT' && '*'}
                </label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0d1527] border border-white/10 rounded-xl text-white text-sm outline-none focus:border-cyan-500/50 h-24 resize-none"
                  placeholder={approvalAction === 'REJECT' ? 'Tuliskan alasan penolakan dan instruksi perbaikan...' : 'Tambahkan catatan opsional...'}
                  required={approvalAction === 'REJECT'}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setApprovalModalOpen(false)}
                  className="w-1/2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className={`w-1/2 py-2.5 px-4 text-white text-xs font-bold rounded-xl transition-all shadow-md disabled:opacity-50 ${
                    approvalAction === 'REJECT' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 shadow-cyan-500/20'
                  }`}
                >
                  {formLoading ? 'Memproses...' : 'Konfirmasi Aksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL DIALOGS (GLASSMORPHIC BACKDROP)
         ========================================== */}
      
      {/* 1. PRK MODAL */}
      {prkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn no-print">
          <div className="w-full max-w-lg glassmorphism p-8 rounded-2xl relative border border-white/10">
            <button 
              onClick={() => setPrkModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg transition-all"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
              {prkEditing ? 'Edit Pemetaan Anggaran (PRK)' : 'Tambah PRK & Alokasi Pagu'}
            </h3>
            
            <form onSubmit={handleSavePrk} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nomor PRK
                </label>
                <input
                  type="text"
                  value={prkForm.nomor_prk}
                  onChange={(e) => setPrkForm({...prkForm, nomor_prk: e.target.value})}
                  className="w-full px-3 py-2 bg-[#0d1527] border border-white/5 rounded-xl text-white text-sm outline-none focus:border-cyan-500/50"
                  placeholder="Contoh: 2026.DRKR.4.002"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Uraian Program Kerja
                </label>
                <textarea
                  value={prkForm.uraian_prk}
                  onChange={(e) => setPrkForm({...prkForm, uraian_prk: e.target.value})}
                  className="w-full px-3 py-2 bg-[#0d1527] border border-white/5 rounded-xl text-white text-sm outline-none focus:border-cyan-500/50 h-20 resize-none"
                  placeholder="Deskripsikan tujuan alokasi pekerjaan..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Jenis Anggaran
                  </label>
                  <select
                    value={prkForm.jenis_anggaran}
                    onChange={(e) => setPrkForm({...prkForm, jenis_anggaran: e.target.value})}
                    className="w-full px-3 py-2 bg-[#0d1527] border border-white/5 rounded-xl text-white text-sm outline-none focus:border-cyan-500/50"
                    required
                  >
                    <option value="OPERASI">OPERASI</option>
                    <option value="INVESTASI">INVESTASI</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Tahun Anggaran
                  </label>
                  <input
                    type="number"
                    value={prkForm.tahun}
                    onChange={(e) => setPrkForm({...prkForm, tahun: e.target.value})}
                    className="w-full px-3 py-2 bg-[#0d1527] border border-white/5 rounded-xl text-white text-sm outline-none focus:border-cyan-500/50 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Alokasi Nilai Pagu (Rupiah)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm font-bold">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={prkForm.nilai_pagu || ''}
                    onChange={(e) => setPrkForm({...prkForm, nilai_pagu: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 bg-[#0d1527] border border-white/5 rounded-xl text-white text-sm outline-none focus:border-cyan-500/50 font-mono font-bold"
                    placeholder="Masukkan jumlah pagu"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setPrkModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  {formLoading ? 'Menyimpan...' : 'Simpan PRK'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. CONTRACT MODAL */}
      {contractModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn no-print">
          <div className="w-full max-w-lg glassmorphism p-8 rounded-2xl relative border border-white/10 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setContractModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg transition-all"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold mb-5 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
              {contractEditing ? 'Edit Informasi Kontrak' : 'Tambah Kontrak Baru'}
            </h3>
            
            <form onSubmit={handleSaveContract} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Program Rencana Kerja (PRK)
                  </label>
                  <select
                    value={contractForm.prk_id}
                    onChange={(e) => setContractForm({...contractForm, prk_id: e.target.value})}
                    className="w-full px-3 py-2 bg-[#0d1527] border border-white/5 rounded-xl text-white text-sm outline-none focus:border-cyan-500/50"
                    required
                  >
                    <option value="">-- Pilih PRK --</option>
                    {prks.map((prk) => (
                      <option key={prk.id} value={prk.id}>
                        {prk.nomor_prk} ({prk.jenis_anggaran}) - Sisa Pagu: {formatIDR(prk.sisa_pagu)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Nomor Kontrak
                  </label>
                  <input
                    type="text"
                    value={contractForm.nomor_kontrak}
                    onChange={(e) => setContractForm({...contractForm, nomor_kontrak: e.target.value})}
                    className="w-full px-3 py-2 bg-[#0d1527] border border-white/5 rounded-xl text-white text-sm outline-none focus:border-cyan-500/50"
                    placeholder="Nomor kontrak kerja sama"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Nama Vendor
                  </label>
                  <input
                    type="text"
                    value={contractForm.vendor}
                    onChange={(e) => setContractForm({...contractForm, vendor: e.target.value})}
                    className="w-full px-3 py-2 bg-[#0d1527] border border-white/5 rounded-xl text-white text-sm outline-none focus:border-cyan-500/50"
                    placeholder="Nama pelaksana"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Judul Pekerjaan
                  </label>
                  <input
                    type="text"
                    value={contractForm.judul_pekerjaan}
                    onChange={(e) => setContractForm({...contractForm, judul_pekerjaan: e.target.value})}
                    className="w-full px-3 py-2 bg-[#0d1527] border border-white/5 rounded-xl text-white text-sm outline-none focus:border-cyan-500/50"
                    placeholder="Judul / Deskripsi Pekerjaan"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Nilai Kontrak (Rupiah)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-bold text-xs">
                      Rp
                    </span>
                    <input
                      type="number"
                      value={contractForm.nilai_kontrak || ''}
                      onChange={(e) => setContractForm({...contractForm, nilai_kontrak: e.target.value})}
                      className="w-full pl-8 pr-3 py-2 bg-[#0d1527] border border-white/5 rounded-xl text-white text-sm outline-none focus:border-cyan-500/50 font-mono font-bold"
                      placeholder="Contoh: 15000000"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Status Pekerjaan
                  </label>
                  <select
                    value={contractForm.status_proses}
                    onChange={(e) => setContractForm({...contractForm, status_proses: e.target.value})}
                    className="w-full px-3 py-2 bg-[#0d1527] border border-white/5 rounded-xl text-white text-sm outline-none focus:border-cyan-500/50"
                    required
                  >
                    <option value="DRAFT">DRAFT (Pencadangan)</option>
                    <option value="PROSES">PROSES (Berjalan)</option>
                    <option value="SELESAI">SELESAI (Realisasi)</option>
                  </select>
                </div>

                {/* ADVANCED MONITORING DETAILS FIELDS */}
                <div className="md:col-span-2 border-t border-white/5 pt-4 mt-2">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3">Detail Nota Dinas & Progres (EWS)</h4>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Nomor Nota Dinas / AMS
                  </label>
                  <input
                    type="text"
                    value={contractForm.no_nd}
                    onChange={(e) => setContractForm({...contractForm, no_nd: e.target.value})}
                    className="w-full px-3 py-2 bg-[#0d1527] border border-white/5 rounded-xl text-white text-sm outline-none focus:border-cyan-500/50"
                    placeholder="Contoh: 0152/DAN.01..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Tanggal Nota Dinas / AMS
                  </label>
                  <input
                    type="date"
                    value={contractForm.tgl_nd}
                    onChange={(e) => setContractForm({...contractForm, tgl_nd: e.target.value})}
                    className="w-full px-3 py-2 bg-[#0d1527] border border-white/5 rounded-xl text-white text-sm outline-none focus:border-cyan-500/50 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Bidang Pengusul (User)
                  </label>
                  <select
                    value={contractForm.user_bidang}
                    onChange={(e) => setContractForm({...contractForm, user_bidang: e.target.value})}
                    className="w-full px-3 py-2 bg-[#0d1527] border border-white/5 rounded-xl text-white text-sm outline-none focus:border-cyan-500/50"
                  >
                    <option value="PEMELIHARAAN">PEMELIHARAAN</option>
                    <option value="SCADA">SCADA</option>
                    <option value="KKU">KKU</option>
                    <option value="TRANSAKSI ENERGI">TRANSAKSI ENERGI</option>
                    <option value="K3">K3 & LINGKUNGAN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Target Hari Kerja Durasi
                  </label>
                  <input
                    type="number"
                    value={contractForm.hari_kerja}
                    onChange={(e) => setContractForm({...contractForm, hari_kerja: e.target.value})}
                    className="w-full px-3 py-2 bg-[#0d1527] border border-white/5 rounded-xl text-white text-sm outline-none focus:border-cyan-500/50 font-mono"
                    placeholder="Contoh: 30"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setContractModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  {formLoading ? 'Menyimpan...' : 'Simpan Kontrak'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. USER MODAL */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn no-print">
          <div className="w-full max-w-md glassmorphism p-8 rounded-2xl relative border border-white/10">
            <button 
              onClick={() => setUserModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg transition-all"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
              {userEditing ? 'Edit Pengaturan User' : 'Daftarkan User Baru'}
            </h3>
            
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                  className="w-full px-3 py-2 bg-[#0d1527] border border-white/5 rounded-xl text-white text-sm outline-none focus:border-cyan-500/50"
                  placeholder="Contoh: Andi Wijaya"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                  className="w-full px-3 py-2 bg-[#0d1527] border border-white/5 rounded-xl text-white text-sm outline-none focus:border-cyan-500/50 font-mono"
                  placeholder="Username login"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Password {userEditing && <span className="text-[9px] text-slate-500 lowercase">(kosongkan jika tidak diubah)</span>}
                </label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                  className="w-full px-3 py-2 bg-[#0d1527] border border-white/5 rounded-xl text-white text-sm outline-none focus:border-cyan-500/50 font-mono"
                  placeholder={userEditing ? "••••••" : "Minimal 6 karakter"}
                  required={!userEditing}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Role Otorisasi
                </label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                  className="w-full px-3 py-2 bg-[#0d1527] border border-white/5 rounded-xl text-white text-sm outline-none focus:border-cyan-500/50 font-bold"
                  required
                >
                  {roles.map((r) => (
                    <option key={r.name} value={r.name}>
                      {r.name} {r.deskripsi ? `(${r.deskripsi})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  {formLoading ? 'Menyimpan...' : 'Simpan User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. ROLE MODAL */}
      {roleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn no-print">
          <div className="w-full max-w-md glassmorphism p-8 rounded-2xl relative border border-white/10">
            <button 
              onClick={() => setRoleModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg transition-all"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
              {roleEditing ? 'Ubah Informasi Peran (Role)' : 'Tambah Peran Baru'}
            </h3>
            
            <form onSubmit={handleSaveRole} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nama Peran (Role Name)
                </label>
                <input
                  type="text"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({...roleForm, name: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 bg-[#0d1527] border border-white/5 rounded-xl text-white text-sm outline-none focus:border-cyan-500/50 font-bold tracking-wider"
                  placeholder="Contoh: DIVISI PERENCANAAN"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Deskripsi Peran / Tugas
                </label>
                <textarea
                  value={roleForm.deskripsi}
                  onChange={(e) => setRoleForm({...roleForm, deskripsi: e.target.value})}
                  className="w-full px-3 py-2 bg-[#0d1527] border border-white/5 rounded-xl text-white text-sm outline-none focus:border-cyan-500/50 h-20 resize-none"
                  placeholder="Deskripsikan fungsi dan tugas peran ini..."
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setRoleModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  {formLoading ? 'Menyimpan...' : 'Simpan Peran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
