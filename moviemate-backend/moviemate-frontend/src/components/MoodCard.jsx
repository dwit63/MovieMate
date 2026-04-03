export default function MoodCard({ mood, emoji, color, isSelected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200
        ${isSelected
          ? 'border-accent bg-accent/10 scale-105'
          : 'border-dark-border bg-dark-card hover:bg-dark-hover hover:border-dark-hover hover:scale-105'
        }`}
    >
      <span className="text-3xl">{emoji}</span>
      <span className="text-white text-sm font-medium">{mood}</span>
      <div
        className="w-8 h-0.5 rounded-full"
        style={{ backgroundColor: color }}
      />
    </button>
  );
}
