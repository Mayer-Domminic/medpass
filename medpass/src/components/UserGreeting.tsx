'use client';
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface UserGreetingProps {
    className?: string;
}

const UserGreeting: React.FC<UserGreetingProps> = ({ className = "" }) => {
    const { data: session, status } = useSession();
    const username = session?.user?.username || "Guest";
    const [emoji, setEmoji] = useState<string>("");

    const coolestMedicalEmojis = ["⚕️","🩺", "💉", "💊", "🧠", "❤️", "🔬", "📚", "🎓", "📝", "📊", "🧪", "👨‍⚕️", "👩‍⚕️", "🏥", "🧬", "🔍", "📋", ];

        // Set random emoji on component mount or when session changes
        useEffect(() => {
            const randomIndex = Math.floor(Math.random() * coolestMedicalEmojis.length);
            setEmoji(coolestMedicalEmojis[randomIndex]);
        }, [session]); // Re-randomize when session changes

    return (
        <div className={className}>
            <span className="text-xl font-bold">{username}</span> {emoji}
        </div>
    );
};

export default UserGreeting;