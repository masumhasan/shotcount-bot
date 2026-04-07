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
import { cn } from './lib/utils';
import { Lead, Message, LeadType, ProjectType, ServiceType, Timeline, Budget } from './types';

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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [userLeadData, setUserLeadData] = useState<Partial<Lead>>({});
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [adminReplyValue, setAdminReplyValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const modalChatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollModalToBottom = () => {
    modalChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

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
    setSelectedLead({
      ...selectedLead,
      messages: updatedMessages,
      status: 'Contacted'
    });

    // Update the leads list
    setLeads(prev => prev.map(lead => 
      lead.id === selectedLead.id 
        ? { ...lead, messages: updatedMessages, status: 'Contacted' } 
        : lead
    ));

    // If this is the active chat, update the messages state
    if (selectedLead.id === activeLeadId) {
      setMessages(updatedMessages);
    }

    setAdminReplyValue('');
  };

  // Update lead in inbox whenever messages or lead data changes
  useEffect(() => {
    if (activeLeadId) {
      setLeads(prev => prev.map(lead => 
        lead.id === activeLeadId 
          ? { 
              ...lead, 
              ...userLeadData, 
              messages,
              status: currentStep >= 7 ? 'Booked' : 'In Progress',
              tags: [
                ...(userLeadData.budget === '$1000-$3000' || userLeadData.budget === '$3000+' ? ['High Intent', 'Premium Client'] : []),
                ...(userLeadData.type === 'Designer' ? ['Designer Lead'] : []),
                ...(userLeadData.type === 'Contractor' ? ['Contractor Lead'] : []),
                ...(lead.tags.filter(t => !['High Intent', 'Premium Client', 'Designer Lead', 'Contractor Lead'].includes(t)))
              ]
            } 
          : lead
      ));
    }
  }, [messages, userLeadData, currentStep, activeLeadId]);

  // Chat Logic
  const startChat = () => {
    setIsChatOpen(true);
    if (messages.length === 0) {
      const initialMsg: Message = {
        id: '1',
        text: "Welcome to Shotcount Wallpaper Hangers. How can we help you today?",
        sender: 'bot',
        options: ['Get a Quote', 'Design Guidance', 'Visualize Room', 'Speak to Specialist']
      };
      setMessages([initialMsg]);
      setCurrentStep(1);

      // Create a new lead entry in the inbox immediately
      const newId = Math.random().toString(36).substr(2, 9);
      const newLead: Lead = {
        id: newId,
        type: 'Homeowner', // Default, will be updated
        timestamp: 'Just now',
        tags: [],
        status: 'In Progress',
        messages: [initialMsg]
      };
      setLeads(prev => [newLead, ...prev]);
      setActiveLeadId(newId);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), text: inputValue, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    const text = inputValue;
    setInputValue('');
    setIsTyping(true);

    // If we are in a workflow step, try to match the input to options
    const currentOptions = messages[messages.length - 1]?.options;
    if (currentOptions) {
      const match = currentOptions.find(opt => 
        text.toLowerCase().includes(opt.toLowerCase()) || 
        opt.toLowerCase().includes(text.toLowerCase())
      );
      
      if (match) {
        setTimeout(() => {
          setIsTyping(false);
          processNextStep(match);
        }, 800);
        return;
      }
    }

    // Otherwise, use Gemini for a natural response
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are the Shotcount Wallpaper Hangers Concierge, a high-end assistant for a professional wallpaper installation and removal service in Washington, DC.
        Business Details:
        - Name: Shotcount Wallpaper Hangers
        - Address: 700 12th Street NW. Unit # 700, Washington, DC. 20005
        - Contact: (202) 552-9388
        - Email: ben@Shotcount.com, Info@Shotcount.com
        - Contact Person: Ben
        - Office Hours: 24/7
        - Services: Wallpaper Installation, Removal and Wall-Prep, Site Visit, Measuring.
        - Offerings: Luxury Installation, Feature Walls, Design Guidance, Full Room Transformation.

        The user is currently in a lead qualification flow (Step ${currentStep}). 
        Current Lead Data: ${JSON.stringify(userLeadData)}.
        If the user is asking a general question, answer it elegantly using the business details provided and then gently guide them back to the next step of the qualification.
        The next step should be: ${getNextStepDescription(currentStep)}.
        User message: "${text}"`,
      });

      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: response.text || "I'm here to help. Could you tell me a bit more about your project?",
        sender: 'bot'
      }]);
    } catch (error) {
      console.error("Gemini Error:", error);
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: "I apologize, I'm having a brief moment of reflection. Could you please repeat that?",
        sender: 'bot'
      }]);
    }
  };

  const getNextStepDescription = (step: number) => {
    switch(step) {
      case 1: return "Identifying the category (Quote, Guidance, etc).";
      case 2: return "Identifying if they are a Homeowner, Designer, or Contractor.";
      case 3: return "Asking about the Service Type (Installation, Removal, etc).";
      case 4: return "Asking about the Project Type (Accent wall, Single room, etc).";
      case 5: return "Asking about the Timeline.";
      case 6: return "Asking about the Budget.";
      case 7: return "Asking for a photo upload.";
      default: return "Booking a consultation.";
    }
  };

  const handleOptionSelect = (option: string) => {
    const userMsg: Message = { id: Date.now().toString(), text: option, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      processNextStep(option);
    }, 800);
  };

  const processNextStep = (input: string) => {
    let nextMsg: Message;
    
    switch (currentStep) {
      case 1: // Category Selection
        if (input === 'Speak to Specialist') {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            text: "I've notified Ben, our specialist. He will personally respond to you shortly. In the meantime, could you tell me if you are a Homeowner, a Professional Designer, or a Contractor?",
            sender: 'bot',
            options: ['Homeowner', 'Designer', 'Contractor']
          }]);
          setCurrentStep(2);
          return;
        }
        
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: `Excellent. To provide the best ${input.toLowerCase()}, are you a Homeowner, a Professional Designer, or a Contractor?`,
          sender: 'bot',
          options: ['Homeowner', 'Designer', 'Contractor']
        }]);
        setCurrentStep(2);
        break;

      case 2: // User Type
        const type = input as LeadType;
        setUserLeadData(prev => ({ ...prev, type }));
        let response = "";
        if (type === 'Homeowner') {
          response = "Wonderful. We work with discerning homeowners to transform interiors into timeless works of art.";
        } else if (type === 'Designer') {
          response = "A pleasure. We collaborate with designers to execute intricate installations with seamless precision.";
        } else {
          response = "Excellent. We partner with contractors to provide reliable, high-quality wallpaper services for your projects.";
        }
        
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: response,
          sender: 'bot'
        }]);

        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            text: "Which service are you interested in?",
            sender: 'bot',
            options: ['Installation', 'Removal & Prep', 'Site Visit', 'Measurement', 'Other']
          }]);
          setCurrentStep(3);
        }, 1000);
        break;

      case 3: // Service Type
        setUserLeadData(prev => ({ ...prev, serviceType: input as ServiceType }));
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: "What type of project are you planning?",
          sender: 'bot',
          options: ['Accent wall', 'Single room', 'Multiple rooms', 'Entire residence', 'Commercial space']
        }]);
        setCurrentStep(4);
        break;

      case 4: // Project Type
        setUserLeadData(prev => ({ ...prev, projectType: input as ProjectType }));
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: "When would you like the project completed?",
          sender: 'bot',
          options: ['ASAP', 'Within 1 month', '1-3 months', 'Planning phase']
        }]);
        setCurrentStep(5);
        break;

      case 5: // Timeline
        setUserLeadData(prev => ({ ...prev, timeline: input as Timeline }));
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: "Our work is highly detailed and tailored to each space. What level of investment are you considering?",
          sender: 'bot',
          options: ['$0-$500', '$500-$1000', '$1000-$3000', '$3000+']
        }]);
        setCurrentStep(6);
        break;

      case 6: // Budget Filter
        const budget = input as Budget;
        const isHighEnd = budget === '$1000-$3000' || budget === '$3000+';
        setUserLeadData(prev => ({ ...prev, budget }));

        const filterMsg = isHighEnd
          ? "Your project requires a high level of craftsmanship. We'd be delighted to guide you through a private consultation."
          : "We can certainly guide you and recommend the best approach for your space.";

        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: filterMsg,
          sender: 'bot'
        }]);

        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            text: "If you'd like, you may share a photo of your space or wall. Our team can provide preliminary recommendations or help you visualize the room.",
            sender: 'bot',
            type: 'upload'
          }]);
          setCurrentStep(7);
        }, 1200);
        break;

      case 7: // Photo Upload & Close
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: "To ensure a flawless result, we recommend a private consultation with Ben. We have a few priority openings available this week.",
          sender: 'bot',
          type: 'button',
          buttonText: 'Request Private Consultation',
          buttonUrl: 'https://calendly.com/artisanflow' // Placeholder, but Ben is mentioned
        }]);
        
        setCurrentStep(8);
        break;
    }
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
              className="bg-white w-[400px] h-[600px] rounded-3xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden mb-6"
            >
              {/* Chat Header */}
              <div className="bg-stone-900 p-6 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center border border-stone-700">
                    <Navigation className="w-5 h-5 text-stone-400" />
                  </div>
                  <div>
                    <h3 className="font-bold leading-tight">Shotcount Concierge</h3>
                    <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Always Online</p>
                  </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-stone-800 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                {messages.map((msg) => (
                  <div key={msg.id} className={cn(
                    "flex flex-col max-w-[85%]",
                    msg.sender === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}>
                    <div className={cn(
                      "p-4 rounded-2xl text-sm leading-relaxed prose prose-sm prose-stone max-w-none",
                      msg.sender === 'user' 
                        ? "bg-stone-900 text-white rounded-tr-none prose-invert" 
                        : msg.sender === 'admin'
                          ? "bg-stone-200 text-stone-900 rounded-tl-none border border-stone-300"
                          : "bg-stone-100 text-stone-800 rounded-tl-none"
                    )}>
                      {msg.sender === 'admin' && (
                        <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1 not-prose">Concierge Reply</p>
                      )}
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                    
                    {msg.options && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {msg.options.map(opt => (
                          <button 
                            key={opt}
                            onClick={() => handleOptionSelect(opt)}
                            className="px-4 py-2 bg-white border border-stone-200 rounded-full text-xs font-bold text-stone-600 hover:border-stone-900 hover:text-stone-900 transition-all"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}

                    {msg.type === 'upload' && (
                      <div className="mt-3 w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-stone-200 rounded-2xl cursor-pointer hover:bg-stone-50 transition-all">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-6 h-6 text-stone-400 mb-2" />
                            <p className="text-xs text-stone-500 font-bold">Upload Space Photo</p>
                          </div>
                          <input type="file" className="hidden" onChange={() => processNextStep('photo_uploaded')} />
                        </label>
                        <button 
                          onClick={() => processNextStep('skip_photo')}
                          className="w-full mt-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest hover:text-stone-600"
                        >
                          Skip for now
                        </button>
                      </div>
                    )}

                    {msg.type === 'button' && (
                      <a 
                        href={msg.buttonUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 w-full py-4 bg-stone-900 text-white rounded-2xl flex items-center justify-center gap-2 font-bold hover:bg-stone-800 transition-all shadow-lg shadow-stone-900/20"
                      >
                        <Calendar className="w-4 h-4" />
                        {msg.buttonText}
                      </a>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div className="flex items-center gap-1 p-4 bg-stone-100 rounded-2xl rounded-tl-none w-16">
                    <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-6 border-t border-stone-100">
                <div className="flex items-center gap-2 bg-stone-50 rounded-2xl px-4 py-2">
                  <input 
                    type="text" 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your message..." 
                    className="flex-1 bg-transparent border-none outline-none text-sm py-2 text-stone-800 placeholder:text-stone-400"
                  />
                  <button 
                    type="submit"
                    disabled={!inputValue.trim()}
                    className="p-2 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={startChat}
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
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
                    <MessageSquare className="w-12 h-12 text-stone-200" />
                    <p className="text-stone-500">No message history available for this lead.</p>
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
