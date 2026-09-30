"use client";

import React, { useState } from "react";
import { ArrowRight, ArrowLeft, Mail, X, Users } from "lucide-react";
import { useOnboardingStore } from "../../store";

export function OnboardingTeamView() {
  const { setStep, invitedEmails, addInvite, removeInvite } = useOnboardingStore();
  const [emailInput, setEmailInput] = useState("");

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim() && emailInput.includes('@') && !invitedEmails.includes(emailInput)) {
      addInvite(emailInput.trim());
      setEmailInput("");
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full animate-in slide-in-from-right-8 duration-500 fade-in px-8 py-10 bg-card border border-border rounded-xl shadow-xl shadow-black/5">
      
      <div className="flex flex-col gap-3 text-center items-center">
        <div className="size-12 bg-muted rounded-full flex items-center justify-center mb-2 border border-border">
          <Users className="size-6 text-foreground" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Invite Your Mission Control Team
        </h1>
        <p className="text-muted-foreground text-[15px] max-w-md">
          Bring your core team into Mission Control. They will inherit Admin permissions automatically during Beta.
        </p>
      </div>

      <div className="flex flex-col gap-6 mt-4">
        
        <form onSubmit={handleAddEmail} className="flex flex-col gap-2">
          <label className="text-[13px] font-semibold text-foreground uppercase tracking-wider">
            Team Member Email
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <input 
                type="email" 
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="colleague@company.com" 
                className="w-full bg-background border border-border rounded-md pl-10 pr-4 py-2.5 text-[14px] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-foreground"
                autoFocus
              />
            </div>
            <button 
              type="submit"
              disabled={!emailInput.includes('@')}
              className="bg-muted text-foreground px-4 py-2 rounded-md font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </form>

        {/* Invited List */}
        {invitedEmails.length > 0 && (
          <div className="flex flex-col gap-2 bg-background border border-border rounded-md p-2">
            {invitedEmails.map(email => (
              <div key={email} className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-sm">
                <span className="text-[14px] text-foreground font-medium">{email}</span>
                <button 
                  onClick={() => removeInvite(email)}
                  className="text-muted-foreground hover:text-red-500 transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}

      </div>

      <div className="flex justify-between mt-4 pt-6 border-t border-border">
        <button 
          onClick={() => setStep('identity')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium px-4 py-2 transition-colors"
        >
          <ArrowLeft className="size-4" /> Back to Dhyra
        </button>
        <button 
          onClick={() => setStep('connectors')}
          className="flex items-center gap-2 bg-foreground text-background font-medium px-6 py-2.5 rounded-md hover:opacity-90 transition-opacity"
        >
          {invitedEmails.length > 0 ? "Continue to Connectors" : "Skip to Connectors"} <ArrowRight className="size-4" />
        </button>
      </div>

    </div>
  );
}
