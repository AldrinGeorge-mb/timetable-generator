import { useState, useEffect, useCallback, useRef } from 'react';
import LandingPage from './components/LandingPage';
import TimetableGrid from './components/TimetableGrid';
import TeachersTab from './components/TeachersTab';
import SubjectsTab from './components/SubjectsTab';
import ClassesTab from './components/ClassesTab';
import Toast from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import Navbar from './components/Navbar';

const API = import.meta.env.VITE_API_URL || '';

const authFetch = (url, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = { ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return fetch(url, { ...options, headers });
};

export default function App() {
  const [currentProject, setCurrentProject] = useState(null);
  const [activeTab, setActiveTab] = useState('grid');
  const [adminTab, setAdminTab] = useState('teachers');

  // Global Admin State
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [pendingConfirm, setPendingConfirm] = useState(null);
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveTimetableRef = useRef(null);

  const showToast = useCallback((message, type = 'info') => setToast({ message, type }), []);
  const requestConfirm = useCallback((title, message, action, confirmText = 'Delete', confirmColor = 'bg-red-600 hover:bg-red-700 text-white') => {
      setPendingConfirm({ title, message, action, confirmText, confirmColor });
  }, []);

  const fetchAll = useCallback(async () => {
      if (!currentProject?._id) return;
      try {
          const [t, s, c] = await Promise.all([
              authFetch(`${API}/api/teachers?projectId=${currentProject._id}`).then(r => r.json()),
              authFetch(`${API}/api/subjects?projectId=${currentProject._id}`).then(r => r.json()),
              authFetch(`${API}/api/classes?projectId=${currentProject._id}`).then(r => r.json())
          ]);
          setTeachers(Array.isArray(t) ? t : []);
          setSubjects(Array.isArray(s) ? s : []);
          
          const clsArray = Array.isArray(c) ? c : [];
          clsArray.sort((a, b) => {
              const matchA = a.match(/^(\d+)(.*)$/);
              const matchB = b.match(/^(\d+)(.*)$/);
              if (!matchA || !matchB) return b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' });
              const numA = parseInt(matchA[1], 10);
              const numB = parseInt(matchB[1], 10);
              if (numA !== numB) return numB - numA;
              return matchA[2].localeCompare(matchB[2]);
          });
          setClasses(clsArray);
      } catch {
          showToast('Failed to load data', 'error');
      }
  }, [currentProject?._id, showToast]);

  const [refreshKey, setRefreshKey] = useState(0);

  const handleRegenerate = useCallback(() => {
        requestConfirm(
            "Regenerate Master Schedule",
            "WARNING: This will wipe all manual modifications across all classes and generate a fresh schedule. Continue?",
            async () => {
                try {
                    const resp = await authFetch(`${API}/api/schedule/regenerate`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ projectId: currentProject._id })
                    });
                    if (!resp.ok) throw new Error('Failed to regenerate');
                    showToast('AI successfully regenerated a fresh master schedule!', 'success');
                    setRefreshKey(k => k + 1);
                    setActiveTab('grid');
                } catch {
                    showToast('Failed to regenerate timetable.', 'error');
                }
            },
            "Regenerate",
            "bg-red-600 hover:bg-red-700 text-white"
        );
  }, [currentProject?._id, requestConfirm, showToast]);

  const handleTabSwitch = useCallback((newActiveTab, newAdminTab = null) => {
      if (hasUnsavedChanges && activeTab === 'grid' && newActiveTab !== 'grid') {
          requestConfirm(
              "Unsaved Changes",
              "You have unsaved changes in your timetable. Save them before switching tabs?",
              async () => {
                  if (saveTimetableRef.current) await saveTimetableRef.current();
                  setActiveTab(newActiveTab);
                  if (newAdminTab) setAdminTab(newAdminTab);
              },
              "Save & Switch",
              "bg-primary hover:opacity-90 text-white"
          );
      } else {
          setActiveTab(newActiveTab);
          if (newAdminTab) setAdminTab(newAdminTab);
      }
  }, [hasUnsavedChanges, activeTab, requestConfirm]);

  const handleProjectExit = useCallback(() => {
      if (hasUnsavedChanges && activeTab === 'grid') {
          requestConfirm(
              "Unsaved Changes",
              "You have unsaved changes in your timetable. Save them before exiting?",
              async () => {
                  if (saveTimetableRef.current) await saveTimetableRef.current();
                  setCurrentProject(null);
              },
              "Save & Exit",
              "bg-primary hover:opacity-90 text-white"
          );
      } else {
          setCurrentProject(null);
      }
  }, [hasUnsavedChanges, activeTab, requestConfirm]);

  useEffect(() => {
      if (activeTab === 'admin' || activeTab === 'grid') {
          fetchAll();
      }
  }, [activeTab, fetchAll]);

  // Show landing page if no project is selected
  if (!currentProject) {
    return <LandingPage onSelectProject={(project) => { setCurrentProject(project); setActiveTab('grid'); }} />;
  }

  return (
    <>
    <div className="min-h-screen flex flex-col bg-background font-body text-body-md selection:bg-primary/10 selection:text-primary relative overflow-hidden">
      
      {/* ── TOP NAVBAR ── */}
      <Navbar 
          handleProjectExit={handleProjectExit}
          activeTab={activeTab}
          handleTabSwitch={handleTabSwitch}
          adminTab={adminTab}
          handleRegenerate={handleRegenerate}
      />

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-auto p-8 flex flex-col relative z-0">
          <div className={activeTab === 'grid' ? 'flex-1 flex flex-col' : 'hidden'}>
              <TimetableGrid 
                  key={refreshKey} 
                  projectId={currentProject._id} 
                  project={currentProject}
                  setHasUnsavedChanges={setHasUnsavedChanges}
                  saveTimetableRef={saveTimetableRef}
              />
          </div>
          {activeTab === 'admin' && adminTab === 'teachers' && (
              <TeachersTab 
                  projectId={currentProject._id}
                  teachers={teachers} setTeachers={setTeachers}
                  subjects={subjects} classes={classes}
                  showToast={showToast} requestConfirm={requestConfirm}
                  setAdminTab={setAdminTab}
              />
          )}
          {activeTab === 'admin' && adminTab === 'subjects' && (
              <SubjectsTab 
                  projectId={currentProject._id}
                  subjects={subjects} setSubjects={setSubjects}
                  classes={classes}
                  showToast={showToast} requestConfirm={requestConfirm}
                  setAdminTab={setAdminTab}
              />
          )}
          {activeTab === 'admin' && adminTab === 'classes' && (
              <ClassesTab 
                  projectId={currentProject._id}
                  project={currentProject}
                  classes={classes} setClasses={setClasses}
                  subjects={subjects} teachers={teachers}
                  showToast={showToast} requestConfirm={requestConfirm}
              />
          )}
      </main>
    </div>

    {toast.message && (
        <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast({ message: '', type: 'info' })} 
        />
    )}
    
    {pendingConfirm && (
        <ConfirmModal
            isOpen={!!pendingConfirm}
            title={pendingConfirm.title}
            message={pendingConfirm.message}
            confirmText={pendingConfirm.confirmText}
            confirmColor={pendingConfirm.confirmColor}
            onConfirm={() => {
                pendingConfirm.action();
                setPendingConfirm(null);
            }}
            onCancel={() => setPendingConfirm(null)}
        />
    )}
    </>
  );
}
