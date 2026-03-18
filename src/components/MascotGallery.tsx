import React from 'react';
import mascotAnalysis from '../assets/mascot_analysis.png';
import mascotBot from '../assets/mascot_bot.png';
import mascotLucia from '../assets/mascot_lucia.png';

type MascotVariant = 'analysis' | 'bot' | 'lucia';

interface MascotProps {
    variant: MascotVariant;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

const MASCOTS = {
    analysis: {
        src: mascotAnalysis,
        name: 'ARIA',
        title: 'Analyst_Prime',
        color: 'var(--color-flare-alt)',
        glow: 'rgba(191, 0, 255, 0.5)',
    },
    bot: {
        src: mascotBot,
        name: 'NEXUS',
        title: 'Bot_Tactician',
        color: 'var(--color-long)',
        glow: 'rgba(0, 240, 255, 0.5)',
    },
    lucia: {
        src: mascotLucia,
        name: 'LUCIA',
        title: 'Alpha_Legend',
        color: 'var(--color-flare)',
        glow: 'rgba(255, 0, 255, 0.5)',
    },
};

const SIZE_CLASSES = {
    sm: 'w-24 h-24',
    md: 'w-40 h-40',
    lg: 'w-56 h-56',
};

export const Mascot: React.FC<MascotProps> = ({ variant, className = '', size = 'md' }) => {
    const mascot = MASCOTS[variant];
    return (
        <div className={`relative flex flex-col items-center ${className}`}>
            {/* Neon ambient glow behind mascot - optimized blur */}
            <div
                className="absolute inset-0 rounded-full blur-xl opacity-20 anime-float pointer-events-none"
                style={{ background: mascot.glow, animationDelay: '0.5s' }}
            ></div>

            {/* Mascot image */}
            <img
                src={mascot.src}
                alt={mascot.name}
                className={`relative z-10 object-contain anime-float mascot-enter ${SIZE_CLASSES[size]}`}
                style={{
                    filter: `drop-shadow(0 0 12px ${mascot.glow})`,
                    mixBlendMode: 'screen',
                }}
            />

            {/* Name tag */}
            <div className="relative z-10 mt-1 px-3 py-1 rounded-[2px] border text-center"
                style={{ borderColor: mascot.color, background: `rgba(0,0,0,0.6)` }}>
                <p className="font-kanit text-[10px] font-extrabold tracking-[0.1em] uppercase"
                    style={{ color: mascot.color, textShadow: `0 0 8px ${mascot.glow}` }}>
                    {mascot.name}
                </p>
                <p className="font-inter text-[8px] text-white/40 uppercase tracking-widest font-medium">{mascot.title}</p>
            </div>
        </div>
    );
};

// Sidebar compact mascot (just the image, no label)
export const MascotIcon: React.FC<{ variant: MascotVariant; className?: string }> = ({ variant, className = '' }) => {
    const mascot = MASCOTS[variant];
    return (
        <img
            src={mascot.src}
            alt={mascot.name}
            className={`object-contain anime-float ${className}`}
            style={{
                filter: `drop-shadow(0 0 16px ${mascot.glow})`,
                mixBlendMode: 'screen',
            }}
        />
    );
};
