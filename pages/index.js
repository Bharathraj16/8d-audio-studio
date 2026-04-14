import { SignInButton, UserButton, useUser } from '@clerk/nextjs';
import { useRef, useState } from 'react';
import { useUserTier } from '../hooks/useUserTier';

export default function Home() {
  const { isSignedIn, user } = useUser();
  const { userTier, loading: tierLoading } = useUserTier();
  const [audioUrl, setAudioUrl] = useState(null);
  const [rotationSpeed, setRotationSpeed] = useState(0.3);
  const [reverbAmount, setReverbAmount] = useState(0.4);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);
  const pannerRef = useRef(null);
  const animationRef = useRef(null);
  const progressIntervalRef = useRef(null);

  // Theme colors
  const theme = {
    dark: {
      bg: 'linear-gradient(135deg, #1a0b2e 0%, #2d1b4e 100%)',
      cardBg: 'rgba(255, 255, 255, 0.08)',
      text: '#ffffff',
      accent: '#c084fc',
      accent2: '#a855f7',
      border: 'rgba(255, 255, 255, 0.15)',
      visualizerBg: 'rgba(192, 132, 252, 0.1)'
    },
    light: {
      bg: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
      cardBg: 'rgba(255, 255, 255, 0.7)',
      text: '#1a0b2e',
      accent: '#9333ea',
      accent2: '#7e22ce',
      border: 'rgba(0, 0, 0, 0.1)',
      visualizerBg: 'rgba(147, 51, 234, 0.08)'
    }
  };

  const checkAudioLimit = (audioDuration) => {
    if (userTier === 'free' && audioDuration > 120) {
      alert('⚠️ Free users can only convert audio up to 2 minutes.\nUpgrade to Pro for unlimited length!');
      return false;
    }
    return true;
  };

  const currentTheme = isDarkMode ? theme.dark : theme.light;

  const handleAudioUpload = (file) => {
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setAudioFile(file);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      
      const audio = new Audio(url);
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
      });
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'audio/mpeg' || file.type === 'audio/wav' || file.type === 'audio/mp3')) {
      handleAudioUpload(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'audio/mpeg' || file.type === 'audio/wav' || file.type === 'audio/mp3')) {
      handleAudioUpload(file);
    }
  };

  const updateProgress = () => {
    if (audioContextRef.current && sourceRef.current && isPlaying) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      progressIntervalRef.current = setInterval(() => {
        if (audioContextRef.current && audioContextRef.current.currentTime) {
          setCurrentTime(prev => {
            if (prev >= duration) {
              clearInterval(progressIntervalRef.current);
              return 0;
            }
            return prev + 0.1;
          });
        }
      }, 100);
    }
  };

  const playAudio = async () => {
    if (!audioUrl) return;
    if (duration > 0 && !checkAudioLimit(duration)) {
      return;
    }
  
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    if (audioContextRef.current) {
      await audioContextRef.current.close();
    }
    
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContextRef.current = new AudioContext();
    
    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
    
    setDuration(audioBuffer.duration);
    
    sourceRef.current = audioContextRef.current.createBufferSource();
    pannerRef.current = audioContextRef.current.createStereoPanner();
    
    sourceRef.current.connect(pannerRef.current);
    pannerRef.current.connect(audioContextRef.current.destination);
    
    sourceRef.current.buffer = audioBuffer;
    sourceRef.current.loop = false;
    
    startRotation();
    
    sourceRef.current.start();
    audioContextRef.current.resume();
    setIsPlaying(true);
    
    const startTime = audioContextRef.current.currentTime;
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => {
      if (audioContextRef.current && sourceRef.current) {
        const elapsed = audioContextRef.current.currentTime - startTime;
        setCurrentTime(Math.min(elapsed, audioBuffer.duration));
        if (elapsed >= audioBuffer.duration) {
          stopAudio();
        }
      }
    }, 100);
  };
  
  const startRotation = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    
    let startTime = audioContextRef.current.currentTime;
    
    const animate = () => {
      if (!isPlaying && !sourceRef.current) return;
      const elapsed = audioContextRef.current.currentTime - startTime;
      const angle = elapsed * rotationSpeed * Math.PI * 2;
      const panValue = Math.sin(angle);
      if (pannerRef.current) {
        pannerRef.current.pan.value = panValue;
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  };
  
  const pauseAudio = () => {
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.suspend();
      setIsPlaying(false);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    }
  };
  
  const stopAudio = () => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    setIsPlaying(false);
    setCurrentTime(0);
  };
  
  const resumeAudio = () => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
      setIsPlaying(true);
      startRotation();
      updateProgress();
    }
  };
  
  const seekAudio = (e) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    if (sourceRef.current && audioContextRef.current) {
      const wasPlaying = isPlaying;
      const newTime = seekTime;
      
      const recreateAudio = async () => {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
        
        if (sourceRef.current) {
          sourceRef.current.stop();
        }
        
        sourceRef.current = audioContextRef.current.createBufferSource();
        sourceRef.current.buffer = audioBuffer;
        sourceRef.current.connect(pannerRef.current);
        sourceRef.current.start(0, newTime);
        
        if (wasPlaying) {
          setIsPlaying(true);
          startRotation();
        }
      };
      
      recreateAudio();
    }
  };
  
  const downloadAudio = () => {
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = '8d_audio.mp3';
      link.click();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: currentTheme.bg,
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif',
      color: currentTheme.text,
      transition: 'all 0.3s ease',
      position: 'relative'
    }}>
      {/* Theme Toggle Button */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          background: currentTheme.cardBg,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${currentTheme.border}`,
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          fontSize: '1.5rem',
          cursor: 'pointer',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>

      {/* Header with Auth */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(10px)',
        borderRadius: '2rem',
        padding: '1rem 2rem',
        marginBottom: '3rem',
        border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div>
          <h1 style={{
            fontSize: '2rem',
            background: 'linear-gradient(135deg, #8a2be2, #00bfff, #ff69b4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0
          }}>
            🎧 8D AUDIO STUDIO
          </h1>
          <p style={{ opacity: 0.6, margin: 0, fontSize: '0.8rem' }}>Spatial Audio Transformer</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {/* Upgrade to Pro Button - Shows only for logged in free users */}
          {isSignedIn && userTier === 'free' && (
            <a href="/pricing">
              <button style={{
                background: 'linear-gradient(90deg, #f59e0b, #ea580c)',
                border: 'none',
                padding: '8px 20px',
                borderRadius: '20px',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}>
                ⭐ Upgrade to Pro
              </button>
            </a>
          )}
          
          {/* Sign In / User Button */}
          {!isSignedIn ? (
            <SignInButton mode="modal">
              <button style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '8px 20px',
                borderRadius: '20px',
                color: 'white',
                cursor: 'pointer'
              }}>
                Sign In
              </button>
            </SignInButton>
          ) : (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem' }}>👋 {user?.firstName}</span>
              <UserButton afterSignOutUrl="/" />
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <p style={{ textAlign: 'center', marginBottom: '2rem', opacity: 0.7 }}>
          Transform any song into a mind-bending 360° audio experience
        </p>

        {!audioUrl ? (
          <div style={{ 
            background: currentTheme.cardBg,
            backdropFilter: 'blur(12px)',
            borderRadius: '24px',
            border: `1px solid ${currentTheme.border}`,
            padding: '2rem',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => document.getElementById('audioInput').click()}>
            
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎵</div>
            <p style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>
              <strong>Drag & Drop</strong> or <strong>Click to Upload</strong>
            </p>
            <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>
              Supports: MP3, WAV (Max 20MB)
            </p>
            <input
              id="audioInput"
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                {/* Controls */}
                <div style={{ 
                  background: currentTheme.cardBg,
                  backdropFilter: 'blur(12px)',
                  borderRadius: '24px',
                  border: `1px solid ${currentTheme.border}`,
                  padding: '1.5rem',
                  marginBottom: '1.5rem'
                }}>
                  <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>✨ 8D Effect Controls</h3>
                  
                  <div style={{ marginBottom: '1.2rem' }}>
                    <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span>🔄 Rotation Speed</span>
                      <span style={{ color: currentTheme.accent, fontWeight: 'bold' }}>{rotationSpeed.toFixed(1)}x</span>
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1.5"
                      step="0.01"
                      value={rotationSpeed}
                      onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
                      style={{ 
                        width: '100%',
                        height: '4px',
                        borderRadius: '2px',
                        background: `linear-gradient(90deg, ${currentTheme.accent}, ${currentTheme.accent2})`,
                        cursor: 'pointer'
                      }}
                      disabled={isPlaying}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', opacity: 0.6 }}>
                      <span>Slow (3D Feel)</span>
                      <span>Medium (8D)</span>
                      <span>Fast (Psychedelic)</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.2rem' }}>
                    <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span>🌊 Reverb / Space</span>
                      <span style={{ color: currentTheme.accent, fontWeight: 'bold' }}>{Math.round(reverbAmount * 100)}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={reverbAmount}
                      onChange={(e) => setReverbAmount(parseFloat(e.target.value))}
                      style={{ 
                        width: '100%',
                        height: '4px',
                        borderRadius: '2px',
                        background: `linear-gradient(90deg, ${currentTheme.accent}, ${currentTheme.accent2})`,
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                </div>

                {/* Audio Player with Timeline */}
                <div style={{ 
                  background: currentTheme.cardBg,
                  backdropFilter: 'blur(12px)',
                  borderRadius: '24px',
                  border: `1px solid ${currentTheme.border}`,
                  padding: '1.5rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
                    {isPlaying ? '🌀 8D Mode Active 🌀' : '⚡ Ready to Transform ⚡'}
                  </div>
                  
                  {/* Timeline/Progress Bar */}
                  <div style={{ marginBottom: '1rem' }}>
                    <input
                      type="range"
                      min="0"
                      max={duration || 100}
                      value={currentTime}
                      onChange={seekAudio}
                      style={{ 
                        width: '100%',
                        height: '6px',
                        borderRadius: '3px',
                        background: `linear-gradient(90deg, ${currentTheme.accent}, ${currentTheme.accent2})`,
                        cursor: 'pointer'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.7 }}>
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                  
                  {/* Button Controls */}
                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {!isPlaying ? (
                      <button 
                        onClick={playAudio}
                        style={{
                          background: `linear-gradient(90deg, ${currentTheme.accent2}, ${currentTheme.accent})`,
                          border: 'none',
                          padding: '12px 28px',
                          borderRadius: '40px',
                          color: 'white',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}>
                        ▶ Play 8D Audio
                      </button>
                    ) : (
                      <button 
                        onClick={pauseAudio}
                        style={{
                          background: 'linear-gradient(90deg, #f59e0b, #ea580c)',
                          border: 'none',
                          padding: '12px 28px',
                          borderRadius: '40px',
                          color: 'white',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}>
                        ⏸ Pause
                      </button>
                    )}
                    
                    <button 
                      onClick={stopAudio}
                      style={{
                        background: 'linear-gradient(90deg, #ef4444, #dc2626)',
                        border: 'none',
                        padding: '12px 28px',
                        borderRadius: '40px',
                        color: 'white',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}>
                      ⏹ Stop
                    </button>
                    
                    <button 
                      onClick={downloadAudio}
                      style={{
                        background: `linear-gradient(90deg, ${currentTheme.accent}, ${currentTheme.accent2})`,
                        border: 'none',
                        padding: '12px 28px',
                        borderRadius: '40px',
                        color: 'white',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}>
                      💾 Download
                    </button>
                  </div>
                  
                  {/* Resume button (only shows when paused) */}
                  {audioContextRef.current && audioContextRef.current.state === 'suspended' && (
                    <div style={{ marginTop: '1rem' }}>
                      <button 
                        onClick={resumeAudio}
                        style={{
                          background: `linear-gradient(90deg, ${currentTheme.accent}, ${currentTheme.accent2})`,
                          border: 'none',
                          padding: '8px 20px',
                          borderRadius: '40px',
                          color: 'white',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}>
                        ▶ Resume Playback
                      </button>
                    </div>
                  )}
                  
                  <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: currentTheme.accent }}>
                    ✨ Use headphones for best 8D experience! ✨
                  </div>
                  
                  <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', opacity: 0.6 }}>
                    🎧 Audio spins Left ↔ Right in 360° space
                  </div>
                </div>
              </div>

              {/* 3D Visualizer */}
              <div style={{ 
                background: currentTheme.cardBg,
                backdropFilter: 'blur(12px)',
                borderRadius: '24px',
                border: `1px solid ${currentTheme.border}`,
                padding: '2rem',
                textAlign: 'center',
                minHeight: '450px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column'
              }}>
                <div style={{ 
                  width: '220px',
                  height: '220px',
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${currentTheme.visualizerBg}, transparent 80%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: isPlaying ? 'visualizerPulse 2s ease-in-out infinite' : 'none',
                  position: 'relative'
                }}>
                  {isPlaying && (
                    <>
                      <div style={{
                        position: 'absolute',
                        width: '180px',
                        height: '180px',
                        borderRadius: '50%',
                        border: `2px solid ${currentTheme.accent}`,
                        opacity: 0.3,
                        animation: 'spin 4s linear infinite'
                      }} />
                      <div style={{
                        position: 'absolute',
                        width: '140px',
                        height: '140px',
                        borderRadius: '50%',
                        border: `2px solid ${currentTheme.accent2}`,
                        opacity: 0.2,
                        animation: 'spin 3s linear infinite reverse'
                      }} />
                    </>
                  )}
                  
                  <div style={{ 
                    fontSize: '5.5rem',
                    animation: isPlaying ? 'headphoneSpin 3s ease-in-out infinite' : 'none',
                    display: 'inline-block',
                    lineHeight: 1,
                    textShadow: isPlaying ? `0 0 20px ${currentTheme.accent}` : 'none'
                  }}>
                    🎧
                  </div>
                </div>
                
                <p style={{ marginTop: '1.5rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
                  {isPlaying ? '🌀 8D Effect Active!' : '🎵 Upload & Play'}
                </p>
                <p style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '0.5rem' }}>
                  Sound rotates 360° around you
                </p>
                
                {isPlaying && (
                  <div style={{ 
                    display: 'flex', 
                    gap: '6px', 
                    marginTop: '1.5rem',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {[...Array(16)].map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: '3px',
                          height: '30px',
                          background: `linear-gradient(180deg, ${currentTheme.accent}, ${currentTheme.accent2})`,
                          borderRadius: '2px',
                          animation: 'waveBounce 0.8s ease-in-out infinite',
                          animationDelay: `${i * 0.05}s`
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button 
                onClick={() => {
                  stopAudio();
                  setAudioUrl(null);
                  setAudioFile(null);
                  setIsPlaying(false);
                  setCurrentTime(0);
                  setDuration(0);
                }}
                style={{
                  background: currentTheme.cardBg,
                  border: `1px solid ${currentTheme.border}`,
                  padding: '12px 28px',
                  borderRadius: '40px',
                  color: currentTheme.text,
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}>
                📁 Upload Different Song
              </button>
            </div>
          </>
        )}
        
        <footer style={{ textAlign: 'center', marginTop: '3rem', opacity: 0.5, fontSize: '0.8rem' }}>
          <p>✨ 8D Audio Effect - Stereo panning rotates left ↔ right with spatial filter ✨</p>
          <p>🎧 For best experience, use headphones/earbuds 🎧</p>
        </footer>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes headphoneSpin {
          0%, 100% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(10deg) scale(1.1); }
        }
        @keyframes visualizerPulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        @keyframes waveBounce {
          0%, 100% { transform: scaleY(0.3); opacity: 0.5; }
          50% { transform: scaleY(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}