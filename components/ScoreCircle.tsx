import React, { useEffect, useState } from 'react';

interface ScoreCircleProps {
    score: number;
}

const ScoreCircle: React.FC<ScoreCircleProps> = ({ score }) => {
    const [displayScore, setDisplayScore] = useState(0);

    useEffect(() => {
        const animationDuration = 1000; // ms
        const frameDuration = 1000 / 60; // 60fps
        const totalFrames = Math.round(animationDuration / frameDuration);
        let frame = 0;

        const counter = setInterval(() => {
            frame++;
            const progress = frame / totalFrames;
            const currentScore = Math.round(score * progress);
            setDisplayScore(currentScore);

            if (frame === totalFrames) {
                clearInterval(counter);
                setDisplayScore(score); 
            }
        }, frameDuration);

        return () => clearInterval(counter);
    }, [score]);


    const getScoreColor = (s: number) => {
        if (s < 50) return 'text-red-400';
        if (s < 75) return 'text-yellow-400';
        return 'text-green-400';
    };

    const size = 120;
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (displayScore / 100) * circumference;
    const colorClass = getScoreColor(score);
    const strokeColor = colorClass.replace('text-', 'stroke-');

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                <circle
                    className="stroke-gray-700"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    className={`${strokeColor} transition-all duration-1000 ease-out`}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
            </svg>
            <span className={`absolute text-3xl font-bold ${colorClass}`}>
                {displayScore}
            </span>
        </div>
    );
};

export default ScoreCircle;
