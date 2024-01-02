import { Component, OnDestroy, OnInit } from '@angular/core';
import { DatosService } from '../inicio/Datos.Service';
import { HttpClient } from '@angular/common/http';
import { GetListaAsistenciaUseCase } from 'src/app/domain/ListaAsistencia/usecase/getLista';
import * as XLSX from 'xlsx';
import firebase from 'firebase/compat/app';
import 'firebase/firestore';
import { ListasAsistenciaPostgres } from '../servicios/firebase.service';

@Component({
  selector: 'app-listas',
  templateUrl: './listas.component.html',
  styleUrls: ['./listas.component.scss'],
})
export class Listas implements OnInit {
  [x: string]: any;
  listaAsistencia: any[] | any = [];
  nrcMateria: any;
  carrera: any;
  jsonData: any;
  archivoRecibido: File | any;
  vistaPreviaArchivo: boolean | any;
  mensajeSubir: boolean | any;
  Guardar_Datos: any[] = [];
  Dia!: String;
  Hora!: String;
  NombreMateria: String | any = '';
  matricula: string = '';
  fecha: string = '';

  public mostrarTarjeta: boolean = false; // Propiedad para controlar la visibilidad de la tarjeta
  public alumnoSeleccionado: any;
  constructor(
    private servicedatos: DatosService,
    private servicio: ListasAsistenciaPostgres
  ) {
    this.carrera = servicedatos.getCarrera();
    this.nrcMateria = servicedatos.getNrc();
  }

  async ngOnInit() {
    this.listaAsistencia = await this.servicio.consultarListaAsistencia(
      this.nrcMateria,
      //"16234",
      this.carrera
    );
    this.obtenerNombreMateria();
  }

  Imprimir() {
    this.servicio.ExportarExcel(this.nrcMateria);
  }

  eliminarInasistencia( matricula: string, fecha: string) {
    // Forma la ruta completa hacia la colección de fechas que deseas eliminar
    const db = firebase.firestore();

    const rutaInasistencia = `/ISW/Materias/${this.nrcMateria}/${matricula}/Inasistencia/${fecha}`;
    const rutaAsistencia = `/ISW/Materias/${this.nrcMateria}/${matricula}/Asistencia/${fecha}`;

    db.doc(rutaAsistencia).set({
      fecha: fecha,
    }).then(() => {
      console.log('Fecha agregada con éxito');
    }).catch(error => {
      console.error('Error al agregar la fecha:', error);
    });

    // Llama a la función de eliminación de Firestore
    db.doc(rutaInasistencia).delete().then(() => {
      console.log('Fecha eliminada con éxito');
    }).catch(error => {
      console.error('Error al eliminar la fecha:', error);
    });
  }

  isNumero(cadena: string): boolean {
    const numero = parseFloat(cadena);
    return !isNaN(numero);
  }

  eliminarAsistencia( matricula: string, fecha: string) {
    // Forma la ruta completa hacia la colección de fechas que deseas eliminar
    const db = firebase.firestore();

    const rutaInasistencia = `/ISW/Materias/${this.nrcMateria}/${matricula}/Inasistencia/${fecha}`;
    const rutaAsistencia = `/ISW/Materias/${this.nrcMateria}/${matricula}/Asistencia/${fecha}`;

    db.doc(rutaInasistencia).set({
      fecha: fecha,
    }).then(() => {
      console.log('Fecha agregada con éxito');
    }).catch(error => {
      console.error('Error al agregar la fecha:', error);
    });

    // Llama a la función de eliminación de Firestore
    db.doc(rutaAsistencia).delete().then(() => {
      console.log('Fecha eliminada con éxito');
    }).catch(error => {
      console.error('Error al eliminar la fecha:', error);
  });
  }

  async obtenerNombreMateria() {
    let materia = await this.servicio.Obtener_Materia_EnCurso();
    this.NombreMateria = materia[0].nombre;
  }

  GuardarDatosEnFirestore() {
    const db = firebase.firestore();

    let array: any = [
      [
        'S20006732',
        'Yahir Jesus Jacome Cogco',
        '2da',
        'ISW',
        'https://firebasestorage.googleapis.com/v0/b/heartmodel-caedd.appspot.com/o/foto-perfil-generica.jpg?alt=media&token=4b535835-114a-4db6-b2dc-dba46cb3b96e',
      ],
    ];

    for (let i = 0; i < array.length; i++) {
      const datos_lista: any = {
        Matricula: array[i][0],
        Nombre: array[i][1],
        Status: array[i][2],
        Carrera: array[i][3],
        URL: array[i][4],
      };

      // Crear una ruta dinámica que incluye la matrícula
      const rutaDocumento = db.collection(`ISW/Materias/98125`);

      // Darle un id al documento de lista de asistencia con el nombre de la matrícula
      const docRef = rutaDocumento.doc(datos_lista.Matricula);

      // Inicializar un lote de escritura para realizar múltiples operaciones en una transacción.
      const batch = db.batch();

      // Realizar una operación en el documento principal
      batch.set(docRef, {
        Matricula: datos_lista.Matricula,
        Nombre: datos_lista.Nombre,
        Status: datos_lista.Status,
        Carrera: datos_lista.Carrera,
        url: datos_lista.URL,
      });

      // Realizar una operación en la subcolección "Asistencia" para crearla si no existe
      const docRefAsistencia = docRef.collection('Asistencia').doc(' ');
      batch.set(docRefAsistencia, {});

      // Realizar una operación en la subcolección "Inasistencia" para crearla si no existe
      const docRefInasistencia = docRef.collection('Inasistencia').doc(' ');
      batch.set(docRefInasistencia, {});

      // Realizar todas las operaciones en el lote de escritura
      batch
        .commit()
        .then(() => {
          console.log(
            'Datos de lista de asistencia y subcolecciones creadas con éxito.'
          );
        })
        .catch((error) => {
          console.error(
            'Error al guardar los datos de lista de asistencia:',
            error
          );
        });
    }
  }

  ElegirAlumno() {
    console.log('alumno elegido');
  }

  Archivo(event: any) {
    const file = event.target.files[0];
    this.RecibirArchivo(file);
  }

  RecibirArchivo(file: File) {
    const archivo: any = new FileReader();
    archivo.onload = (e: any) => {
      const leer_Archivo: any = new Uint8Array(e.target.result);
      const acceder_Datos: any = XLSX.read(leer_Archivo, { type: 'array' });
      const acceder_HojaArchivo: any =
        acceder_Datos.Sheets[acceder_Datos.SheetNames[0]];

      console.log(acceder_HojaArchivo);

      const Matricula: any = XLSX.utils.sheet_to_json(acceder_HojaArchivo, {
        range: 'D11:D36',
        header: 1,
      });
      const Nombre: any = XLSX.utils.sheet_to_json(acceder_HojaArchivo, {
        range: 'H11:H36',
        header: 1,
      });
      const Status: any = XLSX.utils.sheet_to_json(acceder_HojaArchivo, {
        range: 'O11:O36',
        header: 1,
      });
      const Carrera: any = XLSX.utils.sheet_to_json(acceder_HojaArchivo, {
        range: 'P11:P36',
        header: 1,
      });

      for (let i = 2; i < Matricula.length; i++) {
        const datos_lista: any[] = [
          Matricula[i][0],
          Nombre[i][0],
          Status[i][0],
          Carrera[i][0],
        ];
        this.Guardar_Datos.push(datos_lista);
      }

      this.jsonData = this.Guardar_Datos;
      this.vistaPreviaArchivo = true;
    };
    archivo.readAsArrayBuffer(file);
  }

  GuardarLista() {
    const db = firebase.firestore();

    const coleccion = db.collection(`ISW/Materias/` + this.nrcMateria);
    let imagen = 'https://i.pinimg.com/originals/89/42/c6/8942c6dd11a06ad7adfff763a13a0805.jpg'

    for (let i = 0; i < this.Guardar_Datos.length; i++) {
      const datos_lista: any = {
        Matricula: this.Guardar_Datos[i][0],
        Nombre: this.Guardar_Datos[i][1],
        Status: this.Guardar_Datos[i][2],
        Carrera: this.Guardar_Datos[i][3],
        url: imagen,
      };

      const docRef = coleccion.doc(datos_lista.Matricula);

      docRef.set(datos_lista);
    }
  }

  Eliminar() {
    const db = firebase.firestore();
    const coleccion = db.collection(`ISW/Materias/` + this.nrcMateria);
    console.log(coleccion);
    coleccion.get().then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        doc.ref.delete();
      });
    });
  }

  confirmarEliminarFechaInasistencia(matricula: string, fecha: string) {
    const confirmacion = window.confirm('¿Estás seguro de que quieres eliminar la Inasistencia?');
    if (confirmacion) {
      this.eliminarInasistencia(matricula, fecha);
    }
  }

  confirmarEliminarFechaAsistencia(matricula: string, fecha: string) {
    const confirmacion = window.confirm('¿Estás seguro de que quieres eliminar la Asistencia?');
    if (confirmacion) {
      this.eliminarAsistencia(matricula, fecha);
  }
  }
}
