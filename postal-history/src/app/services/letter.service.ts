import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { Letter, Postmark, RouteSegment, CityStat, DurationStat, RouteVersion } from '../models/letter.model';

const STORAGE_KEY = 'postal_history_letters';

@Injectable({
  providedIn: 'root'
})
export class LetterService {
  private lettersSubject = new BehaviorSubject<Letter[]>([]);
  letters$ = this.lettersSubject.asObservable();

  constructor() {
    this.loadLetters();
  }

  private loadLetters(): void {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        let letters = JSON.parse(stored);
        letters = letters.map((l: Letter) => this.migrateLegacyLetter(l));
        this.lettersSubject.next(letters);
        this.saveLetters(letters);
      } catch {
        const sampleLetters = this.getSampleLetters();
        this.lettersSubject.next(sampleLetters);
        this.saveLetters(sampleLetters);
      }
    } else {
      const sampleLetters = this.getSampleLetters();
      this.lettersSubject.next(sampleLetters);
      this.saveLetters(sampleLetters);
    }
  }

  private getSampleLetters(): Letter[] {
    const now = new Date().toISOString();
    return [
      {
        id: 'sample1',
        title: '1905年上海寄北京红印花封',
        description: '清代红印花加盖邮票实寄封，经天津中转',
        postmarks: [],
        versions: [
          {
            id: 'v1-sample1',
            letterId: 'sample1',
            name: '方案A：天津中转',
            description: '经天津海关中转，主流观点',
            isOfficial: true,
            postmarks: [
              {
                id: 's1-v1-1',
                letterId: 'sample1',
                type: 'origin',
                locationName: '上海',
                latitude: 31.2304,
                longitude: 121.4737,
                postmarkDate: '1905-03-15',
                clarity: 'clear',
                notes: '上海工部局书信馆邮戳',
                sequence: 0,
                locationPrecision: 'exact'
              },
              {
                id: 's1-v1-2',
                letterId: 'sample1',
                type: 'transit',
                locationName: '天津',
                latitude: 39.0842,
                longitude: 117.2008,
                postmarkDate: '1905-03-20',
                clarity: 'partial',
                notes: '天津海关中转戳',
                sequence: 1,
                locationPrecision: 'exact'
              },
              {
                id: 's1-v1-3',
                letterId: 'sample1',
                type: 'destination',
                locationName: '北京',
                latitude: 39.9042,
                longitude: 116.4074,
                postmarkDate: '1905-03-22',
                clarity: 'clear',
                notes: '北京到达戳',
                sequence: 2,
                locationPrecision: 'exact'
              }
            ],
            createdAt: now,
            updatedAt: now
          },
          {
            id: 'v2-sample1',
            letterId: 'sample1',
            name: '方案B：经济南绕行',
            description: '有学者认为经济南中转，路程更长',
            isOfficial: false,
            postmarks: [
              {
                id: 's1-v2-1',
                letterId: 'sample1',
                type: 'origin',
                locationName: '上海',
                latitude: 31.2304,
                longitude: 121.4737,
                postmarkDate: '1905-03-15',
                clarity: 'clear',
                notes: '上海工部局书信馆邮戳',
                sequence: 0,
                locationPrecision: 'exact'
              },
              {
                id: 's1-v2-2',
                letterId: 'sample1',
                type: 'transit',
                locationName: '南京',
                latitude: 32.0603,
                longitude: 118.7969,
                postmarkDate: '1905-03-17',
                clarity: 'fuzzy',
                notes: '南京中转，戳记模糊存疑',
                sequence: 1,
                locationPrecision: 'exact'
              },
              {
                id: 's1-v2-3',
                letterId: 'sample1',
                type: 'transit',
                locationName: '济南',
                latitude: 36.6512,
                longitude: 117.1201,
                postmarkDate: null,
                clarity: 'fuzzy',
                notes: '济南中转，日期不可考',
                sequence: 2,
                locationPrecision: 'approximate'
              },
              {
                id: 's1-v2-4',
                letterId: 'sample1',
                type: 'transit',
                locationName: '天津',
                latitude: 39.0842,
                longitude: 117.2008,
                postmarkDate: '1905-03-21',
                clarity: 'partial',
                notes: '天津海关中转戳',
                sequence: 3,
                locationPrecision: 'exact'
              },
              {
                id: 's1-v2-5',
                letterId: 'sample1',
                type: 'destination',
                locationName: '北京',
                latitude: 39.9042,
                longitude: 116.4074,
                postmarkDate: '1905-03-22',
                clarity: 'clear',
                notes: '北京到达戳',
                sequence: 4,
                locationPrecision: 'exact'
              }
            ],
            createdAt: now,
            updatedAt: now
          }
        ],
        officialVersionId: 'v1-sample1',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'sample2',
        title: '1912年广州寄汉口封',
        description: '民国初年帆船邮票实寄封，经长沙中转',
        postmarks: [
          {
            id: 's2-1',
            letterId: 'sample2',
            type: 'origin',
            locationName: '广州',
            latitude: 23.1291,
            longitude: 113.2644,
            postmarkDate: '1912-08-05',
            clarity: 'clear',
            notes: '广州府邮戳',
            sequence: 0
          },
          {
            id: 's2-2',
            letterId: 'sample2',
            type: 'transit',
            locationName: '长沙',
            latitude: 28.2282,
            longitude: 112.9388,
            postmarkDate: '1912-08-10',
            clarity: 'fuzzy',
            notes: '长沙中转，戳记模糊',
            sequence: 1
          },
          {
            id: 's2-3',
            letterId: 'sample2',
            type: 'destination',
            locationName: '汉口',
            latitude: 30.5928,
            longitude: 114.3055,
            postmarkDate: '1912-08-14',
            clarity: 'clear',
            notes: '汉口到达戳',
            sequence: 2
          }
        ],
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'sample3',
        title: '1925年北平寄南京封',
        description: '民国中期孙中山像邮票实寄封，经济南、徐州中转',
        postmarks: [
          {
            id: 's3-1',
            letterId: 'sample3',
            type: 'origin',
            locationName: '北平',
            latitude: 39.9042,
            longitude: 116.4074,
            postmarkDate: '1925-11-02',
            clarity: 'clear',
            notes: '北平寄出',
            sequence: 0
          },
          {
            id: 's3-2',
            letterId: 'sample3',
            type: 'transit',
            locationName: '天津',
            latitude: 39.0842,
            longitude: 117.2008,
            postmarkDate: '1925-11-03',
            clarity: 'clear',
            notes: '天津中转',
            sequence: 1
          },
          {
            id: 's3-3',
            letterId: 'sample3',
            type: 'transit',
            locationName: '济南',
            latitude: 36.6512,
            longitude: 117.1201,
            postmarkDate: '1925-11-05',
            clarity: 'partial',
            notes: '济南中转',
            sequence: 2
          },
          {
            id: 's3-4',
            letterId: 'sample3',
            type: 'transit',
            locationName: '徐州',
            latitude: 34.2608,
            longitude: 117.1845,
            postmarkDate: null,
            clarity: 'fuzzy',
            notes: '徐州中转，日期不清',
            sequence: 3
          },
          {
            id: 's3-5',
            letterId: 'sample3',
            type: 'destination',
            locationName: '南京',
            latitude: 32.0603,
            longitude: 118.7969,
            postmarkDate: '1925-11-10',
            clarity: 'clear',
            notes: '南京到达',
            sequence: 4
          }
        ],
        createdAt: now,
        updatedAt: now
      }
    ];
  }

  private saveLetters(letters: Letter[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(letters));
    this.lettersSubject.next(letters);
  }

  getLetters(): Letter[] {
    return this.lettersSubject.value;
  }

  getLetterById(id: string): Letter | undefined {
    return this.lettersSubject.value.find(l => l.id === id);
  }

  getLetterById$(id: string): Observable<Letter | undefined> {
    return this.letters$.pipe(
      map(letters => letters.find(l => l.id === id))
    );
  }

  addLetter(letter: Omit<Letter, 'id' | 'createdAt' | 'updatedAt'>): Letter {
    const newLetter: Letter = {
      ...letter,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const letters = [...this.lettersSubject.value, newLetter];
    this.saveLetters(letters);
    return newLetter;
  }

  updateLetter(id: string, updates: Partial<Letter>): Letter | undefined {
    const letters = this.lettersSubject.value;
    const index = letters.findIndex(l => l.id === id);
    if (index === -1) return undefined;

    const updatedLetter: Letter = {
      ...letters[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    const newLetters = [...letters];
    newLetters[index] = updatedLetter;
    this.saveLetters(newLetters);
    return updatedLetter;
  }

  deleteLetter(id: string): boolean {
    const letters = this.lettersSubject.value.filter(l => l.id !== id);
    this.saveLetters(letters);
    return letters.length < this.lettersSubject.value.length;
  }

  addPostmark(letterId: string, postmark: Omit<Postmark, 'id' | 'letterId'>): Postmark | undefined {
    const letter = this.getLetterById(letterId);
    if (!letter) return undefined;

    const newPostmark: Postmark = {
      ...postmark,
      id: this.generateId(),
      letterId
    };

    const postmarks = [...letter.postmarks, newPostmark].sort((a, b) => a.sequence - b.sequence);
    this.updateLetter(letterId, { postmarks });
    return newPostmark;
  }

  updatePostmark(letterId: string, postmarkId: string, updates: Partial<Postmark>): Postmark | undefined {
    const letter = this.getLetterById(letterId);
    if (!letter) return undefined;

    const postmarks = letter.postmarks.map(p =>
      p.id === postmarkId ? { ...p, ...updates } : p
    ).sort((a, b) => a.sequence - b.sequence);

    this.updateLetter(letterId, { postmarks });
    return postmarks.find(p => p.id === postmarkId);
  }

  deletePostmark(letterId: string, postmarkId: string): boolean {
    const letter = this.getLetterById(letterId);
    if (!letter) return false;

    const postmarks = letter.postmarks.filter(p => p.id !== postmarkId);
    this.updateLetter(letterId, { postmarks });
    return postmarks.length < letter.postmarks.length;
  }

  getSortedPostmarks(letter: Letter): Postmark[] {
    return [...letter.postmarks].sort((a, b) => a.sequence - b.sequence);
  }

  getRouteSegments(letter: Letter): RouteSegment[] {
    const sorted = this.getSortedPostmarks(letter);
    const segments: RouteSegment[] = [];

    for (let i = 0; i < sorted.length - 1; i++) {
      const from = sorted[i];
      const to = sorted[i + 1];
      const durationDays = this.calculateDuration(from.postmarkDate, to.postmarkDate);
      const distanceKm = this.calculateDistance(from, to);
      const { isAnomaly, anomalyReason } = this.detectAnomaly(from, to, durationDays, distanceKm);

      segments.push({
        from,
        to,
        durationDays,
        distanceKm,
        isAnomaly,
        anomalyReason
      });
    }

    return segments;
  }

  private calculateDuration(fromDate: string | null, toDate: string | null): number | null {
    if (!fromDate || !toDate) return null;
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const diff = to.getTime() - from.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
  }

  private calculateDistance(from: Postmark, to: Postmark): number | null {
    if (from.latitude === null || from.longitude === null ||
        to.latitude === null || to.longitude === null) {
      return null;
    }

    const R = 6371;
    const dLat = this.toRad(to.latitude - from.latitude);
    const dLon = this.toRad(to.longitude - from.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(from.latitude)) * Math.cos(this.toRad(to.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private detectAnomaly(
    from: Postmark,
    to: Postmark,
    durationDays: number | null,
    distanceKm: number | null
  ): { isAnomaly: boolean; anomalyReason?: string } {
    const reasons: string[] = [];

    if (from.latitude === null || from.longitude === null) {
      reasons.push('起点经纬度缺失');
    }
    if (to.latitude === null || to.longitude === null) {
      reasons.push('终点经纬度缺失');
    }
    if (from.postmarkDate === null) {
      reasons.push('起点日期缺失');
    }
    if (to.postmarkDate === null) {
      reasons.push('终点日期缺失');
    }

    if (durationDays !== null && durationDays < 0) {
      reasons.push('时间倒序');
    }

    if (durationDays !== null && distanceKm !== null && durationDays > 0) {
      const speed = distanceKm / durationDays;
      if (speed > 2000) {
        reasons.push('速度异常快');
      }
      if (speed < 10 && distanceKm > 100) {
        reasons.push('速度异常慢，可能绕行');
      }
    }

    return {
      isAnomaly: reasons.length > 0,
      anomalyReason: reasons.length > 0 ? reasons.join('；') : undefined
    };
  }

  getCityStats(): CityStat[] {
    const cityCount = new Map<string, number>();

    for (const letter of this.lettersSubject.value) {
      for (const postmark of letter.postmarks) {
        if (postmark.type === 'transit' && postmark.locationName) {
          const count = cityCount.get(postmark.locationName) || 0;
          cityCount.set(postmark.locationName, count + 1);
        }
      }
    }

    return Array.from(cityCount.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  getAverageDuration(): number | null {
    let totalDuration = 0;
    let count = 0;

    for (const letter of this.lettersSubject.value) {
      const segments = this.getRouteSegments(letter);
      for (const seg of segments) {
        if (seg.durationDays !== null && seg.durationDays >= 0) {
          totalDuration += seg.durationDays;
          count++;
        }
      }
    }

    return count > 0 ? Math.round(totalDuration / count * 10) / 10 : null;
  }

  getDurationDistribution(): DurationStat[] {
    const buckets = [
      { label: '1天以内', min: 0, max: 1, count: 0 },
      { label: '1-3天', min: 1, max: 3, count: 0 },
      { label: '3-7天', min: 3, max: 7, count: 0 },
      { label: '7-14天', min: 7, max: 14, count: 0 },
      { label: '14-30天', min: 14, max: 30, count: 0 },
      { label: '30天以上', min: 30, max: Infinity, count: 0 }
    ];

    for (const letter of this.lettersSubject.value) {
      const segments = this.getRouteSegments(letter);
      for (const seg of segments) {
        if (seg.durationDays !== null && seg.durationDays >= 0) {
          for (const bucket of buckets) {
            if (seg.durationDays >= bucket.min && seg.durationDays < bucket.max) {
              bucket.count++;
              break;
            }
          }
        }
      }
    }

    return buckets.map(b => ({ label: b.label, value: b.count }));
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  getVersions(letterId: string): RouteVersion[] {
    const letter = this.getLetterById(letterId);
    if (!letter) return [];
    return letter.versions || [];
  }

  getVersionById(letterId: string, versionId: string): RouteVersion | undefined {
    return this.getVersions(letterId).find(v => v.id === versionId);
  }

  addVersion(letterId: string, version: Omit<RouteVersion, 'id' | 'letterId' | 'createdAt' | 'updatedAt'>): RouteVersion | undefined {
    const letter = this.getLetterById(letterId);
    if (!letter) return undefined;

    const newVersion: RouteVersion = {
      ...version,
      id: this.generateId(),
      letterId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const versions = [...(letter.versions || []), newVersion];
    this.updateLetter(letterId, { versions });
    return newVersion;
  }

  updateVersion(letterId: string, versionId: string, updates: Partial<RouteVersion>): RouteVersion | undefined {
    const letter = this.getLetterById(letterId);
    if (!letter) return undefined;

    const versions = (letter.versions || []).map(v =>
      v.id === versionId ? { ...v, ...updates, updatedAt: new Date().toISOString() } : v
    );

    this.updateLetter(letterId, { versions });
    return versions.find(v => v.id === versionId);
  }

  deleteVersion(letterId: string, versionId: string): boolean {
    const letter = this.getLetterById(letterId);
    if (!letter) return false;

    const versions = (letter.versions || []).filter(v => v.id !== versionId);
    const wasOfficial = letter.officialVersionId === versionId;

    this.updateLetter(letterId, {
      versions,
      officialVersionId: wasOfficial ? undefined : letter.officialVersionId
    });

    return versions.length < (letter.versions?.length || 0);
  }

  setOfficialVersion(letterId: string, versionId: string | undefined): boolean {
    const letter = this.getLetterById(letterId);
    if (!letter) return false;

    if (versionId && !this.getVersionById(letterId, versionId)) {
      return false;
    }

    const versions = (letter.versions || []).map(v => ({
      ...v,
      isOfficial: v.id === versionId
    }));

    this.updateLetter(letterId, {
      versions,
      officialVersionId: versionId
    });

    return true;
  }

  getOfficialVersion(letterId: string): RouteVersion | undefined {
    const letter = this.getLetterById(letterId);
    if (!letter) return undefined;
    if (letter.officialVersionId) {
      return this.getVersionById(letterId, letter.officialVersionId);
    }
    return (letter.versions || []).find(v => v.isOfficial);
  }

  getVersionPostmarks(letterId: string, versionId?: string): Postmark[] {
    const letter = this.getLetterById(letterId);
    if (!letter) return [];

    if (versionId) {
      const version = this.getVersionById(letterId, versionId);
      return version ? version.postmarks : [];
    }

    const official = this.getOfficialVersion(letterId);
    if (official) return official.postmarks;

    if (letter.versions && letter.versions.length > 0) {
      return letter.versions[0].postmarks;
    }

    return letter.postmarks || [];
  }

  getRouteSegmentsForVersion(version: RouteVersion): RouteSegment[] {
    const sorted = [...version.postmarks].sort((a, b) => a.sequence - b.sequence);
    const segments: RouteSegment[] = [];

    for (let i = 0; i < sorted.length - 1; i++) {
      const from = sorted[i];
      const to = sorted[i + 1];
      const durationDays = this.calculateDuration(from.postmarkDate, to.postmarkDate);
      const distanceKm = this.calculateDistance(from, to);
      const { isAnomaly, anomalyReason } = this.detectAnomaly(from, to, durationDays, distanceKm);

      segments.push({
        from,
        to,
        durationDays,
        distanceKm,
        isAnomaly,
        anomalyReason
      });
    }

    return segments;
  }

  getVersionDuration(version: RouteVersion): number | null {
    const sorted = [...version.postmarks].sort((a, b) => a.sequence - b.sequence);
    const origin = sorted.find(p => p.type === 'origin');
    const dest = sorted.find(p => p.type === 'destination');

    if (origin?.postmarkDate && dest?.postmarkDate) {
      const start = new Date(origin.postmarkDate);
      const end = new Date(dest.postmarkDate);
      const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return days >= 0 ? days : null;
    }
    return null;
  }

  getVersionTransitCities(version: RouteVersion): string[] {
    return version.postmarks
      .filter(p => p.type === 'transit')
      .map(p => p.locationName);
  }

  getVersionTotalDistance(version: RouteVersion): number {
    const segments = this.getRouteSegmentsForVersion(version);
    return segments.reduce((sum, s) => sum + (s.distanceKm || 0), 0);
  }

  duplicateVersion(letterId: string, sourceVersionId: string, newName: string): RouteVersion | undefined {
    const source = this.getVersionById(letterId, sourceVersionId);
    if (!source) return undefined;

    return this.addVersion(letterId, {
      name: newName,
      description: source.description,
      postmarks: source.postmarks.map(p => ({ ...p, id: this.generateId() })),
      isOfficial: false
    });
  }

  createVersionFromLetter(letterId: string, name: string): RouteVersion | undefined {
    const letter = this.getLetterById(letterId);
    if (!letter) return undefined;

    return this.addVersion(letterId, {
      name,
      description: '',
      postmarks: letter.postmarks.map(p => ({ ...p, id: this.generateId() })),
      isOfficial: false
    });
  }

  migrateLegacyLetter(letter: Letter): Letter {
    if (letter.versions && letter.versions.length > 0) {
      return letter;
    }

    const defaultVersion: RouteVersion = {
      id: this.generateId(),
      letterId: letter.id,
      name: '初始方案',
      description: '自动迁移的原始方案',
      postmarks: letter.postmarks || [],
      isOfficial: true,
      createdAt: letter.createdAt,
      updatedAt: letter.updatedAt
    };

    return {
      ...letter,
      versions: [defaultVersion],
      officialVersionId: defaultVersion.id
    };
  }
}
