import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  get client(): SupabaseClient {
    return this.supabase;
  }

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    
    // Check active session
    this.supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        this.currentUserSubject.next(session.user);
      }
    });

    // Listen for auth changes
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.currentUserSubject.next(session?.user ?? null);
    });
  }

  get currentUser(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  async signIn(email: string, password: string):Promise<{data: any, error: any}> {
    return await this.supabase.auth.signInWithPassword({ email, password });
  }

  async signUp(email: string, password: string):Promise<{data: any, error: any}> {
    return await this.supabase.auth.signUp({ email, password });
  }

  async updateUser(attributes: any): Promise<{data: any, error: any}> {
    return await this.supabase.auth.updateUser(attributes);
  }

  async signOut() {
    return await this.supabase.auth.signOut();
  }
}
