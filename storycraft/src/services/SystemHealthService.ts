import { db, auth } from '../firebase';
import { collection, getDocs, query, where, limit, doc, getDoc, addDoc } from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';

export interface HealthIssue {
  id: string;
  type: 'critical' | 'warning' | 'info';
  component: string;
  message: string;
  timestamp: number;
  status: 'pending' | 'resolved';
}

export class SystemHealthService {
  private static instance: SystemHealthService;
  private isChecking: boolean = false;

  private constructor() {}

  static getInstance(): SystemHealthService {
    if (!SystemHealthService.instance) {
      SystemHealthService.instance = new SystemHealthService();
    }
    return SystemHealthService.instance;
  }

  async runFullCheck(): Promise<HealthIssue[]> {
    if (this.isChecking) return [];
    this.isChecking = true;
    const issues: HealthIssue[] = [];

    try {
      // 1. Check Firestore Connectivity
      try {
        await getDocs(query(collection(db, 'system_health'), limit(1)));
      } catch (err) {
        issues.push({
          id: `db-${Date.now()}`,
          type: 'critical',
          component: 'Database',
          message: `Firestore Connectivity Error: ${err instanceof Error ? err.message : String(err)}`,
          timestamp: Date.now(),
          status: 'pending'
        });
      }

      // 2. Check Gemini API Key
      const apiKey = ""; // Gemini API key check disabled in browser
      if (!apiKey) {
        issues.push({
          id: `ai-key-${Date.now()}`,
          type: 'critical',
          component: 'Creative Engine',
          message: 'Gemini API Key is missing or invalid.',
          timestamp: Date.now(),
          status: 'pending'
        });
      }

      // 3. Check Subscription Codes
      try {
        const codesSnap = await getDocs(query(collection(db, 'subscription_codes'), limit(1)));
        if (codesSnap.empty) {
          issues.push({
            id: `sub-codes-${Date.now()}`,
            type: 'warning',
            component: 'Billing',
            message: 'No subscription codes found in the system.',
            timestamp: Date.now(),
            status: 'pending'
          });
        }
      } catch (err) {
        // Ignore if just empty, but log if permission error
        if (err instanceof Error && err.message.includes('permission')) {
          issues.push({
            id: `sub-perm-${Date.now()}`,
            type: 'critical',
            component: 'Security',
            message: 'Permission denied accessing subscription codes.',
            timestamp: Date.now(),
            status: 'pending'
          });
        }
      }

      // 4. Check for unhandled feedback/bugs
      try {
        const feedbackSnap = await getDocs(query(collection(db, 'feedback'), where('status', '==', 'pending'), limit(10)));
        if (feedbackSnap.size > 5) {
          issues.push({
            id: `feedback-backlog-${Date.now()}`,
            type: 'info',
            component: 'Support',
            message: `There are ${feedbackSnap.size} pending feedback/bug reports.`,
            timestamp: Date.now(),
            status: 'pending'
          });
        }
      } catch (err) {}

      // 5. Check Global Settings
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
        if (!settingsDoc.exists()) {
          issues.push({
            id: `settings-missing-${Date.now()}`,
            type: 'critical',
            component: 'Configuration',
            message: 'Global settings document is missing from Firestore.',
            timestamp: Date.now(),
            status: 'pending'
          });
        }
      } catch (err) {}

      // 6. Check for Head Admins
      try {
        const adminsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'headadmin'), limit(1)));
        if (adminsSnap.empty) {
          issues.push({
            id: `no-head-admin-${Date.now()}`,
            type: 'warning',
            component: 'Security',
            message: 'No users found with the "headadmin" role.',
            timestamp: Date.now(),
            status: 'pending'
          });
        }
      } catch (err) {}

      // If critical issues found, notify head admin
      if (issues.some(i => i.type === 'critical')) {
        await this.notifyHeadAdmin(issues.filter(i => i.type === 'critical'));
      }

      return issues;
    } finally {
      this.isChecking = false;
    }
  }

  private async notifyHeadAdmin(criticalIssues: HealthIssue[]) {
    try {
      // Find head admins
      const adminsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'headadmin')));
      
      for (const adminDoc of adminsSnap.docs) {
        const adminData = adminDoc.data();
        // Create a notification for each head admin
        await addDoc(collection(db, `users/${adminDoc.id}/notifications`), {
          title: '🚨 SYSTEM CRITICAL ALERT',
          message: `The App Architect has detected ${criticalIssues.length} critical problems that require your immediate attention.`,
          type: 'system',
          read: false,
          createdAt: Date.now(),
          metadata: {
            issues: criticalIssues.map(i => ({ component: i.component, message: i.message }))
          }
        });
      }
    } catch (err) {
      console.error('Failed to notify head admin:', err);
    }
  }
}
