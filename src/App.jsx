import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient'; 
import { 
  LayoutDashboard, Users, Building2, GraduationCap, Menu, Activity,
  PlusCircle, Search, Edit, Trash2, X, Lock, ShieldCheck,
  User as UserIcon, LogOut, Plane, ChevronDown, ChevronUp, BadgeCheck,
  Download, FileText 
} from 'lucide-react';

import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

// ==========================================
// 🚨 ADD ALL APPROVED ADMIN EMAILS HERE 🚨
// ==========================================
const APPROVED_ADMINS = [
  "fannygod226@gmail.com",
];

// --- LOGIN SCREEN COMPONENT ---
const LoginScreen = ({ onLogin, onGoogleLogin, authError, setAuthError }) => {
  const [loginMode, setLoginMode] = useState('user');

  useEffect(() => {
    if (authError) setLoginMode('admin');
  }, [authError]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loginMode === 'user') onLogin('user', 'Form User');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-4">
      <div className="bg-white p-8 sm:p-10 rounded-[2rem] shadow-xl border border-slate-100 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-sky-600 tracking-tight mb-2">PESO Registry</h1>
          <p className="text-slate-500 font-medium">Access Portal</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
          <button onClick={() => { setLoginMode('user'); setAuthError(null); }} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${loginMode === 'user' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500'}`}>User Entry</button>
          <button onClick={() => { setLoginMode('admin'); setAuthError(null); }} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${loginMode === 'admin' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500'}`}>Administrator</button>
        </div>

        {loginMode === 'user' ? (
          <form onSubmit={handleSubmit}>
            <button type="submit" className="w-full py-4 bg-sky-500 text-white rounded-xl font-bold hover:bg-sky-600 transition-all shadow-lg shadow-sky-200">Enter Form System</button>
          </form>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            {authError ? (
              <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl animate-in zoom-in-95">
                <p className="text-sm font-bold text-rose-600 text-center mb-4 leading-relaxed">{authError}</p>
                <button onClick={() => { setAuthError(null); onGoogleLogin(); }} className="w-full py-3.5 bg-white border border-rose-200 text-rose-600 rounded-xl font-bold hover:bg-rose-100 transition-all text-sm flex items-center justify-center gap-2">
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="google" className="w-4 h-4 opacity-70" /> Try a different account
                </button>
              </div>
            ) : (
              <>
                <button onClick={onGoogleLogin} type="button" className="w-full py-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-3 cursor-pointer">
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="google" className="w-5 h-5" /> Sign in with Google
                </button>
                <p className="text-[10px] text-slate-400 text-center uppercase font-bold tracking-widest">Authorized Personnel Only</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
export default function App() {

  const [userRole, setUserRole] = useState(null); 
  const [userName, setUserName] = useState('');
  const [authError, setAuthError] = useState(null); 

  const [activeTab, setActiveTab] = useState('Dashboard'); 
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState('Profiles'); 

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('Newest');

  const [profiles, setProfiles] = useState([]);
  const [lguData, setLguData] = useState([]);
  const [gfpsData, setGfpsData] = useState([]);
  const [ofwData, setOfwData] = useState([]);
  const [trainings, setTrainings] = useState([]);
  
  const [adminList, setAdminList] = useState([]); 
  const [sectorOptions, setSectorOptions] = useState([]); 
  const [statusOptions, setStatusOptions] = useState([]);
  
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); 
  const [editingData, setEditingData] = useState({});
  const [selectedSector, setSelectedSector] = useState("");

  const handleGoogleLogin = async () => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin, queryParams: { prompt: 'select_account' } }
    });
    if (error) alert("Error logging in: " + error.message);
  };

  const fetchAdmins = async () => {
    const { data } = await supabase.from('authorized_admins').select('*').order('created_at', { ascending: true });
    if (data) setAdminList(data);
  };

  const fetchSectors = async () => {
    const { data } = await supabase.from('sector_categories').select('*').order('name', { ascending: true });
    if (data) setSectorOptions(data);
  };

  const fetchStatuses = async () => {
    const { data } = await supabase.from('status_categories').select('*').order('created_at', { ascending: true });
    if (data) setStatusOptions(data);
  };

  const fetchData = async () => {
    setLoading(true);
    let table = '';
    if (activeTab === 'Profiles' || activeTab === 'Dashboard') table = 'profiles'; 
    if (activeTab === 'LGU' || activeTab === 'Dashboard') table = 'lgu_employees'; 
    if (activeTab === 'GFPS' || activeTab === 'Dashboard') table = 'gfps_members'; 
    if (activeTab === 'OFW') table = 'ofw_profiles';
    if (activeTab === 'Trainings' || activeTab === 'Dashboard') table = 'capacity_trainings'; 

    if (activeTab === 'Admins') fetchAdmins(); 

    if (activeTab === 'Dashboard') {
      const pRes = await supabase.from('profiles').select('*');
      const lRes = await supabase.from('lgu_employees').select('*');
      const gRes = await supabase.from('gfps_members').select('*');
      const tRes = await supabase.from('capacity_trainings').select('*').order('date_conducted', { ascending: false });
      if (pRes.data) setProfiles(pRes.data);
      if (lRes.data) setLguData(lRes.data);
      if (gRes.data) setGfpsData(gRes.data);
      if (tRes.data) setTrainings(tRes.data);
    } else if (table) {
      const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
      if (!error) {
        if (table === 'profiles') setProfiles(data);
        if (table === 'lgu_employees') setLguData(data);
        if (table === 'gfps_members') setGfpsData(data);
        if (table === 'ofw_profiles') setOfwData(data);
        if (table === 'capacity_trainings') setTrainings(data);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSectors();
    fetchStatuses();

    const verifyAdmin = async (session) => {
      if (!session) return;
      const userEmail = session.user.email;
      const { data } = await supabase.from('authorized_admins').select('email').eq('email', userEmail).single();
      
      if (data) {
        setUserRole('admin');
        setUserName(session.user.user_metadata?.full_name || userEmail);
        setAuthError(null);
      } else {
        await supabase.auth.signOut();
        setAuthError(`The account ${userEmail} is not authorized as an administrator.`);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => verifyAdmin(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') verifyAdmin(session);
      else if (event === 'SIGNED_OUT') setUserRole(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (userRole) fetchData();
    setSearchQuery('');
    setSortOption('Newest');
  }, [activeTab, userRole]);


  const handleAddAdmin = async (e) => {
    e.preventDefault();
    const email = e.target.new_admin_email.value.trim().toLowerCase();
    const { error } = await supabase.from('authorized_admins').insert([{ email }]);
    if (error) {
      if (error.code === '23505') alert("This email is already an admin.");
      else alert("Error adding admin: " + error.message);
    } else {
      e.target.reset();
      fetchAdmins();
    }
  };

  const handleDeleteAdmin = async (id, email) => {
    if (email === "fannygod226@gmail.com") return alert("Action Denied: You cannot delete the primary owner account.");
    if (window.confirm(`Are you sure you want to revoke access for ${email}?`)) {
      const { error } = await supabase.from('authorized_admins').delete().eq('id', id);
      if (!error) fetchAdmins();
    }
  };

  const handleAddSector = async (e) => {
    e.preventDefault();
    const name = e.target.new_sector.value.trim();
    const { error } = await supabase.from('sector_categories').insert([{ name }]);
    if (error) {
      if (error.code === '23505') alert("This sector already exists.");
      else alert("Error adding sector: " + error.message);
    } else {
      e.target.reset();
      fetchSectors();
    }
  };

  const handleDeleteSector = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete the "${name}" sector?`)) {
      const { error } = await supabase.from('sector_categories').delete().eq('id', id);
      if (!error) fetchSectors();
    }
  };

  const handleAddStatus = async (e) => {
    e.preventDefault();
    const name = e.target.new_status.value.trim();
    const { error } = await supabase.from('status_categories').insert([{ name }]);
    if (error) {
      if (error.code === '23505') alert("This status already exists.");
      else alert("Error adding status: " + error.message);
    } else {
      e.target.reset();
      fetchStatuses();
    }
  };

  const handleDeleteStatus = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete the "${name}" status?`)) {
      const { error } = await supabase.from('status_categories').delete().eq('id', id);
      if (!error) fetchStatuses();
    }
  };

  const getProcessedData = (data) => {
    let result = [...data];

    if (searchQuery.trim()) {
      const lowerQ = searchQuery.toLowerCase();
      result = result.filter(item => {
        return Object.values(item).some(val => 
          val && String(val).toLowerCase().includes(lowerQ)
        );
      });
    }

    result.sort((a, b) => {
      if (sortOption === 'A-Z') {
        const nameA = (a.last_name || a.training_title || '').toLowerCase();
        const nameB = (b.last_name || b.training_title || '').toLowerCase();
        return nameA.localeCompare(nameB);
      } else if (sortOption === 'Status (Active First)') {
        const statA = (a.status || 'Active').toLowerCase();
        const statB = (b.status || 'Active').toLowerCase();
        if (statA === 'active' && statB !== 'active') return -1;
        if (statA !== 'active' && statB === 'active') return 1;
        return new Date(b.created_at) - new Date(a.created_at); 
      } else if (sortOption === 'Oldest') {
        return new Date(a.created_at) - new Date(b.created_at);
      } else {
        return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    return result;
  };

  const countProfile = (sector, field, val, sex) => profiles.filter(p => p.sector === sector && (field ? p[field] === val : true) && (sex ? (p.sex === sex || p.sex === (sex === 'Male' ? 'M' : 'F')) : true)).length;
  const countAge = (sector, min, max, sex) => profiles.filter(p => { const age = parseInt(p.age) || 0; return p.sector === sector && age >= min && age <= max && (sex ? (p.sex === sex || p.sex === (sex === 'Male' ? 'M' : 'F')) : true); }).length;
  const countLgu = (field, val, sex) => lguData.filter(p => (field ? p[field] === val : true) && (sex ? p.sex === sex : true)).length;
  const countGfps = (roleFilter, sex) => gfpsData.filter(p => { if (sex && p.sex !== sex) return false; if (roleFilter === 'TWG') return p.gfps_role?.includes('TWG') || p.gfps_role?.includes('Technical Working Group'); if (roleFilter === 'Exec') return p.gfps_role?.includes('Executive Committee'); if (roleFilter === 'Sec') return p.gfps_role === 'Secretariat'; return true; }).length;

  const buildStatRow = (label, sector, field, val) => { const m = countProfile(sector, field, val, 'Male'); const f = countProfile(sector, field, val, 'Female'); return [label, m, f, m + f]; };
  const buildLguRow = (label, field, val) => { const m = countLgu(field, val, 'Male'); const f = countLgu(field, val, 'Female'); return [label, m, f, m + f]; };

  const handleExportExcel = () => {
    let dataToExport = [];
    let filename = "";
    if (activeTab === 'Profiles') { dataToExport = getProcessedData(profiles); filename = "GAD_Beneficiaries"; }
    else if (activeTab === 'LGU') { dataToExport = getProcessedData(lguData); filename = "LGU_Employees"; }
    else if (activeTab === 'GFPS') { dataToExport = getProcessedData(gfpsData); filename = "GFPS_Members"; }
    else if (activeTab === 'OFW') { dataToExport = getProcessedData(ofwData); filename = "OFW_Records"; }
    else if (activeTab === 'Trainings') { dataToExport = getProcessedData(trainings); filename = "Training_Logs"; }
    
    if (dataToExport.length === 0) return alert("No data available to export.");
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportWord = async (record) => {
    const formatKey = (key) => key.replace(/_/g, ' ').toUpperCase();
    const documentChildren = [
      new Paragraph({ text: `${activeTab} Record Details`, heading: HeadingLevel.HEADING_1, spacing: { after: 400 } }),
      new Paragraph({ text: `Generated on: ${new Date().toLocaleDateString()}`, spacing: { after: 400 } })
    ];
    Object.entries(record).forEach(([key, value]) => {
      if (value !== null && value !== "" && key !== 'id' && key !== 'created_at') {
        documentChildren.push( new Paragraph({ children: [ new TextRun({ text: `${formatKey(key)}: `, bold: true }), new TextRun({ text: String(value) }) ], spacing: { after: 200 } }) );
      }
    });
    const doc = new Document({ sections: [{ properties: {}, children: documentChildren }] });
    const blob = await Packer.toBlob(doc);
    const identifier = record.last_name || record.training_title || "Record";
    saveAs(blob, `${identifier}_${activeTab}_Profile.docx`);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());
    let table = '';
    if (activeTab === 'Profiles' || selectedForm === 'Profiles') table = 'profiles';
    if (activeTab === 'LGU' || selectedForm === 'LGU') table = 'lgu_employees';
    if (activeTab === 'GFPS' || selectedForm === 'GFPS') table = 'gfps_members';
    if (activeTab === 'OFW' || selectedForm === 'OFW') table = 'ofw_profiles';
    if (activeTab === 'Trainings' || selectedForm === 'Trainings') table = 'capacity_trainings';

    if (modalMode === 'add') {
      if (table === 'lgu_employees') {
        let nextNum = 1;
        if (lguData.length > 0) {
          const maxId = Math.max(...lguData.map(item => parseInt(item.employee_id?.match(/EMP-(\d+)/)?.[1] || 0)));
          nextNum = maxId + 1;
        }
        payload.employee_id = `EMP-${String(nextNum).padStart(3, '0')}`;
      }
      if (table === 'gfps_members') {
        let nextNum = 1;
        if (gfpsData.length > 0) {
          const maxId = Math.max(...gfpsData.map(item => parseInt(item.gfps_id?.match(/GFPS-(\d+)/)?.[1] || 0)));
          nextNum = maxId + 1;
        }
        payload.gfps_id = `GFPS-${String(nextNum).padStart(3, '0')}`;
      }
      const { error } = await supabase.from(table).insert([payload]);
      if (error) alert("Error saving: " + error.message);
      else { alert("Record saved successfully!"); setIsModalOpen(false); e.target.reset(); fetchData(); }
    } else {
      const { error } = await supabase.from(table).update(payload).eq('id', editingData.id);
      if (error) alert("Error updating: " + error.message);
      else { alert("Record updated!"); setIsModalOpen(false); fetchData(); }
    }
  };

  const handleDelete = async (table, id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) alert("Delete failed: " + error.message);
      else fetchData();
    }
  };

  const handleLogin = (role, name) => { setUserRole(role); setUserName(name); setActiveTab(role === 'admin' ? 'Dashboard' : 'SubmitForm'); };
  const handleLogout = async () => { await supabase.auth.signOut(); setUserRole(null); setUserName(''); setAuthError(null); };
  const openAddModal = () => { setModalMode('add'); setEditingData({}); setSelectedSector(""); setSelectedForm(activeTab); setIsModalOpen(true); };
  const openEditModal = (record) => { setModalMode('edit'); setEditingData(record); if (record.sector) setSelectedSector(record.sector); setSelectedForm(activeTab); setIsModalOpen(true); };

  if (!userRole) return ( <LoginScreen onLogin={handleLogin} onGoogleLogin={handleGoogleLogin} authError={authError} setAuthError={setAuthError} /> );

  const renderDetails = (tab, rawData) => {
    if (!rawData) return <p>No detailed data available.</p>;
    
    if (tab === 'Profiles') return ( <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in"> <DetailItem label="Full Name" value={`${rawData.last_name}, ${rawData.first_name} ${rawData.middle_name || ''}`.trim()} /> <DetailItem label="Status" value={rawData.status || 'Active'} /> <DetailItem label="Sex / Age" value={`${rawData.sex} / ${rawData.age}`} /> <DetailItem label="Birthdate" value={rawData.birthdate} /> <DetailItem label="Civil Status" value={rawData.civil_status} /> <DetailItem label="Barangay" value={rawData.barangay} /> <DetailItem label="Contact No." value={rawData.contact_no} /> <DetailItem label="Occupation" value={rawData.occupation} /> <DetailItem label="Income Level" value={rawData.income_level} /> <DetailItem label="Date Registered" value={rawData.date_registered} /> <DetailItem label="Sector" value={rawData.sector} /> <DetailItem label="Specific Detail" value={rawData.disability_type || rawData.youth_status || rawData.women_status || rawData.toda_role || rawData.farmer_status || rawData.fisherfolk_status || "N/A"} /> </div> );
    if (tab === 'LGU') return ( <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in"> <DetailItem label="Employee ID" value={rawData.employee_id} /> <DetailItem label="Full Name" value={`${rawData.last_name}, ${rawData.first_name} ${rawData.middle_name || ''}`.trim()} /> <DetailItem label="Sex / Age" value={`${rawData.sex} / ${rawData.age}`} /> <DetailItem label="Civil Status" value={rawData.civil_status} /> <DetailItem label="Department" value={rawData.department} /> <DetailItem label="Position" value={rawData.position_title} /> <DetailItem label="Status" value={rawData.employment_status} /> <DetailItem label="Salary Grade" value={rawData.salary_grade} /> <DetailItem label="Years in Service" value={rawData.years_in_service} /> <DetailItem label="Leadership" value={rawData.is_leadership_position} /> </div> );
    if (tab === 'GFPS') return ( <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in"> <DetailItem label="GFPS ID" value={rawData.gfps_id} /> <DetailItem label="Full Name" value={`${rawData.last_name}, ${rawData.first_name} ${rawData.middle_name || ''}`.trim()} /> <DetailItem label="Sex / Age" value={`${rawData.sex} / ${rawData.age}`} /> <DetailItem label="Department" value={rawData.department} /> <DetailItem label="Position" value={rawData.position} /> <DetailItem label="GFPS Role" value={rawData.gfps_role} /> <DetailItem label="Contact Number" value={rawData.contact_number} /> <DetailItem label="Email" value={rawData.email} /> <DetailItem label="Date Designated" value={rawData.date_designated} /> </div> );
    if (tab === 'Trainings') return ( <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in"> <DetailItem label="Training Title" value={rawData.training_title} /> <DetailItem label="Conducting Office" value={rawData.office} /> <DetailItem label="Date Conducted" value={rawData.date_conducted} /> <DetailItem label="Total Participants" value={Number(rawData.participants_male || 0) + Number(rawData.participants_female || 0)} /> <DetailItem label="Male Participants" value={rawData.participants_male} /> <DetailItem label="Female Participants" value={rawData.participants_female} /> <DetailItem label="Participant Names" value={rawData.participant_names} fullWidth={true} /> </div> );
    if (tab === 'OFW') return ( <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in"> <DetailItem label="Full Name" value={`${rawData.last_name}, ${rawData.first_name} ${rawData.middle_name || ''}`.trim()} /> <DetailItem label="Status" value={rawData.status || 'Active'} /> <DetailItem label="Country" value={rawData.country_employment} /> <DetailItem label="Job Position" value={rawData.job_position} /> <DetailItem label="Employment Type" value={rawData.employment_type} /> <DetailItem label="Deployment Date" value={rawData.deployment_date} /> <DetailItem label="Income Level" value={rawData.monthly_salary} /> <DetailItem label="Contact" value={rawData.contact_number} /> </div> );
    return null;
  };

  const pwdData = ['Physical Disability', 'Visual Disability', 'Hearing Disability', 'Intellectual Disability', 'Psychosocial Disability', 'Multiple Disability'].map(type => buildStatRow(type, 'PWD', 'disability_type', type));
  const youthData = ['In School', 'Out of School Youth', 'Employed', 'Unemployed', 'Youth Leaders'].map(type => buildStatRow(type, 'Youth', 'youth_status', type));
  const soloData = ['Widow/Widower', 'Separated/Divorced', 'Unmarried Parent', 'Spouse Detained', 'Spouse Overseas'].map(type => buildStatRow(type, 'Solo Parent', 'solo_parent_status', type));
  const womenData = [ ['Women of Reproductive Age (15-49)', countProfile('Women', 'women_status', 'Women of Reproductive Age (15-49)')], ['Pregnant Women', countProfile('Women', 'women_status', 'Pregnant Women')], ['Lactating Mothers', countProfile('Women', 'women_status', 'Lactating Mothers')], ['Women Heads of Household', countProfile('Women', 'women_status', 'Women Heads of Household')], ['Women Employed', countProfile('Women', 'women_status', 'Women Employed')], ['Women Entrepreneurs', countProfile('Women', 'women_status', 'Women Entrepreneurs')], ['Women in Leadership Positions', countProfile('Women', 'women_status', 'Women in Leadership Positions')] ];
  const seniorData = [ ['60-69', countAge('Senior Citizen', 60, 69, 'Male'), countAge('Senior Citizen', 60, 69, 'Female')], ['70-79', countAge('Senior Citizen', 70, 79, 'Male'), countAge('Senior Citizen', 70, 79, 'Female')], ['80-89', countAge('Senior Citizen', 80, 89, 'Male'), countAge('Senior Citizen', 80, 89, 'Female')], ['90+', countAge('Senior Citizen', 90, 999, 'Male'), countAge('Senior Citizen', 90, 999, 'Female')] ].map(row => [row[0], row[1], row[2], row[1]+row[2]]);
  const todaData = [ buildStatRow('Tricycle Drivers', 'TODA Member', 'toda_role', 'Tricycle Drivers'), buildStatRow('Operators', 'TODA Member', 'toda_role', 'Operators'), buildStatRow('Driver-Operator', 'TODA Member', 'toda_role', 'Driver-Operator') ];
  const gfpsSumData = [ ['Executive Committee', countGfps('Exec', 'Male'), countGfps('Exec', 'Female')], ['Technical Working Group', countGfps('TWG', 'Male'), countGfps('TWG', 'Female')], ['Secretariat', countGfps('Sec', 'Male'), countGfps('Sec', 'Female')] ].map(row => [row[0], row[1], row[2], row[1]+row[2]]);
  const lguEmpData = ['Permanent', 'Contractual', 'Job Order', 'Casual'].map(t => buildLguRow(`${t} Employees`, 'employment_status', t));
  const lguSgData = ['SG 1-10', 'SG 11-15', 'SG 16-20', 'SG 21-24', 'SG 25+'].map(t => buildLguRow(t, 'salary_grade', t));
  const lguLeadData = ['Department Heads', 'Division Chiefs', 'Supervisors'].map(t => buildLguRow(t, 'is_leadership_position', t));
  const depts = [...new Set(lguData.map(p => p.department).filter(Boolean))];
  const lguDeptData = depts.map(d => buildLguRow(d, 'department', d));
  const calcTotal = (arr) => [ "Total", arr.reduce((sum, row) => sum + row[1], 0), arr.reduce((sum, row) => sum + row[2], 0), arr.reduce((sum, row) => sum + row[3], 0) ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden selection:bg-sky-100">
      {sidebarOpen && ( <div className="fixed inset-0 bg-slate-900/50 z-20 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} /> )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-72 bg-white border-r border-slate-100 transform transition-transform duration-300 ease-in-out flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-8 flex items-center justify-center border-b border-slate-50">
          <div className="text-center">
            <h1 className="text-2xl font-black text-sky-600 tracking-tight">GAD Registry</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{userRole === 'admin' ? 'Administrator' : 'Data Entry'}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {userRole === 'admin' ? (
            <>
              <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Main Menu</p>
              <SidebarItem icon={<LayoutDashboard size={20} />} label="Master Dashboard" active={activeTab === 'Dashboard'} onClick={() => { setActiveTab('Dashboard'); setSidebarOpen(false); }} />
              <SidebarItem icon={<Users size={20} />} label="GAD Beneficiaries" active={activeTab === 'Profiles'} onClick={() => { setActiveTab('Profiles'); setSidebarOpen(false); }} />
              <SidebarItem icon={<Plane size={20} />} label="OFW Records" active={activeTab === 'OFW'} onClick={() => { setActiveTab('OFW'); setSidebarOpen(false); }} />
              
              <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6">Internal Records</p>
              <SidebarItem icon={<Building2 size={20} />} label="LGU Employees" active={activeTab === 'LGU'} onClick={() => { setActiveTab('LGU'); setSidebarOpen(false); }} />
              <SidebarItem icon={<BadgeCheck size={20} />} label="GFPS Members" active={activeTab === 'GFPS'} onClick={() => { setActiveTab('GFPS'); setSidebarOpen(false); }} />
              <SidebarItem icon={<GraduationCap size={20} />} label="Capacity Trainings" active={activeTab === 'Trainings'} onClick={() => { setActiveTab('Trainings'); setSidebarOpen(false); }} />
              
              <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6">System</p>
              <SidebarItem icon={<ShieldCheck size={20} />} label="System Administration" active={activeTab === 'Admins'} onClick={() => { setActiveTab('Admins'); setSidebarOpen(false); }} />
            </>
          ) : (
            <>
              <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tasks</p>
              <SidebarItem icon={<PlusCircle size={20} />} label="Submit New Forms" active={activeTab === 'SubmitForm'} onClick={() => { setActiveTab('SubmitForm'); setSidebarOpen(false); }} />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center justify-between px-2 mb-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
              <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center"> <UserIcon size={16} /> </div>
              <span className="truncate w-32">{userName}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="lg:hidden h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center px-4 justify-between z-10 sticky top-0">
          <h1 className="font-bold text-slate-800">GAD Registry</h1>
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"> <Menu /> </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-10 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {userRole === 'admin' && (
              <>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                      {activeTab === 'Dashboard' && "Master Dashboard"}
                      {activeTab === 'Profiles' && "GAD Beneficiaries"}
                      {activeTab === 'OFW' && "OFW Directory"}
                      {activeTab === 'LGU' && "LGU Employee Records"}
                      {activeTab === 'GFPS' && "GFPS Member Records"}
                      {activeTab === 'Trainings' && "Training Logs"}
                      {activeTab === 'Admins' && "System Administration"}
                    </h2>
                  </div>

                  {activeTab !== 'Dashboard' && activeTab !== 'Admins' && (
                    <div className="flex gap-3">
                      <button onClick={handleExportExcel} className="px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-sm hover:bg-emerald-100 transition-all flex items-center gap-2 shadow-sm">
                        <Download size={16} /> Export to Excel
                      </button>
                      <button onClick={openAddModal} className="px-4 py-2.5 bg-sky-500 text-white rounded-xl font-bold text-sm hover:bg-sky-600 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-sky-200">
                        <PlusCircle size={16} /> Add New
                      </button>
                    </div>
                  )}
                </div>

                {activeTab === 'Admins' && (
                  <div className="space-y-6 animate-in fade-in max-w-4xl">
                    
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                      <h3 className="text-xl font-black text-sky-600 mb-2">Manage Administrator Access</h3>
                      <p className="text-slate-500 font-medium mb-8">Add or remove Google accounts that are authorized to access this dashboard. The primary owner account cannot be deleted.</p>
                      
                      <form onSubmit={handleAddAdmin} className="flex gap-4 items-end mb-10 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <div className="flex-1 space-y-1.5">
                          <label className="text-sm font-bold text-slate-600 ml-1">Add New Admin Email</label>
                          <input autoComplete="off" name="new_admin_email" type="email" required placeholder="name@gmail.com" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-700 font-medium" />
                        </div>
                        <button type="submit" className="px-6 py-3 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-600 transition-all flex items-center gap-2 shadow-sm">
                          <PlusCircle size={18} /> Authorize Access
                        </button>
                      </form>

                      <div className="border border-slate-100 rounded-2xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                              <th className="p-5 font-bold">Authorized Email Address</th>
                              <th className="p-5 font-bold text-center w-24">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminList.map(admin => (
                              <tr key={admin.id} className="border-b border-slate-50 hover:bg-sky-50/30 transition-colors">
                                <td className="p-5 font-medium text-slate-700">{admin.email}</td>
                                <td className="p-5 text-center">
                                  <button onClick={() => handleDeleteAdmin(admin.id, admin.email)} className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors" title="Revoke Access">
                                    <Trash2 size={18} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                      <h3 className="text-xl font-black text-sky-600 mb-2">Manage Beneficiary Sectors</h3>
                      <p className="text-slate-500 font-medium mb-8">Add new categories to the "Beneficiary Sector" dropdown in the form entry. Existing profiles will not be deleted if you remove a sector here.</p>
                      
                      <form onSubmit={handleAddSector} className="flex gap-4 items-end mb-10 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <div className="flex-1 space-y-1.5">
                          <label className="text-sm font-bold text-slate-600 ml-1">Add New Sector</label>
                          <input autoComplete="off" name="new_sector" type="text" required placeholder="e.g. LGBTQ+" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-700 font-medium" />
                        </div>
                        <button type="submit" className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-sm">
                          <PlusCircle size={18} /> Add Category
                        </button>
                      </form>

                      <div className="flex flex-wrap gap-3">
                        {sectorOptions.map(sector => (
                          <div key={sector.id} className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl text-slate-700 font-bold text-sm shadow-sm border border-slate-200">
                            {sector.name}
                            <button onClick={() => handleDeleteSector(sector.id, sector.name)} className="text-slate-400 hover:text-rose-500 transition-colors ml-2">
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                      <h3 className="text-xl font-black text-sky-600 mb-2">Manage Record Statuses</h3>
                      <p className="text-slate-500 font-medium mb-8">Add or remove options for the "Status" dropdown found in the GAD and OFW forms.</p>
                      
                      <form onSubmit={handleAddStatus} className="flex gap-4 items-end mb-10 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <div className="flex-1 space-y-1.5">
                          <label className="text-sm font-bold text-slate-600 ml-1">Add New Status</label>
                          <input autoComplete="off" name="new_status" type="text" required placeholder="e.g. Relocated" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-700 font-medium" />
                        </div>
                        <button type="submit" className="px-6 py-3 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-sm">
                          <PlusCircle size={18} /> Add Status
                        </button>
                      </form>

                      <div className="flex flex-wrap gap-3">
                        {statusOptions.map(status => (
                          <div key={status.id} className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl text-slate-700 font-bold text-sm shadow-sm border border-slate-200">
                            {status.name}
                            <button onClick={() => handleDeleteStatus(status.id, status.name)} className="text-slate-400 hover:text-rose-500 transition-colors ml-2">
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {activeTab === 'Dashboard' && (
                  <div className="space-y-10 animate-in fade-in">
                    <div>
                      <h3 className="text-2xl font-black text-sky-600 border-b-2 border-sky-100 pb-3 mb-6">Part I: Beneficiary Sector Summaries (SDD)</h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <DashboardTable title="2.1 PWD Sector" columns={["Indicator", "Male", "Female", "Total"]} data={pwdData} totals={calcTotal(pwdData)} />
                        <DashboardTable title="2.2 Youth Sector (Age 15-30)" columns={["Category", "Male", "Female", "Total"]} data={youthData} totals={calcTotal(youthData)} />
                        <DashboardTable title="2.3 Solo Parent Sector" columns={["Type of Solo Parent", "Male", "Female", "Total"]} data={soloData} totals={calcTotal(soloData)} />
                        <DashboardTable title="2.4 Women Sector" columns={["Indicator", "Count"]} data={womenData} totals={["Total Women Registered", womenData.reduce((s, row) => s + row[1], 0)]} />
                        <DashboardTable title="2.5 Senior Citizen Sector" columns={["Age Group", "Male", "Female", "Total"]} data={seniorData} totals={calcTotal(seniorData)} />
                        <DashboardTable title="2.6 TODA Members" columns={["Category", "Male", "Female", "Total"]} data={todaData} totals={calcTotal(todaData)} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-sky-600 border-b-2 border-sky-100 pb-3 mb-6 mt-12">Part II: LGU & GFPS Internal Records</h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <DashboardTable title="GFPS Members Summary" columns={["Category", "Male", "Female", "Total"]} data={gfpsSumData} totals={calcTotal(gfpsSumData)} />
                        <DashboardTable title="LGU Employment Status" columns={["Indicator", "Male", "Female", "Total"]} data={lguEmpData} totals={calcTotal(lguEmpData)} />
                        <DashboardTable title="LGU Employees by Salary Grade" columns={["Salary Grade", "Male", "Female", "Total"]} data={lguSgData} totals={calcTotal(lguSgData)} />
                        <DashboardTable title="LGU Leadership Positions" columns={["Position Category", "Male", "Female", "Total"]} data={lguLeadData} totals={calcTotal(lguLeadData)} />
                        <div className="lg:col-span-2"> <DashboardTable title="LGU Employees by Office/Department" columns={["Office/Department", "Male", "Female", "Total"]} data={lguDeptData} totals={calcTotal(lguDeptData)} /> </div>
                        <div className="lg:col-span-2">
                          <DashboardTable title="Gender Capacity Building Monitoring" columns={["Training Title", "Male", "Female", "Total", "Office/Dept", "Date Conducted"]} data={trainings.map(t => [ t.training_title, t.participants_male || 0, t.participants_female || 0, Number(t.participants_male || 0) + Number(t.participants_female || 0), t.office, t.date_conducted ])} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TABLES WITH SEARCH AND SORT INJECTED */}
                {activeTab === 'Profiles' && ( 
                  <div className="space-y-6">
                    <SearchBar placeholder="Type to search profiles..." searchQuery={searchQuery} setSearchQuery={setSearchQuery} sortOption={sortOption} setSortOption={setSortOption} showStatusSort={true} />
                    <DataTable columns={["Name & Info", "Sector", "Specific Details", "Actions"]} data={getProcessedData(profiles).map(p => ({ id: p.id, raw: p, col1: <><div className="flex items-center gap-2"><p className="font-bold text-slate-800 text-base">{p.last_name}, {p.first_name} {p.middle_name || ''}</p><span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${(!p.status || p.status === 'Active') ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{p.status || 'Active'}</span></div><p className="text-xs font-medium text-slate-400 mt-1">{p.sex} • {p.age} yrs • {p.barangay}</p></>, col2: <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wide">{p.sector}</span>, col3: p.disability_type || p.women_status || p.youth_status || "N/A" }))} onEdit={openEditModal} onDelete={(id) => handleDelete('profiles', id)} onExportWord={handleExportWord} renderDetails={(raw) => renderDetails('Profiles', raw)} />
                  </div> 
                )}
                {activeTab === 'OFW' && ( 
                  <div className="space-y-6">
                    <SearchBar placeholder="Type to search OFW records..." searchQuery={searchQuery} setSearchQuery={setSearchQuery} sortOption={sortOption} setSortOption={setSortOption} showStatusSort={true} />
                    <DataTable columns={["OFW Name", "Country & Role", "Status", "Actions"]} data={getProcessedData(ofwData).map(p => ({ id: p.id, raw: p, col1: <><div className="flex items-center gap-2"><p className="font-bold text-slate-800 text-base">{p.last_name}, {p.first_name} {p.middle_name || ''}</p><span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${(!p.status || p.status === 'Active') ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{p.status || 'Active'}</span></div><p className="text-xs font-medium text-slate-400 mt-1">{p.job_position}</p></>, col2: <><p className="font-semibold text-slate-700">{p.country_employment}</p><p className="text-xs text-slate-400">Deployed: {p.deployment_date}</p></>, col3: <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wide">{p.status || 'Active'}</span> }))} onEdit={openEditModal} onDelete={(id) => handleDelete('ofw_profiles', id)} onExportWord={handleExportWord} renderDetails={(raw) => renderDetails('OFW', raw)} />
                  </div> 
                )}
                {activeTab === 'LGU' && ( 
                  <div className="space-y-6">
                    <SearchBar placeholder="Type to search employees..." searchQuery={searchQuery} setSearchQuery={setSearchQuery} sortOption={sortOption} setSortOption={setSortOption} showStatusSort={false} />
                    <DataTable columns={["Employee", "Department", "Status", "Actions"]} data={getProcessedData(lguData).map(p => ({ id: p.id, raw: p, col1: <><p className="font-bold text-slate-800 text-base">{p.last_name}, {p.first_name} {p.middle_name || ''}</p><p className="text-xs font-medium text-slate-400 mt-1">ID: {p.employee_id} • {p.position_title}</p></>, col2: <><p className="font-semibold text-slate-700">{p.department}</p><p className="text-xs text-slate-400">{p.salary_grade}</p></>, col3: <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold uppercase tracking-wide">{p.employment_status}</span> }))} onEdit={openEditModal} onDelete={(id) => handleDelete('lgu_employees', id)} onExportWord={handleExportWord} renderDetails={(raw) => renderDetails('LGU', raw)} />
                  </div> 
                )}
                {activeTab === 'GFPS' && ( 
                  <div className="space-y-6">
                    <SearchBar placeholder="Type to search GFPS members..." searchQuery={searchQuery} setSearchQuery={setSearchQuery} sortOption={sortOption} setSortOption={setSortOption} showStatusSort={false} />
                    <DataTable columns={["Member Name", "Department & Position", "GFPS Role", "Actions"]} data={getProcessedData(gfpsData).map(p => ({ id: p.id, raw: p, col1: <><p className="font-bold text-slate-800 text-base">{p.last_name}, {p.first_name} {p.middle_name || ''}</p><p className="text-xs font-medium text-slate-400 mt-1">ID: {p.gfps_id}</p></>, col2: <><p className="font-semibold text-slate-700">{p.department}</p><p className="text-xs text-slate-400">{p.position}</p></>, col3: <span className="px-3 py-1.5 bg-sky-50 text-sky-600 rounded-lg text-xs font-bold uppercase tracking-wide">{p.gfps_role}</span> }))} onEdit={openEditModal} onDelete={(id) => handleDelete('gfps_members', id)} onExportWord={handleExportWord} renderDetails={(raw) => renderDetails('GFPS', raw)} />
                  </div> 
                )}
                {activeTab === 'Trainings' && ( 
                  <div className="space-y-6">
                    <SearchBar placeholder="Type to search trainings..." searchQuery={searchQuery} setSearchQuery={setSearchQuery} sortOption={sortOption} setSortOption={setSortOption} showStatusSort={false} />
                    <DataTable columns={["Training Title", "Participants (M/F)", "Office", "Actions"]} data={getProcessedData(trainings).map(p => ({ id: p.id, raw: p, col1: <><p className="font-bold text-slate-800 text-base">{p.training_title}</p><p className="text-xs font-medium text-slate-400 mt-1">{p.date_conducted}</p></>, col2: <><span className="text-sky-600 font-bold">{p.participants_male}M</span> / <span className="text-emerald-600 font-bold">{p.participants_female}F</span> <span className="text-slate-400 text-xs ml-2">(Total: {Number(p.participants_male || 0) + Number(p.participants_female || 0)})</span></>, col3: p.office }))} onEdit={openEditModal} onDelete={(id) => handleDelete('capacity_trainings', id)} onExportWord={handleExportWord} renderDetails={(raw) => renderDetails('Trainings', raw)} />
                  </div> 
                )}
              </>
            )}

            {/* --- USER/STAFF VIEW (ONLY FORMS) --- */}
            {userRole === 'user' && activeTab === 'SubmitForm' && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div>
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight">Submit New Data</h2>
                  <p className="text-slate-500 font-medium mt-1">Select a form type below to enter new records into the database.</p>
                </div>
                <div className="flex flex-wrap gap-2 bg-slate-100 p-1 rounded-xl mb-6">
                  {['Profiles', 'OFW', 'LGU', 'GFPS', 'Trainings'].map(formType => (
                    <button key={formType} onClick={() => { setSelectedForm(formType); setSelectedSector(""); }} className={`flex-1 min-w-[100px] py-2.5 text-sm font-bold rounded-lg transition-all ${selectedForm === formType ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                      {formType === 'Profiles' && 'GAD Beneficiary'} {formType === 'OFW' && 'OFW Profile'} {formType === 'LGU' && 'LGU Employee'} {formType === 'GFPS' && 'GFPS Member'} {formType === 'Trainings' && 'Training Log'}
                    </button>
                  ))}
                </div>
                <div className="bg-white p-6 md:p-10 rounded-[2rem] shadow-sm border border-slate-100">
                  <h3 className="text-xl font-black text-slate-800 mb-6 border-b border-slate-100 pb-4">
                    {selectedForm === 'Profiles' && "Register GAD Beneficiary"} {selectedForm === 'OFW' && "Register OFW Profile"} {selectedForm === 'LGU' && "Register LGU Employee"} {selectedForm === 'GFPS' && "Register GFPS Member"} {selectedForm === 'Trainings' && "Log New Training"}
                  </h3>
                  <form onSubmit={handleSave} className="space-y-6">
                    {selectedForm === 'Profiles' && <ProfileFormFields sectorOptions={sectorOptions} statusOptions={statusOptions} selectedSector={selectedSector} setSelectedSector={setSelectedSector} />} 
                    {selectedForm === 'OFW' && <OFWFormFields statusOptions={statusOptions} />} 
                    {selectedForm === 'LGU' && <LGUFormFields />} 
                    {selectedForm === 'GFPS' && <GFPSFormFields />} 
                    {selectedForm === 'Trainings' && <TrainingFormFields />}
                    <div className="pt-6 border-t border-slate-100 flex justify-end">
                      <button type="submit" className="px-8 py-3 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-600 shadow-md shadow-sky-200 transition-colors">Submit Record</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* --- REUSABLE MODAL FOR ADD/EDIT (ADMIN ONLY) --- */}
      {isModalOpen && userRole === 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-800">
                  {modalMode === 'add' ? 'Register New' : 'Edit'} {selectedForm === 'Profiles' && " GAD Beneficiary"} {selectedForm === 'OFW' && " OFW Profile"} {selectedForm === 'LGU' && " LGU Employee"} {selectedForm === 'GFPS' && " GFPS Member"} {selectedForm === 'Trainings' && " Training"}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <form id="modalForm" onSubmit={handleSave} className="space-y-6">
                {selectedForm === 'Profiles' && <ProfileFormFields data={editingData} sectorOptions={sectorOptions} statusOptions={statusOptions} selectedSector={selectedSector} setSelectedSector={setSelectedSector} />} 
                {selectedForm === 'OFW' && <OFWFormFields data={editingData} statusOptions={statusOptions} />} 
                {selectedForm === 'LGU' && <LGUFormFields data={editingData} />} 
                {selectedForm === 'GFPS' && <GFPSFormFields data={editingData} />} 
                {selectedForm === 'Trainings' && <TrainingFormFields data={editingData} />}
              </form>
            </div>
            <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
              <button type="submit" form="modalForm" className="px-6 py-2.5 bg-sky-500 text-white font-bold rounded-xl hover:bg-sky-600 shadow-md shadow-sky-200 transition-colors">{modalMode === 'add' ? 'Save Record' : 'Update Record'}</button>
            </div>
          </div>
        </div>
      )}
      <style>{` .custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; } `}</style>
    </div>
  );
}

// --- REUSABLE UI COMPONENTS ---
const SidebarItem = ({ icon, label, active, onClick }) => ( <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 font-medium ${active ? 'bg-sky-50 text-sky-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-sky-600'}`}> <div className={`${active ? 'text-sky-600' : 'text-slate-400'}`}>{icon}</div> <span>{label}</span> </button> );

// REPLACED STATIC SEARCH BAR WITH LIVE FILTER AND SORT OPTIONS
const SearchBar = ({ placeholder, searchQuery, setSearchQuery, sortOption, setSortOption, showStatusSort }) => ( 
  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4"> 
    <div className="flex-1 relative"> 
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /> 
      <input 
        autoComplete="off" 
        type="text" 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={placeholder} 
        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-700 font-medium transition-all" 
      /> 
    </div> 
    <div className="sm:w-72">
      <select 
        value={sortOption}
        onChange={(e) => setSortOption(e.target.value)}
        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-700 font-medium transition-all appearance-none cursor-pointer" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.2em' }}
      >
        <option value="Newest">Sort: Date Added (Newest)</option>
        <option value="Oldest">Sort: Date Added (Oldest)</option>
        <option value="A-Z">Sort: Alphabetical (A-Z)</option>
        {showStatusSort && <option value="Status (Active First)">Sort: Status (Active First)</option>}
      </select>
    </div>
  </div> 
);

const DataTable = ({ columns, data, onEdit, onDelete, onExportWord, renderDetails }) => {
  const [expandedId, setExpandedId] = useState(null);
  const toggleRow = (id) => setExpandedId(expandedId === id ? null : id);
  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
              {columns.map((col, i) => ( <th key={i} className={`p-6 font-bold ${i === columns.length - 1 ? 'text-center' : ''}`}>{col}</th> ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <React.Fragment key={row.id}>
                <tr className={`border-b border-slate-50 hover:bg-sky-50/30 transition-colors ${expandedId === row.id ? 'bg-sky-50/20' : ''}`}>
                  <td className="p-6">{row.col1}</td><td className="p-6">{row.col2}</td><td className="p-6 text-slate-600 font-medium text-sm">{row.col3}</td>
                  <td className="p-6">
                    <div className="flex justify-center items-center gap-2">
                      <button onClick={() => onExportWord && onExportWord(row.raw)} className="p-2.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors" title="Export to Word"><FileText size={18} /></button>
                      <button onClick={() => onEdit && onEdit(row.raw)} className="p-2.5 text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-xl transition-colors" title="Edit"><Edit size={18} /></button>
                      <button onClick={() => onDelete && onDelete(row.id)} className="p-2.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors" title="Delete"><Trash2 size={18} /></button>
                      {renderDetails && ( <button onClick={() => toggleRow(row.id)} className={`p-2.5 rounded-xl transition-all ${expandedId === row.id ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`} title="View Details">{expandedId === row.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</button> )}
                    </div>
                  </td>
                </tr>
                {expandedId === row.id && renderDetails && ( <tr className="bg-slate-50/50 border-b border-slate-100"><td colSpan={columns.length} className="p-6 border-l-4 border-sky-400">{renderDetails(row.raw)}</td></tr> )}
              </React.Fragment>
            ))}
            {data.length === 0 && <tr><td colSpan={columns.length} className="p-6 text-center text-slate-400 font-medium">No records found.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="p-6 border-t border-slate-100 bg-slate-50/30 text-center"><p className="text-sm font-medium text-slate-500">Showing {data.length} records.</p></div>
    </div>
  );
};

const DetailItem = ({ label, value, fullWidth }) => (
  <div className={`bg-white p-3 rounded-xl border border-slate-100 shadow-sm ${fullWidth ? 'col-span-2 md:col-span-4' : ''}`}>
    <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</span>
    <span className="block text-sm font-medium text-slate-800 whitespace-pre-wrap">{value || "N/A"}</span>
  </div>
);

const FormInput = ({ name, label, type = "text", placeholder, defaultValue, required }) => ( <div className="space-y-1.5"><label className="text-sm font-bold text-slate-600 ml-1">{label}</label><input autoComplete="off" name={name} type={type} placeholder={placeholder} defaultValue={defaultValue} required={required} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-700 font-medium transition-all" /></div> );
const FormSelect = ({ name, label, options = [], onChange, defaultValue }) => ( <div className="space-y-1.5"><label className="text-sm font-bold text-slate-600 ml-1">{label}</label><select name={name} onChange={onChange} defaultValue={defaultValue || ""} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-700 font-medium transition-all appearance-none cursor-pointer" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.2em' }}><option value="" disabled>Select an option...</option>{options.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div> );

const ProfileFormFields = ({ data = {}, sectorOptions = [], statusOptions = [], selectedSector, setSelectedSector }) => (
  <div className="space-y-8">
    <div>
      <h4 className="text-sm font-black text-sky-600 uppercase tracking-wider border-b border-sky-100 pb-2 mb-4">I. Personal Information</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FormInput name="last_name" label="Last Name" defaultValue={data.last_name} required />
        <FormInput name="first_name" label="First Name" defaultValue={data.first_name} required />
        <FormInput name="middle_name" label="Middle Name" defaultValue={data.middle_name} />
        <FormSelect name="sex" label="Sex" options={["Male", "Female"]} defaultValue={data.sex} />
        <FormInput name="age" label="Age" type="number" defaultValue={data.age} />
        <FormInput name="birthdate" label="Birthdate" type="date" defaultValue={data.birthdate} />
        <FormSelect name="civil_status" label="Civil Status" options={["Single", "Married", "Widowed", "Separated"]} defaultValue={data.civil_status} />
        <FormInput name="barangay" label="Barangay" defaultValue={data.barangay} />
        <FormInput name="contact_no" label="Contact No." defaultValue={data.contact_no} />
        <FormInput name="occupation" label="Occupation" defaultValue={data.occupation} />
        <FormSelect name="income_level" label="Income Level (Monthly)" options={["below 10k", "11k-20k", "21k-30k", "31k-40k", "41k-50k", "50k-100k", "100k above"]} defaultValue={data.income_level} />
        <FormInput name="date_registered" label="Date Registered" type="date" defaultValue={data.date_registered || new Date().toISOString().split('T')[0]} />
        <FormSelect name="status" label="Status" options={statusOptions.map(s => s.name)} defaultValue={data.status || 'Active'} />
      </div>
    </div>
    <div>
      <h4 className="text-sm font-black text-sky-600 uppercase tracking-wider border-b border-sky-100 pb-2 mb-4">II. Sector Details</h4>
      <FormSelect name="sector" label="Beneficiary Sector" options={sectorOptions.map(s => s.name)} defaultValue={data.sector || selectedSector} onChange={(e) => setSelectedSector(e.target.value)} />
      <div className="mt-4">
        {selectedSector === "PWD" && <FormSelect name="disability_type" label="Disability Type" options={["Physical Disability", "Visual Disability", "Hearing Disability", "Intellectual Disability", "Psychosocial Disability", "Multiple Disability"]} defaultValue={data.disability_type} />}
        {selectedSector === "Youth" && <FormSelect name="youth_status" label="Youth Status" options={["In School", "Out of School Youth", "Employed", "Unemployed", "Youth Leaders"]} defaultValue={data.youth_status} />}
        {selectedSector === "Solo Parent" && <FormSelect name="solo_parent_status" label="Solo Parent Status" options={["Widow/Widower", "Separated/Divorced", "Unmarried Parent", "Spouse Detained", "Spouse Overseas"]} defaultValue={data.solo_parent_status} />}
        {selectedSector === "Women" && <FormSelect name="women_status" label="Women Category" options={["Women of Reproductive Age (15-49)", "Pregnant Women", "Lactating Mothers", "Women Heads of Household", "Women Employed", "Women Entrepreneurs", "Women in Leadership Positions"]} defaultValue={data.women_status} />}
        {selectedSector === "TODA Member" && ( <div className="bg-sky-50 p-6 rounded-2xl animate-in fade-in space-y-4"> <FormSelect name="toda_role" label="TODA Role" options={["Tricycle Drivers", "Operators", "Driver-Operator"]} defaultValue={data.toda_role} /> <FormSelect name="toda_safety" label="Attended Road Safety Training?" options={["Yes", "No"]} defaultValue={data.toda_safety} /> <FormSelect name="toda_livelihood" label="Availed Livelihood Program?" options={["Yes", "No"]} defaultValue={data.toda_livelihood} /> </div> )}
        {selectedSector === "Farmer" && <FormSelect name="farmer_status" label="Farmer Status" options={["Land Owner", "Tenant", "Farm Worker"]} defaultValue={data.farmer_status} />}
        {selectedSector === "Fisherfolk" && <FormSelect name="fisherfolk_status" label="Fisherfolk Status" options={["Boat Owner", "Crew", "Fish Vendor", "Gleaner"]} defaultValue={data.fisherfolk_status} />}
      </div>
    </div>
  </div>
);

const LGUFormFields = ({ data = {} }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {data.employee_id && ( <div className="space-y-1.5"><label className="text-sm font-bold text-slate-600 ml-1">Employee ID</label><input disabled value={data.employee_id} className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed" /></div> )}
    <FormInput name="last_name" label="Last Name" defaultValue={data.last_name} />
    <FormInput name="first_name" label="First Name" defaultValue={data.first_name} />
    <FormInput name="middle_name" label="Middle Name" defaultValue={data.middle_name} />
    <FormSelect name="sex" label="Sex" options={["Male", "Female"]} defaultValue={data.sex} />
    <FormInput name="age" label="Age" type="number" defaultValue={data.age} />
    <FormSelect name="civil_status" label="Civil Status" options={["Single", "Married", "Widowed", "Separated"]} defaultValue={data.civil_status} />
    <FormSelect name="department" label="Department" options={["Mayor's Office", "Municipal/City Planning Office", "Engineering Office", "Agriculture Office", "Social Welfare Office", "Health Office", "Treasurer's Office", "Assessor's Office", "Administrative Office"]} defaultValue={data.department} />
    <FormInput name="position_title" label="Position Title" defaultValue={data.position_title} />
    <FormSelect name="employment_status" label="Employment Status" options={["Permanent", "Contractual", "Job Order", "Casual"]} defaultValue={data.employment_status} />
    <FormSelect name="salary_grade" label="Salary Grade" options={["SG 1-10", "SG 11-15", "SG 16-20", "SG 21-24", "SG 25+"]} defaultValue={data.salary_grade} />
    <FormInput name="years_in_service" label="Years in Service" type="number" defaultValue={data.years_in_service} />
    <FormSelect name="is_leadership_position" label="Leadership Position?" options={["No", "Department Heads", "Division Chiefs", "Supervisors"]} defaultValue={data.is_leadership_position} />
  </div>
);

const GFPSFormFields = ({ data = {} }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {data.gfps_id && ( <div className="space-y-1.5"><label className="text-sm font-bold text-slate-600 ml-1">GFPS ID</label><input disabled value={data.gfps_id} className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed" /></div> )}
    <FormInput name="last_name" label="Last Name" defaultValue={data.last_name} />
    <FormInput name="first_name" label="First Name" defaultValue={data.first_name} />
    <FormInput name="middle_name" label="Middle Name" defaultValue={data.middle_name} />
    <FormSelect name="sex" label="Sex" options={["Male", "Female"]} defaultValue={data.sex} />
    <FormInput name="age" label="Age" type="number" defaultValue={data.age} />
    <FormSelect name="department" label="Department" options={["Mayor's Office", "Engineering Office", "Health Office", "Agriculture Office"]} defaultValue={data.department} />
    <FormInput name="position" label="Position" defaultValue={data.position} />
    <FormSelect name="gfps_role" label="GFPS Role" options={["Executive Committee Chairperson", "Executive Committee Co-Chair", "Technical Working Group Head", "TWG Member", "Secretariat"]} defaultValue={data.gfps_role} />
    <FormInput name="contact_number" label="Contact Number" defaultValue={data.contact_number} />
    <FormInput name="email" label="Email" type="email" defaultValue={data.email} />
    <FormInput name="date_designated" label="Date Designated" type="date" defaultValue={data.date_designated} />
  </div>
);

const OFWFormFields = ({ data = {}, statusOptions = [] }) => (
  <div className="space-y-8">
    <div>
      <h4 className="text-sm font-black text-sky-600 uppercase tracking-wider border-b border-sky-100 pb-2 mb-4">I. Personal Information</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormInput name="last_name" label="Last Name" defaultValue={data.last_name} />
        <FormInput name="first_name" label="First Name" defaultValue={data.first_name} />
        <FormInput name="middle_name" label="Middle Name" defaultValue={data.middle_name} />
        <FormSelect name="sex" label="Sex" options={["Male", "Female"]} defaultValue={data.sex} />
        <FormInput name="dob" label="Date of Birth" type="date" defaultValue={data.dob} />
        <FormInput name="age" label="Age" type="number" defaultValue={data.age} />
        <FormSelect name="civil_status" label="Civil Status" options={["Single", "Married", "Widowed", "Separated"]} defaultValue={data.civil_status} />
        <FormInput name="contact_number" label="Contact Number" defaultValue={data.contact_number} />
        <FormInput name="email" label="Email Address" type="email" defaultValue={data.email} />
        <FormSelect name="status" label="Status" options={statusOptions.map(s => s.name)} defaultValue={data.status || 'Active'} />
      </div>
    </div>
    <div>
      <h4 className="text-sm font-black text-sky-600 uppercase tracking-wider border-b border-sky-100 pb-2 mb-4">II. Employment Details</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormInput name="country_employment" label="Country of Employment" defaultValue={data.country_employment} />
        <FormInput name="job_position" label="Job Position" defaultValue={data.job_position} />
        <FormSelect name="employment_type" label="Employment Type" options={["Land-based", "Sea-based"]} defaultValue={data.employment_type} />
        <FormInput name="deployment_date" label="Deployment Date" type="date" defaultValue={data.deployment_date} />
        <FormSelect name="monthly_salary" label="Income Level (Monthly)" options={["below 10k", "11k-20k", "21k-30k", "31k-40k", "41k-50k", "50k-100k", "100k above"]} defaultValue={data.monthly_salary} />
      </div>
    </div>
  </div>
);

const TrainingFormFields = ({ data = {} }) => (
  <div className="space-y-6">
    <FormInput name="training_title" label="Training Title" placeholder="e.g. Gender Sensitivity Training" defaultValue={data.training_title} />
    <FormSelect name="office" label="Conducting Office" options={["Mayor's Office", "Municipal/City Planning Office", "Engineering Office", "Agriculture Office", "Social Welfare Office", "Health Office", "Treasurer's Office", "Assessor's Office", "Administrative Office"]} defaultValue={data.office} />
    <div className="grid grid-cols-2 gap-6">
      <FormInput name="participants_male" label="Total Male Participants" type="number" defaultValue={data.participants_male} />
      <FormInput name="participants_female" label="Total Female Participants" type="number" defaultValue={data.participants_female} />
    </div>
    <FormInput name="date_conducted" label="Date Conducted" type="date" defaultValue={data.date_conducted} />
    <div className="space-y-1.5">
      <label className="text-sm font-bold text-slate-600 ml-1">List of Participant Names</label>
      <p className="text-xs text-slate-400 ml-1 mb-2">Type or paste the names of the attendees here (separated by commas or new lines).</p>
      <textarea autoComplete="off" name="participant_names" rows="5" placeholder="Juan Dela Cruz, Maria Santos..." defaultValue={data.participant_names} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-700 font-medium transition-all resize-y" />
    </div>
  </div>
);

const DashboardTable = ({ title, columns, data, totals }) => ( <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col h-full hover:shadow-md transition-shadow"><h3 className="text-lg font-bold text-slate-800 border-b-2 border-sky-100 pb-3 mb-4">{title}</h3><div className="overflow-x-auto flex-1"><table className="w-full text-left border-collapse text-sm"><thead><tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-xs">{columns.map((col, i) => ( <th key={i} className={`p-3 font-bold border-b border-slate-100 ${i > 0 && col !== 'Office/Dept' && col !== 'Date Conducted' ? 'text-center' : ''}`}>{col}</th> ))}</tr></thead><tbody>{data.map((row, i) => ( <tr key={i} className="border-b border-slate-50 hover:bg-sky-50/50 transition-colors">{row.map((cell, j) => ( <td key={j} className={`p-3 text-slate-600 ${j === 0 ? 'font-bold text-slate-700' : 'font-medium'} ${j > 0 && typeof cell === 'number' ? 'text-center' : ''}`}>{cell}</td> ))}</tr> ))} {data.length === 0 && <tr><td colSpan={columns.length} className="p-4 text-center text-slate-400 italic">No data available.</td></tr>}</tbody>{totals && ( <tfoot><tr className="bg-sky-50/50 text-sky-800 font-black border-t-2 border-sky-200">{totals.map((total, i) => ( <td key={i} className={`p-3 ${i > 0 ? 'text-center text-lg' : ''}`}>{total}</td> ))}</tr></tfoot> )}</table></div></div> );