export function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatQuantity(quantity: number): string {
  return quantity > 1 ? `×${quantity}` : '';
}

export function formatPriority(
  priority: 'essential' | 'recommended' | 'optional',
): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}
