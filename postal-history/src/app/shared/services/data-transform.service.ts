import { Injectable } from '@angular/core';
import { Postmark, RouteVersion, Letter } from '../../models/letter.model';
import {
  PostalRouteRule,
  TransitCity,
  RestrictedArea,
  TransitDuration,
  TransitRole,
  TransportType
} from '../../models/postal-knowledge.model';

@Injectable({ providedIn: 'root' })
export class DataTransformService {
  toDateString(date: Date | string | null): string | null {
    if (!date) return null;
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    if (typeof date === 'string') {
      if (date.includes('T')) {
        return date.split('T')[0];
      }
      return date;
    }
    return null;
  }

  toDateObj(dateStr: string | null): Date | null {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  }

  convertPostmarkDates(postmarks: any[]): Postmark[] {
    return postmarks.map((pm: any) => ({
      ...pm,
      postmarkDate: this.toDateString(pm.postmarkDate)
    })) as Postmark[];
  }

  convertPostmarkDatesToDateObj(postmarks: any[]): any[] {
    return postmarks.map((pm: any) => ({
      ...pm,
      postmarkDate: pm.postmarkDate ? new Date(pm.postmarkDate) : null
    }));
  }

  resequencePostmarks(postmarks: Postmark[]): Postmark[] {
    return postmarks.map((pm, i) => ({ ...pm, sequence: i }));
  }

  getOfficialVersion(letter: Letter): RouteVersion | undefined {
    if (letter.officialVersionId) {
      const version = (letter.versions || []).find(v => v.id === letter.officialVersionId);
      if (version) return version;
    }
    const byFlag = (letter.versions || []).find(v => v.isOfficial);
    if (byFlag) return byFlag;
    if (letter.versions && letter.versions.length > 0) {
      return letter.versions[0];
    }
    return undefined;
  }

  getVersionPostmarks(letter: Letter, versionId?: string): Postmark[] {
    if (versionId) {
      const version = (letter.versions || []).find(v => v.id === versionId);
      return version ? version.postmarks : [];
    }
    const official = this.getOfficialVersion(letter);
    if (official) return official.postmarks;
    if (letter.versions && letter.versions.length > 0) {
      return letter.versions[0].postmarks;
    }
    return letter.postmarks || [];
  }

  buildLetterFromVersions(
    letterData: Partial<Letter>,
    versions: RouteVersion[]
  ): Letter {
    const officialVersion = versions.find(v => v.isOfficial);
    return {
      id: letterData.id || '',
      title: letterData.title || '',
      description: letterData.description || '',
      postmarks: officialVersion?.postmarks || [],
      versions,
      officialVersionId: officialVersion?.id || letterData.officialVersionId || '',
      createdAt: letterData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Letter;
  }

  ensureOfficialVersion(versions: RouteVersion[]): RouteVersion[] {
    if (versions.length === 0) return versions;
    const hasOfficial = versions.some(v => v.isOfficial);
    if (!hasOfficial) {
      return versions.map((v, i) => ({
        ...v,
        isOfficial: i === 0
      }));
    }
    return versions;
  }

  setVersionAsOfficial(versions: RouteVersion[], versionIndex: number): RouteVersion[] {
    return versions.map((v, i) => ({
      ...v,
      isOfficial: i === versionIndex
    }));
  }

  createDefaultVersion(versionIndex: number): Partial<RouteVersion> {
    return {
      id: '',
      name: `方案 ${versionIndex + 1}`,
      description: '',
      isOfficial: versionIndex === 0,
      postmarks: [
        { id: '', letterId: '', type: 'origin', locationName: '', latitude: null, longitude: null, postmarkDate: null, clarity: 'clear', sequence: 0, locationPrecision: 'exact' },
        { id: '', letterId: '', type: 'destination', locationName: '', latitude: null, longitude: null, postmarkDate: null, clarity: 'clear', sequence: 1, locationPrecision: 'exact' }
      ] as Postmark[]
    };
  }

  duplicateVersion(source: RouteVersion, newName: string, generateId: () => string): RouteVersion {
    return {
      ...source,
      id: generateId(),
      name: newName,
      isOfficial: false,
      postmarks: source.postmarks.map((p, i) => ({
        ...p,
        id: generateId(),
        sequence: i
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  rolesFromForm(roleFlags: Record<string, boolean>): TransitRole[] {
    const roles: TransitRole[] = [];
    if (roleFlags['role_hub']) roles.push('hub');
    if (roleFlags['role_port']) roles.push('port');
    if (roleFlags['role_customs']) roles.push('customs');
    if (roleFlags['role_railway_station']) roles.push('railway_station');
    if (roleFlags['role_border']) roles.push('border');
    if (roleFlags['role_relay']) roles.push('relay');
    return roles;
  }

  rolesToForm(roles: TransitRole[]): Record<string, boolean> {
    return {
      role_hub: roles.includes('hub'),
      role_port: roles.includes('port'),
      role_customs: roles.includes('customs'),
      role_railway_station: roles.includes('railway_station'),
      role_border: roles.includes('border'),
      role_relay: roles.includes('relay')
    };
  }

  toNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  sanitizeRuleForm(formValue: any, transitCities: string[]): Partial<PostalRouteRule> {
    return {
      name: formValue.name,
      era: formValue.era,
      startYear: this.toNumber(formValue.startYear),
      endYear: this.toNumber(formValue.endYear),
      description: formValue.description || null,
      origin: formValue.origin,
      destination: formValue.destination,
      transitCities,
      typicalDurationDays: this.toNumber(formValue.typicalDurationDays),
      minDurationDays: this.toNumber(formValue.minDurationDays),
      maxDurationDays: this.toNumber(formValue.maxDurationDays),
      transportType: formValue.transportType as TransportType,
      frequency: formValue.frequency || null,
      source: formValue.source || null,
      notes: formValue.notes || null
    };
  }

  sanitizeCityForm(formValue: any, roles: TransitRole[]): Partial<TransitCity> {
    return {
      name: formValue.name,
      latitude: this.toNumber(formValue.latitude),
      longitude: this.toNumber(formValue.longitude),
      province: formValue.province || null,
      era: formValue.era,
      importance: formValue.importance,
      roles,
      description: formValue.description || null,
      source: formValue.source || null
    };
  }

  sanitizeRestrictedForm(formValue: any, locationNames: string[]): Partial<RestrictedArea> {
    return {
      name: formValue.name,
      era: formValue.era,
      startYear: this.toNumber(formValue.startYear),
      endYear: this.toNumber(formValue.endYear),
      restrictionType: formValue.restrictionType,
      areaType: formValue.areaType,
      locationNames,
      description: formValue.description || null,
      source: formValue.source || null
    };
  }

  sanitizeDurationForm(formValue: any): Partial<TransitDuration> {
    return {
      fromCity: formValue.fromCity,
      toCity: formValue.toCity,
      era: formValue.era,
      transportType: formValue.transportType as TransportType,
      typicalDays: Number(formValue.typicalDays),
      minDays: this.toNumber(formValue.minDays),
      maxDays: this.toNumber(formValue.maxDays),
      source: formValue.source || null,
      notes: formValue.notes || null
    };
  }

  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
