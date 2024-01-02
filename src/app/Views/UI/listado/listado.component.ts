import { GetEscanerDatosUseCase } from './../../../domain/EscanerDatos/usecase/getEscanerDatos';
import { Component, Inject, OnInit } from '@angular/core';
import { DatosService } from '../inicio/Datos.Service';
import { ListasAsistenciaPostgres } from '../servicios/firebase.service';


export interface Estructura {
  Matricula: string;
  Nombre: string;
  Estado: string;
  Hora: string;
}

@Component({
  selector: 'app-listado',
  templateUrl: './listado.component.html',
  styleUrls: ['./listado.component.scss'],
})
export class ListadoComponent implements OnInit {
  mostrarLista: Estructura[] = [];
  listaAsistencia: any = [];
  nrcMateria: string = '';
  carrera: string = '';
  datosCargados: boolean = false;
  fechaCompleta: string;
  Dia!: String;
  Hora!: String;
  NombreMateria: String | any = '';

  constructor(
    private _getDatos: GetEscanerDatosUseCase,
    private datos: DatosService,
    private servicio: ListasAsistenciaPostgres,

  ) {
    this.carrera = datos.getCarrera();
    this.nrcMateria = datos.getNrc();
    
    let fecha = new Date();
    let dia = fecha.getDate();
    let mes = fecha.getMonth() + 1;
    let año = fecha.getFullYear();
    this.fechaCompleta = año + ':' + mes + ':' + dia;
  }

  async ngOnInit() {
    this.listaAsistencia= await this.servicio.ListaTiempoReal();
    this.obtenerNombreMateria();
  }
  async obtenerNombreMateria() {
    let materia = await this.servicio.Obtener_Materia_EnCurso();
this.NombreMateria=materia[0].nombre
  }
}
