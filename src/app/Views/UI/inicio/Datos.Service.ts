import { Injectable } from '@angular/core';
import { FirestoreService } from '../servicios/FirestoreListas.service';

@Injectable({
  providedIn: 'root'
})
export class DatosService {
  NRC: any;
  Carrera: any;

  //declaración de variable para el almacenado en caché del navegador de los datos obtenidos
  constructor(private datos_locales: FirestoreService) {}

  //metodo para guardar temporalmente en tiempo de ejecución el nrc para obtener su lista de asistencia
  setNrc(nrc_guardar: any) {
    //almacenar el nrc recibido en nuestra variable de servicio
    this.NRC = nrc_guardar;
    //almacenar el nrc en caché para su uso de visualizar la lista de asistencia en tiempo real
    this.datos_locales.guardar_DatoLocal('NRC', nrc_guardar)
  }

  //obtener el nrc que fue almacenado temporalmente en nuestro servicio
  getNrc() {
    return this.datos_locales.obtener_DatoLocal('NRC');
  }
//metodo para guardar temporalmente en tiempo de ejecución la carrera para obtener la lista de asistencia
  setCarrera(carrera_guardar: any) {
    //almacenar la carrera recibida en nuestra variable de servicio
    this.Carrera = carrera_guardar;
    //almacenar el nrc en caché para su uso de visualizar la lista de asistencia en tiempo real
    this.datos_locales.guardar_DatoLocal('Carrera', carrera_guardar)
  }

  //obtener la carrera que fue almacenada temporalmente en nuestro servicio
  getCarrera() {
    return this.datos_locales.obtener_DatoLocal('Carrera');
  }
}
