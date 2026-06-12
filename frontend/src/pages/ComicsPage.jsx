import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ThumbsUp, MessageSquare, Share2,
  ChevronRight, Calendar, User, Smile, Play, Globe,
  ShieldCheck, Clock, Layers, ChevronDown
} from 'lucide-react';
import '../styles/landing.css';
import UniversalHeader from '../components/layout/UniversalHeader';
import UniversalFooter from '../components/layout/UniversalFooter';
import BlurText from '../components/common/BlurText';
import SplitText from '../components/common/SplitText';
import ScrollReveal from '../components/common/ScrollReveal';
import Antigravity from '../components/common/Antigravity';

const ComicsPage = () => {
  const navigate = useNavigate();
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Comics state
  const [comics, setComics] = useState([
    {
      id: 'biometric-battle',
      title: 'Episode 1: The Biometric Battle',
      date: 'June 10, 2026',
      author: 'MyFastHR Creative Labs',
      description: 'The struggle of punching in on legacy hardware vs. the modern ease of mobile GPS logs.',
      image: '/biometric_battle.png',
      likes: 42,
      liked: false,
      comments: [
        { user: 'Amit S.', text: 'Every single morning at 9:00 AM! This hits way too close to home.' },
        { user: 'Neha Sharma', text: 'My finger is apparently "not registered" whenever it rains...' },
        { user: 'Sanjay Kumar', text: 'Thank goodness we moved to MyFastHR! GPS check-in is a lifesaver.' }
      ]
    },
    {
      id: 'payroll-nightmare',
      title: 'Episode 2: The Spreadsheet Abyss',
      date: 'June 03, 2026',
      author: 'MyFastHR Creative Labs',
      description: 'Buried in Excel sheets trying to calculate Pf/ESIC compliance on payday.',
      image: '/payroll_nightmare.png',
      likes: 56,
      liked: false,
      comments: [
        { user: 'Rohan D.', text: 'The mountain of spreadsheets is real. I used to have nightmares about formulas.' },
        { user: 'Karthik P.', text: 'When the employees show up at the door asking where the payslip is... so stressful!' }
      ]
    },
    {
      id: 'leave-odyssey',
      title: 'Episode 3: The Leave Request Odyssey',
      date: 'May 27, 2026',
      author: 'MyFastHR Creative Labs',
      description: 'The long, epic journey of a paper leave form versus the instant one-click approval desk.',
      image: '/leave_odyssey.png',
      likes: 38,
      liked: false,
      comments: [
        { user: 'Priya Verma', text: 'Getting 5 levels of manager stamps just to take a Friday off!' },
        { user: 'Vikram A.', text: 'One-click manager dashboards are the future.' }
      ]
    }
  ]);

  const [activeComicId, setActiveComicId] = useState('biometric-battle');
  const activeComic = comics.find(c => c.id === activeComicId);
  const [newComment, setNewComment] = useState('');
  const [showPowEffect, setShowPowEffect] = useState(false);

  const handleLike = (id) => {
    setComics(prev => prev.map(c => {
      if (c.id === id) {
        const nextLiked = !c.liked;
        if (nextLiked) {
          setShowPowEffect(true);
          setTimeout(() => setShowPowEffect(false), 800);
        }
        return {
          ...c,
          likes: c.liked ? c.likes - 1 : c.likes + 1,
          liked: nextLiked
        };
      }
      return c;
    }));
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComics(prev => prev.map(c => {
      if (c.id === activeComicId) {
        return {
          ...c,
          comments: [...c.comments, { user: 'You', text: newComment }]
        };
      }
      return c;
    }));
    setNewComment('');
  };

  const toggleDropdown = (menuName) => {
    if (activeDropdown === menuName) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(menuName);
    }
  };

  return (
    <div className="landing-body min-h-screen flex flex-col bg-white">
      <UniversalHeader />

      {/* Main Comic Page Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-12 space-y-12 text-left">
        {/* Back Link & Header */}
        <section className="relative px-6 py-12 text-left bg-[#F1F5F9]/60 overflow-hidden rounded-[32px] w-full">
          <div className="absolute inset-0 pointer-events-none opacity-40 z-0">
            <Antigravity
              count={120}
              magnetRadius={6}
              ringRadius={7}
              waveSpeed={0.4}
              waveAmplitude={1}
              particleSize={1.5}
              lerpSpeed={0.05}
              color={'#8b5cf6'}
              autoAnimate={true}
              particleVariance={1}
              particleShape="sphere"
            />
          </div>
          <div className="relative z-10 space-y-4">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#6028D9] hover:underline bg-transparent border-none outline-none cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to Home
          </button>
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-5xl font-bold text-[#111827] tracking-tight">
              <SplitText text="MyFastHR" className="inline-block" tag="span" textAlign="left" delay={30} /> <span className="text-[#6028D9]"><BlurText text="Corporate Comics" className="inline-flex" /></span>
            </h1>
            <SplitText 
              text="Laughing away the office stress. Explore our webcomic episodes about biometric issues, Excel nightmares, and the daily hustle resolved by MyFastHR." 
              className="text-sm sm:text-base text-gray-500 max-w-2xl block"
              tag="p"
              textAlign="left"
              splitType="words"
              delay={20}
              duration={0.8}
            />
          </div>
        </div>
      </section>

        {/* Two-Column Comic viewer grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Side: Comic image and interactive panel */}
          <div className="lg:col-span-8 space-y-6">
            {/* Comic Frame Card */}
            <div className="p-4 sm:p-6 bg-[#F1F5F9] border border-[#E9D5FF] rounded-2xl shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-[#E9D5FF] pb-4">
                <h2 className="text-lg sm:text-xl font-bold text-[#111827]">{activeComic.title}</h2>
                <div className="text-[10px] text-gray-500 font-medium bg-white px-2 py-1 rounded border border-[#E9D5FF]">
                  {activeComic.date}
                </div>
              </div>

              {/* Comic Panel Image */}
              <div key={activeComicId} className="bg-white rounded-xl overflow-hidden border border-[#E9D5FF] p-2 flex justify-center items-center comic-frame-pop">
                <img
                  src={activeComic.image}
                  alt={activeComic.title}
                  className="max-h-[500px] w-auto object-contain hover:scale-[1.01] transition-transform duration-300"
                />
              </div>

              {/* Interactive Bar */}
              <div className="flex justify-between items-center pt-2">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <button
                      onClick={() => handleLike(activeComic.id)}
                      className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${activeComic.liked
                          ? 'bg-[#6028D9] text-white border-[#6028D9]'
                          : 'bg-white text-gray-600 border-[#E9D5FF] hover:bg-[#F1F5F9]'
                        }`}
                    >
                      <ThumbsUp size={14} /> <span>{activeComic.likes} Likes</span>
                    </button>
                    {showPowEffect && (
                      <span className="pow-balloon">POW!</span>
                    )}
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-gray-600">
                    <MessageSquare size={14} /> <span>{activeComic.comments.length} Comments</span>
                  </span>
                </div>

                <button className="flex items-center gap-1.5 text-xs font-bold text-gray-600 bg-white border border-[#E9D5FF] px-3 py-1.5 rounded-lg hover:bg-[#F1F5F9] cursor-pointer">
                  <Share2 size={14} /> Share
                </button>
              </div>
            </div>

            {/* Comments Area */}
            <div className="p-6 bg-white border border-[#E9D5FF] rounded-2xl shadow-sm space-y-6">
              <h3 className="text-sm font-bold uppercase text-gray-500 tracking-wider">Comments Feed</h3>

              <div className="space-y-4">
                {activeComic.comments.map((comment, index) => (
                  <div key={index} className="flex gap-3 text-sm items-start border-b border-gray-100 pb-3 last:border-0 last:pb-0 comment-bubble-entry">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-[#6028D9] shrink-0">
                      {comment.user.charAt(0)}
                    </div>
                    <div className="space-y-1">
                      <div className="font-bold text-gray-900">{comment.user}</div>
                      <p className="text-xs text-gray-600">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="flex gap-3 pt-4 border-t border-gray-100">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add your thoughts about this episode..."
                  className="flex-grow px-4 py-2 border border-[#E9D5FF] rounded-xl text-xs focus:outline-none focus:border-[#6028D9]"
                />
                <button type="submit" className="btn-primary px-4 py-2 text-xs font-bold">
                  Submit
                </button>
              </form>
            </div>
          </div>

          {/* Right Side: Comic Selection Column */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 bg-white border border-[#E9D5FF] rounded-2xl shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase text-gray-500 tracking-wider">Comic Episodes</h3>
              <div className="grid gap-3">
                {comics.map((comic) => (
                  <div
                    key={comic.id}
                    onClick={() => setActiveComicId(comic.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer text-left ${activeComicId === comic.id
                        ? 'border-[#6028D9] bg-[#E9D5FF]/10 shadow-sm'
                        : 'border-[#E9D5FF] hover:bg-gray-50'
                      }`}
                  >
                    <h4 className="text-xs font-bold text-gray-900">{comic.title}</h4>
                    <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{comic.description}</p>
                    <div className="flex justify-between items-center pt-2 text-[9px] text-gray-400">
                      <span>Likes: {comic.likes}</span>
                      <span>By {comic.author}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick value prop card */}
            <div className="p-6 bg-gradient-to-tr from-[#6028D9] to-[#4C1D95] text-white rounded-2xl shadow-md space-y-4">
              <h3 className="text-base font-bold">Say Goodbye to Corporate Drama</h3>
              <ScrollReveal containerClassName="text-xs text-purple-200 leading-relaxed block text-left" baseOpacity={0.1}>
                Biometric failures and approval delays shouldn't hold back your business growth. MyFastHR streamlines daily workforce logs with zero hassle.
              </ScrollReveal>
              <button onClick={() => navigate('/book-demo')} className="w-full bg-white text-[#6028D9] text-xs font-bold py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                Book a Free Demo
              </button>
            </div>
          </div>
        </div>
      </main>

      <UniversalFooter />
    </div>
  );
};

export default ComicsPage;
