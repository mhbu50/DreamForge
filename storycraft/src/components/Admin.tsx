import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, getDocs, deleteDoc, doc, orderBy, setDoc, getDoc } from 'firebase/firestore';
import { UserProfile, Story, Theme } from '../types';
import { motion } from 'motion/react';
import { Users, BookOpen, Trash2, ShieldAlert, Loader2, Search, Sparkles, Settings, Palette } from 'lucide-react';
import { toast } from 'sonner';
import DesignInspiration from './DesignInspiration';
import ThemeMarketplace from './ThemeMarketplace';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';

export default function Admin() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'stories' | 'inspiration' | 'settings' | 'themes' | 'health'>('users');
  const [themeView, setThemeView] = useState<'list' | 'marketplace'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [healthIssues, setHealthIssues] = useState<any[]>([]);
  const [checkingHealth, setCheckingHealth] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const usersSnap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
        const storiesSnap = await getDocs(query(collection(db, 'stories'), orderBy('createdAt', 'desc')));
        const themesSnap = await getDocs(query(collection(db, 'themes'), orderBy('createdAt', 'desc')));
        
        const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
        if (settingsDoc.exists()) {
          setGlobalSettings(settingsDoc.data());
        } else {
          setGlobalSettings({
            termsAndConditions: 'Default Terms and Conditions...',
            maintenanceMode: false,
            uiSettings: {
              primaryColor: '#D4AF37',
              fontFamily: 'serif',
              showParticles: true,
              showGrain: true,
              showVignette: true
            }
          });
        }

        setUsers(usersSnap.docs.map(d => d.data() as UserProfile));
        setStories(storiesSnap.docs.map(d => d.data() as Story));
        setThemes(themesSnap.docs.map(d => ({ ...d.data(), id: d.id } as Theme)));
      } catch (error: any) {
        console.error(error);
        toast.error('Failed to fetch admin data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      await setDoc(doc(db, 'settings', 'global'), {
        ...globalSettings,
        updatedAt: Date.now()
      });
      toast.success('Global settings updated successfully');
    } catch (error: any) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/global');
      toast.error('Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteDoc(doc(db, 'users', uid));
      setUsers(prev => prev.filter(u => u.uid !== uid));
      toast.success('User deleted');
    } catch (error: any) {
      toast.error('Failed to delete user');
    }
  };

  const handleDeleteStory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this story?')) return;
    try {
      await deleteDoc(doc(db, 'stories', id));
      setStories(prev => prev.filter(s => s.id !== id));
      toast.success('Story deleted');
    } catch (error: any) {
      toast.error('Failed to delete story');
    }
  };

  const handleDeleteTheme = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this theme?')) return;
    try {
      await deleteDoc(doc(db, 'themes', id));
      setThemes(prev => prev.filter(t => t.id !== id));
      toast.success('Theme deleted');
    } catch (error: any) {
      toast.error('Failed to delete theme');
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStories = stories.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.userId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredThemes = themes.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.authorName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <Loader2 className="animate-spin text-olive" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-12">
          <div className="p-4 bg-red-500 text-white rounded-2xl">
            <ShieldAlert size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-serif">Admin Command Center</h1>
            <p className="text-ink/40 small-caps text-[10px]">Restricted Access Only</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-3xl book-shadow border border-ink/5">
            <div className="flex items-center justify-between mb-4">
              <Users className="text-olive" />
              <span className="text-xs font-bold text-ink/20 uppercase tracking-widest">Total Users</span>
            </div>
            <div className="text-4xl font-serif">{users.length}</div>
          </div>
          <div className="bg-white p-6 rounded-3xl book-shadow border border-ink/5">
            <div className="flex items-center justify-between mb-4">
              <BookOpen className="text-olive" />
              <span className="text-xs font-bold text-ink/20 uppercase tracking-widest">Stories Forged</span>
            </div>
            <div className="text-4xl font-serif">{stories.length}</div>
          </div>
          <div className="bg-white p-6 rounded-3xl book-shadow border border-ink/5">
            <div className="flex items-center justify-between mb-4">
              <ShieldAlert className="text-red-500" />
              <span className="text-xs font-bold text-ink/20 uppercase tracking-widest">Admin Role</span>
            </div>
            <div className="text-4xl font-serif">Active</div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] book-shadow border border-ink/5 overflow-hidden">
          <div className="p-8 border-b border-ink/5 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex bg-paper p-1 rounded-2xl">
              <button 
                onClick={() => setActiveTab('users')}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-white text-olive shadow-sm' : 'text-ink/40 hover:text-ink/60'}`}
              >
                Users
              </button>
              <button 
                onClick={() => setActiveTab('stories')}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'stories' ? 'bg-white text-olive shadow-sm' : 'text-ink/40 hover:text-ink/60'}`}
              >
                Stories
              </button>
              <button 
                onClick={() => setActiveTab('inspiration')}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'inspiration' ? 'bg-white text-olive shadow-sm' : 'text-ink/40 hover:text-ink/60'}`}
              >
                Inspiration
              </button>
              <button 
                onClick={() => setActiveTab('themes')}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'themes' ? 'bg-white text-olive shadow-sm' : 'text-ink/40 hover:text-ink/60'}`}
              >
                Themes
              </button>
              <button 
                onClick={() => setActiveTab('health')}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'health' ? 'bg-white text-olive shadow-sm' : 'text-ink/40 hover:text-ink/60'}`}
              >
                System Health
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-white text-olive shadow-sm' : 'text-ink/40 hover:text-ink/60'}`}
              >
                Global Settings
              </button>
            </div>

            {activeTab !== 'inspiration' && activeTab !== 'settings' && (
              <div className="relative w-full md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/20" size={18} />
                <input 
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-paper rounded-xl outline-none focus:ring-2 focus:ring-olive/10 transition-all text-sm"
                />
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            {activeTab === 'inspiration' ? (
              <DesignInspiration />
            ) : activeTab === 'health' ? (
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-serif">System Health Monitor</h3>
                    <p className="text-ink/40 text-xs uppercase tracking-widest">Real-time status of critical components</p>
                  </div>
                  <button 
                    onClick={async () => {
                      const { SystemHealthService } = await import('../services/SystemHealthService');
                      setCheckingHealth(true);
                      const issues = await SystemHealthService.getInstance().runFullCheck();
                      setHealthIssues(issues);
                      setCheckingHealth(false);
                      toast.success(issues.length === 0 ? "System is healthy!" : `Detected ${issues.length} issues.`);
                    }}
                    disabled={checkingHealth}
                    className="px-8 py-3 bg-olive text-white rounded-xl font-bold hover:bg-olive/90 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {checkingHealth ? <Loader2 className="animate-spin" size={18} /> : <ShieldAlert size={18} />}
                    <span>{checkingHealth ? 'Scanning...' : 'Run Diagnostics'}</span>
                  </button>
                </div>

                {healthIssues.length === 0 ? (
                  <div className="bg-green-50 p-12 rounded-[2rem] text-center border border-green-100">
                    <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-6">
                      <ShieldAlert size={32} />
                    </div>
                    <h4 className="text-2xl font-serif text-green-800 mb-2">All Systems Operational</h4>
                    <p className="text-green-600/60">No critical problems detected in the current scan.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {healthIssues.map(issue => (
                      <div key={issue.id} className={`p-6 rounded-2xl border flex items-center justify-between ${
                        issue.type === 'critical' ? 'bg-red-50 border-red-100' : 
                        issue.type === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'
                      }`}>
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${
                            issue.type === 'critical' ? 'bg-red-500 text-white' : 
                            issue.type === 'warning' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'
                          }`}>
                            <ShieldAlert size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">{issue.component}</span>
                              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                                issue.type === 'critical' ? 'bg-red-200 text-red-700' : 
                                issue.type === 'warning' ? 'bg-amber-200 text-amber-700' : 'bg-blue-200 text-blue-700'
                              }`}>{issue.type}</span>
                            </div>
                            <p className="font-bold text-ink">{issue.message}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-ink/40 uppercase tracking-widest">{new Date(issue.timestamp).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === 'themes' ? (
              <div className="flex flex-col">
                <div className="p-8 border-b border-ink/5 flex items-center justify-between bg-paper/30">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setThemeView('list')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${themeView === 'list' ? 'bg-olive text-white shadow-lg' : 'text-ink/40 hover:text-ink/60'}`}
                    >
                      Theme Management
                    </button>
                    <button 
                      onClick={() => setThemeView('marketplace')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${themeView === 'marketplace' ? 'bg-gold text-night shadow-lg' : 'text-ink/40 hover:text-ink/60'}`}
                    >
                      Marketplace View
                    </button>
                  </div>
                  <p className="text-[10px] text-ink/40 uppercase tracking-[0.2em]">
                    {themeView === 'list' ? 'Manage all user-created themes' : 'Browse and test themes as a user'}
                  </p>
                </div>

                {themeView === 'marketplace' ? (
                  <div className="p-8 bg-paper/10 min-h-[600px]">
                    <ThemeMarketplace />
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead className="bg-paper/50">
                      <tr>
                        <th className="px-8 py-4 small-caps text-[10px]">Theme Name</th>
                        <th className="px-8 py-4 small-caps text-[10px]">Author</th>
                        <th className="px-8 py-4 small-caps text-[10px]">Public</th>
                        <th className="px-8 py-4 small-caps text-[10px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/5">
                      {filteredThemes.map(theme => (
                        <tr key={theme.id} className="hover:bg-paper/20 transition-colors">
                          <td className="px-8 py-6">
                            <div className="font-bold font-serif text-lg">{theme.name}</div>
                            <div className="text-xs text-ink/40 italic">{theme.description}</div>
                          </td>
                          <td className="px-8 py-6 text-sm">
                            {theme.authorName}
                          </td>
                          <td className="px-8 py-6">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${theme.isPublic ? 'bg-green-100 text-green-600' : 'bg-ink/10 text-ink/40'}`}>
                              {theme.isPublic ? 'Public' : 'Private'}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <button 
                              onClick={() => handleDeleteTheme(theme.id)}
                              className="p-2 text-ink/20 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : activeTab === 'settings' ? (
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-serif">Global Configuration</h3>
                    <p className="text-ink/40 text-xs uppercase tracking-widest">Manage application-wide settings and terms</p>
                  </div>
                  <button 
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="px-8 py-3 bg-olive text-white rounded-xl font-bold hover:bg-olive/90 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {savingSettings ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                    <span>Save Changes</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="small-caps text-[10px] text-ink/40">Terms and Conditions (Markdown Supported)</label>
                    <textarea 
                      value={globalSettings?.termsAndConditions || ''}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, termsAndConditions: e.target.value })}
                      className="w-full h-96 bg-paper rounded-2xl p-6 outline-none focus:ring-2 focus:ring-olive/10 transition-all text-sm font-mono leading-relaxed resize-none"
                      placeholder="Enter terms and conditions here..."
                    />
                  </div>

                  <div className="space-y-8">
                    <div className="bg-paper p-6 rounded-2xl space-y-6">
                      <h4 className="small-caps text-[10px] text-ink/40">System Status</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">Maintenance Mode</span>
                        <button 
                          onClick={() => setGlobalSettings({ ...globalSettings, maintenanceMode: !globalSettings.maintenanceMode })}
                          className={`w-12 h-6 rounded-full transition-all relative ${globalSettings?.maintenanceMode ? 'bg-red-500' : 'bg-green-500'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${globalSettings?.maintenanceMode ? 'left-7' : 'left-1'}`} />
                        </button>
                      </div>
                    </div>

                    <div className="bg-paper p-6 rounded-2xl space-y-6">
                      <h4 className="small-caps text-[10px] text-ink/40">UI Customization</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold">Primary Brand Color</span>
                          <input 
                            type="color"
                            value={globalSettings?.uiSettings?.primaryColor || '#D4AF37'}
                            onChange={(e) => setGlobalSettings({ 
                              ...globalSettings, 
                              uiSettings: { ...globalSettings.uiSettings, primaryColor: e.target.value } 
                            })}
                            className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold">Default Font Family</span>
                          <select 
                            value={globalSettings?.uiSettings?.fontFamily || 'serif'}
                            onChange={(e) => setGlobalSettings({ 
                              ...globalSettings, 
                              uiSettings: { ...globalSettings.uiSettings, fontFamily: e.target.value } 
                            })}
                            className="bg-white border border-ink/5 rounded-lg px-3 py-1 text-sm outline-none focus:border-olive/50"
                          >
                            <option value="serif">Serif (Classic)</option>
                            <option value="sans">Sans (Modern)</option>
                            <option value="mono">Mono (Technical)</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { id: 'showParticles', label: 'Particles' },
                            { id: 'showGrain', label: 'Film Grain' },
                            { id: 'showVignette', label: 'Vignette' }
                          ].map(opt => (
                            <label key={opt.id} className="flex items-center gap-3 cursor-pointer">
                              <input 
                                type="checkbox"
                                checked={globalSettings?.uiSettings?.[opt.id] || false}
                                onChange={(e) => setGlobalSettings({ 
                                  ...globalSettings, 
                                  uiSettings: { ...globalSettings.uiSettings, [opt.id]: e.target.checked } 
                                })}
                                className="w-4 h-4 rounded border-ink/10 text-olive focus:ring-olive/20"
                              />
                              <span className="text-xs font-bold text-ink/60 uppercase tracking-widest">{opt.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-paper/50">
                  <tr>
                    {activeTab === 'users' ? (
                      <>
                        <th className="px-8 py-4 small-caps text-[10px]">User</th>
                        <th className="px-8 py-4 small-caps text-[10px]">Role</th>
                        <th className="px-8 py-4 small-caps text-[10px]">Joined</th>
                        <th className="px-8 py-4 small-caps text-[10px]">Actions</th>
                      </>
                    ) : (
                      <>
                        <th className="px-8 py-4 small-caps text-[10px]">Story Title</th>
                        <th className="px-8 py-4 small-caps text-[10px]">Author ID</th>
                        <th className="px-8 py-4 small-caps text-[10px]">Pages</th>
                        <th className="px-8 py-4 small-caps text-[10px]">Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5">
                  {activeTab === 'users' ? (
                    filteredUsers.map(user => (
                      <tr key={user.uid} className="hover:bg-paper/20 transition-colors">
                        <td className="px-8 py-6">
                          <div className="font-bold">{user.displayName}</div>
                          <div className="text-xs text-ink/40">{user.email}</div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${user.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-olive/10 text-olive'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-sm text-ink/60">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-8 py-6">
                          <button 
                            onClick={() => handleDeleteUser(user.uid)}
                            className="p-2 text-ink/20 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    filteredStories.map(story => (
                      <tr key={story.id} className="hover:bg-paper/20 transition-colors">
                        <td className="px-8 py-6">
                          <div className="font-bold font-serif text-lg">{story.title}</div>
                          <div className="text-xs text-ink/40 italic">{story.style}</div>
                        </td>
                        <td className="px-8 py-6 text-xs font-mono text-ink/40">
                          {story.userId}
                        </td>
                        <td className="px-8 py-6 text-sm">
                          {story.pages.length}
                        </td>
                        <td className="px-8 py-6">
                          <button 
                            onClick={() => handleDeleteStory(story.id)}
                            className="p-2 text-ink/20 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
