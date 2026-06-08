import { Injectable } from '@angular/core';
import { Letter, Postmark, ValidationResult, ValidationError, ValidationWarning } from '../models/letter.model';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {
  validateLetter(letter: Letter): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const sortedPostmarks = [...letter.postmarks].sort((a, b) => a.sequence - b.sequence);

    errors.push(...this.validateDatesIncreasing(sortedPostmarks));
    errors.push(...this.validateDuplicatePostmarks(sortedPostmarks));
    errors.push(...this.validateCoordinates(sortedPostmarks));

    warnings.push(...this.checkMissingDates(sortedPostmarks));
    warnings.push(...this.checkMissingLocations(sortedPostmarks));

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  canGenerateRouteMap(letter: Letter): boolean {
    const result = this.validateLetter(letter);
    const hasDateOrderError = result.errors.some(e => e.type === 'date_order');
    const hasValidOrigin = letter.postmarks.some(p => p.type === 'origin');
    const hasValidDestination = letter.postmarks.some(p => p.type === 'destination');
    return !hasDateOrderError && hasValidOrigin && hasValidDestination;
  }

  private validateDatesIncreasing(postmarks: Postmark[]): ValidationError[] {
    const errors: ValidationError[] = [];

    for (let i = 1; i < postmarks.length; i++) {
      const prev = postmarks[i - 1];
      const curr = postmarks[i];

      if (prev.postmarkDate && curr.postmarkDate) {
        const prevDate = new Date(prev.postmarkDate);
        const currDate = new Date(curr.postmarkDate);

        if (currDate < prevDate) {
          errors.push({
            type: 'date_order',
            message: `邮戳日期倒序：第${i}个邮戳（${curr.locationName}）日期早于第${i - 1}个（${prev.locationName}）`,
            postmarkId: curr.id
          });
        } else if (currDate.getTime() === prevDate.getTime()) {
          errors.push({
            type: 'date_same',
            message: `第${i}个邮戳（${curr.locationName}）与第${i - 1}个（${prev.locationName}）日期相同`,
            postmarkId: curr.id
          });
        }
      }
    }

    return errors;
  }

  private validateDuplicatePostmarks(postmarks: Postmark[]): ValidationError[] {
    const errors: ValidationError[] = [];
    const seen = new Map<string, Postmark>();

    for (const postmark of postmarks) {
      if (postmark.type === 'transit') {
        const key = `${postmark.locationName}|${postmark.postmarkDate}`;
        if (seen.has(key)) {
          errors.push({
            type: 'duplicate_postmark',
            message: `重复的中转记录：${postmark.locationName}（${postmark.postmarkDate || '日期未知'}）`,
            postmarkId: postmark.id
          });
        } else {
          seen.set(key, postmark);
        }
      }
    }

    return errors;
  }

  private validateCoordinates(postmarks: Postmark[]): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const postmark of postmarks) {
      if (postmark.latitude !== null) {
        if (postmark.latitude < -90 || postmark.latitude > 90) {
          errors.push({
            type: 'invalid_latitude',
            message: `${postmark.locationName} 的纬度不合法（${postmark.latitude}），应在 -90 到 90 之间`,
            postmarkId: postmark.id
          });
        }
      }

      if (postmark.longitude !== null) {
        if (postmark.longitude < -180 || postmark.longitude > 180) {
          errors.push({
            type: 'invalid_longitude',
            message: `${postmark.locationName} 的经度不合法（${postmark.longitude}），应在 -180 到 180 之间`,
            postmarkId: postmark.id
          });
        }
      }
    }

    return errors;
  }

  private checkMissingDates(postmarks: Postmark[]): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    for (const postmark of postmarks) {
      if (!postmark.postmarkDate) {
        warnings.push({
          type: 'missing_date',
          message: `${postmark.locationName} 缺少邮戳日期`,
          postmarkId: postmark.id
        });
      }
    }

    return warnings;
  }

  private checkMissingLocations(postmarks: Postmark[]): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    for (const postmark of postmarks) {
      if (postmark.latitude === null || postmark.longitude === null) {
        warnings.push({
          type: 'missing_location',
          message: `${postmark.locationName} 缺少经纬度信息`,
          postmarkId: postmark.id
        });
      }
    }

    return warnings;
  }

  isValidLatitude(lat: number | null): boolean {
    return lat === null || (lat >= -90 && lat <= 90);
  }

  isValidLongitude(lng: number | null): boolean {
    return lng === null || (lng >= -180 && lng <= 180);
  }
}
