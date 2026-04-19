/**
 * StatCard.jsx
 * Reusable dashboard metric card.
 *
 * Props:
 *   icon    {string}  – emoji or character
 *   label   {string}  – descriptive label
 *   value   {any}     – metric value to display
 *   color   {string}  – hex accent colour (default indigo)
 *   loading {bool}    – show skeleton animation
 *
 * Member 4 – StatCard Component
 */

export default function StatCard({ icon, label, value, color = '#6366f1', loading = false }) {
  if (loading) {
    return <div className="sc__skeleton" />;
  }

  const softBg = color + '1a'; // ~10% opacity tint

  return (
    <div className="sc" style={{ borderTop: `4px solid ${color}` }}>
      <div className="sc__icon-wrap" style={{ background: softBg, color }}>
        <span className="sc__icon">{icon}</span>
      </div>
      <div className="sc__body">
        <p className="sc__label">{label}</p>
        <p className="sc__value">{value ?? '—'}</p>
      </div>
    </div>
  );
}
