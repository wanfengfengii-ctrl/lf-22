import { Injectable } from '@angular/core';
import { Letter, Postmark } from '../models/letter.model';
import {
  PostalRouteRule,
  TransitCity,
  RestrictedArea,
  TransitDuration,
  InferredRoute,
  InferredPostmark,
  InferenceEvidence,
  InferenceResult,
  InferenceSummary
} from '../models/postal-knowledge.model';
import { PostalKnowledgeService } from './postal-knowledge.service';

@Injectable({
  providedIn: 'root'
})
export class RouteInferenceService {
  constructor(private knowledgeService: PostalKnowledgeService) {}

  inferRoute(letter: Letter, versionId?: string): InferenceResult {
    const postmarks = this.getLetterPostmarks(letter, versionId);
    const sortedPostmarks = [...postmarks].sort((a, b) => a.sequence - b.sequence);

    if (sortedPostmarks.length < 2) {
      return {
        letterId: letter.id,
        routes: [],
        analysisSummary: {
          totalRulesConsidered: 0,
          matchingRules: 0,
          knownTransitCities: 0,
          restrictedAreasAvoided: 0,
          durationConsistency: 'low',
          overallConfidence: 0,
          warnings: ['邮戳数量不足，无法进行路线推断']
        }
      };
    }

    const origin = sortedPostmarks.find(p => p.type === 'origin') || sortedPostmarks[0];
    const destination = sortedPostmarks.find(p => p.type === 'destination') || sortedPostmarks[sortedPostmarks.length - 1];
    const letterEra = this.estimateEra(sortedPostmarks);

    const rules = this.knowledgeService.getRules();
    const cities = this.knowledgeService.getCities();
    const restrictedAreas = this.knowledgeService.getRestrictedAreas();
    const durations = this.knowledgeService.getDurations();

    const matchingRules = this.findMatchingRules(
      origin.locationName,
      destination.locationName,
      letterEra,
      rules,
      sortedPostmarks
    );

    const inferredRoutes: InferredRoute[] = [];

    for (let i = 0; i < matchingRules.length && i < 5; i++) {
      const rule = matchingRules[i];
      const route = this.buildInferredRoute(
        letter.id,
        sortedPostmarks,
        rule,
        cities,
        durations,
        restrictedAreas,
        i
      );
      inferredRoutes.push(route);
    }

    if (matchingRules.length === 0) {
      const defaultRoute = this.buildDefaultRoute(
        letter.id,
        sortedPostmarks,
        cities,
        durations,
        restrictedAreas
      );
      inferredRoutes.push(defaultRoute);
    }

    const summary = this.buildSummary(
      sortedPostmarks,
      rules,
      matchingRules,
      cities,
      restrictedAreas,
      durations,
      inferredRoutes
    );

    return {
      letterId: letter.id,
      routes: inferredRoutes.sort((a, b) => b.confidence - a.confidence),
      analysisSummary: summary
    };
  }

  private getLetterPostmarks(letter: Letter, versionId?: string): Postmark[] {
    if (versionId && letter.versions) {
      const version = letter.versions.find(v => v.id === versionId);
      if (version) return version.postmarks;
    }
    return letter.postmarks || [];
  }

  private estimateEra(postmarks: Postmark[]): string {
    const dated = postmarks.filter(p => p.postmarkDate);
    if (dated.length === 0) return '清代民国';

    const years = dated.map(p => new Date(p.postmarkDate!).getFullYear());
    const avgYear = years.reduce((a, b) => a + b, 0) / years.length;

    if (avgYear < 1912) return '清代';
    if (avgYear < 1949) return '民国';
    return '民国';
  }

  private findMatchingRules(
    origin: string,
    destination: string,
    era: string,
    rules: PostalRouteRule[],
    postmarks: Postmark[]
  ): Array<{ rule: PostalRouteRule; score: number }> {
    const results: Array<{ rule: PostalRouteRule; score: number }> = [];

    for (const rule of rules) {
      let score = 0;

      if (rule.origin === origin) score += 30;
      if (rule.destination === destination) score += 30;

      const knownTransits = postmarks.filter(p => p.type === 'transit');
      let transitMatch = 0;
      for (const pm of knownTransits) {
        if (rule.transitCities.includes(pm.locationName)) {
          transitMatch++;
        }
      }
      if (rule.transitCities.length > 0) {
        score += (transitMatch / rule.transitCities.length) * 25;
      }

      if (rule.era === era || rule.era.includes(era)) {
        score += 15;
      }

      if (score > 20) {
        results.push({ rule, score });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  private buildInferredRoute(
    letterId: string,
    knownPostmarks: Postmark[],
    ruleMatch: { rule: PostalRouteRule; score: number },
    cities: TransitCity[],
    durations: TransitDuration[],
    restrictedAreas: RestrictedArea[],
    index: number
  ): InferredRoute {
    const { rule, score } = ruleMatch;
    const evidences: InferenceEvidence[] = [];
    const inferredPostmarks: InferredPostmark[] = [];

    const knownByName = new Map<string, Postmark>();
    knownPostmarks.forEach(p => knownByName.set(p.locationName, p));

    const allCities = [rule.origin, ...rule.transitCities, rule.destination];
    let sequence = 0;

    for (const cityName of allCities) {
      const known = knownByName.get(cityName);
      const cityInfo = cities.find(c => c.name === cityName);

      if (known) {
        inferredPostmarks.push({
          id: known.id,
          type: known.type,
          locationName: known.locationName,
          latitude: known.latitude,
          longitude: known.longitude,
          postmarkDate: known.postmarkDate,
          clarity: known.clarity,
          sequence: sequence++,
          isInferred: false
        });
      } else {
        inferredPostmarks.push({
          id: `inf-${sequence}-${cityName}`,
          type: cityName === rule.origin ? 'origin' :
                cityName === rule.destination ? 'destination' : 'transit',
          locationName: cityName,
          latitude: cityInfo?.latitude ?? null,
          longitude: cityInfo?.longitude ?? null,
          postmarkDate: null,
          clarity: 'inferred',
          sequence: sequence++,
          isInferred: true,
          inferenceReason: `根据「${rule.name}」规则推断的${cityName === rule.origin ? '起点' : cityName === rule.destination ? '终点' : '中转城市'}`
        });
      }
    }

    evidences.push({
      type: 'route_rule_match',
      description: `匹配邮路规则「${rule.name}」，起终点一致`,
      weight: 30,
      supporting: true,
      ruleId: rule.id,
      ruleName: rule.name
    });

    if (rule.era) {
      evidences.push({
        type: 'historical_source',
        description: `时代背景匹配：${rule.era}`,
        weight: 10,
        supporting: true
      });
    }

    const knownTransits = knownPostmarks.filter(p => p.type === 'transit');
    const matchedTransits = knownTransits.filter(p => rule.transitCities.includes(p.locationName));
    if (matchedTransits.length > 0) {
      evidences.push({
        type: 'transit_city_match',
        description: `已知中转城市 ${matchedTransits.length}/${rule.transitCities.length} 个匹配规则`,
        weight: 20,
        supporting: true
      });
    }

    const totalDuration = this.calculateTotalDuration(inferredPostmarks, durations);
    if (totalDuration !== null && rule.typicalDurationDays !== null) {
      const diff = Math.abs(totalDuration - rule.typicalDurationDays);
      if (diff <= 2) {
        evidences.push({
          type: 'duration_match',
          description: `总时长 ${totalDuration} 天，与规则典型时长 ${rule.typicalDurationDays} 天接近`,
          weight: 15,
          supporting: true
        });
      } else if (diff <= 5) {
        evidences.push({
          type: 'duration_match',
          description: `总时长 ${totalDuration} 天，与规则典型时长 ${rule.typicalDurationDays} 天有一定差距`,
          weight: 8,
          supporting: true
        });
      } else {
        evidences.push({
          type: 'duration_match',
          description: `总时长 ${totalDuration} 天，与规则典型时长 ${rule.typicalDurationDays} 天差距较大`,
          weight: 10,
          supporting: false
        });
      }
    }

    const restricted = this.checkRestrictedAreas(inferredPostmarks, restrictedAreas, knownPostmarks);
    if (restricted.length > 0) {
      restricted.forEach(r => {
        evidences.push({
          type: 'restriction_check',
          description: `路线可能经过禁限寄区域「${r}」，需注意`,
          weight: 15,
          supporting: false
        });
      });
    } else {
      evidences.push({
        type: 'restriction_check',
        description: '路线未发现经过禁限寄区域',
        weight: 5,
        supporting: true
      });
    }

    const clarityFactor = this.calculateClarityFactor(knownPostmarks);
    if (clarityFactor < 0.7) {
      evidences.push({
        type: 'clarity_discount',
        description: `部分邮戳清晰度较低，推断可信度有所降低（清晰度系数 ${Math.round(clarityFactor * 100)}%）`,
        weight: Math.round((1 - clarityFactor) * 15),
        supporting: false
      });
    }

    const totalWeight = evidences.reduce((sum, e) => sum + e.weight, 0);
    const supportingWeight = evidences.filter(e => e.supporting).reduce((sum, e) => sum + e.weight, 0);
    const confidence = Math.round((supportingWeight / totalWeight) * 100 + score * 0.3);
    const finalConfidence = Math.min(99, Math.max(10, confidence));

    const totalDistance = this.calculateTotalDistance(inferredPostmarks);

    return {
      id: `route-${index}-${Date.now()}`,
      letterId,
      name: `方案 ${index + 1}：${rule.name}`,
      confidence: finalConfidence,
      postmarks: inferredPostmarks,
      evidences: evidences.sort((a, b) => b.weight - a.weight),
      totalDurationDays: totalDuration,
      totalDistanceKm: totalDistance,
      createdAt: new Date().toISOString()
    };
  }

  private buildDefaultRoute(
    letterId: string,
    knownPostmarks: Postmark[],
    cities: TransitCity[],
    durations: TransitDuration[],
    restrictedAreas: RestrictedArea[]
  ): InferredRoute {
    const evidences: InferenceEvidence[] = [];
    const inferredPostmarks: InferredPostmark[] = [];

    const sorted = [...knownPostmarks].sort((a, b) => a.sequence - b.sequence);
    sorted.forEach((pm, i) => {
      inferredPostmarks.push({
        id: pm.id,
        type: pm.type,
        locationName: pm.locationName,
        latitude: pm.latitude,
        longitude: pm.longitude,
        postmarkDate: pm.postmarkDate,
        clarity: pm.clarity,
        sequence: i,
        isInferred: false
      });
    });

    evidences.push({
      type: 'geographic_logic',
      description: '基于地理常识的基础路线分析，无匹配的历史邮路规则',
      weight: 20,
      supporting: true
    });

    const knownCities = sorted.filter(p => cities.some(c => c.name === p.locationName));
    if (knownCities.length > 0) {
      evidences.push({
        type: 'transit_city_match',
        description: `${knownCities.length} 个地点在知识库中有记录`,
        weight: 15,
        supporting: true
      });
    }

    const restricted = this.checkRestrictedAreas(inferredPostmarks, restrictedAreas, knownPostmarks);
    if (restricted.length > 0) {
      restricted.forEach(r => {
        evidences.push({
          type: 'restriction_check',
          description: `路线可能经过禁限寄区域「${r}」`,
          weight: 15,
          supporting: false
        });
      });
    }

    const totalWeight = evidences.reduce((sum, e) => sum + e.weight, 0);
    const supportingWeight = evidences.filter(e => e.supporting).reduce((sum, e) => sum + e.weight, 0);
    const confidence = Math.round((supportingWeight / totalWeight) * 50);

    const totalDuration = this.calculateTotalDuration(inferredPostmarks, durations);
    const totalDistance = this.calculateTotalDistance(inferredPostmarks);

    return {
      id: `route-default-${Date.now()}`,
      letterId,
      name: '基础分析方案',
      confidence,
      postmarks: inferredPostmarks,
      evidences: evidences.sort((a, b) => b.weight - a.weight),
      totalDurationDays: totalDuration,
      totalDistanceKm: totalDistance,
      createdAt: new Date().toISOString()
    };
  }

  private calculateTotalDuration(
    postmarks: InferredPostmark[],
    durations: TransitDuration[]
  ): number | null {
    let totalDays = 0;
    let hasData = false;

    for (let i = 0; i < postmarks.length - 1; i++) {
      const from = postmarks[i];
      const to = postmarks[i + 1];

      if (from.postmarkDate && to.postmarkDate) {
        const days = Math.abs(
          (new Date(to.postmarkDate).getTime() - new Date(from.postmarkDate).getTime())
          / (1000 * 60 * 60 * 24)
        );
        totalDays += days;
        hasData = true;
      } else {
        const knownDuration = durations.find(
          d => (d.fromCity === from.locationName && d.toCity === to.locationName) ||
               (d.fromCity === to.locationName && d.toCity === from.locationName)
        );
        if (knownDuration) {
          totalDays += knownDuration.typicalDays;
          hasData = true;
        }
      }
    }

    return hasData ? Math.round(totalDays * 10) / 10 : null;
  }

  private calculateTotalDistance(postmarks: InferredPostmark[]): number | null {
    let total = 0;
    let hasData = false;

    for (let i = 0; i < postmarks.length - 1; i++) {
      const from = postmarks[i];
      const to = postmarks[i + 1];

      if (from.latitude !== null && from.longitude !== null &&
          to.latitude !== null && to.longitude !== null) {
        const R = 6371;
        const dLat = this.toRad(to.latitude - from.latitude);
        const dLon = this.toRad(to.longitude - from.longitude);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(this.toRad(from.latitude)) * Math.cos(this.toRad(to.latitude)) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        total += R * c;
        hasData = true;
      }
    }

    return hasData ? Math.round(total) : null;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private checkRestrictedAreas(
    postmarks: InferredPostmark[],
    restrictedAreas: RestrictedArea[],
    knownPostmarks: Postmark[]
  ): string[] {
    const result: string[] = [];
    const locationNames = postmarks.map(p => p.locationName);

    for (const area of restrictedAreas) {
      const overlap = area.locationNames.filter(loc => locationNames.includes(loc));
      if (overlap.length > 0) {
        result.push(area.name);
      }
    }

    return result;
  }

  private calculateClarityFactor(postmarks: Postmark[]): number {
    if (postmarks.length === 0) return 0.5;

    let total = 0;
    for (const pm of postmarks) {
      switch (pm.clarity) {
        case 'clear': total += 1; break;
        case 'partial': total += 0.6; break;
        case 'fuzzy': total += 0.3; break;
        default: total += 0.5;
      }
    }

    return total / postmarks.length;
  }

  private buildSummary(
    postmarks: Postmark[],
    allRules: PostalRouteRule[],
    matchingRules: Array<{ rule: PostalRouteRule; score: number }>,
    cities: TransitCity[],
    restrictedAreas: RestrictedArea[],
    durations: TransitDuration[],
    routes: InferredRoute[]
  ): InferenceSummary {
    const warnings: string[] = [];

    const knownCities = postmarks.filter(p =>
      cities.some(c => c.name === p.locationName)
    ).length;

    const origin = postmarks.find(p => p.type === 'origin');
    const dest = postmarks.find(p => p.type === 'destination');
    if (!origin) warnings.push('缺少寄出地邮戳');
    if (!dest) warnings.push('缺少目的地邮戳');

    const datedCount = postmarks.filter(p => p.postmarkDate).length;
    if (datedCount < postmarks.length) {
      warnings.push(`${postmarks.length - datedCount} 个邮戳缺少日期`);
    }

    let durationConsistency: 'high' | 'medium' | 'low' = 'medium';
    if (routes.length > 0 && routes[0].confidence >= 70) {
      durationConsistency = 'high';
    } else if (routes.length > 0 && routes[0].confidence >= 40) {
      durationConsistency = 'medium';
    } else {
      durationConsistency = 'low';
    }

    const overallConfidence = routes.length > 0
      ? routes.reduce((sum, r) => sum + r.confidence, 0) / routes.length
      : 0;

    return {
      totalRulesConsidered: allRules.length,
      matchingRules: matchingRules.length,
      knownTransitCities: knownCities,
      restrictedAreasAvoided: 0,
      durationConsistency,
      overallConfidence: Math.round(overallConfidence),
      warnings
    };
  }

  getConfidenceLabel(confidence: number): string {
    if (confidence >= 80) return '高度可信';
    if (confidence >= 60) return '较为可信';
    if (confidence >= 40) return '参考价值';
    return '仅供参考';
  }

  getConfidenceColor(confidence: number): string {
    if (confidence >= 80) return '#2e7d32';
    if (confidence >= 60) return '#f57c00';
    if (confidence >= 40) return '#e64a19';
    return '#c62828';
  }
}
