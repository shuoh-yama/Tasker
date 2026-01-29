import React from 'react';

export const renderContentWithMentions = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(@[^\s　]+)/g);
    return parts.map((part, index) => {
        if (part.startsWith('@')) {
            return <span key={index} className="text-blue-400 font-bold">{part}</span>;
        }
        return part;
    });
};
