import { Injectable } from '@angular/core';

import {AngularFirestore} from '@angular/fire/firestore';
import {LoggerService} from '../_util/logger.service';

import {Degree, degreeConverter} from '../_domain/Degree';
import {Course, courseConverter} from '../_domain/Course';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  db;

  constructor(private angularFireStore: AngularFirestore, private logger: LoggerService) {
    this.db = angularFireStore.firestore;
  }

  hasCollection(collection: string, document?: number, subCollection?: string): Promise<boolean> {
    if (document && subCollection) {
      return this.db.collection(collection).doc(document).collection(subCollection).get().then(querySnapshot => {
        return !querySnapshot.empty;
      });
    }
    return this.db.collection(collection).get().then(querySnapshot => {
      return !querySnapshot.empty;
    });
  }

  hasDocument(collection: string, document: number, subCollection?: string, subDocument?: number): Promise<boolean> {
    let ref;
    if (subCollection && subDocument) {
      ref = this.db.collection(collection).doc(document).collection(subCollection).doc(subDocument);
    } else {
      ref = this.db.collection(collection).doc(document);
    }
    return ref.get().then(doc => {
      return doc.exists;
    });
  }

  hasDegrees(academicTerm: string): Promise<boolean> {
    return this.hasCollection(academicTerm.replace('/', '-'));
  }

  hasCourses(academicTerm: string, degreeID: number): Promise<boolean> {
    return this.hasCollection(academicTerm.replace('/', '-'), degreeID, 'courses');
  }

  hasCourseInDegree(academicTerm: string, degreeID: number, courseID: number): Promise<any> {
    return this.hasDocument(academicTerm.replace('/', '-'), degreeID, 'courses', courseID);
  }

  // tslint:disable-next-line:max-line-length
  loadDocument(collection: string, document: number, data: any, converter: any, subCollection?: string, subDocument?: number): Promise<any> {
    if (subCollection && subDocument) {
       return this.db.collection(collection).doc(document).collection(subCollection).doc(subDocument)
         .withConverter(converter)
         .set(data);
    }
    return this.db.collection(collection).doc(document).withConverter(converter).set(data);
  }

  loadDegree(academicTerm: string, degree: Degree): Promise<any> {
    return this.loadDocument(
      academicTerm.replace('/', '-'),
      degree.id,
      degree,
      degreeConverter);
  }

  loadCourse(academicTerm: string, degreeID: number, course: Course): Promise<any> {
    return this.loadDocument(
      academicTerm.replace('/', '-'),
      degreeID,
      course,
      courseConverter,
      'courses',
      course.id);
  }

  updateCourse(academicTerm: string, degreeID: number, course: Course): Promise<any> {
    return this.db.collection(academicTerm.replace('/', '-')).doc(degreeID)
      .collection('courses').doc(course.id)
      .update({
        types: course.types,
        campus: course.campus,
        shifts: course.convertShifts(),
        courseLoads: course.courseLoads,
      });
  }

  getCollection(collection: string, converter: any, document?: number, subCollection?: string): Promise<any> {
    let ref;
    if (document && subCollection) {
      ref = this.db.collection(collection).doc(document).collection(subCollection);
    } else {
      ref = this.db.collection(collection);
    }
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

  getDegrees(academicTerm: string): Promise<any> {
    return this.getCollection(academicTerm.replace('/', '-'), degreeConverter);
  }

  getCourses(academicTerm: string, degreeID: number): Promise<any> {
    return this.getCollection(academicTerm.replace('/', '-'), courseConverter, degreeID, 'courses');
  }
}
