import { Inject, Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { FirestoreService } from './FirestoreListas.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
import * as XLSX from 'xlsx';

import { GetListaAsistenciaUseCase } from 'src/app/domain/ListaAsistencia/usecase/getLista';

//IMPORTAR EL METODO DE LA API PARA LLAMAR LA INFORMACION DE LA TABLA MATERIA_SALON
//Guardar la info en una variable
//Hacer un metodo para filtrar qué nrc de la peticion coincide con los nrc del docente
@Injectable({
  providedIn: 'root',
})
export class ListasAsistenciaPostgres {
  Edificio: string | any;
  Salon: string | any;
  Dia: string | any;
  Hora: string | any;
  api = environment.apiDocente + 'MateriaHorario';

  constructor(
    private firestore: AngularFirestore,
    private cache: FirestoreService,
    private http: HttpClient,
    private _getListaAsistenciaCasosUso: GetListaAsistenciaUseCase
  ) {
    /* let fecha = new Date();

    let diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    let diaSemana = diasSemana[fecha.getDay()];   console.log('Día de la semana:', diaSemana);

    let horaInicio: any = fecha.getHours();
    if (horaInicio % 2 == 0) {
      horaInicio = horaInicio - 1;
    }
    let hora_fin = (horaInicio + 2) + ':00' ;
    horaInicio = horaInicio + ':00';

    let horaCompleta = horaInicio + '-' + hora_fin; */

    this.Dia = 'Lunes';
    this.Hora = '09:00-11:00';
  }

  async Obtener_Materia_EnCurso() {
    let materiasDocente: any = this.cache.obtener_DatoLocal(
      'MateriasDocenteArray'
    );

    // Convertir el string a un arreglo, para poder filtrar los nrc que tienen la siguiente estructura
    materiasDocente = materiasDocente.split(',');

    // Quitar los corchetes del inicio y del final [ ]
    materiasDocente[0] = materiasDocente[0].replace('[[', '');
    materiasDocente[materiasDocente.length - 1] = materiasDocente[
      materiasDocente.length - 1
    ].replace(']]', '');

    // Convertir el arreglo a un arreglo de números
    materiasDocente = materiasDocente.map((nrc: any) => parseInt(nrc));

    // Obtener las materias dependiendo del docente
    let materias: any = await this.getMateriaSalon().toPromise();

    // Filtrar las materias que coinciden con los nrc del docente
    const materiasDelDocente = materias.filter((materia: any) =>
      materiasDocente.includes(materia.nrc)
    );

    return materiasDelDocente;
  }

  async Obtener_Lista_Asistencia_Firebase(nrc: string, carrera: string) {
    let lista_asistencia_cache =
      this.cache.obtener_DatoLocal('ListaAsistencia');

    if (lista_asistencia_cache == null) {
      console.log('No hay cache');

      let lista_asistencia_final: any = await this.consultarListaAsistencia(
        nrc,
        carrera
      );

      console.log(lista_asistencia_final, 'lista_asistencia_final');

      this.cache.guardar_ArregloLocal2(
        'ListaAsistencia',
        lista_asistencia_final
      );
      this.cache.guardar_DatoLocal('NRCListaAsistencia', nrc);

      return lista_asistencia_final;
    } else if (nrc != this.cache.obtener_DatoLocal('NRCListaAsistencia')) {
      this.cache.eliminar_DatoLocal('ListaAsistencia');
      this.cache.eliminar_DatoLocal('NRCListaAsistencia');

      let lista_asistencia_final: any = await this.consultarListaAsistencia(
        nrc,
        carrera
      );

      this.cache.guardar_ArregloLocal2(
        'ListaAsistencia',
        lista_asistencia_final
      );
      this.cache.guardar_DatoLocal('NRCListaAsistencia', nrc);

      return lista_asistencia_final;
    } else if (nrc == this.cache.obtener_DatoLocal('NRCListaAsistencia')) {
      const lista_asistencia_final = JSON.parse(lista_asistencia_cache);

      return lista_asistencia_final;
    }
  }

  async consultarListaAsistencia(nrc: string, carrera: string) {
    let Materia = await this.Obtener_Materia_EnCurso();
    let lista_asistencia: any =
      await this._getListaAsistenciaCasosUso.getListaAsistenciaByNrcCarrera(
        nrc,
        carrera
      );

    let Mapear_Asistencias_Inasistencias = lista_asistencia.map(
      async (alumno: any) => {
        let asistencias: any = await this.firestore
          .collection(
            `/ISW/Materias/${nrc}/` + alumno.Matricula + `/Asistencia`
          )
          .get()
          .toPromise();
        let inasistencias: any = await this.firestore
          .collection(
            `/ISW/Materias/${nrc}/` + alumno.Matricula + `/Inasistencia`
          )
          .get()
          .toPromise();
        let asistenciasData: { fecha: any; data: any }[] = [];
        let inasistenciasData: { fecha: any; data: any }[] = [];

        asistencias.docs.forEach((asistencia: any) => {
          asistenciasData.push({
            fecha: asistencia.id,
            data: asistencia.data(),
          });
        });

        inasistencias.docs.forEach((inasistencia: any) => {
          inasistenciasData.push({
            fecha: inasistencia.id,
            data: inasistencia.data(),
          });
        });

        const asistenciasFechas = asistenciasData.map(
          (asistencia) => asistencia.fecha
        );
        const inasistenciasFechas = inasistenciasData.map(
          (inasistencia) => inasistencia.fecha
        );
        alumno.asistencias = asistenciasFechas;
        alumno.inasistencias = inasistenciasFechas;

        alumno.cantidad_asistencias = asistenciasFechas.length;
        alumno.cantidad_inasistencias = inasistenciasFechas.length;
        let derecho = this.Calcular_Derechos_Acumulados(
          Materia[0].horasemana,
          inasistenciasFechas.length
        );
        alumno.derecho = derecho;
        return alumno;
      }
    );

    let lista_asistencia_final = await Promise.all(
      Mapear_Asistencias_Inasistencias
    );

    return lista_asistencia_final;
  }

  getMateriaSalon(): Observable<any> {
    let header = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    //Pasar en el body el dia y la hora
    return this.http.post<any>(
      this.api,
      { horario: this.Hora, dia: this.Dia },
      { headers: header }
    );
  }

  getAlumno(matricula: any): Observable<any> {
    let header = new HttpHeaders({
      'Content-Type': 'application/json',
      matricula: matricula,
    });
    return this.http.get<any>(environment.apiDocente + 'ObtenerAlumno', {
      headers: header,
    });
  }

  async ListaTiempoReal() {
    const Materia: any = await this.Obtener_Materia_EnCurso();

    const Lista_Asistencia: any = await this.consultarListaAsistencia(
      Materia[0].nrc,
      Materia[0].licenciatura
    );

    const nuevosDocumentosArray: any = [];

    //Obtener fecha actual dinamica con formato dd-mm-yy
    let fecha = new Date();
    let dia = fecha.getDate();
    let mes = fecha.getMonth() + 1;
    let año = fecha.getFullYear();

    let fecha_actual = dia + '-' + mes + '-' + año;

    const promesas = Lista_Asistencia.map(async (alumno: any) => {
      return new Promise((resolve, reject) => {
        const asistenciasRef = this.firestore.collection(
          `/ISW/Materias/${Materia[0].nrc}/${alumno.Matricula}/Asistencia`
        );
        const imagenRef = this.firestore
          .collection(`/ISW/Materias/${Materia[0].nrc}/`)
          .doc(`${alumno.Matricula}`);

        const horaref = this.firestore.doc(
          `/ISW/Materias/${Materia[0].nrc}/${alumno.Matricula}/Asistencia/${fecha_actual}`
        );

        const subscription = asistenciasRef
          .snapshotChanges()
          .subscribe((asistenciasSnapshot: any) => {
            asistenciasSnapshot.forEach(async (asistenciaChange: any) => {
              const docId = asistenciaChange.payload.doc.id;
              if (asistenciaChange.type === 'added' && docId === `${fecha_actual}`) {
                const nuevoDocumento = asistenciaChange.payload.doc.data();
                subscription.unsubscribe();
                let info: any = await imagenRef.get().toPromise();
                let hora: any = await horaref.get().toPromise();
                hora = hora.data();
                info = info.data();
                nuevoDocumento.url_imagen = info.url;
                nuevoDocumento.Nombre = info.Nombre;
                nuevoDocumento.Matricula = info.Matricula;
                nuevoDocumento.Status = info.Status;
                nuevoDocumento.Hora = hora.hora;
                nuevosDocumentosArray.push(nuevoDocumento);
                resolve(nuevoDocumento);
              }
            });
          });
      });
    });

    return nuevosDocumentosArray;
  }

  //Metodo para almacenar la asistencia de los alumnos en un archivo de excel o pdf
  async ExportarExcel(nrc: string) {
    let data: any = await this.consultarListaAsistencia(nrc, 'ISW');
    let newData: any;
    newData = data.map((alumno: any) => {
      return {
        Matricula: alumno.Matricula,
        Nombre: alumno.Nombre,
        Status: alumno.Status,
        Cantidad_Asistencias: alumno.cantidad_asistencias,
        Cantidad_Inasistencias: alumno.cantidad_inasistencias,
        Derecho: alumno.derecho,
      };
    });
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(newData);

    // Establecer el ancho de las columnas
    ws['!cols'] = [
      { wch: 15 },
      { wch: 35 },
      { wch: 12 },
      { wch: 18 },
      { wch: 20 },
      { wch: 12 },
    ];

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${nrc}.xlsx`);
  }

  Calcular_Derechos_Acumulados(horas_materias: any, inasistencias_alumno: any) {
    let semanas_semestre = 16;

    let asistencias_totales = (horas_materias * semanas_semestre) / 2;

    let inasistencias_para_excentar = asistencias_totales * 0;

    let inasistencias_para_ordinario = asistencias_totales * 0.2;

    let inasistencias_para_extraordinario = asistencias_totales * 0.3;

    let inasistencias_para_titulo = asistencias_totales * 0.4;

    let inasistencias_alumno_totales = inasistencias_alumno;

    let porcentaje_final =
      (inasistencias_alumno_totales * 100) / asistencias_totales;

    let derecho: string = ' ';

    if (porcentaje_final <= 4) {
      derecho = 'Excentar';
    } else if (porcentaje_final > 4 && porcentaje_final <= 20) {
      derecho = 'Ordinario';
    } else if (porcentaje_final > 20 && porcentaje_final <= 30) {
      derecho = 'Extraordinario';
    } else if (porcentaje_final > 30 && porcentaje_final <= 40) {
      derecho = 'Titulo';
    } else if (porcentaje_final > 40) {
      derecho = 'Reprobado';
    }

    return derecho;
  }
}
