import React, { useState } from 'react';
import { 
  Search, BookOpen, HelpCircle, ThumbsUp, ThumbsDown, 
  MessageSquare, CheckCircle, ChevronRight, Layers, UserCheck, 
  CreditCard, Wrench, Bell, AlertCircle, Send
} from 'lucide-react';

interface Article {
  id: string;
  category: string;
  title: string;
  content: string;
  helpfulCount: number;
}

const ARTICLES: Article[] = [
  {
    id: 'art-1',
    category: 'Getting Started',
    title: 'How do I create my first project in Gonnng?',
    content: 'Creating your first project is easy! Click on "New Project" in your workspace header. You can choose from an existing Recipe template (like "Make a Sandwich" or "Paint an Oil Canvas") or start with a custom project name and phase structure.',
    helpfulCount: 142
  },
  {
    id: 'art-2',
    category: 'Recipes',
    title: 'What is a Recipe in Gonnng?',
    content: 'A Recipe is a repeatable creative blueprint. Unlike a static to-do list, a Recipe breaks down complex creative goals into structured phases and tasks with estimated time limits. You can fork existing community recipes or save your own project workflows as reusable recipes.',
    helpfulCount: 218
  },
  {
    id: 'art-3',
    category: 'Projects',
    title: 'How do I organize multiple projects using Collections?',
    content: 'Collections allow you to group related projects under a single focus area (e.g. "Summer Sourdough Series" or "Q3 Product Launch"). Each collection can have a target deadline date, budget limit, and work mode (sequential vs parallel execution).',
    helpfulCount: 98
  },
  {
    id: 'art-4',
    category: 'Account Management',
    title: 'How do I recover or reset my password?',
    content: 'On the Login page, click "Forgot Password". Enter the email address associated with your Gonnng account, and we will send you a password reset link. For test accounts, you can always sign in with email test@gonnng.com and password test1234.',
    helpfulCount: 76
  },
  {
    id: 'art-5',
    category: 'Account Management',
    title: 'How do I delete my data or account?',
    content: 'Gonnng values your data privacy. You can export all your project data from the Settings tab at any time. To permanently delete your account, submit a request in the Support Escalation form below or email privacy@gonnng.com.',
    helpfulCount: 54
  },
  {
    id: 'art-6',
    category: 'Troubleshooting',
    title: 'Why is my Supabase data not syncing?',
    content: 'Ensure your environment variable VITE_ENABLE_SUPABASE is set to "true" and SUPABASE_URL / VITE_SUPABASE_ANON_KEY are valid credentials. If Supabase is disabled, Gonnng seamlessly falls back to fast local JSON browser storage.',
    helpfulCount: 88
  }
];

const CATEGORIES = [
  { name: 'All Categories', icon: BookOpen },
  { name: 'Getting Started', icon: HelpCircle },
  { name: 'Account Management', icon: UserCheck },
  { name: 'Projects', icon: Layers },
  { name: 'Recipes', icon: BookOpen },
  { name: 'Notifications', icon: Bell },
  { name: 'Billing', icon: CreditCard },
  { name: 'Troubleshooting', icon: Wrench }
];

export const SupportPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [expandedArticle, setExpandedArticle] = useState<string | null>('art-1');
  const [ratedArticles, setRatedArticles] = useState<Record<string, 'up' | 'down'>>({});

  // Ticket Form State
  const [ticketForm, setTicketForm] = useState({
    email: '',
    category: 'Support',
    device: 'Web App',
    description: ''
  });
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  const filteredArticles = ARTICLES.filter(art => {
    const matchesCat = selectedCategory === 'All Categories' || art.category === selectedCategory;
    const matchesSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          art.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleRate = (id: string, type: 'up' | 'down') => {
    setRatedArticles(prev => ({ ...prev, [id]: type }));
  };

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.email || !ticketForm.description) return;
    setTicketSubmitted(true);
    setTimeout(() => {
      setTicketSubmitted(false);
      setTicketForm({ email: '', category: 'Support', device: 'Web App', description: '' });
    }, 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 space-y-16 text-gray-900">
      {/* HERO & SEARCH BAR */}
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          Gonnng Help Center
        </h1>
        <p className="text-sm sm:text-base text-gray-600 font-sans">
          Find instant answers to common questions about recipes, projects, collections, and account settings.
        </p>

        <div className="relative max-w-xl mx-auto">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles (e.g. 'How do I create a Recipe?')"
            className="w-full bg-white border border-gray-300 shadow-sm rounded-2xl pl-12 pr-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#F59E0B] transition-colors"
          />
        </div>
      </div>

      {/* CATEGORIES GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {CATEGORIES.map((cat, cIdx) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.name;
          return (
            <button
              key={`support-cat-${cat.name}-${cIdx}`}
              onClick={() => setSelectedCategory(cat.name)}
              className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-[#F59E0B] text-black border-[#F59E0B] font-bold shadow-md shadow-[#F59E0B]/20'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900 shadow-sm'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[11px] leading-tight font-medium">{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* KNOWLEDGE ARTICLES LIST */}
      <div className="space-y-4">
        <h2 className="text-lg font-mono font-bold text-gray-900 uppercase tracking-wider flex items-center justify-between">
          <span>Knowledge Articles ({filteredArticles.length})</span>
          {selectedCategory !== 'All Categories' && (
            <button onClick={() => setSelectedCategory('All Categories')} className="text-xs text-[#F59E0B] font-sans hover:underline cursor-pointer">
              Clear Category Filter
            </button>
          )}
        </h2>

        {filteredArticles.length === 0 ? (
          <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-8 text-center text-gray-600 space-y-2">
            <AlertCircle className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-sm">No articles matched your search query "{searchQuery}".</p>
            <p className="text-xs text-gray-500">Try searching for keywords like "recipe", "project", or "password".</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredArticles.map((art, aIdx) => {
              const isExpanded = expandedArticle === art.id;
              const rating = ratedArticles[art.id];
              return (
                <div 
                  key={`support-art-${art.id}-${aIdx}`}
                  className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setExpandedArticle(isExpanded ? null : art.id)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[10px] font-mono font-bold bg-[#F59E0B]/20 text-[#F59E0B] px-2 py-0.5 rounded-full shrink-0">
                        {art.category}
                      </span>
                      <h3 className="text-sm font-bold text-gray-900 truncate">{art.title}</h3>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 border-t border-gray-100 space-y-4 text-xs text-gray-700 leading-relaxed font-sans">
                      <p>{art.content}</p>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-[11px]">
                        <span className="text-gray-500 font-mono">Was this article helpful?</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRate(art.id, 'up')}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border transition-colors cursor-pointer ${
                              rating === 'up' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:text-gray-900'
                            }`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>Yes ({art.helpfulCount + (rating === 'up' ? 1 : 0)})</span>
                          </button>
                          <button
                            onClick={() => handleRate(art.id, 'down')}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border transition-colors cursor-pointer ${
                              rating === 'down' 
                                ? 'bg-red-50 text-red-700 border-red-300' 
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:text-gray-900'
                            }`}
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                            <span>No</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CONTACT ESCALATION / TICKET SUBMISSION FORM */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#F59E0B]" />
            <span>Still need help? Submit a Support Ticket</span>
          </h2>
          <p className="text-xs text-gray-600 mt-1">Our customer support team typically responds within 2-4 hours.</p>
        </div>

        {ticketSubmitted ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto animate-bounce" />
            <h3 className="text-base font-bold text-gray-900">Support Request Received!</h3>
            <p className="text-xs text-gray-700">A confirmation email has been sent to {ticketForm.email || 'your email'}. Ticket ID: #GNG-84920.</p>
          </div>
        ) : (
          <form onSubmit={handleTicketSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-gray-700 font-mono">Your Email</label>
                <input
                  type="email"
                  required
                  value={ticketForm.email}
                  onChange={(e) => setTicketForm({ ...ticketForm, email: e.target.value })}
                  placeholder="creator@example.com"
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#F59E0B]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-gray-700 font-mono">Issue Category</label>
                <select
                  value={ticketForm.category}
                  onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:bg-white focus:border-[#F59E0B]"
                >
                  <option value="Getting Started">Getting Started</option>
                  <option value="Account Management">Account Management</option>
                  <option value="Projects">Projects & Recipes</option>
                  <option value="Billing">Billing & Subscription</option>
                  <option value="Troubleshooting">Troubleshooting & Bug Report</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-gray-700 font-mono">Device Environment</label>
                <select
                  value={ticketForm.device}
                  onChange={(e) => setTicketForm({ ...ticketForm, device: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:bg-white focus:border-[#F59E0B]"
                >
                  <option value="Web App">Web Workspace (Desktop)</option>
                  <option value="iOS App">iOS App (iPhone/iPad)</option>
                  <option value="Android App">Android App</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-700 font-mono">Issue Description</label>
              <textarea
                required
                rows={4}
                value={ticketForm.description}
                onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                placeholder="Describe what happened and any steps to reproduce..."
                className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#F59E0B]"
              ></textarea>
            </div>

            <button
              type="submit"
              className="bg-gradient-to-r from-[#F59E0B] to-[#FF8000] text-black px-6 py-3 rounded-xl text-xs font-bold shadow-md shadow-[#F59E0B]/20 flex items-center gap-2 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Ticket</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
