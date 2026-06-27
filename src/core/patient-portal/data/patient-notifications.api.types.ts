/**
 * Wire shapes for the patient notifications endpoints. Mirror the backend
 * `PatientNotificationDto` and the paginated envelope (which carries `unreadCount`).
 */

export interface ApiPatientNotification {
  id: string;
  category: string;
  title: string;
  description: string;
  navigate_to: string | null;
  is_read: boolean;
  read_at: string | null;
  metadata?: Record<string, unknown> | null;
  /** ISO timestamp. */
  created_at: string;
}

export interface ApiPatientNotificationsResponse {
  data: ApiPatientNotification[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    unreadCount: number;
  };
}
