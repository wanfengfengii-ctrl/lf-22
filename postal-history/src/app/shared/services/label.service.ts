import { Injectable } from '@angular/core';
import { TransportType, TransitRole, RestrictionType, AreaType } from '../../models/postal-knowledge.model';
import { PostmarkClarity, LocationPrecision } from '../../models/letter.model';

@Injectable({ providedIn: 'root' })
export class LabelService {
  private transportLabels: Record<TransportType, string> = {
    land: '陆路',
    water: '水路',
    rail: '铁路',
    air: '航空',
    mixed: '联运'
  };

  private transportIcons: Record<TransportType, string> = {
    land: 'directions_car',
    water: 'directions_boat',
    rail: 'train',
    air: 'flight',
    mixed: 'swap_horiz'
  };

  private roleLabels: Record<TransitRole, string> = {
    hub: '邮政枢纽',
    border: '边境',
    port: '港口',
    railway_station: '火车站',
    customs: '海关',
    relay: '驿站'
  };

  private importanceLabels: Record<string, string> = {
    primary: '主要枢纽',
    secondary: '次要城市',
    tertiary: '三级站点'
  };

  private restrictionLabels: Record<RestrictionType, string> = {
    prohibited: '禁止',
    restricted: '限制',
    suspended: '暂停'
  };

  private areaLabels: Record<AreaType, string> = {
    city: '城市',
    region: '地区',
    border: '边境',
    route: '路线'
  };

  private clarityLabels: Record<PostmarkClarity, string> = {
    clear: '清晰',
    partial: '部分清晰',
    fuzzy: '模糊'
  };

  private precisionLabels: Record<LocationPrecision, string> = {
    exact: '精确',
    approximate: '近似',
    unknown: '未知'
  };

  private changeLabels: Record<string, string> = {
    up: '地位提升',
    down: '地位下降',
    stable: '保持稳定'
  };

  private confidenceLabels: { threshold: number; label: string }[] = [
    { threshold: 80, label: '高可信度' },
    { threshold: 60, label: '中可信度' },
    { threshold: 40, label: '低可信度' }
  ];

  private confidenceColors: { threshold: number; color: string }[] = [
    { threshold: 80, color: '#4caf50' },
    { threshold: 60, color: '#ff9800' },
    { threshold: 40, color: '#ff5722' }
  ];

  getTransportLabel(type: TransportType): string {
    return this.transportLabels[type] || type;
  }

  getTransportIcon(type: TransportType): string {
    return this.transportIcons[type] || 'route';
  }

  getRoleLabel(role: TransitRole): string {
    return this.roleLabels[role] || role;
  }

  getImportanceLabel(importance?: string): string {
    return this.importanceLabels[importance || ''] || importance || '';
  }

  getRestrictionLabel(type: RestrictionType | string): string {
    return (this.restrictionLabels as Record<string, string>)[type] || type;
  }

  getAreaLabel(type: AreaType | string): string {
    return (this.areaLabels as Record<string, string>)[type] || type;
  }

  getClarityLabel(clarity: PostmarkClarity): string {
    return this.clarityLabels[clarity] || clarity;
  }

  getPrecisionLabel(precision: LocationPrecision): string {
    return this.precisionLabels[precision] || precision;
  }

  getChangeLabel(change: string): string {
    return this.changeLabels[change] || change;
  }

  getConfidenceLabel(percentage: number): string {
    for (const item of this.confidenceLabels) {
      if (percentage >= item.threshold) {
        return item.label;
      }
    }
    return '可信度极低';
  }

  getConfidenceColor(percentage: number): string {
    for (const item of this.confidenceColors) {
      if (percentage >= item.threshold) {
        return item.color;
      }
    }
    return '#f44336';
  }

  getConfidenceProgressColor(percentage: number): 'primary' | 'accent' | 'warn' {
    if (percentage >= 70) return 'primary';
    if (percentage >= 40) return 'accent';
    return 'warn';
  }

  getPostmarkTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      origin: '寄出地',
      destination: '目的地',
      transit: '中转'
    };
    return labels[type] || type;
  }
}
