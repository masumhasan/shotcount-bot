import React, { useState, useEffect, useRef } from 'react';
import { Send, Upload, Calendar, Navigation, X, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../lib/utils';
import { Message, Lead, LeadType, ProjectType, ServiceType, Timeline, Budget } from '../types';

interface ChatInterfaceProps {
  isFullScreen?: boolean;
  onClose?: () => void;
  onLeadUpdate?: (lead: Lead) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ isFullScreen, onClose, onLeadUpdate }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [userLeadData, setUserLeadData] = useState<Partial<Lead>>({});
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (messages.length === 0) {
      const initialMsg: Message = {
        id: '1',
        text: "Welcome to Shotcount Wallpaper Hangers. How can we help you today?",
        sender: 'bot',
        options: ['Get a Quote', 'Design Guidance', 'Visualize Room', 'Speak to Specialist']
      };
      setMessages([initialMsg]);
      setCurrentStep(1);

      const newId = Math.random().toString(36).substr(2, 9);
      setActiveLeadId(newId);
    }
  }, []);

  // Sync lead data to parent/storage
  useEffect(() => {
    if (activeLeadId && onLeadUpdate) {
      const lead: Lead = {
        id: activeLeadId,
        type: userLeadData.type || 'Homeowner',
        serviceType: userLeadData.serviceType,
        projectType: userLeadData.projectType,
        timeline: userLeadData.timeline,
        budget: userLeadData.budget,
        timestamp: 'Just now',
        tags: [
          ...(userLeadData.budget === '$1000-$3000' || userLeadData.budget === '$3000+' ? ['High Intent', 'Premium Client'] : []),
          ...(userLeadData.type === 'Designer' ? ['Designer Lead'] : []),
          ...(userLeadData.type === 'Contractor' ? ['Contractor Lead'] : []),
        ],
        status: currentStep >= 7 ? 'Booked' : 'In Progress',
        messages: messages
      };
      onLeadUpdate(lead);
      
      // Also save to localStorage for cross-tab persistence in this prototype
      const savedLeads = JSON.parse(localStorage.getItem('shotcount_leads') || '[]');
      const existingIndex = savedLeads.findIndex((l: any) => l.id === activeLeadId);
      if (existingIndex > -1) {
        savedLeads[existingIndex] = lead;
      } else {
        savedLeads.unshift(lead);
      }
      localStorage.setItem('shotcount_leads', JSON.stringify(savedLeads));
    }
  }, [messages, userLeadData, currentStep, activeLeadId]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), text: inputValue, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    const text = inputValue;
    setInputValue('');
    setIsTyping(true);

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
    switch (currentStep) {
      case 1:
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

      case 2:
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
        setMessages(prev => [...prev, { id: Date.now().toString(), text: response, sender: 'bot' }]);
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

      case 3:
        setUserLeadData(prev => ({ ...prev, serviceType: input as ServiceType }));
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: "What type of project are you planning?",
          sender: 'bot',
          options: ['Accent wall', 'Single room', 'Multiple rooms', 'Entire residence', 'Commercial space']
        }]);
        setCurrentStep(4);
        break;

      case 4:
        setUserLeadData(prev => ({ ...prev, projectType: input as ProjectType }));
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: "When would you like the project completed?",
          sender: 'bot',
          options: ['ASAP', 'Within 1 month', '1-3 months', 'Planning phase']
        }]);
        setCurrentStep(5);
        break;

      case 5:
        setUserLeadData(prev => ({ ...prev, timeline: input as Timeline }));
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: "Our work is highly detailed and tailored to each space. What level of investment are you considering?",
          sender: 'bot',
          options: ['$0-$500', '$500-$1000', '$1000-$3000', '$3000+']
        }]);
        setCurrentStep(6);
        break;

      case 6:
        const budget = input as Budget;
        const isHighEnd = budget === '$1000-$3000' || budget === '$3000+';
        setUserLeadData(prev => ({ ...prev, budget }));
        const filterMsg = isHighEnd
          ? "Your project requires a high level of craftsmanship. We'd be delighted to guide you through a private consultation."
          : "We can certainly guide you and recommend the best approach for your space.";
        setMessages(prev => [...prev, { id: Date.now().toString(), text: filterMsg, sender: 'bot' }]);
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

      case 7:
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          text: "To ensure a flawless result, we recommend a private consultation with Ben. We have a few priority openings available this week.",
          sender: 'bot',
          type: 'button',
          buttonText: 'Request Private Consultation',
          buttonUrl: 'https://calendly.com/artisanflow'
        }]);
        setCurrentStep(8);
        break;
    }
  };

  return (
    <div className={cn(
      "bg-white flex flex-col overflow-hidden",
      isFullScreen ? "w-full h-screen max-w-4xl mx-auto shadow-2xl rounded-none md:rounded-3xl md:h-[90vh] md:my-[5vh]" : "w-[400px] h-[600px] rounded-3xl shadow-2xl border border-stone-200"
    )}>
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
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-stone-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-stone-50/30">
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
                  : "bg-white text-stone-800 rounded-tl-none border border-stone-100 shadow-sm"
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
                    className="px-4 py-2 bg-white border border-stone-200 rounded-full text-xs font-bold text-stone-600 hover:border-stone-900 hover:text-stone-900 transition-all shadow-sm"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {msg.type === 'upload' && (
              <div className="mt-3 w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-stone-200 rounded-2xl cursor-pointer hover:bg-stone-50 transition-all bg-white">
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
          <div className="flex items-center gap-1 p-4 bg-white border border-stone-100 rounded-2xl rounded-tl-none w-16 shadow-sm">
            <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" />
            <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:0.2s]" />
            <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-6 bg-white border-t border-stone-100">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..." 
            className="flex-1 bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition-all"
          />
          <button 
            type="submit"
            disabled={!inputValue.trim()}
            className="w-12 h-12 bg-stone-900 text-white rounded-2xl flex items-center justify-center hover:bg-stone-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-stone-900/10"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
