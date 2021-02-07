/* tslint:disable:max-line-length */
import { Injectable } from '@angular/core';

import {AngularFirestore} from '@angular/fire/firestore';
import {LoggerService} from '../../_util/logger.service';

import {Degree, degreeConverter} from '../../_domain/Degree/Degree';
import {Course, courseConverter} from '../../_domain/Course/Course';
import {TranslateService} from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  db;

  constructor(
    private angularFireStore: AngularFirestore,
    private logger: LoggerService,
    private translateService: TranslateService) {

    this.db = angularFireStore.firestore;
  }

  hasCollection(collection: string, document?: string, subCollection?: string): Promise<boolean> {
    if (document && subCollection) {
      return this.db.collection(collection).doc(document).collection(subCollection).get().then(querySnapshot => {
        return !querySnapshot.empty;
      });
    }
    return this.db.collection(collection).get().then(querySnapshot => {
      return !querySnapshot.empty;
    });
  }

  hasDocument(collection: string, document: string, subCollection?: string, subDocument?: string): Promise<boolean> {
    const ref = subCollection && subDocument ?
      this.db.collection(collection).doc(document).collection(subCollection).doc(subDocument) :
      this.db.collection(collection).doc(document);

    return ref.get().then(doc => {
      return doc.exists;
    });
  }

  hasDegrees(academicTerm: string): Promise<boolean> {
    return this.translateService.currentLang === 'pt-PT' ?
      this.hasCollection(academicTerm.replace('/', '-') + '[PT]') :
      this.hasCollection(academicTerm.replace('/', '-') + '[EN]');
  }

  hasCourses(academicTerm: string, degreeID: number): Promise<boolean> {
    return this.translateService.currentLang === 'pt-PT' ?
      this.hasCollection(academicTerm.replace('/', '-') + '[PT]', degreeID.toString(), 'courses') :
      this.hasCollection(academicTerm.replace('/', '-') + '[EN]', degreeID.toString(), 'courses');
  }

  hasCourseInDegree(academicTerm: string, degreeID: number, courseID: number): Promise<any> {
    return this.translateService.currentLang === 'pt-PT' ?
      this.hasDocument(academicTerm.replace('/', '-') + '[PT]', degreeID.toString(), 'courses', courseID.toString()) :
      this.hasDocument(academicTerm.replace('/', '-') + '[EN]', degreeID.toString(), 'courses', courseID.toString());
  }

  // tslint:disable-next-line:max-line-length
  loadDocument(collection: string, document: string, data: any, converter: any, subCollection?: string, subDocument?: string): Promise<any> {
    if (subCollection && subDocument) {
       return this.db.collection(collection).doc(document).collection(subCollection).doc(subDocument)
         .withConverter(converter)
         .set(data);
    }
    return this.db.collection(collection).doc(document).withConverter(converter).set(data);
  }

  loadDegree(academicTerm: string, degree: Degree): Promise<any> {
    return this.translateService.currentLang === 'pt-PT' ?
      this.loadDocument(
      academicTerm.replace('/', '-') + '[PT]',
      degree.id.toString(),
      degree,
      degreeConverter)
      :
      this.loadDocument(
        academicTerm.replace('/', '-') + '[EN]',
        degree.id.toString(),
        degree,
        degreeConverter);
  }

  loadCourse(academicTerm: string, degreeID: number, course: Course): Promise<any> {
    return this.translateService.currentLang === 'pt-PT' ?
      this.loadDocument(
      academicTerm.replace('/', '-') + '[PT]',
      degreeID.toString(),
      course,
      courseConverter,
      'courses',
      course.id.toString())
      :
      this.loadDocument(
        academicTerm.replace('/', '-') + '[EN]',
        degreeID.toString(),
        course,
        courseConverter,
        'courses',
        course.id.toString());
  }

  updateCourse(academicTerm: string, degreeID: number, course: Course): Promise<any> {
    return this.translateService.currentLang === 'pt-PT' ?
      this.db.collection(academicTerm.replace('/', '-') + '[PT]').doc(degreeID.toString())
      .collection('courses').doc(course.id.toString())
      .update({
        types: course.types,
        campus: course.campus,
        shifts: course.convertShifts(),
        courseLoads: course.courseLoads,
      })
      :
      this.db.collection(academicTerm.replace('/', '-') + '[EN]').doc(degreeID.toString())
        .collection('courses').doc(course.id.toString())
        .update({
          types: course.types,
          campus: course.campus,
          shifts: course.convertShifts(),
          courseLoads: course.courseLoads,
        });
  }

  updateLastTimeUpdatedTimestamp(): void {
    this.translateService.currentLang === 'pt-PT' ?
      this.db.collection('timestamp[PT]').doc('timestamp')
        .update({updated: Date.now()}) :
      this.db.collection('timestamp[EN]').doc('timestamp')
        .update({updated: Date.now()});
  }

  getCollection(collection: string, converter: any, document?: string, subCollection?: string): Promise<any> {
    const ref = document && subCollection ?
      this.db.collection(collection).doc(document).collection(subCollection) :
      this.db.collection(collection);

    return ref.withConverter(converter)
      .get()
      .then(querySnapshot => {
        if (!querySnapshot.empty) {
          const data: {}[] = [];
          querySnapshot.forEach(doc => {
            data.push(doc.data());
          });
          return data;

        } else {
          this.logger.log('Collection is empty:', collection);
        }
      }).catch(err => this.logger.log('Error getting collection:', err));
  }

  getLastTimeUpdatedTimestamp(): Promise<number> {
    const ref = this.translateService.currentLang === 'pt-PT' ? this.db.collection('timestamp[PT]') : this.db.collection('timestamp[EN]');
    return ref.get().then(querySnapshot => {
      if (!querySnapshot.empty) {
        const data: {updated: string}[] = [];
        querySnapshot.forEach(doc => {
          data.push(doc.data());
        });
        return data[0].updated;

      } else {
        this.logger.log('Collection is empty:', 'timestamp[' + this.translateService.currentLang + ']');
      }
    }).catch(err => this.logger.log('Error getting collection:', err));
  }

  getDegrees(academicTerm: string): Promise<any> {
    return this.translateService.currentLang === 'pt-PT' ?
      this.getCollection(academicTerm.replace('/', '-') + '[PT]', degreeConverter) :
      this.getCollection(academicTerm.replace('/', '-') + '[EN]', degreeConverter);
  }

  getCourses(academicTerm: string, degreeID: number): Promise<any> {
    return this.translateService.currentLang === 'pt-PT' ?
      this.getCollection(academicTerm.replace('/', '-') + '[PT]', courseConverter, degreeID.toString(), 'courses') :
      this.getCollection(academicTerm.replace('/', '-') + '[EN]', courseConverter, degreeID.toString(), 'courses');
  }

  deleteDocument(collection: string, document: string, subCollection?: string, subDocument?: string): void {
    if (subCollection && subDocument) {
      this.db.collection(collection).doc(document).collection(subCollection).doc(subDocument)
        .delete()
        .catch(err => this.logger.log('Error deleting document:', err));
    } else {
      this.db.collection(collection).doc(document)
        .delete()
        .catch(err => this.logger.log('Error deleting document:', err));
    }
  }

  cleanDatabase(academicTerms: string[]): void {
    academicTerms.forEach(academicTerm => {
      this.hasDegrees(academicTerm).then(hasDegrees => {
        if (hasDegrees) {

          this.getDegrees(academicTerm).then(degrees => {
            if (degrees) {
              degrees.forEach(degree => {

                this.hasCourses(academicTerm, degree.id).then(hasCourses => {
                  if (hasCourses) {

                    this.getCourses(academicTerm, degree.id).then(courses => {
                      if (courses) {
                        courses.forEach(course => {
                          this.translateService.currentLang === 'pt-PT' ?
                            this.deleteDocument(academicTerm.replace('/', '-') + '[PT]', degree.id.toString(), 'courses', course.id.toString()) :
                            this.deleteDocument(academicTerm.replace('/', '-') + '[EN]', degree.id.toString(), 'courses', course.id.toString());
                        });
                      }
                      this.translateService.currentLang === 'pt-PT' ?
                        this.deleteDocument(academicTerm.replace('/', '-') + '[PT]', degree.id.toString()) :
                        this.deleteDocument(academicTerm.replace('/', '-') + '[EN]', degree.id.toString());
                    });

                  } else {
                    this.translateService.currentLang === 'pt-PT' ?
                      this.deleteDocument(academicTerm.replace('/', '-') + '[PT]', degree.id.toString()) :
                      this.deleteDocument(academicTerm.replace('/', '-') + '[EN]', degree.id.toString());
                  }
                });
              });
            }
          });

        }
      });
    });
  }
}
