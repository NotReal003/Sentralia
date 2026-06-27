function getStatusMeta(status) {
  switch (status) {
    case 'APPROVED':
    case 'RESOLVED':
      return {
        color: '#22c55e',
        bgTint: 'rgba(34, 197, 94, 0.12)',
        glow: 'radial-gradient(circle at top, rgba(34, 197, 94, 0.18), transparent 60%)'
      };

    case 'DENIED':
      return {
        color: '#ef4444',
        bgTint: 'rgba(239, 68, 68, 0.12)',
        glow: 'radial-gradient(circle at top, rgba(239, 68, 68, 0.18), transparent 60%)'
      };

    case 'ESCALATED':
      return {
        color: '#f97316',
        bgTint: 'rgba(249, 115, 22, 0.12)',
        glow: 'radial-gradient(circle at top, rgba(249, 115, 22, 0.18), transparent 60%)'
      };

    case 'PENDING':
    case 'CANCELLED':
      return {
        color: '#6366f1',
        bgTint: 'rgba(99, 102, 241, 0.12)',
        glow: 'radial-gradient(circle at top, rgba(99, 102, 241, 0.18), transparent 60%)'
      };

    default:
      return {
        color: '#737373',
        bgTint: 'rgba(115, 115, 115, 0.12)',
        glow: 'none'
      };
  }
}

module.exports = getStatusMeta;
