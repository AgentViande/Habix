import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Quote, Lightbulb } from 'lucide-react';
import { getDailyQuote, getRandomQuote, type QuoteOrTip } from '../../data/quotes';
import { useSettingsStore } from '../../stores/useSettingsStore';

export interface DailyQuoteProps {
  today: string;
}

export const DailyQuote: React.FC<DailyQuoteProps> = ({ today }) => {
  const { settings } = useSettingsStore();
  const [activeItem, setActiveItem] = useState<QuoteOrTip | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isCustomShuffle, setIsCustomShuffle] = useState(false);

  useEffect(() => {
    const daily = getDailyQuote(today);
    setActiveItem(daily.quote);
    setCurrentIndex(daily.index);
    setIsCustomShuffle(false);
  }, [today]);

  if (!settings.showDailyQuote || !activeItem) {
    return null;
  }

  const handleShuffle = () => {
    const random = getRandomQuote(currentIndex);
    setActiveItem(random.quote);
    setCurrentIndex(random.index);
    setIsCustomShuffle(true);
  };

  const handleResetToDaily = () => {
    const daily = getDailyQuote(today);
    setActiveItem(daily.quote);
    setCurrentIndex(daily.index);
    setIsCustomShuffle(false);
  };

  const isTip = activeItem.type === 'conseil';

  return (
    <div className="relative group px-4 py-3 rounded-2xl bg-[var(--bg-secondary)]/70 border border-[var(--border-subtle)]/70 hover:border-indigo-500/30 transition-all backdrop-blur-sm shadow-sm overflow-hidden">
      {/* Subtle background ambient tint */}
      <div className="absolute -right-10 -bottom-10 w-28 h-28 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
              isTip ? 'bg-amber-500/15 text-amber-400' : 'bg-indigo-500/15 text-indigo-400'
            }`}
          >
            {isTip ? <Lightbulb className="w-3.5 h-3.5" /> : <Quote className="w-3.5 h-3.5" />}
          </div>

          <div className="min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentIndex}-${activeItem.texte.substring(0, 10)}`}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.2 }}
              >
                <p className="text-xs sm:text-[13px] text-[var(--text-secondary)] italic font-medium leading-relaxed">
                  « {activeItem.texte} »
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-semibold text-[var(--text-muted)] tracking-wide">
                    {isTip ? 'Conseil Habix' : activeItem.auteur || 'Anonyme'}
                  </span>
                  {isCustomShuffle && (
                    <button
                      onClick={handleResetToDaily}
                      className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                      title="Revenir à la citation du jour"
                    >
                      (revenir à la citation du jour)
                    </button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Shuffle Button */}
        <button
          onClick={handleShuffle}
          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-indigo-400 hover:bg-[var(--bg-tertiary)] transition-colors flex-shrink-0 opacity-70 group-hover:opacity-100"
          title="Découvrir une autre citation ou un autre conseil"
          aria-label="Tirer une autre citation"
        >
          <RefreshCw className="w-3.5 h-3.5 hover:rotate-180 transition-transform duration-300" />
        </button>
      </div>
    </div>
  );
};
