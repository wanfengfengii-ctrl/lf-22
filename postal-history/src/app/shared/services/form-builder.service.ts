import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import {
  PostalRouteRule,
  TransitCity,
  RestrictedArea,
  TransitDuration,
  TransportType,
  RestrictionType,
  AreaType
} from '../../models/postal-knowledge.model';
import { RouteVersion, Postmark, LocationPrecision } from '../../models/letter.model';
import { DataTransformService } from './data-transform.service';

@Injectable({ providedIn: 'root' })
export class FormBuilderService {
  constructor(
    private fb: FormBuilder,
    private dataTransform: DataTransformService
  ) {}

  latitudeValidator(control: AbstractControl): ValidationErrors | null {
    if (control.value === null || control.value === '' || control.value === undefined) {
      return null;
    }
    const value = Number(control.value);
    if (isNaN(value) || value < -90 || value > 90) {
      return { invalidLatitude: true };
    }
    return null;
  }

  longitudeValidator(control: AbstractControl): ValidationErrors | null {
    if (control.value === null || control.value === '' || control.value === undefined) {
      return null;
    }
    const value = Number(control.value);
    if (isNaN(value) || value < -180 || value > 180) {
      return { invalidLongitude: true };
    }
    return null;
  }

  buildLetterForm(): FormGroup {
    return this.fb.group({
      title: ['', Validators.required],
      description: [''],
      versions: this.fb.array([]),
      officialVersionId: ['']
    });
  }

  buildVersionForm(version?: Partial<RouteVersion>): FormGroup {
    const postmarks = version?.postmarks || [];
    const postmarkFormArray = this.fb.array(
      postmarks.map((pm: any) => this.buildPostmarkForm(pm))
    );

    return this.fb.group({
      id: [version?.id || ''],
      name: [version?.name || ''],
      description: [version?.description || ''],
      isOfficial: [version?.isOfficial || false],
      postmarks: postmarkFormArray
    });
  }

  buildPostmarkForm(postmark?: Partial<Postmark>): FormGroup {
    return this.fb.group({
      id: [postmark?.id || ''],
      type: [postmark?.type || 'transit'],
      locationName: [postmark?.locationName || ''],
      latitude: [postmark?.latitude ?? null, [this.latitudeValidator.bind(this)]],
      longitude: [postmark?.longitude ?? null, [this.longitudeValidator.bind(this)]],
      postmarkDate: [postmark?.postmarkDate ? new Date(postmark.postmarkDate) : null],
      clarity: [postmark?.clarity || 'clear'],
      notes: [postmark?.notes || ''],
      sequence: [postmark?.sequence ?? 0],
      locationPrecision: [postmark?.locationPrecision || 'exact' as LocationPrecision]
    });
  }

  buildRuleForm(rule?: Partial<PostalRouteRule>): FormGroup {
    const form = this.fb.group({
      name: ['', Validators.required],
      era: ['', Validators.required],
      startYear: [null as number | null],
      endYear: [null as number | null],
      description: [''],
      origin: ['', Validators.required],
      destination: ['', Validators.required],
      transitCities: this.fb.array([]),
      typicalDurationDays: [null as number | null],
      minDurationDays: [null as number | null],
      maxDurationDays: [null as number | null],
      transportType: ['mixed' as TransportType],
      frequency: [''],
      source: [''],
      notes: ['']
    });

    if (rule) {
      form.patchValue({
        name: rule.name,
        era: rule.era,
        startYear: rule.startYear,
        endYear: rule.endYear,
        description: rule.description || '',
        origin: rule.origin,
        destination: rule.destination,
        typicalDurationDays: rule.typicalDurationDays,
        minDurationDays: rule.minDurationDays,
        maxDurationDays: rule.maxDurationDays,
        transportType: rule.transportType,
        frequency: rule.frequency || '',
        source: rule.source || '',
        notes: rule.notes || ''
      });

      const transitCitiesArray = form.get('transitCities') as FormArray;
      (rule.transitCities || []).forEach(city => {
        transitCitiesArray.push(this.fb.control(city));
      });
    }

    return form;
  }

  buildCityForm(city?: Partial<TransitCity>): FormGroup {
    const form = this.fb.group({
      name: ['', Validators.required],
      latitude: [null as number | null],
      longitude: [null as number | null],
      province: [''],
      era: ['', Validators.required],
      importance: ['secondary' as 'primary' | 'secondary' | 'tertiary'],
      role_hub: [false],
      role_port: [false],
      role_customs: [false],
      role_railway_station: [false],
      role_border: [false],
      role_relay: [false],
      description: [''],
      source: ['']
    });

    if (city) {
      const roleFlags = this.dataTransform.rolesToForm(city.roles || []);
      form.patchValue({
        name: city.name,
        latitude: city.latitude,
        longitude: city.longitude,
        province: city.province || '',
        era: city.era,
        importance: city.importance,
        description: city.description || '',
        source: city.source || '',
        ...roleFlags
      });
    }

    return form;
  }

  buildRestrictedForm(area?: Partial<RestrictedArea>): FormGroup {
    const form = this.fb.group({
      name: ['', Validators.required],
      era: ['', Validators.required],
      startYear: [null as number | null],
      endYear: [null as number | null],
      restrictionType: ['restricted' as RestrictionType],
      areaType: ['region' as AreaType],
      locationNames: this.fb.array([]),
      description: [''],
      source: ['']
    });

    if (area) {
      form.patchValue({
        name: area.name,
        era: area.era,
        startYear: area.startYear,
        endYear: area.endYear,
        restrictionType: area.restrictionType,
        areaType: area.areaType,
        description: area.description || '',
        source: area.source || ''
      });

      const locationNamesArray = form.get('locationNames') as FormArray;
      (area.locationNames || []).forEach(loc => {
        locationNamesArray.push(this.fb.control(loc));
      });
    }

    return form;
  }

  buildDurationForm(duration?: Partial<TransitDuration>): FormGroup {
    const form = this.fb.group({
      fromCity: ['', Validators.required],
      toCity: ['', Validators.required],
      era: ['', Validators.required],
      transportType: ['mixed' as TransportType],
      typicalDays: [0, Validators.required],
      minDays: [null as number | null],
      maxDays: [null as number | null],
      source: [''],
      notes: ['']
    });

    if (duration) {
      form.patchValue({
        fromCity: duration.fromCity,
        toCity: duration.toCity,
        era: duration.era,
        transportType: duration.transportType,
        typicalDays: duration.typicalDays,
        minDays: duration.minDays,
        maxDays: duration.maxDays,
        source: duration.source || '',
        notes: duration.notes || ''
      });
    }

    return form;
  }

  addChipItem(formArray: FormArray, value: string): void {
    const trimmed = (value || '').trim();
    if (trimmed) {
      formArray.push(this.fb.control(trimmed));
    }
  }

  removeChipItem(formArray: FormArray, index: number): void {
    formArray.removeAt(index);
  }

  getPostmarksArray(versionForm: FormGroup): FormArray {
    return versionForm.get('postmarks') as FormArray;
  }

  addTransitPostmark(versionForm: FormGroup): void {
    const postmarks = this.getPostmarksArray(versionForm);
    const destIndex = postmarks.controls.findIndex(c => c.get('type')?.value === 'destination');
    const insertIndex = destIndex >= 0 ? destIndex : postmarks.length;
    const sequence = insertIndex;

    const newPostmark = this.buildPostmarkForm({
      type: 'transit',
      locationName: '',
      latitude: null,
      longitude: null,
      postmarkDate: null,
      clarity: 'clear',
      notes: '',
      sequence,
      locationPrecision: 'exact'
    });

    postmarks.insert(insertIndex, newPostmark);
    this.resequencePostmarks(versionForm);
  }

  removePostmark(versionForm: FormGroup, index: number): void {
    const postmarks = this.getPostmarksArray(versionForm);
    postmarks.removeAt(index);
    this.resequencePostmarks(versionForm);
  }

  resequencePostmarks(versionForm: FormGroup): void {
    const postmarks = this.getPostmarksArray(versionForm);
    postmarks.controls.forEach((control, i) => {
      control.get('sequence')?.setValue(i);
    });
  }

  loadVersionData(versionForm: FormGroup, version: RouteVersion): void {
    const postmarksArray = this.getPostmarksArray(versionForm);
    while (postmarksArray.length > 0) {
      postmarksArray.removeAt(0);
    }

    versionForm.patchValue({
      id: version.id,
      name: version.name,
      description: version.description,
      isOfficial: version.isOfficial
    });

    (version.postmarks || []).forEach(pm => {
      postmarksArray.push(this.buildPostmarkForm(pm));
    });
  }
}
