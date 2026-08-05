import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, MessageSquare, Building2, Sparkles, PhoneCall } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'Support',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-12 space-y-12 text-gray-900">
      {/* HEADER */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-[#FF5C00]/10 border border-[#FF5C00]/30 px-3 py-1 rounded-full text-xs font-mono font-bold text-[#FF5C00]">
          <Mail className="w-3.5 h-3.5" />
          <span>Get in Touch</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">Contact the Gonnng Team</h1>
        <p className="text-xs sm:text-sm text-gray-600 font-sans leading-relaxed">
          Have a question, feedback, partnership proposal, or media inquiry? Send us a message and we will respond promptly.
        </p>
      </div>

      {submitted ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-10 text-center space-y-4 max-w-xl mx-auto shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
          <h2 className="text-2xl font-extrabold text-gray-900">Thank you, {form.name}!</h2>
          <p className="text-xs text-gray-700 leading-relaxed font-sans">
            Your message regarding <strong>{form.subject || form.category}</strong> has been transmitted to our internal routing team. A confirmation email was dispatched to <code>{form.email}</code>.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setForm({ name: '', email: '', subject: '', category: 'Support', message: '' });
            }}
            className="bg-white hover:bg-gray-50 text-gray-900 font-mono text-xs px-5 py-2.5 rounded-xl border border-gray-300 transition-all cursor-pointer shadow-sm"
          >
            Send Another Message
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* CONTACT INFO SIDEBAR */}
          <div className="md:col-span-5 bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-6">
            <h3 className="text-sm font-mono font-bold text-gray-900 uppercase tracking-wider">Direct Contacts</h3>
            
            <div className="space-y-4 text-xs text-gray-700">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#FF5C00] shrink-0 mt-0.5" />
                <div>
                  <span className="block font-bold text-gray-900">General Support</span>
                  <a href="mailto:support@gonnng.com" className="text-[#FF5C00] hover:underline">support@gonnng.com</a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building2 className="w-4 h-4 text-[#FF5C00] shrink-0 mt-0.5" />
                <div>
                  <span className="block font-bold text-gray-900">Partnerships & Press</span>
                  <a href="mailto:press@gonnng.com" className="text-[#FF5C00] hover:underline">press@gonnng.com</a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-[#FF5C00] shrink-0 mt-0.5" />
                <div>
                  <span className="block font-bold text-gray-900">Creator Feedback</span>
                  <a href="mailto:feedback@gonnng.com" className="text-[#FF5C00] hover:underline">feedback@gonnng.com</a>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 text-[11px] text-gray-500 space-y-1">
              <p>🏢 Gonnng Headquarters</p>
              <p>548 Market Street, Suite 9021</p>
              <p>San Francisco, CA 94104</p>
            </div>
          </div>

          {/* CONTACT FORM */}
          <form onSubmit={handleSubmit} className="md:col-span-7 bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-gray-700 font-mono">Your Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Clara Monet"
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#FF5C00]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-gray-700 font-mono">Your Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="creator@example.com"
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#FF5C00]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-gray-700 font-mono">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:bg-white focus:border-[#FF5C00]"
                >
                  <option value="Support">Support Inquiry</option>
                  <option value="Feedback">Feature Feedback</option>
                  <option value="Partnership">Partnership Proposal</option>
                  <option value="Press">Press & Media</option>
                  <option value="Business Inquiry">Business Inquiry</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-gray-700 font-mono">Subject</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Brief summary..."
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#FF5C00]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-700 font-mono">Your Message *</label>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="How can we help you..."
                className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#FF5C00]"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#FF5C00] to-[#FF8000] text-black py-3 rounded-xl text-xs font-bold shadow-lg shadow-[#FF5C00]/20 flex items-center justify-center gap-2 hover:scale-[1.01] transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Message</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
