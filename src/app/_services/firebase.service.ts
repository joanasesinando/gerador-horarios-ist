import { Injectable } from '@angular/core';

import {AngularFirestore} from '@angular/fire/firestore';
import {LoggerService} from '../_util/logger.service';

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

  loadDocToDatabase(collection: string, document: string | number, data: any): Promise<any> {
    return this.db.collection(collection).doc(document).set(data);
  }

  getDocFromDatabase(collection: string, document: string | number): Promise<any> {
    const ref = this.db.collection(collection).doc(document);
    return ref.get()
      .then(doc => {
        if (doc.exists) {
          return doc.data();

        } else {
          this.logger.log('No such document saved:', document);
        }
      }).catch(err => this.logger.log('Error getting document:', err));
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
