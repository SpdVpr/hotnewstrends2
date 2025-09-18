import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';

export interface ArticleGenerationJob {
  id: string;
  trendId: string;
  trend: any; // TrackedTrend type
  status: 'pending' | 'generating' | 'completed' | 'failed' | 'quality_check' | 'rejected';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  scheduledAt?: string;
  position: number;
  error?: string;
  articleId?: string;
  template?: string;
  qualityScore?: any;
  retryCount?: number;
}

export interface DailyPlan {
  date: string; // YYYY-MM-DD format
  jobs: ArticleGenerationJob[];
  createdAt: string;
  updatedAt: string;
}

class FirebaseDailyPlansService {
  private readonly COLLECTION_NAME = 'daily_plans';
  private readonly JOBS_COLLECTION_NAME = 'automation_jobs';

  /**
   * Get daily plan for a specific date
   */
  async getDailyPlan(date: string): Promise<DailyPlan | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, date);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          date: data.date,
          jobs: data.jobs || [],
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting daily plan:', error);
      return null;
    }
  }

  /**
   * Store/update daily plan for a specific date
   */
  async storeDailyPlan(plan: DailyPlan): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, plan.date);
      
      await setDoc(docRef, {
        date: plan.date,
        jobs: plan.jobs,
        createdAt: plan.createdAt,
        updatedAt: new Date().toISOString(),
        lastModified: serverTimestamp()
      }, { merge: true });

      console.log(`✅ Daily plan stored for ${plan.date}`);
    } catch (error) {
      console.error('Error storing daily plan:', error);
      throw error;
    }
  }

  /**
   * Update a specific job in the daily plan
   */
  async updateJobInPlan(date: string, updatedJob: ArticleGenerationJob): Promise<void> {
    try {
      const plan = await this.getDailyPlan(date);
      if (!plan) {
        console.warn(`No daily plan found for ${date}`);
        return;
      }

      const jobIndex = plan.jobs.findIndex(job => job.id === updatedJob.id);
      if (jobIndex === -1) {
        console.warn(`Job ${updatedJob.id} not found in daily plan for ${date}`);
        return;
      }

      plan.jobs[jobIndex] = updatedJob;
      plan.updatedAt = new Date().toISOString();

      await this.storeDailyPlan(plan);
      console.log(`✅ Job ${updatedJob.id} updated in daily plan for ${date}`);
    } catch (error) {
      console.error('Error updating job in plan:', error);
      throw error;
    }
  }

  /**
   * Get current daily plan (today's plan)
   */
  async getCurrentDailyPlan(): Promise<DailyPlan | null> {
    const today = new Date().toISOString().split('T')[0];
    return this.getDailyPlan(today);
  }

  /**
   * Get recent daily plans
   */
  async getRecentDailyPlans(limitCount: number = 7): Promise<DailyPlan[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        orderBy('date', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const plans: DailyPlan[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        plans.push({
          date: data.date,
          jobs: data.jobs || [],
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });

      return plans;
    } catch (error) {
      console.error('Error getting recent daily plans:', error);
      return [];
    }
  }

  /**
   * Store individual job (for legacy compatibility)
   */
  async storeJob(job: ArticleGenerationJob): Promise<void> {
    try {
      const docRef = doc(db, this.JOBS_COLLECTION_NAME, job.id);
      
      await setDoc(docRef, {
        ...job,
        lastModified: serverTimestamp()
      }, { merge: true });

      console.log(`✅ Job ${job.id} stored`);
    } catch (error) {
      console.error('Error storing job:', error);
      throw error;
    }
  }

  /**
   * Get stored jobs (for legacy compatibility)
   */
  async getStoredJobs(limitCount: number = 100): Promise<ArticleGenerationJob[]> {
    try {
      const q = query(
        collection(db, this.JOBS_COLLECTION_NAME),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const jobs: ArticleGenerationJob[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        jobs.push({
          id: data.id,
          trendId: data.trendId,
          trend: data.trend,
          status: data.status,
          createdAt: data.createdAt,
          startedAt: data.startedAt,
          completedAt: data.completedAt,
          scheduledAt: data.scheduledAt,
          position: data.position,
          error: data.error,
          articleId: data.articleId,
          template: data.template,
          qualityScore: data.qualityScore,
          retryCount: data.retryCount || 0
        });
      });

      return jobs;
    } catch (error) {
      console.error('Error getting stored jobs:', error);
      return [];
    }
  }

  /**
   * Update job status
   */
  async updateJob(updatedJob: ArticleGenerationJob): Promise<void> {
    try {
      // Update in jobs collection
      await this.storeJob(updatedJob);

      // Also update in daily plan if it's part of today's plan
      const today = new Date().toISOString().split('T')[0];
      await this.updateJobInPlan(today, updatedJob);
    } catch (error) {
      console.error('Error updating job:', error);
      throw error;
    }
  }

  /**
   * Delete old daily plans (cleanup)
   */
  async cleanupOldPlans(daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('date', '<', cutoffDateStr)
      );

      const querySnapshot = await getDocs(q);
      
      for (const docSnap of querySnapshot.docs) {
        await docSnap.ref.delete();
      }

      console.log(`✅ Cleaned up ${querySnapshot.size} old daily plans`);
    } catch (error) {
      console.error('Error cleaning up old plans:', error);
    }
  }
}

export const firebaseDailyPlansService = new FirebaseDailyPlansService();
export default firebaseDailyPlansService;
