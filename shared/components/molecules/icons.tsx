"use client";
import React from "react";
import * as Icons from "lucide-react";

export default function IconsPage() {
  const iconNames = Object.keys(Icons).filter(k => typeof (Icons as any)[k] === "function");
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Lucide Icons</h1>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
        {iconNames.map((name) => {
          const Icon = (Icons as any)[name];
          return (
            <div key={name} className="bg-white rounded-lg p-3 flex flex-col items-center gap-2 shadow">
              <Icon className="w-6 h-6" />
              <div className="text-xs text-center break-words">{name}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
