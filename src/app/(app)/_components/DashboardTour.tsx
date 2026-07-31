"use client";

import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const TOUR_STEPS = [
  {
    id: "accounts",
    selector: 'a[href="/accounts"]',
    text: "Connect your email accounts to start sending.",
    side: "right" as const,
  },
  {
    id: "templates",
    selector: 'a[href="/templates"]',
    text: "Draft your email sequences and variants.",
    side: "right" as const,
  },
  {
    id: "audience",
    selector: 'a[href="/audience"]',
    text: "Import your contacts and target audience.",
    side: "right" as const,
  },
  {
    id: "campaigns",
    selector: 'a[href="/campaigns"]',
    text: "Launch and orchestrate your outreach.",
    side: "right" as const,
  },
  {
    id: "inbox",
    selector: 'a[href="/inbox"]',
    text: "Manage and respond to prospect replies in real-time.",
    side: "right" as const,
  },
];

const STORAGE_KEY = "freezymails_tour_completed";

export function DashboardTour({ forceOpen, onCloseForce }: { forceOpen?: boolean, onCloseForce?: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const initTimer = setTimeout(() => {
      setMounted(true);
      const hasSeenTour = localStorage.getItem(STORAGE_KEY) === "true";
      if (!hasSeenTour || forceOpen) {
        setIsOpen(true);
        if (forceOpen) setStepIndex(0);
      }
    }, 0);

    return () => clearTimeout(initTimer);
  }, [forceOpen]);

  useEffect(() => {
    if (!isOpen || !mounted) return;

    let animationFrameId: number;

    const updatePosition = () => {
      setIsMobile(window.innerWidth < 768);
      const step = TOUR_STEPS[stepIndex];
      const el = document.querySelector(step.selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect((prev) => {
          if (
            !prev ||
            prev.top !== rect.top ||
            prev.left !== rect.left ||
            prev.width !== rect.width ||
            prev.height !== rect.height
          ) {
            return rect;
          }
          return prev;
        });
      }
      animationFrameId = requestAnimationFrame(updatePosition);
    };

    updatePosition();
    return () => cancelAnimationFrame(animationFrameId);
  }, [stepIndex, isOpen, mounted]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, "true");
    if (onCloseForce) onCloseForce();
  };

  const handleNext = () => {
    if (stepIndex < TOUR_STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      handleClose();
    }
  };

  if (!mounted || !isOpen || !targetRect) return null;

  const currentStep = TOUR_STEPS[stepIndex];

  return (
    <>
      {/* Click blocker overlay */}
      <div 
        className="fixed inset-0 z-[80] bg-transparent" 
        onClick={(e) => {
          e.stopPropagation();
          handleClose();
        }}
      />
      
      {/* Visual Highlight with backdrop shadow */}
      <motion.div
        initial={false}
        animate={{
          top: targetRect.top - 4,
          left: targetRect.left - 4,
          width: targetRect.width + 8,
          height: targetRect.height + 8,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed pointer-events-none z-[90] rounded-lg border-2 border-primary-base/80"
        style={{
          boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.45)",
        }}
      />

      <Popover open={isOpen} onOpenChange={(open) => !open && handleClose()} modal={false}>
        <PopoverTrigger asChild>
          <div
            className="fixed pointer-events-none z-[95]"
            style={{
              top: targetRect.top,
              left: targetRect.left,
              width: targetRect.width,
              height: targetRect.height,
            }}
          />
        </PopoverTrigger>
        <PopoverContent
          side={isMobile ? "bottom" : currentStep.side}
          sideOffset={isMobile ? 16 : 24}
          align={isMobile ? "center" : "start"}
          className="w-[280px] p-5 shadow-2xl z-[100] border border-border-subtle/50 bg-bg-base rounded-xl overflow-hidden"
          onInteractOutside={(e) => { e.preventDefault(); }}
          onEscapeKeyDown={handleClose}
        >
          {/* Subtle gradient background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-base/5 to-transparent pointer-events-none" />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, x: isMobile ? 0 : 10, y: isMobile ? 10 : 0 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: isMobile ? 0 : -10, y: isMobile ? -10 : 0 }}
              transition={{ duration: 0.2 }}
              className="relative flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <h4 className="text-[15px] font-semibold text-text-primary capitalize tracking-tight flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary-base/10 text-primary-base flex items-center justify-center text-xs">
                    {stepIndex + 1}
                  </span>
                  {currentStep.id}
                </h4>
                <p className="text-[14px] text-text-muted leading-relaxed font-sans">
                  {currentStep.text}
                </p>
              </div>
              
              <div className="flex items-center justify-between mt-2 pt-4 border-t border-border-subtle/50">
                <div className="flex gap-1">
                  {TOUR_STEPS.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === stepIndex ? "w-4 bg-primary-base" : "w-1.5 bg-border-subtle"}`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 text-xs font-medium text-text-muted hover:text-text-primary">
                    Skip
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleNext} className="h-8 text-xs font-medium px-4 shadow-md shadow-primary-base/20">
                    {stepIndex === TOUR_STEPS.length - 1 ? "Got it" : "Next"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </PopoverContent>
      </Popover>
    </>
  );
}
