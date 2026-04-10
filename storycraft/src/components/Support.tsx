import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bug, MessageSquare, Send, X, Sparkles, LifeBuoy, HelpCircle, BookOpen, Palette, FileText, ExternalLink } from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';
import { toast } from 'sonner';
import { UserProfile } from '../types';

export default function Support() {
  const [feedbackModal, setFeedbackModal] = useState<{ show: boolean, type: 'bug' | 'suggestion' }>({ show: false, type: 'bug' });
  const [feedbackContent, setFeedbackContent] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const handleSubmitFeedback = async () => {
    if (!feedbackContent.trim() || !auth.currentUser) return;
    setIsSubmittingFeedback(true);
    const path = 'feedback';
    try {
      await addDoc(collection(db, 'feedback'), {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        type: feedbackModal.type,
        content: feedbackContent,
        status: 'pending',
        createdAt: Date.now()
      });
      toast.success("Thank you for your feedback! Our team will review it.");
      setFeedbackModal({ show: false, type: 'bug' });
      setFeedbackContent('');
    } catch (error) {
      console.error(error);
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 pb-32">
      <header className="mb-12">
        <h1 className="text-6xl font-serif font-light mb-4">Forge <span className="italic text-gold">Support</span></h1>
        <p className="text-black/40 small-caps tracking-[0.3em] text-xs">We're here to help you forge your best stories</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <button 
          onClick={() => setFeedbackModal({ show: true, type: 'bug' })}
          className="group p-8 bg-white border border-black/5 rounded-[2.5rem] text-left hover:border-red-500/50 transition-all hover:shadow-2xl hover:shadow-red-500/5"
        >
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Bug size={32} />
          </div>
          <h3 className="text-2xl font-serif font-bold mb-2">Report a Bug</h3>
          <p className="text-sm text-black/40 leading-relaxed">Found a glitch in the forge? Let us know so we can fix it immediately.</p>
        </button>

        <button 
          onClick={() => setFeedbackModal({ show: true, type: 'suggestion' })}
          className="group p-8 bg-white border border-black/5 rounded-[2.5rem] text-left hover:border-blue-500/50 transition-all hover:shadow-2xl hover:shadow-blue-500/5"
        >
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <MessageSquare size={32} />
          </div>
          <h3 className="text-2xl font-serif font-bold mb-2">Share a Suggestion</h3>
          <p className="text-sm text-black/40 leading-relaxed">Have an idea for a new feature or improvement? We'd love to hear it!</p>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Documentation', icon: <BookOpen size={20} />, desc: 'Learn how to use all the forge tools.' },
          { title: 'Community FAQ', icon: <HelpCircle size={20} />, desc: 'Common questions from other storytellers.' },
          { title: 'Live Status', icon: <LifeBuoy size={20} />, desc: 'Check if the forge engines are running smoothly.' },
        ].map((item, i) => (
          <div key={i} className="p-6 bg-black/5 rounded-3xl border border-black/5">
            <div className="text-gold mb-4">{item.icon}</div>
            <h4 className="text-lg font-bold mb-1">{item.title}</h4>
            <p className="text-xs text-black/40">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 p-8 bg-gold/5 border border-gold/20 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-gold/10 text-gold rounded-2xl flex items-center justify-center">
            <FileText size={32} />
          </div>
          <div>
            <h3 className="text-2xl font-serif font-bold">Legal & Privacy</h3>
            <p className="text-sm text-black/40">Review our terms of service and privacy policy.</p>
          </div>
        </div>
        <button 
          onClick={async () => {
            const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
            const terms = (settingsDoc.exists() ? settingsDoc.data().termsOfConditions : null) || 'Welcome to StoryCraft. Our terms of conditions are currently being updated.';
            // Open in a simple alert for now or a dedicated modal if available
            toast.info("Terms & Conditions", {
              description: (typeof terms === 'string' ? terms : '').substring(0, 100) + "...",
              action: {
                label: "Read Full",
                onClick: () => window.open('/terms', '_blank') // Assuming a terms route exists or just show more
              }
            });
          }}
          className="px-8 py-4 bg-black text-white rounded-2xl font-bold hover:bg-gold hover:text-night transition-all flex items-center gap-2"
        >
          <span>View Terms</span>
          <ExternalLink size={18} />
        </button>
      </div>

      {/* Feedback Modal */}
      <AnimatePresence>
        {feedbackModal.show && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setFeedbackModal({ show: false, type: 'bug' })}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${feedbackModal.type === 'bug' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                    {feedbackModal.type === 'bug' ? <Bug size={24} /> : <MessageSquare size={24} />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif font-bold">{feedbackModal.type === 'bug' ? 'Report a Bug' : 'Share a Suggestion'}</h3>
                    <p className="text-xs text-black/40 uppercase tracking-widest font-bold">Help us craft a better StoryCraft</p>
                  </div>
                </div>
                <button onClick={() => setFeedbackModal({ show: false, type: 'bug' })} className="p-2 hover:bg-black/5 rounded-xl transition-all">
                  <X size={20} />
                </button>
              </div>

              <textarea 
                value={feedbackContent}
                onChange={(e) => setFeedbackContent(e.target.value)}
                placeholder={feedbackModal.type === 'bug' ? "Describe the bug you encountered..." : "What features would you like to see?"}
                className="w-full h-48 bg-black/5 rounded-3xl p-6 outline-none focus:ring-2 focus:ring-black/5 transition-all font-medium resize-none mb-8"
              />

              <button 
                onClick={handleSubmitFeedback}
                disabled={isSubmittingFeedback || !feedbackContent.trim()}
                className="w-full py-5 bg-black text-white rounded-2xl font-bold hover:bg-gold hover:text-night transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmittingFeedback ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={18} />
                    <span>Send Feedback</span>
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
