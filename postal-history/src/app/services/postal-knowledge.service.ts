import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  PostalRouteRule,
  TransitCity,
  RestrictedArea,
  TransitDuration,
  TransportType
} from '../models/postal-knowledge.model';

const RULES_STORAGE_KEY = 'postal_knowledge_rules';
const CITIES_STORAGE_KEY = 'postal_knowledge_cities';
const RESTRICTED_STORAGE_KEY = 'postal_knowledge_restricted';
const DURATIONS_STORAGE_KEY = 'postal_knowledge_durations';

@Injectable({
  providedIn: 'root'
})
export class PostalKnowledgeService {
  private rulesSubject = new BehaviorSubject<PostalRouteRule[]>([]);
  private citiesSubject = new BehaviorSubject<TransitCity[]>([]);
  private restrictedAreasSubject = new BehaviorSubject<RestrictedArea[]>([]);
  private durationsSubject = new BehaviorSubject<TransitDuration[]>([]);

  rules$ = this.rulesSubject.asObservable();
  cities$ = this.citiesSubject.asObservable();
  restrictedAreas$ = this.restrictedAreasSubject.asObservable();
  durations$ = this.durationsSubject.asObservable();

  constructor() {
    this.loadAll();
  }

  private loadAll(): void {
    this.loadRules();
    this.loadCities();
    this.loadRestrictedAreas();
    this.loadDurations();
  }

  private loadRules(): void {
    const stored = localStorage.getItem(RULES_STORAGE_KEY);
    if (stored) {
      try {
        this.rulesSubject.next(JSON.parse(stored));
      } catch {
        const sample = this.getSampleRules();
        this.rulesSubject.next(sample);
        this.saveRules(sample);
      }
    } else {
      const sample = this.getSampleRules();
      this.rulesSubject.next(sample);
      this.saveRules(sample);
    }
  }

  private loadCities(): void {
    const stored = localStorage.getItem(CITIES_STORAGE_KEY);
    if (stored) {
      try {
        this.citiesSubject.next(JSON.parse(stored));
      } catch {
        const sample = this.getSampleCities();
        this.citiesSubject.next(sample);
        this.saveCities(sample);
      }
    } else {
      const sample = this.getSampleCities();
      this.citiesSubject.next(sample);
      this.saveCities(sample);
    }
  }

  private loadRestrictedAreas(): void {
    const stored = localStorage.getItem(RESTRICTED_STORAGE_KEY);
    if (stored) {
      try {
        this.restrictedAreasSubject.next(JSON.parse(stored));
      } catch {
        const sample = this.getSampleRestrictedAreas();
        this.restrictedAreasSubject.next(sample);
        this.saveRestrictedAreas(sample);
      }
    } else {
      const sample = this.getSampleRestrictedAreas();
      this.restrictedAreasSubject.next(sample);
      this.saveRestrictedAreas(sample);
    }
  }

  private loadDurations(): void {
    const stored = localStorage.getItem(DURATIONS_STORAGE_KEY);
    if (stored) {
      try {
        this.durationsSubject.next(JSON.parse(stored));
      } catch {
        const sample = this.getSampleDurations();
        this.durationsSubject.next(sample);
        this.saveDurations(sample);
      }
    } else {
      const sample = this.getSampleDurations();
      this.durationsSubject.next(sample);
      this.saveDurations(sample);
    }
  }

  private getSampleRules(): PostalRouteRule[] {
    const now = new Date().toISOString();
    return [
      {
        id: 'rule1',
        name: '清代上海-北京津海关线',
        era: '清代',
        startYear: 1878,
        endYear: 1911,
        description: '清末海关邮政主要干线，经天津中转',
        origin: '上海',
        destination: '北京',
        transitCities: ['天津'],
        typicalDurationDays: 7,
        minDurationDays: 5,
        maxDurationDays: 10,
        transportType: 'mixed',
        frequency: '每周三班',
        source: '中国近代邮政史',
        notes: '红印花加盖邮票时期的主要邮路',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'rule2',
        name: '民国广州-汉口线',
        era: '民国',
        startYear: 1912,
        endYear: 1937,
        description: '民国初期南方邮路主干线',
        origin: '广州',
        destination: '汉口',
        transitCities: ['长沙'],
        typicalDurationDays: 9,
        minDurationDays: 7,
        maxDurationDays: 14,
        transportType: 'water',
        frequency: '每周两班',
        source: '民国邮政史料汇编',
        notes: '主要经湘江、长江水路运输',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'rule3',
        name: '民国北平-南京津浦线',
        era: '民国',
        startYear: 1912,
        endYear: 1937,
        description: '民国时期北方至南京的铁路邮路',
        origin: '北平',
        destination: '南京',
        transitCities: ['天津', '济南', '徐州'],
        typicalDurationDays: 5,
        minDurationDays: 3,
        maxDurationDays: 8,
        transportType: 'rail',
        frequency: '每日一班',
        source: '津浦铁路邮政档案',
        notes: '津浦铁路通车后成为主要邮路',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'rule4',
        name: '清代上海-广州海路',
        era: '清代',
        startYear: 1870,
        endYear: 1911,
        description: '清末沿海轮船邮路',
        origin: '上海',
        destination: '广州',
        transitCities: ['厦门', '汕头'],
        typicalDurationDays: 10,
        minDurationDays: 7,
        maxDurationDays: 15,
        transportType: 'water',
        frequency: '每周一班',
        source: '清代海关邮政档案',
        notes: '受天气影响较大',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'rule5',
        name: '民国上海-重庆川江线',
        era: '民国',
        startYear: 1915,
        endYear: 1945,
        description: '长江上游水路邮路',
        origin: '上海',
        destination: '重庆',
        transitCities: ['汉口', '宜昌', '万县'],
        typicalDurationDays: 20,
        minDurationDays: 14,
        maxDurationDays: 30,
        transportType: 'water',
        frequency: '每周一班',
        source: '川江航运史料',
        notes: '三峡段航行困难，耗时较长',
        createdAt: now,
        updatedAt: now
      }
    ];
  }

  private getSampleCities(): TransitCity[] {
    const now = new Date().toISOString();
    return [
      {
        id: 'city1',
        name: '上海',
        latitude: 31.2304,
        longitude: 121.4737,
        province: '江苏',
        era: '清代民国',
        importance: 'primary',
        roles: ['hub', 'port', 'customs'],
        description: '中国近代邮政发源地，重要邮政枢纽',
        source: '中国邮政史',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'city2',
        name: '天津',
        latitude: 39.0842,
        longitude: 117.2008,
        province: '直隶',
        era: '清代民国',
        importance: 'primary',
        roles: ['hub', 'port', 'customs', 'railway_station'],
        description: '北方重要邮务中心，津海关所在地',
        source: '天津邮政志',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'city3',
        name: '北京',
        latitude: 39.9042,
        longitude: 116.4074,
        province: '直隶',
        era: '清代民国',
        importance: 'primary',
        roles: ['hub', 'railway_station'],
        description: '首都，邮政管理中心',
        source: '北京邮政志',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'city4',
        name: '广州',
        latitude: 23.1291,
        longitude: 113.2644,
        province: '广东',
        era: '清代民国',
        importance: 'primary',
        roles: ['hub', 'port', 'customs'],
        description: '南方邮政枢纽，最早对外通商口岸之一',
        source: '广州邮政志',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'city5',
        name: '汉口',
        latitude: 30.5928,
        longitude: 114.3055,
        province: '湖北',
        era: '清代民国',
        importance: 'primary',
        roles: ['hub', 'port', 'railway_station'],
        description: '华中邮政枢纽，九省通衢',
        source: '汉口邮政史料',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'city6',
        name: '济南',
        latitude: 36.6512,
        longitude: 117.1201,
        province: '山东',
        era: '清代民国',
        importance: 'secondary',
        roles: ['hub', 'railway_station'],
        description: '山东邮务管理中心',
        source: '山东邮政志',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'city7',
        name: '南京',
        latitude: 32.0603,
        longitude: 118.7969,
        province: '江苏',
        era: '民国',
        importance: 'primary',
        roles: ['hub', 'port', 'railway_station'],
        description: '民国首都，重要邮政中心',
        source: '南京邮政志',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'city8',
        name: '徐州',
        latitude: 34.2608,
        longitude: 117.1845,
        province: '江苏',
        era: '民国',
        importance: 'secondary',
        roles: ['railway_station', 'relay'],
        description: '津浦与陇海铁路交汇点',
        source: '徐州邮政史料',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'city9',
        name: '长沙',
        latitude: 28.2282,
        longitude: 112.9388,
        province: '湖南',
        era: '清代民国',
        importance: 'secondary',
        roles: ['hub', 'port'],
        description: '湖南邮务中心',
        source: '湖南邮政志',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'city10',
        name: '厦门',
        latitude: 24.4798,
        longitude: 118.0894,
        province: '福建',
        era: '清代民国',
        importance: 'secondary',
        roles: ['port', 'customs'],
        description: '闽南重要通商口岸',
        source: '厦门海关档案',
        createdAt: now,
        updatedAt: now
      }
    ];
  }

  private getSampleRestrictedAreas(): RestrictedArea[] {
    const now = new Date().toISOString();
    return [
      {
        id: 'rest1',
        name: '东北战区（日俄战争）',
        era: '清代',
        startYear: 1904,
        endYear: 1905,
        restrictionType: 'suspended',
        areaType: 'region',
        locationNames: ['沈阳', '旅顺', '大连', '营口'],
        description: '日俄战争期间，东北地区邮政服务暂停',
        source: '清代邮政档案',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'rest2',
        name: '一战德国租界禁寄',
        era: '民国',
        startYear: 1914,
        endYear: 1918,
        restrictionType: 'prohibited',
        areaType: 'border',
        locationNames: ['青岛', '胶州湾'],
        description: '一战期间，德国在华租界邮件禁寄',
        source: '民国邮政史料',
        createdAt: now,
        updatedAt: now
      }
    ];
  }

  private getSampleDurations(): TransitDuration[] {
    const now = new Date().toISOString();
    return [
      {
        id: 'dur1',
        fromCity: '上海',
        toCity: '天津',
        era: '清代',
        transportType: 'water',
        typicalDays: 4,
        minDays: 3,
        maxDays: 6,
        source: '海关邮政档案',
        notes: '海路运输',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'dur2',
        fromCity: '天津',
        toCity: '北京',
        era: '清代',
        transportType: 'land',
        typicalDays: 2,
        minDays: 1,
        maxDays: 3,
        source: '海关邮政档案',
        notes: '陆路快马或骡车',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'dur3',
        fromCity: '广州',
        toCity: '长沙',
        era: '民国',
        transportType: 'water',
        typicalDays: 5,
        minDays: 4,
        maxDays: 7,
        source: '粤汉铁路史料',
        notes: '经北江、湘江',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'dur4',
        fromCity: '长沙',
        toCity: '汉口',
        era: '民国',
        transportType: 'water',
        typicalDays: 3,
        minDays: 2,
        maxDays: 5,
        source: '长江航运史料',
        notes: '洞庭湖-长江',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'dur5',
        fromCity: '北平',
        toCity: '天津',
        era: '民国',
        transportType: 'rail',
        typicalDays: 1,
        minDays: 0.5,
        maxDays: 2,
        source: '京奉铁路档案',
        notes: '铁路当日可达',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'dur6',
        fromCity: '天津',
        toCity: '济南',
        era: '民国',
        transportType: 'rail',
        typicalDays: 2,
        minDays: 1,
        maxDays: 3,
        source: '津浦铁路档案',
        notes: '津浦铁路北段',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'dur7',
        fromCity: '济南',
        toCity: '徐州',
        era: '民国',
        transportType: 'rail',
        typicalDays: 1,
        minDays: 0.5,
        maxDays: 2,
        source: '津浦铁路档案',
        notes: '津浦铁路中段',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'dur8',
        fromCity: '徐州',
        toCity: '南京',
        era: '民国',
        transportType: 'rail',
        typicalDays: 2,
        minDays: 1,
        maxDays: 3,
        source: '津浦铁路档案',
        notes: '津浦铁路南段',
        createdAt: now,
        updatedAt: now
      }
    ];
  }

  private saveRules(rules: PostalRouteRule[]): void {
    localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(rules));
    this.rulesSubject.next(rules);
  }

  private saveCities(cities: TransitCity[]): void {
    localStorage.setItem(CITIES_STORAGE_KEY, JSON.stringify(cities));
    this.citiesSubject.next(cities);
  }

  private saveRestrictedAreas(areas: RestrictedArea[]): void {
    localStorage.setItem(RESTRICTED_STORAGE_KEY, JSON.stringify(areas));
    this.restrictedAreasSubject.next(areas);
  }

  private saveDurations(durations: TransitDuration[]): void {
    localStorage.setItem(DURATIONS_STORAGE_KEY, JSON.stringify(durations));
    this.durationsSubject.next(durations);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  getRules(): PostalRouteRule[] {
    return this.rulesSubject.value;
  }

  getRuleById(id: string): PostalRouteRule | undefined {
    return this.rulesSubject.value.find(r => r.id === id);
  }

  addRule(rule: Omit<PostalRouteRule, 'id' | 'createdAt' | 'updatedAt'>): PostalRouteRule {
    const newRule: PostalRouteRule = {
      ...rule,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const rules = [...this.rulesSubject.value, newRule];
    this.saveRules(rules);
    return newRule;
  }

  updateRule(id: string, updates: Partial<PostalRouteRule>): PostalRouteRule | undefined {
    const rules = this.rulesSubject.value;
    const index = rules.findIndex(r => r.id === id);
    if (index === -1) return undefined;
    const updated: PostalRouteRule = {
      ...rules[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    const newRules = [...rules];
    newRules[index] = updated;
    this.saveRules(newRules);
    return updated;
  }

  deleteRule(id: string): boolean {
    const rules = this.rulesSubject.value.filter(r => r.id !== id);
    this.saveRules(rules);
    return rules.length < this.rulesSubject.value.length;
  }

  getCities(): TransitCity[] {
    return this.citiesSubject.value;
  }

  getCityById(id: string): TransitCity | undefined {
    return this.citiesSubject.value.find(c => c.id === id);
  }

  getCityByName(name: string): TransitCity | undefined {
    return this.citiesSubject.value.find(c => c.name === name);
  }

  addCity(city: Omit<TransitCity, 'id' | 'createdAt' | 'updatedAt'>): TransitCity {
    const newCity: TransitCity = {
      ...city,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const cities = [...this.citiesSubject.value, newCity];
    this.saveCities(cities);
    return newCity;
  }

  updateCity(id: string, updates: Partial<TransitCity>): TransitCity | undefined {
    const cities = this.citiesSubject.value;
    const index = cities.findIndex(c => c.id === id);
    if (index === -1) return undefined;
    const updated: TransitCity = {
      ...cities[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    const newCities = [...cities];
    newCities[index] = updated;
    this.saveCities(newCities);
    return updated;
  }

  deleteCity(id: string): boolean {
    const cities = this.citiesSubject.value.filter(c => c.id !== id);
    this.saveCities(cities);
    return cities.length < this.citiesSubject.value.length;
  }

  getRestrictedAreas(): RestrictedArea[] {
    return this.restrictedAreasSubject.value;
  }

  getRestrictedAreaById(id: string): RestrictedArea | undefined {
    return this.restrictedAreasSubject.value.find(r => r.id === id);
  }

  addRestrictedArea(area: Omit<RestrictedArea, 'id' | 'createdAt' | 'updatedAt'>): RestrictedArea {
    const newArea: RestrictedArea = {
      ...area,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const areas = [...this.restrictedAreasSubject.value, newArea];
    this.saveRestrictedAreas(areas);
    return newArea;
  }

  updateRestrictedArea(id: string, updates: Partial<RestrictedArea>): RestrictedArea | undefined {
    const areas = this.restrictedAreasSubject.value;
    const index = areas.findIndex(r => r.id === id);
    if (index === -1) return undefined;
    const updated: RestrictedArea = {
      ...areas[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    const newAreas = [...areas];
    newAreas[index] = updated;
    this.saveRestrictedAreas(newAreas);
    return updated;
  }

  deleteRestrictedArea(id: string): boolean {
    const areas = this.restrictedAreasSubject.value.filter(r => r.id !== id);
    this.saveRestrictedAreas(areas);
    return areas.length < this.restrictedAreasSubject.value.length;
  }

  getDurations(): TransitDuration[] {
    return this.durationsSubject.value;
  }

  getDurationById(id: string): TransitDuration | undefined {
    return this.durationsSubject.value.find(d => d.id === id);
  }

  getDurationByCities(from: string, to: string): TransitDuration | undefined {
    return this.durationsSubject.value.find(
      d => (d.fromCity === from && d.toCity === to) ||
           (d.fromCity === to && d.toCity === from)
    );
  }

  addDuration(duration: Omit<TransitDuration, 'id' | 'createdAt' | 'updatedAt'>): TransitDuration {
    const newDuration: TransitDuration = {
      ...duration,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const durations = [...this.durationsSubject.value, newDuration];
    this.saveDurations(durations);
    return newDuration;
  }

  updateDuration(id: string, updates: Partial<TransitDuration>): TransitDuration | undefined {
    const durations = this.durationsSubject.value;
    const index = durations.findIndex(d => d.id === id);
    if (index === -1) return undefined;
    const updated: TransitDuration = {
      ...durations[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    const newDurations = [...durations];
    newDurations[index] = updated;
    this.saveDurations(newDurations);
    return updated;
  }

  deleteDuration(id: string): boolean {
    const durations = this.durationsSubject.value.filter(d => d.id !== id);
    this.saveDurations(durations);
    return durations.length < this.durationsSubject.value.length;
  }

  getEras(): string[] {
    const eras = new Set<string>();
    this.rulesSubject.value.forEach(r => eras.add(r.era));
    this.citiesSubject.value.forEach(c => eras.add(c.era));
    this.restrictedAreasSubject.value.forEach(r => eras.add(r.era));
    this.durationsSubject.value.forEach(d => eras.add(d.era));
    return Array.from(eras).sort();
  }

  getRulesByEra(era: string): PostalRouteRule[] {
    return this.rulesSubject.value.filter(r => r.era === era);
  }

  getCitiesByEra(era: string): TransitCity[] {
    return this.citiesSubject.value.filter(c => c.era === era || c.era.includes(era));
  }

  getRestrictedAreasByEra(era: string): RestrictedArea[] {
    return this.restrictedAreasSubject.value.filter(r => r.era === era);
  }

  getDurationsByEra(era: string): TransitDuration[] {
    return this.durationsSubject.value.filter(d => d.era === era);
  }
}
