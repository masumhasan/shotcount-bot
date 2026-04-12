import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Inbox, 
  Layers, 
  Navigation, 
  FileText, 
  BarChart3, 
  Settings, 
  Plus, 
  Search, 
  Filter, 
  ChevronRight, 
  Send, 
  Upload, 
  Calendar,
  CheckCircle2,
  Clock,
  User,
  Tag,
  ArrowUpRight,
  MoreHorizontal,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { cn } from './lib/utils';
import { Lead, Message, LeadType, ProjectType, ServiceType, Timeline, Budget } from './types';
import { ChatInterface } from './components/ChatInterface';

// Mock Data
const PERFORMANCE_DATA = [
  { name: 'Mon', usage: 400, revenue: 2400, acquisition: 240 },
  { name: 'Tue', usage: 300, revenue: 1398, acquisition: 221 },
  { name: 'Wed', usage: 200, revenue: 9800, acquisition: 229 },
  { name: 'Thu', usage: 278, revenue: 3908, acquisition: 200 },
  { name: 'Fri', usage: 189, revenue: 4800, acquisition: 218 },
  { name: 'Sat', usage: 239, revenue: 3800, acquisition: 250 },
  { name: 'Sun', usage: 349, revenue: 4300, acquisition: 210 },
];

const INITIAL_LEADS: Lead[] = [
  {
    id: '1',
    type: 'Designer',
    projectType: 'Entire residence',
    serviceType: 'Installation',
    timeline: '1-3 months',
    budget: '$3000+',
    timestamp: '2 hours ago',
    tags: ['High Intent', 'Designer Lead', 'Premium Client'],
    status: 'New'
  },
  {
    id: '2',
    type: 'Homeowner',
    projectType: 'Single room',
    serviceType: 'Removal & Prep',
    timeline: 'Within 1 month',
    budget: '$1000-$3000',
    timestamp: '5 hours ago',
    tags: ['Premium Client'],
    status: 'Contacted'
  }
];

// Components
const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
      active ? "bg-stone-900 text-white shadow-lg" : "text-stone-500 hover:bg-stone-100 hover:text-stone-900"
    )}
  >
    <Icon className={cn("w-5 h-5", active ? "text-white" : "text-stone-400 group-hover:text-stone-900")} />
    <span className="font-medium">{label}</span>
  </button>
);

const StatCard = ({ label, value, change, trend }: { label: string, value: string, change: string, trend: 'up' | 'down' }) => (
  <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
    <p className="text-stone-500 text-sm font-medium mb-1">{label}</p>
    <div className="flex items-end gap-3">
      <h3 className="text-2xl font-bold text-stone-900">{value}</h3>
      <span className={cn(
        "text-xs font-bold px-2 py-1 rounded-full mb-1",
        trend === 'up' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
      )}>
        {change}
      </span>
    </div>
  </div>
);

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/chat" element={<PublicChatPage />} />
        <Route path="/*" element={<AdminLayout />} />
      </Routes>
    </Router>
  );
}

function PublicChatPage() {
  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-0 md:p-4">
      <ChatInterface isFullScreen />
    </div>
  );
}

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem('shotcount_leads');
    return saved ? JSON.parse(saved) : INITIAL_LEADS;
  });
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [adminReplyValue, setAdminReplyValue] = useState('');
  const modalChatEndRef = useRef<HTMLDivElement>(null);

  // Sync leads from localStorage periodically or on focus
  useEffect(() => {
    const syncLeads = () => {
      const saved = localStorage.getItem('shotcount_leads');
      if (saved) {
        setLeads(JSON.parse(saved));
      }
    };
    window.addEventListener('focus', syncLeads);
    return () => window.removeEventListener('focus', syncLeads);
  }, []);

  const scrollModalToBottom = () => {
    modalChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (selectedLead) {
      scrollModalToBottom();
    }
  }, [selectedLead?.messages]);

  const handleAdminReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReplyValue.trim() || !selectedLead) return;

    const adminMsg: Message = {
      id: Date.now().toString(),
      text: adminReplyValue,
      sender: 'admin'
    };

    const updatedMessages = [...(selectedLead.messages || []), adminMsg];
    
    // Update the selected lead
    const updatedLead = {
      ...selectedLead,
      messages: updatedMessages,
      status: 'Contacted' as const
    };
    setSelectedLead(updatedLead);

    // Update the leads list
    const updatedLeads = leads.map(lead => 
      lead.id === selectedLead.id ? updatedLead : lead
    );
    setLeads(updatedLeads);
    localStorage.setItem('shotcount_leads', JSON.stringify(updatedLeads));

    setAdminReplyValue('');
  };

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Performance Overview</h1>
          <p className="text-stone-500">Track your acquisition and revenue growth.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-50">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800">
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Revenue" value="$42,800" change="+12.5%" trend="up" />
        <StatCard label="New Leads" value="128" change="+8.2%" trend="up" />
        <StatCard label="Activation Rate" value="64.2%" change="-2.4%" trend="down" />
        <StatCard label="Retention" value="92.0%" change="+4.1%" trend="up" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-stone-900">Revenue & Usage Growth</h3>
            <select className="text-sm border-none bg-stone-50 rounded-lg px-2 py-1 outline-none">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PERFORMANCE_DATA}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1c1917" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#1c1917" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#78716c', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#78716c', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#1c1917" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="usage" stroke="#78716c" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
          <h3 className="font-bold text-stone-900 mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {leads.slice(0, 4).map((lead) => (
              <div key={lead.id} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-stone-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-stone-900 truncate">
                    {lead.type} Lead • {lead.projectType}
                  </p>
                  <p className="text-xs text-stone-500">{lead.timestamp}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-stone-900">{lead.budget}</p>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">{lead.status}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-3 text-sm font-bold text-stone-600 hover:text-stone-900 transition-colors">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );

  const renderInbox = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-stone-900">Lead Inbox</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input 
              type="text" 
              placeholder="Search leads..." 
              className="pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-100">
              <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Lead Details</th>
              <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Project Info</th>
              <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Investment</th>
              <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Tags</th>
              <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {leads.map((lead) => (
              <tr 
                key={lead.id} 
                onClick={() => setSelectedLead(lead)}
                className="hover:bg-stone-50/50 transition-colors group cursor-pointer"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-stone-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-900">{lead.type}</p>
                      <p className="text-xs text-stone-500">{lead.timestamp}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-stone-900 font-medium">{lead.projectType || 'N/A'}</p>
                  <p className="text-xs text-stone-500">{lead.serviceType || 'N/A'}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-stone-900">{lead.budget || 'N/A'}</p>
                  <p className="text-xs text-stone-500">{lead.timeline || 'N/A'}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {lead.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-bold">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "text-[10px] px-2 py-1 rounded-lg font-bold uppercase tracking-wider",
                    lead.status === 'New' ? "bg-blue-50 text-blue-600" : 
                    lead.status === 'Booked' ? "bg-emerald-50 text-emerald-600" : 
                    lead.status === 'In Progress' ? "bg-amber-50 text-amber-600" : "bg-stone-100 text-stone-600"
                  )}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-stone-400 hover:text-stone-900 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCampaigns = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Campaigns & Series</h1>
          <p className="text-stone-500">Automate your onboarding and follow-up sequences.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800">
          <Plus className="w-4 h-4" />
          Create Series
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-stone-100 rounded-xl">
              <MessageSquare className="w-6 h-6 text-stone-900" />
            </div>
            <span className="text-xs font-bold px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full">Active</span>
          </div>
          <h3 className="text-lg font-bold text-stone-900 mb-2">High-End Lead Follow-up</h3>
          <p className="text-sm text-stone-500 mb-6">Automated SMS/Email sequence for leads with $7K+ budget.</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-stone-600">
              <Clock className="w-4 h-4" />
              <span>Step 1: SMS (5 min later)</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-stone-600">
              <Clock className="w-4 h-4" />
              <span>Step 2: Email (24 hrs later)</span>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-stone-50 flex justify-between items-center">
            <div className="flex -space-x-2">
              {[1,2,3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-stone-200" />
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-white bg-stone-100 flex items-center justify-center text-[10px] font-bold text-stone-500">+12</div>
            </div>
            <button className="text-sm font-bold text-stone-900 flex items-center gap-1">
              Edit Series <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-stone-100 rounded-xl">
              <Navigation className="w-6 h-6 text-stone-900" />
            </div>
            <span className="text-xs font-bold px-2 py-1 bg-stone-50 text-stone-500 rounded-full">Draft</span>
          </div>
          <h3 className="text-lg font-bold text-stone-900 mb-2">New Designer Onboarding</h3>
          <p className="text-sm text-stone-500 mb-6">Product tour and resource guide for professional partners.</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-stone-600">
              <CheckCircle2 className="w-4 h-4" />
              <span>Step 1: Welcome Tour</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-stone-600">
              <CheckCircle2 className="w-4 h-4" />
              <span>Step 2: Resource Pack</span>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-stone-50 flex justify-between items-center">
            <div className="text-sm text-stone-400 italic">No active participants</div>
            <button className="text-sm font-bold text-stone-900 flex items-center gap-1">
              Resume Setup <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 flex font-sans selection:bg-stone-900 selection:text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-stone-200 flex flex-col p-6 fixed h-full">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center">
            <Layers className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-stone-900">Shotcount</span>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem icon={BarChart3} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={Inbox} label="Inbox" active={activeTab === 'inbox'} onClick={() => setActiveTab('inbox')} />
          <SidebarItem icon={Layers} label="Campaigns" active={activeTab === 'campaigns'} onClick={() => setActiveTab('campaigns')} />
          <SidebarItem icon={Navigation} label="Product Tours" active={activeTab === 'tours'} onClick={() => setActiveTab('tours')} />
          <SidebarItem icon={FileText} label="Articles" active={activeTab === 'articles'} onClick={() => setActiveTab('articles')} />
          <SidebarItem icon={MessageSquare} label="Public Chat" active={activeTab === 'chat'} onClick={() => navigate('/chat')} />
        </nav>

        <div className="pt-6 border-t border-stone-100">
          <SidebarItem icon={Settings} label="Settings" onClick={() => {}} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-10">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'inbox' && renderInbox()}
        {activeTab === 'campaigns' && renderCampaigns()}
        {activeTab === 'tours' && (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
            <Navigation className="w-16 h-16 text-stone-200" />
            <h2 className="text-2xl font-bold text-stone-900">Product Tours</h2>
            <p className="text-stone-500 max-w-md">Guide your users through your website features with interactive step-by-step tours.</p>
            <button className="px-6 py-3 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition-all">Create First Tour</button>
          </div>
        )}
        {activeTab === 'articles' && (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
            <FileText className="w-16 h-16 text-stone-200" />
            <h2 className="text-2xl font-bold text-stone-900">Article Writing</h2>
            <p className="text-stone-500 max-w-md">Use AI to write and structure high-quality help articles and blog posts.</p>
            <button className="px-6 py-3 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition-all">Write New Article</button>
          </div>
        )}
      </main>

      {/* Floating Chat Widget */}
      <div className="fixed bottom-8 right-8 z-50">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="mb-6"
            >
              <ChatInterface 
                onClose={() => setIsChatOpen(false)} 
                onLeadUpdate={(lead) => {
                  setLeads(prev => {
                    const index = prev.findIndex(l => l.id === lead.id);
                    let newLeads;
                    if (index > -1) {
                      newLeads = [...prev];
                      newLeads[index] = lead;
                    } else {
                      newLeads = [lead, ...prev];
                    }
                    localStorage.setItem('shotcount_leads', JSON.stringify(newLeads));
                    return newLeads;
                  });
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95",
            isChatOpen ? "bg-white text-stone-900 rotate-90" : "bg-stone-900 text-white"
          )}
        >
          {isChatOpen ? <X className="w-8 h-8" /> : <MessageSquare className="w-8 h-8" />}
        </button>
      </div>

      {/* Conversation Modal */}
      <AnimatePresence>
        {selectedLead && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLead(null)}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center">
                    <User className="w-6 h-6 text-stone-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-stone-900">{selectedLead.type} Lead</h3>
                    <p className="text-sm text-stone-500">{selectedLead.timestamp} • {selectedLead.status}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedLead(null)}
                  className="p-2 hover:bg-stone-200 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-stone-500" />
                </button>
              </div>

              <div className="p-6 bg-stone-50 border-b border-stone-100 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Project</p>
                  <p className="text-sm font-bold text-stone-900">{selectedLead.projectType || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Service</p>
                  <p className="text-sm font-bold text-stone-900">{selectedLead.serviceType || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Budget</p>
                  <p className="text-sm font-bold text-stone-900">{selectedLead.budget || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Timeline</p>
                  <p className="text-sm font-bold text-stone-900">{selectedLead.timeline || 'N/A'}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {selectedLead.messages && selectedLead.messages.length > 0 ? (
                  selectedLead.messages.map((msg) => (
                    <div key={msg.id} className={cn(
                      "flex flex-col max-w-[80%]",
                      msg.sender === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                    )}>
                      <div className={cn(
                        "p-4 rounded-2xl text-sm leading-relaxed shadow-sm prose prose-sm prose-stone max-w-none",
                        msg.sender === 'user' 
                          ? "bg-stone-900 text-white rounded-tr-none prose-invert" 
                          : msg.sender === 'admin'
                            ? "bg-stone-100 border border-stone-200 text-stone-800 rounded-tl-none"
                            : "bg-white border border-stone-100 text-stone-800 rounded-tl-none"
                      )}>
                        {msg.sender === 'admin' && (
                          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1 not-prose">Admin Reply</p>
                        )}
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-stone-400">
                    <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                    <p>No messages yet</p>
                  </div>
                )}
                <div ref={modalChatEndRef} />
              </div>

              <div className="p-6 border-t border-stone-100 bg-stone-50">
                <form onSubmit={handleAdminReply} className="flex gap-3">
                  <input 
                    type="text" 
                    value={adminReplyValue}
                    onChange={(e) => setAdminReplyValue(e.target.value)}
                    placeholder="Type your reply..." 
                    className="flex-1 bg-white border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                  />
                  <button 
                    type="submit"
                    disabled={!adminReplyValue.trim()}
                    className="px-6 py-2 bg-stone-900 text-white rounded-xl text-sm font-bold hover:bg-stone-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Reply
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
