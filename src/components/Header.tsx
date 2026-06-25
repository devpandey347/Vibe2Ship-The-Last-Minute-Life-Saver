import React from "react";
import { UserProfile } from "../types";
import { GsiButton } from "./GsiButton";
import { LogOut, Calendar, Zap, RefreshCw } from "lucide-react";

interface HeaderProps {
  user: UserProfile | null;
  onLogin: () => void;
  onLogout: () => void;
  isLoggingIn: boolean;
  calendarSynced: boolean;
  onRefreshTasks?: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogin,
  onLogout,
  isLoggingIn,
  calendarSynced,
  onRefreshTasks,
  isRefreshing
}) => {
  return (
    <header className="bg-white/85 border-b border-slate-200/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 shadow-sm" id="app-header">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-cyan-500 to-indigo-600 p-2.5 rounded-xl shadow-md shadow-indigo-200">
            <Zap className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div className="text-left">
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-600 via-indigo-600 to-indigo-800 bg-clip-text text-transparent">
              Vibe2Ship
            </h1>
            <p className="text-[10px] font-semibold text-slate-500 tracking-wide uppercase">AI Task Orchestration & Google Calendar</p>
          </div>
        </div>

        {/* Dynamic Status / Actions */}
        <div className="flex items-center gap-3.5 flex-wrap justify-center">
          
          {/* Calendar Synced Indicator */}
          {user && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              calendarSynced 
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${calendarSynced ? "bg-emerald-500" : "bg-amber-500"}`}></span>
              <Calendar className="w-3.5 h-3.5" />
              <span>{calendarSynced ? "Google Calendar Connected" : "Calendar Not Synced"}</span>
            </div>
          )}

          {/* Refresh tasks button */}
          {user && onRefreshTasks && (
            <button
              onClick={onRefreshTasks}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
              title="Sync / Refresh tasks"
              id="refresh-tasks-btn"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          )}

          {/* Login or user profile info */}
          {user ? (
            <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-sm">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  className="w-7 h-7 rounded-full border border-indigo-200 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 text-xs border border-indigo-100">
                  {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                </div>
              )}
              
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
                  {user.displayName || "User"}
                </p>
                <p className="text-[10px] text-slate-500 truncate max-w-[120px]">
                  {user.email}
                </p>
              </div>

              <button
                onClick={onLogout}
                className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all cursor-pointer border border-transparent hover:border-rose-100"
                title="Log out"
                id="logout-btn"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <GsiButton onClick={onLogin} isLoading={isLoggingIn} />
          )}

        </div>
      </div>
    </header>
  );
};
