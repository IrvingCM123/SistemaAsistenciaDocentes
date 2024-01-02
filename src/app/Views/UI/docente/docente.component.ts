import { Component, OnInit } from '@angular/core';
import { GetDocenteUseCase } from 'src/app/domain/Docentes/use_case/client/getDocente';
import { FirestoreService } from '../servicios/FirestoreListas.service';

@Component({
  selector: 'app-docente',
  templateUrl: './docente.component.html',
  styleUrls: ['./docente.component.scss'],
})
export class DocenteComponent implements OnInit {
  public Docente_ID: string = '';
  response$: any;

  constructor(
    private _getDocentesCasosUso: GetDocenteUseCase,
    private datos_Locales: FirestoreService
  ) {}

  N_Personal: string | any;
  datos: any;
  public token: string = '';

  async ngOnInit() {
    this.token = this.datos_Locales.obtener_DatoLocal('Resp');
    this.ObtenerDocente();
  }

  async ObtenerDocente() {
    if (this.datos_Locales.obtener_DatoLocal('InformacionDocente')) {
      console.log('ya existe');
      this.datos = this.datos_Locales.obtener_DatoLocal('InformacionDocente');

      var array = this.datos.split(',"');

      for (let i = 0; i < array.length; i++) {
        array[i] = array[i].replace(/\"/g, '');
      }

      //Eliminar el { del primer elemento del array y el } del último elemento del array
      array[0] = array[0].replace('{', '');
      array[array.length - 1] = array[array.length - 1].replace('}', '');

      const resultadoObjeto: any = {};

      array.forEach((dato: any) => {
        const [clave, valor] = dato.split(':');
        resultadoObjeto[clave] = valor.trim();
      });

      let conseguirImagen = array[3].split('url_imagen:');

      resultadoObjeto.url_imagen = conseguirImagen[1];

      this.datos = resultadoObjeto;
    } else {
      console.log('no existe');
      this.response$ = await this._getDocentesCasosUso.getDocenteByID(
        this.token
      );
      this.response$.subscribe((data: any) => {
        this.datos = data;

        let validar = this.datos_Locales.obtener_DatoLocal('docenteInfo');

        if (!validar) {
          this.datos_Locales.guardar_DatoLocal('docenteInfo', data.no_personal);
        }

        data = JSON.stringify(data);
        this.datos_Locales.guardar_DatoLocal('InformacionDocente', data);
      });
    }
  }
}
