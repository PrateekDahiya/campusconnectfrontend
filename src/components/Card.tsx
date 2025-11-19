import React from "react";

export default function Card({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`card p-4 rounded shadow ${className}`.trim()}>
            {children}
        </div>
    );
}
