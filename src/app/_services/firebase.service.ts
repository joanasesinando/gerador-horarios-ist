import { Injectable } from '@angular/core';

import {AngularFirestore} from '@angular/fire/firestore';
import {LoggerService} from '../_util/logger.service';
import {Degree} from '../_domain/Degree';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  db;

  constructor(private angularFireStore: AngularFirestore, private logger: LoggerService) {
    this.db = angularFireStore.firestore;
  }

  hasCollection(collection: string): Promise<boolean> {
    return this.db.collection(collection).get().then((querySnapshot) => {
      return !querySnapshot.empty;
    });
  }

  hasDocument(collection: string, document: string): Promise<boolean> {
    return this.db.collection(collection).doc(document).get().then(doc => {
      return doc.exists;
    });
  }

  hasDegreesForAcademicTerm(academicTerm: string): Promise<boolean> {
    return this.hasCollection(academicTerm.replace('/', '-'));
  }

  loadDocToDatabase(collection: string, document: string | number, data: any): Promise<any> {
    return this.db.collection(collection).doc(document).set(data);
  }

  loadDegreeToDatabase(academicTerm: string, degree: Degree): Promise<any> {
    return this.db.collection(academicTerm.replace('/', '-')).doc(degree.id)
      .withConverter(degree.degreeConverter)
      .set(new Degree(degree.id, degree.name, degree.acronym));
  }

  getDegreesFromDatabase(academicTerm: string): Promise<any> {
    return this.getCollectionFromDatabase(academicTerm.replace('/', '-'));
  }

  getCollectionFromDatabase(collection: string): Promise<any> {
    const ref = this.db.collection(collection);
    return ref.get()
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
}
