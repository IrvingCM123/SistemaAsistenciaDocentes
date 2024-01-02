import { Observable, of } from 'rxjs';
import { Injectable } from '@angular/core';
import { ListaAsistencia_Port } from '../../ports/ListaAsistencia/ListaAsistencia-ports';
import { ListaAsistencia_Entity } from 'src/app/domain/ListaAsistencia/models/ListaAsistencia.entity';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class ListaAsistenciaAdapter implements ListaAsistencia_Port {

  constructor(
    private firestore: AngularFirestore
  ) { }

  //metodo asincrono que recibe el nrc y carrera  de la materia deseada para la obtención de sus alumnos inscritos en ella
  async getCantidadListaAsistencia(nrc: string, carrera: string): Promise<Observable<Number>> {
    try {
      //ruta del firebase para encontrar la lista de asistencia de la materia deseada
      let apiFirestore = '/' + carrera + '/Materias/' + nrc;
      //guarda en la constante lista_encontrada la colección de las matriculas registradas en cada nrc(materia)
      const lista_encontrada = await this.firestore.collection(apiFirestore).get().toPromise();
      //si la lista encontrada no es nula sigue con el siguiente proceso
      if (lista_encontrada) {
        //guardar en un array los datos(matriculas) obbtenidos para su manipulación
        const datos_lista : any = await lista_encontrada.docs.map((alumnos) => alumnos.data());
        //guarda el tamaño del array datos_lista
        let contador = datos_lista.length;
        //los retorna
        return contador;
      } else {
        console.log('No se pudo obtener la información de Firestore.');
        let error: any = [];
        return error;
      }
    } catch (error) {
      console.error('Error al obtener la información de Firestore:', error);
      let retornar: any = [];
      return retornar;
    }
  }

    //Metodo para la obtención de las listas de asistencia requeridas por medio de NRC y carrera
  async getListaAsistenciaByNrcCarrera(nrc: string, carrera: string): Promise<Observable<ListaAsistencia_Entity>> {
    try {
      //Guarda en una variable la url del firestore donde se encuentran almacenadas las listas de asistencia
      let apiFirestore = '/' + carrera + '/Materias/' + nrc;
      //Metodo perteneciente a la biblioteca firebase para la consulta de colecciones pasando como parpametro la url requerida
      //El parametro .toPromise() obliga al metodo a retornar un valor hasta cumplirse la promesa
      const lista_encontrada = await this.firestore.collection(apiFirestore).get().toPromise();
      //Si no es nula la petición prosigue
      if (lista_encontrada) {
        //almacena en una nueva variable los datos obtenidos durante la promesa, guardando solo lo que se encuentre en su dato.data y lo retorna
        const datos_lista : any = await lista_encontrada.docs.map((alumnos) => alumnos.data());
        return datos_lista;
      } else {
        console.log('No se pudo obtener la información de Firestore.');
        let error: any = [];
        return error;
      }
    } catch (error) {
      console.error('Error al obtener la información de Firestore:', error);
      let retornar: any = [];
      return retornar;
    }
  }

}
