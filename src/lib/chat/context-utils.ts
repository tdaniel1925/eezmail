/**
 * Context Manager Utils
 * Pure utility functions for entity extraction
 */

/**
 * Extract entities from a message
 */
export function extractEntities(
  message: string,
  searchResults?: any
): Array<{ type: string; id: string; name: string }> {
  const entities: Array<{ type: string; id: string; name: string }> = [];

  // If we have search results, extract entities from them
  if (searchResults) {
    if (searchResults.emails?.results) {
      searchResults.emails.results.forEach((email: any) => {
        entities.push({
          type: 'email',
          id: email.id,
          name: email.subject || 'Untitled',
        });
      });
    }

    if (searchResults.contacts?.results) {
      searchResults.contacts.results.forEach((contact: any) => {
        entities.push({
          type: 'contact',
          id: contact.id,
          name: contact.displayName || contact.email,
        });
      });
    }

    if (searchResults.calendar?.results) {
      searchResults.calendar.results.forEach((event: any) => {
        entities.push({
          type: 'calendar',
          id: event.id,
          name: event.title || 'Untitled Event',
        });
      });
    }

    if (searchResults.tasks?.results) {
      searchResults.tasks.results.forEach((task: any) => {
        entities.push({
          type: 'task',
          id: task.id,
          name: task.title || 'Untitled Task',
        });
      });
    }
  }

  return entities;
}
