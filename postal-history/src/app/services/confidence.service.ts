import { Injectable } from '@angular/core';
import { Postmark, RouteVersion, ConfidenceScore, ConfidenceBreakdown, RouteDiffNode, RouteDiffSegment, RouteDiffType } from '../models/letter.model';

@Injectable({
  providedIn: 'root'
})
export class ConfidenceService {
  private readonly WEIGHTS = {
    clarity: 25,
    dateCompleteness: 25,
    locationPrecision: 20,
    temporalOrder: 20,
    routeContinuity: 10
  };

  calculateConfidence(version: RouteVersion | Postmark[]): ConfidenceScore {
    const postmarks = Array.isArray(version) ? version : version.postmarks;
    const sorted = [...postmarks].sort((a, b) => a.sequence - b.sequence);

    const breakdown = this.calculateBreakdown(sorted);
    const total = this.sumScores(breakdown);
    const maxScore = this.sumMaxScores(breakdown);
    const percentage = maxScore > 0 ? Math.round((total / maxScore) * 100) : 0;

    return {
      total,
      maxScore,
      percentage,
      breakdown
    };
  }

  private calculateBreakdown(postmarks: Postmark[]): ConfidenceBreakdown {
    return {
      clarity: this.calculateClarityScore(postmarks),
      dateCompleteness: this.calculateDateCompletenessScore(postmarks),
      locationPrecision: this.calculateLocationPrecisionScore(postmarks),
      temporalOrder: this.calculateTemporalOrderScore(postmarks),
      routeContinuity: this.calculateRouteContinuityScore(postmarks)
    };
  }

  private calculateClarityScore(postmarks: Postmark[]): { score: number; max: number; details: string[] } {
    const details: string[] = [];
    let score = 0;
    const max = postmarks.length;

    for (const pm of postmarks) {
      switch (pm.clarity) {
        case 'clear':
          score += 1;
          break;
        case 'partial':
          score += 0.5;
          details.push(`${pm.locationName}：邮戳部分清晰`);
          break;
        case 'fuzzy':
          score += 0.2;
          details.push(`${pm.locationName}：邮戳模糊`);
          break;
      }
    }

    const weightedScore = Math.round((score / max) * this.WEIGHTS.clarity);
    const weightedMax = this.WEIGHTS.clarity;

    return { score: weightedScore, max: weightedMax, details };
  }

  private calculateDateCompletenessScore(postmarks: Postmark[]): { score: number; max: number; details: string[] } {
    const details: string[] = [];
    let completeCount = 0;

    for (const pm of postmarks) {
      if (pm.postmarkDate) {
        completeCount++;
      } else {
        details.push(`${pm.locationName}：缺少邮戳日期`);
      }
    }

    const ratio = postmarks.length > 0 ? completeCount / postmarks.length : 0;
    const score = Math.round(ratio * this.WEIGHTS.dateCompleteness);

    return {
      score,
      max: this.WEIGHTS.dateCompleteness,
      details
    };
  }

  private calculateLocationPrecisionScore(postmarks: Postmark[]): { score: number; max: number; details: string[] } {
    const details: string[] = [];
    let score = 0;

    for (const pm of postmarks) {
      const hasCoords = pm.latitude !== null && pm.longitude !== null;
      const precision = pm.locationPrecision || (hasCoords ? 'exact' : 'unknown');

      switch (precision) {
        case 'exact':
          score += 1;
          break;
        case 'approximate':
          score += 0.6;
          details.push(`${pm.locationName}：地点位置为近似值`);
          break;
        case 'unknown':
          score += 0.1;
          details.push(`${pm.locationName}：缺少精确经纬度`);
          break;
      }
    }

    const max = postmarks.length;
    const ratio = max > 0 ? score / max : 0;
    const weightedScore = Math.round(ratio * this.WEIGHTS.locationPrecision);

    return {
      score: weightedScore,
      max: this.WEIGHTS.locationPrecision,
      details
    };
  }

  private calculateTemporalOrderScore(postmarks: Postmark[]): { score: number; max: number; details: string[] } {
    const details: string[] = [];
    const max = this.WEIGHTS.temporalOrder;

    const datedPostmarks = postmarks.filter(pm => pm.postmarkDate);
    if (datedPostmarks.length < 2) {
      return {
        score: datedPostmarks.length <= 1 ? max : Math.round(max * 0.5),
        max,
        details: datedPostmarks.length < 2 ? ['日期不足，无法验证时间顺序'] : []
      };
    }

    let errors = 0;
    for (let i = 1; i < datedPostmarks.length; i++) {
      const prev = new Date(datedPostmarks[i - 1].postmarkDate!);
      const curr = new Date(datedPostmarks[i].postmarkDate!);

      if (curr < prev) {
        errors++;
        details.push(`时间倒序：${datedPostmarks[i].locationName} 早于 ${datedPostmarks[i - 1].locationName}`);
      } else if (curr.getTime() === prev.getTime()) {
        errors += 0.5;
        details.push(`日期相同：${datedPostmarks[i].locationName} 与 ${datedPostmarks[i - 1].locationName}`);
      }
    }

    const totalPairs = datedPostmarks.length - 1;
    const errorRatio = totalPairs > 0 ? errors / totalPairs : 0;
    const score = Math.round(max * (1 - errorRatio));

    return {
      score: Math.max(0, score),
      max,
      details
    };
  }

  private calculateRouteContinuityScore(postmarks: Postmark[]): { score: number; max: number; details: string[] } {
    const details: string[] = [];
    const max = this.WEIGHTS.routeContinuity;

    const hasOrigin = postmarks.some(pm => pm.type === 'origin');
    const hasDestination = postmarks.some(pm => pm.type === 'destination');

    if (!hasOrigin) details.push('缺少寄出地');
    if (!hasDestination) details.push('缺少目的地');

    const gaps = this.findGaps(postmarks);
    if (gaps.length > 0) {
      details.push(...gaps);
    }

    const baseScore = (hasOrigin && hasDestination) ? max * 0.6 : max * 0.2;
    const gapPenalty = Math.min(gaps.length * 2, max * 0.4);
    const score = Math.round(Math.max(0, baseScore - gapPenalty));

    return {
      score,
      max,
      details
    };
  }

  private findGaps(postmarks: Postmark[]): string[] {
    const gaps: string[] = [];
    const sorted = [...postmarks].sort((a, b) => a.sequence - b.sequence);

    for (let i = 0; i < sorted.length - 1; i++) {
      const curr = sorted[i];
      const next = sorted[i + 1];

      if (curr.postmarkDate && next.postmarkDate) {
        const days = Math.abs(
          (new Date(next.postmarkDate).getTime() - new Date(curr.postmarkDate).getTime())
          / (1000 * 60 * 60 * 24)
        );

        if (days > 30) {
          gaps.push(`${curr.locationName} → ${next.locationName} 间隔 ${Math.round(days)} 天，可能存在缺失节点`);
        }
      }
    }

    return gaps;
  }

  private sumScores(breakdown: ConfidenceBreakdown): number {
    return breakdown.clarity.score +
      breakdown.dateCompleteness.score +
      breakdown.locationPrecision.score +
      breakdown.temporalOrder.score +
      breakdown.routeContinuity.score;
  }

  private sumMaxScores(breakdown: ConfidenceBreakdown): number {
    return breakdown.clarity.max +
      breakdown.dateCompleteness.max +
      breakdown.locationPrecision.max +
      breakdown.temporalOrder.max +
      breakdown.routeContinuity.max;
  }

  compareRoutes(versionA: Postmark[], versionB: Postmark[]): {
    nodes: RouteDiffNode[];
    segments: RouteDiffSegment[];
    addedCount: number;
    removedCount: number;
    modifiedCount: number;
  } {
    const sortedA = [...versionA].sort((a, b) => a.sequence - b.sequence);
    const sortedB = [...versionB].sort((a, b) => a.sequence - b.sequence);

    const nodes = this.diffNodes(sortedA, sortedB);
    const segments = this.diffSegments(nodes);

    const addedCount = nodes.filter(n => n.diffType === 'added').length;
    const removedCount = nodes.filter(n => n.diffType === 'removed').length;
    const modifiedCount = nodes.filter(n => n.diffType === 'modified').length;

    return { nodes, segments, addedCount, removedCount, modifiedCount };
  }

  private diffNodes(a: Postmark[], b: Postmark[]): RouteDiffNode[] {
    const result: RouteDiffNode[] = [];

    const mapA = new Map<string, { pm: Postmark; index: number }>();
    const mapB = new Map<string, { pm: Postmark; index: number }>();

    a.forEach((pm, i) => mapA.set(pm.locationName, { pm, index: i }));
    b.forEach((pm, i) => mapB.set(pm.locationName, { pm, index: i }));

    const allLocations = new Set([...mapA.keys(), ...mapB.keys()]);

    for (const loc of allLocations) {
      const inA = mapA.get(loc);
      const inB = mapB.get(loc);

      if (inA && inB) {
        const isModified = this.isPostmarkModified(inA.pm, inB.pm);
        result.push({
          postmark: inB.pm,
          diffType: isModified ? 'modified' : 'same',
          originalIndex: inA.index,
          comparedIndex: inB.index
        });
      } else if (inB) {
        result.push({
          postmark: inB.pm,
          diffType: 'added',
          comparedIndex: inB.index
        });
      } else if (inA) {
        result.push({
          postmark: inA.pm,
          diffType: 'removed',
          originalIndex: inA.index
        });
      }
    }

    return result.sort((x, y) => {
      const seqX = x.comparedIndex ?? x.originalIndex ?? 0;
      const seqY = y.comparedIndex ?? y.originalIndex ?? 0;
      return seqX - seqY;
    });
  }

  private isPostmarkModified(a: Postmark, b: Postmark): boolean {
    if (a.postmarkDate !== b.postmarkDate) return true;
    if (a.clarity !== b.clarity) return true;
    if (a.latitude !== b.latitude || a.longitude !== b.longitude) return true;
    if (a.type !== b.type) return true;
    return false;
  }

  private diffSegments(nodes: RouteDiffNode[]): RouteDiffSegment[] {
    const segments: RouteDiffSegment[] = [];

    for (let i = 0; i < nodes.length - 1; i++) {
      const from = nodes[i];
      const to = nodes[i + 1];

      let diffType: RouteDiffType = 'same';
      if (from.diffType === 'added' || to.diffType === 'added') {
        diffType = 'added';
      } else if (from.diffType === 'removed' || to.diffType === 'removed') {
        diffType = 'removed';
      } else if (from.diffType === 'modified' || to.diffType === 'modified') {
        diffType = 'modified';
      }

      segments.push({ from, to, diffType });
    }

    return segments;
  }

  getConfidenceLabel(percentage: number): string {
    if (percentage >= 80) return '高可信度';
    if (percentage >= 60) return '中可信度';
    if (percentage >= 40) return '低可信度';
    return '可信度极低';
  }

  getConfidenceColor(percentage: number): string {
    if (percentage >= 80) return '#4caf50';
    if (percentage >= 60) return '#ff9800';
    if (percentage >= 40) return '#ff5722';
    return '#f44336';
  }
}
