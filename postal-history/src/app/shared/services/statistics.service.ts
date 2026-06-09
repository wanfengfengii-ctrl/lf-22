import { Injectable } from '@angular/core';
import { Postmark, RouteSegment, RouteVersion } from '../../models/letter.model';

@Injectable({ providedIn: 'root' })
export class StatisticsService {
  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  calculateDistance(
    from: { latitude: number | null; longitude: number | null },
    to: { latitude: number | null; longitude: number | null }
  ): number | null {
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

  calculateDuration(fromDate: string | null, toDate: string | null): number | null {
    if (!fromDate || !toDate) return null;
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const diff = to.getTime() - from.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
  }

  getSortedPostmarks(postmarks: Postmark[]): Postmark[] {
    return [...postmarks].sort((a, b) => a.sequence - b.sequence);
  }

  getRouteSegments(postmarks: Postmark[]): RouteSegment[] {
    const sorted = this.getSortedPostmarks(postmarks);
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

  getVersionDuration(version: RouteVersion): number | null {
    const sorted = this.getSortedPostmarks(version.postmarks);
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
    const segments = this.getRouteSegments(version.postmarks);
    return segments.reduce((sum, s) => sum + (s.distanceKm || 0), 0);
  }

  calculateNodePositions(
    nodes: { name: string; connectionCount: number; importance: string }[],
    width: number = 800,
    height: number = 500,
    padding: number = 60
  ): Map<string, { x: number; y: number }> {
    const nodePositions = new Map<string, { x: number; y: number }>();
    const sortedNodes = [...nodes].sort((a, b) => b.connectionCount - a.connectionCount);

    const centerX = width / 2;
    const centerY = height / 2;

    const rings = [
      { radius: 0, count: 1 },
      { radius: 100, count: 5 },
      { radius: 180, count: 12 },
      { radius: 240, count: 20 }
    ];

    let nodeIndex = 0;

    for (const ring of rings) {
      const ringNodes = sortedNodes.slice(nodeIndex, nodeIndex + ring.count);
      nodeIndex += ring.count;

      if (ring.radius === 0) {
        if (ringNodes.length > 0) {
          nodePositions.set(ringNodes[0].name, { x: centerX, y: centerY });
        }
        continue;
      }

      ringNodes.forEach((node, i) => {
        const angle = (i / ringNodes.length) * 2 * Math.PI - Math.PI / 2;
        const x = centerX + ring.radius * Math.cos(angle);
        const y = centerY + ring.radius * Math.sin(angle);
        nodePositions.set(node.name, { x, y });
      });

      if (nodeIndex >= sortedNodes.length) break;
    }

    const remaining = sortedNodes.slice(nodeIndex);
    remaining.forEach((node, i) => {
      const angle = (i / remaining.length) * 2 * Math.PI;
      const x = centerX + 280 * Math.cos(angle);
      const y = centerY + 200 * Math.sin(angle);
      nodePositions.set(node.name, { x, y });
    });

    return nodePositions;
  }

  getNodeRadius(node: { importance: string; connectionCount: number }): number {
    const base = node.importance === 'primary' ? 20 : node.importance === 'secondary' ? 14 : 10;
    return base + Math.min(node.connectionCount * 2, 10);
  }

  getEdgeWidth(edge: { ruleCount: number }): number {
    return Math.max(1, Math.min(edge.ruleCount * 1.5, 6));
  }

  getAverageDuration(durations: number[]): number | null {
    if (durations.length === 0) return null;
    const total = durations.reduce((sum, d) => sum + d, 0);
    return Math.round(total / durations.length * 10) / 10;
  }
}
